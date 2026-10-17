import { useMemo, useState, lazy, Suspense } from "react";
import { Link, useParams } from "react-router-dom";
import { collection, deleteDoc, doc, limit, orderBy, query, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth.jsx";
import { useLive } from "../hooks";
import {
  acceptApplication, applyToProject, errorMessage, generateRecommendations, previewCandidateImpact, rejectApplication,
} from "../api";
const SkillRadar = lazy(() => import("../components/SkillRadar.jsx"));
const TbiCard = lazy(() => import("../components/TbiCard.jsx"));
import TeamChat from "../components/TeamChat.jsx";
import VideoPreview from "../components/VideoPreview.jsx";
import TeamOverlapVisualizer from "../components/TeamOverlapVisualizer.jsx";

function ChartFallback() {
  return <div className="h-[180px] flex items-center justify-center text-sm text-muted" role="status">Loading analysis…</div>;
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const uid = user.uid;

  const { data: project, error: projectError } = useLive(() => doc(db, "projects", id), [id]);
  const gap = useLive(() => doc(db, "projects", id, "team", "skillGap"), [id]).data;
  const history = useLive(() => query(collection(db, "projects", id, "tbiHistory"), orderBy("computedAt", "desc"), limit(10)), [id]).data;
  const members = useLive(() => collection(db, "projects", id, "teamMembers"), [id]).data || [];
  const myApp = useLive(() => doc(db, "projects", id, "applications", uid), [id, uid]).data;

  const isTechnicalOwner = project?.ownerUserId === uid;
  const isOwner = isTechnicalOwner;
  
  const apps = useLive(() => (isOwner
    ? query(collection(db, "projects", id, "applications"), where("status", "==", "Pending"), orderBy("matchScore", "desc"))
    : null), [id, isOwner]).data || [];
  const recs = useLive(() => (isOwner
    ? query(collection(db, "projects", id, "recommendations"), orderBy("recommendationScore", "desc"), limit(20))
    : null), [id, isOwner]).data || [];

  const [roleId, setRoleId] = useState("");
  const [preview, setPreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState({ text: "", error: false });

  const recById = useMemo(() => Object.fromEntries(recs.map((r) => [r.id, r])), [recs]);
  const roleName = (rid) => project?.requiredRoles?.find((r) => r.roleId === rid)?.roleName || rid;
  const radarRows = useMemo(() => Object.values(gap?.skills || {}).map((s) => (
    { skill: s.skillName, required: s.requiredLevel, covered: s.coveredLevel })), [gap]);

  if (projectError) {
    return (
      <div className="page-content max-w-[1440px] px-11 py-8 mx-auto">
        <div className="bg-[#fdeaea] border border-[#f9cdcd] text-[#b54747] px-5 py-4 rounded-[15px] flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium">Could not load project</p>
            <p className="text-sm mt-1">{projectError.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (project === undefined) {
    return (
      <div className="page-content max-w-[1440px] px-11 py-8 mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-pine border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="page-content max-w-[1440px] px-11 py-8 mx-auto">
        <div className="empty-state">
          <div className="empty-illustration">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3>Project not found</h3>
          <p>This project may have been deleted or you don't have access to it.</p>
          <Link to="/" className="btn btn-primary mt-4">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const isMember = members.some((m) => m.id === uid);
  const canApply = !isTechnicalOwner && !isMember && project.status === "Open" && (!myApp || myApp.status === "Withdrawn");

  async function run(key, fn, ok) {
    setBusy(key);
    setMsg({ text: "", error: false });
    try { 
      await fn(); 
      if (ok) setMsg({ text: ok, error: false }); 
    } catch (err) {
      let errorMsg = errorMessage(err);
      if (err.message?.includes('CORS') || err.message?.includes('Failed to fetch') || err.code === 'functions/internal') {
        errorMsg = "This feature requires backend configuration. The Cloud Function is not accessible from localhost. It will work when deployed to production.";
      }
      setMsg({ text: errorMsg, error: true });
    } finally {
      setBusy("");
    }
  }

  const showPreview = (candidateId, name, appliedRoleId) =>
    run(`prev-${candidateId}`, async () => setPreview({ name, ...(await previewCandidateImpact({ projectId: id, candidateUserId: candidateId, roleId: appliedRoleId })) }));

  const withdrawApplication = () => {
    const confirmed = window.confirm("Withdraw this application? You can apply again later while the project remains open.");
    if (!confirmed) return;
    run(
      "withdraw",
      () => deleteDoc(doc(db, "projects", id, "applications", uid)),
      "Application withdrawn. You can apply again while the project remains open.",
    );
  };

  const previewRows = preview?.skills?.map((s) => ({ skill: s.skillName, required: s.requiredLevel, covered: s.coveredLevel, projected: s.projectedLevel }));

  return (
    <div className="page-content max-w-[1440px] px-11 py-8 mx-auto space-y-6">
      {/* Project Header Card */}
      <div className="panel px-[22px] py-[21px]">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="font-display text-[32px] leading-[1.22] tracking-[-1.7px] font-bold text-[#26372f]">
                {project.title}
              </h1>
              <span className={`status-pill ${
                project.status === 'Open' ? 'status-accepted' : 
                project.status === 'Closed' ? 'bg-[#f4f6f3] text-[#617065]' : 'status-pending'
              }`}>{project.status}</span>
            </div>
            <div className="flex items-center gap-2 text-[#808b82] text-sm mb-4">
              <div className="owner-dot w-6 h-6 rounded-lg bg-[#edf0eb] grid place-items-center text-[#6d8172] text-[9px] font-extrabold">
                {project.ownerName?.charAt(0).toUpperCase() || 'P'}
              </div>
              <span>Created by <span className="font-medium text-ink">{project.ownerName}</span></span>
            </div>
          </div>
          
          {isOwner && (
            <div className="flex gap-2 flex-shrink-0">
              <Link to={`/projects/${id}/edit`} className="btn btn-quiet">
                Edit
              </Link>
              <button
                onClick={() => run("close", () => updateDoc(doc(db, "projects", id), { status: "Closed" }), "Project closed")}
                disabled={busy === "close"}
                className="btn-danger"
              >
                {busy === "close" ? "Closing..." : "Close Project"}
              </button>
            </div>
          )}
        </div>

        <p className="text-neutral-700 leading-relaxed mb-6">{project.description}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-neutral-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Domain
            </div>
            <div className="font-semibold text-neutral-800">{project.domainArea}</div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Team Size
            </div>
            <div className="font-semibold text-neutral-800">{members.length} / {project.teamSizeRequired}</div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Deadline
            </div>
            <div className="font-semibold text-neutral-800">{project.deadline?.toDate().toLocaleDateString()}</div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Created
            </div>
            <div className="font-semibold text-neutral-800">{project.createdAt?.toDate().toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {msg.text && (
        <div className={`px-5 py-4 rounded-lg border flex items-start gap-3 ${msg.error ? 'bg-error-50 text-error-700 border-error-200' : 'bg-success-50 text-success-700 border-success-200'}`}>
          {msg.error ? (
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className="font-medium">{msg.text}</span>
        </div>
      )}

      {canApply && (
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-sage-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-800">Apply to Join This Team</h2>
              <p className="text-sm text-neutral-500">Select a role that matches your skills and interests</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[250px]">
              <label className="block text-sm font-medium text-neutral-700 mb-2">Select Role</label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="input"
              >
                <option value="">Choose a role you'd like to fill</option>
                {project.requiredRoles?.map(r => (
                  <option key={r.roleId} value={r.roleId}>{r.roleName} ({r.slots} {r.slots > 1 ? 'positions' : 'position'} available)</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => run("apply", () => applyToProject({ projectId: id, roleId }), "Application submitted")}
              disabled={!roleId || busy === "apply"}
              className="btn-accent flex-shrink-0"
            >
              {busy === "apply" ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </div>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </div>
      )}

      {myApp && myApp.status !== "Withdrawn" && (
        <div className="card p-6 border-l-4 border-primary-500">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-800">Your Application</h2>
              <p className="text-sm text-neutral-500">Current status of your application</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-3 border-t border-neutral-100 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-neutral-700">
                Applied for <span className="font-semibold text-neutral-800">{roleName(myApp.appliedRoleId || myApp.roleId)}</span>
              </p>
              <p className="text-sm text-neutral-500 mt-1 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Match Score: {myApp.matchScore}%
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <span className={`badge ${
                myApp.status === 'Accepted' ? 'badge-success' :
                myApp.status === 'Rejected' ? 'badge-gray' :
                'badge-primary'
              }`}>{myApp.status}</span>
              {myApp.status === 'Pending' && (
                <button
                  type="button"
                  onClick={withdrawApplication}
                  disabled={busy === "withdraw"}
                  className="btn btn-quiet text-danger"
                >
                  {busy === "withdraw" ? "Withdrawing…" : "Withdraw application"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Required Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {project.requiredSkills?.map((s, i) => (
                <div key={i} className="inline-flex items-center gap-2 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg border border-primary-100">
                  <span className="font-medium text-sm">{s.skillName}</span>
                  <span className="text-xs text-primary-600 bg-primary-100 px-2 py-0.5 rounded">L{s.minProficiency}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${s.priority === 'Must-have' ? 'bg-error-100 text-error-700' : 'bg-neutral-100 text-neutral-600'}`}>
                    {s.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-sage-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Required Roles
            </h3>
            <div className="flex flex-wrap gap-2">
              {project.requiredRoles?.map((r, i) => (
                <div key={i} className="inline-flex items-center gap-2 px-3 py-2 bg-sage-50 text-sage-800 rounded-lg border border-sage-100">
                  <span className="font-medium text-sm">{r.roleName}</span>
                  <span className="text-xs text-sage-700 bg-sage-100 px-2 py-0.5 rounded">
                    {r.slots} {r.slots > 1 ? 'positions' : 'position'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {radarRows.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Skill Coverage Analysis
              </h3>
              <Suspense fallback={<ChartFallback />}><SkillRadar rows={radarRows} /></Suspense>
            </div>
          )}

          {history?.length > 0 && (
            <Suspense fallback={<ChartFallback />}>
              <TbiCard history={history} />
            </Suspense>
          )}

          {(isOwner || isMember) && <TeamOverlapVisualizer projectId={id} />}

          {members.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-sage-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Team Members ({members.length})
              </h3>
              <div className="space-y-3">
                {members.map(m => (
                  <div key={m.id} className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-neutral-800">{m.memberName || m.fullName || 'Team member'}</div>
                          <div className="text-sm text-neutral-500">{m.role || 'Member'}</div>
                        </div>
                      </div>
                      {m.matchScore && (
                        <span className="badge-primary">{m.matchScore}% match</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isOwner && apps.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-5 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Pending Applications
                <span className="badge-primary ml-1">{apps.length}</span>
              </h3>
              <div className="space-y-3">
                {apps.map(a => (
                  <div key={a.id} className="p-5 border border-neutral-200 rounded-lg bg-neutral-50">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-neutral-800">{a.applicantName}</div>
                          <div className="text-sm text-neutral-600 mt-1">Applied for {roleName(a.roleId)}</div>
                          <div className="text-sm text-neutral-500 mt-1 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Match Score: {a.matchScore}%
                          </div>
                        </div>
                      </div>
                      {a.videoIntroUrl && (
                        <button
                          onClick={() => setVideoPreview({ url: a.videoIntroUrl, name: a.applicantName })}
                          className="btn-ghost text-sm flex-shrink-0"
                        >
                          Video
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => run(`acc-${a.id}`, () => acceptApplication({ projectId: id, applicationId: a.id }), "Application accepted")}
                        disabled={busy === `acc-${a.id}`}
                        className="btn-accent text-sm"
                      >
                        {busy === `acc-${a.id}` ? "Accepting..." : "Accept"}
                      </button>
                      <button
                        onClick={() => run(`rej-${a.id}`, () => rejectApplication({ projectId: id, applicationId: a.id }), "Application rejected")}
                        disabled={busy === `rej-${a.id}`}
                        className="btn-secondary text-sm"
                      >
                        {busy === `rej-${a.id}` ? "Rejecting..." : "Reject"}
                      </button>
                      <button
                        onClick={() => showPreview(a.applicantUserId, a.applicantName, a.roleId)}
                        disabled={busy === `prev-${a.applicantUserId}`}
                        className="btn-ghost text-sm"
                      >
                        {busy === `prev-${a.applicantUserId}` ? "Loading..." : "Preview Impact"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isOwner && recs.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI Recommendations
                  <span className="badge-primary ml-1">{recs.length}</span>
                </h3>
                <button
                  onClick={() => run("gen", () => generateRecommendations({ projectId: id }), "Recommendations generated")}
                  disabled={busy === "gen"}
                  className="btn-secondary text-sm"
                >
                  {busy === "gen" ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating...</span>
                    </div>
                  ) : (
                    'Refresh'
                  )}
                </button>
              </div>
              <div className="space-y-2">
                {recs.slice(0, 10).map(r => (
                  <div key={r.id} className="p-4 border border-neutral-200 rounded-lg hover:border-primary-200 hover:bg-primary-50 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-sage-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-sage-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="font-medium text-neutral-800">{r.candidateName}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-neutral-500">Score:</span>
                        <span className="badge-primary">{r.recommendationScore}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <TeamChat projectId={id} canAccess={isOwner || isMember} />
        </div>
      </div>

      {preview && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-xl max-w-3xl w-full p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-neutral-800">Candidate Impact Preview</h3>
                <p className="text-sm text-neutral-500">{preview.name}</p>
              </div>
            </div>
            <Suspense fallback={<ChartFallback />}><SkillRadar rows={previewRows} /></Suspense>
            <button onClick={() => setPreview(null)} className="btn-secondary mt-6 w-full">Close Preview</button>
          </div>
        </div>
      )}

      {videoPreview && (
        <VideoPreview
          videoUrl={videoPreview.url}
          userName={videoPreview.name}
          onClose={() => setVideoPreview(null)}
        />
      )}
    </div>
  );
}
