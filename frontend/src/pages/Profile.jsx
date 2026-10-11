import { useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth.jsx";
import { useLive } from "../hooks";
import { errorMessage } from "../api";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Searchable dropdown component
function SearchableSelect({ options, value, onSelect, placeholder, allowCustom }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const filtered = options.filter(opt => 
    opt.name.toLowerCase().includes((value || "").toLowerCase())
  );
  
  const handleSelect = (option) => {
    if (onSelect) {
      onSelect(option);
    }
    setIsOpen(false);
  };
  
  const handleChange = (e) => {
    const inputValue = e.target.value;
    setIsOpen(true);
    // Update parent state with name only, clear ID when typing
    if (onSelect) {
      onSelect({ id: null, name: inputValue });
    }
  };
  
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
      <input
        type="text"
        value={value || ""}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 250)}
        placeholder={placeholder}
        style={{ width: '100%' }}
        autoComplete="off"
      />
      {isOpen && value && filtered.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          maxHeight: '280px',
          overflowY: 'auto',
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-md)',
          zIndex: 1000,
          marginTop: '4px'
        }}>
          {filtered.map(option => (
            <div
              key={option.id}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(option);
              }}
              style={{
                padding: '0.875rem 1rem',
                cursor: 'pointer',
                borderBottom: '1px solid var(--line)',
                fontSize: '0.9375rem',
                transition: 'all 0.15s ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent-light)';
                e.currentTarget.style.color = 'var(--accent-dark)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'inherit';
              }}
            >
              <span style={{ fontWeight: 500 }}>{option.name}</span>
              {option.category && (
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--muted)',
                  padding: '0.25rem 0.5rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: '4px'
                }}>
                  {option.category}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { user, account } = useAuth();
  const uid = user.uid;
  const skills = useLive(() => collection(db, "skills"), []).data || [];
  const roles = useLive(() => collection(db, "roles"), []).data || [];
  const mySkills = useLive(() => collection(db, "users", uid, "skills"), [uid]).data || [];
  const myRoles = useLive(() => collection(db, "users", uid, "preferredRoles"), [uid]).data || [];
  const slots = useLive(() => collection(db, "users", uid, "availability"), [uid]).data || [];

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [skill, setSkill] = useState({ skillId: "", skillName: "", level: 3, years: 1 });
  const [role, setRole] = useState({ roleId: "", roleName: "", rank: 1 });
  const [slot, setSlot] = useState({ dayOfWeek: "Mon", startTime: "10:00", endTime: "12:00" });
  const [msg, setMsg] = useState({ text: "", error: false });

  useEffect(() => {
    // Only initialize form when we have account data for the first time
    // This prevents overwriting form data during auth restoration
    if (account && !form) {
      setForm({ 
        fullName: account.fullName || "", 
        userRole: account.userRole || "Student", 
        department: account.profile?.department || "",
        yearOfStudy: account.profile?.yearOfStudy || 1,
        experienceLevel: account.profile?.experienceLevel || "Beginner",
        bio: account.profile?.bio || ""
      });
      // Auto-enable editing if profile is incomplete
      if (!account.profile?.department) {
        setIsEditing(true);
      }
    }
  }, [account, form]);

  const run = async (fn, ok) => {
    try { 
      await fn(); 
      if (ok) {
        setMsg({ text: ok, error: false });
        // Clear success messages after 3 seconds
        setTimeout(() => setMsg({ text: "", error: false }), 3000);
      }
    }
    catch (err) { 
      setMsg({ text: `${errorMessage(err)} (please retry)`, error: true }); 
      // Keep error messages visible
    }
  };

  if (!form) return <p className="muted" style={{ textAlign: 'center', padding: '3rem' }}>Loading profile...</p>;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  
  const isProfileIncomplete = !form.department || !form.department.trim();

  const saveProfile = async (e) => {
    e.preventDefault();
    await run(() => updateDoc(doc(db, "users", uid), {
      fullName: form.fullName.trim(),
      userRole: form.userRole,
      profile: {
        department: form.department, yearOfStudy: Number(form.yearOfStudy),
        experienceLevel: form.experienceLevel, bio: form.bio || "", updatedAt: serverTimestamp(),
      },
    }), "Profile saved successfully!");
    setIsEditing(false);
  };

  const addSkill = async () => {
    if (!skill.skillName.trim()) return;
    
    // Check if skill already exists for this user
    const isDuplicate = mySkills.some(s => 
      s.skillName.toLowerCase() === skill.skillName.trim().toLowerCase()
    );
    
    if (isDuplicate) {
      setMsg({ text: "You've already added this skill!", error: true });
      return;
    }
    
    // Check if it's an existing skill
    let skillId = skill.skillId;
    let skillName = skill.skillName.trim();
    
    if (!skillId) {
      // It's a custom skill - create it in /skills collection first
      skillId = `sk_${skillName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
      
      // Create the skill in master collection (try/catch to handle if it already exists)
      try {
        await setDoc(doc(db, "skills", skillId), { 
          skillName: skillName, 
          skillCategory: "Custom" 
        });
      } catch (err) {
        // Skill might already exist, that's okay - continue
        console.log("Skill may already exist in master list, continuing...");
      }
    }
    
    // Add to user's skills
    await run(() => setDoc(doc(db, "users", uid, "skills", skillId), {
      skillId: skillId, 
      skillName: skillName,
      proficiencyLevel: Number(skill.level), 
      yearsOfExperience: Number(skill.years),
    }), "Skill added successfully!");
    
    setSkill({ skillId: "", skillName: "", level: 3, years: 1 });
  };

  const addRole = async () => {
    if (!role.roleName.trim()) return;
    
    // Check if role already exists for this user
    const isDuplicate = myRoles.some(r => 
      r.roleName.toLowerCase() === role.roleName.trim().toLowerCase()
    );
    
    if (isDuplicate) {
      setMsg({ text: "You've already added this role!", error: true });
      return;
    }
    
    // Check if it's an existing role
    let roleId = role.roleId;
    let roleName = role.roleName.trim();
    
    if (!roleId) {
      // It's a custom role - create it in /roles collection first
      roleId = `r_${roleName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
      
      // Create the role in master collection (try/catch to handle if it already exists)
      try {
        await setDoc(doc(db, "roles", roleId), { roleName: roleName });
      } catch (err) {
        // Role might already exist, that's okay - continue
        console.log("Role may already exist in master list, continuing...");
      }
    }
    
    // Add to user's preferred roles
    await run(() => setDoc(doc(db, "users", uid, "preferredRoles", roleId), {
      roleId: roleId, 
      roleName: roleName, 
      preferenceRank: Number(role.rank),
    }), "Role added successfully!");
    
    setRole({ roleId: "", roleName: "", rank: 1 });
  };

  const addSlot = () => {
    // Check for duplicate time slots
    const isDuplicate = slots.some(s => 
      s.dayOfWeek === slot.dayOfWeek && 
      s.startTime === slot.startTime && 
      s.endTime === slot.endTime
    );
    
    if (isDuplicate) {
      setMsg({ text: "This time slot already exists!", error: true });
      return;
    }
    
    // Validate time range
    if (slot.endTime <= slot.startTime) {
      setMsg({ text: "End time must be after start time!", error: true });
      return;
    }
    
    run(() => addDoc(collection(db, "users", uid, "availability"), slot), "Time slot added");
  };

  const skillOptions = skills.map(s => ({ id: s.id, name: s.skillName, category: s.skillCategory }));
  const roleOptions = roles.map(r => ({ id: r.id, name: r.roleName }));

  return (
    <div className="stack">
      <div style={{ marginBottom: '1rem' }}>
        <div className="row between" style={{ alignItems: 'center' }}>
          <div>
            <h1>My Profile</h1>
            <p className="muted">Manage your profile, skills, roles, and availability</p>
          </div>
          {!isEditing && !isProfileIncomplete && (
            <button onClick={() => setIsEditing(true)} style={{ background: 'var(--accent)', color: 'white' }}>
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {isProfileIncomplete && !isEditing && (
        <div className="card" style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning)', padding: '1rem' }}>
          <p style={{ margin: 0, color: 'var(--warning-text)' }}>
            <strong>⚠️ Complete your profile</strong> - Add your department and other details to apply for projects
          </p>
        </div>
      )}

      {isEditing ? (
        <form className="card" onSubmit={saveProfile}>
          <h2>Personal Information</h2>
          <div className="grid">
            <label>Full name<input required value={form.fullName} onChange={set("fullName")} placeholder="Your full name" /></label>
            <label>I am a
              <select value={form.userRole} onChange={set("userRole")}>
                <option value="Student">Student</option><option value="Owner">Project owner</option><option value="Both">Both</option>
              </select>
            </label>
            <label>Department<input required value={form.department} onChange={set("department")} placeholder="e.g., MTech CSE" /></label>
            <label>Year of study
              <select value={form.yearOfStudy} onChange={set("yearOfStudy")}>{[1, 2, 3, 4, 5].map((y) => <option key={y}>{y}</option>)}</select>
            </label>
            <label>Experience level
              <select value={form.experienceLevel} onChange={set("experienceLevel")}>
                {["Beginner", "Intermediate", "Advanced"].map((l) => <option key={l}>{l}</option>)}
              </select>
            </label>
          </div>
          <label>Bio<textarea rows={3} value={form.bio || ""} onChange={set("bio")} placeholder="Tell us about yourself..." /></label>
          <div className="row" style={{ gap: '1rem' }}>
            <button type="submit">Save Profile</button>
            {!isProfileIncomplete && (
              <button type="button" onClick={() => setIsEditing(false)} style={{ background: 'transparent', color: 'var(--text)' }}>
                Cancel
              </button>
            )}
          </div>
          {msg.text && <p className={msg.error ? "error" : "ok"}>{msg.text}</p>}
        </form>
      ) : (
        <div className="card">
          <h2>Personal Information</h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            <div>
              <p className="muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Full Name</p>
              <p style={{ fontWeight: 500 }}>{form.fullName || '-'}</p>
            </div>
            <div>
              <p className="muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Role</p>
              <p style={{ fontWeight: 500 }}>{form.userRole}</p>
            </div>
            <div>
              <p className="muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Department</p>
              <p style={{ fontWeight: 500 }}>{form.department || '-'}</p>
            </div>
            <div>
              <p className="muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Year of Study</p>
              <p style={{ fontWeight: 500 }}>Year {form.yearOfStudy}</p>
            </div>
            <div>
              <p className="muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Experience Level</p>
              <p style={{ fontWeight: 500 }}>{form.experienceLevel}</p>
            </div>
          </div>
          {form.bio && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--line)' }}>
              <p className="muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Bio</p>
              <p style={{ lineHeight: '1.6' }}>{form.bio}</p>
            </div>
          )}
        </div>
      )}

      <section className="card">
        <h2>Skills</h2>
        <p className="muted" style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
          Add your technical and soft skills to help match with relevant projects
        </p>
        <p className="muted" style={{ marginBottom: '1rem', fontSize: '0.8125rem', fontStyle: 'italic' }}>
          <strong>Level guide:</strong> 1=Beginner, 2=Basic, 3=Intermediate, 4=Advanced, 5=Expert
        </p>
        <div className="row">
          <SearchableSelect
            options={skillOptions}
            value={skill.skillName}
            onSelect={(option) => setSkill({ ...skill, skillId: option.id, skillName: option.name })}
            placeholder="Search skills... (e.g., React, Python)"
          />
          <label className="inline">Level
            <select value={skill.level} onChange={(e) => setSkill({ ...skill, level: e.target.value })} title="1=Beginner, 2=Basic, 3=Intermediate, 4=Advanced, 5=Expert">
              {[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}
            </select>
          </label>
          <label className="inline">Years
            <input 
              type="number" 
              min="0" 
              max="20" 
              step="0.5" 
              value={skill.years} 
              onChange={(e) => setSkill({ ...skill, years: e.target.value })} 
              style={{ width: '80px' }} 
              title="Years of experience with this skill"
            />
          </label>
          <button type="button" onClick={addSkill} disabled={!skill.skillName}>
            Add Skill
          </button>
        </div>
        {msg.text && msg.error && <p className="error" style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>{msg.text}</p>}
        {mySkills.length > 0 ? (
          <>
            <p className="muted" style={{ fontSize: '0.875rem', marginTop: '1rem', marginBottom: '0.5rem' }}>
              Your skills ({mySkills.length}):
            </p>
            <ul className="chips">
              {mySkills.map((s) => (
                <li key={s.id}>
                  {s.skillName} - L{s.proficiencyLevel} ({s.yearsOfExperience}y)
                  <button className="x" onClick={() => run(() => deleteDoc(doc(db, "users", uid, "skills", s.id)), "")} title="Remove this skill">×</button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="muted" style={{ marginTop: '1rem', textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            No skills added yet. Add your first skill above to improve project matching!
          </p>
        )}
      </section>

      <section className="card">
        <h2>Preferred Roles</h2>
        <p className="muted" style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
          Select the roles you're interested in for team projects
        </p>
        <p className="muted" style={{ marginBottom: '1rem', fontSize: '0.8125rem', fontStyle: 'italic' }}>
          <strong>Rank:</strong> 1 = most preferred, higher numbers = less preferred
        </p>
        <div className="row">
          <SearchableSelect
            options={roleOptions}
            value={role.roleName}
            onSelect={(option) => setRole({ ...role, roleId: option.id, roleName: option.name })}
            placeholder="Search roles... (e.g., Frontend Developer)"
          />
          <label className="inline">Rank
            <select value={role.rank} onChange={(e) => setRole({ ...role, rank: e.target.value })} title="1 = most preferred">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n}>{n}</option>)}
            </select>
          </label>
          <button type="button" onClick={addRole} disabled={!role.roleName}>
            Add Role
          </button>
        </div>
        {myRoles.length > 0 ? (
          <>
            <p className="muted" style={{ fontSize: '0.875rem', marginTop: '1rem', marginBottom: '0.5rem' }}>
              Your preferred roles ({myRoles.length}), ranked:
            </p>
            <ul className="chips">
              {[...myRoles].sort((a, b) => a.preferenceRank - b.preferenceRank).map((r) => (
                <li key={r.id}>
                  #{r.preferenceRank} {r.roleName}
                  <button className="x" onClick={() => run(() => deleteDoc(doc(db, "users", uid, "preferredRoles", r.id)), "")} title="Remove this role">×</button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="muted" style={{ marginTop: '1rem', textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            No roles added yet. Add your preferred roles to find suitable projects!
          </p>
        )}
      </section>

      <section className="card">
        <h2>Weekly Availability</h2>
        <p className="muted" style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
          Add your available time slots for team meetings and collaboration
        </p>
        <p className="muted" style={{ marginBottom: '1rem', fontSize: '0.8125rem', fontStyle: 'italic' }}>
          Teams can use this to schedule meetings at times that work for everyone
        </p>
        <div className="row">
          <select value={slot.dayOfWeek} onChange={(e) => setSlot({ ...slot, dayOfWeek: e.target.value })} style={{ minWidth: '120px' }}>{DAYS.map((d) => <option key={d}>{d}</option>)}</select>
          <input type="time" value={slot.startTime} onChange={(e) => setSlot({ ...slot, startTime: e.target.value })} title="Start time" />
          <input type="time" value={slot.endTime} onChange={(e) => setSlot({ ...slot, endTime: e.target.value })} title="End time" />
          <button type="button" onClick={addSlot} disabled={slot.endTime <= slot.startTime}>Add Slot</button>
        </div>
        {slots.length > 0 ? (
          <>
            <p className="muted" style={{ fontSize: '0.875rem', marginTop: '1rem', marginBottom: '0.5rem' }}>
              Your availability ({slots.length} time slots):
            </p>
            <ul className="chips">
              {slots.map((s) => (
                <li key={s.id}>{s.dayOfWeek} {s.startTime}-{s.endTime}
                  <button className="x" onClick={() => run(() => deleteDoc(doc(db, "users", uid, "availability", s.id)), "")} title="Remove this time slot">×</button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="muted" style={{ marginTop: '1rem', textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            No availability added yet. Add your available time slots to help teams coordinate!
          </p>
        )}
      </section>
    </div>
  );
}
