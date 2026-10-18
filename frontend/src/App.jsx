import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { useAuth } from "./auth.jsx";
import { ensureDataInitialized } from "./init.js";
import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { displayName, firstName } from "./lib/names";
import { titleForPath } from "./lib/routeTitles";

// Lazy load pages for code splitting
const Login = lazy(() => import("./pages/Login.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const Projects = lazy(() => import("./pages/Projects.jsx"));
const NewProject = lazy(() => import("./pages/NewProject.jsx"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const TeamLab = lazy(() => import("./pages/TeamLab.jsx"));

// Components (keep non-lazy for instant load)
import PWAInstallPrompt from "./components/PWAInstallPrompt.jsx";
import PwaStatus from "./components/PwaStatus.jsx";
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

// Loading fallback component
function PageLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-pine border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted">Loading...</p>
      </div>
    </div>
  );
}

function Protected({ children }) {
  const { user, account, loading, authError } = useAuth();
  
  useEffect(() => {
    if (user) {
      ensureDataInitialized();
    }
  }, [user]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper" role="status" aria-live="polite">
        <div className="w-8 h-8 border-2 border-pine border-t-transparent rounded-full animate-spin" />
        <span className="sr-only">Loading your workspace</span>
      </div>
    );
  }
  
  if (authError && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper px-4">
        <div className="panel max-w-md p-6 text-center">
          <h1 className="font-display text-xl font-bold text-ink">Workspace unavailable</h1>
          <p className="text-sm text-muted mt-2">We could not load your account. Check your connection and reload the page.</p>
          <button type="button" onClick={() => window.location.reload()} className="btn btn-primary mt-5">Reload</button>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  
  const isProfileIncomplete = !account?.profile?.department?.trim();
  const currentPath = window.location.pathname;
  
  if (isProfileIncomplete && currentPath !== '/profile' && currentPath !== '/login') {
    return <Navigate to="/profile" replace />;
  }
  
  return children;
}

function Sidebar() {
  const location = useLocation();
  const { user, account } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [desktopAccountOpen, setDesktopAccountOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const accountTriggerRef = useRef(null);
  const desktopAccountMenuRef = useRef(null);
  const desktopAccountTriggerRef = useRef(null);

  // Close both account menus whenever the route changes (state adjusted during render).
  const [menuPath, setMenuPath] = useState(location.pathname);
  if (menuPath !== location.pathname) {
    setMenuPath(location.pathname);
    setAccountOpen(false);
    setDesktopAccountOpen(false);
  }

  useEffect(() => {
    if (!accountOpen && !desktopAccountOpen) return undefined;

    const closeOnOutsidePress = (event) => {
      if (accountOpen && !accountMenuRef.current?.contains(event.target)) setAccountOpen(false);
      if (desktopAccountOpen && !desktopAccountMenuRef.current?.contains(event.target)) setDesktopAccountOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      if (accountOpen) {
        setAccountOpen(false);
        accountTriggerRef.current?.focus();
      }
      if (desktopAccountOpen) {
        setDesktopAccountOpen(false);
        desktopAccountTriggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountOpen, desktopAccountOpen]);
  
  const navItems = [
    { 
      path: '/dashboard', 
      label: 'Overview', 
      icon: (
        <svg viewBox="0 0 24 24" className="w-[19px] h-[19px]" fill="none" stroke="currentColor" strokeWidth={1.7}>
          <rect x="3" y="3" width="7" height="7" rx="1.5"/>
          <rect x="14" y="3" width="7" height="4" rx="1.5"/>
          <rect x="14" y="10" width="7" height="11" rx="1.5"/>
          <rect x="3" y="13" width="7" height="8" rx="1.5"/>
        </svg>
      )
    },
    { 
      path: '/', 
      label: 'Explore projects', 
      icon: (
        <svg viewBox="0 0 24 24" className="w-[19px] h-[19px]" fill="none" stroke="currentColor" strokeWidth={1.7}>
          <rect x="3" y="4" width="18" height="16" rx="2"/>
          <path d="M3 9h18M8 4v5"/>
        </svg>
      )
    },
    { 
      path: '/projects/new', 
      label: 'Create project', 
      icon: (
        <svg viewBox="0 0 24 24" className="w-[19px] h-[19px]" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14"/>
          <circle cx="12" cy="12" r="9"/>
        </svg>
      )
    },
    { 
      path: '/profile', 
      label: 'My profile', 
      icon: (
        <svg viewBox="0 0 24 24" className="w-[19px] h-[19px]" fill="none" stroke="currentColor" strokeWidth={1.7}>
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 21c.6-4.3 3.3-6.5 8-6.5s7.4 2.2 8 6.5"/>
        </svg>
      )
    },
    { 
      path: '/team-lab', 
      label: 'Team Lab', 
      icon: (
        <svg viewBox="0 0 24 24" className="w-[19px] h-[19px]" fill="none" stroke="currentColor" strokeWidth={1.7}>
          <circle cx="8" cy="8" r="3"/>
          <circle cx="17" cy="9" r="2.5"/>
          <path d="M2 20c.4-3.5 2.4-5.3 6-5.3s5.6 1.8 6 5.3M14 15c3.5-.3 5.4 1.4 6 4"/>
        </svg>
      )
    },
  ];
  
  const getDisplayName = () => displayName(account, user);
  const getFirstName = () => firstName(account, user);

  const handleSignOut = async () => {
    setAccountOpen(false);
    setDesktopAccountOpen(false);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };
  
  const getHeadline = () => {
    if (account?.profile?.headline) {
      return account.profile.headline;
    }
    return "Add your skills";
  };
  
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar fixed inset-y-0 left-0 w-[248px] bg-white border-r border-line px-4 pt-[26px] pb-[18px] hidden lg:flex flex-col z-20">
        <Link to="/" className="brand flex items-center gap-[11px] px-[10px] pb-[31px] no-underline text-ink">
          <span className="brand-mark w-[38px] h-[38px] rounded-xl bg-pine text-white grid place-items-center">
            <svg viewBox="0 0 36 36" className="w-[29px] h-[29px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18.5 15 24l12-13" strokeWidth="3"/>
              <circle cx="18" cy="18" r="15"/>
            </svg>
          </span>
          <span>
            <strong className="block font-display text-[19px] tracking-[-0.8px] leading-[1.2]">
              Team<span className="text-pine-mid">Sync</span>
            </strong>
            <small className="block text-[#5f6b64] text-xs tracking-[0.35px] mt-1">Project workspace</small>
          </span>
        </Link>

        <div className="nav-label px-3 pb-[11px]">WORKSPACE</div>
        
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
                           (item.path === '/' && location.pathname.startsWith('/projects') && 
                            location.pathname !== '/projects/new' && 
                            location.pathname !== '/dashboard' && 
                            location.pathname !== '/team-lab');
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <div className="tip-card bg-[#f5f7f3] border border-[#edf0ea] rounded-[14px] px-[14px] pt-[15px] pb-[14px] mx-[3px] mb-4">
            <span className="tip-symbol w-7 h-7 bg-[#e0ebe3] text-pine grid place-items-center rounded-[9px] mb-2.5">
              <svg viewBox="0 0 24 24" className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1"/>
                <circle cx="12" cy="12" r="5"/>
              </svg>
            </span>
            <strong className="block text-xs text-[#34473e]">Better teams, by design.</strong>
            <p className="text-xs leading-[1.6] text-[#5f6b64] mt-[5px] mb-0">Fill the gaps. Share the spotlight. Build something useful together.</p>
          </div>
          
          <div ref={desktopAccountMenuRef} className="relative border-t border-line pt-3">
            <button
              ref={desktopAccountTriggerRef}
              id="desktop-account-trigger"
              type="button"
              onClick={() => setDesktopAccountOpen((open) => !open)}
              className="desktop-account-trigger flex min-h-[52px] w-full min-w-0 flex-col justify-center rounded-[10px] border-0 bg-transparent px-2.5 py-2 text-left hover:bg-[#f5f7f3]"
              aria-expanded={desktopAccountOpen}
              aria-controls="desktop-account-panel"
            >
              <strong className="block max-w-full truncate text-xs text-ink">{getFirstName()}</strong>
              <small className="mt-0.5 block max-w-full truncate text-xs text-[#5f6b64]">{getHeadline()}</small>
              <span className="sr-only">Account menu</span>
            </button>
            {desktopAccountOpen && (
              <div
                id="desktop-account-panel"
                className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-40 overflow-hidden rounded-xl border border-line bg-white p-1.5 shadow-[0_12px_32px_rgba(25,48,38,.16)]"
                aria-labelledby="desktop-account-trigger"
              >
                <div className="border-b border-line px-3 py-2.5">
                  <strong className="block truncate text-xs text-ink">{getDisplayName()}</strong>
                  <small className="mt-0.5 block truncate text-xs text-muted">{user.email}</small>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setDesktopAccountOpen(false)}
                  className="mt-1 block rounded-lg px-3 py-2.5 text-xs font-bold text-[#52635a] no-underline hover:bg-[#f4f7f3]"
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="block w-full rounded-lg border-0 bg-transparent px-3 py-2.5 text-left text-xs font-bold text-danger hover:bg-[#f9efed]"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="mobile-topbar h-[62px] bg-white border-b border-line flex items-center justify-between px-[17px] lg:hidden">
        <Link to="/" className="brand flex items-center gap-2 no-underline text-ink">
          <span className="brand-mark w-8 h-8 rounded-[10px] bg-pine text-white grid place-items-center">
            <svg viewBox="0 0 36 36" className="w-[25px] h-[25px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18.5 15 24l12-13" strokeWidth="3"/>
              <circle cx="18" cy="18" r="15"/>
            </svg>
          </span>
          <strong className="font-display text-[17px] tracking-[-0.6px]">
            Team<span className="text-pine-mid">Sync</span>
          </strong>
        </Link>
        <div ref={accountMenuRef} className="relative min-w-0">
          <button
            ref={accountTriggerRef}
            id="mobile-account-trigger"
            type="button"
            onClick={() => setAccountOpen((open) => !open)}
            className="mobile-account-trigger h-10 max-w-[132px] inline-flex items-center rounded-[10px] border border-line bg-white px-3 text-[12px] font-bold text-pine hover:bg-[#f5f7f3] transition-colors"
            aria-label={`Account menu for ${getDisplayName()}`}
            aria-expanded={accountOpen}
            aria-controls="mobile-account-panel"
          >
            <span className="truncate">{getFirstName()}</span>
          </button>
          {accountOpen && (
            <div
              id="mobile-account-panel"
              className="absolute right-0 top-[calc(100%+8px)] z-40 w-[190px] max-w-[calc(100vw-32px)] overflow-hidden rounded-xl border border-line bg-white p-1.5 shadow-[0_12px_32px_rgba(25,48,38,.16)]"
              aria-labelledby="mobile-account-trigger"
            >
              <div className="border-b border-line px-3 py-2.5">
                <strong className="block truncate text-xs text-ink">{getDisplayName()}</strong>
                <small className="mt-0.5 block truncate text-xs text-muted">{user.email}</small>
              </div>
              <Link
                to="/profile"
                onClick={() => setAccountOpen(false)}
                className="mt-1 block rounded-lg px-3 py-2.5 text-xs font-bold text-[#52635a] no-underline hover:bg-[#f4f7f3]"
              >
                Profile
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="block w-full rounded-lg border-0 bg-transparent px-3 py-2.5 text-left text-xs font-bold text-danger hover:bg-[#f9efed]"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav 
        className="mobile-bottom-nav fixed bottom-0 left-0 right-0 bg-white border-t-2 border-line h-[72px] px-1 lg:hidden z-30 safe-area-bottom"
        role="navigation"
        aria-label="Mobile navigation"
      >
        {[
          { 
            path: '/dashboard', 
            label: 'Home',
            ariaLabel: 'Navigate to dashboard home',
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                <rect x="14" y="3" width="7" height="4" rx="1.5"/>
                <rect x="14" y="10" width="7" height="11" rx="1.5"/>
                <rect x="3" y="13" width="7" height="8" rx="1.5"/>
              </svg>
            )
          },
          { 
            path: '/', 
            label: 'Projects',
            ariaLabel: 'Browse projects',
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <rect x="3" y="4" width="18" height="16" rx="2"/>
                <path d="M3 9h18M8 4v5"/>
              </svg>
            )
          },
          { 
            path: '/projects/new', 
            label: 'Create',
            ariaLabel: 'Create new project',
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14"/>
                <circle cx="12" cy="12" r="9"/>
              </svg>
            )
          },
          { 
            path: '/team-lab', 
            label: 'Lab',
            ariaLabel: 'Open Team Lab',
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <circle cx="8" cy="8" r="3"/>
                <circle cx="17" cy="9" r="2.5"/>
                <path d="M2 20c.4-3.5 2.4-5.3 6-5.3s5.6 1.8 6 5.3M14 15c3.5-.3 5.4 1.4 6 4"/>
              </svg>
            )
          },
          { 
            path: '/profile', 
            label: 'Profile',
            ariaLabel: 'View your profile',
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 21c.6-4.3 3.3-6.5 8-6.5s7.4 2.2 8 6.5"/>
              </svg>
            )
          },
        ].map((item) => {
          const isActive = location.pathname === item.path || 
                         (item.path === '/' && location.pathname.startsWith('/projects') && 
                          location.pathname !== '/projects/new' && 
                          location.pathname !== '/dashboard' && 
                          location.pathname !== '/team-lab');
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center gap-1 py-2 px-2 min-w-0 no-underline relative flex-1"
              aria-label={item.ariaLabel}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && <div className="nav-active-indicator" aria-hidden="true"></div>}
              <div className={`w-[26px] h-[26px] flex items-center justify-center transition-colors ${isActive ? 'text-pine' : 'text-[#5f6b64]'}`}>
                {item.icon}
              </div>
              <span className={`text-xs font-bold transition-colors ${isActive ? 'text-pine' : 'text-[#5f6b64]'}`}>
                {item.label}
              </span>

            </Link>
          );
        })}
      </nav>
    </>
  );
}

