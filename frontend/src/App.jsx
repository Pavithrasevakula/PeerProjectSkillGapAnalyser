import { Link, Navigate, Route, Routes } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { useAuth } from "./auth.jsx";
import { ensureDataInitialized } from "./init.js";
import { useEffect, useState } from "react";
import Login from "./pages/Login.jsx";
import Profile from "./pages/Profile.jsx";
import Projects from "./pages/Projects.jsx";
import NewProject from "./pages/NewProject.jsx";
import ProjectDetail from "./pages/ProjectDetail.jsx";
import Dashboard from "./pages/Dashboard.jsx";

function Protected({ children }) {
  const { user, account, loading } = useAuth();
  
  useEffect(() => {
    if (user) {
      ensureDataInitialized();
    }
  }, [user]);
  
  if (loading) return <p className="muted center" style={{ padding: '3rem' }}>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  
  // Check if profile is incomplete (missing department)
  const isProfileIncomplete = account && (!account.profile?.department || !account.profile?.department.trim());
  const currentPath = window.location.pathname;
  
  // Redirect to profile if incomplete, but allow access to profile page itself and sign out
  if (isProfileIncomplete && currentPath !== '/profile' && currentPath !== '/login') {
    return <Navigate to="/profile" replace />;
  }
  
  return children;
}

function Nav() {
  const { user, account } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.user-menu')) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);
  
  if (!user) return null;
  
  // Extract first name from full name, or use email username as fallback
  const getDisplayName = () => {
    if (account?.fullName) {
      const firstName = account.fullName.trim().split(' ')[0];
      return firstName;
    }
    // Fallback to email username (part before @)
    return user.email?.split('@')[0] || "User";
  };
  
  const displayName = getDisplayName();
  
  return (
    <nav>
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" opacity="0.3"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>TeamSync</span>
        </Link>
        <div className="nav-links">
          <Link to="/">Projects</Link>
          <Link to="/projects/new">New project</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/profile">Profile</Link>
        </div>
        <div className="nav-actions">
          <div className="user-menu">
            <button 
              className="user-dropdown-trigger" 
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="user-avatar">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="user-name">{displayName}</span>
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                style={{ transition: 'transform 0.2s ease', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            
            {dropdownOpen && (
              <div className="user-dropdown-menu">
                <button 
                  onMouseDown={(e) => {
                    e.preventDefault();
                    signOut(auth);
                  }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Protected><Projects /></Protected>} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />
          <Route path="/projects/new" element={<Protected><NewProject /></Protected>} />
          <Route path="/projects/:id" element={<Protected><ProjectDetail /></Protected>} />
          <Route path="/projects/:id/edit" element={<Protected><NewProject /></Protected>} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
