"""Summary data shown on client and administrator dashboards."""
from django.db.models import Sum
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Application, Loan, Repayment, UserProfile
from .roles import get_role, is_administrator


def summarize_portfolio(role, applications, loans, repayments):
    """Build the same summary shape for client and staff dashboards."""
    outstanding_balance = loans.aggregate(total=Sum("outstanding_balance"))["total"]
    collected_amount = repayments.aggregate(total=Sum("amount_paid"))["total"]

    return {
        "role": role,
        "applications": applications.count(),
        "under_review": applications.filter(
            status=Application.Status.REVIEW
        ).count(),
        "approved": applications.filter(
            status=Application.Status.APPROVED
        ).count(),
        "active_loans": loans.filter(status=Loan.Status.ACTIVE).count(),
        "portfolio_value": outstanding_balance or 0,
        "collected": collected_amount or 0,
        "overdue": repayments.filter(
            status=Repayment.Status.OVERDUE
        ).count(),
    }


@api_view(["GET"])
def dashboard(request):
    """Return totals scoped to a client, or totals for the whole portfolio."""
    user = request.user
    if is_administrator(user):
        applications = Application.objects.all()
        loans = Loan.objects.all()
        repayments = Repayment.objects.all()
        role = get_role(user)
    else:
        applications = Application.objects.filter(user=user)
        loans = Loan.objects.filter(application__user=user)
        repayments = Repayment.objects.filter(loan__application__user=user)
        role = UserProfile.Role.CLIENT

    summary = summarize_portfolio(role, applications, loans, repayments)
    return Response(summary)
