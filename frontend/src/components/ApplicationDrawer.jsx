import {
  Check,
  Clock3,
  FileText,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import StatusPill from "./StatusPill.jsx";
import { currency, dateLabel, initials } from "../lib/formatters.js";

export default function ApplicationDrawer({
  application,
  onClose,
  onAssess,
  onDecision,
  modelTrained,
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside className="detail-drawer">
        <div className="drawer-top">
          <span className="section-kicker">APPLICATION DETAILS</span>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="drawer-person">
          <span className="person-avatar avatar-2">
            {initials(application.applicant_name)}
          </span>
          <div>
            <h2>{application.applicant_name}</h2>
            <span>
              {application.email || "Applicant"} · {application.purpose}
            </span>
          </div>
        </div>
        <div className="drawer-amount">
          <span>Requested amount</span>
          <strong>{currency(application.amount_requested)}</strong>
          <StatusPill status={application.status} />
        </div>
        <div className="drawer-section">
          <div className="drawer-section-title">
            <span>
              <Sparkles size={15} /> Risk policy assessment
            </span>
            {application.ai_score != null && (
              <span className="drawer-score">
                {application.ai_score}/100 outlook
              </span>
            )}
          </div>
          {application.ai_factors?.length ? (
            <ul className="factor-list">
              {application.ai_factors.map((factor, index) => (
                <li key={index}>
                  <span
                    className={
                      application.ai_recommendation === "lower_risk"
                        ? "factor-check"
                        : "factor-warning"
                    }
                  >
                    {application.ai_recommendation === "lower_risk" ? (
                      <Check size={13} />
                    ) : (
                      <Clock3 size={13} />
                    )}
                  </span>
                  {factor}
                </li>
              ))}
            </ul>
          ) : (
            <div className="assessment-prompt">
              Run the assessment to see a score and a plain-language explanation
              of the policy factors.
            </div>
          )}
          <button
            className="secondary-button full-button"
            onClick={() => onAssess(application)}
          >
            <Sparkles size={15} />{" "}
            {application.ai_score == null
              ? "Run AI review"
              : "Re-run AI review"}
          </button>
        </div>
        <div className="drawer-section">
          <div className="drawer-section-title">
            <span>
              <FileText size={15} /> Application summary
            </span>
          </div>
          <div className="detail-grid">
            <span>Submitted</span>
            <strong>{dateLabel(application.submitted_at)}</strong>
            <span>Loan purpose</span>
            <strong>{application.purpose}</strong>
            <span>Requested term</span>
            <strong>{application.term_months || "—"} months</strong>
            <span>Annual income</span>
            <strong>
              {application.annual_income
                ? currency(application.annual_income)
                : "—"}
            </strong>
          </div>
        </div>
        <p className="drawer-note">
          <ShieldCheck size={14} /> The model is an advisory aid trained from
          past repayment outcomes. Staff make the final lending decision.
        </p>
        {["under_review", "needs_info"].includes(application.status) && (
          <div className="application-decision-actions">
            <strong>Staff decision & Counter-offer</strong>
            <span>
              Review the application and policy factors. You may approve as requested or propose revised terms.
            </span>
            <div style={{ margin: "10px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#555d59" }}>
                Approved Amount (₹)
                <input
                  id="adj-amount"
                  type="number"
                  defaultValue={application.amount_requested}
                  style={{ width: "100%", padding: "5px 8px", marginTop: "4px", fontSize: "12px", border: "1px solid #dcdfdc", borderRadius: "5px" }}
                />
              </label>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#555d59" }}>
                Approved Term (mo)
                <input
                  id="adj-term"
                  type="number"
                  defaultValue={application.term_months || 24}
                  style={{ width: "100%", padding: "5px 8px", marginTop: "4px", fontSize: "12px", border: "1px solid #dcdfdc", borderRadius: "5px" }}
                />
              </label>
            </div>
            <button
              className="primary-button"
              onClick={() => {
                const adjAmount = document.getElementById("adj-amount")?.value;
                const adjTerm = document.getElementById("adj-term")?.value;
                onDecision("approve", { adjusted_amount: adjAmount, adjusted_term: adjTerm });
              }}
            >
              <Check size={14} /> Approve loan (with specified terms)
            </button>
            <button
              className="secondary-button"
              onClick={() => onDecision("needs_info")}
            >
              Request more information
            </button>
            <button
              className="decision-reject"
              onClick={() => onDecision("reject")}
            >
              Reject application
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
