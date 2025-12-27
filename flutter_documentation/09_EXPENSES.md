# Expenses Module Documentation

This module covers two expense-related tables:
1. **Deposite on Renovation** - Tracks renovation deposits
2. **Society Owned Rooms** - Manages society-owned rental rooms

---

## Table 1: `deposite_on_renovation`

### Purpose
Tracks deposits collected from residents for renovation work. Records deposit amount, status (pending, refunded, forfeited), and related resident information.

### Schema

| Column Name | Data Type | Nullable | Default | Primary Key | Foreign Key | Notes |
|------------|-----------|----------|---------|-------------|-------------|-------|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | ✅ Yes | - | Primary key |
| `resident_id` | UUID | NULL | - | - | `residents(id)` | Optional link to resident |
| `flat_number` | TEXT | NOT NULL | - | - | - | Flat number |
| `resident_name` | TEXT | NOT NULL | - | - | - | Resident/owner name |
| `owner_name` | TEXT | NULL | - | - | - | Owner name (if different) |
| `phone_number` | TEXT | NULL | - | - | - | Phone number |
| `amount` | NUMERIC(12,2) | NOT NULL | - | - | - | Deposit amount |
| `deposit_date` | DATE | NOT NULL | - | - | - | Date deposit was collected |
| `status` | TEXT | NOT NULL | `'pending'` | - | - | Enum: `'pending'`, `'refunded'`, `'forfeited'` |
| `notes` | TEXT | NULL | - | - | - | Additional notes |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | `NOW()` | - | - | Record creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | `NOW()` | - | - | Last update timestamp |

### Constraints

- `status` must be one of: `'pending'`, `'refunded'`, `'forfeited'`

---

## Table 2: `society_owned_rooms`

### Purpose
Manages society-owned rooms available for rent. Tracks room details, tenant information, rental amounts, and status.

### Schema

| Column Name | Data Type | Nullable | Default | Primary Key | Foreign Key | Notes |
|------------|-----------|----------|---------|-------------|-------------|-------|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | ✅ Yes | - | Primary key |
| `room_number` | TEXT | NOT NULL | - | - | - | Room identifier |
| `room_type` | TEXT | NOT NULL | - | - | - | Type of room |
| `floor_number` | TEXT | NULL | - | - | - | Floor number |
| `area_sqft` | NUMERIC(10,2) | NULL | - | - | - | Area in square feet |
| `status` | TEXT | NOT NULL | `'available'` | - | - | Enum: `'available'`, `'occupied'`, `'maintenance'` |
| `tenant_name` | TEXT | NULL | - | - | - | Current tenant name |
| `tenant_phone` | TEXT | NULL | - | - | - | Tenant phone |
| `tenant_email` | TEXT | NULL | - | - | - | Tenant email |
| `rent_amount` | NUMERIC(10,2) | NULL | - | - | - | Monthly rent amount |
| `rent_start_date` | DATE | NULL | - | - | - | Rental start date |
| `rent_end_date` | DATE | NULL | - | - | - | Rental end date |
| `notes` | TEXT | NULL | - | - | - | Additional notes |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | `NOW()` | - | - | Record creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | `NOW()` | - | - | Last update timestamp |

### Constraints

- `status` must be one of: `'available'`, `'occupied'`, `'maintenance'`

### Indexes

- `idx_society_owned_rooms_room_number` on `room_number`
- `idx_society_owned_rooms_room_type` on `room_type`
- `idx_society_owned_rooms_status` on `status`
- `idx_society_owned_rooms_tenant_name` on `tenant_name`
- `idx_society_owned_rooms_created_at` on `created_at`

---

## Relationships

### Deposite on Renovation
- `deposite_on_renovation` >── `residents` (via `resident_id`, optional)

### Society Owned Rooms
- No foreign key relationships

---

## Row Level Security (RLS)

### Deposite on Renovation Policies

