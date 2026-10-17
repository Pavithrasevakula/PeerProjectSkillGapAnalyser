import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

const AUTH_MESSAGES = {
  "auth/invalid-credential": "The email or password is incorrect.",
  "auth/invalid-login-credentials": "The email or password is incorrect.",
  "auth/email-already-in-use": "An account already exists with this email.",
  "auth/weak-password": "Use a password with at least six characters.",
  "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
};

function authErrorMessage(error) {
  return AUTH_MESSAGES[error?.code] || "Unable to complete authentication. Please try again.";
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/");
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7f3] grid place-items-center p-6">
      <div className="login-wrap w-full max-w-[980px] min-h-[560px] grid lg:grid-cols-[1.05fr_.95fr] bg-white border border-[#e5eae4] rounded-[24px] overflow-hidden shadow-[0_20px_70px_rgba(35,68,47,.07)]">
        
        {/* Left Story Section */}
        <section className="login-story p-12 lg:px-11 lg:py-12 bg-[#eaf1eb] relative overflow-hidden flex flex-col justify-between">
          {/* Decorative Circles */}
          <div className="absolute right-[-130px] top-[90px] w-[360px] h-[360px] border border-[#d0dfd1] rounded-full pointer-events-none" />
          <div className="absolute right-[-38px] top-[130px] w-[270px] h-[430px] border border-[#d0dfd1] rounded-full rotate-[30deg] pointer-events-none" />
          
          <div className="relative z-10">
            <Link to="/" className="login-mark flex items-center gap-2.5 text-pine no-underline mb-14">
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
              <h1 className="text-[37px] leading-[1.18] tracking-[-1.7px] my-3.5 text-[#273a30]">
                Your next great team starts with <em className="not-italic text-[#4d8063]">complementarity.</em>
              </h1>
              <p className="text-[13px] leading-[1.8] text-[#74877a] max-w-[340px]">
                A space to find collaborators who add strengths, cover gaps, and help turn good project ideas into balanced teams.
              </p>
              
              <div className="mini-benefits flex flex-col gap-3.5 mt-7">
                <div className="mini-benefit flex items-center gap-2.5 text-[11px] text-[#526d59]">
                  <span className="w-[23px] h-[23px] bg-[#d9e8db] text-[#487455] rounded-lg grid place-items-center font-extrabold">✓</span>
                  Match on skills, roles and availability
                </div>
                <div className="mini-benefit flex items-center gap-2.5 text-[11px] text-[#526d59]">
                  <span className="w-[23px] h-[23px] bg-[#d9e8db] text-[#487455] rounded-lg grid place-items-center font-extrabold">✓</span>
                  Understand why a teammate is recommended
                </div>
                <div className="mini-benefit flex items-center gap-2.5 text-[11px] text-[#526d59]">
                  <span className="w-[23px] h-[23px] bg-[#d9e8db] text-[#487455] rounded-lg grid place-items-center font-extrabold">✓</span>
                  Track projects and applications in one place
                </div>
              </div>
            </div>
          </div>
          
          <div className="story-foot text-[10px] text-[#89998d] relative z-10 mt-11">
            TeamSync · Student project collaboration
          </div>
        </section>

        {/* Right Form Section */}
        <section className="login-form-area flex items-center justify-center px-10 py-11">
          <div className="login-form-inner w-full max-w-[330px]">
            <div className="login-kicker text-[10px] tracking-[1.4px] text-[#6c8b79] font-extrabold">
              Welcome to TeamSync
            </div>
            <h2 className="font-display text-[25px] tracking-[-0.8px] mt-2 mb-1.5 text-[#293a30]">
              {isSignUp ? 'Create your workspace' : 'Sign in to your workspace'}
            </h2>
            <p className="login-desc text-[11px] text-[#89948c] leading-[1.7] mb-7">
              {isSignUp 
                ? 'Create an account to start building your team and exploring projects.' 
                : 'Enter your email and password to access your projects and team workspace.'}
            </p>
            
            {error && (
              <div className="login-message-box show error bg-[#f8eae8] text-[#a34d45] text-[11px] rounded-[9px] px-3 py-2.5 mb-3.5 leading-[1.6]">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <label className="login-field flex flex-col gap-1.5 text-[#617166] text-[11px] font-bold mb-3.5">
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
              
              <label className="login-field flex flex-col gap-1.5 text-[#617166] text-[11px] font-bold mb-3.5">
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength="6"
                  className="w-full h-[45px] border border-[#dfe6de] rounded-[10px] px-3 text-xs font-normal outline-0 focus:border-[#739d7c] focus:shadow-[0_0_0_3px_#eef5ee] transition-all"
                  placeholder="••••••••"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                />
              </label>
              
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
                  <>
                    {isSignUp ? 'Create account and start' : 'Sign in to workspace'}
                  </>
                )}
              </button>
            </form>
            
            <p className="login-notice text-[10px] text-[#909a92] leading-[1.7] mt-4 text-center">
              {isSignUp ? (
                <>Already have an account? <button type="button" onClick={() => setIsSignUp(false)} className="text-[#5c8065] font-bold hover:underline">Sign in instead</button></>
              ) : (
                <>Don't have an account? <button type="button" onClick={() => setIsSignUp(true)} className="text-[#5c8065] font-bold hover:underline">Create one now</button></>
              )}
            </p>
            
            <div className="login-legal text-[9px] text-[#a1aaa1] text-center mt-6">
              Your email is used for sign-in and is not displayed in recommendations.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
