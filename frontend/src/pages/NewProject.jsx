import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addDoc, collection, doc, getDoc, serverTimestamp, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth.jsx";
import { useLive } from "../hooks";
import { errorMessage } from "../api";

/** Create (FR-5) or, when :id is present, edit (FR-6) a project. */
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

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "projects", id)).then((s) => {
      if (!s.exists()) return;
      const p = s.data();
      setForm({ title: p.title, description: p.description, domainArea: p.domainArea,
        teamSizeRequired: p.teamSizeRequired, deadline: p.deadline.toDate().toISOString().slice(0, 10) });
      setReqSkills(p.requiredSkills);
      setReqRoles(p.requiredRoles);
    });
  }, [id]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const addSkill = () => {
    const s = skills.find((x) => x.id === pickSkill.skillId);
    if (!s) return;
    setReqSkills([...reqSkills.filter((r) => r.skillId !== s.id),
      { skillId: s.id, skillName: s.skillName, minProficiency: Number(pickSkill.minProficiency), priority: pickSkill.priority }]);
  };
  const addRole = () => {
    const r = roles.find((x) => x.id === pickRole.roleId);
    if (!r) return;
    setReqRoles([...reqRoles.filter((x) => x.roleId !== r.id), { roleId: r.id, roleName: r.roleName, slots: Number(pickRole.slots) }]);
  };

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!reqSkills.length || !reqRoles.length) return setError("Add at least one required skill and one required role.");
    setBusy(true);
    try {
      const body = {
        title: form.title.trim(), description: form.description.trim(), domainArea: form.domainArea.trim(),
        teamSizeRequired: Number(form.teamSizeRequired),
        deadline: Timestamp.fromDate(new Date(`${form.deadline}T23:59:00`)),
        requiredSkills: reqSkills, requiredRoles: reqRoles,
        requiredSkillIds: reqSkills.map((s) => s.skillId), requiredRoleIds: reqRoles.map((r) => r.roleId),
      };
      if (id) {
        await updateDoc(doc(db, "projects", id), body);
        navigate(`/projects/${id}`);
      } else {
        const ref = await addDoc(collection(db, "projects"),
          { ...body, ownerUserId: user.uid, ownerName: account?.fullName || user.email, status: "Open", createdAt: serverTimestamp() });
        navigate(`/projects/${ref.id}`);
      }
    } catch (err) {
      setError(`${errorMessage(err)} (please retry)`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack" style={{ maxWidth: "900px", margin: "0 auto" }}>
      <form className="card stack" onSubmit={submit}>
        <div>
          <h1>{id ? "Edit project" : "Create new project"}</h1>
          <p className="muted" style={{ marginTop: "0.5rem" }}>
            {id ? "Update project details and requirements" : "Define your project requirements and let TeamSync find the perfect team"}
          </p>
        </div>

        <div className="stack">
          <label>
            Project title
            <input required maxLength={120} value={form.title} onChange={set("title")} placeholder="e.g., AI-Powered Recommendation System" />
          </label>
          <label>
            Description
            <textarea required rows={4} value={form.description} onChange={set("description")} placeholder="Describe what the project is about, key objectives, and expected outcomes..." />
          </label>
        </div>

        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          <label>
            Domain area
            <input required maxLength={60} value={form.domainArea} onChange={set("domainArea")} placeholder="e.g., Machine Learning" />
          </label>
          <label>
            Team size
            <input type="number" min="1" max="20" required value={form.teamSizeRequired} onChange={set("teamSizeRequired")} />
          </label>
          <label>
            Deadline
            <input type="date" required value={form.deadline} onChange={set("deadline")} />
          </label>
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem", marginTop: "1rem" }}>
          <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Required skills
          </h3>
          <div className="row" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
            <select value={pickSkill.skillId} onChange={(e) => setPickSkill({ ...pickSkill, skillId: e.target.value })} style={{ flex: "1 1 200px" }}>
              <option value="">Select skill...</option>
              {skills.map((s) => <option key={s.id} value={s.id}>{s.skillName}</option>)}
            </select>
            <label className="inline" style={{ flex: "0 0 auto" }}>
              Min level
              <select value={pickSkill.minProficiency} onChange={(e) => setPickSkill({ ...pickSkill, minProficiency: e.target.value })}>
                {[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}
              </select>
            </label>
            <select value={pickSkill.priority} onChange={(e) => setPickSkill({ ...pickSkill, priority: e.target.value })} style={{ flex: "0 0 auto" }}>
              <option>Must-have</option>
              <option>Nice-to-have</option>
            </select>
            <button type="button" onClick={addSkill} style={{ flex: "0 0 auto" }}>Add skill</button>
          </div>
          {reqSkills.length > 0 && (
            <ul className="chips" style={{ marginTop: "1rem" }}>
              {reqSkills.map((s) => (
                <li key={s.skillId}>
                  {s.skillName} - Level {s.minProficiency} ({s.priority})
                  <button type="button" className="x" onClick={() => setReqSkills(reqSkills.filter((r) => r.skillId !== s.skillId))}>×</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem", marginTop: "1rem" }}>
          <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Required roles
          </h3>
          <div className="row" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
            <select value={pickRole.roleId} onChange={(e) => setPickRole({ ...pickRole, roleId: e.target.value })} style={{ flex: "1 1 200px" }}>
              <option value="">Select role...</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.roleName}</option>)}
            </select>
            <label className="inline" style={{ flex: "0 0 auto" }}>
              Slots
              <input type="number" min="1" max="10" value={pickRole.slots} onChange={(e) => setPickRole({ ...pickRole, slots: e.target.value })} />
            </label>
            <button type="button" onClick={addRole} style={{ flex: "0 0 auto" }}>Add role</button>
          </div>
          {reqRoles.length > 0 && (
            <ul className="chips" style={{ marginTop: "1rem" }}>
              {reqRoles.map((r) => (
                <li key={r.roleId}>
                  {r.roleName} × {r.slots}
                  <button type="button" className="x" onClick={() => setReqRoles(reqRoles.filter((x) => x.roleId !== r.roleId))}>×</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="error" style={{ marginTop: "1rem" }}>{error}</p>}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem", marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
          <button type="submit" disabled={busy} style={{ flex: 1 }}>
            {busy ? "Saving..." : id ? "Save changes" : "Create project"}
          </button>
          {id && (
            <button type="button" onClick={() => navigate(-1)} disabled={busy} style={{ flex: 0, background: "transparent", color: "var(--text)" }}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
