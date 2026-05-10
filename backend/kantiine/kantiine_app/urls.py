from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'food-items', views.FoodItemViewSet, basename='fooditem')
router.register(r'orders', views.OrderViewSet, basename='order')
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'wallets', views.WalletViewSet, basename='wallet')
router.register(r'coupons', views.CouponViewSet, basename='coupon')
router.register(r'notifications', views.NotificationViewSet, basename='notification')
router.register(r'seller-dashboard', views.SellerDashboardViewSet, basename='seller-dashboard')

urlpatterns = [
    path('', include(router.urls)),
    # Additional custom endpoints can be added here
    path('auth/', include('rest_framework.urls')),  # For browsable API login (dev only)
]