"""Administrator endpoints for training and inspecting the risk model."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .permissions import IsAdministrator
from .services.risk_model import model_status, train_model


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdministrator])
def risk_model_status(request):
    return Response(model_status())


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdministrator])
def train_risk_model(request):
    return Response(train_model())
