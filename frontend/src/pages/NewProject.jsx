import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addDoc, collection, doc, getDoc, serverTimestamp, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth.jsx";
import { useLive } from "../hooks";
import { errorMessage } from "../api";

export default function NewProject() {
  const { id } = useParams();
  const { user, account } = useAuth();
  const navigate = useNavigate();
  const skills = useLive(() => collection(db, "skills"), []).data || [];
  const roles = useLive(() => collection(db, "roles"), []).data || [];

  const [form, setForm] = useState({ title: "", description: "", domainArea: "", teamSizeRequired: 4, deadline: "" });
  const [reqSkills, setReqSkills] = useState([]);
  const [reqRoles, setReqRoles] = useState([]);
  const [pickSkill, setPickSkill] = useState({ skillId: "", minProficiency: 3, priority: "Must-have" });
  const [pickRole, setPickRole] = useState({ roleId: "", slots: 1 });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingProject, setLoadingProject] = useState(Boolean(id));

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setLoadingProject(true);
    getDoc(doc(db, "projects", id))
      .then((snapshot) => {
        if (cancelled) return;
        if (!snapshot.exists()) {
          setError("Project not found.");
          return;
        }
        const p = snapshot.data();
        setForm({
          title: p.title || "",
          description: p.description || "",
          domainArea: p.domainArea || "",
          teamSizeRequired: p.teamSizeRequired || 4,
          deadline: p.deadline?.toDate?.()?.toISOString().slice(0, 10) || "",
        });
        setReqSkills(Array.isArray(p.requiredSkills) ? p.requiredSkills : []);
        setReqRoles(Array.isArray(p.requiredRoles) ? p.requiredRoles : []);
      })
      .catch((loadError) => {
        if (!cancelled) setError(`${errorMessage(loadError)} (please retry)`);
      })
      .finally(() => {
        if (!cancelled) setLoadingProject(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const addSkill = () => {
    const s = skills.find((x) => x.id === pickSkill.skillId);
    if (!s) return;
    setReqSkills([
      ...reqSkills.filter((r) => r.skillId !== s.id),
      { skillId: s.id, skillName: s.skillName, minProficiency: Number(pickSkill.minProficiency), priority: pickSkill.priority }
    ]);
    setPickSkill({ skillId: "", minProficiency: 3, priority: "Must-have" });
  };

  const addRole = () => {
    const r = roles.find((x) => x.id === pickRole.roleId);
    if (!r) return;
    setReqRoles([
      ...reqRoles.filter((x) => x.roleId !== r.id), 
      { roleId: r.id, roleName: r.roleName, slots: Number(pickRole.slots) }
    ]);
    setPickRole({ roleId: "", slots: 1 });
  };

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!reqSkills.length || !reqRoles.length) {
      return setError("Add at least one required skill and one required role.");
    }
    if (!form.title.trim() || !form.description.trim() || !form.domainArea.trim()) {
      return setError("Complete the title, description, and domain fields.");
    }
    const teamSize = Number(form.teamSizeRequired);
    if (!Number.isInteger(teamSize) || teamSize < 2 || teamSize > 20) {
      return setError("Team size must be a whole number between 2 and 20.");
    }
    if (!form.deadline || Number.isNaN(new Date(`${form.deadline}T23:59:00`).getTime())) {
      return setError("Choose a valid project deadline.");
    }
    if (new Date(`${form.deadline}T23:59:00`) < new Date()) {
      return setError("The deadline must be in the future.");
    }
    if (reqRoles.reduce((total, role) => total + Number(role.slots || 0), 0) > teamSize) {
      return setError("Team size cannot be smaller than the requested role positions.");
    }
    setBusy(true);
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim(),
        domainArea: form.domainArea.trim(),
        teamSizeRequired: Number(form.teamSizeRequired),
        deadline: Timestamp.fromDate(new Date(`${form.deadline}T23:59:00`)),
        requiredSkills: reqSkills,
        requiredRoles: reqRoles,
        requiredSkillIds: reqSkills.map((s) => s.skillId),
        requiredRoleIds: reqRoles.map((r) => r.roleId),
      };
      if (id) {
        await updateDoc(doc(db, "projects", id), body);
        navigate(`/projects/${id}`);
      } else {
        const ref = await addDoc(collection(db, "projects"), {
          ...body,
          ownerUserId: user.uid,
          ownerName: account?.fullName || user.email,
          status: "Open",
          createdAt: serverTimestamp()
        });
        navigate(`/projects/${ref.id}`);
      }
    } catch (err) {
      setError(`${errorMessage(err)} (please retry)`);
    } finally {
      setBusy(false);
    }
  }

  if (loadingProject) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="status" aria-live="polite">
        <div className="card p-8 flex items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-pine border-t-transparent rounded-full animate-spin" />
          Loading project…
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold text-neutral-800 mb-2">{id ? 'Edit' : 'Create New'} Project</h1>
          <p className="text-neutral-500">Fill in the details to {id ? 'update your existing' : 'launch your new'} project and find the perfect team members</p>
        </div>
      </div>

      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-5 py-4 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={submit} className="space-y-6">
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-800">Project Details</h2>
              <p className="text-sm text-neutral-500">Basic information about your project</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Project Title</label>
            <input
              type="text"
              value={form.title}
              onChange={set('title')}
              required
              className="input"
              placeholder="Enter a clear, descriptive project title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              required
              className="input min-h-[140px]"
              placeholder="Describe your project goals, scope, and what you hope to achieve. Be specific about the problem you're solving and the expected outcomes."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Domain Area</label>
              <input
                type="text"
                value={form.domainArea}
                onChange={set('domainArea')}
                required
                className="input"
                placeholder="e.g., Web Development"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Team Size</label>
              <input
                type="number"
                value={form.teamSizeRequired}
                onChange={set('teamSizeRequired')}
                min="2"
                max="20"
                required
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={set('deadline')}
                required
                min={new Date().toISOString().split('T')[0]}
                className="input"
              />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-800">Required Skills</h2>
              <p className="text-sm text-neutral-500">Specify the technical skills your team needs</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-medium text-neutral-700 mb-2">Skill</label>
              <select
                value={pickSkill.skillId}
                onChange={(e) => setPickSkill({ ...pickSkill, skillId: e.target.value })}
                className="input"
              >
                <option value="">Select a skill</option>
                {skills.map(s => <option key={s.id} value={s.id}>{s.skillName}</option>)}
              </select>
            </div>

            <div className="flex-shrink-0">
              <label className="block text-xs font-medium text-neutral-700 mb-2">Min Level (1-5)</label>
              <select
                value={pickSkill.minProficiency}
                onChange={(e) => setPickSkill({ ...pickSkill, minProficiency: e.target.value })}
                className="input w-28"
              >
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="flex-shrink-0">
              <label className="block text-xs font-medium text-neutral-700 mb-2">Priority</label>
              <select
                value={pickSkill.priority}
                onChange={(e) => setPickSkill({ ...pickSkill, priority: e.target.value })}
                className="input w-36"
              >
                <option>Must-have</option>
                <option>Nice-to-have</option>
              </select>
            </div>

            <button type="button" onClick={addSkill} className="btn-primary flex-shrink-0">
              Add Skill
            </button>
          </div>

          {reqSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {reqSkills.map((s, i) => (
                <div key={i} className="inline-flex items-center gap-2 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg border border-primary-100">
                  <span className="font-medium text-sm">{s.skillName}</span>
                  <span className="text-xs text-primary-600 bg-primary-100 px-2 py-0.5 rounded">L{s.minProficiency}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${s.priority === 'Must-have' ? 'bg-error-100 text-error-700' : 'bg-neutral-100 text-neutral-600'}`}>
                    {s.priority}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${s.skillName}`}
                    onClick={() => setReqSkills(reqSkills.filter((_, j) => j !== i))}
                    className="ml-1 rounded px-1.5 py-0.5 text-[10px] font-bold text-primary-700 hover:bg-primary-100 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-neutral-50 rounded-lg border border-neutral-100">
              <svg className="w-12 h-12 text-neutral-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="text-neutral-500 text-sm">No skills added yet. Add at least one skill above.</p>
            </div>
          )}
        </div>

        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-sage-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-800">Required Roles</h2>
              <p className="text-sm text-neutral-500">Define team roles and how many positions to fill</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-medium text-neutral-700 mb-2">Role</label>
              <select
                value={pickRole.roleId}
                onChange={(e) => setPickRole({ ...pickRole, roleId: e.target.value })}
                className="input"
              >
                <option value="">Select a role</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.roleName}</option>)}
              </select>
            </div>

            <div className="flex-shrink-0">
              <label className="block text-xs font-medium text-neutral-700 mb-2">Positions</label>
              <input
                type="number"
                value={pickRole.slots}
                onChange={(e) => setPickRole({ ...pickRole, slots: e.target.value })}
                min="1"
                max="10"
                className="input w-28"
              />
            </div>

            <button type="button" onClick={addRole} className="btn-accent flex-shrink-0">
              Add Role
            </button>
          </div>

          {reqRoles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {reqRoles.map((r, i) => (
                <div key={i} className="inline-flex items-center gap-2 px-3 py-2 bg-sage-50 text-sage-800 rounded-lg border border-sage-100">
                  <span className="font-medium text-sm">{r.roleName}</span>
                  <span className="text-xs text-sage-700 bg-sage-100 px-2 py-0.5 rounded">
                    {r.slots} {r.slots > 1 ? 'positions' : 'position'}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${r.roleName}`}
                    onClick={() => setReqRoles(reqRoles.filter((_, j) => j !== i))}
                    className="ml-1 rounded px-1.5 py-0.5 text-[10px] font-bold text-sage-800 hover:bg-sage-100 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-neutral-50 rounded-lg border border-neutral-100">
              <svg className="w-12 h-12 text-neutral-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-neutral-500 text-sm">No roles added yet. Add at least one role above.</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={busy}
            className="btn-primary min-w-[140px]"
          >
            {busy ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{id ? 'Updating...' : 'Creating...'}</span>
              </div>
            ) : (
              id ? 'Update Project' : 'Create Project'
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
            disabled={busy}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
