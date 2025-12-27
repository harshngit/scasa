# Flutter Backend Documentation

Complete backend documentation for building a Flutter app using the same Supabase backend.

---

## 📚 Documentation Index

### Getting Started

1. **[00_OVERVIEW.md](./00_OVERVIEW.md)** - Start here!
   - Environment setup
   - Authentication system overview
   - Database schema overview
   - Row Level Security (RLS)
   - Storage buckets
   - Flutter integration basics

### Module Documentation

2. **[01_RESIDENTS.md](./01_RESIDENTS.md)** - Residents Management
   - Residents table schema
   - Owner/renter information
   - JSONB fields (residents_living, vehicle_detail, documents, owner_history)
   - Owner change tracking
   - Flutter data models

3. **[02_MAINTENANCE_PAYMENTS.md](./02_MAINTENANCE_PAYMENTS.md)** - Maintenance Payments
   - Monthly payment tracking
   - Payment status (paid, unpaid, overdue, partial)
   - Invoice generation
   - Receipt generation
   - Flutter data models

4. **[03_FINANCE.md](./03_FINANCE.md)** - Finance Module
   - Finance passbook
   - Vendor invoices
   - Billing history
   - Transaction aggregation
   - Income vs Expense tracking

5. **[04_NOTICE_BOARD.md](./04_NOTICE_BOARD.md)** - Notice Board
   - Announcements and notices
   - Priority levels
   - Categories
   - Archive functionality

6. **[05_COMPLAINTS.md](./05_COMPLAINTS.md)** - Complaints
   - Resident complaints
   - Complaint tracking
   - Search and filtering

7. **[06_PERMISSIONS.md](./06_PERMISSIONS.md)** - Permissions
   - Permission requests
   - Resident permission tracking
   - Similar structure to complaints

8. **[07_VENDORS.md](./07_VENDORS.md)** - Vendors
   - Vendor/supplier management
   - Bill tracking (total, paid, outstanding)
   - Vendor invoices
   - Payment recording

9. **[08_HELPERS.md](./08_HELPERS.md)** - Helpers
   - Helper/maid management
   - Flat assignment (many-to-many via array)
   - Photo storage
   - Helper types

10. **[09_EXPENSES.md](./09_EXPENSES.md)** - Expenses
    - Deposite on Renovation
    - Society Owned Rooms
    - Rental management
    - Deposit tracking

11. **[10_USERS.md](./10_USERS.md)** - Users & Authentication
    - Custom authentication system
    - User roles (admin, receptionist, resident)
    - Password hashing (SHA-256)
    - Session management
    - Role-based permissions

---

## 🚀 Quick Start Guide

### 1. Read Overview First

Start with **[00_OVERVIEW.md](./00_OVERVIEW.md)** to understand:
- How authentication works (custom, not Supabase Auth)
- Environment variables needed
- Database structure
- Flutter setup basics

### 2. Understand Authentication

Read **[10_USERS.md](./10_USERS.md)** to implement:
- Custom login/signup
- Password hashing
- Session management
- Role-based access

### 3. Implement Core Modules

Follow this order:
1. **Users** - Authentication first
2. **Residents** - Core data
3. **Maintenance Payments** - Financial tracking
4. **Finance** - Aggregated views
5. Other modules as needed

---

## 📋 Table Reference

