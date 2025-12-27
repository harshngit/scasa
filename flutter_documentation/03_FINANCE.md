# Finance Module Documentation

## Overview

The Finance module aggregates financial transactions from multiple sources:
- **Maintenance Payments** (Income)
- **Vendor Invoices** (Expenses)
- **Billing History** (Vendor Payments)
- **Deposite on Renovation** (Deposits)
- **Society Owned Rooms** (Rental Income)

---

## Related Tables

### 1. `maintenance_payments`
- **Type**: Income (Credit)
- **Source**: Monthly maintenance payments from residents
- **See**: `02_MAINTENANCE_PAYMENTS.md`

### 2. `vendor_invoices`
- **Type**: Expense (Debit)
- **Source**: Invoices from vendors
- **Table**: `vendor_invoices`

### 3. `billing_history`
- **Type**: Expense (Debit)
- **Source**: Payments made to vendors
- **Table**: `billing_history`

### 4. `deposite_on_renovation`
- **Type**: Deposit (Credit/Debit based on status)
- **Source**: Renovation deposits
- **See**: `09_EXPENSES.md`

### 5. `society_owned_rooms`
- **Type**: Income (Credit)
- **Source**: Rental income from society-owned rooms
- **See**: `09_EXPENSES.md`

---

## Table: `vendor_invoices`

### Purpose
Stores vendor invoice records with line items and payment tracking.

### Schema

| Column Name | Data Type | Nullable | Default | Primary Key | Foreign Key |
|------------|-----------|----------|---------|-------------|-------------|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | ✅ Yes | - |
| `vendor_id` | UUID | NOT NULL | - | - | `vendors(id)` |
| `invoice_number` | TEXT | NOT NULL | - | - | - |
| `invoice_date` | DATE | NOT NULL | - | - | - |
| `due_date` | DATE | NOT NULL | - | - | - |
| `items` | JSONB | NOT NULL | `[]` | - | - |
| `subtotal` | NUMERIC(12,2) | NOT NULL | - | - | - |
| `tax` | NUMERIC(12,2) | NULL | `0` | - | - |
| `total` | NUMERIC(12,2) | NOT NULL | - | - | - |
| `status` | TEXT | NOT NULL | `'pending'` | - | - |
| `notes` | TEXT | NULL | - | - | - |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | `NOW()` | - | - |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | `NOW()` | - | - |

### `items` JSONB Structure

```json
[
  {
    "srNo": 1,
    "description": "Service charge",
    "charges": 5000.00
  }
]
```

---

## Table: `billing_history`

### Purpose
Tracks all payments made to vendors, linked to vendor invoices or direct vendor payments.

### Schema

| Column Name | Data Type | Nullable | Default | Primary Key | Foreign Key |
|------------|-----------|----------|---------|-------------|-------------|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | ✅ Yes | - |
| `vendor_id` | UUID | NULL | - | - | `vendors(id)` |
| `invoice_id` | UUID | NULL | - | - | `vendor_invoices(id)` |
| `amount_paid` | NUMERIC(12,2) | NOT NULL | - | - | - |
| `payment_date` | DATE | NOT NULL | - | - | - |
| `payment_mode` | TEXT | NULL | - | - | - |
| `payment_details` | TEXT | NULL | - | - | - |
| `payment_timestamp` | TIMESTAMP WITH TIME ZONE | NULL | `NOW()` | - | - |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | `NOW()` | - | - |

### Relationships

- `billing_history` >── `vendors` (via `vendor_id`)
- `billing_history` >── `vendor_invoices` (via `invoice_id`, optional)

---

## API Usage Examples

### SELECT - Get All Finance Transactions

```dart
// Fetch maintenance payments (Income)
final maintenancePayments = await supabase
  .from('maintenance_payments')
  .select('*')
  .eq('status', 'paid')
  .order('paid_date', ascending: false);

// Fetch vendor invoices (Expenses)
final vendorInvoices = await supabase
  .from('vendor_invoices')
  .select('*, vendors(*)')
  .order('invoice_date', ascending: false);

// Fetch billing history (Expenses)
final billingHistory = await supabase
  .from('billing_history')
  .select('*, vendors(*)')
  .order('payment_date', ascending: false);

// Fetch deposits on renovation
final deposits = await supabase
  .from('deposite_on_renovation')
  .select('*')
  .order('deposit_date', ascending: false);

// Fetch society owned room rentals
final roomRentals = await supabase
  .from('society_owned_rooms')
  .select('*')
  .eq('status', 'occupied')
  .order('rent_start_date', ascending: false);
```

