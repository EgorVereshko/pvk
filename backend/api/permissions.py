# from rest_framework import permissions

# from api.models import UserProfile, UserRole


# class HasRequiredRole(permissions.BasePermission):
#     """
#     Проверяет наличие одной из требуемых ролей у пользователя.
#     """

#     def __init__(self, allowed_roles):
#         self.allowed_roles = allowed_roles

#     def has_permission(self, request, view):
#         if not request.user or not request.user.is_authenticated:
#             return False

#         try:
#             profile = UserProfile.objects.get(user=request.user)
#             user_roles = UserRole.objects.filter(user=profile).values_list('role', flat=True)
#             return any(role in self.allowed_roles for role in user_roles)
#         except UserProfile.DoesNotExist:
#             return False


# # Создаём готовые классы для разных ролей
# IsTutorOrOrganizer = type('IsTutorOrOrganizer', (HasRequiredRole,), {'allowed_roles': ['Куратор', 'Организатор']})
# IsOrganizer = type('IsOrganizer', (HasRequiredRole,), {'allowed_roles': ['Организатор']})
# IsTutor = type('IsTutor', (HasRequiredRole,), {'allowed_roles': ['Куратор']})
# IsProjectant = type('IsProjectant', (HasRequiredRole,), {'allowed_roles': ['Проектант']})

from rest_framework import permissions

from api.models import UserProfile, UserRole


class HasRequiredRole(permissions.BasePermission):
    """
    Проверяет наличие одной из требуемых ролей у пользователя.
    """
    def __init__(self, allowed_roles):
        self.allowed_roles = allowed_roles

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        try:
            profile = UserProfile.objects.get(user=request.user)
            user_roles = UserRole.objects.filter(user=profile).values_list('role', flat=True)
            return any(role in self.allowed_roles for role in user_roles)
        except UserProfile.DoesNotExist:
            return False


# Исправленные классы - создаём через наследование
class IsTutorOrOrganizer(HasRequiredRole):
    def __init__(self):
        super().__init__(['Куратор', 'Организатор'])


class IsOrganizer(HasRequiredRole):
    def __init__(self):
        super().__init__(['Организатор'])


class IsTutor(HasRequiredRole):
    def __init__(self):
        super().__init__(['Куратор'])


class IsProjectant(HasRequiredRole):
    def __init__(self):
        super().__init__(['Проектант'])