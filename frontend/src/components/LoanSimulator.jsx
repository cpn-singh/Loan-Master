import { useState } from "react";
import { Calculator, RefreshCw, TrendingUp, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { api } from "../lib/api.js";
import { currency } from "../lib/formatters.js";

const emptyInputs = {
  amount_requested: "",
  annual_income: "",
  monthly_debt: "",
  term_months: "",
};

function AffordabilityBadge({ dti }) {
  if (dti == null) return null;
  if (dti < 35)
    return (
      <div className="simulator-affordability healthy">
        <CheckCircle size={13} /> Healthy DTI — {dti}% of income
      </div>
    );
  if (dti < 50)
    return (
      <div className="simulator-affordability caution">
        <AlertTriangle size={13} /> Moderate DTI — {dti}% of income
      </div>
    );
  return (
    <div className="simulator-affordability risk">
      <XCircle size={13} /> High DTI — {dti}% of income
    </div>
  );
}

function SplitBar({ principal, interest }) {
  const total = principal + interest;
  if (!total) return null;
  const pPct = Math.round((principal / total) * 100);
  const iPct = 100 - pPct;
  return (
    <div className="sim-bar-outer">
      <div className="sim-bar-wrap">
        <div className="sim-bar-principal" style={{ width: `${pPct}%` }} />
        <div className="sim-bar-interest" style={{ width: `${iPct}%` }} />
      </div>
      <div className="sim-bar-legend">
        <span><i className="bar-dot principal-dot" /> Principal {currency(principal)} ({pPct}%)</span>
        <span><i className="bar-dot interest-dot" /> Interest {currency(interest)} ({iPct}%)</span>
      </div>
    </div>
  );
}

// Sends hypothetical values to Django; the simulator never creates a loan.
export default function LoanSimulator() {
  const [inputs, setInputs] = useState(emptyInputs);
  const [estimate, setEstimate] = useState(null);
  const [error, setError] = useState("");
  const [calculating, setCalculating] = useState(false);

  const updateInput = (event) => {
    setInputs({ ...inputs, [event.target.name]: event.target.value });
    setEstimate(null);
  };

  const calculateEstimate = async (event) => {
    event.preventDefault();
    setCalculating(true);
    setError("");
    try {
      const result = await api("/loans/simulate/", {
        method: "POST",
        body: JSON.stringify({
          ...inputs,
          monthly_debt: inputs.monthly_debt || "0",
        }),
      });
      setEstimate(result);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setCalculating(false);
    }
  };

  // Build first-3-month table from estimate
  const buildSchedule = (est) => {
    if (!est) return [];
    const principal = Number(inputs.amount_requested);
    const annualRate = Number(est.annual_rate) / 100;
    const monthlyRate = annualRate / 12;
    const payment = Number(est.monthly_payment);
    let balance = principal;
    const rows = [];
    for (let i = 1; i <= Math.min(3, Number(inputs.term_months) || 3); i++) {
      const interestCharge = balance * monthlyRate;
      const principalCharge = payment - interestCharge;
      balance = Math.max(0, balance - principalCharge);
      rows.push({
        month: i,
        payment,
        principal: principalCharge,
        interest: interestCharge,
        balance,
      });
    }
    return rows;
  };

  const schedule = buildSchedule(estimate);

  return (
    <section className="panel simulator-panel" id="loan-simulator">
      <div className="panel-heading">
        <div>
          <div className="section-kicker">PLAN BEFORE YOU APPLY</div>
          <h2>Loan repayment simulator</h2>
          <p>Explore how a loan fits your budget — results are estimates only and not saved.</p>
        </div>
        <span className="simulator-icon">
          <Calculator size={19} />
        </span>
      </div>

      <div className="simulator-content">
        <form className="simulator-form" onSubmit={calculateEstimate}>
          <label>
            Loan amount (₹)
            <input
              required
              min="1"
              name="amount_requested"
              type="number"
              value={inputs.amount_requested}
              onChange={updateInput}
              placeholder="e.g. 500000"
            />
          </label>
          <label>
            Annual income (₹)
            <input
              required
              min="1"
              name="annual_income"
              type="number"
              value={inputs.annual_income}
              onChange={updateInput}
              placeholder="e.g. 1200000"
            />
          </label>
          <label>
            Existing monthly debt (₹)
            <input
              min="0"
              name="monthly_debt"
              type="number"
              value={inputs.monthly_debt}
              onChange={updateInput}
              placeholder="0 if none"
            />
          </label>
          <label>
            Repayment term (months)
            <input
              required
              min="6"
              max="60"
              name="term_months"
              type="number"
              value={inputs.term_months}
              onChange={updateInput}
              placeholder="6 – 60"
            />
          </label>
          <button className="primary-button" disabled={calculating}>
            {calculating ? (
              <RefreshCw className="spin-icon" size={15} />
            ) : (
              <TrendingUp size={15} />
            )}
            {calculating ? "Calculating…" : "Calculate estimate"}
          </button>
          {error && (
            <p className="simulator-error" role="alert">
              {error}
            </p>
          )}
        </form>

        <div className="simulator-results" aria-live="polite">
          {estimate ? (
            <>
              <div className="simulator-primary-result">
                <span>Estimated monthly payment</span>
                <strong>{currency(estimate.monthly_payment)}</strong>
                <small>{estimate.annual_rate}% indicative annual rate</small>
              </div>
              <AffordabilityBadge dti={estimate.total_debt_to_income_percent} />
              <SplitBar
                principal={Number(estimate.estimated_total_repayment) - Number(estimate.estimated_total_interest)}
                interest={Number(estimate.estimated_total_interest)}
              />
              <div className="simulator-result-grid">
                <div>
                  <span>Total repayment</span>
                  <strong>{currency(estimate.estimated_total_repayment)}</strong>
                </div>
                <div>
                  <span>Total interest</span>
                  <strong>{currency(estimate.estimated_total_interest)}</strong>
                </div>
                <div>
                  <span>Payment / income</span>
                  <strong>{estimate.payment_to_income_percent}%</strong>
                </div>
                <div>
                  <span>Debt-to-income</span>
                  <strong>{estimate.total_debt_to_income_percent}%</strong>
                </div>
              </div>
              {schedule.length > 0 && (
                <div className="sim-mini-table-wrap">
                  <div className="sim-mini-table-label">First {schedule.length} installment{schedule.length > 1 ? 's' : ''}</div>
                  <table className="sim-mini-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Payment</th>
                        <th>Principal</th>
                        <th>Interest</th>
                        <th>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((row) => (
                        <tr key={row.month}>
                          <td>{row.month}</td>
                          <td>{currency(row.payment)}</td>
                          <td>{currency(row.principal)}</td>
                          <td>{currency(row.interest)}</td>
                          <td>{currency(row.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="simulator-disclaimer">{estimate.disclaimer}</p>
            </>
          ) : (
            <div className="simulator-empty">
              <Calculator size={22} />
              <strong>Your estimate will appear here</strong>
              <span>
                Enter any loan amount, income, and term to see your estimated monthly payment, total interest, and an affordability check.
              </span>
              <ul className="sim-tips">
                <li>💡 A healthy debt-to-income ratio is under 35%</li>
                <li>📅 Longer terms lower monthly payments but increase total interest</li>
                <li>🔒 These figures are not saved or used in any application</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
