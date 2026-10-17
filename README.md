# LoanWise — AI Loan Management MVP

A local MVP for reviewing loan applications, producing explainable risk assessments, recording lending decisions, tracking disbursements and repayments, and issuing in-app reminders.

## Stack

- Frontend: Vite, React, JavaScript
- Backend: Python, Django, Django REST Framework
- Database: SQLite for local development

## Code map

The code is split by page and feature so it is easier to explore:

### Frontend (`frontend/src`)

- `App.jsx` handles sign-in state, loads shared data, and selects the page for the current account.
- `pages/` contains the landing page, sign-in and signup pages, and separate client and administrator dashboards.
- `components/` contains pieces reused by pages, such as loan forms, status labels, and the 3D loan scene.
- `lib/api.js` sends requests to Django; `lib/formatters.js` contains shared date, currency, and name helpers.
- `styles.css` contains the shared page and component styles.

Run `npm run format` from `frontend` to format the source files in `src` with Prettier.

### Backend (`backend/loans`)

- `models.py` defines the database records for users, applications, loans, repayments, and notifications.
- `urls.py` connects API paths to their views.
- `views_auth.py`, `views_applications.py`, `views_servicing.py`, `views_users.py`, and `views_dashboard.py` each handle one API area.
- `serializers.py` validates incoming data and shapes API responses.
- `services/risk_model.py` trains an advisory logistic regression model from observed loan outcomes. `services/loan_simulation.py` shares repayment calculations with loan creation.
- `permissions.py` and `roles.py` control which account types can use staff endpoints.

## Run locally

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL printed in the terminal. The API defaults to `http://127.0.0.1:8000/api`; set `VITE_API_URL` to override it.

Use the superuser username and password you created with `createsuperuser` to sign in. Clients can register themselves from the public landing page. Public registration always creates a client account. From **Users & access**, only a superuser can add administrators; administrators can create and disable client accounts. Clients can submit applications and see only their own applications, loan balances, repayments, and account notifications. The Django superuser is the top-level account; no default password is created.

## AI decision service

The backend trains a balanced logistic regression model from its own mature loan records. A loan paid off without a 90-day delinquency is a non-delinquent outcome; an unpaid installment at least 90 days late, or one paid more than 90 days after its due date, is a delinquent outcome. The model uses application affordability and loan-term fields. It never uses names, email addresses, or employment status as model features.

Training requires at least 50 eligible historical loans and 15 examples of each outcome. With fewer records, the model stays untrained and new applications remain in the staff review queue. The administrator dashboard reports the available sample counts and has a **Train model from backend data** action. Retraining uses only records saved in this backend; no generated examples are added. Staff make the final approve, reject, or request-information decision, and only an explicit staff approval creates a loan.

The model is an early, advisory prototype trained only on previously issued loans, so historical approval bias and small or changing datasets can make its estimates unreliable. Its output is not a credit decision. It is not suitable for real lending without representative validated data, fairness evaluation, jurisdiction-specific compliance work, security controls, and operational review. The model artifact contains only learned numeric weights and metadata in `backend/ml_artifacts/risk_model.json`.

The client dashboard includes a loan simulator backed by the same repayment calculation used when a staff-approved loan is created. Hypothetical inputs are not saved. The estimate excludes fees and taxes and is not an offer or eligibility decision. Set `LOAN_ANNUAL_INTEREST_RATE` in the backend environment to configure the indicative annual rate (defaults to 12%).

## API

- `POST /api/auth/login/` with `{"username":"…","password":"…"}`
- `POST /api/auth/register/` with client name, email, username, and password fields (public; creates a client account and returns a login token)
- `GET /api/auth/me/` and `POST /api/auth/logout/`
- `GET/POST /api/users/` (administrators only; only a superuser may create administrators)
- `GET/POST /api/applications/`
- `GET /api/applications/{id}/`
- `POST /api/applications/{id}/assess/`
- `POST /api/applications/{id}/decision/` with `{"decision":"approve|reject|needs_info"}` (administrator only)
- `POST /api/loans/{id}/disburse/`
- `POST /api/loans/simulate/` (authenticated; does not save inputs)
- `POST /api/repayments/{id}/pay/` with `{"amount": 250}`
- `GET /api/dashboard/`
- `GET /api/risk-model/status/` and `POST /api/risk-model/train/` (administrator only)
- `GET /api/notifications/`

Protected API calls use `Authorization: Token <token>`. Client accounts can access only records linked to their own account. Staff users see the administration portfolio; user administration is permission-scoped by role.

Schedule `python manage.py process_repayments` to run daily (for example, with Windows Task Scheduler) to create upcoming-payment reminders and mark overdue installments. The command is safe to repeat; it records timestamps to avoid duplicate notices.

The API uses token authentication and role-based permissions. It is still a local-development starter; configure production secrets, HTTPS, allowed origins, hosting, monitoring, and a production database before exposing it to real customers.
