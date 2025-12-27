# Users Module Documentation

## Table: `users`

### Purpose
Stores user accounts for authentication and authorization. This is a **custom authentication system** (NOT Supabase Auth).

---

## Database Schema

### Table Structure

| Column Name | Data Type | Nullable | Default | Primary Key | Foreign Key | Notes |
|------------|-----------|----------|---------|-------------|-------------|-------|
| `user_id` | UUID | NOT NULL | `gen_random_uuid()` | ✅ Yes | - | Primary key |
| `user_name` | TEXT | NOT NULL | - | - | - | User's full name |
| `email` | TEXT | NOT NULL | - | - | - | User email (unique) |
| `mobile_number` | TEXT | NULL | - | - | - | Mobile number (unique) |
| `password_hash` | TEXT | NOT NULL | - | - | - | SHA-256 hashed password |
| `role` | TEXT | NOT NULL | - | - | - | Enum: `'admin'`, `'receptionist'`, `'resident'` |
| `flat_no` | TEXT | NULL | - | - | - | Flat number (for residents only) |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | `NOW()` | - | - | Record creation timestamp |

### Constraints

- `role` must be one of: `'admin'`, `'receptionist'`, `'resident'`
- `email` should be unique (enforced at application level)
- `mobile_number` should be unique (enforced at application level)
- `flat_no` is required when `role = 'resident'`

---

## Relationships

### One-to-One (Optional)
- `users` >── `residents` (via `flat_no` matching `residents.flat_number`)

---

## Row Level Security (RLS)

### Current Policies

```sql
-- Allow authenticated users full access
CREATE POLICY "Allow authenticated users to read users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert users" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update users" ON users
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete users" ON users
  FOR DELETE USING (true);

-- Development: Allow anonymous access
CREATE POLICY "Allow anonymous access for development" ON users
  FOR ALL USING (true) WITH CHECK (true);
```

**⚠️ CRITICAL:** Tighten RLS policies for production:
- Users should only view their own data (except admins)
- Only admins can create/update/delete users

---

## Authentication Flow

### Login Process

1. **User Input**: Email/mobile + password
2. **Find User**: Query `users` table by email OR mobile_number
3. **Verify Password**: Compare SHA-256 hash
4. **Store Session**: Save user data in localStorage/SharedPreferences
5. **Set Permissions**: Load role-based permissions

### Password Hashing

- **Algorithm**: SHA-256
- **Implementation**: `CryptoJS.SHA256(password).toString()` (JavaScript)
- **Flutter**: Use `crypto` package

```dart
import 'package:crypto/crypto.dart';
import 'dart:convert';

String hashPassword(String password) {
  var bytes = utf8.encode(password);
  var digest = sha256.convert(bytes);
  return digest.toString();
}
```

### Role Permissions

See `src/types/index.ts` for complete permission matrix:

- **admin**: Full access to all modules
- **receptionist**: Limited access (no admin functions)
- **resident**: Read-only access to most modules

---

## API Usage Examples

### SELECT - Get All Users

```dart
final response = await supabase
  .from('users')
  .select('*')
  .order('created_at', ascending: false);

final users = (response.data as List)
  .map((json) => User.fromJson(json))
  .toList();
```

### SELECT - Get User by ID

```dart
final response = await supabase
  .from('users')
  .select('*')
  .eq('user_id', userId)
  .single();

final user = User.fromJson(response.data);
```

### SELECT - Login (Find by Email or Mobile)

```dart
final response = await supabase
  .from('users')
  .select('*')
  .or('email.eq.$emailOrMobile,mobile_number.eq.$emailOrMobile')
  .single();

if (response.data == null) {
  throw Exception('User not found');
}

final user = User.fromJson(response.data);
```

### SELECT - Check if User Exists

```dart
final response = await supabase
  .from('users')
  .select('user_id')
  .or('email.eq.$email,mobile_number.eq.$mobileNumber')
  .maybeSingle();

final userExists = response.data != null;
```

### INSERT - Create User

```dart
// 1. Check if user already exists
final existingUser = await supabase
  .from('users')
  .select('user_id')
  .or('email.eq.$email,mobile_number.eq.$mobileNumber')
  .maybeSingle();

if (existingUser.data != null) {
  throw Exception('User with this email or mobile already exists');
}

// 2. Hash password
final passwordHash = hashPassword(password);

// 3. Insert user
final response = await supabase
  .from('users')
  .insert({
    'user_name': userName,
    'email': email,
    'mobile_number': mobileNumber,
    'password_hash': passwordHash,
    'role': role,
    'flat_no': role == 'resident' ? flatNo : null,
  })
  .select()
  .single();
```

### UPDATE - Update User

```dart
final response = await supabase
  .from('users')
  .update({
    'user_name': newUserName,
    'email': newEmail,
    'mobile_number': newMobileNumber,
  })
  .eq('user_id', userId)
  .select()
  .single();
```

### UPDATE - Change Password

```dart
final newPasswordHash = hashPassword(newPassword);

final response = await supabase
  .from('users')
  .update({
    'password_hash': newPasswordHash,
  })
  .eq('user_id', userId);
```

### UPDATE - Change Role

```dart
final response = await supabase
  .from('users')
  .update({
    'role': newRole,
    'flat_no': newRole == 'resident' ? flatNo : null,
  })
  .eq('user_id', userId)
  .select()
  .single();
```

