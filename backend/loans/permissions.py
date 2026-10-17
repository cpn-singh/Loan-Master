from rest_framework.permissions import BasePermission

from .roles import is_administrator


class IsAdministrator(BasePermission):
    def has_permission(self, request, view):
        return is_administrator(request.user)


class CanManageUsers(BasePermission):
    def has_permission(self, request, view):
        return is_administrator(request.user)
