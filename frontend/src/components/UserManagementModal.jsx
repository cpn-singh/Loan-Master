import { useEffect, useState } from "react";
import { ShieldCheck, UserPlus, X } from "lucide-react";
import { api } from "../lib/api.js";
import { initials } from "../lib/formatters.js";

export default function UserManagementModal({ currentUser, onClose, onError }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "client",
  });
  const loadUsers = async () => {
    try {
      setUsers(await api("/users/"));
    } catch (error) {
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadUsers();
  }, []);
  const createUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api("/users/", { method: "POST", body: JSON.stringify(form) });
      setForm({
        username: "",
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        role: "client",
      });
      await loadUsers();
      onError(
        "Account created. Share the login details securely with the new user.",
      );
    } catch (error) {
      onError(error.message);
    } finally {
      setSaving(false);
    }
  };
  const toggleUser = async (user) => {
    try {
      await api(`/users/${user.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      await loadUsers();
    } catch (error) {
      onError(error.message);
    }
  };
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="user-modal">
        <div className="drawer-top">
          <div>
            <span className="section-kicker">WORKSPACE ACCESS</span>
            <h2>Users & administrators</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p className="modal-intro">
          Create accounts and control who can access the loan portal.
          Administrators can manage client accounts; only the superuser can add
          administrators.
        </p>
        <form className="user-create-form" onSubmit={createUser}>
          <label>
            Username
            <input
              required
              value={form.username}
              onChange={(event) =>
                setForm({ ...form, username: event.target.value })
              }
            />
          </label>
          <label>
            First name
            <input
              value={form.first_name}
              onChange={(event) =>
                setForm({ ...form, first_name: event.target.value })
              }
            />
          </label>
          <label>
            Last name
            <input
              value={form.last_name}
              onChange={(event) =>
                setForm({ ...form, last_name: event.target.value })
              }
            />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
            />
          </label>
          <label>
            Initial password
            <input
              required
              minLength="10"
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
            />
          </label>
          <label>
            Role
            <select
              value={form.role}
              onChange={(event) =>
                setForm({ ...form, role: event.target.value })
              }
            >
              <option value="client">Client</option>
              {currentUser.role === "superuser" && (
                <option value="admin">Administrator</option>
              )}
            </select>
          </label>
          <div className="user-form-submit">
            <button className="primary-button" disabled={saving}>
              <UserPlus size={14} />
              {saving ? "Creating…" : "Create account"}
            </button>
          </div>
        </form>
        <div className="user-list-heading">
          <strong>Accounts</strong>
          <span>{users.length} users</span>
        </div>
        <div className="managed-user-list">
          {loading ? (
            <div className="empty-state">Loading accounts…</div>
          ) : (
            users.map((user) => (
              <article className="managed-user" key={user.id}>
                <span className="profile-avatar">
                  {initials(
                    `${user.first_name} ${user.last_name}`.trim() ||
                      user.username,
                  )}
                </span>
                <span className="managed-user-info">
                  <strong>
                    {user.first_name || user.last_name
                      ? `${user.first_name} ${user.last_name}`.trim()
                      : user.username}
                  </strong>
                  <small>
                    {user.email} · @{user.username}
                  </small>
                </span>
                <span className={`role-tag ${user.role}`}>
                  {user.role === "superuser"
                    ? "Superuser"
                    : user.role === "admin"
                      ? "Administrator"
                      : "Client"}
                </span>
                <span
                  className={`account-state ${user.is_active ? "enabled" : "disabled"}`}
                >
                  {user.is_active ? "Active" : "Disabled"}
                </span>
                {user.role !== "superuser" && user.id !== currentUser.id && (
                  <button
                    className="secondary-button account-toggle"
                    onClick={() => toggleUser(user)}
                  >
                    {user.is_active ? "Disable" : "Enable"}
                  </button>
                )}
              </article>
            ))
          )}
          {!loading && users.length === 0 && (
            <div className="empty-state">No accounts found.</div>
          )}
        </div>
        <div className="user-modal-foot">
          <ShieldCheck size={14} /> Client accounts only see their own
          applications, loan details, repayments, and notifications.
        </div>
      </section>
    </div>
  );
}
