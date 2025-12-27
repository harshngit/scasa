# Maintenance Payments Module Documentation

## Table: `maintenance_payments`

### Purpose
Tracks monthly maintenance payments for each resident/flat. Records payment status, amounts, due dates, and payment details.

---

## Database Schema

### Table Structure

| Column Name | Data Type | Nullable | Default | Primary Key | Foreign Key | Notes |
|------------|-----------|----------|---------|-------------|-------------|-------|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | ✅ Yes | - | Primary key |
| `resident_id` | UUID | NULL | - | - | `residents(id) ON DELETE CASCADE` | Optional link to resident |
| `flat_number` | TEXT | NOT NULL | - | - | - | Flat identifier |
| `resident_name` | TEXT | NOT NULL | - | - | - | Resident/owner name |
| `month` | INTEGER | NOT NULL | - | - | - | Month (1-12) |
| `year` | INTEGER | NOT NULL | - | - | - | Year (e.g., 2024) |
| `amount` | NUMERIC(12,2) | NOT NULL | `2000.00` | - | - | Payment amount |
| `due_date` | DATE | NOT NULL | - | - | - | Payment due date |
| `paid_date` | DATE | NULL | - | - | - | Actual payment date |
| `status` | TEXT | NOT NULL | `'unpaid'` | - | - | Enum: `'paid'`, `'unpaid'`, `'overdue'`, `'partial'` |
| `payment_method` | TEXT | NULL | - | - | - | Payment method (cash, UPI, etc.) |
| `receipt_number` | TEXT | NULL | - | - | - | Receipt number |
| `late_fee` | NUMERIC(12,2) | NULL | `0` | - | - | Late fee amount |
| `notes` | TEXT | NULL | - | - | - | Additional notes |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | `NOW()` | - | - | Record creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | `NOW()` | - | - | Last update timestamp |

### Constraints

- `month` must be between 1 and 12: `CHECK (month >= 1 AND month <= 12)`
- `status` must be one of: `'paid'`, `'unpaid'`, `'overdue'`, `'partial'`

### Indexes

- `idx_maintenance_payments_resident_id` on `resident_id`
- `idx_maintenance_payments_flat_number` on `flat_number`
- `idx_maintenance_payments_month_year` on `(month, year)`
- `idx_maintenance_payments_status` on `status`
- `idx_maintenance_payments_due_date` on `due_date`

---

## Relationships

### Many-to-One
- `maintenance_payments` >── `residents` (via `resident_id`, optional)

---

## Row Level Security (RLS)

### Current Policies

```sql
-- Allow authenticated users full access
CREATE POLICY "Allow authenticated users to read maintenance payments" ON maintenance_payments
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert maintenance payments" ON maintenance_payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update maintenance payments" ON maintenance_payments
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete maintenance payments" ON maintenance_payments
  FOR DELETE USING (true);

-- Development: Allow anonymous access
CREATE POLICY "Allow anonymous access for development" ON maintenance_payments
  FOR ALL USING (true) WITH CHECK (true);
```

---

## API Usage Examples

### SELECT - Get All Payments

```dart
final response = await supabase
  .from('maintenance_payments')
  .select('*')
  .order('year', ascending: false)
  .order('month', ascending: false)
  .order('flat_number');

final payments = (response.data as List)
  .map((json) => MaintenancePayment.fromJson(json))
  .toList();
```

### SELECT - Filter by Status

```dart
final response = await supabase
  .from('maintenance_payments')
  .select('*')
  .eq('status', 'paid')
  .order('paid_date', ascending: false);
```

### SELECT - Filter by Month and Year

```dart
final response = await supabase
  .from('maintenance_payments')
  .select('*')
  .eq('month', 1)
  .eq('year', 2024)
  .order('flat_number');
```

### SELECT - Filter by Flat Number

```dart
final response = await supabase
  .from('maintenance_payments')
  .select('*')
  .eq('flat_number', 'A-101')
  .order('year', ascending: false)
  .order('month', ascending: false);
```

