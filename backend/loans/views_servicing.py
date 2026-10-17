"""API endpoints for disbursements and repayment tracking."""
from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Loan, Notification, Repayment
from .permissions import IsAdministrator
from .roles import is_administrator
from .serializers import LoanSerializer, LoanSimulationSerializer, RepaymentSerializer
from .services.loan_simulation import simulate_loan


class LoanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Loan.objects.select_related("application").prefetch_related("repayments")
    serializer_class = LoanSerializer

    def get_queryset(self):
        queryset = (
            Loan.objects.select_related("application", "application__user")
            .prefetch_related("repayments")
        )
        if is_administrator(self.request.user):
            return queryset
        return queryset.filter(application__user=self.request.user)

    def get_permissions(self):
        if self.action in ("disburse",):
            return [IsAdministrator()]
        return [IsAuthenticated()]

    @action(detail=False, methods=["post"], url_path="simulate")
    def simulate(self, request):
        serializer = LoanSimulationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(simulate_loan(**serializer.validated_data))

    @action(detail=True, methods=["post"])
    def disburse(self, request, pk=None):
        loan = self.get_object()
        if loan.status != Loan.Status.READY:
            return Response(
                {"detail": "Loan is not ready to disburse."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        loan.status = Loan.Status.ACTIVE
        loan.disbursed_at = timezone.now()
        loan.save(update_fields=["status", "disbursed_at"])
        Notification.objects.create(
            user=loan.application.user,
            applicant_name=loan.application.applicant_name,
            message=(
                f"Your loan of ₹{loan.principal:,.0f} "
                "has been marked as disbursed."
            ),
            kind=Notification.Kind.INFO,
        )
        return Response(self.get_serializer(loan).data)


class RepaymentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Repayment.objects.select_related("loan", "loan__application")
    serializer_class = RepaymentSerializer

    def get_queryset(self):
        queryset = Repayment.objects.select_related(
            "loan", "loan__application", "loan__application__user"
        )
        if is_administrator(self.request.user):
            return queryset
        return queryset.filter(loan__application__user=self.request.user)

    def get_permissions(self):
        if self.action == "pay":
            return [IsAdministrator()]
        return [IsAuthenticated()]

    @action(detail=True, methods=["post"])
    def pay(self, request, pk=None):
        repayment = self.get_object()
        try:
            amount = Decimal(str(request.data.get("amount", repayment.amount_due)))
        except Exception:
            return Response(
                {"detail": "Enter a valid payment amount."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        remaining = repayment.amount_due - repayment.amount_paid
        if amount <= 0 or amount > remaining:
            return Response(
                {
                    "detail": (
                        "Amount must be greater than zero and no more "
                        f"than ₹{remaining}."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            interest_remaining = max(
                Decimal("0"), repayment.interest_due - repayment.interest_paid
            )
            interest_payment = min(amount, interest_remaining)
            principal_remaining = repayment.principal_due - repayment.principal_paid
            principal_payment = min(
                amount - interest_payment,
                max(Decimal("0"), principal_remaining),
            )
            repayment.amount_paid += amount
            repayment.interest_paid += interest_payment
            repayment.principal_paid += principal_payment
            if repayment.amount_paid >= repayment.amount_due:
                repayment.status = Repayment.Status.PAID
                repayment.paid_at = timezone.now()
            repayment.save()
            loan = repayment.loan
            loan.outstanding_balance = max(
                Decimal("0"), loan.outstanding_balance - principal_payment
            )
            if loan.outstanding_balance == 0:
                loan.status = Loan.Status.PAID
            loan.save(update_fields=["outstanding_balance", "status"])
            Notification.objects.create(
                user=loan.application.user,
                applicant_name=loan.application.applicant_name,
                message=f"Payment of ₹{amount:,.2f} received. Thank you.",
                kind=Notification.Kind.PAYMENT,
            )
        return Response(self.get_serializer(repayment).data)
