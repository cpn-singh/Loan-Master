import {
  Bell,
  CalendarDays,
  Check,
  CreditCard,
  FileText,
  LogOut,
  Plus,
  ShieldCheck,
  WalletCards,
  X,
} from "lucide-react";
import StatCard from "../components/StatCard.jsx";
import StatusPill from "../components/StatusPill.jsx";
import LoanSimulator from "../components/LoanSimulator.jsx";
import { currency, dateLabel, initials } from "../lib/formatters.js";

// Clients only receive the records and actions passed in for their account.
export default function ClientDashboard({
  user,
  applications,
  dashboard,
  loans,
  notifications,
  offline,
  loadError,
  onNew,
  onLogout,
  onRead,
  onRetry,
  newApplication,
  toast,
  clearToast,
}) {
  const name = `${user.first_name} ${user.last_name}`.trim() || user.username;
  const dueRows = loans
    .filter((loan) => loan.status === "active")
    .flatMap((loan) =>
      (loan.repayments || [])
        .filter((repayment) => repayment.status !== "paid")
        .map((repayment) => ({ ...repayment, purpose: loan.purpose })),
    );
  return (
    <div className="client-shell">
      <header className="client-topbar">
        <a className="brand" href="#home">
          <span className="brand-mark">
            <WalletCards size={19} />
          </span>
          <span>
            loanwise<span className="brand-dot">.</span>
          </span>
        </a>
        <nav>
          <a href="#my-loans">My loans</a>
          <a href="#my-applications">Applications</a>
          <a href="#loan-simulator">Simulator</a>
          <a href="#client-notifications">Notifications</a>
        </nav>
        <div className="client-account">
          <span className="profile-avatar">{initials(name)}</span>
          <span>{name}</span>
          <button
            className="icon-button"
            onClick={onLogout}
            aria-label="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>
      <main className="client-page">
        {offline && (
          <div className="offline-banner">
            <span className="offline-pulse" /> API unavailable{" "}
            <span>{loadError || "Your account data may be out of date."}</span>
            <button onClick={onRetry}>Retry connection</button>
          </div>
        )}
        <section className="client-hero">
          <div>
            <span className="section-kicker">YOUR LOAN WORKSPACE</span>
            <h1>Welcome, {name.split(" ")[0]}</h1>
            <p>
              Track your applications, loan balance, and upcoming repayments in
              one place.
            </p>
          </div>
          <button className="primary-button" onClick={onNew}>
            <Plus size={15} /> Apply for a loan
          </button>
        </section>
        <section className="stat-grid client-stats">
          <StatCard
            label="My applications"
            value={dashboard.applications || 0}
            change="Application history"
            icon={<FileText size={17} />}
            tone="blue"
          />
          <StatCard
            label="Active loans"
            value={dashboard.active_loans || 0}
            change="Currently being repaid"
            icon={<CreditCard size={17} />}
            tone="mint"
          />
          <StatCard
            label="Outstanding balance"
            value={currency(dashboard.portfolio_value)}
            change="Across active loans"
            icon={<WalletCards size={17} />}
            tone="lavender"
          />
          <StatCard
            label="Payments collected"
            value={currency(dashboard.collected)}
            change={
              dashboard.overdue
                ? `${dashboard.overdue} payment(s) overdue`
                : "Payment history"
            }
            icon={<Check size={17} />}
            tone="peach"
          />
        </section>
        <LoanSimulator />
        <div className="client-columns">
          <section className="panel" id="my-applications">
            <div className="panel-heading">
              <div>
                <div className="section-kicker">APPLICATION HISTORY</div>
                <h2>My applications</h2>
                <p>Application progress and backend risk assessment results.</p>
              </div>
            </div>
            <div className="client-app-list">
              {applications.map((application) => (
                <article className="client-app-row" key={application.id}>
                  <span className="client-app-icon">
                    <FileText size={17} />
                  </span>
                  <div className="client-app-main">
                    <strong>{application.purpose}</strong>
                    <span>
                      {currency(application.amount_requested)} · Submitted{" "}
                      {dateLabel(application.submitted_at)}
                    </span>
                    {application.ai_factors?.map((factor) => (
                      <small key={factor}>{factor}</small>
                    ))}
                  </div>
                  <StatusPill status={application.status} />
                </article>
              ))}
              {applications.length === 0 && (
                <div className="client-empty">
                  <FileText size={21} />
                  <strong>No applications yet</strong>
                  <span>When you apply, its progress will appear here.</span>
                  <button className="secondary-button" onClick={onNew}>
                    Start an application
                  </button>
                </div>
              )}
            </div>
          </section>
          <section className="panel" id="my-loans">
            <div className="panel-heading">
              <div>
                <div className="section-kicker">LOAN SUMMARY</div>
                <h2>My loans</h2>
                <p>Loan balance and repayment schedule.</p>
              </div>
            </div>
            <div className="client-loan-list">
              {loans.map((loan) => (
                <article className="client-loan-card" key={loan.id}>
                  <div className="client-loan-heading">
                    <span className="loan-avatar">{initials(name)}</span>
                    <div>
                      <strong>{loan.purpose}</strong>
                      <small>
                        {loan.term_months}-month term · {loan.annual_rate}%
                        annual rate
                      </small>
                    </div>
                    <StatusPill status={loan.status} />
                  </div>
                  <div className="client-loan-balance">
                    <span>Outstanding</span>
                    <strong>{currency(loan.outstanding_balance)}</strong>
                  </div>
                  <div className="client-loan-progress">
                    <span
                      style={{
                        width: `${Math.max(0, Math.min(100, ((Number(loan.principal) - Number(loan.outstanding_balance)) / Number(loan.principal)) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="client-loan-foot">
                    <span>Original loan {currency(loan.principal)}</span>
                    <span>
                      Monthly payment {currency(loan.monthly_payment)}
                    </span>
                  </div>
                </article>
              ))}
              {loans.length === 0 && (
                <div className="client-empty">
                  <CreditCard size={21} />
                  <strong>No active loans</strong>
                  <span>
                    Approved loans and repayment details will appear here.
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>
        <div className="client-columns lower-client-columns">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <div className="section-kicker">UPCOMING</div>
                <h2>Repayment schedule</h2>
              </div>
            </div>
            <div className="repayment-list client-repayments">
              {dueRows.map((repayment) => (
                <div className="repayment-row" key={repayment.id}>
                  <span className="calendar-icon">
                    <CalendarDays size={16} />
                  </span>
                  <span className="repay-person">
                    <strong>{repayment.purpose}</strong>
                    <small>Due {dateLabel(repayment.due_date)}</small>
                  </span>
                  <span className="repay-amount">
                    {currency(
                      Number(repayment.amount_due) -
                        Number(repayment.amount_paid || 0),
                    )}
                  </span>
                  <StatusPill status={repayment.status} />
                </div>
              ))}
              {dueRows.length === 0 && (
                <div className="client-empty small-empty">
                  <Check size={20} />
                  <span>No upcoming repayments to show.</span>
                </div>
              )}
            </div>
          </section>
          <section className="panel" id="client-notifications">
            <div className="panel-heading">
              <div>
                <div className="section-kicker">ACCOUNT UPDATES</div>
                <h2>Notifications</h2>
              </div>
            </div>
            <div className="client-notifications">
              {notifications.map((notice) => (
                <button
                  className={`notification-row ${notice.read ? "read" : ""}`}
                  key={notice.id}
                  onClick={() => onRead(notice)}
                >
                  <span className={`notice-icon ${notice.kind}`}>
                    <Bell size={14} />
                  </span>
                  <span className="notice-copy">
                    <strong>
                      {notice.kind === "approval"
                        ? "Loan application update"
                        : "Loan account update"}
                    </strong>
                    <span>{notice.message}</span>
                    <small>{dateLabel(notice.created_at)}</small>
                  </span>
                  <i className="unread-dot" />
                </button>
              ))}
              {notifications.length === 0 && (
                <div className="client-empty small-empty">
                  <Bell size={20} />
                  <span>You’re all caught up.</span>
                </div>
              )}
            </div>
          </section>
        </div>
        <footer className="client-footer">
          <a className="brand footer-brand" href="#home">
            <span className="brand-mark">
              <WalletCards size={16} />
            </span>
            <span>
              loanwise<span className="brand-dot">.</span>
            </span>
          </a>
          <span>© 2026 LoanWise Financial</span>
          <span>
            Loan and repayment information is loaded from your account.
          </span>
        </footer>
      </main>
      {newApplication}
      {toast && (
        <div className="toast">
          <Check size={16} />
          {toast}
          <button onClick={clearToast} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
