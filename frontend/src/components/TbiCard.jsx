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
  if (!latest) return (
    <div className="card p-6">
      <div className="text-center py-8 bg-neutral-50 rounded-lg border border-neutral-100">
        <svg className="w-12 h-12 text-neutral-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-neutral-500 text-sm">Team Balance Index not computed yet</p>
      </div>
    </div>
  );
  
  const trend = [...history].reverse().map((h, i) => ({ n: i + 1, tbi: h.overallScore }));
  
  return (
    <div className="card p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-neutral-800">Team Balance Index</h3>
          <p className="text-sm text-neutral-500">Overall team composition score</p>
        </div>
      </div>

      <div className="flex items-center justify-center py-6 bg-primary-50 rounded-xl border border-primary-100">
        <div className="text-center">
          <div className="text-5xl font-bold text-primary-600 mb-2">{latest.overallScore.toFixed(0)}</div>
          <div className="text-sm text-neutral-600">out of 100</div>
        </div>
      </div>

      <div className="space-y-3">
        {PARTS.map(([key, label]) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-700 font-medium">{label}</span>
              <span className="text-neutral-600 font-semibold">{Math.round(latest[key])}</span>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-600 rounded-full transition-all duration-500"
                style={{ width: `${latest[key]}%` }} 
              />
            </div>
          </div>
        ))}
      </div>

      {trend.length > 1 && (
        <div className="pt-4 border-t border-neutral-100">
          <h4 className="text-sm font-semibold text-neutral-700 mb-3">Score Trend</h4>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="n" hide />
              <YAxis domain={[0, 100]} width={30} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }} 
              />
              <Line type="monotone" dataKey="tbi" stroke="#647F9E" strokeWidth={2} dot={{ fill: '#647F9E', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
