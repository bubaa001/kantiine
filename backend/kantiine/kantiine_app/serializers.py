from rest_framework import serializers
from .models import (
    CustomUser, Wallet, WalletTransaction, Category, FoodItem,
    Order, OrderItem, Coupon, Notification
)
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomUserSerializer(serializers.ModelSerializer):
    """Serializer for user registration and profile."""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label="Confirm Password")
    
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 
                  'phone_number', 'role', 'password', 'password2')
        extra_kwargs = {
            'email': {'required': True},
            'phone_number': {'required': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = CustomUser.objects.create_user(**validated_data)
        # Create wallet for new customer
        if user.role == 'customer':
            Wallet.objects.create(user=user, balance=0.00)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Public profile info (no password)."""
    wallet_balance = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 
                  'phone_number', 'role', 'wallet_balance', 'date_joined')
        read_only_fields = ('role', 'date_joined')
    
    def get_wallet_balance(self, obj):
        if hasattr(obj, 'wallet'):
            return obj.wallet.balance
        return 0.00


class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = '__all__'
        read_only_fields = ('created_at',)


class WalletSerializer(serializers.ModelSerializer):
    transactions = WalletTransactionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Wallet
        fields = ('id', 'balance', 'last_updated', 'transactions')


class CategorySerializer(serializers.ModelSerializer):
    food_items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'image', 'description', 
                  'is_active', 'display_order', 'food_items_count')
    
    def get_food_items_count(self, obj):
        return obj.food_items.filter(is_available=True).count()


class FoodItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = FoodItem
        fields = ('id', 'name', 'description', 'price', 'image', 'category', 
                  'category_name', 'is_available', 'is_popular', 'is_new',
                  'preparation_time_minutes', 'calories', 'has_options', 'options')


class OrderItemSerializer(serializers.ModelSerializer):
    food_item_name = serializers.CharField(source='food_item.name', read_only=True)
    food_item_image = serializers.ImageField(source='food_item.image', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ('id', 'food_item', 'food_item_name', 'food_item_image',
                  'quantity', 'unit_price', 'subtotal', 'selected_options')


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    coupon_code = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = ('id', 'order_number', 'customer', 'customer_name', 'total_amount',
                  'status', 'amount_paid', 'change_given', 'wallet_used',
                  'notes', 'created_at', 'updated_at', 'items', 'coupon_code')
        read_only_fields = ('order_number', 'created_at', 'updated_at')
    
    def get_coupon_code(self, obj):
        if hasattr(obj, 'coupon'):
            return obj.coupon.code
        return None


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new order from cart items."""
    items = serializers.ListField(child=serializers.DictField(), write_only=True)
    
    class Meta:
        model = Order
        fields = ('items', 'notes', 'wallet_used')
    
    def validate(self, data):
        items_data = data.get('items', [])
        if not items_data:
            raise serializers.ValidationError("Order must contain at least one item.")
        
        total = 0
        for item in items_data:
            try:
                food = FoodItem.objects.get(id=item['food_item_id'], is_available=True)
                qty = int(item.get('quantity', 1))
                total += food.price * qty
            except FoodItem.DoesNotExist:
                raise serializers.ValidationError(f"Food item {item.get('food_item_id')} not available.")
        
        wallet_used = data.get('wallet_used', 0)
        user = self.context['request'].user
        if wallet_used > 0:
            if not hasattr(user, 'wallet') or user.wallet.balance < wallet_used:
                raise serializers.ValidationError("Insufficient wallet balance.")
            if wallet_used > total:
                raise serializers.ValidationError("Wallet amount cannot exceed order total.")
        
        data['calculated_total'] = total - wallet_used
        return data
    
    def create(self, validated_data):
        user = self.context['request'].user
        items_data = validated_data.pop('items')
        wallet_used = validated_data.pop('wallet_used', 0)
        calculated_total = validated_data.pop('calculated_total')
        
        order = Order.objects.create(
            customer=user,
            total_amount=calculated_total + wallet_used,
            wallet_used=wallet_used,
            **validated_data
        )
        
        for item_data in items_data:
            food = FoodItem.objects.get(id=item_data['food_item_id'])
            OrderItem.objects.create(
                order=order,
                food_item=food,
                quantity=item_data.get('quantity', 1),
                selected_options=item_data.get('selected_options', {})
            )
        
        # Deduct from wallet if used
        if wallet_used > 0 and hasattr(user, 'wallet'):
            wallet = user.wallet
            wallet.balance -= wallet_used
            wallet.save()
            WalletTransaction.objects.create(
                wallet=wallet,
                amount=wallet_used,
                transaction_type='debit',
                description=f"Used for order {order.order_number}",
                reference_order=order
            )
        
        return order


class CouponSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    
    class Meta:
        model = Coupon
        fields = ('id', 'code', 'is_redeemed', 'redeemed_at', 'created_at', 
                  'expires_at', 'order_number', 'order')


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('created_at',)


# Custom JWT Token Serializer with role info
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['username'] = user.username
        token['full_name'] = user.get_full_name()
        return token