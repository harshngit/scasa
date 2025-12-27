# Vendors Module Documentation

## Table: `vendors`

### Purpose
Stores vendor/supplier information and tracks billing amounts (total, paid, outstanding).

---

## Database Schema

### Table Structure

| Column Name | Data Type | Nullable | Default | Primary Key | Foreign Key | Notes |
|------------|-----------|----------|---------|-------------|-------------|-------|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | ✅ Yes | - | Primary key |
| `vendor_name` | TEXT | NOT NULL | - | - | - | Vendor name |
| `email` | TEXT | NOT NULL | - | - | - | Vendor email |
| `phone_number` | TEXT | NOT NULL | - | - | - | Vendor phone number |
| `work_details` | TEXT | NULL | - | - | - | Description of work/services |
| `total_bill` | NUMERIC(12,2) | NOT NULL | `0` | - | - | Total bill amount |
| `outstanding_bill` | NUMERIC(12,2) | NOT NULL | `0` | - | - | Outstanding/unpaid amount |
| `paid_bill` | NUMERIC(12,2) | NOT NULL | `0` | - | - | Paid amount |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | `NOW()` | - | - | Record creation timestamp |

### Relationships

### One-to-Many
- `vendors` ──< `vendor_invoices` (via `vendor_id`)
- `vendors` ──< `billing_history` (via `vendor_id`)

---

## Row Level Security (RLS)

### Current Policies

```sql
-- Allow authenticated users full access
CREATE POLICY "Allow authenticated users to read vendors" ON vendors
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert vendors" ON vendors
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update vendors" ON vendors
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete vendors" ON vendors
  FOR DELETE USING (true);

-- Development: Allow anonymous access
CREATE POLICY "Allow anonymous access for development" ON vendors
  FOR ALL USING (true) WITH CHECK (true);
```

---

## API Usage Examples

### SELECT - Get All Vendors

```dart
final response = await supabase
  .from('vendors')
  .select('*')
  .order('created_at', ascending: false);

final vendors = (response.data as List)
  .map((json) => Vendor.fromJson(json))
  .toList();
```

### SELECT - Get Vendor by ID

```dart
final response = await supabase
  .from('vendors')
  .select('*')
  .eq('id', vendorId)
  .single();

final vendor = Vendor.fromJson(response.data);
```

### SELECT - Search Vendors

```dart
final response = await supabase
  .from('vendors')
  .select('*')
  .ilike('vendor_name', '%$searchTerm%')
  .order('vendor_name');
```

### SELECT - Get Vendors with Outstanding Bills

```dart
final response = await supabase
  .from('vendors')
  .select('*')
  .gt('outstanding_bill', 0)
  .order('outstanding_bill', ascending: false);
```

### INSERT - Create Vendor

```dart
final response = await supabase
  .from('vendors')
  .insert({
    'vendor_name': 'ABC Plumbing Services',
    'email': 'contact@abcplumbing.com',
    'phone_number': '1234567890',
    'work_details': 'Plumbing and water supply maintenance',
    'total_bill': 0,
    'outstanding_bill': 0,
    'paid_bill': 0,
  })
  .select()
  .single();
```

### UPDATE - Update Vendor

```dart
final response = await supabase
  .from('vendors')
  .update({
    'phone_number': '9999999999',
    'work_details': 'Updated work details',
  })
  .eq('id', vendorId)
  .select()
  .single();
```

### UPDATE - Update Bill Amounts (When Invoice Created)

```dart
// When creating a vendor invoice
final invoiceAmount = 5000.00;

// 1. Get current vendor amounts
final vendorResponse = await supabase
  .from('vendors')
  .select('total_bill, outstanding_bill')
  .eq('id', vendorId)
  .single();

final currentTotal = (vendorResponse.data['total_bill'] as num).toDouble();
final currentOutstanding = (vendorResponse.data['outstanding_bill'] as num).toDouble();

// 2. Update vendor amounts
await supabase
  .from('vendors')
  .update({
    'total_bill': currentTotal + invoiceAmount,
    'outstanding_bill': currentOutstanding + invoiceAmount,
  })
  .eq('id', vendorId);
```

