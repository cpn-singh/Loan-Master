"""Shared repayment arithmetic for simulations and created loans."""

from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings


def estimate_monthly_payment(principal, annual_rate, term_months):
    principal = Decimal(principal)
    annual_rate = Decimal(annual_rate)
    term_months = int(term_months)
    monthly_rate = annual_rate / Decimal("1200")
    if monthly_rate == 0:
        return (principal / term_months).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    payment = principal * monthly_rate / (1 - (1 + monthly_rate) ** (-term_months))
    return payment.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def simulate_loan(amount_requested, annual_income, monthly_debt, term_months):
    annual_rate = Decimal(str(settings.LOAN_ANNUAL_INTEREST_RATE))
    monthly_payment = estimate_monthly_payment(
        amount_requested, annual_rate, term_months
    )
    total_repayment = (monthly_payment * term_months).quantize(Decimal("0.01"))
    monthly_income = Decimal(annual_income) / Decimal("12")
    payment_to_income = monthly_payment / monthly_income * 100
    debt_to_income = (
        (monthly_payment + Decimal(monthly_debt)) / monthly_income * 100
    )
    return {
        "principal": Decimal(amount_requested),
        "annual_rate": annual_rate,
        "term_months": term_months,
        "monthly_payment": monthly_payment,
        "estimated_total_repayment": total_repayment,
        "estimated_total_interest": total_repayment - Decimal(amount_requested),
        "payment_to_income_percent": payment_to_income.quantize(Decimal("0.1")),
        "total_debt_to_income_percent": debt_to_income.quantize(Decimal("0.1")),
        "illustrative_only": True,
        "disclaimer": "Estimate only. It excludes fees and taxes, is not a loan offer or eligibility decision, and actual terms may differ.",
    }
