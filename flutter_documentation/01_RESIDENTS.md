# Residents Module Documentation

## Table: `residents`

### Purpose
Stores comprehensive information about residents/owners including owner details, rental information, residents living in the flat, vehicle details, and documents.

---

## Database Schema

### Table Structure

| Column Name | Data Type | Nullable | Default | Primary Key | Foreign Key | Notes |
|------------|-----------|----------|---------|-------------|-------------|-------|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | ✅ Yes | - | Primary key |
| `owner_name` | TEXT | NOT NULL | - | - | - | Owner's full name |
| `flat_number` | TEXT | NOT NULL | - | - | - | Flat identifier (e.g., "A-101") |
| `residency_type` | TEXT | NOT NULL | - | - | - | Enum: `'owner-living'` or `'rented'` |
| `phone_number` | TEXT | NOT NULL | - | - | - | Owner's phone number |
| `email` | TEXT | NULL | - | - | - | Owner's email |
| `residents_living` | JSONB | NULL | `[]` | - | - | Array of resident objects |
| `vehicle_detail` | JSONB | NULL | `[]` | - | - | Array of vehicle objects |
| `documents` | JSONB | NULL | `[]` | - | - | Array of document objects |
| `owner_history` | JSONB | NULL | `[]` | - | - | Array of previous owner records |
| `rent_agreement_url` | TEXT | NULL | - | - | - | URL to rent agreement (for rented) |
| `current_renter_name` | TEXT | NULL | - | - | - | Current renter name (for rented) |
| `current_renter_phone` | TEXT | NULL | - | - | - | Current renter phone (for rented) |
| `current_renter_email` | TEXT | NULL | - | - | - | Current renter email (for rented) |
| `old_renter_name` | TEXT | NULL | - | - | - | Previous renter name |
| `old_renter_phone` | TEXT | NULL | - | - | - | Previous renter phone |
| `old_renter_email` | TEXT | NULL | - | - | - | Previous renter email |
| `rent_start_date` | DATE | NULL | - | - | - | Rental start date |
| `rent_end_date` | DATE | NULL | - | - | - | Rental end date |
| `monthly_rent` | NUMERIC | NULL | - | - | - | Monthly rent amount |
| `broker_name` | TEXT | NULL | - | - | - | Broker name |
| `broker_phone` | TEXT | NULL | - | - | - | Broker phone |
| `broker_email` | TEXT | NULL | - | - | - | Broker email |
| `broker_company` | TEXT | NULL | - | - | - | Broker company name |
| `broker_commission` | NUMERIC | NULL | - | - | - | Broker commission amount |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | `NOW()` | - | - | Record creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | `NOW()` | - | - | Last update timestamp |

### JSONB Field Structures

#### `residents_living` Array
```json
[
  {
    "name": "John Doe",
    "phoneNumber": "1234567890",
    "email": "john@example.com",  // Optional
    "dateJoined": "2024-01-15",   // Optional
    "isRenter": false             // Optional, true for current renter
  }
]
```

#### `vehicle_detail` Array
```json
[
  {
    "vehicleNumber": "MH-01-AB-1234",
    "vehicleType": "car"  // or "bike", "suv", etc.
  }
]
```

#### `documents` Array
```json
[
  {
    "name": "Aadhar Card",
    "type": "identity",
    "url": "https://storage.supabase.co/..."
  }
]
```

#### `owner_history` Array
```json
[
  {
    "owner_name": "Previous Owner",
    "phone_number": "9876543210",
    "email": "prev@example.com",
    "residency_type": "owner-living",
    "residents_living": [...],
    "vehicle_detail": [...],
    "documents": [...],
    "changed_at": "2024-01-01T00:00:00Z"
  }
]
```

---

## Relationships

### One-to-Many
- `residents` ──< `maintenance_payments` (via `resident_id`)
- `residents` ──< `helpers` (via `rooms` array matching `flat_number`)
- `residents` ──< `deposite_on_renovation` (via `resident_id`)

---

## Row Level Security (RLS)

### Current Policies

```sql
-- Allow authenticated users full access
CREATE POLICY "Allow authenticated users to read residents" ON residents
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert residents" ON residents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update residents" ON residents
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete residents" ON residents
  FOR DELETE USING (true);

-- Development: Allow anonymous access
CREATE POLICY "Allow anonymous access for development" ON residents
  FOR ALL USING (true) WITH CHECK (true);
```

**⚠️ Production Note:** Implement role-based access control. Residents should only view their own data.

---

## API Usage Examples

### SELECT - Get All Residents

```dart
final response = await supabase
  .from('residents')
  .select('*')
  .order('created_at', ascending: false);

final residents = (response.data as List)
  .map((json) => Resident.fromJson(json))
  .toList();
```

