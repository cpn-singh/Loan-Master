import { currency, dateLabel } from "./formatters.js";

/**
 * Generates an official, printable Loan Statement & Amortization Schedule.
 * Opens in a clean print-ready window with standard print-to-PDF formatting.
 */
export function generateLoanStatementPDF(loan, borrowerName) {
  const repayments = loan.repayments || [];
  const totalPaid = repayments
    .filter((r) => r.status === "paid")
    .reduce((acc, r) => acc + Number(r.amount_paid || r.amount_due || 0), 0);
  const totalPrincipal = Number(loan.principal || 0);
  const outstanding = Number(loan.outstanding_balance || 0);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Loan Statement - ${loan.purpose}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1a202c;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #2b6d54;
      padding-bottom: 20px;
      margin-bottom: 25px;
    }
    .brand {
      font-size: 24px;
      font-weight: 800;
      color: #2b6d54;
      letter-spacing: -0.5px;
    }
    .brand span { color: #4e9b73; }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      background: #e9f3ed;
      color: #2b6d54;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 30px;
      background: #f7fafc;
      padding: 16px;
      border-radius: 8px;
      font-size: 13px;
    }
    .meta-item strong { display: block; color: #718096; font-size: 11px; text-transform: uppercase; }
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 30px;
    }
    .card {
      border: 1px solid #e2e8f0;
      padding: 14px;
      border-radius: 6px;
      background: #fff;
    }
    .card small { color: #718096; font-size: 11px; text-transform: uppercase; font-weight: 600; }
    .card .val { font-size: 18px; font-weight: 700; margin-top: 4px; color: #2d3748; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      font-size: 12px;
    }
    th {
      background: #edf2f7;
      text-align: left;
      padding: 8px 10px;
      font-weight: 600;
      color: #4a5568;
      border-bottom: 2px solid #cbd5e0;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
    }
    tr:nth-child(even) { background: #fcfdfe; }
    .status-paid { color: #2b6d54; font-weight: 600; }
    .status-due { color: #d69e2e; font-weight: 600; }
    .status-overdue { color: #e53e3e; font-weight: 600; }
    .footer {
      margin-top: 40px;
      border-top: 1px solid #e2e8f0;
      padding-top: 15px;
      font-size: 11px;
      color: #a0aec0;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">loanwise<span>.</span></div>
      <div style="font-size: 12px; color: #718096; margin-top: 4px;">Official Statement of Loan Account</div>
    </div>
    <div style="text-align: right;">
      <span class="badge">${loan.status}</span>
      <div style="font-size: 11px; color: #718096; margin-top: 6px;">Generated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <strong>Borrower Name</strong>
      ${borrowerName || "Valued Customer"}
    </div>
    <div class="meta-item">
      <strong>Loan Purpose</strong>
      ${loan.purpose || "General Purpose"}
    </div>
    <div class="meta-item">
      <strong>Loan Account Reference</strong>
      ${loan.id}
    </div>
    <div class="meta-item">
      <strong>Disbursed On</strong>
      ${dateLabel(loan.disbursed_at || loan.created_at)}
    </div>
  </div>

  <div class="summary-cards">
    <div class="card">
      <small>Sanctioned Principal</small>
      <div class="val">${currency(totalPrincipal)}</div>
    </div>
    <div class="card">
      <small>Total Repaid to Date</small>
      <div class="val" style="color: #2b6d54;">${currency(totalPaid)}</div>
    </div>
    <div class="card">
      <small>Current Outstanding</small>
      <div class="val" style="color: ${outstanding > 0 ? '#c53030' : '#2b6d54'};">${currency(outstanding)}</div>
    </div>
  </div>

  <h3 style="font-size: 14px; margin-bottom: 8px; color: #2d3748;">Amortization & Payment Schedule</h3>
  <table>
    <thead>
      <tr>
        <th>Inst. #</th>
        <th>Due Date</th>
        <th>Installment Amount</th>
        <th>Amount Paid</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${repayments.map((r, i) => `
        <tr>
          <td>#${i + 1}</td>
          <td>${dateLabel(r.due_date)}</td>
          <td>${currency(r.amount_due)}</td>
          <td>${currency(r.amount_paid || 0)}</td>
          <td class="status-${r.status}">${r.status.toUpperCase()}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="footer">
    LoanWise Financial Services · Registered NBFC Lending Workspace · All rights reserved.
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
  `;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    alert("Please allow popups to preview and download the Statement PDF.");
  }
}