| Table Name | Documentation | Purpose |
|-----------|---------------|---------|
| `users` | [10_USERS.md](./10_USERS.md) | User accounts & authentication |
| `residents` | [01_RESIDENTS.md](./01_RESIDENTS.md) | Resident/owner information |
| `maintenance_payments` | [02_MAINTENANCE_PAYMENTS.md](./02_MAINTENANCE_PAYMENTS.md) | Monthly maintenance payments |
| `maintenance_requests` | (See Maintenance module) | Maintenance service requests |
| `complaints` | [05_COMPLAINTS.md](./05_COMPLAINTS.md) | Resident complaints |
| `permissions` | [06_PERMISSIONS.md](./06_PERMISSIONS.md) | Permission requests |
| `notices` | [04_NOTICE_BOARD.md](./04_NOTICE_BOARD.md) | Notice board announcements |
| `vendors` | [07_VENDORS.md](./07_VENDORS.md) | Vendor/supplier information |
| `vendor_invoices` | [03_FINANCE.md](./03_FINANCE.md) | Vendor invoice records |
| `billing_history` | [03_FINANCE.md](./03_FINANCE.md) | Payment transaction history |
| `helpers` | [08_HELPERS.md](./08_HELPERS.md) | Helper/maid information |
| `society_owned_rooms` | [09_EXPENSES.md](./09_EXPENSES.md) | Society-owned room management |
| `deposite_on_renovation` | [09_EXPENSES.md](./09_EXPENSES.md) | Renovation deposit records |

---

## 🔑 Key Concepts

### Custom Authentication
- **NOT using Supabase Auth**
- Custom `users` table with SHA-256 password hashing
- Session stored in localStorage/SharedPreferences
- See [10_USERS.md](./10_USERS.md) for details

### Row Level Security (RLS)
- Currently permissive (all authenticated users have full access)
- **Must tighten for production**
- Each module README includes RLS policy details

### JSONB Fields
Several tables use JSONB arrays:
- `residents.residents_living` - Array of resident objects
- `residents.vehicle_detail` - Array of vehicle objects
- `residents.documents` - Array of document objects
- `residents.owner_history` - Array of previous owner records
- `vendor_invoices.items` - Array of invoice line items
- `helpers.rooms` - Array of flat numbers (TEXT[])

### Storage Buckets
- `helper-photos` - Helper photos
- `rent-agreements` - Rental agreement documents
- `documents` - General resident documents

---

## ⚠️ Important Notes

1. **Password Hashing**: Uses SHA-256 (consider bcrypt for production)
2. **RLS Policies**: Currently permissive - tighten for production
3. **Session Management**: Stored locally - not secure for sensitive data
4. **Date Fields**: Many use DATE type (not TIMESTAMP) - use `YYYY-MM-DD` format
5. **Currency**: Use NUMERIC(12,2) for proper currency handling
6. **Cascade Deletes**: Some foreign keys have CASCADE - be careful when deleting

---

## 📖 Documentation Structure

Each module README includes:
- ✅ Table schema with all columns
- ✅ Data types, nullable, defaults, constraints
- ✅ Relationships (foreign keys)
- ✅ RLS policies
- ✅ API usage examples (SELECT, INSERT, UPDATE, DELETE)
- ✅ Business logic & data flow
- ✅ Flutter data models
- ✅ Known issues & gotchas

---

## 🛠️ Flutter Integration Checklist

- [ ] Read [00_OVERVIEW.md](./00_OVERVIEW.md)
- [ ] Set up Supabase client
- [ ] Implement custom authentication ([10_USERS.md](./10_USERS.md))
- [ ] Create data models for each module
- [ ] Implement API calls using examples in each README
- [ ] Handle JSONB fields properly
- [ ] Implement file uploads for storage buckets
- [ ] Test RLS policies
- [ ] Implement error handling
- [ ] Add proper date/time handling

---

## 📞 Support

For questions:
1. Check the relevant module README
2. Review API usage examples
3. Check "Known Issues & Gotchas" section
4. Refer to Supabase Flutter documentation: https://supabase.com/docs/reference/dart/introduction

---

## 📝 Notes

- All timestamps are `TIMESTAMP WITH TIME ZONE`
- All dates are `DATE` type (use `YYYY-MM-DD` format)
- UUIDs are used for all primary keys
- JSONB fields require careful handling in Flutter
- Storage bucket policies must allow authenticated uploads

---

**Last Updated**: December 2024

