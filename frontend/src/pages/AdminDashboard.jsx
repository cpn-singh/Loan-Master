import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  Calculator,
  CalendarDays,
  Check,
  ChevronDown,
  CreditCard,
  Download,
  FileText,
  Filter,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";
import StatCard from "../components/StatCard.jsx";
import StatusPill from "../components/StatusPill.jsx";
import ApplicationDrawer from "../components/ApplicationDrawer.jsx";
import NewApplicationModal from "../components/NewApplicationModal.jsx";
import UserManagementModal from "../components/UserManagementModal.jsx";
import LoanSimulator from "../components/LoanSimulator.jsx";
import { currency } from "../lib/formatters.js";

function exportApplications(applications) {
  if (!applications.length) return;
  const columns = [
    "applicant_name",
    "email",
    "purpose",
    "amount_requested",
    "status",
    "ai_score",
    "submitted_at",
  ];
  const csvValue = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [
    columns.join(","),
    ...applications.map((application) =>
      columns.map((column) => csvValue(application[column])).join(","),
    ),
  ].join("\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "loan-applications.csv";
  link.click();
  URL.revokeObjectURL(url);
}

// This page displays portfolio-wide tools for administrators and superusers.
export default function AdminDashboard({
  activeNav,
  applications,
  currentUser,
  dashboard,
  decideApplication,
  dateLabel,
  displayName,
  filter,
  initials,
  load,
  loading,
  loadError,
  loans,
  markDisbursed,
  markRead,
  notifications,
  offline,
  query,
  riskModelStatus,
  recordPayment,
  runAssessment,
  selected,
  setActiveNav,
  setFilter,
  setQuery,
  setSelected,
  setShowNew,
  setShowUsers,
  setToast,
  showNew,
  showUsers,
  signOut,
  toast,
  trainRiskModel,
  trainingModel,
  visibleApplications,
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#overview"
          onClick={() => setActiveNav("Overview")}
        >
          <span className="brand-mark">
            <WalletCards size={19} />
          </span>
          <span>
            loanwise<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <div className="workspace-switch">
          <span className="workspace-icon">L</span>
          <span className="workspace-name">
            LoanWise<small>Loan workspace</small>
          </span>
        </div>
        <div className="nav-label">MENU</div>
        <nav className="main-nav">
          <button
            className={`nav-item ${activeNav === "Overview" ? "active" : ""}`}
            onClick={() => setActiveNav("Overview")}
          >
            <LayoutDashboard size={17} /> Overview
          </button>
          <button
            className={`nav-item ${activeNav === "Applications" ? "active" : ""}`}
            onClick={() => {
              setActiveNav("Applications");
              document
                .getElementById("applications")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <FileText size={17} /> Applications{" "}
            <span className="nav-count">{dashboard.under_review}</span>
          </button>
          <button
            className={`nav-item ${activeNav === "Loans" ? "active" : ""}`}
            onClick={() => {
              setActiveNav("Loans");
              document
                .getElementById("loans")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <CreditCard size={17} /> Active loans
          </button>
          <button
            className={`nav-item ${activeNav === "Repayments" ? "active" : ""}`}
            onClick={() => {
              setActiveNav("Repayments");
              document
                .getElementById("repayments")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <CalendarDays size={17} /> Repayments
          </button>
          <button
            className={`nav-item ${activeNav === "Simulator" ? "active" : ""}`}
            onClick={() => {
              setActiveNav("Simulator");
              document
                .getElementById("admin-simulator")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <Calculator size={17} /> Simulator
          </button>
          <button className="nav-item" onClick={() => setShowUsers(true)}>
            <Users size={17} /> Users & access
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="profile">
            <span className="profile-avatar">{initials(displayName)}</span>
            <span className="profile-name">
              {displayName}
              <small>
                {currentUser.role === "superuser"
                  ? "Superuser"
                  : "Administrator"}
              </small>
            </span>
            <button
              className="profile-logout"
              onClick={signOut}
              aria-label="Log out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs">
            Workspace <span>/</span> <strong>{activeNav}</strong>
          </div>
          <div className="top-actions">
            <div className="top-date">
              <CalendarDays size={14} />{" "}
              {new Intl.DateTimeFormat("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }).format(new Date())}
            </div>
            <button
              className="icon-button notification-trigger"
              aria-label="Notifications"
              onClick={() =>
                document
                  .getElementById("notifications")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <Bell size={17} />
              {notifications.some((item) => !item.read) && <i />}
            </button>
            <span className="top-avatar">{initials(displayName)}</span>
            <button
              className="icon-button"
              onClick={signOut}
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>
        <div className="page-wrap">
          <section className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="live-dot" />{" "}
                {new Intl.DateTimeFormat("en-IN", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
                  .format(new Date())
                  .toUpperCase()}
              </div>
              <h1>
                Good morning, {displayName.split(" ")[0]}{" "}
                <span className="wave">✳</span>
              </h1>
              <p>Here’s what’s happening with your portfolio today.</p>
            </div>
            <button className="primary-button" onClick={() => setShowNew(true)}>
              <Plus size={16} /> New application
            </button>
          </section>

          {offline && (
            <div className="offline-banner">
              <span className="offline-pulse" /> API unavailable{" "}
              <span>
                {loadError || "Your portfolio data may be out of date."}
              </span>
              <button onClick={load}>Retry connection</button>
            </div>
          )}

          <section className="stat-grid" aria-label="Portfolio summary">
            <StatCard
              label="Total portfolio"
              value={currency(dashboard.portfolio_value)}
              change="Across active loans"
              icon={<WalletCards size={17} />}
              tone="lavender"
            />
            <StatCard
              label="Applications"
              value={dashboard.applications}
              change={`${dashboard.under_review} need review`}
              icon={<FileText size={17} />}
              tone="blue"
              trend={<ArrowUpRight size={14} />}
            />
            <StatCard
              label="Active loans"
              value={dashboard.active_loans}
              change={`${dashboard.approved} approved total`}
              icon={<BriefcaseBusiness size={17} />}
              tone="mint"
              trend={<ArrowUpRight size={14} />}
            />
            <StatCard
              label="Payments collected"
              value={currency(dashboard.collected)}
              change={
                dashboard.overdue
                  ? `${dashboard.overdue} overdue payments`
                  : "No overdue payments"
              }
              icon={<ArrowDownLeft size={17} />}
              tone="peach"
              trend={<ArrowUpRight size={14} />}
            />
          </section>

          <section className="content-grid">
            <div className="panel applications-panel" id="applications">
              <div className="panel-heading">
                <div>
                  <div className="section-kicker">YOUR WORK QUEUE</div>
                  <h2>
                    Loan applications{" "}
                    <span className="heading-count">
                      {visibleApplications.length}
                    </span>
                  </h2>
                  <p>Review submissions and backend risk policy results.</p>
                </div>
                <button
                  className="text-button"
                  onClick={() => {
                    setFilter("All applications");
                    setQuery("");
                  }}
                >
                  View all <ArrowRight size={14} />
                </button>
              </div>
              <div className="table-toolbar">
                <div className="search-field">
                  <Search size={15} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search applicants..."
                  />
                </div>
                <label className="filter-select">
                  <Filter size={14} />
                  <select
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                  >
                    <option>All applications</option>
                    <option value="under_review">Under review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="needs_info">Needs information</option>
                  </select>
                  <ChevronDown size={13} />
                </label>
                <button
                  className="icon-button export-button"
                  onClick={() => exportApplications(applications)}
                  aria-label="Export applications"
                >
                  <Download size={15} />
                </button>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>APPLICANT</th>
                      <th>LOAN AMOUNT</th>
                      <th>SUBMITTED</th>
                      <th>RISK ASSESSMENT</th>
                      <th>STATUS</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleApplications.map((application) => (
                      <tr
                        key={application.id}
                        onClick={() => setSelected(application)}
                      >
                        <td>
                          <div className="person-cell">
                            <span
                              className={`person-avatar avatar-${(application.applicant_name.length % 4) + 1}`}
                            >
                              {initials(application.applicant_name)}
                            </span>
                            <span className="person-info">
                              {application.applicant_name}
                              <small>{application.purpose}</small>
                            </span>
                          </div>
                        </td>
                        <td className="amount-cell">
                          {currency(application.amount_requested)}
                        </td>
                        <td className="date-cell">
                          {dateLabel(application.submitted_at)}
                        </td>
                        <td>
                          {application.ai_score == null ? (
                            riskModelStatus.trained ? (
                              <button
                                className="assess-link"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  runAssessment(application);
                                }}
                              >
                                <Sparkles size={13} /> Run assessment
                              </button>
                            ) : (
                              <span className="muted-empty">
                                Waiting for trained model
                              </span>
                            )
                          ) : (
                            <div className="score-cell">
                              <span
                                className={`score-ring ${application.ai_score < 60 ? "score-low" : ""}`}
                              >
                                {application.ai_score}
                              </span>
                              <span>
                                {application.ai_recommendation === "lower_risk"
                                  ? "Lower estimate"
                                  : application.ai_recommendation ===
                                      "higher_risk"
                                    ? "Higher estimate"
                                    : "Manual review"}
                              </span>
                            </div>
                          )}
                        </td>
                        <td>
                          <StatusPill status={application.status} />
                        </td>
                        <td>
                          <button
                            className="row-more"
                            aria-label="Open application"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelected(application);
                            }}
                          >
                            <MoreHorizontal size={17} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {visibleApplications.length === 0 && (
                  <div className="empty-state">
                    No applications match that search.
                  </div>
                )}
              </div>
              <div className="panel-footer">
                <span>
                  Showing <strong>{visibleApplications.length}</strong> of{" "}
                  <strong>{applications.length}</strong> applications
                </span>
                <button
                  onClick={() => {
                    setFilter("All applications");
                    setQuery("");
                  }}
                >
                  See all applications <ArrowRight size={13} />
                </button>
              </div>
            </div>

            <div className="side-column">
              <div className="ai-card">
                <div className="ai-card-top">
                  <span className="ai-orb">
                    <Sparkles size={17} />
                  </span>
                  <span className="ai-status">
                    <i /> BACKEND POLICY CHECKS
                  </span>
                  <button
                    aria-label="AI information"
                    onClick={() =>
                      setToast(
                        "Assessments are generated by the backend policy engine and saved with each application.",
                      )
                    }
                  >
                    <CircleHelp size={15} />
                  </button>
                </div>
                <h3>Automated risk assessment</h3>
                <p>
                  Train an advisory risk model from real, mature loan outcomes
                  already recorded in this backend.
                </p>
                <div className="model-training-box">
                  <strong>
                    {riskModelStatus.stale_model_exists
                      ? "Saved model is due for retraining"
                      : riskModelStatus.trained
                        ? "Model trained from backend records"
                        : "Model not trained"}
                  </strong>
                  <span>{riskModelStatus.message}</span>
                  <span>
                    {riskModelStatus.sample_count} eligible outcomes ·{" "}
                    {riskModelStatus.repaid_count} repaid ·{" "}
                    {riskModelStatus.delinquent_count} seriously delinquent
                  </span>
                  {riskModelStatus.balanced_accuracy != null && (
                    <span>
                      Held-out balanced accuracy:{" "}
                      {Math.round(riskModelStatus.balanced_accuracy * 100)}%
                    </span>
                  )}
                  <button
                    className="secondary-button"
                    disabled={!riskModelStatus.can_train || trainingModel}
                    onClick={trainRiskModel}
                  >
                    {trainingModel
                      ? "Training model…"
                      : riskModelStatus.trained
                        ? "Retrain from current data"
                        : "Train model from backend data"}
                  </button>
                  <small>{riskModelStatus.limitations}</small>
                </div>
                <div className="ai-metrics">
                  <div>
                    <strong>{dashboard.under_review}</strong>
                    <span>awaiting staff</span>
                  </div>
                  <span className="metric-divider" />
                  <div>
                    <strong>
                      {
                        applications.filter((app) => app.ai_score != null)
                          .length
                      }
                    </strong>
                    <span>assessed</span>
                  </div>
                  <span className="metric-divider" />
                  <div>
                    <strong>
                      {
                        applications.filter((app) => app.ai_factors?.length)
                          .length
                      }
                    </strong>
                    <span>with factors</span>
                  </div>
                </div>
                <button
                  className="ai-link"
                  onClick={() =>
                    document
                      .getElementById("applications")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Review applications <ArrowRight size={14} />
                </button>
              </div>
              <div className="panel activity-panel">
                <div className="mini-panel-heading">
                  <div>
                    <div className="section-kicker">STAY IN THE LOOP</div>
                    <h2>Notifications</h2>
                  </div>
                  <span className="notification-count">
                    {notifications.filter((n) => !n.read).length}
                  </span>
                </div>
                <div className="notification-list" id="notifications">
                  {notifications.map((notice) => (
                    <button
                      className={`notification-row ${notice.read ? "read" : ""}`}
                      key={notice.id}
                      onClick={() => markRead(notice)}
                    >
                      <span className={`notice-icon ${notice.kind}`}>
                        <Bell size={14} />
                      </span>
                      <span className="notice-copy">
                        <strong>{notice.applicant_name}</strong>
                        <span>{notice.message}</span>
                        <small>{dateLabel(notice.created_at)}</small>
                      </span>
                      <i className="unread-dot" />
                    </button>
                  ))}
                  {notifications.length === 0 && (
                    <p className="muted-empty">You’re all caught up.</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="panel loans-panel" id="loans">
            <div className="panel-heading">
              <div>
                <div className="section-kicker">PORTFOLIO</div>
                <h2>Active loans</h2>
                <p>Keep track of disbursements and repayments.</p>
              </div>
              <button
                className="text-button"
                onClick={() =>
                  document
                    .getElementById("loans")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Loan ledger <ArrowRight size={14} />
              </button>
            </div>
            <div className="loan-list">
              {loans
                .filter(
                  (loan) => loan.status === "active" || loan.status === "ready",
                )
                .map((loan) => (
                  <div className="loan-row" key={loan.id}>
                    <span className="loan-avatar">
                      {initials(loan.applicant_name)}
                    </span>
                    <div className="loan-details">
                      <strong>{loan.applicant_name}</strong>
                      <span>
                        {loan.purpose} · {loan.term_months} months
                      </span>
                    </div>
                    <div className="loan-balance">
                      <strong>{currency(loan.outstanding_balance)}</strong>
                      <span>outstanding</span>
                    </div>
                    <div className="loan-progress">
                      <div>
                        <span
                          style={{
                            width: `${Math.max(5, Math.min(100, ((Number(loan.principal) - Number(loan.outstanding_balance)) / Number(loan.principal)) * 100))}%`,
                          }}
                        />
                      </div>
                      <small>
                        {Math.round(
                          ((Number(loan.principal) -
                            Number(loan.outstanding_balance)) /
                            Number(loan.principal)) *
                            100,
                        )}
                        % repaid
                      </small>
                    </div>
                    <StatusPill status={loan.status} />
                    {loan.status === "ready" && (
                      <button
                        className="small-action"
                        onClick={() => markDisbursed(loan)}
                      >
                        Disburse
                      </button>
                    )}
                  </div>
                ))}
              {loans.length === 0 && (
                <div className="empty-state compact">
                  Approved loans will appear here.
                </div>
              )}
            </div>
          </section>

          <section className="panel repayments-panel" id="repayments">
            <div className="panel-heading">
              <div>
                <div className="section-kicker">UPCOMING CASH FLOW</div>
                <h2>Repayment schedule</h2>
                <p>Payments due across your active portfolio.</p>
              </div>
              <button
                className="text-button"
                onClick={() =>
                  document
                    .getElementById("repayments")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                View schedule <ArrowRight size={14} />
              </button>
            </div>
            <div className="repayment-list">
              {loans
                .filter((loan) => loan.status === "active")
                .flatMap((loan) =>
                  (loan.repayments || [])
                    .filter((repayment) => repayment.status !== "paid")
                    .map((repayment) => ({
                      ...repayment,
                      applicant_name: loan.applicant_name,
                    })),
                )
                .map((repayment) => (
                  <div className="repayment-row" key={repayment.id}>
                    <span className="calendar-icon">
                      <CalendarDays size={17} />
                    </span>
                    <span className="repay-person">
                      <strong>{repayment.applicant_name}</strong>
                      <small>
                        Installment due {dateLabel(repayment.due_date)}
                      </small>
                    </span>
                    <span className="repay-amount">
                      {currency(
                        Number(repayment.amount_due) -
                          Number(repayment.amount_paid || 0),
                      )}
                    </span>
                    <StatusPill status={repayment.status} />
                    <button
                      className="small-action"
                      onClick={() => recordPayment(repayment)}
                    >
                      Record payment
                    </button>
                  </div>
                ))}
              {loans
                .flatMap((loan) => loan.repayments || [])
                .filter((repayment) => repayment.status !== "paid").length ===
                0 && (
                <div className="empty-state compact">
                  Repayments will appear after a loan is disbursed.
                </div>
              )}
            </div>
          </section>

          <section className="admin-simulator-section" id="admin-simulator">
            <LoanSimulator />
          </section>

          <footer className="page-footer">
            <span>© 2026 LoanWise Financial</span>
            <span>
              <ShieldCheck size={13} /> Secure lending workspace
            </span>
            <span className="demo-label">
              <span />{" "}
              {offline
                ? "Backend unavailable"
                : loading
                  ? "Connecting…"
                  : "System operational"}
            </span>
          </footer>
        </div>
      </main>

      {selected && (
        <ApplicationDrawer
          application={selected}
          onClose={() => setSelected(null)}
          onAssess={runAssessment}
          onDecision={(decision, adjustments) =>
            decideApplication(selected, decision, adjustments)
          }
          modelTrained={riskModelStatus.trained}
        />
      )}
      {showNew && (
        <NewApplicationModal
          onClose={() => setShowNew(false)}
          onCreated={async () => {
            setShowNew(false);
            await load();
            setToast("Application created.");
          }}
          onError={setToast}
        />
      )}
      {showUsers && (
        <UserManagementModal
          currentUser={currentUser}
          onClose={() => setShowUsers(false)}
          onError={setToast}
        />
      )}
      {toast && (
        <div className="toast">
          <Check size={16} /> {toast}
          <button onClick={() => setToast("")} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
