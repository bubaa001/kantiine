from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone

from .models import (
    CustomUser, Wallet, WalletTransaction, Category, FoodItem,
    Order, OrderItem, Coupon, Notification
)
from .serializers import (
    CustomUserSerializer, UserProfileSerializer, WalletSerializer,
    CategorySerializer, FoodItemSerializer, OrderSerializer, OrderCreateSerializer,
    CouponSerializer, NotificationSerializer
)
from .permissions import IsAdminUser, IsSellerUser, IsCustomerUser, IsOwnerOrSellerOrAdmin

class CategoryViewSet(viewsets.ModelViewSet):
    """
    Categories for menu organization. 
    - Read: All authenticated users
    - Write: Admin only
    """
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role == 'admin':
            return Category.objects.all()
        return qs

class FoodItemViewSet(viewsets.ModelViewSet):
    """
    Dynamic menu items. Supports filtering by category, popular, new.
    """
    queryset = FoodItem.objects.filter(is_available=True)
    serializer_class = FoodItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['category', 'is_popular', 'is_new']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset()
        category_slug = self.request.query_params.get('category')
        if category_slug:
            qs = qs.filter(category__slug=category_slug)
        return qs.order_by('-is_popular', '-is_new', 'name')

class OrderViewSet(viewsets.ModelViewSet):
    """
    Order management with role-based access and custom workflows.
    - Customers: Create orders, view own orders
    - Sellers: View all, approve payments (generate coupon + update wallet if needed)
    - Admin: Full access
    """
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrSellerOrAdmin]

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'seller'] or user.is_superuser:
            return Order.objects.all().order_by('-created_at')
        return Order.objects.filter(customer=user).order_by('-created_at')

    def perform_create(self, serializer):
        # The OrderCreateSerializer handles wallet deduction and item creation
        order = serializer.save()
        # Create notification for customer
        Notification.objects.create(
            user=order.customer,
            title="Order Placed Successfully",
            message=f"Your order {order.order_number} has been placed and is pending payment."
        )

    @action(detail=True, methods=['post'], permission_classes=[IsSellerUser]):
    def approve_payment(self, request, pk=None):
        """
        Seller approves cash payment.
        - Updates status to 'paid'
        - Generates unique Coupon if not exists
        - Handles change: if amount_paid > total, credit to wallet
        - Sends notification to customer
        """
        order = self.get_object()
        
        if order.status != 'pending':
            return Response(
                {"error": f"Order is already {order.status}. Cannot approve."},
                status=status.HTTP_400_BAD_REQUEST
            )

        amount_paid = request.data.get('amount_paid')
        if not amount_paid:
            return Response({"error": "amount_paid is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount_paid = float(amount_paid)
        except ValueError:
            return Response({"error": "Invalid amount_paid"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            order.amount_paid = amount_paid
            order.status = 'paid'
            
            change = amount_paid - order.total_amount
            if change > 0:
                order.change_given = change
                # Credit wallet
                if hasattr(order.customer, 'wallet'):
                    wallet = order.customer.wallet
                    wallet.balance += change
                    wallet.save()
                    WalletTransaction.objects.create(
                        wallet=wallet,
                        amount=change,
                        transaction_type='credit',
                        description=f"Change from order {order.order_number}",
                        reference_order=order
                    )
            else:
                order.change_given = 0

            order.save()

            # Generate coupon if not exists
            coupon, created = Coupon.objects.get_or_create(order=order)
            if created:
                coupon.save()  # triggers code generation

            # Update status to preparing (or keep as paid until seller starts prep)
            # For demo, auto-move to preparing
            order.status = 'preparing'
            order.save()

            # Notify customer
            Notification.objects.create(
                user=order.customer,
                title="Payment Approved - Coupon Generated",
                message=f"Your order {order.order_number} is approved! Coupon: {coupon.code}. Show this to collect your meal."
            )

        serializer = OrderSerializer(order)
        return Response({
            "message": "Payment approved successfully. Coupon generated.",
            "order": serializer.data,
            "coupon_code": coupon.code
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsCustomerUser | IsSellerUser]):
    def cancel_order(self, request, pk=None):
        order = self.get_object()
        if order.status in ['completed', 'cancelled']:
            return Response({"error": "Cannot cancel completed/cancelled order"}, status=400)
        
        order.status = 'cancelled'
        order.save()
        
        # Refund wallet if used
        if order.wallet_used > 0 and hasattr(order.customer, 'wallet'):
            wallet = order.customer.wallet
            wallet.balance += order.wallet_used
            wallet.save()
            WalletTransaction.objects.create(
                wallet=wallet,
                amount=order.wallet_used,
                transaction_type='credit',
                description=f"Refund for cancelled order {order.order_number}"
            )

        Notification.objects.create(
            user=order.customer,
            title="Order Cancelled",
            message=f"Order {order.order_number} has been cancelled."
        )
        return Response({"message": "Order cancelled successfully"}, status=200)

    @action(detail=False, methods=['get'], permission_classes=[IsSellerUser]):
    def pending_approval(self, request):
        """List orders awaiting payment approval (for seller dashboard)"""
        orders = Order.objects.filter(status='pending').order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

class UserViewSet(viewsets.ModelViewSet):
    """
    User management.
    - Registration: AllowAny
    - Profile: Authenticated users can view/update own profile
    - Seller/Admin: Can list all customers/students
    """
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated]
        return [IsAdminUser()]

    def get_serializer_class(self):
        if self.action == 'retrieve' or self.action == 'update':
            return UserProfileSerializer
        return CustomUserSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'seller' or user.is_superuser:
            return CustomUser.objects.filter(role='customer')
        if user.role == 'admin':
            return CustomUser.objects.all()
        return CustomUser.objects.filter(id=user.id)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated]):
    def me(self, request):
        """Get current user profile"""
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsSellerUser]):
    def students(self, request):
        """Seller views all registered students"""
        students = CustomUser.objects.filter(role='customer')
        serializer = UserProfileSerializer(students, many=True)
        return Response(serializer.data)

class WalletViewSet(viewsets.ReadOnlyModelViewSet):
    """Wallet and transaction history for customers"""
    queryset = Wallet.objects.all()
    serializer_class = WalletSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'seller']:
            return Wallet.objects.all()
        return Wallet.objects.filter(user=user)

class CouponViewSet(viewsets.ReadOnlyModelViewSet):
    """View active and redeemed coupons"""
    queryset = Coupon.objects.all().order_by('-created_at')
    serializer_class = CouponSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'seller']:
            return Coupon.objects.all()
        return Coupon.objects.filter(order__customer=user)

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """User notifications"""
    queryset = Notification.objects.all().order_by('-created_at')
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

# Special ViewSet for Seller Dashboard summary
class SellerDashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsSellerUser]

    @action(detail=False, methods=['get']):
    def summary(self, request):
        """Quick stats for seller home screen"""
        pending_orders = Order.objects.filter(status='pending').count()
        preparing_orders = Order.objects.filter(status='preparing').count()
        today_orders = Order.objects.filter(created_at__date=timezone.now().date()).count()
        total_students = CustomUser.objects.filter(role='customer').count()
        
        return Response({
            "pending_approvals": pending_orders,
            "orders_in_preparation": preparing_orders,
            "orders_today": today_orders,
            "registered_students": total_students,
            "total_revenue_today": sum(
                o.total_amount for o in Order.objects.filter(
                    created_at__date=timezone.now().date(),
                    status__in=['paid', 'preparing', 'completed']
                )
            )
        })