# Think Decision Backend - API Integration Guide

**Base URL:** `http://localhost:8000` (development) atau `your-domain.com` (production)

**API Documentation:** Open `http://localhost:8000/docs` untuk interactive Swagger UI

---

## 1. Authentication Flow

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "creator@example.com",
  "password": "securepassword123",
  "full_name": "John Creator",
  "role": "creator"  // or "expert"
}
```

**Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "creator@example.com",
    "full_name": "John Creator",
    "role": "creator"
  }
}
```

### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "creator@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "creator@example.com",
    "full_name": "John Creator",
    "role": "creator"
  }
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "creator@example.com",
  "full_name": "John Creator",
  "role": "creator"
}
```

---

## 2. Cases Management

### Create Case
```http
POST /cases
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Pemilihan Supplier Terbaik",
  "description": "Memilih supplier untuk raw materials",
  "method": "AHP",
  "aggregation_method": "GMJ"
}
```

**Response (201 Created):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "creator_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Pemilihan Supplier Terbaik",
  "description": "Memilih supplier untuk raw materials",
  "method": "AHP",
  "aggregation_method": "GMJ",
  "status": "draft",
  "created_at": "2026-04-27T10:30:00+00:00",
  "updated_at": "2026-04-27T10:30:00+00:00"
}
```

### List Cases
```http
GET /cases
Authorization: Bearer <token>

# Optional query parameter:
GET /cases?status=active
```

**Response (200 OK):**
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "creator_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Pemilihan Supplier Terbaik",
    "description": "Memilih supplier untuk raw materials",
    "method": "AHP",
    "aggregation_method": "GMJ",
    "status": "draft",
    "created_at": "2026-04-27T10:30:00+00:00",
    "updated_at": "2026-04-27T10:30:00+00:00"
  }
]
```

### Get Case Detail
```http
GET /cases/660e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <token>
```

### Update Case
```http
PATCH /cases/660e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Pemilihan Supplier - Update",
  "aggregation_method": "GMP"
}
```

### Update Case Status
```http
PATCH /cases/660e8400-e29b-41d4-a716-446655440001/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "active"  // draft, active, atau closed
}
```

### Delete Case
```http
DELETE /cases/660e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <token>
```

---

## 3. Criteria Management

### Create Criteria
```http
POST /cases/660e8400-e29b-41d4-a716-446655440001/criteria
Authorization: Bearer <token>
Content-Type: application/json

{
  "label": "Harga",
  "description": "Harga penawaran supplier",
  "parent_id": null,
  "order_index": 0
}
```

**Response (201 Created):**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "case_id": "660e8400-e29b-41d4-a716-446655440001",
  "parent_id": null,
  "label": "Harga",
  "description": "Harga penawaran supplier",
  "level": 1,
  "order_index": 0,
  "children": []
}
```

### Create Sub-Criteria (Hierarchical)
```http
POST /cases/660e8400-e29b-41d4-a716-446655440001/criteria
Authorization: Bearer <token>
Content-Type: application/json

{
  "label": "Harga per unit",
  "description": "Unit price yang ditawarkan",
  "parent_id": "770e8400-e29b-41d4-a716-446655440002",
  "order_index": 0
}
```

### List Criteria (Nested Tree)
```http
GET /cases/660e8400-e29b-41d4-a716-446655440001/criteria
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "case_id": "660e8400-e29b-41d4-a716-446655440001",
    "parent_id": null,
    "label": "Harga",
    "description": "Harga penawaran supplier",
    "level": 1,
    "order_index": 0,
    "children": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440003",
        "case_id": "660e8400-e29b-41d4-a716-446655440001",
        "parent_id": "770e8400-e29b-41d4-a716-446655440002",
        "label": "Harga per unit",
        "description": "Unit price yang ditawarkan",
        "level": 2,
        "order_index": 0,
        "children": []
      }
    ]
  }
]
```