### SELECT - Get Single Resident

```dart
final response = await supabase
  .from('residents')
  .select('*')
  .eq('id', residentId)
  .single();

final resident = Resident.fromJson(response.data);
```

### SELECT - Filter by Residency Type

```dart
final response = await supabase
  .from('residents')
  .select('*')
  .eq('residency_type', 'owner-living')
  .order('flat_number');
```

### SELECT - Search by Name or Flat Number

```dart
final response = await supabase
  .from('residents')
  .select('*')
  .or('owner_name.ilike.%$searchTerm%,flat_number.ilike.%$searchTerm%')
  .order('created_at', ascending: false);
```

### SELECT - Filter by Flat Number

```dart
final response = await supabase
  .from('residents')
  .select('*')
  .eq('flat_number', 'A-101')
  .single();
```

### INSERT - Create New Resident

```dart
// Prepare residents_living array
final residentsLiving = [
  {
    'name': 'John Doe',
    'phoneNumber': '1234567890',
    'dateJoined': '2024-01-15',
  }
];

// Prepare vehicle_detail array
final vehicleDetail = [
  {
    'vehicleNumber': 'MH-01-AB-1234',
    'vehicleType': 'car',
  }
];

// Prepare documents array (after uploading files)
final documents = [
  {
    'name': 'Aadhar Card',
    'type': 'identity',
    'url': uploadedFileUrl,
  }
];

// Insert resident
final response = await supabase
  .from('residents')
  .insert({
    'owner_name': 'John Doe',
    'flat_number': 'A-101',
    'residency_type': 'owner-living',
    'phone_number': '1234567890',
    'email': 'john@example.com',
    'residents_living': residentsLiving,
    'vehicle_detail': vehicleDetail,
    'documents': documents,
  })
  .select()
  .single();
```

### INSERT - Create Rented Resident

```dart
final response = await supabase
  .from('residents')
  .insert({
    'owner_name': 'Property Owner',
    'flat_number': 'B-205',
    'residency_type': 'rented',
    'phone_number': '9876543210',
    'email': 'owner@example.com',
    'current_renter_name': 'Tenant Name',
    'current_renter_phone': '1111111111',
    'current_renter_email': 'tenant@example.com',
    'rent_start_date': '2024-01-01',
    'rent_end_date': '2024-12-31',
    'monthly_rent': 25000.00,
    'broker_name': 'Broker Name',
    'broker_phone': '2222222222',
    'rent_agreement_url': rentAgreementUrl, // Upload first
    'residents_living': residentsLiving,
    'vehicle_detail': vehicleDetail,
    'documents': documents,
  })
  .select()
  .single();
```

### UPDATE - Update Resident

```dart
final response = await supabase
  .from('residents')
  .update({
    'phone_number': '9999999999',
    'email': 'newemail@example.com',
    'updated_at': DateTime.now().toIso8601String(),
  })
  .eq('id', residentId)
  .select()
  .single();
```

### UPDATE - Change Owner (with History)

```dart
// 1. Fetch current resident
final currentResident = await supabase
  .from('residents')
  .select('*')
  .eq('id', residentId)
  .single();

// 2. Create history entry
final ownerHistory = currentResident.data['owner_history'] ?? [];
ownerHistory.add({
  'owner_name': currentResident.data['owner_name'],
  'phone_number': currentResident.data['phone_number'],
  'email': currentResident.data['email'],
  'residency_type': currentResident.data['residency_type'],
  'residents_living': currentResident.data['residents_living'],
  'vehicle_detail': currentResident.data['vehicle_detail'],
  'documents': currentResident.data['documents'],
  'changed_at': DateTime.now().toIso8601String(),
});

// 3. Update with new owner info
final response = await supabase
  .from('residents')
  .update({
    'owner_name': newOwnerName,
    'phone_number': newPhoneNumber,
    'email': newEmail,
    'owner_history': ownerHistory,
    'updated_at': DateTime.now().toIso8601String(),
  })
  .eq('id', residentId)
  .select()
  .single();
```

### DELETE - Delete Resident

```dart
final response = await supabase
  .from('residents')
  .delete()
  .eq('id', residentId);
```

---

## Business Logic & Data Flow

### Resident Creation Flow

1. **Validate Input**: Check required fields based on `residency_type`
2. **Upload Documents**: Upload rent agreement (if rented) and other documents to storage
3. **Prepare JSONB Arrays**: Format `residents_living`, `vehicle_detail`, `documents`
4. **Insert Record**: Create resident record in database
5. **Handle Errors**: Rollback document uploads if insert fails

### Owner Change Flow