```sql
-- Allow authenticated users full access
CREATE POLICY "Allow authenticated users to read deposite_on_renovation" ON deposite_on_renovation
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert deposite_on_renovation" ON deposite_on_renovation
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update deposite_on_renovation" ON deposite_on_renovation
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete deposite_on_renovation" ON deposite_on_renovation
  FOR DELETE USING (true);
```

### Society Owned Rooms Policies

```sql
-- Allow authenticated users full access
CREATE POLICY "Allow authenticated users to read society_owned_rooms" ON society_owned_rooms
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert society_owned_rooms" ON society_owned_rooms
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update society_owned_rooms" ON society_owned_rooms
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete society_owned_rooms" ON society_owned_rooms
  FOR DELETE USING (true);
```

---

## API Usage Examples

### Deposite on Renovation

#### SELECT - Get All Deposits

```dart
final response = await supabase
  .from('deposite_on_renovation')
  .select('*')
  .order('deposit_date', ascending: false);

final deposits = (response.data as List)
  .map((json) => DepositeOnRenovation.fromJson(json))
  .toList();
```

#### SELECT - Get Deposits by Status

```dart
final response = await supabase
  .from('deposite_on_renovation')
  .select('*')
  .eq('status', 'pending')
  .order('deposit_date', ascending: false);
```

#### INSERT - Create Deposit

```dart
final response = await supabase
  .from('deposite_on_renovation')
  .insert({
    'resident_id': residentId, // Optional
    'flat_number': 'A-101',
    'resident_name': 'John Doe',
    'owner_name': 'Property Owner',
    'phone_number': '1234567890',
    'amount': 50000.00,
    'deposit_date': DateTime.now().toIso8601String().split('T')[0],
    'status': 'pending',
    'notes': 'Renovation deposit for bathroom',
  })
  .select()
  .single();
```

#### UPDATE - Update Deposit Status

```dart
final response = await supabase
  .from('deposite_on_renovation')
  .update({
    'status': 'refunded',
    'notes': 'Deposit refunded on completion',
    'updated_at': DateTime.now().toIso8601String(),
  })
  .eq('id', depositId)
  .select()
  .single();
```

### Society Owned Rooms

#### SELECT - Get All Rooms

```dart
final response = await supabase
  .from('society_owned_rooms')
  .select('*')
  .order('created_at', ascending: false);

final rooms = (response.data as List)
  .map((json) => SocietyOwnedRoom.fromJson(json))
  .toList();
```

#### SELECT - Get Rooms by Status

```dart
final response = await supabase
  .from('society_owned_rooms')
  .select('*')
  .eq('status', 'available')
  .order('room_number');
```

#### INSERT - Create Room

```dart
final response = await supabase
  .from('society_owned_rooms')
  .insert({
    'room_number': 'R-101',
    'room_type': 'Office',
    'floor_number': '1',
    'area_sqft': 500.00,
    'status': 'available',
  })
  .select()
  .single();
```

#### UPDATE - Assign Tenant to Room

```dart
final response = await supabase
  .from('society_owned_rooms')
  .update({
    'status': 'occupied',
    'tenant_name': 'Tenant Name',
    'tenant_phone': '1234567890',
    'tenant_email': 'tenant@example.com',
    'rent_amount': 15000.00,
    'rent_start_date': '2024-01-01',
    'rent_end_date': '2024-12-31',
    'updated_at': DateTime.now().toIso8601String(),
  })
  .eq('id', roomId)
  .select()
  .single();
```

#### UPDATE - Vacate Room

```dart
final response = await supabase
  .from('society_owned_rooms')
  .update({
    'status': 'available',
    'tenant_name': null,
    'tenant_phone': null,
    'tenant_email': null,
    'rent_amount': null,
    'rent_start_date': null,
    'rent_end_date': null,
    'updated_at': DateTime.now().toIso8601String(),
  })
  .eq('id', roomId)
  .select()
  .single();
```

---

## Flutter Data Model

