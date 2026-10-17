from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from loans.models import Notification, Repayment


class Command(BaseCommand):
    help = "Mark overdue installments and create in-app reminders for upcoming payments."

    def handle(self, *args, **options):
        today = timezone.localdate()
        reminders = 0
        overdue = 0
        due_soon = Repayment.objects.filter(
            loan__status="active",
            status=Repayment.Status.DUE,
            due_date__gte=today,
            due_date__lte=today + timedelta(days=3),
            reminder_sent_at__isnull=True,
        ).select_related("loan__application")
        for repayment in due_soon:
            Notification.objects.create(
                user=repayment.loan.application.user,
                applicant_name=repayment.loan.application.applicant_name,
                message=f"A repayment of ₹{repayment.amount_due:,.2f} is due on {repayment.due_date:%d %b %Y}.",
                kind=Notification.Kind.REMINDER,
            )
            repayment.reminder_sent_at = timezone.now()
            repayment.save(update_fields=["reminder_sent_at"])
            reminders += 1

        past_due = Repayment.objects.filter(
            loan__status="active",
            status__in=[Repayment.Status.DUE, Repayment.Status.OVERDUE],
            due_date__lt=today,
            overdue_notified_at__isnull=True,
        ).select_related("loan__application")
        for repayment in past_due:
            repayment.status = Repayment.Status.OVERDUE
            repayment.overdue_notified_at = timezone.now()
            repayment.save(update_fields=["status", "overdue_notified_at"])
            Notification.objects.create(
                user=repayment.loan.application.user,
                applicant_name=repayment.loan.application.applicant_name,
                message=f"A repayment of ₹{repayment.amount_due - repayment.amount_paid:,.2f} was due on {repayment.due_date:%d %b %Y}.",
                kind=Notification.Kind.OVERDUE,
            )
            overdue += 1
        self.stdout.write(self.style.SUCCESS(f"Created {reminders} reminders and marked {overdue} installments overdue."))