### SELECT - Get Transactions by Date Range

```dart
final startDate = '2024-01-01';
final endDate = '2024-12-31';

// Maintenance payments
final maintenancePayments = await supabase
  .from('maintenance_payments')
  .select('*')
  .eq('status', 'paid')
  .gte('paid_date', startDate)
  .lte('paid_date', endDate);

// Vendor payments
final vendorPayments = await supabase
  .from('billing_history')
  .select('*, vendors(*)')
  .gte('payment_date', startDate)
  .lte('payment_date', endDate);
```

### SELECT - Calculate Totals

```dart
// Total Income (Maintenance Payments)
final maintenanceResponse = await supabase
  .from('maintenance_payments')
  .select('amount')
  .eq('status', 'paid');

double totalIncome = 0;
for (var payment in maintenanceResponse.data) {
  totalIncome += (payment['amount'] as num).toDouble();
}

// Total Expenses (Vendor Payments)
final billingResponse = await supabase
  .from('billing_history')
  .select('amount_paid');

double totalExpenses = 0;
for (var payment in billingResponse.data) {
  totalExpenses += (payment['amount_paid'] as num).toDouble();
}

// Net Balance
double netBalance = totalIncome - totalExpenses;
```

### INSERT - Record Vendor Payment

```dart
// 1. Insert into billing_history
final billingResponse = await supabase
  .from('billing_history')
  .insert({
    'vendor_id': vendorId,
    'amount_paid': amount,
    'payment_date': DateTime.now().toIso8601String().split('T')[0],
    'payment_mode': 'UPI',
    'payment_details': 'Transaction ID: TXN123456',
  })
  .select()
  .single();

// 2. Update vendor's paid_bill and outstanding_bill
final vendorResponse = await supabase
  .from('vendors')
  .select('paid_bill, outstanding_bill, total_bill')
  .eq('id', vendorId)
  .single();

final currentPaid = (vendorResponse.data['paid_bill'] as num).toDouble();
final currentOutstanding = (vendorResponse.data['outstanding_bill'] as num).toDouble();

await supabase
  .from('vendors')
  .update({
    'paid_bill': currentPaid + amount,
    'outstanding_bill': currentOutstanding - amount,
  })
  .eq('id', vendorId);
```

### INSERT - Create Vendor Invoice

```dart
final items = [
  {'srNo': 1, 'description': 'Service charge', 'charges': 5000.00},
  {'srNo': 2, 'description': 'Material cost', 'charges': 3000.00},
];

final subtotal = items.fold<double>(0, (sum, item) => sum + (item['charges'] as num).toDouble());
final tax = subtotal * 0.18; // 18% GST
final total = subtotal + tax;

final response = await supabase
  .from('vendor_invoices')
  .insert({
    'vendor_id': vendorId,
    'invoice_number': 'INV-${DateTime.now().millisecondsSinceEpoch}',
    'invoice_date': DateTime.now().toIso8601String().split('T')[0],
    'due_date': DateTime.now().add(Duration(days: 12)).toIso8601String().split('T')[0],
    'items': items,
    'subtotal': subtotal,
    'tax': tax,
    'total': total,
    'status': 'pending',
  })
  .select()
  .single();

// Update vendor's total_bill and outstanding_bill
final vendorResponse = await supabase
  .from('vendors')
  .select('total_bill, outstanding_bill')
  .eq('id', vendorId)
  .single();

await supabase
  .from('vendors')
  .update({
    'total_bill': (vendorResponse.data['total_bill'] as num).toDouble() + total,
    'outstanding_bill': (vendorResponse.data['outstanding_bill'] as num).toDouble() + total,
  })
  .eq('id', vendorId);
```

---

## Flutter Data Model

