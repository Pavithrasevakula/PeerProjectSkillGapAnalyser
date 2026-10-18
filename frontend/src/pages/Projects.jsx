import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useLive } from "../hooks";

export default function Projects() {
  const { data: projects, error } = useLive(
    () => query(collection(db, "projects"), where("status", "==", "Open")), []);
  const skills = useLive(() => collection(db, "skills"), []).data || [];
  const roles = useLive(() => collection(db, "roles"), []).data || [];
  
  const [filters, setFilters] = useState({ domain: "", skillId: "", roleId: "", search: "" });

  const domains = useMemo(
    () => [...new Set((projects || []).map((p) => p.domainArea).filter(Boolean))].sort(),
    [projects],
  );
  
  const sortedProjects = useMemo(() => {
    if (!projects) return [];
    return [...projects].sort((a, b) => {
      const aTime = a.deadline?.toDate?.()?.getTime() || 0;
      const bTime = b.deadline?.toDate?.()?.getTime() || 0;
      return aTime - bTime;
    });
  }, [projects]);
  
  const filteredProjects = sortedProjects.filter((p) => {
    const matchesDomain = !filters.domain || p.domainArea === filters.domain;
    const matchesSkill = !filters.skillId || p.requiredSkillIds?.includes(filters.skillId);
    const matchesRole = !filters.roleId || p.requiredRoleIds?.includes(filters.roleId);
    const title = String(p.title || "").toLowerCase();
    const description = String(p.description || "").toLowerCase();
    const search = filters.search.toLowerCase();
    const matchesSearch = !search || title.includes(search) || description.includes(search);
    
    return matchesDomain && matchesSkill && matchesRole && matchesSearch;
  });

  if (error) {
    return (
      <div className="projects-page page-content w-full min-w-0 max-w-[1440px] px-4 sm:px-6 lg:px-11 py-5 sm:py-8 mx-auto">
        <div className="bg-[#fdeaea] border border-[#f9cdcd] rounded-lg px-3 py-2.5">
          <p className="text-sm text-[#b54747]">Could not load projects: {error.message}. Please refresh.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="projects-page page-content w-full min-w-0 max-w-[1440px] px-4 sm:px-6 lg:px-11 py-5 sm:py-8 mx-auto">
      {/* Page Header */}
      <div className="page-heading-row flex flex-col items-stretch sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-5 mt-[3px] mb-6 sm:mb-7">
        <div>
          <div className="eyebrow mb-2">
            <span className="eyebrow-dot" />
            FIND YOUR NEXT COLLABORATION
          </div>
          <h1 className="font-display text-[32px] leading-[1.22] tracking-[-1.7px] font-bold mt-2.5 mb-0 text-[#26372f]">
            Explore projects<span className="text-[#98b5a1]">.</span>
          </h1>
          <p className="page-intro text-[13px] text-[#5f6b64] leading-[1.7] mt-1 max-w-[560px]">
            Find a challenge where your skills can make a difference.
          </p>
        </div>
        <Link to="/projects/new" className="btn btn-primary w-full sm:w-auto sm:self-end mb-0 sm:mb-1">
          Create project
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-toolbar grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_repeat(3,minmax(140px,190px))] gap-2.5 mb-4">
        <div className="search-box flex items-center gap-2 bg-white border border-[#e0e6df] rounded-[10px] h-[43px] px-3 w-full min-w-0 sm:col-span-2 xl:col-span-1">
          <svg viewBox="0 0 24 24" className="text-[#5f6b64] w-[17px] h-[17px] flex-none" fill="none" stroke="currentColor" strokeWidth={1.7}>
            <circle cx="11" cy="11" r="7"/>
            <path d="m16 16 4 4"/>
          </svg>
          <input
            type="search"
            aria-label="Search projects"
            placeholder="Search projects, skills, or topics…"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="border-0 outline-0 bg-transparent w-full min-w-0 text-ink text-xs placeholder:text-[#5f6b64]"
          />
        </div>
        
        <select
          aria-label="Filter by domain"
          value={filters.domain}
          onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
          className="w-full min-w-0 h-[43px] px-3 pr-8 border border-[#e0e6df] rounded-[10px] bg-white text-[#657269] text-xs"
        >
          <option value="">All domains</option>
          {domains.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        
        <select
          aria-label="Filter by skill"
          value={filters.skillId}
          onChange={(e) => setFilters({ ...filters, skillId: e.target.value })}
          className="w-full min-w-0 h-[43px] px-3 pr-8 border border-[#e0e6df] rounded-[10px] bg-white text-[#657269] text-xs"
        >
          <option value="">All skills</option>
          {skills.map((s) => <option key={s.id} value={s.id}>{s.skillName}</option>)}
        </select>
        
        <select
          aria-label="Filter by role"
          value={filters.roleId}
          onChange={(e) => setFilters({ ...filters, roleId: e.target.value })}
          className="w-full min-w-0 h-[43px] px-3 pr-8 border border-[#e0e6df] rounded-[10px] bg-white text-[#657269] text-xs"
        >
          <option value="">All roles</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.roleName}</option>)}
        </select>
      </div>

      {/* Results Meta */}
      <div className="results-meta flex items-center justify-between text-xs font-bold text-[#4b5b50] mx-0.5 mb-3.5">
        <span>
          {projects === undefined ? 'Loading projects...' : `${filteredProjects.length} projects`}
        </span>
        <span className="meta-note font-normal text-[#5f6b64] hidden sm:inline">
          Every team starts with a skill gap.
        </span>
      </div>
      
      {/* Loading State */}
      {projects === undefined && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-pine border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {/* Empty State */}
      {projects && filteredProjects.length === 0 && (
        <div className="empty-state">
          <div className="empty-illustration">
            <svg viewBox="0 0 80 80" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.7}>
              <rect x="14" y="14" width="52" height="52" rx="8"/>
              <path d="M24 30h32M24 40h24"/>
            </svg>
          </div>
          <h3>No projects found</h3>
          <p>Try adjusting your filters or check back later for new opportunities</p>
        </div>
      )}
      
      {/* Projects Grid */}
      <div className="project-grid grid min-w-0 grid-cols-1 md:grid-cols-2 gap-[15px]">
        {filteredProjects.map((p) => (
          <Link
            key={p.id}
            to={`/projects/${p.id}`}
            className="project-card min-w-0 w-full px-4 sm:px-[19px] py-[19px] border border-line rounded-[15px] bg-white flex flex-col min-h-[275px] hover:border-[#cbdacf] hover:-translate-y-0.5 transition-all no-underline"
          >
            <div className="project-card-top flex items-start justify-between gap-2.5">
              <span className="project-category text-[#4a6858] bg-[#eff5ef] rounded-lg px-2 py-1 text-xs tracking-[0.3px] font-bold">
                {p.domainArea || 'General'}
              </span>
            </div>
            
            <div className="owner-label text-xs text-[#5f6b64] flex items-center gap-1.5 mt-3">
              <div className="owner-dot w-[19px] h-[19px] rounded-lg bg-[#edf0eb] grid place-items-center text-[#5f6b64] text-[8px] font-extrabold">
                {p.ownerName?.charAt(0).toUpperCase() || 'P'}
              </div>
              by {p.ownerName || 'Project Owner'}
            </div>
            
            <h3 className="font-display text-base tracking-[-0.3px] leading-[1.4] my-1.5 text-ink">
              {p.title || 'Untitled project'}
            </h3>
            
            <p className="project-description text-xs text-[#5f6b64] leading-[1.7] mb-3.5 min-h-[38px]">
              {p.description || 'No description provided.'}
            </p>
            
            <div className="tag-list flex flex-wrap gap-1.5 mb-3.5">
              {p.requiredSkills?.slice(0, 3).map((skill, idx) => (
                <span key={idx} className="skill-tag">
                  {typeof skill === 'string' ? skill : skill.skillName || skill.name}
                </span>
              ))}
              {p.requiredSkills?.length > 3 && (
                <span className="skill-tag more bg-white text-[#5f6b64] border border-[#e8ece7]">
                  +{p.requiredSkills.length - 3} more
                </span>
              )}
            </div>
            
            <div className="project-meta-row flex items-center gap-3.5 flex-wrap mt-auto border-t border-[#f0f2ef] pt-3.5 text-[#5f6b64] text-xs">
              <span className="flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.7}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {p.deadline?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || 'No deadline'}
              </span>
              
              <span className="flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.7}>
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                {p.teamSizeRequired || p.teamSize || 4} members
              </span>
            </div>
            
            <div className="project-card-bottom flex flex-col min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between gap-2.5 mt-3.5">
              <div className="fit-label text-xs text-[#5f6b64]">
                <strong className="text-[#50775d]">Good match</strong> for your skills
              </div>
              <span className="btn btn-primary text-xs px-3 py-1.5 min-h-[34px]">
                View details
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