### Update Criteria
```http
PATCH /criteria/770e8400-e29b-41d4-a716-446655440002
Authorization: Bearer <token>
Content-Type: application/json

{
  "label": "Harga (Update)",
  "order_index": 1
}
```

### Delete Criteria
```http
DELETE /criteria/770e8400-e29b-41d4-a716-446655440002
Authorization: Bearer <token>
```

---

## 4. Alternatives Management

### Create Alternative
```http
POST /cases/660e8400-e29b-41d4-a716-446655440001/alternatives
Authorization: Bearer <token>
Content-Type: application/json

{
  "label": "Supplier A",
  "description": "Perusahaan PT A Indonesia",
  "order_index": 0
}
```

**Response (201 Created):**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440004",
  "case_id": "660e8400-e29b-41d4-a716-446655440001",
  "label": "Supplier A",
  "description": "Perusahaan PT A Indonesia",
  "order_index": 0
}
```

### List Alternatives
```http
GET /cases/660e8400-e29b-41d4-a716-446655440001/alternatives
Authorization: Bearer <token>
```

### Update Alternative
```http
PATCH /alternatives/880e8400-e29b-41d4-a716-446655440004
Authorization: Bearer <token>
Content-Type: application/json

{
  "label": "Supplier A - Updated",
  "order_index": 1
}
```

### Delete Alternative
```http
DELETE /alternatives/880e8400-e29b-41d4-a716-446655440004
Authorization: Bearer <token>
```

---

## 5. Expert Management

### Invite Expert
```http
POST /cases/660e8400-e29b-41d4-a716-446655440001/experts
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "expert1@example.com"
}
```

**Response (201 Created):**
```json
{
  "message": "Expert expert1@example.com invited successfully",
  "invite_id": "990e8400-e29b-41d4-a716-446655440005"
}
```

### List Experts & Progress
```http
GET /cases/660e8400-e29b-41d4-a716-446655440001/experts
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "expert_id": "550e8400-e29b-41d4-a716-446655440010",
    "email": "expert1@example.com",
    "full_name": "expert1",
    "status": "pending",
    "invited_at": "2026-04-27T10:30:00+00:00",
    "accepted_at": null,
    "completed_at": null,
    "comparisons_submitted": 0,
    "comparisons_required": 4,
    "progress_percent": 0.0
  }
]
```

### Remove Expert
```http
DELETE /cases/660e8400-e29b-41d4-a716-446655440001/experts/550e8400-e29b-41d4-a716-446655440010
Authorization: Bearer <token>
```

---

## 6. Expert - Submit Comparisons

### List Assigned Cases (Expert View)
```http
GET /expert/cases
Authorization: Bearer <expert_token>
```

**Response (200 OK):**
```json
[
  {
    "case_id": "660e8400-e29b-41d4-a716-446655440001",
    "title": "Pemilihan Supplier Terbaik",
    "method": "AHP",
    "invite_status": "pending",
    "invited_at": "2026-04-27T10:30:00+00:00"
  }
]
```

### Get Case Detail (Expert View)
```http
GET /expert/cases/660e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <expert_token>
```

**Response (200 OK):**
```json
{
  "case": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "title": "Pemilihan Supplier Terbaik",
    "method": "AHP"
  },
  "criteria": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "label": "Harga",
      "parent_id": null,
      "level": 1
    }
  ],
  "alternatives": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440004",
      "label": "Supplier A"
    }
  ],
  "submitted_comparisons": []
}
```

### Submit Pairwise Comparison
```http
POST /expert/cases/660e8400-e29b-41d4-a716-446655440001/comparisons
Authorization: Bearer <expert_token>
Content-Type: application/json

{
  "node_type": "criteria",
  "parent_id": null,
  "value_matrix": [
    [1, 3, 5],
    [0.333, 1, 2],
    [0.2, 0.5, 1]
  ]
}
```

**Response (201 Created):**
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440006",
  "case_id": "660e8400-e29b-41d4-a716-446655440001",
  "expert_id": "550e8400-e29b-41d4-a716-446655440010",
  "node_type": "criteria",
  "parent_id": null,
  "value_matrix": [[1, 3, 5], [0.333, 1, 2], [0.2, 0.5, 1]],
  "priority_vector": [0.604, 0.286, 0.110],
  "cr": 0.0523,
  "is_consistent": true,
  "submitted_at": "2026-04-27T10:35:00+00:00",
  "updated_at": "2026-04-27T10:35:00+00:00"
}
```

