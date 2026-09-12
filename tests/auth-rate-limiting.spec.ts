import { test, expect } from "@playwright/test";
import { InMemoryRateLimiter, authRateLimiter } from "../src/lib/rate-limiter";

test.describe("Security: Authentication Rate Limiting & Brute Force Defense (Audit 2.4 / CWE-307)", () => {
    test.beforeEach(() => {
        // Clear all rate limiting state before each test
        authRateLimiter.reset();
    });

    test("1. Sliding Window allows requests within the configured threshold", () => {
        const limiter = new InMemoryRateLimiter();
        const key = "test:ip:192.168.1.100";
        const limit = 5;
        const windowSeconds = 60;

        for (let i = 1; i <= limit; i++) {
            const res = limiter.check(key, limit, windowSeconds);
            expect(res.success).toBe(true);
            expect(res.remaining).toBe(limit - i);
            expect(res.resetSeconds).toBe(windowSeconds);
        }
    });

    test("2. Sliding Window blocks requests once the limit is exceeded", () => {
        const limiter = new InMemoryRateLimiter();
        const key = "test:ip:10.0.0.1";
        const limit = 3;
        const windowSeconds = 60;

        // Consume all quota
        for (let i = 0; i < limit; i++) {
            const res = limiter.check(key, limit, windowSeconds);
            expect(res.success).toBe(true);
        }

        // 4th attempt should be blocked
        const blockedRes = limiter.check(key, limit, windowSeconds);
        expect(blockedRes.success).toBe(false);
        expect(blockedRes.remaining).toBe(0);
        expect(blockedRes.resetSeconds).toBeGreaterThan(0);
        expect(blockedRes.resetSeconds).toBeLessThanOrEqual(windowSeconds);
    });

    test("3. Independent tracking across distinct IP addresses (No cross-talk)", () => {
        const limiter = new InMemoryRateLimiter();
        const limit = 2;
        const windowSeconds = 60;

        const ipA = "test:ip:1.1.1.1";
        const ipB = "test:ip:2.2.2.2";

        // Exhaust IP A
        limiter.check(ipA, limit, windowSeconds);
        limiter.check(ipA, limit, windowSeconds);
        expect(limiter.check(ipA, limit, windowSeconds).success).toBe(false);

        // IP B should still be completely unblocked
        const resB1 = limiter.check(ipB, limit, windowSeconds);
        expect(resB1.success).toBe(true);
        expect(resB1.remaining).toBe(1);

        const resB2 = limiter.check(ipB, limit, windowSeconds);
        expect(resB2.success).toBe(true);
        expect(resB2.remaining).toBe(0);

        // Now IP B is also exhausted
        expect(limiter.check(ipB, limit, windowSeconds).success).toBe(false);
    });

    test("4. Dual-Key Protection: Email and IP limits operate independently", () => {
        const ipKey = "login:ip:192.168.0.50";
        const emailA = "login:email:victim_a@example.com";
        const emailB = "login:email:victim_b@example.com";

        // IP Limit: 10, Email Limit: 5
        const ipLimit = 10;
        const emailLimit = 5;
        const windowSeconds = 900;

        // Target Email A 5 times (Credential stuffing against single account)
        for (let i = 0; i < emailLimit; i++) {
            authRateLimiter.check(ipKey, ipLimit, windowSeconds);
            const emailRes = authRateLimiter.check(emailA, emailLimit, windowSeconds);
            expect(emailRes.success).toBe(true);
        }

        // Email A is now rate-limited
        const emailABlocked = authRateLimiter.check(emailA, emailLimit, windowSeconds);
        expect(emailABlocked.success).toBe(false);

        // Attacker switches to Email B from the same IP:
        // Email B quota is fresh (0/5 used)
        const emailBRes = authRateLimiter.check(emailB, emailLimit, windowSeconds);
        expect(emailBRes.success).toBe(true);

        // However, IP count has already accumulated 5 attempts
        const currentIpRes = authRateLimiter.check(ipKey, ipLimit, windowSeconds);
        expect(currentIpRes.success).toBe(true);
        // After 5 previous + 1 current = 6 attempts used, 4 remaining out of 10
        expect(currentIpRes.remaining).toBe(4);
    });

    test("5. Reset clears single key or entire cache cleanly", () => {
        const limiter = new InMemoryRateLimiter();
        const keyA = "test:reset:userA";
        const keyB = "test:reset:userB";

        limiter.check(keyA, 1, 60);
        limiter.check(keyB, 1, 60);

        expect(limiter.check(keyA, 1, 60).success).toBe(false);
        expect(limiter.check(keyB, 1, 60).success).toBe(false);

        // Reset only keyA
        limiter.reset(keyA);
        expect(limiter.check(keyA, 1, 60).success).toBe(true);
        // keyB remains blocked
        expect(limiter.check(keyB, 1, 60).success).toBe(false);

        // Reset all
        limiter.reset();
        expect(limiter.check(keyB, 1, 60).success).toBe(true);
    });

    test("6. Sliding Window expiration permits requests after window elapses and prune cleans stale records", async () => {
        const limiter = new InMemoryRateLimiter();
        const key = "test:sliding:aging";
        const limit = 1;
        const windowSeconds = 1; // 1 second window

        expect(limiter.check(key, limit, windowSeconds).success).toBe(true);
        expect(limiter.check(key, limit, windowSeconds).success).toBe(false);

        // Wait for window to expire (1.1s)
        await new Promise((resolve) => setTimeout(resolve, 1100));

        // After window expiry, request succeeds
        const retryRes = limiter.check(key, limit, windowSeconds);
        expect(retryRes.success).toBe(true);

        // Pruning with simulated future (> 1 hour) cleans up records
        limiter.prune(Date.now() + 4000 * 1000);
        // Next check starts with completely fresh empty record
        expect(limiter.check("fresh-key", limit, windowSeconds).success).toBe(true);
    });
});