### UPDATE - Update Bill Amounts (When Payment Made)

```dart
// When making payment to vendor
final paymentAmount = 3000.00;

// 1. Get current vendor amounts
final vendorResponse = await supabase
  .from('vendors')
  .select('paid_bill, outstanding_bill')
  .eq('id', vendorId)
  .single();

final currentPaid = (vendorResponse.data['paid_bill'] as num).toDouble();
final currentOutstanding = (vendorResponse.data['outstanding_bill'] as num).toDouble();

// 2. Update vendor amounts
await supabase
  .from('vendors')
  .update({
    'paid_bill': currentPaid + paymentAmount,
    'outstanding_bill': currentOutstanding - paymentAmount,
  })
  .eq('id', vendorId);
```

### DELETE - Delete Vendor

```dart
final response = await supabase
  .from('vendors')
  .delete()
  .eq('id', vendorId);
```

---

## Business Logic & Data Flow

### Vendor Creation Flow

1. **Enter Vendor Info**: Name, email, phone, work details
2. **Initialize Amounts**: Set `total_bill`, `outstanding_bill`, `paid_bill` to 0
3. **Insert Record**: Create vendor in database

### Invoice Creation Flow

1. **Create Invoice**: Insert into `vendor_invoices` table
2. **Update Vendor**: Add invoice amount to `total_bill` and `outstanding_bill`

### Payment Recording Flow

1. **Record Payment**: Insert into `billing_history` table
2. **Update Vendor**: Add payment to `paid_bill`, subtract from `outstanding_bill`

### Balance Calculation

- **Formula**: `total_bill = paid_bill + outstanding_bill`
- **Always maintain**: Ensure amounts are synchronized when invoices/payments are created

---

## Flutter Data Model

```dart
class Vendor {
  final String id;
  final String vendorName;
  final String email;
  final String phoneNumber;
  final String? workDetails;
  final double totalBill;
  final double outstandingBill;
  final double paidBill;
  final DateTime createdAt;

  Vendor({
    required this.id,
    required this.vendorName,
    required this.email,
    required this.phoneNumber,
    this.workDetails,
    required this.totalBill,
    required this.outstandingBill,
    required this.paidBill,
    required this.createdAt,
  });

  factory Vendor.fromJson(Map<String, dynamic> json) {
    return Vendor(
      id: json['id'],
      vendorName: json['vendor_name'],
      email: json['email'],
      phoneNumber: json['phone_number'],
      workDetails: json['work_details'],
      totalBill: (json['total_bill'] as num).toDouble(),
      outstandingBill: (json['outstanding_bill'] as num).toDouble(),
      paidBill: (json['paid_bill'] as num).toDouble(),
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'vendor_name': vendorName,
      'email': email,
      'phone_number': phoneNumber,
      'work_details': workDetails,
      'total_bill': totalBill,
      'outstanding_bill': outstandingBill,
      'paid_bill': paidBill,
      'created_at': createdAt.toIso8601String(),
    };
  }

  bool get hasOutstandingBalance => outstandingBill > 0;
}
```

---

## Known Issues & Gotchas

1. **Balance Sync**: Always update `total_bill`, `outstanding_bill`, and `paid_bill` together
2. **Formula Validation**: Ensure `total_bill = paid_bill + outstanding_bill` at all times
3. **Cascade Deletes**: Consider foreign key constraints - deleting vendor may affect invoices/billing history
4. **Negative Balances**: Prevent `outstanding_bill` from going negative
5. **Currency Precision**: Use NUMERIC(12,2) for proper currency handling

---

## Related Modules

- **Vendor Invoices**: `03_FINANCE.md` (vendor_invoices table)
- **Billing History**: `03_FINANCE.md` (billing_history table)

