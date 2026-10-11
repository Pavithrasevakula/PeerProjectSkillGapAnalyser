import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { collection, deleteDoc, doc, limit, orderBy, query, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth.jsx";
import { useLive } from "../hooks";
import {
  acceptApplication, applyToProject, errorMessage, generateRecommendations, previewCandidateImpact, rejectApplication,
} from "../api";
import SkillRadar from "../components/SkillRadar.jsx";
import TbiCard from "../components/TbiCard.jsx";

export default function ProjectDetail() {
  const { id } = useParams();
  const { user, account } = useAuth();
  const uid = user.uid;

  const { data: project, error: projectError } = useLive(() => doc(db, "projects", id), [id]);
  const gap = useLive(() => doc(db, "projects", id, "team", "skillGap"), [id]).data;
  const history = useLive(() => query(collection(db, "projects", id, "tbiHistory"), orderBy("computedAt", "desc"), limit(10)), [id]).data;
  const members = useLive(() => collection(db, "projects", id, "teamMembers"), [id]).data || [];
  const myApp = useLive(() => doc(db, "projects", id, "applications", uid), [id, uid]).data;

  // Check if user is the actual owner
  const isTechnicalOwner = project?.ownerUserId === uid;
  
  // Check if project shows user's name as owner
  const isDisplayOwner = project?.ownerName && account?.fullName && project.ownerName === account.fullName;
  
  // User can edit/close only if it's their actual project AND it shows their name
  const isOwner = isTechnicalOwner && isDisplayOwner;
  
  // Owner-only listeners (security rules deny them to everyone else).
  const apps = useLive(() => (isOwner
    ? query(collection(db, "projects", id, "applications"), where("status", "==", "Pending"), orderBy("matchScore", "desc"))
    : null), [id, isOwner]).data || [];
  const recs = useLive(() => (isOwner
    ? query(collection(db, "projects", id, "recommendations"), orderBy("recommendationScore", "desc"), limit(20))
    : null), [id, isOwner]).data || [];

  const [roleId, setRoleId] = useState("");
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState({ text: "", error: false });

  const recById = useMemo(() => Object.fromEntries(recs.map((r) => [r.id, r])), [recs]);
  const roleName = (rid) => project?.requiredRoles?.find((r) => r.roleId === rid)?.roleName || rid;
  const radarRows = useMemo(() => Object.values(gap?.skills || {}).map((s) => (
    { skill: s.skillName, required: s.requiredLevel, covered: s.coveredLevel })), [gap]);

  if (projectError) return <p className="error">Could not load project: {projectError.message}</p>;
  if (project === undefined) return <p className="muted">Loading...</p>;
  if (project === null) return <p>Project not found. <Link to="/">Back to projects</Link></p>;

  const isMember = members.some((m) => m.id === uid);
  // Can apply to projects showing other people's names (demo projects)
  const canApply = !isDisplayOwner && !isMember && project.status === "Open" && (!myApp || myApp.status === "Withdrawn");

  async function run(key, fn, ok) {
    setBusy(key);
    setMsg({ text: "", error: false });
    try { 
      await fn(); 
      if (ok) setMsg({ text: ok, error: false }); 
    }
    catch (err) { 
      // Handle CORS/network errors with a user-friendly message
      let errorMsg = errorMessage(err);
      if (err.message?.includes('CORS') || err.message?.includes('Failed to fetch') || err.code === 'functions/internal') {
        errorMsg = "This feature requires backend configuration. The Cloud Function is not accessible from localhost. It will work when deployed to production.";
      }
      setMsg({ text: errorMsg, error: true }); 
    }
    finally { setBusy(""); }
  }

  const showPreview = (candidateId, name, appliedRoleId) =>
    run(`prev-${candidateId}`, async () => setPreview({ name, ...(await previewCandidateImpact({ projectId: id, candidateUserId: candidateId, roleId: appliedRoleId })) }));

  const previewRows = preview?.skills.map((s) => ({ skill: s.skillName, required: s.requiredLevel, covered: s.coveredLevel, projected: s.projectedLevel }));

  return (
    <div className="stack">
      <div className="card">
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <h1 style={{ margin: 0 }}>{project.title}</h1>
              <span className="badge">{project.status}</span>
            </div>
            <p className="muted" style={{ marginBottom: '0.5rem' }}>
              <strong>Project Owner:</strong> {project.ownerName || 'Project Owner'} {isDisplayOwner && '(You)'}
            </p>
            <p className="muted">
              <strong>Domain:</strong> {project.domainArea} • <strong>Deadline:</strong> {project.deadline?.toDate().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {isOwner && (
            <div className="row">
              <Link to={`/projects/${id}/edit`}><button>Edit</button></Link>
              <button onClick={() => run("status", () => updateDoc(doc(db, "projects", id), { status: project.status === "Closed" ? "Open" : "Closed" }))}>
                {project.status === "Closed" ? "Reopen" : "Close project"}
              </button>
            </div>
          )}
        </div>
        
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--line)' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>About this project</h3>
          <p style={{ lineHeight: '1.6', marginBottom: '1.5rem' }}>{project.description}</p>
          
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <p className="muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Team Size</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent)' }}>
                {project.team?.teamSize ?? 0}/{project.teamSizeRequired}
              </p>
            </div>
            <div>
              <p className="muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Status</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>{project.team?.formationStatus || "Forming"}</p>
            </div>
            {project.team?.teamBalanceIndex != null && (
              <div>
                <p className="muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Team Balance</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent)' }}>
                  {Math.round(project.team.teamBalanceIndex)}%
                </p>
              </div>
            )}
          </div>
          
          <div>
            <h4 style={{ marginBottom: '0.5rem' }}>Required Roles</h4>
            <div className="chips-inline" style={{ marginBottom: '1rem' }}>
              {project.requiredRoles?.map((r) => (
                <span key={r.roleId} style={{ padding: '0.5rem 1rem', background: 'var(--accent-light)', color: 'var(--accent-dark)', borderRadius: '6px', fontSize: '0.9375rem', fontWeight: 500 }}>
                  {r.roleName} × {r.slots}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <h4 style={{ marginBottom: '0.5rem' }}>Required Skills</h4>
            <div className="chips-inline">
              {project.requiredSkills?.map((s) => (
                <span key={s.skillId} style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '0.875rem' }}>
                  {s.skillName} (L{s.minProficiency}) - {s.priority}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {msg.text && !msg.text.includes('backend configuration') && (
          <p className={msg.error ? "error" : "ok"} style={{ marginTop: '1rem' }}>{msg.text}</p>
        )}
      </div>

      {canApply && (
        <div className="card row">
          <strong>Apply for a role:</strong>
          <select value={roleId} onChange={(e) => setRoleId(e.target.value)}>
            <option value="">Select role...</option>
            {project.requiredRoles.map((r) => <option key={r.roleId} value={r.roleId}>{r.roleName}</option>)}
          </select>
          <button disabled={!roleId || busy === "apply"}
            onClick={() => run("apply", () => applyToProject({ projectId: id, roleId }), "Application submitted.")}>Apply</button>
        </div>
      )}
      {myApp && myApp.status !== "Withdrawn" && !isMember && (
        <div className="card row between">
          <span>Your application ({roleName(myApp.appliedRoleId)}): <strong>{myApp.status}</strong> - match {Math.round(myApp.matchScore)}</span>
          {myApp.status === "Pending" && (
            <button onClick={() => run("withdraw", () => deleteDoc(doc(db, "projects", id, "applications", uid)), "Application withdrawn.")}>Withdraw</button>
          )}
        </div>
      )}

      <div className="grid two">
        <section className="card"><h2>Skill-gap radar</h2><SkillRadar rows={radarRows} /></section>
        <section className="card"><h2>Team Balance Index</h2><TbiCard history={history} /></section>
      </div>

      <section className="card">
        <h2>Team</h2>
        {!members.length && <p className="muted">No members yet.</p>}
        <ul className="plain">{members.map((m) => (
          <li key={m.id}>{m.memberName} - {roleName(m.assignedRoleId)}{m.isTeamLead && " (lead)"}</li>))}</ul>
      </section>

      {isOwner && (
        <>
          <section className="card">
            <div className="row between">
              <h2>Review queue (ranked by marginal gain)</h2>
              <button disabled={busy === "regen"}
                onClick={() => run("regen", () => generateRecommendations({ projectId: id, includePool: true }), "Recommendations refreshed.")}>
                {busy === "regen" ? "Ranking..." : "Find more candidates"}
              </button>
            </div>
            {msg.error && msg.text.includes('backend configuration') && (
              <div style={{ 
                padding: '1rem', 
                background: '#E8F4FD', 
                border: '1px solid #0066CC', 
                borderRadius: '8px', 
                marginTop: '1rem',
                marginBottom: '1rem'
              }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text)', lineHeight: '1.5' }}>
                  <strong style={{ color: '#0066CC' }}>ℹ️ Development Mode Notice</strong><br/>
                  The "Find more candidates" feature requires Cloud Functions to be deployed. 
                  This is expected in local development. All other features work perfectly!
                </p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  To enable this feature: Deploy functions with <code style={{ padding: '0.125rem 0.25rem', background: 'white', borderRadius: '3px' }}>firebase deploy --only functions</code>
                </p>
              </div>
            )}
            {msg.error && !msg.text.includes('backend configuration') && msg.text && (
              <p className="error" style={{ marginTop: '1rem' }}>{msg.text}</p>
            )}
            {!apps.length && <p className="muted">No pending applications.</p>}
            {apps.map((a) => (
              <div key={a.id} className="item">
                <div className="row between">
                  <strong>{a.applicantName} <span className="muted">for {roleName(a.appliedRoleId)}</span></strong>
                  <span className="score">{Math.round(a.matchScore)}</span>
                </div>
                <p className="muted">{recById[a.id]?.explanationText || "Scoring..."}</p>
                <div className="row">
                  <button onClick={() => showPreview(a.id, a.applicantName, a.appliedRoleId)} disabled={busy === `prev-${a.id}`}>Preview impact</button>
                  <button onClick={() => run(`acc-${a.id}`, () => acceptApplication({ projectId: id, applicationId: a.id }), `${a.applicantName} accepted.`)}>Accept</button>
                  <button className="danger" onClick={() => run(`rej-${a.id}`, () => rejectApplication({ projectId: id, applicationId: a.id }))}>Reject</button>
                </div>
              </div>
            ))}
          </section>

          {preview && (
            <section className="card">
              <div className="row between"><h2>If {preview.name} joins</h2><button className="link" onClick={() => setPreview(null)}>Close</button></div>
              <p>Coverage {preview.coverageBefore}% to <strong>{preview.coverageAfter}%</strong> - TBI {Math.round(preview.tbiBefore.overallScore)} to <strong>{Math.round(preview.tbiAfter.overallScore)}</strong></p>
              <p className="muted">{preview.explanation}</p>
              <SkillRadar rows={previewRows} showProjected />
            </section>
          )}

          <section className="card">
            <h2>Other recommended candidates</h2>
            {!recs.filter((r) => !r.isApplicant).length && <p className="muted">Use "Find more candidates" to rank students who have not applied.</p>}
            {recs.filter((r) => !r.isApplicant).map((r) => (
              <div key={r.id} className="item">
                <div className="row between"><strong>{r.candidateName}</strong><span className="score">{Math.round(r.recommendationScore)}</span></div>
                <p className="muted">{r.explanationText}</p>
                <button onClick={() => showPreview(r.id, r.candidateName)}>Preview impact</button>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
