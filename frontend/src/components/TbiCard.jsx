import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const PARTS = [
  ["skillCoverageScore", "Skill coverage"],
  ["roleDiversityScore", "Role diversity"],
  ["experienceMixScore", "Experience mix"],
  ["availabilityOverlapScore", "Availability overlap"],
];

/** history: tbiHistory docs, newest first (FR-17). */
export default function TbiCard({ history }) {
  const latest = history?.[0];
  if (!latest) return <p className="muted">Team Balance Index not computed yet.</p>;
  const trend = [...history].reverse().map((h, i) => ({ n: i + 1, tbi: h.overallScore }));
  return (
    <div>
      <div className="tbi-score">{latest.overallScore.toFixed(0)}<small> / 100</small></div>
      {PARTS.map(([key, label]) => (
        <div key={key} className="bar-row">
          <span>{label}</span>
          <div className="bar"><div style={{ width: `${latest[key]}%` }} /></div>
          <span>{Math.round(latest[key])}</span>
        </div>
      ))}
      {trend.length > 1 && (
        <ResponsiveContainer width="100%" height={110}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="n" hide />
            <YAxis domain={[0, 100]} width={30} />
            <Tooltip />
            <Line type="monotone" dataKey="tbi" stroke="#1971c2" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
