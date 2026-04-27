# Think Decision - Multi-Expert AHP Decision Support System

**Version:** 0.1.0  
**Status:** ✅ Backend Ready for Production  
**Frontend:** Ready for Integration

---

## 📋 Overview

Think Decision adalah platform berbasis web untuk **Multi-Expert MCDM (Multi-Criteria Decision Making)** menggunakan metode **AHP (Analytic Hierarchy Process)** dengan agregasi otomatis.

### Fitur Utama
- ✅ **Multi-Expert Support** - Undang pakar untuk memberikan penilaian
- ✅ **Hierarchical Criteria** - Kriteria berjenjang (level 1, level 2, dst)
- ✅ **Automatic Aggregation** - GMJ/GMP untuk agregasi penilaian pakar
- ✅ **Consistency Checking** - Otomatis hitung Consistency Ratio (CR)
- ✅ **Ranking Generation** - Hasil akhir dengan ranking & persentase
- ✅ **Progress Tracking** - Monitor kemajuan pengerjaan pakar
- ✅ **RESTful API** - 32+ endpoints dengan dokumentasi lengkap

---

## 🏗️ Architecture

```
Think Decision
├── Frontend (React - Ready for Development)
│   ├── Creator Dashboard
│   ├── Expert Interface
│   └── Results Display
│
└── Backend (FastAPI - ✅ Production Ready)
    ├── Database (PostgreSQL via Supabase)
    ├── REST API (32+ endpoints)
    ├── AHP Core Logic
    │   ├── Matrix Validation
    │   ├── Priority Vector Computation
    │   ├── Consistency Ratio Calculation
    │   └── Aggregation (GMJ/GMP)
    └── Authentication (Supabase Auth + JWT)
```

---

## 📂 Project Structure

```
Think Decision/
├── backend/
│   ├── app/
│   │   ├── core/ahp/               # AHP calculation modules
│   │   │   ├── matrix.py           # Matrix validation & normalization
│   │   │   ├── priority.py         # Priority vector computation
│   │   │   ├── consistency.py      # Consistency ratio (CR)
│   │   │   ├── aggregation.py      # GMJ/GMP aggregation
│   │   │   └── hierarchy.py        # Hierarchical weight computation
│   │   ├── models/                 # 8 SQLAlchemy database models
│   │   ├── routers/                # 7 API routers (32+ endpoints)
│   │   ├── schemas/                # 10 Pydantic request/response schemas
│   │   ├── main.py                 # FastAPI app entry point
│   │   ├── database.py             # SQLAlchemy async setup
│   │   ├── config.py               # Settings management
│   │   └── dependencies.py         # Auth dependencies
│   ├── migrations/                 # Alembic database migrations
│   ├── tests/                      # 16 unit tests (100% passing)
│   ├── pyproject.toml              # Dependencies
│   ├── alembic.ini                 # Migration config
│   └── .env                        # Configuration (credentials)
│
├── docs/
│   ├── BACKEND_SPEC.md             # Design specification
│   ├── BACKEND_PLAN.md             # Implementation plan (13 tasks)
│   └── DESIGN.md                   # Frontend design system
│
├── API_INTEGRATION_GUIDE.md         # Complete API reference
├── QUICK_START_EXAMPLES.md          # Code examples
├── FRONTEND_INTEGRATION_CHECKLIST.md # Frontend implementation guide
├── BACKEND_STATUS.md               # Implementation status
└── README.md                       # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL (via Supabase)
- Node.js (for frontend)

### Backend Setup & Running

**1. Navigate to backend**
```bash
cd backend
```

**2. Install dependencies**
```bash
pip install -e ".[dev]"
```

**3. Configure .env**
```bash
# .env already configured with Supabase credentials
# Database is ready with all tables created
```

**4. Start server**
```bash
uvicorn app.main:app --reload --port 8000
```

**5. Access API Documentation**
```
http://localhost:8000/docs
```

**6. Run tests**
```bash
pytest tests/ -v
```

---

## 📚 Documentation

### For Backend Developers
- **[BACKEND_STATUS.md](BACKEND_STATUS.md)** - Implementation status, what's done
- **[backend/MIGRATION_GUIDE.md](backend/MIGRATION_GUIDE.md)** - Database setup

### For Frontend Developers
- **[API_INTEGRATION_GUIDE.md](API_INTEGRATION_GUIDE.md)** - Complete API reference
  - All endpoints with request/response examples
  - Error handling patterns
  - Authentication flow
  
- **[QUICK_START_EXAMPLES.md](QUICK_START_EXAMPLES.md)** - Code examples
  - cURL commands
  - JavaScript/Fetch
  - React hooks
  
- **[FRONTEND_INTEGRATION_CHECKLIST.md](FRONTEND_INTEGRATION_CHECKLIST.md)** - Implementation guide
  - Step-by-step checklist
  - UI patterns
  - Testing strategy

### API Documentation
- **Interactive Docs:** http://localhost:8000/docs (Swagger UI)
- **32+ Endpoints** organized by:
  - Auth (Register, Login, Me)
  - Cases (CRUD)
  - Criteria (Create, List, Update, Delete)
  - Alternatives (Create, List, Update, Delete)
  - Experts (Invite, List, Remove)
  - Comparisons (Submit, List)
  - Results (Progress, Aggregate, Get Results)

---

## 🧮 AHP Algorithm Implementation

### Core Components

**1. Matrix Validation**
```python
from app.core.ahp.matrix import validate_matrix

