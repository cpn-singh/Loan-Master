"""Map public API URLs to the module that implements each feature."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views_applications import ApplicationViewSet
from .views_auth import login, logout, me, register_client
from .views_dashboard import dashboard
from .views_servicing import LoanViewSet, RepaymentViewSet
from .views_users import NotificationViewSet, UserViewSet
from .views_risk_model import risk_model_status, train_risk_model

router = DefaultRouter()
router.register("applications", ApplicationViewSet)
router.register("loans", LoanViewSet)
router.register("repayments", RepaymentViewSet)
router.register("notifications", NotificationViewSet)
router.register("users", UserViewSet)

urlpatterns = [
    path("auth/login/", login),
    path("auth/register/", register_client),
    path("auth/me/", me),
    path("auth/logout/", logout),
    path("dashboard/", dashboard),
    path("risk-model/status/", risk_model_status),
    path("risk-model/train/", train_risk_model),
    path("", include(router.urls)),
]
