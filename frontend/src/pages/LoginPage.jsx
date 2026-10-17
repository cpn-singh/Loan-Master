import { useState } from "react";
import { ArrowRight, ShieldCheck, WalletCards, Lock } from "lucide-react";

// Collects login credentials and reports API errors next to the form.
export default function LoginPage({ onLogin, onBack, onSignup, variant = "client" }) {
  const isAdmin = variant === "admin";
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onLogin(credentials);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className={`login-page ${isAdmin ? "admin-login-page" : ""}`}>
      <div className={`login-card ${isAdmin ? "admin-login-card" : ""}`}>
        <button className="login-back" onClick={onBack}>
          <ArrowRight size={13} /> Back to LoanWise
        </button>
        <a className="brand login-brand" href="#login">
          <span className="brand-mark">
            <WalletCards size={19} />
          </span>
          <span>
            loanwise<span className="brand-dot">.</span>
          </span>
        </a>
        {isAdmin ? (
          <>
            <span className="section-kicker admin-kicker">ADMINISTRATOR ACCESS</span>
            <div className="admin-login-badge">
              <Lock size={14} /> Staff & admin portal
            </div>
            <h1>Administrator sign-in</h1>
            <p>Sign in with your administrator or staff account to access the lending workspace.</p>
          </>
        ) : (
          <>
            <span className="section-kicker">SECURE LOAN PORTAL</span>
            <h1>Welcome back</h1>
            <p>Sign in to manage your applications and loan account.</p>
          </>
        )}
        <form onSubmit={submit}>
          <label>
            Username
            <input
              autoComplete="username"
              required
              value={credentials.username}
              onChange={(event) =>
                setCredentials({ ...credentials, username: event.target.value })
              }
              placeholder="Enter your username"
            />
          </label>
          <label>
            Password
            <input
              autoComplete="current-password"
              required
              type="password"
              value={credentials.password}
              onChange={(event) =>
                setCredentials({ ...credentials, password: event.target.value })
              }
              placeholder="Enter your password"
            />
          </label>
          {error && <div className="login-error">{error}</div>}
          <button className={`primary-button login-submit ${isAdmin ? "admin-submit-btn" : ""}`} disabled={busy}>
            {busy ? "Signing in…" : isAdmin ? "Access workspace" : "Sign in"} <ArrowRight size={15} />
          </button>
        </form>
        {!isAdmin && (
          <div className="auth-switch">
            New to LoanWise?{" "}
            <button onClick={onSignup}>Create a client account</button>
          </div>
        )}
        {isAdmin && (
          <div className="admin-login-note">
            Client? <button onClick={() => onBack()}>Go to client portal</button>
          </div>
        )}
        <div className="login-security">
          <ShieldCheck size={14} /> Your account and loan information are protected.
        </div>
      </div>
      <footer className="auth-footer">
        © 2026 LoanWise Financial <span>·</span> {isAdmin ? "Administration portal" : "Secure lending workspace"}
      </footer>
    </main>
  );
}
