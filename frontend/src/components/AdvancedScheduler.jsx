import { useState } from 'react';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth.jsx';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

export default function AdvancedScheduler() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState({});
  const [view, setView] = useState('week');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const toggleSlot = (day, hour) => {
    setSchedule((previous) => {
      const key = `${day}-${hour}`;
      const next = { ...previous };
      if (next[key]) delete next[key];
      else next[key] = true;
      return next;
    });
  };

  const saveSchedule = async () => {
    if (!user || saving) return;
    setSaving(true);
    setMessage('');
    try {
      const availabilityRef = collection(db, 'users', user.uid, 'availability');
      const existing = await getDocs(availabilityRef);
      const batch = writeBatch(db);
      existing.docs.forEach((slot) => batch.delete(slot.ref));

      Object.keys(schedule).forEach((key) => {
        const [day, hour] = key.split('-');
        const startHour = Number.parseInt(hour, 10);
        batch.set(doc(availabilityRef), {
          dayOfWeek: day.slice(0, 3),
          startTime: hour,
          endTime: `${String(Math.min(startHour + 1, 23)).padStart(2, '0')}:00`,
        });
      });

      await batch.commit();
      setMessage('Availability saved.');
    } catch (error) {
      console.error('Save schedule error:', error);
      setMessage('Availability could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const visibleDays = DAYS.slice(0, view === 'week' ? 7 : 1);

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-lg font-semibold text-neutral-900">Availability Scheduler</h3>
        <div className="flex gap-2" role="group" aria-label="Calendar view">
          <button type="button" onClick={() => setView('week')} aria-pressed={view === 'week'} className={view === 'week' ? 'btn-primary text-sm' : 'btn-secondary text-sm'}>Week View</button>
          <button type="button" onClick={() => setView('day')} aria-pressed={view === 'day'} className={view === 'day' ? 'btn-primary text-sm' : 'btn-secondary text-sm'}>Day View</button>
        </div>
      </div>

      {message && <p className="text-sm text-muted" role="status" aria-live="polite">{message}</p>}

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full min-w-[620px]">
          <div className="grid grid-cols-8 gap-1">
            <div className="p-2" aria-hidden="true" />
            {visibleDays.map((day) => <div key={day} className="p-2 text-center font-medium text-sm text-neutral-700 bg-neutral-50 rounded">{day.slice(0, 3)}</div>)}
          </div>
          {HOURS.slice(8, 22).map((hour) => (
            <div key={hour} className="grid grid-cols-8 gap-1 mt-1">
              <div className="p-2 text-xs text-neutral-600 text-right pr-3">{hour}</div>
              {visibleDays.map((day) => {
                const key = `${day}-${hour}`;
                const selected = Boolean(schedule[key]);
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => toggleSlot(day, hour)}
                    aria-label={`${day} ${hour}`}
                    aria-pressed={selected}
                    className={`p-2 rounded transition-colors ${selected ? 'bg-primary-600 hover:bg-primary-700' : 'bg-neutral-100 hover:bg-neutral-200'}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <button type="button" onClick={saveSchedule} disabled={saving} className="btn-primary w-full">
        {saving ? 'Saving…' : 'Save Availability'}
      </button>
    </div>
  );
}
