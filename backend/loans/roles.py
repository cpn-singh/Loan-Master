from .models import UserProfile


def get_role(user):
    """Return the app role for a Django user, creating a client profile if needed."""
    if user.is_superuser:
        return UserProfile.Role.SUPERUSER
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile.role


def is_administrator(user):
    """Superusers and administrators can use staff-only API endpoints."""
    if not user.is_authenticated:
        return False
    return user.is_superuser or get_role(user) == UserProfile.Role.ADMIN
