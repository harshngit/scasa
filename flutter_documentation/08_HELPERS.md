# Helpers Module Documentation

## Table: `helpers`

### Purpose
Stores information about helpers/maids working in the society. Tracks which flats they work in and their details.

---

## Database Schema

### Table Structure

| Column Name | Data Type | Nullable | Default | Primary Key | Foreign Key | Notes |
|------------|-----------|----------|---------|-------------|-------------|-------|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | ✅ Yes | - | Primary key |
| `name` | TEXT | NOT NULL | - | - | - | Helper name |
| `phone` | TEXT | NULL | - | - | - | Helper phone number |
| `helper_type` | TEXT | NULL | - | - | - | Type of helper (maid, cook, etc.) |
| `rooms` | TEXT[] | NULL | - | - | - | Array of flat numbers where helper works |
| `notes` | TEXT | NULL | - | - | - | Additional notes |
| `gender` | TEXT | NULL | - | - | - | Gender |
| `photo_url` | TEXT | NULL | - | - | - | URL to helper photo (from storage) |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | `NOW()` | - | - | Record creation timestamp |

### Relationships

### Many-to-Many (via array)
- `helpers` ──< `residents` (via `rooms` array matching `flat_number`)

---

## Storage Bucket

### `helper-photos`
- **Purpose**: Store helper photos
- **Access**: Public URLs for display

---

## Row Level Security (RLS)

### Current Policies

```sql
-- Allow authenticated users full access
CREATE POLICY "Allow authenticated users to read helpers" ON helpers
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert helpers" ON helpers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update helpers" ON helpers
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete helpers" ON helpers
  FOR DELETE USING (true);

-- Development: Allow anonymous access
CREATE POLICY "Allow anonymous access for development" ON helpers
  FOR ALL USING (true) WITH CHECK (true);
```

---

## API Usage Examples

### SELECT - Get All Helpers

```dart
final response = await supabase
  .from('helpers')
  .select('*')
  .order('created_at', ascending: false);

final helpers = (response.data as List)
  .map((json) => Helper.fromJson(json))
  .toList();
```

### SELECT - Get Helper by ID

```dart
final response = await supabase
  .from('helpers')
  .select('*')
  .eq('id', helperId)
  .single();

final helper = Helper.fromJson(response.data);
```

### SELECT - Search Helpers

```dart
final response = await supabase
  .from('helpers')
  .select('*')
  .ilike('name', '%$searchTerm%')
  .order('name');
```

### SELECT - Get Helpers by Flat Number

```dart
// Note: This requires filtering in Flutter as rooms is an array
final response = await supabase
  .from('helpers')
  .select('*');

final helpers = (response.data as List)
  .where((helper) {
    final rooms = helper['rooms'] as List? ?? [];
    return rooms.contains('A-101');
  })
  .map((json) => Helper.fromJson(json))
  .toList();
```

### INSERT - Create Helper

```dart
// 1. Upload photo first (if provided)
String? photoUrl;
if (photoFile != null) {
  final fileName = 'helper-${DateTime.now().millisecondsSinceEpoch}';
  final uploadResponse = await supabase.storage
    .from('helper-photos')
    .upload(fileName, photoFile);
  
  if (uploadResponse.data != null) {
    final publicUrl = supabase.storage
      .from('helper-photos')
      .getPublicUrl(fileName);
    photoUrl = publicUrl.data;
  }
}

// 2. Insert helper record
final response = await supabase
  .from('helpers')
  .insert({
    'name': 'Mary Smith',
    'phone': '1234567890',
    'helper_type': 'maid',
    'rooms': ['A-101', 'A-102'], // Array of flat numbers
    'notes': 'Works morning shift',
    'gender': 'female',
    'photo_url': photoUrl,
  })
  .select()
  .single();
```

### UPDATE - Update Helper

```dart
final response = await supabase
  .from('helpers')
  .update({
    'phone': '9999999999',
    'rooms': ['A-101', 'A-102', 'A-103'], // Update rooms array
    'notes': 'Updated notes',
  })
  .eq('id', helperId)
  .select()
  .single();
```

### UPDATE - Update Helper Photo

```dart
// 1. Upload new photo
final fileName = 'helper-${helperId}-${DateTime.now().millisecondsSinceEpoch}';
final uploadResponse = await supabase.storage
  .from('helper-photos')
  .upload(fileName, newPhotoFile);

final publicUrl = supabase.storage
  .from('helper-photos')
  .getPublicUrl(fileName);

// 2. Update helper record
final response = await supabase
  .from('helpers')
  .update({
    'photo_url': publicUrl.data,
  })
  .eq('id', helperId);
```

### DELETE - Delete Helper

```dart
final response = await supabase
  .from('helpers')
  .delete()
  .eq('id', helperId);
```

---

## Business Logic & Data Flow

### Helper Creation Flow

1. **Enter Helper Info**: Name, phone, type, gender
2. **Select Flats**: Choose which flats the helper works in (stored as array)
3. **Upload Photo** (optional): Upload to `helper-photos` bucket
4. **Insert Record**: Create helper in database

### Helper-Flat Relationship

- **Many-to-Many**: One helper can work in multiple flats, one flat can have multiple helpers
- **Implementation**: Using `rooms` TEXT array (not a junction table)
- **Querying**: Filter helpers by checking if flat number exists in `rooms` array

---

## Flutter Data Model

```dart
class Helper {
  final String id;
  final String name;
  final String? phone;
  final String? helperType;
  final List<String> rooms; // Array of flat numbers
  final String? notes;
  final String? gender;
  final String? photoUrl;
  final DateTime createdAt;

  Helper({
    required this.id,
    required this.name,
    this.phone,
    this.helperType,
    required this.rooms,
    this.notes,
    this.gender,
    this.photoUrl,
    required this.createdAt,
  });

  factory Helper.fromJson(Map<String, dynamic> json) {
    return Helper(
      id: json['id'],
      name: json['name'],
      phone: json['phone'],
      helperType: json['helper_type'],
      rooms: (json['rooms'] as List? ?? [])
          .map((e) => e.toString())
          .toList(),
      notes: json['notes'],
      gender: json['gender'],
      photoUrl: json['photo_url'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'helper_type': helperType,
      'rooms': rooms,
      'notes': notes,
      'gender': gender,
      'photo_url': photoUrl,
      'created_at': createdAt.toIso8601String(),
    };
  }

  bool worksInFlat(String flatNumber) {
    return rooms.contains(flatNumber);
  }
}
```

---

## Known Issues & Gotchas

1. **Array Field**: `rooms` is TEXT[] array - handle carefully in Flutter
2. **Photo Storage**: Photos stored in `helper-photos` bucket - ensure bucket exists and has proper policies
3. **Flat Number Matching**: Querying helpers by flat requires client-side filtering (PostgreSQL array contains)
4. **No Foreign Key**: `rooms` array doesn't enforce foreign key to `residents` table
5. **Photo URLs**: Store full public URL in `photo_url` field

---

## Related Modules

- **Residents**: Helpers linked via `rooms` array containing `flat_number`

