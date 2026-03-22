import React, { useEffect, useState } from "react";
import { ACHIEVEMENTS, LEVELS, getLevel, getNextLevel, getXPProgress } from "@/lib/gamification";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface GamificationHudProps {
  xp: number;
  streak: number;
  achievements: string[];
  newAchievements: string[];
  onClearNew: () => void;
}

export function GamificationHud({ xp, streak, achievements, newAchievements, onClearNew }: GamificationHudProps) {
  const [showPanel, setShowPanel] = useState(false);
  const [toastAchievement, setToastAchievement] = useState<typeof ACHIEVEMENTS[0] | null>(null);
  const level = getLevel(xp);
  const next = getNextLevel(xp);
  const progress = getXPProgress(xp);

  useEffect(() => {
    if (newAchievements.length > 0) {
      const a = ACHIEVEMENTS.find(x => x.id === newAchievements[0]);
      if (a) {
        setToastAchievement(a);
        setTimeout(() => { setToastAchievement(null); onClearNew(); }, 4000);
      }
    }
  }, [newAchievements]);

  return (
    <>
      <button
        onClick={() => setShowPanel(true)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-xs font-semibold"
        title="Your progress"
      >
        <span>{level.emoji}</span>
        <span className={cn("hidden sm:inline", level.color)}>{level.name}</span>
        {streak > 0 && (
          <span className="flex items-center gap-0.5 text-orange-500">
            🔥<span>{streak}</span>
          </span>
        )}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden hidden sm:block">
          <div className="h-full bg-black rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </button>

      {showPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-black text-white p-6 text-center">
              <div className="text-4xl mb-2">{level.emoji}</div>
              <h2 className="text-xl font-bold">{level.name}</h2>
              <p className="text-gray-400 text-sm mt-1">{xp} XP total</p>
              {next && (
                <>
                  <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{next.minXP - xp} XP to {next.emoji} {next.name}</p>
                </>
              )}
              {streak > 0 && (
                <div className="mt-3 text-orange-400 font-semibold">🔥 {streak}-day streak!</div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-3">Achievements</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {ACHIEVEMENTS.map(a => {
                  const done = achievements.includes(a.id);
                  return (
                    <div key={a.id} className={cn("flex items-center gap-3 p-2.5 rounded-xl", done ? "bg-gray-50" : "opacity-40 grayscale")}>
                      <span className="text-2xl">{a.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{a.title}</p>
                        <p className="text-xs text-gray-500">{a.desc}</p>
                      </div>
                      {done && <span className="text-xs text-green-500 font-medium shrink-0">+{a.xp} XP</span>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="p-4 pt-0">
              <button onClick={() => setShowPanel(false)} className="w-full py-2.5 bg-black text-white rounded-xl font-semibold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {toastAchievement && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in">
          <div className="bg-black text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[280px]">
            <span className="text-3xl">{toastAchievement.icon}</span>
            <div>
              <p className="text-xs text-gray-400 font-medium">Achievement Unlocked!</p>
              <p className="font-bold">{toastAchievement.title}</p>
              <p className="text-xs text-gray-400">{toastAchievement.desc} • +{toastAchievement.xp} XP</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