```dart
class FinanceTransaction {
  final String id;
  final TransactionType type;
  final DateTime date;
  final String description;
  final double amount;
  final String category;
  final String status;
  final String reference;

  FinanceTransaction({
    required this.id,
    required this.type,
    required this.date,
    required this.description,
    required this.amount,
    required this.category,
    required this.status,
    required this.reference,
  });

  bool get isIncome => type == TransactionType.maintenance || 
                       type == TransactionType.societyRoom;
  bool get isExpense => type == TransactionType.vendor || 
                       type == TransactionType.billing;
}

enum TransactionType {
  maintenance,
  vendor,
  deposit,
  societyRoom,
  billing,
}

class VendorInvoice {
  final String id;
  final String vendorId;
  final String invoiceNumber;
  final DateTime invoiceDate;
  final DateTime dueDate;
  final List<InvoiceItem> items;
  final double subtotal;
  final double tax;
  final double total;
  final String status;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  VendorInvoice({
    required this.id,
    required this.vendorId,
    required this.invoiceNumber,
    required this.invoiceDate,
    required this.dueDate,
    required this.items,
    required this.subtotal,
    required this.tax,
    required this.total,
    required this.status,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory VendorInvoice.fromJson(Map<String, dynamic> json) {
    return VendorInvoice(
      id: json['id'],
      vendorId: json['vendor_id'],
      invoiceNumber: json['invoice_number'],
      invoiceDate: DateTime.parse(json['invoice_date']),
      dueDate: DateTime.parse(json['due_date']),
      items: (json['items'] as List)
          .map((e) => InvoiceItem.fromJson(e))
          .toList(),
      subtotal: (json['subtotal'] as num).toDouble(),
      tax: (json['tax'] as num? ?? 0).toDouble(),
      total: (json['total'] as num).toDouble(),
      status: json['status'],
      notes: json['notes'],
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }
}

class InvoiceItem {
  final int srNo;
  final String description;
  final double charges;

  InvoiceItem({
    required this.srNo,
    required this.description,
    required this.charges,
  });

  factory InvoiceItem.fromJson(Map<String, dynamic> json) {
    return InvoiceItem(
      srNo: json['srNo'],
      description: json['description'],
      charges: (json['charges'] as num).toDouble(),
    );
  }
}

class BillingHistory {
  final String id;
  final String? vendorId;
  final String? invoiceId;
  final double amountPaid;
  final DateTime paymentDate;
  final String? paymentMode;
  final String? paymentDetails;
  final DateTime? paymentTimestamp;
  final DateTime createdAt;

  BillingHistory({
    required this.id,
    this.vendorId,
    this.invoiceId,
    required this.amountPaid,
    required this.paymentDate,
    this.paymentMode,
    this.paymentDetails,
    this.paymentTimestamp,
    required this.createdAt,
  });

  factory BillingHistory.fromJson(Map<String, dynamic> json) {
    return BillingHistory(
      id: json['id'],
      vendorId: json['vendor_id'],
      invoiceId: json['invoice_id'],
      amountPaid: (json['amount_paid'] as num).toDouble(),
      paymentDate: DateTime.parse(json['payment_date']),
      paymentMode: json['payment_mode'],
      paymentDetails: json['payment_details'],
      paymentTimestamp: json['payment_timestamp'] != null
          ? DateTime.parse(json['payment_timestamp'])
          : null,
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}
```

---

## Business Logic

### Finance Passbook Generation

1. **Fetch All Transactions**: Query all related tables
2. **Combine & Sort**: Merge transactions by date
3. **Categorize**: Mark as Income or Expense
4. **Calculate Running Balance**: Track cumulative balance
5. **Generate PDF**: Export passbook as PDF

### Vendor Payment Flow

1. **Select Vendor**: Choose vendor to pay
2. **Enter Amount**: Specify payment amount
3. **Record Payment**: Insert into `billing_history`
4. **Update Vendor**: Update `paid_bill` and `outstanding_bill`
5. **Link Invoice** (optional): If paying specific invoice, link `invoice_id`

---

## Known Issues & Gotchas

1. **Vendor Balance Sync**: Always update vendor's `paid_bill` and `outstanding_bill` when recording payments
2. **Invoice Items**: JSONB array - handle carefully in Flutter
3. **Date Ranges**: Use proper date filtering for accurate reports
4. **Transaction Aggregation**: Combine data from multiple tables for complete view
5. **Currency Formatting**: Use INR formatting for display (₹ symbol, comma separators)

---

## Related Modules

- **Maintenance Payments**: `02_MAINTENANCE_PAYMENTS.md`
- **Vendors**: `07_VENDORS.md`
- **Expenses**: `09_EXPENSES.md`

