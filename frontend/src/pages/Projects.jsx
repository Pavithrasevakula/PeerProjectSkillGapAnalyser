import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { collection, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useLive } from "../hooks";

export default function Projects() {
  // Simplified query without composite index requirement
  const { data: projects, error } = useLive(
    () => query(collection(db, "projects"), where("status", "==", "Open")), []);
  const skills = useLive(() => collection(db, "skills"), []).data || [];
  const roles = useLive(() => collection(db, "roles"), []).data || [];
  
  // Debug logging
  if (projects && projects.length > 0) {
    console.log('=== PROJECTS PAGE DEBUG ===');
    console.log('First project:', projects[0]);
    console.log('First project requiredSkills:', projects[0]?.requiredSkills);
    console.log('First project requiredRoles:', projects[0]?.requiredRoles);
    console.log('==========================');
  }
  const [f, setF] = useState({ domain: "", skillId: "", roleId: "" });

  const domains = useMemo(() => [...new Set((projects || []).map((p) => p.domainArea))].sort(), [projects]);
  
  // Sort by deadline client-side
  const sortedProjects = useMemo(() => {
    if (!projects) return [];
    return [...projects].sort((a, b) => {
      const aTime = a.deadline?.toDate?.()?.getTime() || 0;
      const bTime = b.deadline?.toDate?.()?.getTime() || 0;
      return aTime - bTime;
    });
  }, [projects]);
  
  const shown = sortedProjects.filter((p) =>
    (!f.domain || p.domainArea === f.domain) &&
    (!f.skillId || p.requiredSkillIds?.includes(f.skillId)) &&
    (!f.roleId || p.requiredRoleIds?.includes(f.roleId)));

  if (error) return <p className="error">Could not load projects: {error.message}. Please refresh.</p>;
  
  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Browse Projects</h1>
          <p className="muted">Find and join open projects that match your skills</p>
        </div>
        <div className="page-header-actions">
          <Link to="/projects/new" className="btn-primary">Create Project</Link>
        </div>
      </div>
      
      <div className="filters-card">
        <select value={f.domain} onChange={(e) => setF({ ...f, domain: e.target.value })}>
          <option value="">All domains</option>
          {domains.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select value={f.skillId} onChange={(e) => setF({ ...f, skillId: e.target.value })}>
          <option value="">All skills</option>
          {skills.map((s) => <option key={s.id} value={s.id}>{s.skillName}</option>)}
        </select>
        <select value={f.roleId} onChange={(e) => setF({ ...f, roleId: e.target.value })}>
          <option value="">All roles</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.roleName}</option>)}
        </select>
      </div>
      
      {projects === undefined && <div className="loading-state">Loading projects...</div>}
      {projects && !shown.length && <div className="empty-state">
        <p>No projects found</p>
        <p className="muted">Try adjusting your filters or check back later</p>
      </div>}
      
      <div className="projects-grid">
        {shown.map((p) => (
          <Link key={p.id} to={`/projects/${p.id}`} className="project-card">
            <div className="project-card-header">
              <h3 className="project-card-title">{p.title}</h3>
              <span className={`badge ${p.status.toLowerCase()}`}>{p.status}</span>
            </div>
            
            <p className="project-card-owner">
              by <strong>{p.ownerName || 'Project Owner'}</strong>
            </p>
            
            <p className="project-card-description">
              {p.description}
            </p>
            
            <div className="project-card-meta">
              <span className="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                {p.deadline?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className="meta-divider">•</span>
              <span className="meta-item">{p.domainArea}</span>
            </div>
            
            <div className="project-card-stats">
              <div className="stat">
                <span className="stat-label">Team</span>
                <span className="stat-value">{p.team?.teamSize ?? 0}/{p.teamSizeRequired}</span>
              </div>
              {p.team?.teamBalanceIndex != null && (
                <div className="stat">
                  <span className="stat-label">Balance</span>
                  <span className="stat-value accent">{Math.round(p.team.teamBalanceIndex)}%</span>
                </div>
              )}
            </div>
            
            {p.requiredSkills && p.requiredSkills.length > 0 && (
              <div className="project-card-tags">
                {p.requiredSkills.slice(0, 3).map((s, idx) => (
                  <span key={idx} className="tag">{s.skillName}</span>
                ))}
                {p.requiredSkills.length > 3 && (
                  <span className="tag tag-more">+{p.requiredSkills.length - 3}</span>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
