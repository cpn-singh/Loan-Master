export default function StatCard({ label, value, change, icon, tone, trend }) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className={`stat-icon ${tone}`}>{icon}</span>
      </div>
      <strong className="stat-value">{value}</strong>
      <div className="stat-change">
        {trend && <span>{trend}</span>}
        {change}
      </div>
    </article>
  );
}
