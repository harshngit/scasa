# Permissions Module Documentation

## Table: `permissions`

### Purpose
Stores permission requests from residents for various activities (e.g., renovation, events, modifications).

---

## Database Schema

### Table Structure

| Column Name | Data Type | Nullable | Default | Primary Key | Foreign Key | Notes |
|------------|-----------|----------|---------|-------------|-------------|-------|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | ✅ Yes | - | Primary key |
| `resident_name` | TEXT | NOT NULL | - | - | - | Name of resident requesting permission |
| `phone_number` | TEXT | NULL | - | - | - | Resident's phone number |
| `email` | TEXT | NULL | - | - | - | Resident's email |
| `flat_number` | TEXT | NULL | - | - | - | Flat number |
| `wing` | TEXT | NULL | - | - | - | Wing/building identifier |
| `permission_text` | TEXT | NOT NULL | - | - | - | Permission request description |
| `permission_date` | DATE | NOT NULL | `CURRENT_DATE` | - | - | Date permission was requested |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | `NOW()` | - | - | Record creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | `NOW()` | - | - | Last update timestamp |

### Indexes

- `idx_permissions_resident_name` on `resident_name`
- `idx_permissions_flat_number` on `flat_number`
- `idx_permissions_permission_date` on `permission_date`
- `idx_permissions_created_at` on `created_at`

### Triggers

- **Auto-update `updated_at`**: Trigger `permissions_updated_at` updates `updated_at` on row update

---

## Relationships

No foreign key relationships. Standalone table.

---

## Row Level Security (RLS)

### Current Policies

```sql
-- Allow authenticated users full access
CREATE POLICY "Allow authenticated users to read permissions" ON permissions
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert permissions" ON permissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update permissions" ON permissions
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete permissions" ON permissions
  FOR DELETE USING (true);

-- Development: Allow anonymous access
CREATE POLICY "Allow anonymous access for development" ON permissions
  FOR ALL USING (true) WITH CHECK (true);
```

---

## API Usage Examples

### SELECT - Get All Permissions

```dart
final response = await supabase
  .from('permissions')
  .select('*')
  .order('permission_date', ascending: false);

final permissions = (response.data as List)
  .map((json) => Permission.fromJson(json))
  .toList();
```

### SELECT - Get Permissions by Flat Number

```dart
final response = await supabase
  .from('permissions')
  .select('*')
  .eq('flat_number', 'A-101')
  .order('permission_date', ascending: false);
```

### SELECT - Search Permissions

```dart
final response = await supabase
  .from('permissions')
  .select('*')
  .or('resident_name.ilike.%$searchTerm%,permission_text.ilike.%$searchTerm%,flat_number.ilike.%$searchTerm%')
  .order('permission_date', ascending: false);
```

### SELECT - Get Permissions by Date Range

```dart
final startDate = '2024-01-01';
final endDate = '2024-12-31';

final response = await supabase
  .from('permissions')
  .select('*')
  .gte('permission_date', startDate)
  .lte('permission_date', endDate)
  .order('permission_date', ascending: false);
```

### INSERT - Create Permission Request

```dart
final response = await supabase
  .from('permissions')
  .insert({
    'resident_name': 'John Doe',
    'phone_number': '1234567890',
    'email': 'john@example.com',
    'flat_number': 'A-101',
    'wing': 'A',
    'permission_text': 'Requesting permission for bathroom renovation',
    'permission_date': DateTime.now().toIso8601String().split('T')[0],
  })
  .select()
  .single();
```

### UPDATE - Update Permission Request

```dart
final response = await supabase
  .from('permissions')
  .update({
    'permission_text': 'Updated permission request description',
    'updated_at': DateTime.now().toIso8601String(),
  })
  .eq('id', permissionId)
  .select()
  .single();
```

### DELETE - Delete Permission Request

```dart
final response = await supabase
  .from('permissions')
  .delete()
  .eq('id', permissionId);
```

---

## Business Logic & Data Flow

### Permission Request Flow

1. **Enter Resident Info**: Name, phone, email (optional)
2. **Enter Location**: Flat number, wing (optional)
3. **Enter Permission Request**: Detailed description of what permission is needed
4. **Set Date**: Default to current date
5. **Submit**: Insert record into database

### Permission Tracking

- No status field - consider adding `status` (pending, approved, rejected)
- No approval notes - consider adding `approval_notes` field
- No approval date - consider adding `approved_date` field
- No approver - consider adding `approved_by` field

---

## Flutter Data Model

```dart
class Permission {
  final String id;
  final String residentName;
  final String? phoneNumber;
  final String? email;
  final String? flatNumber;
  final String? wing;
  final String permissionText;
  final DateTime permissionDate;
  final DateTime createdAt;
  final DateTime updatedAt;

  Permission({
    required this.id,
    required this.residentName,
    this.phoneNumber,
    this.email,
    this.flatNumber,
    this.wing,
    required this.permissionText,
    required this.permissionDate,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Permission.fromJson(Map<String, dynamic> json) {
    return Permission(
      id: json['id'],
      residentName: json['resident_name'],
      phoneNumber: json['phone_number'],
      email: json['email'],
      flatNumber: json['flat_number'],
      wing: json['wing'],
      permissionText: json['permission_text'],
      permissionDate: DateTime.parse(json['permission_date']),
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'resident_name': residentName,
      'phone_number': phoneNumber,
      'email': email,
      'flat_number': flatNumber,
      'wing': wing,
      'permission_text': permissionText,
      'permission_date': permissionDate.toIso8601String().split('T')[0],
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}
```

---

## Known Issues & Gotchas

1. **No Status Field**: Consider adding status tracking (pending, approved, rejected)
2. **No Approval Fields**: Consider adding approval date, approver, and notes
3. **Date Field**: `permission_date` is DATE type (not TIMESTAMP) - use `YYYY-MM-DD` format
4. **Auto-update Trigger**: `updated_at` is automatically updated by database trigger
5. **Similar to Complaints**: Structure is very similar to complaints table - consider merging or adding type field

---

## Related Modules

- **Complaints**: Similar structure (`05_COMPLAINTS.md`)
- **Deposite on Renovation**: May be related to renovation permissions (`09_EXPENSES.md`)

