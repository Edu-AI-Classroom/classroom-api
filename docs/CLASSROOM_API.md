# Classroom Management System - API Documentation

## Overview

This is a comprehensive Classroom Management System for teachers, built with NestJS and PostgreSQL. It provides full classroom management capabilities including:

- Multi-teacher classroom support
- Student management
- Group management within classrooms
- Complete permission-based access control

## Architecture

### Database Models

#### 1. **classroom** - Main classroom entity

- `class_id` (PK): Unique classroom identifier
- `class_name`: Name of the classroom
- `subject_id` (FK): Subject taught in the classroom
- `grade_level`: Grade level (1-12)
- `created_by` (FK): Teacher who created the classroom (owner)
- `created_at`: Timestamp when classroom was created
- `updated_at`: Timestamp of last update
- `is_deleted`: Soft delete flag

**Relationships:**

- One teacher (created_by) who is the owner
- Multiple teachers via `teacher_classroom` junction table
- Multiple students via `class_student` junction table
- Multiple groups via `class_group` table

#### 2. **teacher_classroom** - Junction table for multiple teachers

- `teacher_id` (FK, PK): Teacher user ID
- `class_id` (FK, PK): Classroom ID
- `is_owner`: Boolean flag indicating if this is the classroom owner
- `added_at`: When the teacher was added to the classroom

**Purpose:** Allows multiple teachers to manage a single classroom with equal permissions.

#### 3. **class_group** - Groups within a classroom

- `group_id` (PK): Unique group identifier
- `class_id` (FK): Classroom this group belongs to
- `group_name`: Name of the group
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp
- `is_deleted`: Soft delete flag

**Unique Constraint:** (class_id, group_name) - group names are unique within a classroom

**Relationships:**

- One classroom (parent)
- Multiple students via `group_student` junction table

#### 4. **group_student** - Students assigned to groups

- `group_id` (FK, PK): Group ID
- `student_id` (FK, PK): Student user ID
- `joined_at`: When student joined the group

**Purpose:** Maps students to groups within a classroom. A student can only belong to ONE group per classroom.

#### 5. **class_student** - Students in a classroom

- `class_id` (FK, PK): Classroom ID
- `student_id` (FK, PK): Student user ID
- `joined_at`: When student joined the classroom

#### 6. **student** - Student profile extended from USER

- `student_id` (PK, FK to USER): Student user ID
- `grade_level`: Student's grade level
- `parent_phone`: Parent's phone number
- Relations to groups, classrooms, assessments

#### 7. **USER** - Updated base user model

Relationships for classroom system:

- `classroom_created`: Classrooms created by this user (owner)
- `teacher_classes`: All classrooms where user is a teacher (via teacher_classroom)

---

## API Endpoints

### Base URL

```
/api/classrooms
```

### Authentication

All endpoints require JWT authentication via Bearer token in Authorization header.

---

## Classroom Management

### 1. Create Classroom

```
POST /classrooms
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "className": "Lớp 6A - Toán Nâng Cao",
  "gradeLevel": 6,
  "subjectId": 1
}

Response (201):
{
  "success": true,
  "statusCode": 201,
  "message": "Classroom created successfully",
  "data": {
    "classId": 1,
    "className": "Lớp 6A - Toán Nâng Cao",
    "gradeLevel": 6,
    "subjectId": 1,
    "subjectName": "Toán học",
    "createdBy": 1,
    "createdByName": "Nguyễn Văn A",
    "createdAt": "2026-01-25T11:48:00.000Z",
    "updatedAt": "2026-01-25T11:48:00.000Z",
    "isDeleted": false,
    "studentCount": 0,
    "teacherCount": 1,
    "groupCount": 0,
    "isOwner": true
  },
  "timestamp": "2026-01-25T11:48:00.000Z"
}
```

**Notes:**

- The authenticated user becomes the classroom owner
- Owners have full permissions

### 2. Get Classroom Details

```
GET /classrooms/:classId
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "statusCode": 200,
  "message": "Classroom retrieved successfully",
  "data": { ...ClassroomResponseDto },
  "timestamp": "2026-01-25T11:48:00.000Z"
}
```

**Authorization:** User must be a teacher or owner of the classroom

### 3. List My Classrooms

```
GET /classrooms?page=1&limit=10
Authorization: Bearer {token}

Query Parameters:
- page: int (default: 1, min: 1)
- limit: int (default: 10, min: 1, max: 100)

Response (200):
{
  "success": true,
  "statusCode": 200,
  "message": "Classrooms retrieved successfully",
  "data": {
    "data": [ ...ClassroomResponseDto[] ],
    "total": 5,
    "page": 1,
    "limit": 10
  },
  "timestamp": "2026-01-25T11:48:00.000Z"
}
```

**Returns:** All classrooms where the user is a teacher (creator or added teacher)

### 4. Update Classroom

```
PUT /classrooms/:classId
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "className": "Lớp 6A - Toán Nâng Cao (Updated)",
  "gradeLevel": 6,
  "subjectId": 1
}

Response (200): { ...ClassroomResponseDto }
```

**Authorization:** Any teacher in the classroom can update