```dart
class DepositeOnRenovation {
  final String id;
  final String? residentId;
  final String flatNumber;
  final String residentName;
  final String? ownerName;
  final String? phoneNumber;
  final double amount;
  final DateTime depositDate;
  final DepositStatus status;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  DepositeOnRenovation({
    required this.id,
    this.residentId,
    required this.flatNumber,
    required this.residentName,
    this.ownerName,
    this.phoneNumber,
    required this.amount,
    required this.depositDate,
    required this.status,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory DepositeOnRenovation.fromJson(Map<String, dynamic> json) {
    return DepositeOnRenovation(
      id: json['id'],
      residentId: json['resident_id'],
      flatNumber: json['flat_number'],
      residentName: json['resident_name'],
      ownerName: json['owner_name'],
      phoneNumber: json['phone_number'],
      amount: (json['amount'] as num).toDouble(),
      depositDate: DateTime.parse(json['deposit_date']),
      status: DepositStatus.fromString(json['status']),
      notes: json['notes'],
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }
}

enum DepositStatus {
  pending,
  refunded,
  forfeited;

  static DepositStatus fromString(String value) {
    switch (value) {
      case 'pending':
        return DepositStatus.pending;
      case 'refunded':
        return DepositStatus.refunded;
      case 'forfeited':
        return DepositStatus.forfeited;
      default:
        return DepositStatus.pending;
    }
  }
}

class SocietyOwnedRoom {
  final String id;
  final String roomNumber;
  final String roomType;
  final String? floorNumber;
  final double? areaSqft;
  final RoomStatus status;
  final String? tenantName;
  final String? tenantPhone;
  final String? tenantEmail;
  final double? rentAmount;
  final DateTime? rentStartDate;
  final DateTime? rentEndDate;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  SocietyOwnedRoom({
    required this.id,
    required this.roomNumber,
    required this.roomType,
    this.floorNumber,
    this.areaSqft,
    required this.status,
    this.tenantName,
    this.tenantPhone,
    this.tenantEmail,
    this.rentAmount,
    this.rentStartDate,
    this.rentEndDate,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory SocietyOwnedRoom.fromJson(Map<String, dynamic> json) {
    return SocietyOwnedRoom(
      id: json['id'],
      roomNumber: json['room_number'],
      roomType: json['room_type'],
      floorNumber: json['floor_number'],
      areaSqft: json['area_sqft'] != null
          ? (json['area_sqft'] as num).toDouble()
          : null,
      status: RoomStatus.fromString(json['status']),
      tenantName: json['tenant_name'],
      tenantPhone: json['tenant_phone'],
      tenantEmail: json['tenant_email'],
      rentAmount: json['rent_amount'] != null
          ? (json['rent_amount'] as num).toDouble()
          : null,
      rentStartDate: json['rent_start_date'] != null
          ? DateTime.parse(json['rent_start_date'])
          : null,
      rentEndDate: json['rent_end_date'] != null
          ? DateTime.parse(json['rent_end_date'])
          : null,
      notes: json['notes'],
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }
}

enum RoomStatus {
  available,
  occupied,
  maintenance;

  static RoomStatus fromString(String value) {
    switch (value) {
      case 'available':
        return RoomStatus.available;
      case 'occupied':
        return RoomStatus.occupied;
      case 'maintenance':
        return RoomStatus.maintenance;
      default:
        return RoomStatus.available;
    }
  }
}
```

---

## Known Issues & Gotchas

1. **Deposit Status**: Track status changes carefully - refunded/forfeited deposits affect finance calculations
2. **Room Status**: Update status when assigning/vacating tenants
3. **Date Fields**: `deposit_date`, `rent_start_date`, `rent_end_date` are DATE type - use `YYYY-MM-DD` format
4. **Finance Integration**: Deposits and room rentals appear in finance passbook
5. **Auto-update Triggers**: `updated_at` is automatically updated by database triggers

---

## Related Modules

- **Residents**: Deposits linked via `resident_id` (`01_RESIDENTS.md`)
- **Finance**: Both tables contribute to finance passbook (`03_FINANCE.md`)

