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
          {modelTrained ? (
            <button
              className="secondary-button full-button"
              onClick={() => onAssess(application)}
            >
              <Sparkles size={15} />{" "}
              {application.ai_score == null
                ? "Run risk assessment"
                : "Refresh assessment"}
            </button>
          ) : (
            <div className="assessment-prompt">
              A trained model is not available yet. Staff can still review and
              decide the application using its submitted details.
            </div>
          )}
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
            <strong>Staff decision</strong>
            <span>
              Review the application and policy factors before recording a
              decision.
            </span>
            <button
              className="primary-button"
              onClick={() => onDecision("approve")}
            >
              <Check size={14} /> Approve and create loan
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
