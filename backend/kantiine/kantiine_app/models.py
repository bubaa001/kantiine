from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import uuid

class CustomUser(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    Supports multiple roles: Admin, Seller (Cashier), Customer (Student).
    """
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('seller', 'Seller / Cashier'),
        ('customer', 'Customer / Student'),
    ]
    
    phone_number = models.CharField(max_length=15, unique=True, null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    is_verified = models.BooleanField(default=False)
    
    # For admin/seller quick access
    @property
    def is_admin_user(self):
        return self.role == 'admin' or self.is_superuser
    
    @property
    def is_seller_user(self):
        return self.role == 'seller'
    
    @property
    def is_customer_user(self):
        return self.role == 'customer'
    
    def __str__(self):
        return f"{self.username} ({self.role})"


class Wallet(models.Model):
    """
    Digital Wallet for each user (primarily customers).
    Tracks balance for change/credit system.
    """
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    last_updated = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Wallet for {self.user.username}: {self.balance} TZS"


class WalletTransaction(models.Model):
    """
    Ledger for all wallet movements (credits from change, debits for purchases).
    """
    TRANSACTION_TYPES = [
        ('credit', 'Credit (Change Received)'),
        ('debit', 'Debit (Used for Purchase)'),
    ]
    
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    description = models.TextField()
    reference_order = models.ForeignKey('Order', on_delete=models.SET_NULL, null=True, blank=True, related_name='wallet_transactions')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.transaction_type.upper()}: {self.amount} TZS - {self.description[:50]}"


class Category(models.Model):
    """
    Food categories (e.g., Main Dishes, Burgers, BBQ, Beverages, Desserts).
    """
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['display_order', 'name']
    
    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name


class FoodItem(models.Model):
    """
    Individual menu items. All data is dynamic - no hardcoding.
    """
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='food_items/', blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='food_items')
    is_available = models.BooleanField(default=True)
    is_popular = models.BooleanField(default=False)
    is_new = models.BooleanField(default=False)
    preparation_time_minutes = models.PositiveIntegerField(default=15)
    calories = models.PositiveIntegerField(null=True, blank=True)
    
    # For options like starch choice, we can use a JSON field or separate model later
    has_options = models.BooleanField(default=False)
    options = models.JSONField(default=dict, blank=True)  # e.g., {"starch": ["Plantain", "Ugali Dona", "White Rice"]}
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_popular', '-is_new', 'name']
    
    def __str__(self):
        return f"{self.name} - {self.price} TZS"


class Order(models.Model):
    """
    Customer order. Status workflow: pending -> paid -> preparing -> completed (or cancelled).
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Payment'),
        ('paid', 'Paid / Approved'),
        ('preparing', 'Preparing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    order_number = models.CharField(max_length=20, unique=True, editable=False)
    customer = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='orders')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Payment & Change tracking
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    change_given = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    wallet_used = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.order_number:
            # Generate unique order number like KAN-20260510-0001
            date_str = timezone.now().strftime('%Y%m%d')
            last_order = Order.objects.filter(order_number__startswith=f'KAN-{date_str}').order_by('-id').first()
            if last_order:
                last_num = int(last_order.order_number.split('-')[-1])
                new_num = last_num + 1
            else:
                new_num = 1
            self.order_number = f'KAN-{date_str}-{new_num:04d}'
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.order_number} - {self.customer.username} ({self.status})"


class OrderItem(models.Model):
    """
    Line items in an order. Supports quantity and selected options (e.g., starch choice).
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    food_item = models.ForeignKey(FoodItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    selected_options = models.JSONField(default=dict, blank=True)  # e.g., {"starch": "Plantain starch"}
    
    def save(self, *args, **kwargs):
        self.unit_price = self.food_item.price
        self.subtotal = self.unit_price * self.quantity
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.quantity}x {self.food_item.name}"


class Coupon(models.Model):
    """
    Unique scannable coupon generated after payment approval.
    Student shows this to claim food.
    """
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='coupon')
    code = models.CharField(max_length=12, unique=True, editable=False)
    is_redeemed = models.BooleanField(default=False)
    redeemed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.code:
            # Short unique code, e.g., KAN-8F3K9P
            self.code = f"KAN-{uuid.uuid4().hex[:8].upper()}"
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(hours=4)
        super().save(*args, **kwargs)
    
    def redeem(self):
        if not self.is_redeemed:
            self.is_redeemed = True
            self.redeemed_at = timezone.now()
            self.save()
            return True
        return False
    
    def __str__(self):
        status = "REDEEMED" if self.is_redeemed else "ACTIVE"
        return f"{self.code} ({status}) - Order {self.order.order_number}"


class Notification(models.Model):
    """
    Simple in-app notifications for order updates, promotions, etc.
    """
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} for {self.user.username}"