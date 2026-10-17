from django.contrib import admin
from django.contrib.auth import get_user_model

from .models import Application, Loan, Notification, Repayment, UserProfile

admin.site.site_header = "LoanWise Administration"
admin.site.site_title = "LoanWise Admin"
admin.site.index_title = "Lending workspace — LoanWise"

User = get_user_model()


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role")
    list_filter = ("role",)
    search_fields = ("user__username", "user__email", "user__first_name", "user__last_name")
    raw_id_fields = ("user",)


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = (
        "applicant_name",
        "email",
        "purpose",
        "amount_requested",
        "status",
        "ai_score",
        "submitted_at",
    )
    list_filter = ("status", "employment_status")
    search_fields = ("applicant_name", "email", "purpose")
    readonly_fields = (
        "id",
        "ai_score",
        "ai_recommendation",
        "ai_factors",
        "submitted_at",
        "updated_at",
    )
    date_hierarchy = "submitted_at"
    ordering = ("-submitted_at",)


@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = (
        "application",
        "principal",
        "annual_rate",
        "term_months",
        "outstanding_balance",
        "status",
        "disbursed_at",
    )
    list_filter = ("status",)
    search_fields = ("application__applicant_name", "application__email")
    readonly_fields = ("id", "created_at")
    date_hierarchy = "created_at"
    ordering = ("-created_at",)


@admin.register(Repayment)
class RepaymentAdmin(admin.ModelAdmin):
    list_display = (
        "loan",
        "due_date",
        "amount_due",
        "amount_paid",
        "status",
        "paid_at",
    )
    list_filter = ("status",)
    search_fields = ("loan__application__applicant_name",)
    readonly_fields = ("id",)
    date_hierarchy = "due_date"
    ordering = ("due_date",)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("applicant_name", "kind", "message", "read", "created_at")
    list_filter = ("kind", "read")
    search_fields = ("applicant_name", "message")
    readonly_fields = ("id", "created_at")
    date_hierarchy = "created_at"
    ordering = ("-created_at",)
