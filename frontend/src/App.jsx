import { useCallback, useEffect, useMemo, useState } from "react";
import { api, TOKEN_KEY } from "./lib/api.js";
import { dateLabel, initials } from "./lib/formatters.js";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ClientDashboard from "./pages/ClientDashboard.jsx";
import ClientSignupPage from "./pages/ClientSignupPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NewApplicationModal from "./components/NewApplicationModal.jsx";

// The root component owns shared data and login state. Page layouts live in src/pages.
function App() {
  const isAdminRoute = window.location.pathname.replace(/\/$/, "") === "/admin";
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(isAdminRoute);
  const [showSignup, setShowSignup] = useState(false);
  const [applications, setApplications] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [riskModelStatus, setRiskModelStatus] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [activeNav, setActiveNav] = useState("Overview");
  const [filter, setFilter] = useState("All applications");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newAppInitialValues, setNewAppInitialValues] = useState({});
  const [showUsers, setShowUsers] = useState(false);
  const [trainingModel, setTrainingModel] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    try {
      const [apps, summary, notices, loanData, modelStatus] = await Promise.all(
        [
          api("/applications/"),
          api("/dashboard/"),
          api("/notifications/"),
          api("/loans/"),
          currentUser.role === "client"
            ? Promise.resolve(null)
            : api("/risk-model/status/"),
        ],
      );
      setApplications(apps);
      setDashboard(summary);
      setNotifications(notices);
      setLoans(loanData);
      setRiskModelStatus(modelStatus);
      setOffline(false);
      setLoadError("");
      setSelected((current) =>
        current ? apps.find((item) => item.id === current.id) || null : null,
      );
    } catch (error) {
      setOffline(true);
      setLoadError(error.message);
      setApplications([]);
      setDashboard(null);
      setNotifications([]);
      setLoans([]);
      setRiskModelStatus(null);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setAuthLoading(false);
      return;
    }
    api("/auth/me/")
      .then(setCurrentUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setAuthLoading(false));
  }, []);
  useEffect(() => {
    if (currentUser) load();
  }, [currentUser, load]);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 3600);
    return () => clearTimeout(timer);
  }, [toast]);

  const visibleApplications = useMemo(
    () =>
      applications.filter((item) => {
        const matchesQuery = `${item.applicant_name} ${item.purpose}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesFilter =
          filter === "All applications" || item.status === filter;
        return matchesQuery && matchesFilter;
      }),
    [applications, filter, query],
  );

  const runAssessment = async (application) => {
    try {
      const assessed = await api(`/applications/${application.id}/assess/`, {
        method: "POST",
        body: "{}",
      });
      await load();
      setToast(
        assessed.ai_score == null
          ? "No trained risk model is available. The application remains in the staff review queue."
          : "Risk assessment completed and saved.",
      );
    } catch (error) {
      setToast(error.message);
    }
  };

  const decideApplication = async (application, decision, adjustments = {}) => {
    try {
      await api(`/applications/${application.id}/decision/`, {
        method: "POST",
        body: JSON.stringify({ decision, ...adjustments }),
      });
      setSelected(null);
      await load();
      setToast("Staff decision saved.");
    } catch (error) {
      setToast(error.message);
    }
  };

  const trainRiskModel = async () => {
    setTrainingModel(true);
    try {
      const result = await api("/risk-model/train/", {
        method: "POST",
        body: "{}",
      });
      await load();
      setToast(result.message);
    } catch (error) {
      setToast(error.message);
    } finally {
      setTrainingModel(false);
    }
  };

  const markDisbursed = async (loan) => {
    try {
      await api(`/loans/${loan.id}/disburse/`, { method: "POST", body: "{}" });
      await load();
      setToast("Loan marked as disbursed.");
    } catch (error) {
      setToast(error.message);
    }
  };

  const recordPayment = async (repayment) => {
    const remaining =
      Number(repayment.amount_due) - Number(repayment.amount_paid || 0);
    try {
      await api(`/repayments/${repayment.id}/pay/`, {
        method: "POST",
        body: JSON.stringify({ amount: remaining }),
      });
      await load();
      setToast("Repayment recorded and balance updated.");
    } catch (error) {
      setToast(error.message);
    }
  };

  const markRead = async (notice) => {
    try {
      await api(`/notifications/${notice.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ read: true }),
      });
      await load();
    } catch {
      /* Keep the notification visible when the API is unavailable. */
    }
  };

  const signOut = async () => {
    try {
      await api("/auth/logout/", { method: "POST", body: "{}" });
    } catch {
      /* Local sign-out still works if the API is unavailable. */
    }
    localStorage.removeItem(TOKEN_KEY);
    setCurrentUser(null);
    setApplications([]);
    setDashboard(null);
    setRiskModelStatus(null);
    setLoans([]);
    setNotifications([]);
    setLoading(true);
    setOffline(false);
    setLoadError("");
  };

  const signIn = async (credentials) => {
    const response = await api("/auth/login/", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    if (isAdminRoute && response.user.role === "client") {
      throw new Error(
        "This sign-in page is for administrators. Use the client sign-in page instead.",
      );
    }
    localStorage.setItem(TOKEN_KEY, response.token);
    setCurrentUser(response.user);
  };

  const registerClient = async (details) => {
    const response = await api("/auth/register/", {
      method: "POST",
      body: JSON.stringify(details),
    });
    localStorage.setItem(TOKEN_KEY, response.token);
    setCurrentUser(response.user);
  };

  const displayName = currentUser
    ? `${currentUser.first_name} ${currentUser.last_name}`.trim() ||
      currentUser.username
    : "";

  if (authLoading)
    return <div className="auth-loading">Opening your secure workspace…</div>;
  if (!currentUser)
    return showSignup ? (
      <ClientSignupPage
        onRegister={registerClient}
        onBack={() => setShowSignup(false)}
        onSignIn={() => {
          setShowSignup(false);
          setShowLogin(true);
        }}
      />
    ) : showLogin ? (
      <LoginPage
        onLogin={signIn}
        variant={isAdminRoute ? "admin" : "client"}
        onBack={() => {
          if (isAdminRoute) window.location.assign("/");
          else setShowLogin(false);
        }}
        onSignup={() => {
          if (isAdminRoute) {
            window.location.assign("/");
            return;
          }
          setShowSignup(true);
          setShowLogin(false);
        }}
      />
    ) : isAdminRoute ? (
      <LoginPage
        onLogin={signIn}
        variant="admin"
        onBack={() => window.location.assign("/")}
        onSignup={() => window.location.assign("/")}
      />
    ) : (
      <LandingPage
        onLogin={() => setShowLogin(true)}
        onSignup={() => setShowSignup(true)}
      />
    );
  if (currentUser.role === "client" && isAdminRoute)
    return (
      <main className="login-page">
        <div className="login-card">
          <span className="section-kicker">ADMINISTRATOR ACCESS</span>
          <h1>Administrator account required</h1>
          <p>
            This account is a client account. Sign out to access the
            administrator sign-in page.
          </p>
          <button className="primary-button login-submit" onClick={signOut}>
            Sign out
          </button>
          <button
            className="login-back"
            onClick={() => window.location.assign("/")}
          >
            Go to LoanWise home
          </button>
        </div>
      </main>
    );
  if (loading && !dashboard)
    return <div className="auth-loading">Loading your account data…</div>;
  if (!dashboard)
    return (
      <main className="login-page">
        <div className="login-card">
          <span className="section-kicker">ACCOUNT DATA UNAVAILABLE</span>
          <h1>Could not connect to LoanWise</h1>
          <p>{loadError || "The backend did not return dashboard data."}</p>
          <button className="primary-button login-submit" onClick={load}>
            Retry connection
          </button>
          <button className="login-back" onClick={signOut}>
            Sign out
          </button>
        </div>
      </main>
    );
  if (currentUser.role === "client")
    return (
      <ClientDashboard
        user={currentUser}
        applications={applications}
        dashboard={dashboard}
        loans={loans}
        notifications={notifications}
        offline={offline}
        loadError={loadError}
        onNew={() => {
          setNewAppInitialValues({});
          setShowNew(true);
        }}
        onApplyFromSimulator={(values) => {
          setNewAppInitialValues(values);
          setShowNew(true);
        }}
        onRecordPayment={recordPayment}
        onLogout={signOut}
        onRead={markRead}
        onRetry={load}
        newApplication={
          showNew && (
            <NewApplicationModal
              initialValues={newAppInitialValues}
              onClose={() => {
                setShowNew(false);
                setNewAppInitialValues({});
              }}
              onCreated={async () => {
                setShowNew(false);
                setNewAppInitialValues({});
                await load();
                setToast(
                  "Application submitted. It is in the staff review queue.",
                );
              }}
              onError={setToast}
            />
          )
        }
        toast={toast}
        clearToast={() => setToast("")}
      />
    );

  return (
    <AdminDashboard
      activeNav={activeNav}
      applications={applications}
      currentUser={currentUser}
      dashboard={dashboard}
      dateLabel={dateLabel}
      displayName={displayName}
      filter={filter}
      initials={initials}
      load={load}
      loading={loading}
      loans={loans}
      markDisbursed={markDisbursed}
      markRead={markRead}
      notifications={notifications}
      offline={offline}
      loadError={loadError}
      query={query}
      recordPayment={recordPayment}
      runAssessment={runAssessment}
      decideApplication={decideApplication}
      riskModelStatus={riskModelStatus}
      trainRiskModel={trainRiskModel}
      trainingModel={trainingModel}
      selected={selected}
      setActiveNav={setActiveNav}
      setFilter={setFilter}
      setQuery={setQuery}
      setSelected={setSelected}
      setShowNew={setShowNew}
      setShowUsers={setShowUsers}
      setToast={setToast}
      showNew={showNew}
      showUsers={showUsers}
      signOut={signOut}
      toast={toast}
      visibleApplications={visibleApplications}
    />
  );
}

export default App;
