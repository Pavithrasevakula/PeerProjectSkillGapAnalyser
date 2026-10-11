import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";

/** rows: [{ skill, required, covered, projected? }] - levels on a 0-5 scale (FR-16). */
export default function SkillRadar({ rows, showProjected = false }) {
  if (!rows?.length) return <p className="muted">No required skills defined.</p>;
  return (
    <ResponsiveContainer width="100%" height={340}>
      <RadarChart data={rows} outerRadius="70%">
        <PolarGrid />
        <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 5]} tickCount={6} />
        <Radar name="Required" dataKey="required" stroke="#d9480f" fill="#d9480f" fillOpacity={0.12} />
        <Radar name="Covered" dataKey="covered" stroke="#1971c2" fill="#1971c2" fillOpacity={0.35} />
        {showProjected && (
          <Radar name="With candidate" dataKey="projected" stroke="#2f9e44" fill="#2f9e44" fillOpacity={0.2} />
        )}
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}
