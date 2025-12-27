# Complaints Module Documentation

## Table: `complaints`

### Purpose
Stores resident complaints and service requests. Tracks complainer information, complaint details, and dates.

---

## Database Schema

### Table Structure

| Column Name | Data Type | Nullable | Default | Primary Key | Foreign Key | Notes |
|------------|-----------|----------|---------|-------------|-------------|-------|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | ✅ Yes | - | Primary key |
| `complainer_name` | TEXT | NOT NULL | - | - | - | Name of person filing complaint |
| `phone_number` | TEXT | NULL | - | - | - | Complainer's phone number |
| `email` | TEXT | NULL | - | - | - | Complainer's email |
| `flat_number` | TEXT | NULL | - | - | - | Flat number |
| `wing` | TEXT | NULL | - | - | - | Wing/building identifier |
| `complaint_text` | TEXT | NOT NULL | - | - | - | Complaint description |
| `complaint_date` | DATE | NOT NULL | `CURRENT_DATE` | - | - | Date complaint was filed |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | `NOW()` | - | - | Record creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | `NOW()` | - | - | Last update timestamp |

### Indexes

- `idx_complaints_complainer_name` on `complainer_name`
- `idx_complaints_flat_number` on `flat_number`
- `idx_complaints_complaint_date` on `complaint_date`
- `idx_complaints_created_at` on `created_at`

### Triggers

- **Auto-update `updated_at`**: Trigger `complaints_updated_at` updates `updated_at` on row update

---

## Relationships

No foreign key relationships. Standalone table.

---

## Row Level Security (RLS)

### Current Policies

```sql
-- Allow authenticated users full access
CREATE POLICY "Allow authenticated users to read complaints" ON complaints
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert complaints" ON complaints
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update complaints" ON complaints
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete complaints" ON complaints
  FOR DELETE USING (true);

-- Development: Allow anonymous access
CREATE POLICY "Allow anonymous access for development" ON complaints
  FOR ALL USING (true) WITH CHECK (true);
```

---

## API Usage Examples

### SELECT - Get All Complaints

```dart
final response = await supabase
  .from('complaints')
  .select('*')
  .order('complaint_date', ascending: false);

final complaints = (response.data as List)
  .map((json) => Complaint.fromJson(json))
  .toList();
```

### SELECT - Get Complaints by Flat Number

```dart
final response = await supabase
  .from('complaints')
  .select('*')
  .eq('flat_number', 'A-101')
  .order('complaint_date', ascending: false);
```

### SELECT - Search Complaints

```dart
final response = await supabase
  .from('complaints')
  .select('*')
  .or('complainer_name.ilike.%$searchTerm%,complaint_text.ilike.%$searchTerm%,flat_number.ilike.%$searchTerm%')
  .order('complaint_date', ascending: false);
```

### SELECT - Get Complaints by Date Range

```dart
final startDate = '2024-01-01';
final endDate = '2024-12-31';

final response = await supabase
  .from('complaints')
  .select('*')
  .gte('complaint_date', startDate)
  .lte('complaint_date', endDate)
  .order('complaint_date', ascending: false);
```

### INSERT - Create Complaint

```dart
final response = await supabase
  .from('complaints')
  .insert({
    'complainer_name': 'John Doe',
    'phone_number': '1234567890',
    'email': 'john@example.com',
    'flat_number': 'A-101',
    'wing': 'A',
    'complaint_text': 'Water leakage in bathroom',
    'complaint_date': DateTime.now().toIso8601String().split('T')[0],
  })
  .select()
  .single();
```

### UPDATE - Update Complaint

```dart
final response = await supabase
  .from('complaints')
  .update({
    'complaint_text': 'Updated complaint description',
    'updated_at': DateTime.now().toIso8601String(),
  })
  .eq('id', complaintId)
  .select()
  .single();
```

### DELETE - Delete Complaint

```dart
final response = await supabase
  .from('complaints')
  .delete()
  .eq('id', complaintId);
```

---

## Business Logic & Data Flow

### Complaint Creation Flow

1. **Enter Complainer Info**: Name, phone, email (optional)
2. **Enter Location**: Flat number, wing (optional)
3. **Enter Complaint**: Detailed description
4. **Set Date**: Default to current date
5. **Submit**: Insert record into database

### Complaint Tracking

- No status field - consider adding `status` (pending, resolved, closed)
- No assignment field - consider adding `assigned_to` for staff assignment
- No resolution notes - consider adding `resolution_notes` field

---

## Flutter Data Model

```dart
class Complaint {
  final String id;
  final String complainerName;
  final String? phoneNumber;
  final String? email;
  final String? flatNumber;
  final String? wing;
  final String complaintText;
  final DateTime complaintDate;
  final DateTime createdAt;
  final DateTime updatedAt;

  Complaint({
    required this.id,
    required this.complainerName,
    this.phoneNumber,
    this.email,
    this.flatNumber,
    this.wing,
    required this.complaintText,
    required this.complaintDate,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Complaint.fromJson(Map<String, dynamic> json) {
    return Complaint(
      id: json['id'],
      complainerName: json['complainer_name'],
      phoneNumber: json['phone_number'],
      email: json['email'],
      flatNumber: json['flat_number'],
      wing: json['wing'],
      complaintText: json['complaint_text'],
      complaintDate: DateTime.parse(json['complaint_date']),
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'complainer_name': complainerName,
      'phone_number': phoneNumber,
      'email': email,
      'flat_number': flatNumber,
      'wing': wing,
      'complaint_text': complaintText,
      'complaint_date': complaintDate.toIso8601String().split('T')[0],
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}
```

---

## Known Issues & Gotchas

1. **No Status Field**: Consider adding status tracking (pending, in-progress, resolved)
2. **No Assignment**: Consider adding `assigned_to` field for staff assignment
3. **Date Field**: `complaint_date` is DATE type (not TIMESTAMP) - use `YYYY-MM-DD` format
4. **Auto-update Trigger**: `updated_at` is automatically updated by database trigger
5. **Optional Fields**: Most fields except `complainer_name` and `complaint_text` are optional

---

## Related Modules

- **Maintenance Requests**: Similar structure but different purpose (see `maintenance_requests` table)

