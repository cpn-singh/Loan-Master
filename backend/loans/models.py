import uuid
from decimal import Decimal

from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    """Stores the application role for a Django account."""

    class Role(models.TextChoices):
        SUPERUSER = "superuser", "Superuser"
        ADMIN = "admin", "Administrator"
        CLIENT = "client", "Client"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="loan_profile",
    )
    role = models.CharField(max_length=16, choices=Role.choices, default=Role.CLIENT)

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class Application(models.Model):
    """A client's request for a loan and the result of its assessment."""

    class Status(models.TextChoices):
        REVIEW = "under_review", "Under review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        NEEDS_INFO = "needs_info", "Needs information"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="loan_applications",
    )
    applicant_name = models.CharField(max_length=160)
    email = models.EmailField()
    purpose = models.CharField(max_length=180)
    amount_requested = models.DecimalField(max_digits=12, decimal_places=2)
    annual_income = models.DecimalField(max_digits=12, decimal_places=2)
    monthly_debt = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    term_months = models.PositiveSmallIntegerField(default=24)
    monthly_payment_estimate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    employment_status = models.CharField(max_length=80, blank=True)
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.REVIEW)
    ai_score = models.PositiveSmallIntegerField(null=True, blank=True)
    ai_recommendation = models.CharField(max_length=24, blank=True)
    ai_factors = models.JSONField(default=list, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-submitted_at"]


class Loan(models.Model):
    """Loan created from an approved application."""

    class Status(models.TextChoices):
        READY = "ready", "Ready to disburse"
        ACTIVE = "active", "Active"
        PAID = "paid", "Paid off"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.OneToOneField(Application, on_delete=models.PROTECT, related_name="loan")
    principal = models.DecimalField(max_digits=12, decimal_places=2)
    annual_rate = models.DecimalField(max_digits=5, decimal_places=2, default=12)
    term_months = models.PositiveSmallIntegerField()
    monthly_payment = models.DecimalField(max_digits=12, decimal_places=2)
    outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.READY)
    disbursed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class Repayment(models.Model):
    """One scheduled installment for a loan."""

    class Status(models.TextChoices):
        DUE = "due", "Due"
        PAID = "paid", "Paid"
        OVERDUE = "overdue", "Overdue"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name="repayments")
    due_date = models.DateField()
    amount_due = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    principal_due = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    interest_due = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    principal_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    interest_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.DUE)
    paid_at = models.DateTimeField(null=True, blank=True)
    reminder_sent_at = models.DateTimeField(null=True, blank=True)
    overdue_notified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["due_date"]


class Notification(models.Model):
    """An in-app status or payment update for a client."""

    class Kind(models.TextChoices):
        APPROVAL = "approval", "Approval"
        REMINDER = "reminder", "Payment reminder"
        OVERDUE = "overdue", "Overdue payment"
        PAYMENT = "payment", "Payment received"
        INFO = "info", "Information"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="loan_notifications",
    )
    applicant_name = models.CharField(max_length=160)
    message = models.CharField(max_length=300)
    kind = models.CharField(max_length=16, choices=Kind.choices, default=Kind.INFO)
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
