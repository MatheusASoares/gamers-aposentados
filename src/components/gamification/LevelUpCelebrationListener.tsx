"use client";

import React, { useState, useEffect } from "react";
import { LevelUpCelebrationModal } from "./LevelUpCelebrationModal";

interface LevelUpCelebrationListenerProps {
  userLevel?: number;
  userId?: string;
  userTheme?: string;
}

export function LevelUpCelebrationListener({
  userLevel,
  userId,
  userTheme,
}: LevelUpCelebrationListenerProps) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    newLevel: number;
    oldLevel: number;
  }>({
    isOpen: false,
    newLevel: userLevel || 1,
    oldLevel: Math.max(1, (userLevel || 2) - 1),
  });

  // Check progression on level prop updates
  useEffect(() => {
    if (!userId || !userLevel) return;

    try {
      const storageKey = `ga_last_level_${userId}`;
      const stored = localStorage.getItem(storageKey);

      if (stored === null) {
        // Initial setup for existing users so we don't spam them on first visit
        localStorage.setItem(storageKey, String(userLevel));
      } else {
        const lastLevel = parseInt(stored, 10);
        if (!isNaN(lastLevel) && userLevel > lastLevel) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setModalState({
            isOpen: true,
            newLevel: userLevel,
            oldLevel: lastLevel,
          });
        }
      }
    } catch {
      // Ignore localStorage restrictions
    }
  }, [userId, userLevel]);

  // Expose global test trigger
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleCustomTrigger = (e: Event) => {
      const customEvent = e as CustomEvent<{ newLevel?: number; oldLevel?: number }>;
      const targetNew = customEvent.detail?.newLevel || (userLevel ? userLevel + 1 : 5);
      const targetOld = customEvent.detail?.oldLevel || Math.max(1, targetNew - 1);
      setModalState({
        isOpen: true,
        newLevel: targetNew,
        oldLevel: targetOld,
      });
    };

    window.addEventListener("ga:trigger-level-up", handleCustomTrigger);

    (window as unknown as { triggerLevelUpTest?: (level?: number) => void }).triggerLevelUpTest = (
      customLevel?: number
    ) => {
      const target = customLevel || (userLevel ? userLevel + 1 : 7);
      setModalState({
        isOpen: true,
        newLevel: target,
        oldLevel: Math.max(1, target - 1),
      });
    };

    return () => {
      window.removeEventListener("ga:trigger-level-up", handleCustomTrigger);
    };
  }, [userLevel]);

  const handleClose = () => {
    if (userId && userLevel) {
      try {
        localStorage.setItem(`ga_last_level_${userId}`, String(userLevel));
      } catch {
        // Ignore localStorage error
      }
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <LevelUpCelebrationModal
      isOpen={modalState.isOpen}
      onClose={handleClose}
      newLevel={modalState.newLevel}
      oldLevel={modalState.oldLevel}
      userTheme={userTheme}
    />
  );
}
