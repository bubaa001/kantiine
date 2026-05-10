from rest_framework.permissions import BasePermission

class IsAdminUser(BasePermission):
    """
    Allows access only to admin users (role='admin' or is_superuser).
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == 'admin' or request.user.is_superuser)
        )

class IsSellerUser(BasePermission):
    """
    Allows access only to seller/cashier users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'seller'
        )

class IsCustomerUser(BasePermission):
    """
    Allows access only to customer/student users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'customer'
        )

class IsOwnerOrSellerOrAdmin(BasePermission):
    """
    Object-level permission: owner of the order, or seller/admin can view/edit.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role in ['admin', 'seller'] or request.user.is_superuser:
            return True
        # Customer can only access their own orders
        if hasattr(obj, 'customer'):
            return obj.customer == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False