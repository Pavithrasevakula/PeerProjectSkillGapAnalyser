import { useState } from "react";
import { Navigate } from "react-router-dom";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../auth.jsx";
import { errorMessage } from "../api";

export default function Login() {
  const { user } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ fullName: "", email: "", password: "", userRole: "Both" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (user) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, form.email, form.password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(cred.user, { displayName: form.fullName });
        await setDoc(doc(db, "users", cred.user.uid), {
          fullName: form.fullName.trim(),
          email: form.email,
          userRole: form.userRole,
          createdAt: serverTimestamp(),
          profile: { department: "", yearOfStudy: 1, experienceLevel: "Beginner", bio: "" },
        });
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <form className="card narrow" onSubmit={submit}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto 1rem' }}>
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="var(--accent)" opacity="0.3"/>
            <path d="M2 17L12 22L22 17" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
            <path d="M2 12L12 17L22 12" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h1 style={{ marginBottom: '0.5rem' }}>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="muted">
            {mode === "login" 
              ? "Sign in to access your team collaboration platform" 
              : "Get started with intelligent team matching"}
          </p>
        </div>
        {mode === "register" && (
          <>
            <label>
              Full name
              <input required maxLength={100} value={form.fullName} onChange={set("fullName")} placeholder="John Doe" />
            </label>
            <label>
              I want to
              <select value={form.userRole} onChange={set("userRole")}>
                <option value="Student">Join projects (student)</option>
                <option value="Owner">Lead projects (owner)</option>
                <option value="Both">Both - join and lead projects</option>
              </select>
            </label>
          </>
        )}
        <label>
          Email address
          <input type="email" required value={form.email} onChange={set("email")} placeholder="you@university.edu" />
        </label>
        <label>
          Password
          <input type="password" required minLength={6} value={form.password} onChange={set("password")} placeholder="Enter your password" />
        </label>
        {error && <p className="error">{error}</p>}
        <button disabled={busy} style={{ marginTop: '0.5rem' }}>
          {busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
        </button>
        <button type="button" className="link" onClick={() => {setMode(mode === "login" ? "register" : "login"); setError("");}}>
          {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
