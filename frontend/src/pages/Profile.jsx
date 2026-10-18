import { useState } from "react";
import { addDoc, collection, deleteDoc, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth.jsx";
import { useLive } from "../hooks";
import VideoIntro from "../components/VideoIntro.jsx";
import AdvancedScheduler from "../components/AdvancedScheduler.jsx";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function SearchableSelect({ options, value, onSelect, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMouseInDropdown, setIsMouseInDropdown] = useState(false);
  
  const filtered = options.filter(opt => 
    opt.name.toLowerCase().includes((value || "").toLowerCase())
  );
  
  const handleBlur = () => {
    // Only close if mouse is not in dropdown
    if (!isMouseInDropdown) {
      setIsOpen(false);
    }
  };
  
  return (
    <div className="relative flex-1 min-w-[200px]">
      <input
        type="text"
        value={value || ""}
        onChange={(e) => {
          setIsOpen(true);
          onSelect({ id: null, name: e.target.value });
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="input w-full"
        autoComplete="off"
      />
      {isOpen && value && filtered.length > 0 && (
        <div 
          className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-neutral-200 rounded-lg shadow-lg z-50"
          onMouseEnter={() => setIsMouseInDropdown(true)}
          onMouseLeave={() => setIsMouseInDropdown(false)}
        >
          {filtered.map(option => (
            <div
              key={option.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(option);
                setIsOpen(false);
                setIsMouseInDropdown(false);
              }}
              className="px-4 py-3 cursor-pointer hover:bg-primary-50 border-b border-neutral-100 last:border-0 flex items-center justify-between transition-colors"
            >
              <span className="font-medium text-neutral-800">{option.name}</span>
              {option.category && (
                <span className="badge-gray text-xs">{option.category}</span>
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
  const [busyAction, setBusyAction] = useState(false);

  // Initialise the editable form once the account document has loaded (state adjusted during render).
  if (account && !form) {
    setForm({
      fullName: account.fullName || "",
      userRole: account.userRole || "Student",
      department: account.profile?.department || "",
      yearOfStudy: account.profile?.yearOfStudy || 1,
      experienceLevel: account.profile?.experienceLevel || "Beginner",
      bio: account.profile?.bio || ""
    });
    if (!account.profile?.department) {
      setIsEditing(true);
    }
  }

  const run = async (fn, ok) => {
    if (busyAction) return;
    setBusyAction(true);
    try {
      await fn();
      if (ok) {
        setMsg({ text: ok, error: false });
        setTimeout(() => setMsg({ text: "", error: false }), 3000);
      }
    } catch (err) {
      setMsg({ text: err.message || "Operation failed. Please try again.", error: true });
    } finally {
      setBusyAction(false);
    }
  };

  const saveProfile = () => {
    if (!form.fullName.trim() || !form.department.trim()) {
      setMsg({ text: "Full name and department are required.", error: true });
      return;
    }
    return run(async () => {
    await setDoc(doc(db, "users", uid), { 
      fullName: form.fullName, 
      userRole: form.userRole, 
      profile: {
        department: form.department,
        yearOfStudy: parseInt(form.yearOfStudy),
        experienceLevel: form.experienceLevel,
        bio: form.bio
      }
    }, { merge: true });
    setIsEditing(false);
  }, "Profile updated successfully");
  };

  const addSkill = () => {
    if (!skill.skillName.trim()) {
      setMsg({ text: "Choose or enter a skill first.", error: true });
      return;
    }
    return run(async () => {
    const finalSkillId = skill.skillId || skill.skillName.trim().toLowerCase().replace(/\s+/g, '-');
    if (!skill.skillId) {
      await setDoc(doc(db, "skills", finalSkillId), {
        skillName: skill.skillName.trim(),
        skillCategory: "User Added"
      });
    }
    await addDoc(collection(db, "users", uid, "skills"), {
      skillId: finalSkillId,
      skillName: skill.skillName.trim(),
      proficiencyLevel: skill.level,
      yearsOfExperience: skill.years
    });
    setSkill({ skillId: "", skillName: "", level: 3, years: 1 });
  }, "Skill added");
  };

  const removeSkill = (id) => run(() => deleteDoc(doc(db, "users", uid, "skills", id)), "Skill removed");

  const addRole = () => {
    if (!role.roleName.trim()) {
      setMsg({ text: "Choose or enter a role first.", error: true });
      return;
    }
    return run(async () => {
    const finalRoleId = role.roleId || role.roleName.trim().toLowerCase().replace(/\s+/g, '-');
    if (!role.roleId) {
      await setDoc(doc(db, "roles", finalRoleId), {
        roleName: role.roleName.trim(),
        category: "User Added"
      });
    }
    await addDoc(collection(db, "users", uid, "preferredRoles"), {
      roleId: finalRoleId,
      roleName: role.roleName.trim(),
      preferenceRank: role.rank
    });
    setRole({ roleId: "", roleName: "", rank: 1 });
  }, "Role added");
  };

  const removeRole = (id) => run(() => deleteDoc(doc(db, "users", uid, "preferredRoles", id)), "Role removed");

  const addSlot = () => {
    if (!slot.startTime || !slot.endTime || slot.endTime <= slot.startTime) {
      setMsg({ text: "End time must be later than start time.", error: true });
      return;
    }
    return run(() => 
      addDoc(collection(db, "users", uid, "availability"), slot), "Availability added");
  };

  const removeSlot = (id) => run(() => 
    deleteDoc(doc(db, "users", uid, "availability", id)), "Availability removed");

  if (!form) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-800 mb-1">My Profile</h1>
          <p className="text-neutral-500">Manage your personal information and preferences</p>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="btn-primary">
            Edit Profile
          </button>
        )}
      </div>

      {msg.text && (
        <div className={`p-4 rounded-lg border ${msg.error ? 'bg-error-50 text-error-700 border-error-200' : 'bg-success-50 text-success-700 border-success-200'}`}>
          <div className="flex items-center gap-2">
            {msg.error ? (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="font-medium">{msg.text}</span>
          </div>
        </div>
      )}

      <div className="card p-6 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">Basic Information</h2>
            <p className="text-sm text-neutral-500">Your personal and academic details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="profile-full-name" className="block text-sm font-medium text-neutral-700 mb-2">Full Name</label>
            <input id="profile-full-name"
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              disabled={!isEditing}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="profile-role" className="block text-sm font-medium text-neutral-700 mb-2">Role</label>
            <select id="profile-role"
              value={form.userRole}
              onChange={(e) => setForm({ ...form, userRole: e.target.value })}
              disabled={!isEditing}
              className="input"
            >
              <option>Student</option>
              <option>Owner</option>
              <option>Both</option>
            </select>
          </div>

          <div>
            <label htmlFor="profile-department" className="block text-sm font-medium text-neutral-700 mb-2">Department</label>
            <input id="profile-department"
              type="text"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              disabled={!isEditing}
              className="input"
              placeholder="e.g., Computer Science"
            />
          </div>

          <div>
            <label htmlFor="profile-year-of-study" className="block text-sm font-medium text-neutral-700 mb-2">Year of Study</label>
            <input id="profile-year-of-study"
              type="number"
              min="1"
              max="10"
              value={form.yearOfStudy}
              onChange={(e) => setForm({ ...form, yearOfStudy: e.target.value })}
              disabled={!isEditing}
              className="input"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="profile-experience-level" className="block text-sm font-medium text-neutral-700 mb-2">Experience Level</label>
            <select id="profile-experience-level"
              value={form.experienceLevel}
              onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
              disabled={!isEditing}
              className="input"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="profile-bio" className="block text-sm font-medium text-neutral-700 mb-2">Bio</label>
          <textarea id="profile-bio"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            disabled={!isEditing}
            className="input min-h-[120px]"
            placeholder="Tell us about yourself, your interests, and what you're looking for in a team..."
          />
        </div>

        {isEditing && (
          <div className="flex gap-3 pt-2 border-t border-neutral-100">
            <button onClick={saveProfile} disabled={busyAction} className="btn-primary">
              Save Changes
            </button>
            <button onClick={() => setIsEditing(false)} className="btn-secondary">Cancel</button>
          </div>
        )}
      </div>

      <VideoIntro />

      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">Skills & Expertise</h2>
            <p className="text-sm text-neutral-500">Add your technical and professional skills</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 items-end">
          <SearchableSelect
            options={skills.map(s => ({ id: s.id, name: s.skillName, category: s.category || s.skillCategory }))}
            value={skill.skillName}
            onSelect={(opt) => setSkill({ ...skill, skillId: opt.id, skillName: opt.name })}
            placeholder="Search or add skill..."
          />
          
          <div className="flex-shrink-0">
            <label htmlFor="profile-proficiency-1-5" className="block text-xs font-medium text-neutral-700 mb-2">Proficiency (1-5)</label>
            <input id="profile-proficiency-1-5"
              type="number"
              min="1"
              max="5"
              value={skill.level}
              onChange={(e) => setSkill({ ...skill, level: parseInt(e.target.value) })}
              className="input w-28"
            />
          </div>

          <div className="flex-shrink-0">
            <label htmlFor="profile-experience-years" className="block text-xs font-medium text-neutral-700 mb-2">Experience (years)</label>
            <input id="profile-experience-years"
              type="number"
              min="0"
              max="50"
              value={skill.years}
              onChange={(e) => setSkill({ ...skill, years: parseInt(e.target.value) })}
              className="input w-28"
            />
          </div>

          <button onClick={addSkill} disabled={busyAction} className="btn-primary flex-shrink-0">
            Add Skill
          </button>
        </div>

        {mySkills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {mySkills.map(s => (
              <div key={s.id} className="inline-flex items-center gap-2 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg border border-primary-100">
                <span className="font-medium text-sm">{s.skillName}</span>
                <span className="text-xs text-primary-600 bg-primary-100 px-2 py-0.5 rounded">L{s.proficiencyLevel}</span>
                <span className="text-xs text-primary-600">{s.yearsOfExperience}y</span>
                <button
                  type="button"
                  aria-label={`Remove ${s.skillName} skill`}
                  disabled={busyAction}
                  onClick={() => removeSkill(s.id)}
                  className="ml-1 rounded px-1.5 py-0.5 text-xs font-bold text-primary-700 hover:bg-primary-100 transition-colors"
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
            <p className="text-neutral-500 text-sm">No skills added yet. Add your first skill above.</p>
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
            <h2 className="text-lg font-semibold text-neutral-800">Preferred Roles</h2>
            <p className="text-sm text-neutral-500">Select roles you'd like to take on in teams</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 items-end">
          <SearchableSelect
            options={roles.map(r => ({ id: r.id, name: r.roleName, category: r.category }))}
            value={role.roleName}
            onSelect={(opt) => setRole({ ...role, roleId: opt.id, roleName: opt.name })}
            placeholder="Search or add role..."
          />
          
          <div className="flex-shrink-0">
            <label htmlFor="profile-preference-1-5" className="block text-xs font-medium text-neutral-700 mb-2">Preference (1-5)</label>
            <input id="profile-preference-1-5"
              type="number"
              min="1"
              max="5"
              value={role.rank}
              onChange={(e) => setRole({ ...role, rank: parseInt(e.target.value) })}
              className="input w-28"
            />
          </div>

          <button onClick={addRole} disabled={busyAction} className="btn-accent flex-shrink-0">
            Add Role
          </button>
        </div>

        {myRoles.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {myRoles.map(r => (
              <div key={r.id} className="inline-flex items-center gap-2 px-3 py-2 bg-sage-50 text-sage-800 rounded-lg border border-sage-100">
                <span className="font-medium text-sm">{r.roleName}</span>
                <span className="text-xs text-sage-700 bg-sage-100 px-2 py-0.5 rounded">#{r.preferenceRank}</span>
                <button
                  type="button"
                  aria-label={`Remove ${r.roleName} role`}
                  disabled={busyAction}
                  onClick={() => removeRole(r.id)}
                  className="ml-1 rounded px-1.5 py-0.5 text-xs font-bold text-sage-800 hover:bg-sage-100 transition-colors"
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
            <p className="text-neutral-500 text-sm">No roles added yet. Add your preferred roles above.</p>
          </div>
        )}
      </div>

      <AdvancedScheduler />

      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">Quick Availability</h2>
            <p className="text-sm text-neutral-500">Add your available time slots throughout the week</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-shrink-0">
            <label htmlFor="profile-day" className="block text-xs font-medium text-neutral-700 mb-2">Day</label>
            <select id="profile-day"
              value={slot.dayOfWeek}
              onChange={(e) => setSlot({ ...slot, dayOfWeek: e.target.value })}
              className="input w-32"
            >
              {DAYS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>

          <div className="flex-shrink-0">
            <label htmlFor="profile-start-time" className="block text-xs font-medium text-neutral-700 mb-2">Start Time</label>
            <input id="profile-start-time"
              type="time"
              value={slot.startTime}
              onChange={(e) => setSlot({ ...slot, startTime: e.target.value })}
              className="input w-36"
            />
          </div>

          <div className="flex-shrink-0">
            <label htmlFor="profile-end-time" className="block text-xs font-medium text-neutral-700 mb-2">End Time</label>
            <input id="profile-end-time"
              type="time"
              value={slot.endTime}
              onChange={(e) => setSlot({ ...slot, endTime: e.target.value })}
              className="input w-36"
            />
          </div>

          <button onClick={addSlot} disabled={busyAction} className="btn-primary flex-shrink-0">
            Add Slot
          </button>
        </div>

        {slots.length > 0 ? (
          <div className="space-y-2">
            {DAYS.map(day => {
              const daySlots = slots.filter(s => s.dayOfWeek === day);
              if (!daySlots.length) return null;
              
              return (
                <div key={day} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <span className="font-semibold text-neutral-700 w-12 flex-shrink-0 pt-0.5">{day}</span>
                  <div className="flex-1 flex flex-wrap gap-2">
                    {daySlots.map(s => (
                      <div key={s.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm">
                        <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-neutral-700">{s.startTime} - {s.endTime}</span>
                        <button
                          type="button"
                          aria-label={`Remove ${day} ${s.startTime} to ${s.endTime} availability`}
                          disabled={busyAction}
                          onClick={() => removeSlot(s.id)}
                          className="rounded px-1.5 py-0.5 text-xs font-bold text-neutral-500 hover:bg-error-50 hover:text-error-700 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-neutral-50 rounded-lg border border-neutral-100">
            <svg className="w-12 h-12 text-neutral-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-neutral-500 text-sm">No availability slots added yet. Add your first time slot above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
