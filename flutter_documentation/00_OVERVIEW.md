# Backend Overview & Setup Guide

## Table of Contents
1. [Environment Setup](#environment-setup)
2. [Authentication System](#authentication-system)
3. [Database Schema Overview](#database-schema-overview)
4. [Row Level Security (RLS)](#row-level-security-rls)
5. [Storage Buckets](#storage-buckets)
6. [Flutter Integration Basics](#flutter-integration-basics)

---

## Environment Setup

### Required Environment Variables

```env
VITE_SUPABASE_URL=https://tzaemqzrdmwbcgriyymg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6YWVtcXpyZG13YmNncml5eW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NjIwMzIsImV4cCI6MjA4MDIzODAzMn0.Sw82hrzJ6r_rmzW3WZc5AH5bpaiWcd76Cs-WbRhamNU
```

### Flutter Configuration

**⚠️ CRITICAL:** Never use the `service_role` key in Flutter client code. Only use the `anon` key.

```dart
// lib/config/supabase_config.dart
class SupabaseConfig {
  static const String supabaseUrl = 'https://tzaemqzrdmwbcgriyymg.supabase.co';
  static const String supabaseAnonKey = 'YOUR_ANON_KEY_HERE';
}
```

---

## Authentication System

### Custom Authentication (NOT Supabase Auth)

This application uses **custom authentication** with a `users` table, NOT Supabase's built-in auth system.

### Authentication Flow

1. **Login**: User provides email/mobile + password
2. **Password Verification**: SHA-256 hash comparison
3. **Session Management**: User data stored in localStorage (React) / SharedPreferences (Flutter)

### Password Hashing

- **Algorithm**: SHA-256
- **Implementation**: `CryptoJS.SHA256(password).toString()`
- **Flutter Equivalent**: Use `crypto` package with SHA-256

```dart
import 'package:crypto/crypto.dart';
import 'dart:convert';

String hashPassword(String password) {
  var bytes = utf8.encode(password);
  var digest = sha256.convert(bytes);
  return digest.toString();
}
```

### User Roles

- `admin`: Full access to all modules
- `receptionist`: Limited access (no admin functions)
- `resident`: Read-only access to most modules

### Role Permissions

See `src/types/index.ts` for complete permission matrix.

---

## Database Schema Overview

### Core Tables

1. **users** - User accounts and authentication
2. **residents** - Resident/owner information
3. **maintenance_payments** - Monthly maintenance payment records
4. **maintenance_requests** - Maintenance service requests
5. **complaints** - Resident complaints
6. **permissions** - Permission requests from residents
7. **notices** - Notice board announcements
8. **vendors** - Vendor/supplier information
9. **vendor_invoices** - Vendor invoice records
10. **billing_history** - Payment transaction history
11. **helpers** - Helper/maid information
12. **society_owned_rooms** - Society-owned room management
13. **deposite_on_renovation** - Renovation deposit records

### Relationships

```
residents ──< maintenance_payments
residents ──< helpers
vendors ──< vendor_invoices
vendors ──< billing_history
residents ──< deposite_on_renovation
```

---

## Row Level Security (RLS)

### Current RLS Policy

**⚠️ IMPORTANT:** All tables currently have **permissive RLS policies** for development:

- **Authenticated users**: Full access (SELECT, INSERT, UPDATE, DELETE)
- **Anonymous users**: Full access (for development only)

### Production Recommendations

For production, implement stricter policies:

```sql
-- Example: Residents can only view their own data
CREATE POLICY "Residents can view own data" ON residents
  FOR SELECT
  USING (auth.uid()::text = (SELECT user_id FROM users WHERE flat_no = residents.flat_number));
```

### RLS Status by Table

All tables have RLS enabled with permissive policies. Review each module's README for specific policy details.

---

## Storage Buckets

### Available Buckets

1. **helper-photos** - Helper/maid photos
2. **rent-agreements** - Rental agreement documents
3. **documents** - General resident documents

### Storage Access Pattern

```dart
// Upload file
final file = File('path/to/file');
final fileName = 'unique-file-name';
final bucketName = 'helper-photos';

final response = await supabase.storage
  .from(bucketName)
  .upload(fileName, file);

// Get public URL
final publicUrl = supabase.storage
  .from(bucketName)
  .getPublicUrl(fileName);
```

---

## Flutter Integration Basics

### 1. Supabase Client Setup

```dart
import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> main() async {
  await Supabase.initialize(
    url: SupabaseConfig.supabaseUrl,
    anonKey: SupabaseConfig.supabaseAnonKey,
  );
  runApp(MyApp());
}

final supabase = Supabase.instance.client;
```

### 2. Custom Authentication Service

```dart
class AuthService {
  final supabase = Supabase.instance.client;
  
  Future<Map<String, dynamic>> login(String emailOrMobile, String password) async {
    // Hash password
    final passwordHash = hashPassword(password);
    
    // Query users table
    final response = await supabase
      .from('users')
      .select('*')
      .or('email.eq.$emailOrMobile,mobile_number.eq.$emailOrMobile')
      .single();
    
    if (response.data == null) {
      throw Exception('Invalid credentials');
    }
    
    // Verify password
    if (hashPassword(password) != response.data['password_hash']) {
      throw Exception('Invalid credentials');
    }
    
    // Store user session
    await _storeUserSession(response.data);
    
    return response.data;
  }
  
  Future<void> _storeUserSession(Map<String, dynamic> userData) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('currentUser', jsonEncode(userData));
  }
}
```

### 3. Data Models

Each module README includes Flutter data model examples. Follow the pattern:

```dart
class Resident {
  final String id;
  final String ownerName;
  final String flatNumber;
  final String residencyType;
  // ... other fields
  
  Resident.fromJson(Map<String, dynamic> json)
    : id = json['id'],
      ownerName = json['owner_name'],
      flatNumber = json['flat_number'],
      residencyType = json['residency_type'];
  
  Map<String, dynamic> toJson() => {
    'id': id,
    'owner_name': ownerName,
    'flat_number': flatNumber,
    'residency_type': residencyType,
  };
}
```

---

## Common Query Patterns

### Basic SELECT

```dart
final response = await supabase
  .from('residents')
  .select('*')
  .order('created_at', ascending: false);
```

### Filtering

```dart
final response = await supabase
  .from('residents')
  .select('*')
  .eq('residency_type', 'owner-living')
  .ilike('owner_name', '%John%');
```

### Pagination

```dart
final response = await supabase
  .from('residents')
  .select('*')
  .range(0, 9) // First 10 records
  .order('created_at', ascending: false);
```

### Joins (Foreign Key Relations)

```dart
final response = await supabase
  .from('maintenance_payments')
  .select('*, residents(*)')
  .eq('status', 'paid');
```

---

## Next Steps

1. Read module-specific README files:
   - `01_RESIDENTS.md`
   - `02_MAINTENANCE_PAYMENTS.md`
   - `03_FINANCE.md`
   - `04_NOTICE_BOARD.md`
   - `05_COMPLAINTS.md`
   - `06_PERMISSIONS.md`
   - `07_VENDORS.md`
   - `08_HELPERS.md`
   - `09_EXPENSES.md`
   - `10_USERS.md`

2. Review API usage examples in each module
3. Implement Flutter data models based on provided examples
4. Test authentication flow
5. Implement RLS policies for production

---

## Known Issues & Gotchas

1. **Custom Auth**: Not using Supabase Auth - must implement custom login/signup
2. **Password Hashing**: Must use SHA-256 (not bcrypt or other algorithms)
3. **RLS Policies**: Currently permissive - must tighten for production
4. **Storage**: Ensure bucket policies allow authenticated uploads
5. **JSONB Fields**: Some fields are JSONB arrays (residents_living, vehicle_detail, documents) - handle carefully in Flutter
6. **Timestamps**: All timestamps are `TIMESTAMP WITH TIME ZONE` - use DateTime in Flutter

---

## Support

For questions or issues, refer to:
- Supabase Flutter Documentation: https://supabase.com/docs/reference/dart/introduction
- Module-specific README files in this directory

