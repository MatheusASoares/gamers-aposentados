export interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetSeconds: number;
}

interface RateLimitRecord {
    timestamps: number[];
}

/**
 * Limitador de taxa em memória baseado no algoritmo de Sliding Window (Janela Deslizante).
 * Proteção contra ataques de força bruta (CWE-307) e DoS de CPU por Bcrypt.
 */
export class InMemoryRateLimiter {
    private records: Map<string, RateLimitRecord> = new Map();
    private lastPruneTime: number = Date.now();

    /**
     * Verifica e consome uma cota do rate limiter via janela deslizante.
     * @param key Identificador único (ex: `login:ip:127.0.0.1` ou `login:email:user@example.com`)
     * @param limit Limite máximo de requisições na janela
     * @param windowSeconds Tamanho da janela temporal em segundos
     */
    check(key: string, limit: number, windowSeconds: number): RateLimitResult {
        const now = Date.now();
        const windowMs = windowSeconds * 1000;
        const threshold = now - windowMs;

        // Prune periódico se o mapa crescer ou a cada 5 minutos
        if (now - this.lastPruneTime > 5 * 60 * 1000) {
            this.prune(now);
        }

        let record = this.records.get(key);
        if (!record) {
            record = { timestamps: [] };
            this.records.set(key, record);
        }

        // Remove timestamps anteriores à janela atual
        record.timestamps = record.timestamps.filter((ts) => ts > threshold);

        if (record.timestamps.length >= limit) {
            const oldestInWindow = record.timestamps[0];
            const resetMs = oldestInWindow + windowMs - now;
            const resetSeconds = Math.max(1, Math.ceil(resetMs / 1000));

            return {
                success: false,
                remaining: 0,
                resetSeconds,
            };
        }

        // Registra a tentativa atual
        record.timestamps.push(now);
        const remaining = limit - record.timestamps.length;
        const resetSeconds = windowSeconds;

        return {
            success: true,
            remaining,
            resetSeconds,
        };
    }

    /**
     * Remove registros completamente expirados para evitar vazamento de memória.
     */
    prune(now: number = Date.now()): void {
        this.lastPruneTime = now;
        const maxAge = 3600 * 1000; // 1 hora
        for (const [key, record] of this.records.entries()) {
            record.timestamps = record.timestamps.filter((ts) => ts > now - maxAge);
            if (record.timestamps.length === 0) {
                this.records.delete(key);
            }
        }
    }

    /**
     * Reseta um registro específico ou todo o mapa (útil em suítes de teste).
     */
    reset(key?: string): void {
        if (key) {
            this.records.delete(key);
        } else {
            this.records.clear();
        }
    }
}

/**
 * Instância singleton dedicada para autenticação e registro
 */
export const authRateLimiter = new InMemoryRateLimiter();

/**
 * Extrai o IP do cliente a partir dos cabeçalhos do Next.js de forma resiliente.
 */
export async function getClientIp(): Promise<string> {
    try {
        const { headers } = await import("next/headers");
        const headerList = await headers();
        const forwardedFor = headerList.get("x-forwarded-for");
        if (forwardedFor) {
            return forwardedFor.split(",")[0].trim();
        }
        const realIp = headerList.get("x-real-ip");
        if (realIp) {
            return realIp.trim();
        }
        const cfConnectingIp = headerList.get("cf-connecting-ip");
        if (cfConnectingIp) {
            return cfConnectingIp.trim();
        }
        return "127.0.0.1";
    } catch {
        return "127.0.0.1";
    }
}
