"""API endpoints for submitting and reviewing loan applications."""
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Application, Notification
from .permissions import IsAdministrator
from .roles import is_administrator
from .serializers import ApplicationSerializer
from .services.loan_workflow import record_risk_assessment, record_staff_decision


class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer

    def get_queryset(self):
        queryset = Application.objects.select_related("user")
        if is_administrator(self.request.user):
            return queryset
        return queryset.filter(user=self.request.user)

    def get_permissions(self):
        if self.action in ("list", "retrieve", "create"):
            return [IsAuthenticated()]
        return [IsAdministrator()]

    def perform_create(self, serializer):
        user = self.request.user
        if is_administrator(user):
            application = serializer.save()
        else:
            full_name = f"{user.first_name} {user.last_name}".strip() or user.username
            application = serializer.save(user=user, applicant_name=full_name, email=user.email)
        Notification.objects.create(
            user=application.user,
            applicant_name=application.applicant_name,
            message="Your application was received and added to the staff review queue.",
            kind=Notification.Kind.INFO,
        )
        record_risk_assessment(application)

    @action(detail=True, methods=["post"])
    def assess(self, request, pk=None):
        application = self.get_object()
        application = record_risk_assessment(application)
        return Response(self.get_serializer(application).data)

    @action(detail=True, methods=["post"])
    def decision(self, request, pk=None):
        application = self.get_object()
        try:
            application = record_staff_decision(
                application,
                request.data.get("decision", ""),
                adjusted_amount=request.data.get("adjusted_amount"),
                adjusted_term=request.data.get("adjusted_term"),
            )
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(self.get_serializer(application).data)
