# Notice Board Module Documentation

## Table: `notices`

### Purpose
Stores announcements and notices posted on the society notice board. Supports different priorities and categories.

---

## Database Schema

### Table Structure

| Column Name | Data Type | Nullable | Default | Primary Key | Foreign Key | Notes |
|------------|-----------|----------|---------|-------------|-------------|-------|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | ✅ Yes | - | Primary key |
| `title` | TEXT | NOT NULL | - | - | - | Notice title |
| `content` | TEXT | NOT NULL | - | - | - | Notice content/body |
| `date` | DATE | NOT NULL | `CURRENT_DATE` | - | - | Notice date |
| `priority` | TEXT | NOT NULL | - | - | - | Enum: `'low'`, `'medium'`, `'high'` |
| `category` | TEXT | NOT NULL | - | - | - | Enum: `'general'`, `'maintenance'`, `'event'`, `'emergency'` |
| `author` | TEXT | NOT NULL | - | - | - | Author name |
| `is_archived` | BOOLEAN | NOT NULL | `false` | - | - | Archive flag |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | `NOW()` | - | - | Record creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | `NOW()` | - | - | Last update timestamp |

### Constraints

- `priority` must be one of: `'low'`, `'medium'`, `'high'`
- `category` must be one of: `'general'`, `'maintenance'`, `'event'`, `'emergency'`

---

## Relationships

No foreign key relationships. Standalone table.

---

## Row Level Security (RLS)

### Current Policies

```sql
-- Allow authenticated users full access
CREATE POLICY "Allow authenticated users to read notices" ON notices
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert notices" ON notices
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update notices" ON notices
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete notices" ON notices
  FOR DELETE USING (true);

-- Development: Allow anonymous access
CREATE POLICY "Allow anonymous access for development" ON notices
  FOR ALL USING (true) WITH CHECK (true);
```

---

## API Usage Examples

### SELECT - Get All Active Notices

```dart
final response = await supabase
  .from('notices')
  .select('*')
  .eq('is_archived', false)
  .order('date', ascending: false);

final notices = (response.data as List)
  .map((json) => Notice.fromJson(json))
  .toList();
```

### SELECT - Get Notices by Category

```dart
final response = await supabase
  .from('notices')
  .select('*')
  .eq('category', 'emergency')
  .eq('is_archived', false)
  .order('date', ascending: false);
```

### SELECT - Get Notices by Priority

```dart
final response = await supabase
  .from('notices')
  .select('*')
  .eq('priority', 'high')
  .eq('is_archived', false)
  .order('date', ascending: false);
```

### SELECT - Get Archived Notices

```dart
final response = await supabase
  .from('notices')
  .select('*')
  .eq('is_archived', true)
  .order('date', ascending: false);
```

### SELECT - Search Notices

```dart
final response = await supabase
  .from('notices')
  .select('*')
  .or('title.ilike.%$searchTerm%,content.ilike.%$searchTerm%')
  .eq('is_archived', false)
  .order('date', ascending: false);
```

### INSERT - Create Notice

```dart
final response = await supabase
  .from('notices')
  .insert({
    'title': 'Water Supply Maintenance',
    'content': 'Water supply will be interrupted on 15th January for maintenance work.',
    'date': DateTime.now().toIso8601String().split('T')[0],
    'priority': 'high',
    'category': 'maintenance',
    'author': 'Admin',
    'is_archived': false,
  })
  .select()
  .single();
```

### UPDATE - Update Notice

```dart
final response = await supabase
  .from('notices')
  .update({
    'title': 'Updated Title',
    'content': 'Updated content',
    'priority': 'medium',
    'updated_at': DateTime.now().toIso8601String(),
  })
  .eq('id', noticeId)
  .select()
  .single();
```

### UPDATE - Archive Notice

```dart
final response = await supabase
  .from('notices')
  .update({
    'is_archived': true,
    'updated_at': DateTime.now().toIso8601String(),
  })
  .eq('id', noticeId);
```

### DELETE - Delete Notice

```dart
final response = await supabase
  .from('notices')
  .delete()
  .eq('id', noticeId);
```

---

## Business Logic & Data Flow

### Notice Creation Flow

1. **Enter Details**: Title, content, category, priority
2. **Set Date**: Default to current date or select specific date
3. **Set Author**: Current user's name
4. **Insert Record**: Create notice in database
5. **Send Notifications** (optional): Email/SMS to all residents

### Notice Archiving Flow

1. **Select Notice**: Choose notice to archive
2. **Update Flag**: Set `is_archived = true`
3. **Hide from Active List**: Filter out archived notices in UI

---

## Flutter Data Model

```dart
class Notice {
  final String id;
  final String title;
  final String content;
  final DateTime date;
  final NoticePriority priority;
  final NoticeCategory category;
  final String author;
  final bool isArchived;
  final DateTime createdAt;
  final DateTime updatedAt;

  Notice({
    required this.id,
    required this.title,
    required this.content,
    required this.date,
    required this.priority,
    required this.category,
    required this.author,
    required this.isArchived,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Notice.fromJson(Map<String, dynamic> json) {
    return Notice(
      id: json['id'],
      title: json['title'],
      content: json['content'],
      date: DateTime.parse(json['date']),
      priority: NoticePriority.fromString(json['priority']),
      category: NoticeCategory.fromString(json['category']),
      author: json['author'],
      isArchived: json['is_archived'] ?? false,
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'content': content,
      'date': date.toIso8601String().split('T')[0],
      'priority': priority.toString(),
      'category': category.toString(),
      'author': author,
      'is_archived': isArchived,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}

enum NoticePriority {
  low,
  medium,
  high;

  static NoticePriority fromString(String value) {
    switch (value) {
      case 'low':
        return NoticePriority.low;
      case 'medium':
        return NoticePriority.medium;
      case 'high':
        return NoticePriority.high;
      default:
        return NoticePriority.medium;
    }
  }

  @override
  String toString() {
    switch (this) {
      case NoticePriority.low:
        return 'low';
      case NoticePriority.medium:
        return 'medium';
      case NoticePriority.high:
        return 'high';
    }
  }
}

enum NoticeCategory {
  general,
  maintenance,
  event,
  emergency;

  static NoticeCategory fromString(String value) {
    switch (value) {
      case 'general':
        return NoticeCategory.general;
      case 'maintenance':
        return NoticeCategory.maintenance;
      case 'event':
        return NoticeCategory.event;
      case 'emergency':
        return NoticeCategory.emergency;
      default:
        return NoticeCategory.general;
    }
  }

  @override
  String toString() {
    switch (this) {
      case NoticeCategory.general:
        return 'general';
      case NoticeCategory.maintenance:
        return 'maintenance';
      case NoticeCategory.event:
        return 'event';
      case NoticeCategory.emergency:
        return 'emergency';
    }
  }
}
```

---

## Known Issues & Gotchas

1. **Date Field**: `date` is DATE type (not TIMESTAMP) - use `YYYY-MM-DD` format
2. **Archive Flag**: Use `is_archived` to filter active vs archived notices
3. **Priority Display**: Map priority to UI colors/icons (high = red, medium = yellow, low = green)
4. **Content Length**: No length limit - handle long content in UI with truncation/expansion
5. **Author Field**: Currently TEXT - consider linking to `users` table for better tracking

---

## Related Modules

- **Email Service**: Notices can be sent to all residents via email (see `src/lib/email-service.ts`)