### SELECT - Get Overdue Payments

```dart
final today = DateTime.now();
final response = await supabase
  .from('maintenance_payments')
  .select('*')
  .eq('status', 'unpaid')
  .lt('due_date', today.toIso8601String().split('T')[0])
  .order('due_date');
```

### SELECT - Get Payments with Resident Info

```dart
final response = await supabase
  .from('maintenance_payments')
  .select('*, residents(*)')
  .eq('status', 'unpaid');
```

### INSERT - Create Payment Record

```dart
final response = await supabase
  .from('maintenance_payments')
  .insert({
    'resident_id': residentId, // Optional
    'flat_number': 'A-101',
    'resident_name': 'John Doe',
    'month': 1,
    'year': 2024,
    'amount': 2000.00,
    'due_date': '2024-01-15',
    'status': 'unpaid',
  })
  .select()
  .single();
```

### INSERT - Bulk Generate Payments for All Residents

```dart
// 1. Fetch all residents
final residentsResponse = await supabase
  .from('residents')
  .select('id, flat_number, owner_name');

// 2. Generate payments for each resident
final payments = residentsResponse.data.map((resident) => {
  return {
    'resident_id': resident['id'],
    'flat_number': resident['flat_number'],
    'resident_name': resident['owner_name'],
    'month': targetMonth,
    'year': targetYear,
    'amount': defaultAmount,
    'due_date': dueDate,
    'status': 'unpaid',
  };
}).toList();

// 3. Insert all payments
final response = await supabase
  .from('maintenance_payments')
  .insert(payments);
```

### UPDATE - Mark Payment as Paid

```dart
final response = await supabase
  .from('maintenance_payments')
  .update({
    'status': 'paid',
    'paid_date': DateTime.now().toIso8601String().split('T')[0],
    'payment_method': 'UPI',
    'receipt_number': 'RCP-2024-001',
    'notes': 'Payment received via UPI',
    'updated_at': DateTime.now().toIso8601String(),
  })
  .eq('id', paymentId)
  .select()
  .single();
```

### UPDATE - Update Status to Overdue

```dart
final today = DateTime.now();
final response = await supabase
  .from('maintenance_payments')
  .update({
    'status': 'overdue',
    'updated_at': DateTime.now().toIso8601String(),
  })
  .eq('status', 'unpaid')
  .lt('due_date', today.toIso8601String().split('T')[0]);
```

### UPDATE - Partial Payment

```dart
final partialAmount = 1000.00;
final fullAmount = 2000.00;

final response = await supabase
  .from('maintenance_payments')
  .update({
    'status': 'partial',
    'amount': partialAmount,
    'notes': 'Partial payment received',
    'updated_at': DateTime.now().toIso8601String(),
  })
  .eq('id', paymentId);
```

### DELETE - Delete Payment

```dart
final response = await supabase
  .from('maintenance_payments')
  .delete()
  .eq('id', paymentId);
```

---

## Business Logic & Data Flow

### Payment Generation Flow

1. **Select Month/Year**: Admin selects target month and year
2. **Fetch Residents**: Get all active residents
3. **Generate Records**: Create payment record for each resident
4. **Set Default Amount**: Use default amount (2000.00) or custom amount
5. **Calculate Due Date**: Typically 15th of the month
6. **Bulk Insert**: Insert all payment records

### Payment Recording Flow

1. **Select Payment**: User selects unpaid payment record
2. **Enter Payment Details**: Amount, payment method, receipt number
3. **Update Status**: Change status to `'paid'`
4. **Set Paid Date**: Record actual payment date
5. **Generate Receipt**: Optionally generate receipt PDF

### Status Update Logic

- **Unpaid → Overdue**: Automatically update when `due_date < today` and `status = 'unpaid'`
- **Unpaid → Paid**: When payment is recorded
- **Unpaid → Partial**: When partial amount is paid

