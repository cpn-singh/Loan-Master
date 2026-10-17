"""Helpers for assessing applications and creating repayment schedules."""
from datetime import date, timedelta
from decimal import Decimal

from django.conf import settings
from django.db import transaction

from ..models import Application, Loan, Notification, Repayment
from .risk_model import assess_application
from .loan_simulation import estimate_monthly_payment


def create_loan_for(application):
    amount = application.amount_requested
    rate = Decimal(str(settings.LOAN_ANNUAL_INTEREST_RATE))
    months = application.term_months
    payment = estimate_monthly_payment(amount, rate, months)
    monthly_rate = rate / Decimal("1200")
    loan, created = Loan.objects.get_or_create(
        application=application,
        defaults={
            "principal": amount,
            "annual_rate": rate,
            "term_months": months,
            "monthly_payment": payment,
            "outstanding_balance": amount,
        },
    )
    if created:
        balance = amount
        for month in range(months):
            due = date.today().replace(day=1) + timedelta(days=32 * (month + 1))
            due = due.replace(day=1)
            from calendar import monthrange

            due = due.replace(day=min(date.today().day, monthrange(due.year, due.month)[1]))
            interest_due = (balance * monthly_rate).quantize(Decimal("0.01"))
            principal_due = min(
                balance, loan.monthly_payment - interest_due
            ).quantize(Decimal("0.01"))
            if month == months - 1:
                principal_due = balance
            Repayment.objects.create(
                loan=loan,
                due_date=due,
                amount_due=principal_due + interest_due,
                principal_due=principal_due,
                interest_due=interest_due,
            )
            balance = max(Decimal("0"), balance - principal_due)
    return loan


def record_risk_assessment(application):
    result = assess_application(application)
    application.ai_score = result["score"]
    application.ai_recommendation = result["recommendation"]
    application.ai_factors = result["factors"]
    application.save()
    return application


def record_staff_decision(application, decision):
    """Persist an administrator's decision separately from model output."""
    allowed = {
        "approve": Application.Status.APPROVED,
        "reject": Application.Status.REJECTED,
        "needs_info": Application.Status.NEEDS_INFO,
    }
    if decision not in allowed:
        raise ValueError("Choose approve, reject, or needs_info.")
    if application.status in (Application.Status.APPROVED, Application.Status.REJECTED):
        raise ValueError("This application already has a final decision.")

    with transaction.atomic():
        application.status = allowed[decision]
        application.save(update_fields=["status", "updated_at"])
        if decision == "approve":
            create_loan_for(application)

        Notification.objects.create(
            user=application.user,
            applicant_name=application.applicant_name,
            message={
                "approve": "A loan officer approved your application.",
                "reject": "A loan officer declined your application.",
                "needs_info": "A loan officer needs more information about your application.",
            }[decision],
            kind=Notification.Kind.APPROVAL if decision == "approve" else Notification.Kind.INFO,
        )
    return application