matrix = [[1, 3, 5], [1/3, 1, 2], [1/5, 1/2, 1]]
is_valid, msg = validate_matrix(matrix)
# Checks: square, reciprocal, diagonal=1, positive
```

**2. Priority Vector Computation**
```python
from app.core.ahp.priority import compute_priority_vector
import numpy as np

matrix = np.array([[1, 3], [1/3, 1]])
pv = compute_priority_vector(matrix)
# Returns normalized priority vector
```

**3. Consistency Ratio Calculation**
```python
from app.core.ahp.consistency import check_consistency

matrix = np.array([[1, 3], [1/3, 1]])
result = check_consistency(matrix)
# {
#   'lambda_max': float,
#   'ci': float,
#   'cr': float,          # Consistency Ratio
#   'is_consistent': bool, # CR <= 0.1
#   'priority_vector': list
# }
```

**4. Multi-Expert Aggregation**
```python
from app.core.ahp.aggregation import aggregate_gmj, aggregate_gmp

# GMJ: Geometric Mean of Judgments
matrices = [matrix1, matrix2, matrix3]
agg_matrix = aggregate_gmj(matrices)

# GMP: Geometric Mean of Priorities
priority_vectors = [pv1, pv2, pv3]
agg_pv = aggregate_gmp(priority_vectors)
```

**5. Hierarchical Global Weights**
```python
from app.core.ahp.hierarchy import compute_global_weights

global_weights = compute_global_weights(
  criteria_tree=tree,
  comparisons_by_node={...},
  alternative_comparisons={...},
  criteria_ids=[...],
  alternative_ids=[...]
)
# Returns: {alt_id: global_weight}
```

---

## 🔐 Authentication

### Flow
1. **Register** → Create new user (Creator or Expert role)
2. **Login** → Get JWT access token from Supabase
3. **Use Token** → Include in Authorization header: `Bearer {token}`
4. **Token Validation** → Backend validates JWT signature

### Token Storage (Frontend)
```javascript
localStorage.setItem('token', response.access_token);

// Use in requests
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('token')}`
};
```

---

## 📊 Example Workflow

### Step 1: Create Case (Creator)
```bash
POST /cases
{
  "title": "Pemilihan Supplier",
  "method": "AHP",
  "aggregation_method": "GMJ"
}
```

### Step 2: Define Structure (Creator)
```bash
POST /cases/{case_id}/criteria
{
  "label": "Harga",
  "order_index": 0
}

POST /cases/{case_id}/criteria
{
  "label": "Kualitas",
  "order_index": 1
}

POST /cases/{case_id}/alternatives
{
  "label": "Supplier A",
  "order_index": 0
}
```

### Step 3: Invite Experts (Creator)
```bash
POST /cases/{case_id}/experts
{
  "email": "expert1@example.com"
}

POST /cases/{case_id}/experts
{
  "email": "expert2@example.com"
}
```

