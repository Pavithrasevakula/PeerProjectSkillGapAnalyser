import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

function calculateOverlap(members) {
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);
  
  const overlapGrid = {};
  
  DAYS.forEach(day => {
    HOURS.forEach(hour => {
      const key = `${day}-${hour}`;
      overlapGrid[key] = 0;
    });
  });

  members.forEach(member => {
    if (member.availability) {
      member.availability.forEach(slot => {
        const day = slot.dayOfWeek || slot.day;
        const hour = parseInt(slot.startTime, 10);
        const key = `${day === day?.slice(0, 3) ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].find((fullDay) => fullDay.startsWith(day)) || day : day}-${hour}`;
        if (overlapGrid[key] !== undefined) {
          overlapGrid[key]++;
        }
      });
    }
  });

  return {
    grid: overlapGrid,
    maxOverlap: Math.max(...Object.values(overlapGrid), 1)
  };
}

export default function TeamOverlapVisualizer({ projectId }) {
  const [overlap, setOverlap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const membersSnap = await getDocs(collection(db, 'projects', projectId, 'teamMembers'));
        const members = await Promise.all(membersSnap.docs.map(async (memberDoc) => {
          const member = memberDoc.data();
          const availabilitySnap = await getDocs(collection(db, 'users', member.profileId || memberDoc.id, 'availability'));
          return { ...member, availability: availabilitySnap.docs.map((slotDoc) => slotDoc.data()) };
        }));
        if (!cancelled) setOverlap(calculateOverlap(members));
      } catch (err) {
        console.error('Load overlap error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId]);
  if (loading) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Availability Overlap</h3>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!overlap) return null;

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Availability Overlap</h3>
      <p className="text-sm text-gray-600 mb-4">Darker colors indicate more team members available</p>
      
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="grid grid-cols-8 gap-1">
            <div className="p-2"></div>
            {DAYS.map(day => (
              <div key={day} className="p-2 text-center text-xs font-medium text-gray-700">
                {day}
              </div>
            ))}
          </div>

          {HOURS.map(hour => (
            <div key={hour} className="grid grid-cols-8 gap-1 mt-1">
              <div className="p-2 text-xs text-gray-600 text-right">{hour}:00</div>
              {DAYS.map((day, i) => {
                const fullDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i];
                const key = `${fullDay}-${hour}`;
                const count = overlap.grid[key] || 0;
                const opacity = count / overlap.maxOverlap;
                
                return (
                  <div
                    key={key}
                    className="p-2 rounded"
                    style={{
                      backgroundColor: count > 0 ? `rgba(139, 92, 246, ${0.2 + opacity * 0.8})` : '#f3f4f6'
                    }}
                    title={`${count} member${count !== 1 ? 's' : ''} available`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
