import { Link } from "react-router-dom";
import { collection, collectionGroup, doc, query, where } from "firebase/firestore";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { db } from "../firebase";
import { useAuth } from "../auth.jsx";
import { useLive } from "../hooks";
import { useMemo } from "react";

export default function Dashboard() {
  const { user, account } = useAuth();
  const uid = user.uid;
  const mine = useLive(() => query(collection(db, "projects"), where("ownerUserId", "==", uid)), [uid]).data;
  const overview = useLive(() => doc(db, "analytics", "teamBalanceOverview"), []).data;
  const demand = useLive(() => doc(db, "analytics", "skillDemand"), []).data;
  
  // Simplified queries without composite indexes
  const teams = useLive(() => query(collectionGroup(db, "teamMembers"), where("profileId", "==", uid)), [uid]).data || [];
  const applications = useLive(() => query(collectionGroup(db, "applications"), where("profileId", "==", uid)), [uid]).data || [];
  const notes = useLive(() => collection(db, "users", uid, "notifications"), [uid]).data || [];

  // Count only projects showing user's actual name (not demo projects)
  const myProjects = mine?.filter(p => p.ownerName && account?.fullName && p.ownerName === account.fullName) || [];
  
  // Sort client-side
  const sortedTeams = useMemo(() => [...teams].sort((a, b) => {
    const aTime = a.joinedAt?.toMillis?.() || 0;
    const bTime = b.joinedAt?.toMillis?.() || 0;
    return bTime - aTime;
  }), [teams]);

  const sortedApplications = useMemo(() => [...applications].sort((a, b) => {
    const aTime = a.appliedAt?.toMillis?.() || 0;
    const bTime = b.appliedAt?.toMillis?.() || 0;
    return bTime - aTime;
  }), [applications]);

  const sortedNotes = useMemo(() => [...notes].sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  }), [notes]);

  const demandData = Object.entries(demand?.demand || {}).map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count).slice(0, 10);

  const pendingApps = sortedApplications.filter(a => a.status === "Pending").length;
  const acceptedApps = sortedApplications.filter(a => a.status === "Accepted").length;

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Welcome back! Here's an overview of your activity</p>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">My Projects</div>
          <div className="stat-card-value">{myProjects?.length || 0}</div>
          <div className="stat-card-subtitle">Projects you own</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Teams Joined</div>
          <div className="stat-card-value">{teams.length}</div>
          <div className="stat-card-subtitle">Active memberships</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Applications</div>
          <div className="stat-card-value">{applications.length}</div>
          <div className="stat-card-subtitle">{pendingApps} pending • {acceptedApps} accepted</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Avg Team Balance</div>
          <div className="stat-card-value">{overview ? Math.round(overview.averageTBI) : "-"}%</div>
          <div className="stat-card-subtitle">Across {overview?.teamsCounted ?? 0} teams</div>
        </div>
      </div>

      <div className="grid two">
        <section className="card">
          <h2>My Projects</h2>
          <p className="muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
            Projects you own and can manage
          </p>
          {mine === undefined && <p className="muted">Loading...</p>}
          {myProjects?.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <p className="muted">You haven't created any projects yet.</p>
              <Link to="/projects/new">
                <button style={{ marginTop: '1rem' }}>Create Your First Project</button>
              </Link>
            </div>
          )}
          <ul className="plain">{myProjects?.map((p) => (
            <li key={p.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
              <Link to={`/projects/${p.id}`} style={{ fontWeight: 500, fontSize: '1rem' }}>{p.title}</Link>
              <div style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>
                <span className="badge" style={{ fontSize: '0.75rem' }}>{p.status}</span>
                <span className="muted"> • Team {p.team?.teamSize ?? 0}/{p.teamSizeRequired}</span>
                {p.team?.teamBalanceIndex != null && (
                  <span className="muted"> • TBI {Math.round(p.team.teamBalanceIndex)}%</span>
                )}
              </div>
            </li>
          ))}</ul>
        </section>
        
        <section className="card">
          <h2>My Teams & Applications</h2>
          <p className="muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
            Projects you've joined or applied to
          </p>
          {!sortedTeams.length && !sortedApplications.length && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <p className="muted">No teams or applications yet.</p>
              <Link to="/projects">
                <button style={{ marginTop: '1rem' }}>Browse Projects</button>
              </Link>
            </div>
          )}
          <ul className="plain">
            {sortedTeams.map((t) => (
              <li key={`m-${t.projectId}`} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                    MEMBER
                  </span>
                  <Link to={`/projects/${t.projectId}`} style={{ fontWeight: 500 }}>Team project</Link>
                </div>
                <p className="muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  Role: {t.assignedRoleName || 'Member'}{t.isTeamLead && ' (Lead)'}
                </p>
              </li>
            ))}
            {sortedApplications.map((a) => (
              <li key={`a-${a.projectId}`} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ 
                    background: a.status === 'Pending' ? 'var(--warning-light)' : a.status === 'Accepted' ? 'var(--success-light)' : 'var(--danger-light)',
                    color: a.status === 'Pending' ? 'var(--warning)' : a.status === 'Accepted' ? 'var(--success)' : 'var(--danger)',
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem', 
                    fontWeight: 600 
                  }}>
                    {a.status.toUpperCase()}
                  </span>
                  <Link to={`/projects/${a.projectId}`} style={{ fontWeight: 500 }}>Application</Link>
                </div>
                <p className="muted" style={{ fontSize: '0.875rem' }}>
                  Match score: {Math.round(a.matchScore)}%
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card">
        <h2>Most In-Demand Skills</h2>
        <p className="muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
          Top skills requested across all open projects
        </p>
        {demandData.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={demandData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="skill" interval={0} angle={-25} textAnchor="end" height={70} style={{ fontSize: '0.875rem' }} />
              <YAxis allowDecimals={false} style={{ fontSize: '0.875rem' }} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
            No skill demand data available yet. Data will appear as projects are created.
          </p>
        )}
      </section>

      <section className="card">
        <h2>Notifications</h2>
        <p className="muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
          Recent updates and activity
        </p>
        {!sortedNotes.length && (
          <p className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
            No notifications yet. You'll receive updates about your applications and team activities here.
          </p>
        )}
        <ul className="plain">
          {sortedNotes.map((n) => (
            <li key={n.id} style={{ padding: '0.75rem', background: n.read ? 'transparent' : 'var(--accent-light)', borderRadius: '6px', marginBottom: '0.5rem' }}>
              <p style={{ margin: 0, fontWeight: n.read ? 400 : 500 }}>{n.message}</p>
              {n.createdAt && (
                <p className="muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {n.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