### Step 4: Experts Submit Comparisons
```bash
# Expert 1
POST /expert/cases/{case_id}/comparisons
{
  "node_type": "criteria",
  "parent_id": null,
  "value_matrix": [[1, 3], [1/3, 1]]
}

# Expert 2
POST /expert/cases/{case_id}/comparisons
{
  "node_type": "criteria",
  "parent_id": null,
  "value_matrix": [[1, 2.5], [0.4, 1]]
}
```

### Step 5: Aggregate Results (Creator)
```bash
POST /cases/{case_id}/aggregate
# Combines GMJ matrices and computes global weights
```

### Step 6: View Results (Creator/Experts)
```bash
GET /cases/{case_id}/results
# Returns ranking with percentages
```

---

## 🧪 Testing

### Unit Tests (16 passing)
```bash
cd backend
pytest tests/ -v

# Results:
# tests/core/test_matrix.py (5 tests) ✓
# tests/core/test_consistency.py (4 tests) ✓
# tests/core/test_aggregation.py (4 tests) ✓
# tests/core/test_hierarchy.py (3 tests) ✓
```

### Manual Testing
```bash
# Open Swagger UI
http://localhost:8000/docs

# Test each endpoint with "Try it out" button
# All responses include proper status codes and error messages
```

---

## 🛠️ Technology Stack

**Backend:**
- Python 3.11
- FastAPI 0.111.0 (async REST API)
- SQLAlchemy 2.0 (async ORM)
- PostgreSQL (via Supabase)
- Alembic (migrations)
- NumPy/SciPy (calculations)
- Pytest (testing)

**Database:**
- Supabase PostgreSQL
- 8 models: User, Case, Criteria, Alternative, ExpertInvite, Comparison, AggregatedResult, + Version table
- 5 enum types
- 9 performance indexes

**Deployment Ready:**
- ✅ Docker-compatible
- ✅ Environment-based config
- ✅ Async throughout
- ✅ Type hints
- ✅ Error handling
- ✅ CORS support

---

## 📝 API Statistics

| Category | Count |
|----------|-------|
| **Routers** | 7 |
| **Endpoints** | 32+ |
| **Models** | 8 |
| **Schemas** | 10 |
| **AHP Modules** | 5 |
| **Unit Tests** | 16 |
| **Database Tables** | 8 |
| **Enum Types** | 5 |

---

## 🚦 Status & Readiness

### Backend: ✅ PRODUCTION READY
- [x] All 13 implementation tasks completed
- [x] 16 unit tests passing
- [x] Database schema created in Supabase
- [x] API fully documented
- [x] Authentication working
- [x] AHP calculations verified
- [x] Error handling implemented

### Frontend: 🟡 READY FOR DEVELOPMENT
- [x] API fully documented
- [x] Integration guide provided
- [x] Example code provided
- [x] Checklist ready
- [ ] Frontend code (to be developed)

---

## 🔗 Important Links

| Resource | Link |
|----------|------|
| API Docs | http://localhost:8000/docs |
| API Reference | [API_INTEGRATION_GUIDE.md](API_INTEGRATION_GUIDE.md) |
| Code Examples | [QUICK_START_EXAMPLES.md](QUICK_START_EXAMPLES.md) |
| Frontend Guide | [FRONTEND_INTEGRATION_CHECKLIST.md](FRONTEND_INTEGRATION_CHECKLIST.md) |
| Backend Status | [BACKEND_STATUS.md](BACKEND_STATUS.md) |

---

## 📞 Support

For issues or questions:
1. Check [API_INTEGRATION_GUIDE.md](API_INTEGRATION_GUIDE.md) for endpoint details
2. Check [FRONTEND_INTEGRATION_CHECKLIST.md](FRONTEND_INTEGRATION_CHECKLIST.md) for implementation tips
3. Review error messages in API responses
4. Check server logs: `uvicorn app.main:app`

---

## 📄 License

Private project - Think Decision Platform

---

## 👥 Team

**Backend Development:** Completed ✅
- Database design & models
- REST API implementation
- AHP algorithm implementation
- Authentication & security
- Testing & documentation

**Frontend Development:** To be scheduled
- Creator dashboard
- Expert interface
- Results visualization
- User management

---

**Last Updated:** 2026-04-27  
**Backend Version:** 0.1.0  
**Status:** Ready for Production Deployment & Frontend Integration