1. **Fetch Current Data**: Get existing resident record
2. **Create History Entry**: Add current data to `owner_history` array
3. **Update Record**: Update with new owner information
4. **Preserve History**: Keep all previous owner records in `owner_history`

### Status Determination

- **Active**: `residency_type = 'owner-living'` OR (`residency_type = 'rented'` AND `rent_end_date >= today`)
- **Inactive**: `residency_type = 'rented'` AND `rent_end_date < today`

---

## Flutter Data Model

```dart
class Resident {
  final String id;
  final String ownerName;
  final String flatNumber;
  final String residencyType; // 'owner-living' or 'rented'
  final String phoneNumber;
  final String? email;
  final List<ResidentLiving> residentsLiving;
  final List<VehicleDetail> vehicleDetail;
  final List<Document> documents;
  final List<OwnerHistory>? ownerHistory;
  
  // Rental fields (nullable, only for rented type)
  final String? rentAgreementUrl;
  final String? currentRenterName;
  final String? currentRenterPhone;
  final String? currentRenterEmail;
  final String? oldRenterName;
  final String? oldRenterPhone;
  final String? oldRenterEmail;
  final DateTime? rentStartDate;
  final DateTime? rentEndDate;
  final double? monthlyRent;
  final String? brokerName;
  final String? brokerPhone;
  final String? brokerEmail;
  final String? brokerCompany;
  final double? brokerCommission;
  
  final DateTime createdAt;
  final DateTime updatedAt;

  Resident({
    required this.id,
    required this.ownerName,
    required this.flatNumber,
    required this.residencyType,
    required this.phoneNumber,
    this.email,
    required this.residentsLiving,
    required this.vehicleDetail,
    required this.documents,
    this.ownerHistory,
    this.rentAgreementUrl,
    this.currentRenterName,
    this.currentRenterPhone,
    this.currentRenterEmail,
    this.oldRenterName,
    this.oldRenterPhone,
    this.oldRenterEmail,
    this.rentStartDate,
    this.rentEndDate,
    this.monthlyRent,
    this.brokerName,
    this.brokerPhone,
    this.brokerEmail,
    this.brokerCompany,
    this.brokerCommission,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Resident.fromJson(Map<String, dynamic> json) {
    return Resident(
      id: json['id'],
      ownerName: json['owner_name'],
      flatNumber: json['flat_number'],
      residencyType: json['residency_type'],
      phoneNumber: json['phone_number'],
      email: json['email'],
      residentsLiving: (json['residents_living'] as List? ?? [])
          .map((e) => ResidentLiving.fromJson(e))
          .toList(),
      vehicleDetail: (json['vehicle_detail'] as List? ?? [])
          .map((e) => VehicleDetail.fromJson(e))
          .toList(),
      documents: (json['documents'] as List? ?? [])
          .map((e) => Document.fromJson(e))
          .toList(),
      ownerHistory: json['owner_history'] != null
          ? (json['owner_history'] as List)
              .map((e) => OwnerHistory.fromJson(e))
              .toList()
          : null,
      rentAgreementUrl: json['rent_agreement_url'],
      currentRenterName: json['current_renter_name'],
      currentRenterPhone: json['current_renter_phone'],
      currentRenterEmail: json['current_renter_email'],
      oldRenterName: json['old_renter_name'],
      oldRenterPhone: json['old_renter_phone'],
      oldRenterEmail: json['old_renter_email'],
      rentStartDate: json['rent_start_date'] != null
          ? DateTime.parse(json['rent_start_date'])
          : null,
      rentEndDate: json['rent_end_date'] != null
          ? DateTime.parse(json['rent_end_date'])
          : null,
      monthlyRent: json['monthly_rent'] != null
          ? (json['monthly_rent'] as num).toDouble()
          : null,
      brokerName: json['broker_name'],
      brokerPhone: json['broker_phone'],
      brokerEmail: json['broker_email'],
      brokerCompany: json['broker_company'],
      brokerCommission: json['broker_commission'] != null
          ? (json['broker_commission'] as num).toDouble()
          : null,
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'owner_name': ownerName,
      'flat_number': flatNumber,
      'residency_type': residencyType,
      'phone_number': phoneNumber,
      'email': email,
      'residents_living': residentsLiving.map((e) => e.toJson()).toList(),
      'vehicle_detail': vehicleDetail.map((e) => e.toJson()).toList(),
      'documents': documents.map((e) => e.toJson()).toList(),
      'owner_history': ownerHistory?.map((e) => e.toJson()).toList(),
      'rent_agreement_url': rentAgreementUrl,
      'current_renter_name': currentRenterName,
      'current_renter_phone': currentRenterPhone,
      'current_renter_email': currentRenterEmail,
      'old_renter_name': oldRenterName,
      'old_renter_phone': oldRenterPhone,
      'old_renter_email': oldRenterEmail,
      'rent_start_date': rentStartDate?.toIso8601String().split('T')[0],
      'rent_end_date': rentEndDate?.toIso8601String().split('T')[0],
      'monthly_rent': monthlyRent,
      'broker_name': brokerName,
      'broker_phone': brokerPhone,
      'broker_email': brokerEmail,
      'broker_company': brokerCompany,
      'broker_commission': brokerCommission,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  bool get isActive {
    if (residencyType == 'owner-living') return true;
    if (rentEndDate == null) return true;
    return rentEndDate!.isAfter(DateTime.now());
  }
}

class ResidentLiving {
  final String name;
  final String phoneNumber;
  final String? email;
  final String? dateJoined;
  final bool? isRenter;

  ResidentLiving({
    required this.name,
    required this.phoneNumber,
    this.email,
    this.dateJoined,
    this.isRenter,
  });

  factory ResidentLiving.fromJson(Map<String, dynamic> json) {
    return ResidentLiving(
      name: json['name'],
      phoneNumber: json['phoneNumber'],
      email: json['email'],
      dateJoined: json['dateJoined'],
      isRenter: json['isRenter'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'phoneNumber': phoneNumber,
      'email': email,
      'dateJoined': dateJoined,
      'isRenter': isRenter,
    };
  }
}

class VehicleDetail {
  final String vehicleNumber;
  final String vehicleType;

  VehicleDetail({
    required this.vehicleNumber,
    required this.vehicleType,
  });

  factory VehicleDetail.fromJson(Map<String, dynamic> json) {
    return VehicleDetail(
      vehicleNumber: json['vehicleNumber'],
      vehicleType: json['vehicleType'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'vehicleNumber': vehicleNumber,
      'vehicleType': vehicleType,
    };
  }
}

class Document {
  final String name;
  final String type;
  final String url;

  Document({
    required this.name,
    required this.type,
    required this.url,
  });

  factory Document.fromJson(Map<String, dynamic> json) {
    return Document(
      name: json['name'],
      type: json['type'],
      url: json['url'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'type': type,
      'url': url,
    };
  }
}

class OwnerHistory {
  final String ownerName;
  final String phoneNumber;
  final String? email;
  final String residencyType;
  final List<ResidentLiving> residentsLiving;
  final List<VehicleDetail> vehicleDetail;
  final List<Document> documents;
  final DateTime changedAt;

  OwnerHistory({
    required this.ownerName,
    required this.phoneNumber,
    this.email,
    required this.residencyType,
    required this.residentsLiving,
    required this.vehicleDetail,
    required this.documents,
    required this.changedAt,
  });

  factory OwnerHistory.fromJson(Map<String, dynamic> json) {
    return OwnerHistory(
      ownerName: json['owner_name'],
      phoneNumber: json['phone_number'],
      email: json['email'],
      residencyType: json['residency_type'],
      residentsLiving: (json['residents_living'] as List? ?? [])
          .map((e) => ResidentLiving.fromJson(e))
          .toList(),
      vehicleDetail: (json['vehicle_detail'] as List? ?? [])
          .map((e) => VehicleDetail.fromJson(e))
          .toList(),
      documents: (json['documents'] as List? ?? [])
          .map((e) => Document.fromJson(e))
          .toList(),
      changedAt: DateTime.parse(json['changed_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'owner_name': ownerName,
      'phone_number': phoneNumber,
      'email': email,
      'residency_type': residencyType,
      'residents_living': residentsLiving.map((e) => e.toJson()).toList(),
      'vehicle_detail': vehicleDetail.map((e) => e.toJson()).toList(),
      'documents': documents.map((e) => e.toJson()).toList(),
      'changed_at': changedAt.toIso8601String(),
    };
  }
}
```

---

## Known Issues & Gotchas

1. **JSONB Arrays**: Handle null/empty arrays carefully. Always check for null before mapping.
2. **Date Fields**: `rent_start_date` and `rent_end_date` are DATE type (not TIMESTAMP) - use `YYYY-MM-DD` format.
3. **Owner History**: When changing owner, preserve ALL previous data in `owner_history` array.
4. **Documents**: Upload documents to storage first, then store URLs in `documents` array.
5. **Residency Type**: Validation differs for `owner-living` vs `rented` - check required fields accordingly.
6. **Cascade Deletes**: Deleting a resident may cascade to `maintenance_payments` if foreign key is set.

---

## Related Modules

- **Maintenance Payments**: Linked via `resident_id` or `flat_number`
- **Helpers**: Linked via `rooms` array containing `flat_number`
- **Deposite on Renovation**: Linked via `resident_id`

