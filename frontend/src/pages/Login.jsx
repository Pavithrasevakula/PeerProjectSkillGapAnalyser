import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { authErrorMessage, isValidEmail } from "../lib/authMessages";

const COPY = {
  signin: {
    title: "Sign in to your workspace",
    description: "Enter your email and password to access your projects and team workspace.",
    submit: "Sign in to workspace",
  },
  signup: {
    title: "Create your workspace",
    description: "Create an account to start building your team and exploring projects.",
    submit: "Create account and start",
  },
  reset: {
    title: "Reset your password",
    description: "Enter the email you signed up with and we will send you a link to choose a new password.",
    submit: "Send reset link",
  },
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin"); // "signin" | "signup" | "reset"
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const copy = COPY[mode];

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setNotice("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (mode !== "reset") {
      if (!password) {
        setError("Enter your password.");
        return;
      }
      if (mode === "signup" && password.length < 6) {
        setError("Use a password with at least six characters.");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "reset") {
        await sendPasswordResetEmail(auth, trimmedEmail);
        // Same message whether or not the account exists, so emails cannot be enumerated.
        setNotice(`If an account exists for ${trimmedEmail}, a password reset link is on its way. Check your inbox and spam folder.`);
      } else if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        navigate("/");
      } else {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
        navigate("/");
      }
    } catch (err) {
      // Firebase may report an unknown address on reset; keep the response generic.
      if (mode === "reset" && err?.code === "auth/user-not-found") {
        setNotice(`If an account exists for ${trimmedEmail}, a password reset link is on its way. Check your inbox and spam folder.`);
      } else {
        setError(authErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7f3] grid place-items-center p-3 sm:p-6">
      <div className="login-wrap w-full max-w-[980px] min-h-[560px] grid lg:grid-cols-[1.05fr_.95fr] bg-white border border-[#e5eae4] rounded-[24px] overflow-hidden shadow-[0_20px_70px_rgba(35,68,47,.07)]">
        
        {/* Left Story Section */}
        <section className="login-story p-6 sm:p-12 lg:px-11 lg:py-12 bg-[#eaf1eb] relative overflow-hidden flex flex-col justify-between">
          {/* Decorative Circles */}
          <div className="absolute right-[-130px] top-[90px] w-[360px] h-[360px] border border-[#d0dfd1] rounded-full pointer-events-none" />
          <div className="absolute right-[-38px] top-[130px] w-[270px] h-[430px] border border-[#d0dfd1] rounded-full rotate-[30deg] pointer-events-none" />
          
          <div className="relative z-10">
            <Link to="/" className="login-mark flex items-center gap-2.5 text-pine no-underline mb-8 lg:mb-14">
              <span className="brand-mark w-10 h-10 rounded-xl bg-pine text-white grid place-items-center">
                <svg viewBox="0 0 36 36" className="w-[29px] h-[29px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18.5 15 24l12-13" strokeWidth="3"/>
                  <circle cx="18" cy="18" r="15"/>
                </svg>
              </span>
              <strong className="font-display text-xl tracking-[-0.7px]">
                Team<span className="text-pine-mid">Sync</span>
              </strong>
            </Link>
            
            <div className="login-message max-w-[370px]">
              <div className="eyebrow mb-3.5">
                <span className="eyebrow-dot" />
                BUILD BETTER TOGETHER
              </div>
              <h1 className="text-[28px] sm:text-[37px] leading-[1.18] tracking-[-1.7px] my-3.5 text-[#273a30]">
                Your next great team starts with <em className="not-italic text-[#4d8063]">complementarity.</em>
              </h1>
              <p className="text-[13px] leading-[1.8] text-[#5f6b64] max-w-[340px]">
                A space to find collaborators who add strengths, cover gaps, and help turn good project ideas into balanced teams.
              </p>
              
              <div className="mini-benefits flex flex-col gap-3.5 mt-7">
                <div className="mini-benefit flex items-center gap-2.5 text-xs text-[#526d59]">
                  <span className="w-[23px] h-[23px] bg-[#d9e8db] text-[#487455] rounded-lg grid place-items-center font-extrabold">✓</span>
                  Match on skills, roles and availability
                </div>
                <div className="mini-benefit flex items-center gap-2.5 text-xs text-[#526d59]">
                  <span className="w-[23px] h-[23px] bg-[#d9e8db] text-[#487455] rounded-lg grid place-items-center font-extrabold">✓</span>
                  Understand why a teammate is recommended
                </div>
                <div className="mini-benefit flex items-center gap-2.5 text-xs text-[#526d59]">
                  <span className="w-[23px] h-[23px] bg-[#d9e8db] text-[#487455] rounded-lg grid place-items-center font-extrabold">✓</span>
                  Track projects and applications in one place
                </div>
              </div>
            </div>
          </div>
          
          <div className="story-foot text-xs text-[#5f6b64] relative z-10 mt-11">
            TeamSync · Student project collaboration
          </div>
        </section>

        {/* Right Form Section */}
        <section className="login-form-area flex items-center justify-center px-6 py-8 sm:px-10 sm:py-11">
          <div className="login-form-inner w-full max-w-[330px]">
            <div className="login-kicker text-xs tracking-[1.4px] text-[#4d6b5a] font-extrabold">
              Welcome to TeamSync
            </div>
            <h2 className="font-display text-[25px] tracking-[-0.8px] mt-2 mb-1.5 text-[#293a30]">
              {copy.title}
            </h2>
            <p className="login-desc text-xs text-[#5f6b64] leading-[1.7] mb-7">
              {copy.description}
            </p>
            
            {error && (
              <div role="alert" className="login-message-box show error bg-[#f8eae8] text-[#a34d45] text-xs rounded-[9px] px-3 py-2.5 mb-3.5 leading-[1.6]">
                {error}
              </div>
            )}
            {notice && (
              <div role="status" className="login-message-box show bg-[#e8f1e8] text-[#2f5a3d] text-xs rounded-[9px] px-3 py-2.5 mb-3.5 leading-[1.6]">
                {notice}
              </div>
            )}
            
            <form onSubmit={handleSubmit} noValidate>
              <label className="login-field flex flex-col gap-1.5 text-[#617166] text-xs font-bold mb-3.5">
                Email address
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-[45px] border border-[#dfe6de] rounded-[10px] px-3 text-xs font-normal outline-0 focus:border-[#739d7c] focus:shadow-[0_0_0_3px_#eef5ee] transition-all"
                  placeholder="you@university.edu"
                  autoComplete="email"
                />
              </label>
              
              {mode !== "reset" && (
                <label className="login-field flex flex-col gap-1.5 text-[#617166] text-xs font-bold mb-3.5">
                  Password
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-[45px] border border-[#dfe6de] rounded-[10px] px-3 text-xs font-normal outline-0 focus:border-[#739d7c] focus:shadow-[0_0_0_3px_#eef5ee] transition-all"
                    placeholder="••••••••"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  />
                </label>
              )}

              {mode === "signin" && (
                <div className="-mt-1.5 mb-1 text-right">
                  <button type="button" onClick={() => switchMode("reset")} className="text-xs font-bold text-[#4d7a5d] hover:underline">
                    Forgot your password?
                  </button>
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="login-submit w-full h-11 border border-pine bg-pine text-white rounded-[10px] font-bold text-xs mt-1.5 flex items-center justify-center gap-2 hover:bg-pine-deep disabled:opacity-60 disabled:cursor-wait transition-colors"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Please wait...
                  </>
                ) : (
                  <>{copy.submit}</>
                )}
              </button>
            </form>
            
            <p className="login-notice text-xs text-[#6b776e] leading-[1.7] mt-4 text-center">
              {mode === "signin" ? (
                <>Don't have an account? <button type="button" onClick={() => switchMode("signup")} className="text-[#4d7a5d] font-bold hover:underline">Create one now</button></>
              ) : (
                <>{mode === "reset" ? "Remembered it?" : "Already have an account?"} <button type="button" onClick={() => switchMode("signin")} className="text-[#4d7a5d] font-bold hover:underline">Back to sign in</button></>
              )}
            </p>
            
            <div className="login-legal text-xs text-[#5f6b64] text-center mt-6">
              Your email is used for sign-in and is not displayed in recommendations.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
