"""API endpoints for account administration and notifications."""
from django.contrib.auth import get_user_model
from rest_framework import status, viewsets
from rest_framework.response import Response

from .models import Notification, UserProfile
from .permissions import CanManageUsers
from .roles import is_administrator
from .serializers import NotificationSerializer, UserCreateSerializer, UserSerializer

User = get_user_model()


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        if is_administrator(self.request.user):
            return Notification.objects.all()
        return Notification.objects.filter(user=self.request.user)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("date_joined")
    serializer_class = UserSerializer
    permission_classes = [CanManageUsers]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        queryset = User.objects.all().order_by("date_joined")
        if self.request.user.is_superuser:
            return queryset
        return queryset.filter(loan_profile__role=UserProfile.Role.CLIENT)

    def get_serializer_class(self):
        return UserCreateSerializer if self.action == "create" else UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        requested_role = serializer.validated_data["role"]
        if requested_role == UserProfile.Role.ADMIN and not request.user.is_superuser:
            return Response(
                {"detail": "Only a superuser can create administrators."},
                status=status.HTTP_403_FORBIDDEN,
            )
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        target = self.get_object()
        target_role = UserProfile.objects.filter(user=target).values_list(
            "role", flat=True
        ).first()
        is_not_client = target_role != UserProfile.Role.CLIENT
        if target.is_superuser or (not request.user.is_superuser and is_not_client):
            return Response(
                {"detail": "Administrators can manage client accounts only."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if "is_active" not in request.data:
            return Response(
                {"detail": "Only account activation can be changed here."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        active = request.data["is_active"]
        if not isinstance(active, bool):
            return Response(
                {"detail": "is_active must be true or false."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        target.is_active = active
        target.save(update_fields=["is_active"])
        return Response(UserSerializer(target).data)