### 5. Delete Classroom

```
DELETE /classrooms/:classId
Authorization: Bearer {token}

Response (204): No Content
```

**Authorization:** Only the classroom owner can delete
**Note:** Uses soft delete - data is preserved

---

## Teacher Management

### 1. Add Teacher to Classroom

```
POST /classrooms/:classId/teachers
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "email": "teacher@example.com"
}

Response (201):
{
  "success": true,
  "statusCode": 201,
  "message": "Teacher added successfully",
  "data": {
    "teacherId": 2,
    "teacherName": "Nguyễn Văn B",
    "email": "teacher@example.com",
    "addedAt": "2026-01-25T11:48:00.000Z",
    "isOwner": false
  },
  "timestamp": "2026-01-25T11:48:00.000Z"
}
```

**Authorization:** Only the classroom owner can add teachers

### 2. Remove Teacher from Classroom

```
DELETE /classrooms/:classId/teachers/:teacherId
Authorization: Bearer {token}

Response (204): No Content
```

**Authorization:** Only the classroom owner can remove teachers
**Restrictions:** Cannot remove the owner

### 3. Get All Teachers

```
GET /classrooms/:classId/teachers
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "statusCode": 200,
  "message": "Teachers retrieved successfully",
  "data": [
    {
      "teacherId": 1,
      "teacherName": "Nguyễn Văn A",
      "email": "teacher1@example.com",
      "addedAt": "2026-01-25T11:48:00.000Z",
      "isOwner": true
    },
    {
      "teacherId": 2,
      "teacherName": "Nguyễn Văn B",
      "email": "teacher2@example.com",
      "addedAt": "2026-01-25T11:50:00.000Z",
      "isOwner": false
    }
  ],
  "timestamp": "2026-01-25T11:48:00.000Z"
}
```

---

## Student Management

### 1. Add Student to Classroom

```
POST /classrooms/:classId/students
Content-Type: application/json
Authorization: Bearer {token}

Request Body (Option 1 - by email):
{
  "email": "student@example.com"
}

Request Body (Option 2 - by name):
{
  "studentName": "Nguyễn Văn C"
}

Response (201):
{
  "success": true,
  "statusCode": 201,
  "message": "Student added successfully",
  "data": {
    "studentId": 5,
    "studentName": "Nguyễn Văn C",
    "email": "student@example.com",
    "gradeLevel": null,
    "joinedAt": "2026-01-25T11:48:00.000Z",
    "groupId": null,
    "groupName": null
  },
  "timestamp": "2026-01-25T11:48:00.000Z"
}
```

**Behavior:**

- If email provided and student exists: Add existing student
- If email provided and student doesn't exist: Create new student account
- If only name provided: Create new student account with auto-generated email

**Authorization:** Any teacher in the classroom

### 2. Remove Student from Classroom

```
DELETE /classrooms/:classId/students/:studentId
Authorization: Bearer {token}

Response (204): No Content
```

**Effects:**

- Student removed from classroom
- Student automatically removed from any groups in this classroom

**Authorization:** Any teacher in the classroom

### 3. List Students in Classroom

```
GET /classrooms/:classId/students?page=1&limit=10
Authorization: Bearer {token}

Query Parameters:
- page: int (default: 1)
- limit: int (default: 10, max: 100)

Response (200):
{
  "success": true,
  "statusCode": 200,
  "message": "Students retrieved successfully",
  "data": {
    "data": [
      {
        "studentId": 5,
        "studentName": "Nguyễn Văn C",
        "email": "student@example.com",
        "gradeLevel": null,
        "joinedAt": "2026-01-25T11:48:00.000Z",
        "groupId": 1,
        "groupName": "Nhóm 1"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10
  },
  "timestamp": "2026-01-25T11:48:00.000Z"
}
```

---

## Group Management

### 1. Create Group

```
POST /classrooms/:classId/groups
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "groupName": "Nhóm 1 - Lập trình"
}

Response (201):
{
  "success": true,
  "statusCode": 201,
  "message": "Group created successfully",
  "data": {
    "groupId": 1,
    "groupName": "Nhóm 1 - Lập trình",
    "classId": 1,
    "createdAt": "2026-01-25T11:48:00.000Z",
    "updatedAt": "2026-01-25T11:48:00.000Z",
    "studentCount": 0,
    "students": []
  },
  "timestamp": "2026-01-25T11:48:00.000Z"
}
```

**Constraints:**

- Group names must be unique within a classroom
- Group belongs to exactly one classroom

**Authorization:** Any teacher in the classroom

### 2. Update Group

```
PUT /classrooms/:classId/groups/:groupId
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "groupName": "Nhóm 1 - Lập trình Web"
}

Response (200): { ...GroupResponseDto }
```

**Authorization:** Any teacher in the classroom

### 3. Delete Group

```
DELETE /classrooms/:classId/groups/:groupId
Authorization: Bearer {token}

Response (204): No Content
```

**Effects:**

- Group is soft deleted
- Students remain in the classroom but no longer assigned to any group

**Authorization:** Any teacher in the classroom

### 4. List Groups

