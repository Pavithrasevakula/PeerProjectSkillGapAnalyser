import { Link } from "react-router-dom";
import { collection, collectionGroup, doc, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth.jsx";
import { useLive } from "../hooks";
import { lazy, Suspense, useMemo } from "react";

const DemandChart = lazy(() => import("../components/DemandChart.jsx"));
const GamificationDashboard = lazy(() => import("../components/GamificationDashboard.jsx"));

export default function Dashboard() {
  const { user, account } = useAuth();
  const uid = user.uid;
  const mine = useLive(() => query(collection(db, "projects"), where("ownerUserId", "==", uid)), [uid]).data;
  const allProjects = useLive(() => query(collection(db, "projects"), where("status", "==", "Open")), []).data;
  const overview = useLive(() => doc(db, "analytics", "teamBalanceOverview"), []).data;
  const demand = useLive(() => doc(db, "analytics", "skillDemand"), []).data;
  
  const teams = useLive(() => query(collectionGroup(db, "teamMembers"), where("profileId", "==", uid)), [uid]).data || [];
  const applications = useLive(() => query(collectionGroup(db, "applications"), where("profileId", "==", uid)), [uid]).data || [];

  const myProjects = mine?.filter((p) => p.ownerUserId === uid) || [];
  
  const sortedProjects = useMemo(() => {
    if (!allProjects) return [];
    return [...allProjects].sort((a, b) => {
      const aTime = a.deadline?.toDate?.()?.getTime() || 0;
      const bTime = b.deadline?.toDate?.()?.getTime() || 0;
      return aTime - bTime;
    }).slice(0, 3);
  }, [allProjects]);

  const pendingApps = applications.filter(a => a.status === "Pending").length;
  const acceptedApps = applications.filter(a => a.status === "Accepted").length;

  const demandData = Object.entries(demand?.demand || {}).map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count).slice(0, 8);

  const userSkills = account?.profile?.skills || [];

  return (
    <div className="page-content max-w-[1440px] px-11 py-8 mx-auto">
      {/* Welcome Banner */}
      <div className="welcome-row relative overflow-hidden min-h-[250px] px-[35px] py-[30px] bg-[#edf3ee] border border-[#e6ede6] rounded-[20px] flex items-center justify-between mb-[18px]">
        <div className="relative z-10">
          <div className="eyebrow mb-3.5">
            <span className="eyebrow-dot" />
            YOUR COLLABORATION SPACE
          </div>
          <h1 className="font-display text-[clamp(28px,3vw,37px)] leading-[1.22] tracking-[-1.7px] font-bold mt-3.5 mb-2 text-[#26372f]">
            Good teams are <em className="not-italic text-pine-mid">built</em>,<br className="hidden lg:block" /> not just found<span className="text-[#98b5a1]">.</span>
          </h1>
          <p className="text-[13px] text-[#7c8980] leading-[1.7] mb-0 max-w-md">
            Find people who bring what your project is missing.
          </p>
          <div className="welcome-actions flex gap-2.5 mt-[23px]">
            <Link to="/" className="btn btn-primary">
              Explore projects
            </Link>
            <Link to="/projects/new" className="btn btn-quiet">
              Post a project
            </Link>
          </div>
        </div>
        
        {/* Decorative Art */}
        <div className="welcome-art relative w-[330px] min-w-[280px] h-[220px] mr-[1.5%] hidden lg:block" aria-hidden="true">
          <div className="orbit absolute border border-[#cfddd2] rounded-full left-[27%] top-[1%] w-[205px] h-[205px]" />
          <div className="orbit-two absolute border border-[#d8e4d9] rounded-full left-[17%] top-[11%] w-[225px] h-[185px] rotate-[-33deg]" />
          <div className="orbit-center absolute left-[42%] top-[30%] w-[67px] h-[67px] bg-pine text-white rounded-[23px] grid place-items-center shadow-[0_8px_20px_rgba(36,76,67,.18)]">
            <svg viewBox="0 0 100 100" className="w-[39px] h-[39px]" fill="none" stroke="currentColor" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 51 40 70 80 28"/>
            </svg>
          </div>
          <div className="orbit-node absolute top-0 left-[57%] w-[43px] h-[43px] rounded-[15px] grid place-items-center text-[10px] font-extrabold shadow-[0_4px_14px_rgba(40,70,54,.06)] border border-[rgba(48,84,64,.04)] bg-[#d6e5d9] text-[#3d6551]">
            <span>DS</span>
          </div>
          <div className="orbit-node absolute top-[31%] left-[7%] w-[43px] h-[43px] rounded-[15px] grid place-items-center text-[10px] font-extrabold shadow-[0_4px_14px_rgba(40,70,54,.06)] border border-[rgba(48,84,64,.04)] bg-[#f1e4d0] text-[#8c6846]">
            <span>UX</span>
          </div>
          <div className="orbit-node absolute bottom-[8%] left-[35%] w-[43px] h-[43px] rounded-[15px] grid place-items-center text-[10px] font-extrabold shadow-[0_4px_14px_rgba(40,70,54,.06)] border border-[rgba(48,84,64,.04)] bg-[#e1eaf0] text-[#59778a]">
            <span>AI</span>
          </div>
          <div className="orbit-node absolute bottom-[18%] right-[7%] w-[43px] h-[43px] rounded-[15px] grid place-items-center text-[10px] font-extrabold shadow-[0_4px_14px_rgba(40,70,54,.06)] border border-[rgba(48,84,64,.04)] bg-white text-[#54766a]">
            <span>DEV</span>
          </div>
          <div className="art-caption absolute right-[-7px] top-[41%] text-[10px] leading-[1.7] text-[#86978b] tracking-[0.1px]">
            Different strengths.<br/><strong className="text-[#476554] text-[11px]">Shared direction.</strong>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[15px] my-[18px]">
        <article className="stat-card border border-line rounded-[15px] bg-white px-[18px] py-[17px] min-h-[125px]">
          <div className="stat-top flex items-center justify-between">
            <span className="stat-label text-[11px] text-[#7f8982] font-semibold">Open projects</span>
            <span className="stat-icon sage h-[33px] w-[33px] rounded-[11px] grid place-items-center bg-[#e5eee5] text-[#4c755a]">
              <svg viewBox="0 0 24 24" className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.7}>
                <rect x="4" y="4" width="16" height="16" rx="2"/>
                <path d="M8 9h8M8 13h5"/>
              </svg>
            </span>
          </div>
          <div className="stat-value font-display text-[29px] font-bold leading-[1.4] tracking-[-1px] mt-[3px]">
            {allProjects?.length ?? "—"}
          </div>
          <div className="stat-foot text-[10px] text-[#909991] mt-[1px]">
            Available to join
          </div>
        </article>

        <article className="stat-card border border-line rounded-[15px] bg-white px-[18px] py-[17px] min-h-[125px]">
          <div className="stat-top flex items-center justify-between">
            <span className="stat-label text-[11px] text-[#7f8982] font-semibold">My applications</span>
            <span className="stat-icon sand h-[33px] w-[33px] rounded-[11px] grid place-items-center bg-[#f6ecdf] text-[#9b7953]">
              <svg viewBox="0 0 24 24" className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.7}>
                <path d="M5 5h14v14H5zM8 9h8M8 13h6"/>
              </svg>
            </span>
          </div>
          <div className="stat-value font-display text-[29px] font-bold leading-[1.4] tracking-[-1px] mt-[3px]">
            {applications.length}
          </div>
          <div className="stat-foot text-[10px] text-[#909991] mt-[1px]">
            <span className="foot-mark text-[#6a9b7b]">{pendingApps} pending</span> review
          </div>
        </article>

        <article className="stat-card border border-line rounded-[15px] bg-white px-[18px] py-[17px] min-h-[125px]">
          <div className="stat-top flex items-center justify-between">
            <span className="stat-label text-[11px] text-[#7f8982] font-semibold">Teams I lead</span>
            <span className="stat-icon blue h-[33px] w-[33px] rounded-[11px] grid place-items-center bg-[#eaf0f2] text-[#66818d]">
              <svg viewBox="0 0 24 24" className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.7}>
                <circle cx="9" cy="8" r="3"/>
                <circle cx="17" cy="9" r="2"/>
                <path d="M3 20c.5-4 2.5-6 6-6s5.5 2 6 6M15 15c3-.2 5 1.4 6 4"/>
              </svg>
            </span>
          </div>
          <div className="stat-value font-display text-[29px] font-bold leading-[1.4] tracking-[-1px] mt-[3px]">
            {myProjects?.length ?? 0}
          </div>
          <div className="stat-foot text-[10px] text-[#909991] mt-[1px]">
            <span className="foot-mark text-[#6a9b7b]">{teams.length} new</span> applications
          </div>
        </article>
      </div>

      <Suspense fallback={<div className="panel h-[220px] animate-pulse" role="status" aria-label="Loading achievements" />}>
        <GamificationDashboard />
      </Suspense>

      {/* Dashboard Grid */}
      <div className="dashboard-grid grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Skills Panel */}
        <section className="panel skills-panel px-[22px] pt-[21px] pb-[18px] min-h-[280px]">
          <div className="panel-header flex items-center justify-between gap-2.5">
            <div>
              <div className="section-kicker text-[9px] tracking-[1.35px]">YOUR TOOLKIT</div>
              <h2 className="font-display text-base tracking-[-0.35px] mt-[5px] mb-0 text-[#2e3b33]">Skills at a glance</h2>
            </div>
            <Link to="/profile" className="text-link">
              Edit profile
            </Link>
          </div>
          
          <div className="skill-bars mt-6 flex flex-col gap-3.5 min-h-[120px]">
            {userSkills.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-[11px] text-[#89948b]">Add your skills in your profile</p>
              </div>
            ) : (
              userSkills.slice(0, 5).map((skill, idx) => {
                const skillName = typeof skill === 'string' ? skill : skill.name || skill.skillName || 'Skill';
                const skillLevel = typeof skill === 'string' ? 2 : (skill.level ?? skill.proficiencyLevel ?? 2);
                return (
                  <div key={idx} className="skill-row grid grid-cols-[minmax(80px,1fr)_minmax(70px,1.4fr)_24px] items-center gap-3">
                    <div className="skill-name text-[11px] text-[#59665d] whitespace-nowrap overflow-hidden text-ellipsis">
                      {skillName}
                    </div>
                    <div className="skill-track h-1.5 rounded-xl bg-[#eef1ec] overflow-hidden">
                      <div
                        className="skill-fill h-full rounded-xl bg-[#67927a] transition-all duration-300"
                        style={{ width: `${(Math.min(5, Math.max(1, skillLevel)) / 5) * 100}%` }}
                      />
                    </div>
                    <div className="skill-level text-[10px] text-[#89948b] text-right">
                      {skillLevel}/5
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="panel-foot border-t border-[#f0f2ef] mt-[17px] pt-[13px] flex items-center gap-2 text-[#89918a] text-[10px]">
            <span className="small-dot w-1.5 h-1.5 rounded-full bg-[#7ea58a] flex-none" />
            <span>{userSkills.length > 0 ? 'Complete your profile to help teams find you' : 'Add skills to your profile'}</span>
          </div>
        </section>

        {/* Projects Panel */}
        <section className="panel projects-panel px-[22px] pt-[21px] pb-[18px] min-h-[280px]">
          <div className="panel-header flex items-center justify-between gap-2.5">
            <div>
              <div className="section-kicker text-[9px] tracking-[1.35px]">GOOD PLACES TO START</div>
              <h2 className="font-display text-base tracking-[-0.35px] mt-[5px] mb-0 text-[#2e3b33]">Projects for you</h2>
            </div>
            <Link to="/" className="text-link">
              View all
            </Link>
          </div>
          
          <div className="mini-project-list mt-3.5">
            {sortedProjects.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-[11px] text-[#89948b]">No projects available right now</p>
              </div>
            ) : (
              sortedProjects.map((p, idx) => (
                <Link 
                  key={p.id} 
                  to={`/projects/${p.id}`}
                  className="mini-project flex gap-3 py-3 border-b border-[#f0f2ef] items-start last:border-b-0 no-underline"
                >
                  <div className={`mini-project-mark w-[37px] h-[37px] rounded-xl flex-none grid place-items-center text-[10px] font-extrabold ${
                    idx === 0 ? 'bg-[#e6eee6] text-[#4d735b]' :
                    idx === 1 ? 'bg-[#f4eadc] text-[#9a7850]' :
                    'bg-[#eaf0f2] text-[#68828a]'
                  }`}>
                    {p.title.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="mini-project-main min-w-0 flex-1">
                    <h3 className="text-xs leading-[1.4] mt-[1px] mb-[3px] font-bold text-ink">
                      {p.title}
                    </h3>
                    <p className="text-[10px] text-[#929a94] mb-0 line-clamp-2">
                      {p.description}
                    </p>
                  </div>
                  <span className="mini-project-action border-0 bg-[#f4f7f3] text-[#52775e] rounded-lg text-[10px] font-bold px-2 py-1.5 flex-none">
                    View
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Bottom Banner */}
      <section className="bottom-banner flex items-center gap-3.5 bg-pine rounded-[15px] mt-[17px] px-[22px] py-[18px] text-white">
        <div className="banner-icon h-[38px] w-[38px] grid place-items-center bg-[#3b6558] rounded-xl flex-none text-[#d8e8da]">
          <svg viewBox="0 0 24 24" className="w-[19px] h-[19px]" fill="none" stroke="currentColor" strokeWidth={1.7}>
            <path d="M12 3v18M3 12h18"/>
            <circle cx="12" cy="12" r="8"/>
          </svg>
        </div>
        <div className="flex-1">
          <strong className="text-xs font-bold block">Great teams need different kinds of thinkers.</strong>
          <p className="text-[10px] text-[#c2d3c8] mt-1 mb-0">Use the matcher to discover students who complement your team's existing skills.</p>
        </div>
        <Link to="/" className="btn btn-outline-light text-[10px] min-h-[36px] px-3 py-2 flex-none">
          Explore projects
        </Link>
      </section>

      {/* Chart Section */}
      {demandData.length > 0 && (
        <section className="panel mt-6 px-[22px] pt-[21px] pb-[18px]">
          <div className="panel-header flex items-center justify-between gap-2.5 mb-5">
            <div>
              <div className="section-kicker text-[9px] tracking-[1.35px]">TOP SKILLS</div>
              <h2 className="font-display text-base tracking-[-0.35px] mt-[5px] mb-0 text-[#2e3b33]">Most in-demand skills</h2>
            </div>
          </div>
          <Suspense fallback={<div className="h-[280px] flex items-center justify-center text-sm text-muted" role="status">Loading chart…</div>}>
            <DemandChart data={demandData} />
          </Suspense>
        </section>
      )}
    </div>
  );
}
