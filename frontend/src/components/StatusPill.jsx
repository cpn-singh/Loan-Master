export default function StatusPill({ status }) {
  const labels = {
    under_review: "Under review",
    approved: "Approved",
    rejected: "Rejected",
    needs_info: "Needs info",
    ready: "Ready",
    active: "Active",
    paid: "Paid off",
    due: "Due soon",
    overdue: "Overdue",
  };
  return (
    <span className={`status-pill ${status || "under_review"}`}>
      <i />
      {labels[status] || status}
    </span>
  );
}
