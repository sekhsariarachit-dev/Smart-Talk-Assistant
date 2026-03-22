import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "chatai_gamification";

export const LEVELS = [
  { name: "Beginner", minXP: 0, emoji: "🌱", color: "text-gray-500" },
  { name: "Student", minXP: 100, emoji: "📚", color: "text-blue-500" },
  { name: "Pro", minXP: 300, emoji: "⚡", color: "text-purple-500" },
  { name: "Expert", minXP: 600, emoji: "🧠", color: "text-orange-500" },
  { name: "Genius", minXP: 1000, emoji: "🏆", color: "text-yellow-500" },
];

export const ACHIEVEMENTS = [
  { id: "first_message", title: "First Chat!", desc: "Sent your first message", xp: 50, icon: "🚀" },
  { id: "messages_10", title: "Chatting Pro", desc: "Sent 10 messages", xp: 100, icon: "💬" },
  { id: "messages_50", title: "Power User", desc: "Sent 50 messages", xp: 200, icon: "💪" },
  { id: "messages_100", title: "AI Expert", desc: "Sent 100 messages", xp: 500, icon: "🏆" },
  { id: "first_file", title: "File Master", desc: "Uploaded your first file", xp: 75, icon: "📎" },
  { id: "first_voice", title: "Voice Star", desc: "Used voice input", xp: 50, icon: "🎤" },
  { id: "streak_3", title: "3-Day Streak!", desc: "Used the app 3 days in a row", xp: 150, icon: "🔥" },
  { id: "streak_7", title: "Week Warrior", desc: "7 days in a row!", xp: 300, icon: "⚡" },
  { id: "used_reel", title: "Reel Creator", desc: "Generated your first Reel script", xp: 75, icon: "🎬" },
  { id: "used_explain", title: "Smart Learner", desc: "Used Explain Level feature", xp: 50, icon: "📖" },
  { id: "used_mini_app", title: "App Explorer", desc: "Used a Mini App", xp: 75, icon: "🧩" },
];

interface GamificationState {
  xp: number;
  totalMessages: number;
  streak: number;
  lastUsedDate: string;
  achievements: string[];
  newAchievements: string[];
}

const defaultState: GamificationState = {
  xp: 0,
  totalMessages: 0,
  streak: 0,
  lastUsedDate: "",
  achievements: [],
  newAchievements: [],
};

function loadState(): GamificationState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...defaultState, ...JSON.parse(saved) };
  } catch {}
  return { ...defaultState };
}

function saveState(state: GamificationState) {
  const toSave = { ...state, newAchievements: [] };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

export function getLevel(xp: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getNextLevel(xp: number) {
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp < LEVELS[i].minXP) return LEVELS[i];
  }
  return null;
}

export function getXPProgress(xp: number) {
  const level = getLevel(xp);
  const next = getNextLevel(xp);
  if (!next) return 100;
  const range = next.minXP - level.minXP;
  const progress = xp - level.minXP;
  return Math.round((progress / range) * 100);
}

export function useGamification() {
  const [state, setState] = useState<GamificationState>(defaultState);

  useEffect(() => {
    const loaded = loadState();
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    let streak = loaded.streak;
    if (loaded.lastUsedDate === yesterday) streak++;
    else if (loaded.lastUsedDate !== today) streak = loaded.lastUsedDate ? 0 : 1;
    const updated = { ...loaded, streak, lastUsedDate: today };
    setState(updated);
    saveState(updated);
  }, []);

  const addXP = useCallback((points: number, triggerIds: string[] = []) => {
    setState(prev => {
      const newXP = prev.xp + points;
      const newMessages = triggerIds.includes("message") ? prev.totalMessages + 1 : prev.totalMessages;
      const earned: string[] = [];
      const already = new Set(prev.achievements);

      ACHIEVEMENTS.forEach(a => {
        if (already.has(a.id)) return;
        if (a.id === "first_message" && newMessages >= 1) earned.push(a.id);
        if (a.id === "messages_10" && newMessages >= 10) earned.push(a.id);
        if (a.id === "messages_50" && newMessages >= 50) earned.push(a.id);
        if (a.id === "messages_100" && newMessages >= 100) earned.push(a.id);
        if (a.id === "streak_3" && prev.streak >= 3) earned.push(a.id);
        if (a.id === "streak_7" && prev.streak >= 7) earned.push(a.id);
        if (triggerIds.includes(a.id)) earned.push(a.id);
      });

      const bonusXP = earned.reduce((sum, id) => {
        const a = ACHIEVEMENTS.find(x => x.id === id);
        return sum + (a?.xp || 0);
      }, 0);

      const next: GamificationState = {
        ...prev,
        xp: newXP + bonusXP,
        totalMessages: newMessages,
        achievements: [...prev.achievements, ...earned],
        newAchievements: earned,
      };
      saveState(next);
      return next;
    });
  }, []);

  const clearNewAchievements = useCallback(() => {
    setState(prev => ({ ...prev, newAchievements: [] }));
  }, []);

  return { state, addXP, clearNewAchievements };
}
