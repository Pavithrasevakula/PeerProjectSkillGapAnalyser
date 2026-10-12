import { useEffect, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "../firebase";

export default function DiagnosticDebug() {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Get one project
        const projectsQuery = query(collection(db, "projects"), limit(1));
        const projectsSnapshot = await getDocs(projectsQuery);
        
        if (!projectsSnapshot.empty) {
          const doc = projectsSnapshot.docs[0];
          const data = doc.data();
          setProject({
            id: doc.id,
            ...data
          });
          
          console.log('=== RAW FIRESTORE DATA ===');
          console.log('Document ID:', doc.id);
          console.log('Full data:', data);
          console.log('requiredRoles:', data.requiredRoles);
          console.log('requiredSkills:', data.requiredSkills);
          console.log('requiredRoles type:', typeof data.requiredRoles);
          console.log('requiredSkills type:', typeof data.requiredSkills);
          if (Array.isArray(data.requiredRoles)) {
            console.log('First role:', data.requiredRoles[0]);
          }
          if (Array.isArray(data.requiredSkills)) {
            console.log('First skill:', data.requiredSkills[0]);
          }
          console.log('=========================');
        }
      } catch (err) {
        console.error('Error fetching:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  if (loading) return <div className="card"><h1>Loading diagnostic data...</h1></div>;
  if (error) return <div className="card"><h1>Error</h1><p className="error">{error}</p></div>;
  if (!project) return <div className="card"><h1>No project found</h1></div>;

  return (
    <div className="card" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Diagnostic Debug Page</h1>
      <p className="muted">Check browser console for detailed logs</p>
      
      <h2>Project: {project.title}</h2>
      
      <h3>Required Roles</h3>
      <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
        {JSON.stringify(project.requiredRoles, null, 2)}
      </pre>
      
      <h3>Required Skills</h3>
      <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
        {JSON.stringify(project.requiredSkills, null, 2)}
      </pre>
      
      <h3>Rendered Roles (like in UI)</h3>
      <div className="chips-inline" style={{ marginTop: '0.5rem' }}>
        {project.requiredRoles?.map((r, idx) => (
          <span key={idx} style={{ padding: '0.5rem 1rem', background: 'var(--accent-light)', borderRadius: '6px' }}>
            {r.roleName} × {r.slots}
          </span>
        ))}
      </div>
      
      <h3>Rendered Skills (like in UI)</h3>
      <div className="chips-inline" style={{ marginTop: '0.5rem' }}>
        {project.requiredSkills?.map((s, idx) => (
          <span key={idx} style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
            {s.skillName} (L{s.minProficiency})
          </span>
        ))}
      </div>
      
      <h3>Full Project Data</h3>
      <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px', overflow: 'auto', maxHeight: '400px' }}>
        {JSON.stringify(project, (key, value) => {
          // Handle Firestore Timestamps
          if (value && typeof value === 'object' && value.seconds) {
            return new Date(value.seconds * 1000).toISOString();
          }
          return value;
        }, 2)}
      </pre>
    </div>
  );
}
