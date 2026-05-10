from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser, Wallet, WalletTransaction, Category, FoodItem,
    Order, OrderItem, Coupon, Notification
)

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'phone_number', 'is_verified')
    list_filter = ('role', 'is_verified', 'is_staff')
    fieldsets = UserAdmin.fieldsets + (
        ('Kantiine Profile', {'fields': ('role', 'phone_number', 'is_verified')}),
    )

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'display_order', 'is_active', 'food_items_count')
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ('display_order', 'is_active')

    def food_items_count(self, obj):
        return obj.food_items.count()

@admin.register(FoodItem)
class FoodItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'is_available', 'is_popular', 'is_new')
    list_filter = ('category', 'is_available', 'is_popular', 'is_new')
    search_fields = ('name', 'description')
    list_editable = ('price', 'is_available', 'is_popular', 'is_new')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'customer', 'status', 'total_amount', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('order_number', 'customer__username')
    readonly_fields = ('order_number', 'created_at', 'updated_at')

@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'order', 'is_redeemed', 'created_at', 'expires_at')
    list_filter = ('is_redeemed',)
    search_fields = ('code', 'order__order_number')

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'balance', 'last_updated')
    search_fields = ('user__username',)

admin.site.site_header = "Kantiine Canteen Administration"
admin.site.site_title = "Kantiine Admin"
admin.site.index_title = "Welcome to Kantiine Management Portal"