### DELETE - Delete User

```dart
final response = await supabase
  .from('users')
  .delete()
  .eq('user_id', userId);
```

---

## Business Logic & Data Flow

### User Creation Flow

1. **Validate Input**: Check required fields based on role
2. **Check Uniqueness**: Verify email/mobile doesn't exist
3. **Hash Password**: Generate SHA-256 hash
4. **Set Flat Number**: Required for residents, null for others
5. **Insert Record**: Create user in database

### Login Flow

1. **Find User**: Query by email OR mobile_number
2. **Verify Password**: Compare hashed password
3. **Load Permissions**: Get role-based permissions
4. **Store Session**: Save user data locally
5. **Navigate**: Redirect to dashboard

### Password Reset Flow

1. **Identify User**: Find by email/mobile/username
2. **Verify Identity**: (Add verification step in production)
3. **Hash New Password**: Generate SHA-256 hash
4. **Update Record**: Update `password_hash` field

---

## Flutter Data Model

```dart
class User {
  final String id;
  final String userName;
  final String email;
  final String? mobileNumber;
  final UserRole role;
  final String? flatNo;
  final DateTime createdAt;

  User({
    required this.id,
    required this.userName,
    required this.email,
    this.mobileNumber,
    required this.role,
    this.flatNo,
    required this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['user_id'],
      userName: json['user_name'],
      email: json['email'],
      mobileNumber: json['mobile_number'],
      role: UserRole.fromString(json['role']),
      flatNo: json['flat_no'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user_id': id,
      'user_name': userName,
      'email': email,
      'mobile_number': mobileNumber,
      'role': role.toString(),
      'flat_no': flatNo,
      'created_at': createdAt.toIso8601String(),
    };
  }

  bool get isAdmin => role == UserRole.admin;
  bool get isReceptionist => role == UserRole.receptionist;
  bool get isResident => role == UserRole.resident;
}

enum UserRole {
  admin,
  receptionist,
  resident;

  static UserRole fromString(String value) {
    switch (value) {
      case 'admin':
        return UserRole.admin;
      case 'receptionist':
        return UserRole.receptionist;
      case 'resident':
        return UserRole.resident;
      default:
        return UserRole.resident;
    }
  }

  @override
  String toString() {
    switch (this) {
      case UserRole.admin:
        return 'admin';
      case UserRole.receptionist:
        return 'receptionist';
      case UserRole.resident:
        return 'resident';
    }
  }
}

// User with password hash (for database operations)
class UserWithPassword extends User {
  final String passwordHash;

  UserWithPassword({
    required super.id,
    required super.userName,
    required super.email,
    super.mobileNumber,
    required super.role,
    super.flatNo,
    required super.createdAt,
    required this.passwordHash,
  });

  factory UserWithPassword.fromJson(Map<String, dynamic> json) {
    return UserWithPassword(
      id: json['user_id'],
      userName: json['user_name'],
      email: json['email'],
      mobileNumber: json['mobile_number'],
      role: UserRole.fromString(json['role']),
      flatNo: json['flat_no'],
      createdAt: DateTime.parse(json['created_at']),
      passwordHash: json['password_hash'],
    );
  }
}
```

---

## Authentication Service Example

```dart
class AuthService {
  final supabase = Supabase.instance.client;
  final prefs = SharedPreferences.getInstance();

  Future<User> login(String emailOrMobile, String password) async {
    // 1. Find user
    final response = await supabase
      .from('users')
      .select('*')
      .or('email.eq.$emailOrMobile,mobile_number.eq.$emailOrMobile')
      .single();

    if (response.data == null) {
      throw Exception('Invalid credentials');
    }

    final userData = UserWithPassword.fromJson(response.data);

    // 2. Verify password
    final passwordHash = hashPassword(password);
    if (passwordHash != userData.passwordHash) {
      throw Exception('Invalid credentials');
    }

    // 3. Store session
    final user = User(
      id: userData.id,
      userName: userData.userName,
      email: userData.email,
      mobileNumber: userData.mobileNumber,
      role: userData.role,
      flatNo: userData.flatNo,
      createdAt: userData.createdAt,
    );

    final prefsInstance = await prefs;
    await prefsInstance.setString('currentUser', jsonEncode(user.toJson()));

    return user;
  }

  Future<void> logout() async {
    final prefsInstance = await prefs;
    await prefsInstance.remove('currentUser');
  }

  Future<User?> getCurrentUser() async {
    final prefsInstance = await prefs;
    final userJson = prefsInstance.getString('currentUser');
    if (userJson == null) return null;

    return User.fromJson(jsonDecode(userJson));
  }
}
```

---

## Known Issues & Gotchas

1. **Custom Auth**: NOT using Supabase Auth - must implement all auth logic manually
2. **Password Security**: SHA-256 is not ideal for passwords (use bcrypt in production)
3. **Session Management**: Stored in localStorage/SharedPreferences - not secure for sensitive data
4. **RLS Policies**: Currently permissive - must tighten for production
5. **Flat Number**: Required for residents, must validate during user creation
6. **Email/Mobile Uniqueness**: Enforced at application level, not database level
7. **Password Reset**: No built-in reset flow - must implement manually

---

## Related Modules

- **Residents**: Users with `role = 'resident'` linked via `flat_no` (`01_RESIDENTS.md`)
- **Overview**: See `00_OVERVIEW.md` for authentication setup