**Note:** Matrix must be:
- Square (n x n)
- Reciprocal (matrix[i][j] * matrix[j][i] = 1)
- Diagonal = 1 (matrix[i][i] = 1)
- All positive values

### Get Expert Comparisons
```http
GET /expert/cases/660e8400-e29b-41d4-a716-446655440001/comparisons
Authorization: Bearer <expert_token>
```

---

## 7. Results & Aggregation

### Get Progress
```http
GET /cases/660e8400-e29b-41d4-a716-446655440001/progress
Authorization: Bearer <creator_token>
```

**Response (200 OK):**
```json
{
  "total_experts": 3,
  "completed": 1,
  "pending": 1,
  "accepted": 1,
  "completion_percent": 33.3
}
```

### Trigger Aggregation
```http
POST /cases/660e8400-e29b-41d4-a716-446655440001/aggregate
Authorization: Bearer <creator_token>
```

**Response (200 OK):**
```json
{
  "case_id": "660e8400-e29b-41d4-a716-446655440001",
  "aggregation_method_used": "GMJ",
  "ranking": [
    {
      "rank": 1,
      "alternative_id": "880e8400-e29b-41d4-a716-446655440004",
      "alternative_label": "Supplier A",
      "global_weight": 0.604,
      "percentage": 60.4
    },
    {
      "rank": 2,
      "alternative_id": "880e8400-e29b-41d4-a716-446655440005",
      "alternative_label": "Supplier B",
      "global_weight": 0.286,
      "percentage": 28.6
    },
    {
      "rank": 3,
      "alternative_id": "880e8400-e29b-41d4-a716-446655440006",
      "alternative_label": "Supplier C",
      "global_weight": 0.110,
      "percentage": 11.0
    }
  ],
  "criteria_weights": {
    "770e8400-e29b-41d4-a716-446655440002": 0.604
  },
  "aggregate_cr": null,
  "computed_at": "2026-04-27T10:40:00+00:00",
  "experts_included": 3
}
```

### Get Results
```http
GET /cases/660e8400-e29b-41d4-a716-446655440001/results
Authorization: Bearer <token>
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid matrix: Matrix must be square (n x n)"
}
```

### 401 Unauthorized
```json
{
  "detail": "Invalid token"
}
```

### 403 Forbidden
```json
{
  "detail": "Creator access required"
}
```

### 404 Not Found
```json
{
  "detail": "Case not found"
}
```

### 422 Unprocessable Entity
```json
{
  "detail": "Case must have criteria and alternatives"
}
```

---

## Frontend Implementation Tips

### 1. Store Token
```javascript
// After login/register
localStorage.setItem('token', response.access_token);
```

### 2. Include Token in Requests
```javascript
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
};
```

### 3. Handle Expired Token
```javascript
// If 401 Unauthorized, redirect to login
if (response.status === 401) {
  localStorage.removeItem('token');
  window.location.href = '/login';
}
```

### 4. Comparison Matrix Format
```javascript
// For n=3 alternatives/criteria:
const matrix = [
  [1, 3, 5],      // Comparing A vs B (3), A vs C (5)
  [1/3, 1, 2],    // Comparing B vs A (1/3), B vs C (2)
  [1/5, 1/2, 1]   // Comparing C vs A (1/5), C vs B (1/2)
];
```

### 5. Handle Nested Criteria Response
```javascript
// Criteria response includes children array
const buildCriteriaTree = (flatList) => {
  // Already nested! Just use directly
  return flatList; // Root level criteria with children
};
```

---

**Version:** 0.1.0  
**Last Updated:** 2026-04-27