### Invoice Generation

The system generates invoices with breakdown:
- REPAIR & MAINTAINANCE: 460
- SERVICE CHARGES: 1865
- SINKING FUND: 75
- TMC TAXES PROPERTY/WATER: 650
- FEDERATION CHARGES: 800
- **Total**: 3850 (default, can be customized)

---

## Flutter Data Model

```dart
class MaintenancePayment {
  final String id;
  final String? residentId;
  final String flatNumber;
  final String residentName;
  final int month; // 1-12
  final int year;
  final double amount;
  final DateTime dueDate;
  final DateTime? paidDate;
  final PaymentStatus status;
  final String? paymentMethod;
  final String? receiptNumber;
  final double lateFee;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  MaintenancePayment({
    required this.id,
    this.residentId,
    required this.flatNumber,
    required this.residentName,
    required this.month,
    required this.year,
    required this.amount,
    required this.dueDate,
    this.paidDate,
    required this.status,
    this.paymentMethod,
    this.receiptNumber,
    required this.lateFee,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory MaintenancePayment.fromJson(Map<String, dynamic> json) {
    return MaintenancePayment(
      id: json['id'],
      residentId: json['resident_id'],
      flatNumber: json['flat_number'],
      residentName: json['resident_name'],
      month: json['month'],
      year: json['year'],
      amount: (json['amount'] as num).toDouble(),
      dueDate: DateTime.parse(json['due_date']),
      paidDate: json['paid_date'] != null
          ? DateTime.parse(json['paid_date'])
          : null,
      status: PaymentStatus.fromString(json['status']),
      paymentMethod: json['payment_method'],
      receiptNumber: json['receipt_number'],
      lateFee: (json['late_fee'] as num? ?? 0).toDouble(),
      notes: json['notes'],
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'resident_id': residentId,
      'flat_number': flatNumber,
      'resident_name': residentName,
      'month': month,
      'year': year,
      'amount': amount,
      'due_date': dueDate.toIso8601String().split('T')[0],
      'paid_date': paidDate?.toIso8601String().split('T')[0],
      'status': status.toString(),
      'payment_method': paymentMethod,
      'receipt_number': receiptNumber,
      'late_fee': lateFee,
      'notes': notes,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  String get monthName {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  }

  bool get isOverdue {
    if (status == PaymentStatus.paid) return false;
    return dueDate.isBefore(DateTime.now());
  }
}

enum PaymentStatus {
  paid,
  unpaid,
  overdue,
  partial;

  static PaymentStatus fromString(String value) {
    switch (value) {
      case 'paid':
        return PaymentStatus.paid;
      case 'unpaid':
        return PaymentStatus.unpaid;
      case 'overdue':
        return PaymentStatus.overdue;
      case 'partial':
        return PaymentStatus.partial;
      default:
        return PaymentStatus.unpaid;
    }
  }

  @override
  String toString() {
    switch (this) {
      case PaymentStatus.paid:
        return 'paid';
      case PaymentStatus.unpaid:
        return 'unpaid';
      case PaymentStatus.overdue:
        return 'overdue';
      case PaymentStatus.partial:
        return 'partial';
    }
  }
}
```

---

## Known Issues & Gotchas

1. **Status Updates**: Overdue status is calculated client-side. Consider database triggers for automatic updates.
2. **Bulk Generation**: Ensure no duplicate payments exist for same month/year/flat before generating.
3. **Partial Payments**: Handle partial payments carefully - may need to create new record or track in notes.
4. **Date Handling**: `due_date` and `paid_date` are DATE type (not TIMESTAMP) - use `YYYY-MM-DD` format.
5. **Cascade Delete**: If `resident_id` is set and resident is deleted, payment records are also deleted.
6. **Default Amount**: Default is 2000.00, but can be customized per payment.

---

## Related Modules

- **Residents**: Linked via `resident_id` or `flat_number`
- **Finance**: Payments appear in finance passbook

