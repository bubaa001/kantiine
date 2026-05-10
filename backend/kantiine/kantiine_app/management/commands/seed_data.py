"""
Kantiine Seed Data Command
Creates realistic demo data matching the UI screenshots:
- Categories: Main Dishes, Rico Burgers, Rico BBQ, Beverages, Desserts
- Iconic item: Ngarenaro Special (TZS 25,000) with starch options
- Sample users: admin, seller (cashier), customers (students)
- Sample orders in different statuses
"""

import os
import django
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from decimal import Decimal
from django.utils import timezone
from django.db import transaction

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kantiine.settings')
django.setup()

from kantiine_app.models import Category, FoodItem, CustomUser, Wallet, Order, OrderItem, Coupon

User = get_user_model()

class Command(BaseCommand):
    help = "Seed Kantiine database with realistic university canteen demo data"

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Starting Kantiine seed data..."))

        with transaction.atomic():
            self.clear_existing_data()
            self.create_users()
            self.create_categories()
            self.create_food_items()
            self.create_sample_orders()

        self.stdout.write(self.style.SUCCESS("Kantiine demo data seeded successfully!"))
        self.stdout.write("Login credentials:")
        self.stdout.write("  Admin: admin / admin123 (role=admin)")
        self.stdout.write("  Seller: seller / seller123 (role=seller)")
        self.stdout.write("  Student1: joshua / student123 (role=customer) - has wallet balance")
        self.stdout.write("  Student2: amina / student123 (role=customer)")

    def clear_existing_data(self):
        self.stdout.write("Clearing existing data...")
        FoodItem.objects.all().delete()
        Category.objects.all().delete()
        # Keep superusers and recreate demo users
        CustomUser.objects.filter(is_superuser=False).delete()

    def create_users(self):
        self.stdout.write("Creating demo users...")

        # Admin
        admin, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@kantiine.ac.tz',
                'first_name': 'System',
                'last_name': 'Administrator',
                'role': 'admin',
                'phone_number': '+255700000001',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if not admin.check_password('admin123'):
            admin.set_password('admin123')
            admin.save()

        # Seller / Cashier
        seller, _ = User.objects.get_or_create(
            username='seller',
            defaults={
                'email': 'cashier@kantiine.ac.tz',
                'first_name': 'Fatma',
                'last_name': 'Juma',
                'role': 'seller',
                'phone_number': '+255712345678',
            }
        )
        if not seller.check_password('seller123'):
            seller.set_password('seller123')
            seller.save()

        # Customers (Students)
        customer1, _ = User.objects.get_or_create(
            username='joshua',
            defaults={
                'email': 'joshua@student.ac.tz',
                'first_name': 'Joshua',
                'last_name': 'John',
                'role': 'customer',
                'phone_number': '+255742901900',  # Matches screenshot
            }
        )
        if not customer1.check_password('student123'):
            customer1.set_password('student123')
            customer1.save()
        Wallet.objects.get_or_create(user=customer1, defaults={'balance': Decimal('15000.00')})  # Has some change credit

        customer2, _ = User.objects.get_or_create(
            username='amina',
            defaults={
                'email': 'amina@student.ac.tz',
                'first_name': 'Amina',
                'last_name': 'Khalid',
                'role': 'customer',
                'phone_number': '+255765432109',
            }
        )
        if not customer2.check_password('student123'):
            customer2.set_password('student123')
            customer2.save()
        Wallet.objects.get_or_create(user=customer2, defaults={'balance': Decimal('0.00')})

        self.stdout.write("  Admin, Seller, 2 Students created")

    def create_categories(self):
        self.stdout.write("Creating categories...")

        categories_data = [
            {
                'name': 'Main Dishes',
                'description': 'Signature local meals and favorites',
                'display_order': 1,
            },
            {
                'name': 'Rico Burgers',
                'description': 'Juicy burgers with local twists',
                'display_order': 2,
            },
            {
                'name': 'Rico BBQ',
                'description': 'Grilled meats and smoky flavors',
                'display_order': 3,
            },
            {
                'name': 'Beverages',
                'description': 'Fresh juices, sodas & traditional drinks',
                'display_order': 4,
            },
            {
                'name': 'Desserts',
                'description': 'Sweet treats and local favorites',
                'display_order': 5,
            },
        ]

        for cat_data in categories_data:
            Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'description': cat_data['description'],
                    'display_order': cat_data['display_order'],
                    'is_active': True,
                }
            )
        self.stdout.write("  5 Categories created")

    def create_food_items(self):
        self.stdout.write("Creating food items (including Ngarenaro Special)...")

        main_dishes = Category.objects.get(name='Main Dishes')
        burgers = Category.objects.get(name='Rico Burgers')
        bbq = Category.objects.get(name='Rico BBQ')
        beverages = Category.objects.get(name='Beverages')
        desserts = Category.objects.get(name='Desserts')

        food_items = [
            # Main Dishes
            {
                'name': 'Ngarenaro Special',
                'description': '1 Fried bananas, 1 Russian Sausage, Portion of Grilled Beef, Salad. A meal for 1 person(s).',
                'price': Decimal('25000.00'),
                'category': main_dishes,
                'is_popular': True,
                'is_new': False,
                'preparation_time_minutes': 25,
                'calories': 850,
                'has_options': True,
                'options': {
                    'starch': ['Plantain starch', 'Ugali Dona', 'Ugali Sembe', 'White Rice']
                },
            },
            {
                'name': 'Chicken Nuggets',
                'description': 'Rico Signature Chicken Nuggets, Multi Sauces, Salad & Fries',
                'price': Decimal('30000.00'),
                'category': main_dishes,
                'is_popular': True,
                'is_new': True,
                'preparation_time_minutes': 18,
                'calories': 720,
                'has_options': False,
            },
            {
                'name': 'JUA Chomoza Platter',
                'description': 'Grilled chicken, sausages, eggs, fried plantain, ugali & fresh salad',
                'price': Decimal('35000.00'),
                'category': main_dishes,
                'is_popular': False,
                'is_new': False,
                'preparation_time_minutes': 30,
                'calories': 950,
            },
            # Burgers
            {
                'name': 'Rico Classic Burger',
                'description': 'Beef patty, cheese, lettuce, tomato, special sauce on toasted bun',
                'price': Decimal('18000.00'),
                'category': burgers,
                'is_popular': True,
                'is_new': False,
                'preparation_time_minutes': 12,
            },
            {
                'name': 'Double Trouble Burger',
                'description': 'Two beef patties, double cheese, bacon, caramelized onions',
                'price': Decimal('28000.00'),
                'category': burgers,
                'is_popular': False,
                'is_new': True,
            },
            # BBQ
            {
                'name': 'Grilled Beef Skewers',
                'description': 'Marinated beef cubes with peppers, onions & spicy dipping sauce',
                'price': Decimal('22000.00'),
                'category': bbq,
                'is_popular': True,
                'is_new': False,
            },
            {
                'name': 'Rico BBQ Platter (2 pax)',
                'description': 'Mixed grilled meats, plantain, ugali, kachumbari & sauces',
                'price': Decimal('55000.00'),
                'category': bbq,
                'is_popular': False,
                'is_new': False,
            },
            # Beverages
            {
                'name': 'Fresh Passion Juice',
                'description': '100% fresh passion fruit juice',
                'price': Decimal('5000.00'),
                'category': beverages,
                'is_popular': True,
                'is_new': False,
            },
            {
                'name': 'Mango & Ginger Cooler',
                'description': 'Fresh mango blended with ginger and mint',
                'price': Decimal('6500.00'),
                'category': beverages,
                'is_popular': False,
                'is_new': True,
            },
            # Desserts
            {
                'name': 'Kaimati with Honey',
                'description': 'Traditional Swahili sweet dumplings drizzled with local honey',
                'price': Decimal('8000.00'),
                'category': desserts,
                'is_popular': True,
                'is_new': False,
            },
            {
                'name': 'Chocolate & Banana Spring Rolls',
                'description': 'Crispy rolls filled with chocolate & banana, served with vanilla ice cream',
                'price': Decimal('12000.00'),
                'category': desserts,
                'is_popular': False,
                'is_new': True,
            },
        ]

        for item_data in food_items:
            FoodItem.objects.get_or_create(
                name=item_data['name'],
                defaults=item_data
            )

        self.stdout.write(f"  {len(food_items)} Food items created (Ngarenaro Special highlighted)")

    def create_sample_orders(self):
        self.stdout.write("Creating sample orders for demo...")

        customer = CustomUser.objects.get(username='joshua')
        seller = CustomUser.objects.get(username='seller')
        ngarenaro = FoodItem.objects.get(name='Ngarenaro Special')
        nuggets = FoodItem.objects.get(name='Chicken Nuggets')

        # Order 1: Pending (for seller to approve)
        order1 = Order.objects.create(
            customer=customer,
            total_amount=Decimal('25000.00'),
            status='pending',
            notes='Extra chili please'
        )
        OrderItem.objects.create(
            order=order1,
            food_item=ngarenaro,
            quantity=1,
            selected_options={'starch': 'Plantain starch'}
        )

        # Order 2: Paid/Preparing (with coupon)
        order2 = Order.objects.create(
            customer=customer,
            total_amount=Decimal('30000.00'),
            status='preparing',
            amount_paid=Decimal('30000.00'),
            wallet_used=Decimal('0.00'),
        )
        OrderItem.objects.create(
            order=order2,
            food_item=nuggets,
            quantity=1,
            selected_options={}
        )
        # Coupon already auto-created via model save, but ensure
        Coupon.objects.get_or_create(order=order2)

        # Order 3: Completed (past)
        order3 = Order.objects.create(
            customer=customer,
            total_amount=Decimal('18000.00'),
            status='completed',
            amount_paid=Decimal('20000.00'),
            change_given=Decimal('2000.00'),
        )
        # Would have items, but for brevity

        self.stdout.write("  Sample orders created (1 Pending, 1 Preparing with coupon, 1 Completed)")

        # Create a notification
        from kantiine_app.models import Notification
        Notification.objects.create(
            user=customer,
            title="Welcome to Kantiine!",
            message="Your digital wallet is ready. Top up or earn change from cash payments."
        )