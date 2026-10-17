import { useState } from "react";
import { ArrowRight, ShieldCheck, WalletCards } from "lucide-react";

// Registration is for borrowers. The API always assigns the client role.
export default function ClientSignupPage({ onRegister, onBack, onSignIn }) {
  const [details, setDetails] = useState({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    password: "",
  });
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (key, value) =>
    setDetails((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (details.password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await onRegister(details);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="login-page signup-page">
      <div className="login-card signup-card">
        <button className="login-back" onClick={onBack}>
          <ArrowRight size={13} /> Back to LoanWise
        </button>
        <a className="brand login-brand" href="#signup">
          <span className="brand-mark">
            <WalletCards size={19} />
          </span>
          <span>
            loanwise<span className="brand-dot">.</span>
          </span>
        </a>
        <span className="section-kicker">CLIENT ACCOUNT</span>
        <h1>Create your account</h1>
        <p>Sign up to apply for a loan and track your account securely.</p>
        <form onSubmit={submit}>
          <div className="signup-name-row">
            <label>
              First name
              <input
                autoComplete="given-name"
                required
                value={details.first_name}
                onChange={(event) => update("first_name", event.target.value)}
              />
            </label>
            <label>
              Last name
              <input
                autoComplete="family-name"
                required
                value={details.last_name}
                onChange={(event) => update("last_name", event.target.value)}
              />
            </label>
          </div>
          <label>
            Email address
            <input
              autoComplete="email"
              required
              type="email"
              value={details.email}
              onChange={(event) => update("email", event.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label>
            Username
            <input
              autoComplete="username"
              required
              value={details.username}
              onChange={(event) => update("username", event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              autoComplete="new-password"
              required
              minLength="10"
              type="password"
              value={details.password}
              onChange={(event) => update("password", event.target.value)}
            />
            <small className="signup-hint">
              Use at least 10 characters and avoid common passwords.
            </small>
          </label>
          <label>
            Confirm password
            <input
              autoComplete="new-password"
              required
              minLength="10"
              type="password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </label>
          {error && <div className="login-error">{error}</div>}
          <button className="primary-button login-submit" disabled={busy}>
            {busy ? "Creating account…" : "Create client account"}{" "}
            <ArrowRight size={15} />
          </button>
        </form>
        <div className="auth-switch">
          Already have an account? <button onClick={onSignIn}>Sign in</button>
        </div>
        <div className="login-security">
          <ShieldCheck size={14} /> New public accounts are created with client
          access only.
        </div>
      </div>
      <footer className="auth-footer">
        © 2026 LoanWise Financial <span>·</span> Secure lending workspace
      </footer>
    </main>
  );
}