```
GET /classrooms/:classId/groups?page=1&limit=10
Authorization: Bearer {token}

Query Parameters:
- page: int (default: 1)
- limit: int (default: 10)

Response (200):
{
  "success": true,
  "statusCode": 200,
  "message": "Groups retrieved successfully",
  "data": {
    "data": [
      {
        "groupId": 1,
        "groupName": "Nhóm 1 - Lập trình",
        "classId": 1,
        "createdAt": "2026-01-25T11:48:00.000Z",
        "updatedAt": "2026-01-25T11:48:00.000Z",
        "studentCount": 5,
        "students": [
          {
            "studentId": 5,
            "studentName": "Nguyễn Văn C",
            "email": "student@example.com"
          }
        ]
      }
    ],
    "total": 3,
    "page": 1,
    "limit": 10
  },
  "timestamp": "2026-01-25T11:48:00.000Z"
}
```

### 5. Get Specific Group

```
GET /classrooms/:classId/groups/:groupId
Authorization: Bearer {token}

Response (200): { ...GroupResponseDto with students[] }
```

### 6. Assign Student to Group

```
POST /classrooms/:classId/groups/:groupId/students
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "studentId": 5
}

Response (201):
{
  "success": true,
  "statusCode": 201,
  "message": "Student assigned to group successfully",
  "timestamp": "2026-01-25T11:48:00.000Z"
}
```

**Behavior:**

- If student is in another group in the same classroom: Automatically moved to new group
- If student is not in classroom: Returns 404 error

**Constraints:**

- Student can only be in ONE group per classroom
- Student must already be in the classroom

**Authorization:** Any teacher in the classroom

### 7. Remove Student from Group

```
DELETE /classrooms/:classId/groups/:groupId/students/:studentId
Authorization: Bearer {token}

Response (204): No Content
```

**Effects:**

- Student removed from group
- Student remains in classroom but no longer assigned to any group

**Authorization:** Any teacher in the classroom

---

## Permission Rules Summary

### Teacher Permissions

- **Owner:**
  - Add other teachers ✅
  - Remove other teachers ✅
  - Edit classroom info ✅
  - Delete classroom ✅
  - Add students ✅
  - Remove students ✅
  - Create groups ✅
  - Delete groups ✅
  - Assign students to groups ✅

- **Non-Owner Teachers (added later):**
  - Edit classroom info ✅
  - Add students ✅
  - Remove students ✅
  - Create groups ✅
  - Delete groups ✅
  - Assign students to groups ✅
  - Add teachers ❌
  - Remove teachers ❌
  - Delete classroom ❌

### Student Permissions

- View own classrooms ✅
- View classroom details (if enrolled) ✅
- Cannot perform any modifications ❌

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "timestamp": "2026-01-25T11:48:00.000Z"
}
```

### Common Error Codes

| Code | Scenario                                                   |
| ---- | ---------------------------------------------------------- |
| 400  | Bad Request (validation error, duplicate group name, etc.) |
| 401  | Unauthorized (missing/invalid token)                       |
| 403  | Forbidden (insufficient permissions)                       |
| 404  | Not Found (resource doesn't exist)                         |
| 409  | Conflict (duplicate entry)                                 |

### Common Error Messages

- `Subject with ID {id} not found` - Subject doesn't exist
- `Classroom with ID {id} not found` - Classroom doesn't exist
- `Teacher with email {email} not found` - Teacher doesn't exist
- `Student is already in this classroom` - Cannot add duplicate student
- `Group with name "{name}" already exists in this classroom` - Duplicate group name
- `You do not have access to this classroom` - User is not a teacher/owner
- `Only the classroom owner can perform this action` - Non-owner permission denied

---

## Implementation Notes

### Soft Deletes

- Classrooms and groups use soft deletes (`is_deleted` flag)
- Deleted records are automatically excluded from list queries
- Hard deletes are not supported

### Unique Constraints

- Group names are unique within a classroom
- Student can only be in one group per classroom
- Teacher can only be added once per classroom

### Cascading Behavior

- Removing student from classroom cascades to remove from all groups
- Deleting classroom cascades to delete all groups and remove all students
- Deleting group does NOT delete students (they remain in classroom)

### Performance Considerations

- List endpoints are paginated (max 100 items per page)
- Includes count of related entities (students, teachers, groups)
- Uses database-level relationships for consistency

### Future Enhancements

- Student permissions for viewing classrooms
- Assessment and grade management
- Attendance tracking
- Classroom announcements
- Parent/Guardian involvement
- Role-based access control for non-owner teachers

---

## Testing with Swagger

All endpoints are documented with Swagger annotations. Access the interactive API documentation at:

```
GET /api/docs
```

The Swagger UI provides:

- Interactive endpoint testing
- Request/response examples
- Parameter validation
- Authorization bearer token input

---

## Database Migration

To apply these schema changes:

```bash
# Create migration
npx prisma migrate dev --name add_classroom_management

# Apply migration
npx prisma migrate deploy
```

This will:

1. Create the `teacher_classroom` junction table
2. Create the `class_group` table
3. Create the `group_student` junction table
4. Update `classroom` and `USER` models
5. Add soft delete support
