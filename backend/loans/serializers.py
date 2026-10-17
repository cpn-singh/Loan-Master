from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import Application, Loan, Notification, Repayment, UserProfile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Expose account details and the role used by the frontend."""

    role = serializers.SerializerMethodField()

    def get_role(self, user):
        if user.is_superuser:
            return UserProfile.Role.SUPERUSER
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return profile.role

    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name", "email", "role", "is_active", "date_joined")


class UserCreateSerializer(serializers.Serializer):
    """Validate accounts created by authorized staff members."""

    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=10)
    role = serializers.ChoiceField(choices=(UserProfile.Role.ADMIN, UserProfile.Role.CLIENT))

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as error:
            raise serializers.ValidationError(list(error.messages))
        return value

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("That username is already in use.")
        return value

    def create(self, validated_data):
        role = validated_data.pop("role")
        password = validated_data.pop("password")
        user = User.objects.create_user(**validated_data, password=password)
        UserProfile.objects.create(user=user, role=role)
        return user


class ClientSignupSerializer(serializers.Serializer):
    """Public registration is deliberately limited to client accounts."""

    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=10)

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("That username is already in use.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as error:
            raise serializers.ValidationError(list(error.messages))
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(**validated_data, password=password)
        UserProfile.objects.create(user=user, role=UserProfile.Role.CLIENT)
        return user


class LoanSimulationSerializer(serializers.Serializer):
    """Validate inputs for a non-persisted client repayment estimate."""

    amount_requested = serializers.DecimalField(
        max_digits=12, decimal_places=2, min_value=Decimal("0.01")
    )
    annual_income = serializers.DecimalField(
        max_digits=12, decimal_places=2, min_value=Decimal("1")
    )
    monthly_debt = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0"),
        required=False,
        default=Decimal("0"),
    )
    term_months = serializers.IntegerField(min_value=6, max_value=60)


class ApplicationSerializer(serializers.ModelSerializer):
    """Represent loan application records for the API."""

    loan_id = serializers.SerializerMethodField()
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    def get_loan_id(self, application):
        try:
            return application.loan.id
        except Loan.DoesNotExist:
            return None

    class Meta:
        model = Application
        fields = "__all__"
        read_only_fields = (
            "status",
            "ai_score",
            "ai_recommendation",
            "ai_factors",
            "submitted_at",
            "updated_at",
        )


class RepaymentSerializer(serializers.ModelSerializer):
    applicant_name = serializers.CharField(source="loan.application.applicant_name", read_only=True)
    loan_id = serializers.UUIDField(source="loan.id", read_only=True)

    class Meta:
        model = Repayment
        fields = "__all__"


class LoanSerializer(serializers.ModelSerializer):
    applicant_name = serializers.CharField(source="application.applicant_name", read_only=True)
    purpose = serializers.CharField(source="application.purpose", read_only=True)
    repayments = RepaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Loan
        fields = "__all__"


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"
        read_only_fields = ("user", "applicant_name", "message", "kind", "created_at")
