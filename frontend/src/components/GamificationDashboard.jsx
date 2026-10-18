import { useCallback, useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import { useAuth } from "../auth.jsx";
import { db } from "../firebase";
import { getLeaderboard, getUserAchievements } from "../api";

const ACHIEVEMENT_CATALOG = [
  ["first_project", "Project Pioneer", "Created your first project", "🚀", 50],
  ["team_builder", "Team Builder", "Formed a complete team", "👥", 100],
  ["skill_master", "Skill Master", "Added 10+ skills to your profile", "🎓", 75],
  ["perfect_match", "Perfect Match", "Achieved a 90%+ match score", "⚡", 150],
  ["collaboration_star", "Collaboration Star", "Joined 5 different teams", "⭐", 200],
  ["chat_enthusiast", "Chat Enthusiast", "Sent 100 chat messages", "💬", 50],
  ["profile_completionist", "Profile Completionist", "Completed all profile sections", "✅", 100],
  ["early_bird", "Early Bird", "Applied within 24 hours of posting", "🐦", 50],
  ["acceptance_master", "Acceptance Master", "Achieved an 80%+ acceptance rate", "🏆", 250],
  ["project_marathon", "Project Marathon", "Created 10 projects", "🔥", 300],
].map(([id, name, description, icon, points]) => ({ id, name, description, icon, points }));

function formatDate(value) {
  if (!value) return "Recently earned";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Recently earned"
    : `Earned ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

function Stat({ label, value, detail }) {
  return (
    <div className="rounded-[14px] border border-[#e5e9e4] bg-[#fbfcfa] px-4 py-3">
      <div className="text-xs font-bold uppercase tracking-[1px] text-[#5f6b64]">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold tracking-[-0.8px] text-ink">{value}</div>
      <div className="mt-0.5 text-xs text-muted">{detail}</div>
    </div>
  );
}

function AchievementCard({ achievement, earned }) {
  return (
    <article className={`rounded-[14px] border p-4 ${earned ? "border-[#d5e5d8] bg-[#f4f8f4]" : "border-line bg-white"}`}>
      <div className="flex items-start gap-3">
        <div className={`grid h-10 w-10 flex-none place-items-center rounded-xl text-xl ${earned ? "bg-[#e0ebe4]" : "bg-[#f4f6f3] grayscale"}`} aria-hidden="true">
          {achievement.icon || "★"}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-xs font-bold text-ink">{achievement.name}</h3>
          <p className="mt-1 text-xs leading-[1.5] text-muted">{achievement.description}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-xs">
        <span className={earned ? "font-bold text-[#52775e]" : "text-muted"}>
          {earned ? formatDate(achievement.earnedAt) : "Not earned yet"}
        </span>
        <span className="rounded-full bg-[#f3e8d8] px-2 py-1 font-bold text-[#7a5d2e]">{achievement.points} pts</span>
      </div>
    </article>
  );
}

async function loadGamificationFromFirestore(userId) {
  const [userSnapshot, earnedSnapshot, leaderboardSnapshot] = await Promise.all([
    getDoc(doc(db, "users", userId)),
    getDocs(query(collection(db, "users", userId, "achievements"), orderBy("earnedAt", "desc"))),
    getDocs(query(collection(db, "leaderboard"), orderBy("totalPoints", "desc"))),
  ]);

  const earned = earnedSnapshot.docs.map((achievementDoc) => {
    const value = achievementDoc.data();
    const earnedAt = value.earnedAt?.toDate?.()?.toISOString?.() || value.earnedAt || null;
    return { id: achievementDoc.id, ...value, earnedAt };
  });
  const earnedIds = new Set(earned.map((achievement) => achievement.id));
  const available = ACHIEVEMENT_CATALOG.filter((achievement) => !earnedIds.has(achievement.id));
  const leaderboard = leaderboardSnapshot.docs.map((entryDoc, index) => ({
    rank: index + 1,
    ...entryDoc.data(),
  }));
  const userRank = leaderboard.find((entry) => entry.userId === userId) || null;
  const userData = userSnapshot.exists() ? userSnapshot.data() : {};

  return {
    earned,
    available,
    totalPoints: userData.totalPoints || 0,
    achievementCount: earned.length,
    leaderboard: leaderboard.slice(0, 5),
    userRank,
  };
}

export default function GamificationDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ achievements: null, leaderboard: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadGamification = useCallback(async (isRefresh = false) => {
    // The first load starts in the loading state, so only refreshes need to reset state.
    if (isRefresh) {
      setRefreshing(true);
      setError("");
    }

    let nextAchievements = null;
    let nextLeaderboard = null;

    try {
      const firestoreData = await loadGamificationFromFirestore(user.uid);
      nextAchievements = firestoreData;
      nextLeaderboard = {
        leaderboard: firestoreData.leaderboard,
        userRank: firestoreData.userRank,
      };
    } catch {
      // Use the callable endpoints when direct reads are unavailable, such as
      // deployments with stricter client rules or a different data boundary.
      const [achievementsResult, leaderboardResult] = await Promise.allSettled([
        getUserAchievements({}),
        getLeaderboard({ limit: 5 }),
      ]);
      nextAchievements = achievementsResult.status === "fulfilled" ? achievementsResult.value : null;
      nextLeaderboard = leaderboardResult.status === "fulfilled" ? leaderboardResult.value : null;
      if (achievementsResult.status === "rejected") console.error("Achievement load failed:", achievementsResult.reason);
      if (leaderboardResult.status === "rejected") console.error("Leaderboard load failed:", leaderboardResult.reason);
    }

    setData({ achievements: nextAchievements, leaderboard: nextLeaderboard });

    if (!nextAchievements && !nextLeaderboard) {
      setError("Progress and leaderboard data are temporarily unavailable.");
    } else if (!nextAchievements || !nextLeaderboard) {
      setError("Some progress data could not be loaded. You can retry.");
    }

    setLoading(false);
    setRefreshing(false);
  }, [user.uid]);

  useEffect(() => {
    // Start the initial fetch asynchronously; results are applied via setState when they arrive.
    Promise.resolve().then(() => loadGamification());
  }, [loadGamification]);

  if (loading) {
    return (
      <section className="panel animate-pulse px-[22px] py-[21px]" aria-label="Loading your achievements" role="status">
        <div className="h-3 w-28 rounded bg-[#e8eee8]" />
        <div className="mt-3 h-6 w-52 rounded bg-[#e8eee8]" />
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="h-24 rounded-[14px] bg-[#f0f4ef]" />
          <div className="h-24 rounded-[14px] bg-[#f0f4ef]" />
          <div className="h-24 rounded-[14px] bg-[#f0f4ef]" />
        </div>
      </section>
    );
  }

  const achievements = data.achievements;
  const leaderboard = data.leaderboard;
  const earned = achievements?.earned || [];
  const available = achievements?.available || [];
  const topAchievements = [...earned, ...available].slice(0, 4);
  const userRank = leaderboard?.userRank;

  return (
    <section className="panel px-[22px] py-[21px]" aria-labelledby="gamification-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="section-kicker text-xs tracking-[1.35px]">YOUR PROGRESS</div>
          <h2 id="gamification-title" className="mt-[5px] font-display text-base tracking-[-0.35px] text-[#2e3b33]">Achievements & impact</h2>
          <p className="mt-1 text-xs leading-[1.6] text-muted">Milestones celebrate meaningful collaboration, not just activity.</p>
        </div>
        <button type="button" onClick={() => loadGamification(true)} disabled={refreshing} className="text-link" aria-label="Refresh achievements and leaderboard">
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#f2d4cf] bg-[#fff5f3] px-3 py-2.5 text-xs text-danger" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => loadGamification(true)} className="font-bold underline">Try again</button>
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Total points" value={achievements?.totalPoints ?? "—"} detail="Earned through collaboration" />
        <Stat label="Achievements" value={achievements?.achievementCount ?? "—"} detail={`${available.length} still available`} />
        <Stat label="Leaderboard" value={userRank?.rank ? `#${userRank.rank}` : "—"} detail={userRank ? `${userRank.totalPoints || 0} points ranked` : "Keep contributing to rank"} />
      </div>

      {topAchievements.length > 0 ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {topAchievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} earned={earned.some((item) => item.id === achievement.id)} />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-[14px] border border-dashed border-[#dce4dc] px-4 py-6 text-center text-xs text-muted">
          Complete your profile, join a team, or create a project to start earning achievements.
        </div>
      )}

      {leaderboard?.leaderboard?.length > 0 && (
        <div className="mt-5 border-t border-[#f0f2ef] pt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-xs font-bold text-ink">Top collaborators</h3>
            <span className="text-xs text-muted">Updated from team activity</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {leaderboard.leaderboard.map((entry) => (
              <div key={entry.userId || entry.rank} className={`rounded-[10px] border px-3 py-2.5 ${entry.userId === userRank?.userId ? "border-[#b8d3be] bg-[#f1f7f1]" : "border-line bg-white"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-muted">#{entry.rank}</span>
                  <span className="text-xs font-bold text-[#7a5d2e]">{entry.totalPoints || 0} pts</span>
                </div>
                <div className="mt-1 truncate text-xs font-bold text-ink">{entry.userName || "TeamSync member"}</div>
                <div className="mt-0.5 text-xs text-muted">{entry.achievementCount || 0} achievements</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
