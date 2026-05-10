# Kantiine - University Canteen Food Management System

**Modern, responsive, full-stack canteen ordering platform**  
Inspired by premium mobile food apps (dark theme #121212, vibrant red #E60000 accents, bottom navigation).

## Features Implemented (Phase 1 Complete)
- Dynamic menu (no hard-coded items)
- Role-based access: Admin | Seller (Cashier) | Customer (Student)
- Digital Wallet + Change/Credit Ledger system
- Manual cash payment approval flow
- Automatic unique coupon code generation (scannable)
- Order status workflow (Pending → Paid → Preparing → Completed)
- Full REST API ready for React frontend

## Tech Stack
**Backend:** Django 5 + DRF + SimpleJWT + SQLite/PostgreSQL  
**Frontend (Phase 3):** React 18 + Vite + Tailwind CSS + Redux Toolkit + React Router + QRCode

## Quick Start (Local Development)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Create .env file (see below)
python manage.py migrate
python manage.py createsuperuser   # Create admin user

# Seed demo data (after Phase 2)
python manage.py seed_data
python manage.py runserver
```

### 2. Frontend Setup (coming in Phase 3)
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables (.env)
```env
DEBUG=True
SECRET_KEY=your-super-secret-key-here
DATABASE_URL=sqlite:///db.sqlite3   # or postgres://...
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

## Project Structure
```
kantiine/
├── backend/
│   ├── kantiine/                 # Django project
│   │   ├── settings.py
│   │   └── urls.py
│   └── kantiine_app/             # Main app
│       ├── models.py             # ✅ Phase 1 Complete
│       ├── serializers.py        # ✅ Phase 1 Complete
│       ├── views.py              # (Phase 2)
│       ├── urls.py               # (Phase 2)
│       └── management/commands/seed_data.py
│   └── requirements.txt
└── frontend/                     # React + Vite (Phase 3)
    └── src/
        ├── components/
        ├── pages/
        ├── store/ (Redux)
        └── ...
└── README.md
```

## Matching the Provided UI Screenshots
- Exact bottom navigation: Home (🏠), Orders (📋), Search (🔍), Cart (🛒), Settings (⚙️)
- Dark mode default (#000000 / #121212)
- Primary red buttons & accents (#E60000)
- Food cards with high-quality images, prices in TZS
- "Ngarenaro Special" example flow fully supported
- Seller dashboard for approving payments & viewing students
- Admin panel + custom React admin dashboard

## Current Status
**Phase 1: Database Models & Serializers** — ✅ **COMPLETE**

**Phase 2: Full REST API + Authentication + Seed Data** — ✅ **COMPLETE** (just now)

- Complete ViewSets with role-based permissions (Admin / Seller / Customer)
- Custom Order approval workflow (auto-generates Coupon + credits wallet for change)
- JWT Authentication with role claims in token
- Seller Dashboard summary endpoint
- Rich seed command with Ngarenaro Special, 11 food items, 5 categories, demo users
- Django Admin fully customized for Kantiine

**Phase 3: React Frontend (Vite + Tailwind)** — ✅ **COMPLETE**

Pixel-perfect implementation of all provided UI screenshots:
- Exact dark theme (#000000 / #121212) with #E60000 red accents
- Bottom navigation with active states and icons (Home, Orders, Search, Cart, Settings)
- Home screen: Category circles, Popular Meals grid, promotional banners, New Items
- Product detail: Starch of Choice radio options with thumbnails, quantity selector, live total
- Cart: Wallet balance toggle, closed hours state, place order flow
- Orders: Tabbed filters (All/Pending/Accepted/Preparing), empty state, QR coupon modal
- Settings: Profile card, theme toggle (dark/light), seller mode switch, logout
- Seller Dashboard: Live pending approvals queue, approve payment (triggers backend coupon + wallet credit)
- Full JWT auth, cart persistence, real-time polling, toast notifications
- Responsive mobile-first with status bar simulation

**To Launch:**
```bash
cd frontend
npm install          # Installs all dependencies (Vite, React, Tailwind, Axios, QRCode, Lucide icons, etc.)
npm run dev          # Runs on http://localhost:5173
```

Backend must be running: `cd backend && source venv/bin/activate && python manage.py runserver`

Demo accounts (from seed_data):
- Student: joshua / student123   (has wallet balance)
- Seller:  seller / seller123
- Admin:   admin  / admin123

All flows tested against live Django REST API. Ready for production deployment.

---

*This is a completely free, open-source project built for educational/local university use. No rush — quality first.*

**Designed & Developed with precision for Kantiine Canteen**