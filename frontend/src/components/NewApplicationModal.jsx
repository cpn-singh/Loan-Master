import { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { api } from "../lib/api.js";

export default function NewApplicationModal({
  onClose,
  onCreated,
  onError,
  initialValues = {},
}) {
  const [form, setForm] = useState({
    applicant_name: initialValues.applicant_name || "",
    email: initialValues.email || "",
    purpose: initialValues.purpose || "",
    amount_requested: initialValues.amount_requested || "",
    annual_income: initialValues.annual_income || "",
    monthly_debt: initialValues.monthly_debt ?? "0",
    term_months: initialValues.term_months || "24",
    monthly_payment_estimate: initialValues.monthly_payment_estimate || "",
    employment_status: initialValues.employment_status || "",
  });
  const [saving, setSaving] = useState(false);
  const update = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api("/applications/", {
        method: "POST",
        body: JSON.stringify(form),
      });
      await onCreated();
    } catch (error) {
      onError(error.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form className="new-modal" onSubmit={submit}>
        <div className="drawer-top">
          <div>
            <span className="section-kicker">NEW SUBMISSION</span>
            <h2>Create application</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <p className="modal-intro">
          Enter the loan details. The backend will assess the application when
          it is saved.
        </p>
        <div className="form-grid">
          <label>
            Applicant name
            <input
              required
              name="applicant_name"
              value={form.applicant_name}
              onChange={update}
              placeholder="Full name"
            />
          </label>
          <label>
            Email address
            <input
              required
              type="email"
              name="email"
              value={form.email}
              onChange={update}
              placeholder="name@example.com"
            />
          </label>
          <label>
            Loan purpose
            <input
              required
              name="purpose"
              value={form.purpose}
              onChange={update}
              placeholder="e.g. Home improvement"
            />
          </label>
          <label>
            Employment status
            <input
              name="employment_status"
              value={form.employment_status}
              onChange={update}
              placeholder="e.g. Salaried"
            />
          </label>
          <label>
            Amount requested (₹)
            <input
              required
              min="1"
              type="number"
              name="amount_requested"
              value={form.amount_requested}
              onChange={update}
              placeholder="500000"
            />
          </label>
          <label>
            Annual income (₹)
            <input
              required
              min="1"
              type="number"
              name="annual_income"
              value={form.annual_income}
              onChange={update}
              placeholder="1200000"
            />
          </label>
          <label>
            Existing monthly debt (₹)
            <input
              min="0"
              type="number"
              name="monthly_debt"
              value={form.monthly_debt}
              onChange={update}
            />
          </label>
          <label>
            Term (months)
            <input
              required
              min="6"
              max="60"
              type="number"
              name="term_months"
              value={form.term_months}
              onChange={update}
            />
          </label>
          <label className="wide-field">
            Estimated monthly payment (₹)
            <input
              required
              min="1"
              type="number"
              name="monthly_payment_estimate"
              value={form.monthly_payment_estimate}
              onChange={update}
              placeholder="25000"
            />
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? "Saving…" : "Create application"} <ArrowRight size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}