// Updates the document title on navigation and moves focus to the main region
// (after the first render) so keyboard and screen-reader users land on the new page.
function RouteAnnouncer({ mainRef }) {
  const { pathname } = useLocation();
  const firstRender = useRef(true);

  useEffect(() => {
    document.title = titleForPath(pathname);
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [pathname, mainRef]);

  return null;
}

function LoginRoute() {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}

export default function App() {
  const location = useLocation();
  const { user } = useAuth();
  const mainRef = useRef(null);
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="app-shell min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-pine focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        Skip to main content
      </a>
      <RouteAnnouncer mainRef={mainRef} />
      {user && !isLoginPage && <Sidebar />}
      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className={`outline-none ${user && !isLoginPage ? "main-area ml-0 lg:ml-[248px] min-h-screen pb-[72px] lg:pb-0" : "min-h-screen"}`}
      >
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/" element={<Protected><Projects /></Protected>} />
            <Route path="/profile" element={<Protected><Profile /></Protected>} />
            <Route path="/projects/new" element={<Protected><NewProject /></Protected>} />
            <Route path="/projects/:id" element={<Protected><ProjectDetail /></Protected>} />
            <Route path="/projects/:id/edit" element={<Protected><NewProject /></Protected>} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/team-lab" element={<Protected><TeamLab /></Protected>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <PwaStatus />
      {user && !isLoginPage && <PWAInstallPrompt />}
    </div>
  );
}
