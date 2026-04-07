"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export interface PremiumState {
  credits: number;
  plan: "free" | "pro" | "business";
  totalProcessed: number;
  hdDownloads: number;
  dailyProcessed: number;
  dailyResetDate: string;
}

interface PremiumContextType {
  state: PremiumState;
  isPro: boolean;
  canProcess: boolean;
  canDownloadHD: boolean;
  canBatch: boolean;
  canTouchUp: boolean;
  useCredit: () => boolean;
  useHDCredit: () => boolean;
  upgradePrompt: string | null;
  showUpgrade: (feature: string) => void;
  dismissUpgrade: () => void;
  setPlan: (plan: PremiumState["plan"]) => void;
  addCredits: (count: number) => void;
}

const DEFAULT_STATE: PremiumState = {
  credits: 5, // 5 free credits to start
  plan: "free",
  totalProcessed: 0,
  hdDownloads: 0,
  dailyProcessed: 0,
  dailyResetDate: new Date().toDateString(),
};

const FREE_DAILY_LIMIT = 10;
const FREE_HD_LIMIT = 0; // No free HD downloads
const PRO_DAILY_LIMIT = 999;

const PremiumContext = createContext<PremiumContextType>({
  state: DEFAULT_STATE,
  isPro: false,
  canProcess: true,
  canDownloadHD: false,
  canBatch: false,
  canTouchUp: false,
  useCredit: () => true,
  useHDCredit: () => false,
  upgradePrompt: null,
  showUpgrade: () => {},
  dismissUpgrade: () => {},
  setPlan: () => {},
  addCredits: () => {},
});

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PremiumState>(DEFAULT_STATE);
  const [upgradePrompt, setUpgradePrompt] = useState<string | null>(null);

  // Load state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("bgr-premium");
      if (stored) {
        const parsed = JSON.parse(stored) as PremiumState;
        // Reset daily count if new day
        if (parsed.dailyResetDate !== new Date().toDateString()) {
          parsed.dailyProcessed = 0;
          parsed.dailyResetDate = new Date().toDateString();
        }
        setState(parsed);
      }
    } catch { /* use defaults */ }
  }, []);

  // Persist state
  useEffect(() => {
    localStorage.setItem("bgr-premium", JSON.stringify(state));
  }, [state]);

  const isPro = state.plan === "pro" || state.plan === "business";

  const dailyLimit = isPro ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT;
  const canProcess = state.dailyProcessed < dailyLimit;
  const canDownloadHD = isPro || state.credits > 0;
  const canBatch = isPro;
  const canTouchUp = isPro;

  const useCredit = useCallback(() => {
    if (state.dailyProcessed >= dailyLimit) return false;
    setState((prev) => ({
      ...prev,
      dailyProcessed: prev.dailyProcessed + 1,
      totalProcessed: prev.totalProcessed + 1,
    }));
    return true;
  }, [state.dailyProcessed, dailyLimit]);

  const useHDCredit = useCallback(() => {
    if (isPro) return true;
    if (state.credits <= 0) return false;
    setState((prev) => ({
      ...prev,
      credits: prev.credits - 1,
      hdDownloads: prev.hdDownloads + 1,
    }));
    return true;
  }, [isPro, state.credits]);

  const showUpgrade = useCallback((feature: string) => {
    setUpgradePrompt(feature);
  }, []);

  const dismissUpgrade = useCallback(() => {
    setUpgradePrompt(null);
  }, []);

  const setPlan = useCallback((plan: PremiumState["plan"]) => {
    setState((prev) => ({ ...prev, plan }));
  }, []);

  const addCredits = useCallback((count: number) => {
    setState((prev) => ({ ...prev, credits: prev.credits + count }));
  }, []);

  return (
    <PremiumContext.Provider
      value={{
        state,
        isPro,
        canProcess,
        canDownloadHD,
        canBatch,
        canTouchUp,
        useCredit,
        useHDCredit,
        upgradePrompt,
        showUpgrade,
        dismissUpgrade,
        setPlan,
        addCredits,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  return useContext(PremiumContext);
}
