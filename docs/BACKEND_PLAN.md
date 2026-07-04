# Think Decision Backend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun backend REST API Think Decision berbasis FastAPI + Supabase PostgreSQL yang mendukung multi-expert AHP dengan agregasi otomatis GMJ/GMP.

**Architecture:** FastAPI async dengan SQLAlchemy 2.0, modul kalkulasi AHP sebagai pure functions terpisah di `app/core/ahp/`, dan Supabase sebagai managed PostgreSQL + Auth provider.

**Tech Stack:** Python 3.11, FastAPI 0.111, SQLAlchemy 2.0 (async), asyncpg, Alembic, Supabase, NumPy, SciPy, pytest, httpx

---

## Task 1: Project Setup & Dependencies

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/.env.example`
- Create: `backend/alembic.ini`
- Create: `backend/app/__init__.py`
- Create: `backend/app/config.py`

- [ ] **Step 1: Buat direktori struktur**

```bash
mkdir -p backend/app/models backend/app/schemas backend/app/routers backend/app/core/ahp backend/app/core/utils backend/migrations/versions backend/tests/core
touch backend/app/__init__.py backend/app/models/__init__.py backend/app/schemas/__init__.py backend/app/routers/__init__.py backend/app/core/__init__.py backend/app/core/ahp/__init__.py backend/app/core/utils/__init__.py backend/tests/__init__.py backend/tests/core/__init__.py
```

- [ ] **Step 2: Buat `backend/pyproject.toml`**

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "think-decision-backend"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi==0.111.0",
    "uvicorn[standard]==0.29.0",
    "sqlalchemy[asyncio]==2.0.30",
    "asyncpg==0.29.0",
    "alembic==1.13.1",
    "pydantic==2.7.1",
    "pydantic-settings==2.2.1",
    "python-jose[cryptography]==3.3.0",
    "httpx==0.27.0",
    "numpy==1.26.4",
    "scipy==1.13.0",
    "python-multipart==0.0.9",
    "supabase==2.4.2",
]

[project.optional-dependencies]
dev = [
    "pytest==8.2.0",
    "pytest-asyncio==0.23.6",
    "pytest-cov==5.0.0",
]
```

- [ ] **Step 3: Install dependencies**

```bash
cd backend
pip install -e ".[dev]"
```

Expected output: Successfully installed fastapi uvicorn sqlalchemy asyncpg alembic pydantic numpy scipy supabase ...

- [ ] **Step 4: Buat `backend/.env.example`**

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql+asyncpg://postgres:password@db.your-project.supabase.co:5432/postgres
SECRET_KEY=change-this-to-a-random-secret-key-minimum-32-chars
ENVIRONMENT=development
CORS_ORIGINS=["http://localhost:3000"]
```

Salin ke `.env` dan isi dengan nilai Supabase project Anda.

- [ ] **Step 5: Buat `backend/app/config.py`**

```python
from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    database_url: str
    secret_key: str
    environment: str = "development"
    cors_origins: List[str] = ["http://localhost:3000"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def is_development(self) -> bool:
        return self.environment == "development"


settings = Settings()
```

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "feat: project setup and dependencies"
```

---

## Task 2: Database Connection & Models

**Files:**
- Create: `backend/app/database.py`
- Create: `backend/app/models/user.py`
- Create: `backend/app/models/case.py`
- Create: `backend/app/models/criteria.py`
- Create: `backend/app/models/alternative.py`
- Create: `backend/app/models/expert_invite.py`
- Create: `backend/app/models/comparison.py`
- Create: `backend/app/models/aggregated_result.py`
- Create: `backend/app/models/__init__.py`

- [ ] **Step 1: Buat `backend/app/database.py`**

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings


engine = create_async_engine(
    settings.database_url,
    echo=settings.is_development,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

- [ ] **Step 2: Buat `backend/app/models/user.py`**

```python
import uuid
from datetime import datetime
from sqlalchemy import String, Enum as SAEnum, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    creator = "creator"
    expert = "expert"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), nullable=False, default=UserRole.creator)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
```

- [ ] **Step 3: Buat `backend/app/models/case.py`**

```python
import uuid
from datetime import datetime
from sqlalchemy import String, Text, Enum as SAEnum, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
import enum


class DecisionMethod(str, enum.Enum):
    AHP = "AHP"
    ANP = "ANP"
    FUZZY_AHP = "FUZZY_AHP"
    FUZZY_ANP = "FUZZY_ANP"


class AggregationMethod(str, enum.Enum):
    GMJ = "GMJ"
    GMP = "GMP"


class CaseStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    closed = "closed"


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    creator_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    method: Mapped[DecisionMethod] = mapped_column(SAEnum(DecisionMethod), nullable=False, default=DecisionMethod.AHP)
    aggregation_method: Mapped[AggregationMethod] = mapped_column(SAEnum(AggregationMethod), nullable=False, default=AggregationMethod.GMJ)
    status: Mapped[CaseStatus] = mapped_column(SAEnum(CaseStatus), nullable=False, default=CaseStatus.draft)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
```

- [ ] **Step 4: Buat `backend/app/models/criteria.py`**

```python
import uuid
from datetime import datetime
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Criteria(Base):
    __tablename__ = "criteria"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    case_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("criteria.id", ondelete="CASCADE"), nullable=True)
    label: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    level: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
```

- [ ] **Step 5: Buat `backend/app/models/alternative.py`**

```python
import uuid
from datetime import datetime
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Alternative(Base):
    __tablename__ = "alternatives"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    case_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    label: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
```

- [ ] **Step 6: Buat `backend/app/models/expert_invite.py`**

```python
import uuid
from datetime import datetime
from sqlalchemy import Enum as SAEnum, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
import enum


class InviteStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    completed = "completed"


class ExpertInvite(Base):
    __tablename__ = "expert_invites"
    __table_args__ = (UniqueConstraint("case_id", "expert_id"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    case_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    expert_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[InviteStatus] = mapped_column(SAEnum(InviteStatus), nullable=False, default=InviteStatus.pending)
    invited_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
```

- [ ] **Step 7: Buat `backend/app/models/comparison.py`**

```python
import uuid
from datetime import datetime
from sqlalchemy import String, Float, Boolean, DateTime, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB
from app.database import Base


class Comparison(Base):
    __tablename__ = "comparisons"
    __table_args__ = (
        UniqueConstraint("case_id", "expert_id", "node_type", "parent_id"),
        CheckConstraint("node_type IN ('criteria', 'alternative')", name="check_node_type"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    case_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    expert_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    node_type: Mapped[str] = mapped_column(String, nullable=False)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    value_matrix: Mapped[dict] = mapped_column(JSONB, nullable=False)
    priority_vector: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    cr: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_consistent: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
```

- [ ] **Step 8: Buat `backend/app/models/aggregated_result.py`**

```python
import uuid
from datetime import datetime
from sqlalchemy import Float, DateTime, ForeignKey, UniqueConstraint, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB
from app.database import Base
from app.models.case import AggregationMethod


class AggregatedResult(Base):
    __tablename__ = "aggregated_results"
    __table_args__ = (UniqueConstraint("case_id"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    case_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    aggregation_method_used: Mapped[AggregationMethod] = mapped_column(SAEnum(AggregationMethod), nullable=False)
    global_weights: Mapped[dict] = mapped_column(JSONB, nullable=False)
    criteria_weights: Mapped[dict] = mapped_column(JSONB, nullable=False)
    expert_priorities: Mapped[dict] = mapped_column(JSONB, nullable=False)
    aggregate_cr: Mapped[float | None] = mapped_column(Float, nullable=True)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
```

- [ ] **Step 9: Update `backend/app/models/__init__.py`**

```python
from app.models.user import User, UserRole
from app.models.case import Case, DecisionMethod, AggregationMethod, CaseStatus
from app.models.criteria import Criteria
from app.models.alternative import Alternative
from app.models.expert_invite import ExpertInvite, InviteStatus
from app.models.comparison import Comparison
from app.models.aggregated_result import AggregatedResult

__all__ = [
    "User", "UserRole",
    "Case", "DecisionMethod", "AggregationMethod", "CaseStatus",
    "Criteria", "Alternative",
    "ExpertInvite", "InviteStatus",
    "Comparison", "AggregatedResult",
]
```

- [ ] **Step 10: Commit**

```bash
git add backend/app/
git commit -m "feat: database models for all entities"
```

---

## Task 3: Alembic Migrations

**Files:**
- Create: `backend/alembic.ini`
- Modify: `backend/migrations/env.py`

- [ ] **Step 1: Init Alembic**

```bash
cd backend
alembic init migrations
```

- [ ] **Step 2: Update `backend/alembic.ini`** — ubah baris `sqlalchemy.url`

```ini
sqlalchemy.url = %(DATABASE_URL)s
```

- [ ] **Step 3: Update `backend/migrations/env.py`** — ganti isi dengan:

```python
import asyncio
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
from app.config import settings
from app.database import Base
from app.models import *  # noqa: import semua model agar terdeteksi

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 4: Generate migration**

```bash
cd backend
alembic revision --autogenerate -m "initial_schema"
```

Expected: File baru di `migrations/versions/xxxx_initial_schema.py`

- [ ] **Step 5: Apply migration ke Supabase**

```bash
alembic upgrade head
```

Expected output: `Running upgrade -> xxxx, initial_schema`

- [ ] **Step 6: Commit**

```bash
git add backend/migrations/ backend/alembic.ini
git commit -m "feat: alembic migrations initial schema"
```

---

## Task 4: Modul Kalkulasi AHP — Core

**Files:**
- Create: `backend/app/core/utils/matrix_utils.py`
- Create: `backend/app/core/ahp/matrix.py`
- Create: `backend/app/core/ahp/priority.py`
- Create: `backend/app/core/ahp/consistency.py`
- Create: `backend/tests/core/test_matrix.py`
- Create: `backend/tests/core/test_consistency.py`

- [ ] **Step 1: Tulis failing test untuk matrix validation**

```python
# backend/tests/core/test_matrix.py
import pytest
import numpy as np
from app.core.ahp.matrix import validate_matrix, normalize_matrix


def test_validate_matrix_valid():
    matrix = [[1, 3, 5], [1/3, 1, 2], [1/5, 1/2, 1]]
    is_valid, msg = validate_matrix(matrix)
    assert is_valid is True
    assert msg == ""


def test_validate_matrix_not_square():
    matrix = [[1, 3], [1/3, 1], [1, 2]]
    is_valid, msg = validate_matrix(matrix)
    assert is_valid is False
    assert "square" in msg.lower()


def test_validate_matrix_diagonal_not_one():
    matrix = [[2, 3], [1/3, 1]]
    is_valid, msg = validate_matrix(matrix)
    assert is_valid is False
    assert "diagonal" in msg.lower()


def test_validate_matrix_not_reciprocal():
    matrix = [[1, 3], [3, 1]]  # harusnya [1/3, ...]
    is_valid, msg = validate_matrix(matrix)
    assert is_valid is False
    assert "reciprocal" in msg.lower()


def test_normalize_matrix_columns_sum_to_one():
    matrix = np.array([[1, 3, 5], [1/3, 1, 2], [1/5, 1/2, 1]])
    normalized = normalize_matrix(matrix)
    col_sums = normalized.sum(axis=0)
    np.testing.assert_allclose(col_sums, np.ones(3), atol=1e-9)
```

- [ ] **Step 2: Jalankan test — pastikan FAIL**

```bash
cd backend
pytest tests/core/test_matrix.py -v
```

Expected: FAILED with ImportError atau AttributeError

- [ ] **Step 3: Implementasi `backend/app/core/ahp/matrix.py`**

```python
import numpy as np


def validate_matrix(matrix: list[list[float]]) -> tuple[bool, str]:
    """Validasi PCM: square, diagonal=1, reciprocal, positive, n>=2."""
    n = len(matrix)
    if n < 2:
        return False, "Matrix must have at least 2x2 size"
    for row in matrix:
        if len(row) != n:
            return False, "Matrix must be square (n x n)"
    for i in range(n):
        if abs(matrix[i][i] - 1.0) > 1e-9:
            return False, f"Diagonal element [{i}][{i}] must be 1.0"
        for j in range(n):
            if matrix[i][j] <= 0:
                return False, f"All values must be positive, got {matrix[i][j]} at [{i}][{j}]"
            if abs(matrix[i][j] * matrix[j][i] - 1.0) > 1e-6:
                return False, f"Matrix must be reciprocal: [{i}][{j}] * [{j}][{i}] must equal 1.0"
    return True, ""


def normalize_matrix(matrix: np.ndarray) -> np.ndarray:
    """Normalisasi kolom: bagi tiap elemen dengan jumlah kolomnya."""
    col_sums = matrix.sum(axis=0)
    return matrix / col_sums
```

- [ ] **Step 4: Jalankan test — pastikan PASS**

```bash
pytest tests/core/test_matrix.py -v
```

Expected: 5 passed

- [ ] **Step 5: Tulis failing test untuk consistency**

```python
# backend/tests/core/test_consistency.py
import pytest
import numpy as np
from app.core.ahp.priority import compute_priority_vector
from app.core.ahp.consistency import compute_lambda_max, compute_ci, compute_cr, check_consistency


def test_priority_vector_sums_to_one():
    matrix = np.array([[1, 3, 5], [1/3, 1, 2], [1/5, 1/2, 1]])
    pv = compute_priority_vector(matrix)
    assert abs(pv.sum() - 1.0) < 1e-9
    assert len(pv) == 3


def test_consistent_matrix_cr_below_threshold():
    # Matriks yang sangat konsisten
    matrix = np.array([[1, 1, 1], [1, 1, 1], [1, 1, 1]])
    result = check_consistency(matrix)
    assert result["cr"] < 0.1
    assert result["is_consistent"] is True


def test_inconsistent_matrix_cr_above_threshold():
    # Matriks yang jelas inkonsisten
    matrix = np.array([[1, 9, 1/9], [1/9, 1, 9], [9, 1/9, 1]])
    result = check_consistency(matrix)
    assert result["cr"] > 0.1
    assert result["is_consistent"] is False


def test_check_consistency_keys():
    matrix = np.array([[1, 3], [1/3, 1]])
    result = check_consistency(matrix)
    assert all(k in result for k in ["lambda_max", "ci", "cr", "is_consistent", "priority_vector"])
```

- [ ] **Step 6: Jalankan test — pastikan FAIL**

```bash
pytest tests/core/test_consistency.py -v
```

Expected: FAILED with ImportError

- [ ] **Step 7: Implementasi `backend/app/core/ahp/priority.py`**

```python
import numpy as np
from app.core.ahp.matrix import normalize_matrix


def compute_priority_vector(matrix: np.ndarray) -> np.ndarray:
    """
    Hitung priority vector via normalized column average.
    Setiap baris dinormalisasi, lalu dirata-rata.
    Output: 1D array panjang n, sum = 1.0
    """
    normalized = normalize_matrix(matrix)
    priority = normalized.mean(axis=1)
    return priority / priority.sum()  # pastikan sum = 1.0
```

- [ ] **Step 8: Implementasi `backend/app/core/ahp/consistency.py`**

```python
import numpy as np
from app.core.ahp.priority import compute_priority_vector


RI_TABLE: dict[int, float] = {
    1: 0.00, 2: 0.00, 3: 0.58, 4: 0.90, 5: 1.12,
    6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49,
}


def compute_lambda_max(matrix: np.ndarray, priority_vector: np.ndarray) -> float:
    """Hitung λmax: rata-rata dari (Aw)_i / w_i."""
    weighted = matrix @ priority_vector
    ratios = weighted / priority_vector
    return float(ratios.mean())


def compute_ci(lambda_max: float, n: int) -> float:
    """CI = (λmax - n) / (n - 1). Untuk n=1, CI=0."""
    if n <= 1:
        return 0.0
    return (lambda_max - n) / (n - 1)


def compute_cr(ci: float, n: int) -> float:
    """CR = CI / RI[n]. Jika n > 10, gunakan RI=1.49."""
    ri = RI_TABLE.get(n, 1.49)
    if ri == 0.0:
        return 0.0
    return ci / ri


def check_consistency(matrix: np.ndarray) -> dict:
    """
    Hitung lengkap: lambda_max, CI, CR, is_consistent, priority_vector.
    CR <= 0.1 dianggap konsisten (threshold Saaty).
    """
    n = matrix.shape[0]
    pv = compute_priority_vector(matrix)
    lmax = compute_lambda_max(matrix, pv)
    ci = compute_ci(lmax, n)
    cr = compute_cr(ci, n)
    return {
        "lambda_max": round(lmax, 6),
        "ci": round(ci, 6),
        "cr": round(cr, 6),
        "is_consistent": cr <= 0.1,
        "priority_vector": pv.tolist(),
    }
```

- [ ] **Step 9: Jalankan test — pastikan PASS**

```bash
pytest tests/core/test_consistency.py -v
```

Expected: 4 passed

- [ ] **Step 10: Commit**

```bash
git add backend/app/core/ backend/tests/core/
git commit -m "feat: AHP core - matrix validation, priority vector, consistency ratio"
```

---

## Task 5: Modul Kalkulasi AHP — Agregasi & Hierarki

**Files:**
- Create: `backend/app/core/ahp/aggregation.py`
- Create: `backend/app/core/ahp/hierarchy.py`
- Create: `backend/tests/core/test_aggregation.py`
- Create: `backend/tests/core/test_hierarchy.py`

- [ ] **Step 1: Tulis failing test untuk agregasi**

```python
# backend/tests/core/test_aggregation.py
import numpy as np
from app.core.ahp.aggregation import aggregate_gmj, aggregate_gmp


def test_aggregate_gmj_two_experts():
    m1 = np.array([[1, 3], [1/3, 1]])
    m2 = np.array([[1, 5], [1/5, 1]])
    result = aggregate_gmj([m1, m2])
    # GMJ: geometric mean tiap sel
    expected_01 = (3 * 5) ** 0.5  # ≈ 3.873
    assert abs(result[0][1] - expected_01) < 1e-6
    assert abs(result[1][0] - 1/expected_01) < 1e-6


def test_aggregate_gmj_reciprocal_preserved():
    m1 = np.array([[1, 3], [1/3, 1]])
    m2 = np.array([[1, 5], [1/5, 1]])
    result = aggregate_gmj([m1, m2])
    assert abs(result[0][1] * result[1][0] - 1.0) < 1e-9


def test_aggregate_gmp_sums_to_one():
    pv1 = np.array([0.75, 0.25])
    pv2 = np.array([0.6, 0.4])
    result = aggregate_gmp([pv1, pv2])
    assert abs(result.sum() - 1.0) < 1e-9


def test_aggregate_gmp_two_experts():
    pv1 = np.array([0.75, 0.25])
    pv2 = np.array([0.25, 0.75])
    result = aggregate_gmp([pv1, pv2])
    # Geometric mean simetris → hasil harus sama untuk dua elemen
    assert abs(result[0] - result[1]) < 1e-6
```

- [ ] **Step 2: Jalankan test — pastikan FAIL**

```bash
pytest tests/core/test_aggregation.py -v
```

Expected: FAILED ImportError

- [ ] **Step 3: Implementasi `backend/app/core/ahp/aggregation.py`**

```python
import numpy as np


def aggregate_gmj(matrices: list[np.ndarray]) -> np.ndarray:
    """
    Geometric Mean of Judgments:
    Tiap sel = geometric mean dari sel yang sama di semua pakar.
    matrix_agg[i][j] = prod(m[i][j]) ^ (1/k)
    """
    k = len(matrices)
    stacked = np.stack(matrices, axis=0)  # shape: (k, n, n)
    product = np.prod(stacked, axis=0)
    return np.power(product, 1.0 / k)


def aggregate_gmp(priority_vectors: list[np.ndarray]) -> np.ndarray:
    """
    Geometric Mean of Priorities:
    priority_agg[i] = prod(pv[i]) ^ (1/k), lalu dinormalisasi.
    """
    k = len(priority_vectors)
    stacked = np.stack(priority_vectors, axis=0)  # shape: (k, n)
    product = np.prod(stacked, axis=0)
    geo_mean = np.power(product, 1.0 / k)
    return geo_mean / geo_mean.sum()
```

- [ ] **Step 4: Jalankan test — pastikan PASS**

```bash
pytest tests/core/test_aggregation.py -v
```

Expected: 4 passed

- [ ] **Step 5: Tulis failing test untuk hierarchy**

```python
# backend/tests/core/test_hierarchy.py
from app.core.ahp.hierarchy import build_criteria_tree, compute_global_weights
import uuid


def test_build_criteria_tree_flat():
    cid1, cid2 = str(uuid.uuid4()), str(uuid.uuid4())
    rows = [
        {"id": cid1, "parent_id": None, "label": "Biaya", "level": 1},
        {"id": cid2, "parent_id": None, "label": "Kualitas", "level": 1},
    ]
    tree = build_criteria_tree(rows)
    assert cid1 in tree
    assert cid2 in tree
    assert tree[cid1]["children"] == {}


def test_build_criteria_tree_nested():
    cid1 = str(uuid.uuid4())
    cid1a = str(uuid.uuid4())
    rows = [
        {"id": cid1, "parent_id": None, "label": "Biaya", "level": 1},
        {"id": cid1a, "parent_id": cid1, "label": "Biaya Operasional", "level": 2},
    ]
    tree = build_criteria_tree(rows)
    assert cid1a in tree[cid1]["children"]


def test_compute_global_weights_simple():
    import numpy as np
    # 2 kriteria, 2 alternatif
    cid1, cid2 = str(uuid.uuid4()), str(uuid.uuid4())
    aid1, aid2 = str(uuid.uuid4()), str(uuid.uuid4())
    rows = [
        {"id": cid1, "parent_id": None, "label": "C1", "level": 1},
        {"id": cid2, "parent_id": None, "label": "C2", "level": 1},
    ]
    tree = build_criteria_tree(rows)
    # Kriteria: [0.6, 0.4]
    comparisons_by_node = {None: np.array([0.6, 0.4])}
    # Alternatif per kriteria
    alt_ids = [aid1, aid2]
    alternative_comparisons = {
        cid1: {aid1: 0.7, aid2: 0.3},
        cid2: {aid1: 0.4, aid2: 0.6},
    }
    criteria_ids = [cid1, cid2]
    global_weights = compute_global_weights(tree, comparisons_by_node, alternative_comparisons, criteria_ids, alt_ids)
    # aid1: 0.6*0.7 + 0.4*0.4 = 0.42 + 0.16 = 0.58
    assert abs(global_weights[aid1] - 0.58) < 1e-6
    assert abs(global_weights[aid2] - 0.42) < 1e-6
```

- [ ] **Step 6: Jalankan test — pastikan FAIL**

```bash
pytest tests/core/test_hierarchy.py -v
```

Expected: FAILED ImportError

- [ ] **Step 7: Implementasi `backend/app/core/ahp/hierarchy.py`**

```python
import numpy as np


def build_criteria_tree(criteria_rows: list[dict]) -> dict:
    """
    Konversi flat list criteria ke nested dict tree.
    Returns: {id: {label, level, children: {id: {...}}}}
    """
    nodes = {
        row["id"]: {
            "id": row["id"],
            "label": row["label"],
            "level": row["level"],
            "parent_id": row.get("parent_id"),
            "children": {},
        }
        for row in criteria_rows
    }
    tree = {}
    for node_id, node in nodes.items():
        parent_id = node["parent_id"]
        if parent_id is None:
            tree[node_id] = node
        elif parent_id in nodes:
            nodes[parent_id]["children"][node_id] = node
    return tree


def compute_global_weights(
    criteria_tree: dict,
    comparisons_by_node: dict,
    alternative_comparisons: dict,
    criteria_ids: list[str],
    alternative_ids: list[str],
) -> dict[str, float]:
    """
    Hitung global weight tiap alternatif secara rekursif.

    comparisons_by_node: {parent_id_or_None: np.array of weights, indexed by criteria_ids order}
    alternative_comparisons: {criteria_id: {alt_id: weight}}
    criteria_ids: ordered list of top-level criteria ids
    alternative_ids: ordered list of alternative ids

    Returns: {alternative_id: global_weight}
    """
    global_weights = {aid: 0.0 for aid in alternative_ids}

    def _recurse(node_ids: list[str], parent_id, inherited_weight: float):
        priority_vector = comparisons_by_node.get(parent_id)
        if priority_vector is None:
            return
        for i, nid in enumerate(node_ids):
            local_weight = float(priority_vector[i]) * inherited_weight
            node = criteria_tree.get(nid)
            if node and node["children"]:
                # Node ini punya sub-kriteria → recurse
                child_ids = list(node["children"].keys())
                _recurse(child_ids, nid, local_weight)
            else:
                # Leaf node → kalikan dengan bobot alternatif
                alt_weights = alternative_comparisons.get(nid, {})
                for aid in alternative_ids:
                    global_weights[aid] += local_weight * alt_weights.get(aid, 0.0)

    _recurse(criteria_ids, None, 1.0)
    return global_weights
```

- [ ] **Step 8: Jalankan test — pastikan PASS**

```bash
pytest tests/core/test_hierarchy.py -v
```

Expected: 3 passed

- [ ] **Step 9: Commit**

```bash
git add backend/app/core/ahp/ backend/tests/core/
git commit -m "feat: AHP core - aggregation GMJ/GMP and hierarchy global weights"
```

---

## Task 6: FastAPI App Entry Point & Dependencies

**Files:**
- Create: `backend/app/main.py`
- Create: `backend/app/dependencies.py`

- [ ] **Step 1: Buat `backend/app/dependencies.py`**

```python
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError
from app.database import get_db
from app.models.user import User
from app.config import settings


bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Decode JWT dari Supabase Auth, return User dari DB."""
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.supabase_anon_key,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def require_creator(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    from app.models.user import UserRole
    if current_user.role != UserRole.creator:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Creator access required")
    return current_user


async def require_expert(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    from app.models.user import UserRole
    if current_user.role != UserRole.expert:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Expert access required")
    return current_user
```

- [ ] **Step 2: Buat `backend/app/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, cases, criteria, alternatives, experts, comparisons, results

app = FastAPI(
    title="Think Decision API",
    description="Multi-Expert MCDM Platform — AHP, ANP, Fuzzy AHP, Fuzzy ANP",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(cases.router, prefix="/cases", tags=["Cases"])
app.include_router(criteria.router, tags=["Criteria"])
app.include_router(alternatives.router, tags=["Alternatives"])
app.include_router(experts.router, tags=["Experts"])
app.include_router(comparisons.router, tags=["Comparisons"])
app.include_router(results.router, tags=["Results"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/main.py backend/app/dependencies.py
git commit -m "feat: FastAPI app entry point and auth dependencies"
```

---

## Task 7: Auth Router & Schemas

**Files:**
- Create: `backend/app/schemas/auth.py`
- Create: `backend/app/routers/auth.py`

- [ ] **Step 1: Buat `backend/app/schemas/auth.py`**

```python
from pydantic import BaseModel, EmailStr
from uuid import UUID
from app.models.user import UserRole


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.creator


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: UserRole

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
```

- [ ] **Step 2: Buat `backend/app/routers/auth.py`**

```python
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from supabase import create_client
from app.database import get_db
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse, UserResponse
from app.dependencies import get_current_user
from app.config import settings

router = APIRouter()
supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: Annotated[AsyncSession, Depends(get_db)]):
    try:
        auth_response = supabase.auth.admin.create_user({
            "email": body.email,
            "password": body.password,
            "email_confirm": True,
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    supabase_user = auth_response.user
    db_user = User(
        id=supabase_user.id,
        email=body.email,
        full_name=body.full_name,
        role=body.role,
    )
    db.add(db_user)
    await db.flush()

    login_response = supabase.auth.sign_in_with_password({"email": body.email, "password": body.password})
    return AuthResponse(
        access_token=login_response.session.access_token,
        user=UserResponse.model_validate(db_user),
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, db: Annotated[AsyncSession, Depends(get_db)]):
    try:
        login_response = supabase.auth.sign_in_with_password({"email": body.email, "password": body.password})
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found in database")

    return AuthResponse(
        access_token=login_response.session.access_token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def me(current_user: Annotated[User, Depends(get_current_user)]):
    return UserResponse.model_validate(current_user)
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/schemas/ backend/app/routers/auth.py
git commit -m "feat: auth router - register, login, me"
```

---

## Task 8: Cases Router

**Files:**
- Create: `backend/app/schemas/case.py`
- Create: `backend/app/routers/cases.py`

- [ ] **Step 1: Buat `backend/app/schemas/case.py`**

```python
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.case import DecisionMethod, AggregationMethod, CaseStatus


class CaseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    method: DecisionMethod = DecisionMethod.AHP
    aggregation_method: AggregationMethod = AggregationMethod.GMJ


class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    aggregation_method: Optional[AggregationMethod] = None


class CaseStatusUpdate(BaseModel):
    status: CaseStatus


class CaseResponse(BaseModel):
    id: UUID
    creator_id: UUID
    title: str
    description: Optional[str]
    method: DecisionMethod
    aggregation_method: AggregationMethod
    status: CaseStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 2: Buat `backend/app/routers/cases.py`**

```python
from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.case import Case, CaseStatus
from app.models.user import User
from app.schemas.case import CaseCreate, CaseUpdate, CaseStatusUpdate, CaseResponse
from app.dependencies import get_current_user, require_creator

router = APIRouter()


@router.post("", response_model=CaseResponse, status_code=201)
async def create_case(
    body: CaseCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    case = Case(**body.model_dump(), creator_id=current_user.id)
    db.add(case)
    await db.flush()
    return CaseResponse.model_validate(case)


@router.get("", response_model=list[CaseResponse])
async def list_cases(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
    status: CaseStatus | None = None,
):
    query = select(Case).where(Case.creator_id == current_user.id)
    if status:
        query = query.where(Case.status == status)
    result = await db.execute(query.order_by(Case.created_at.desc()))
    return [CaseResponse.model_validate(c) for c in result.scalars().all()]


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(
    case_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    result = await db.execute(select(Case).where(Case.id == case_id, Case.creator_id == current_user.id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return CaseResponse.model_validate(case)


@router.patch("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: UUID,
    body: CaseUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    result = await db.execute(select(Case).where(Case.id == case_id, Case.creator_id == current_user.id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(case, field, value)
    await db.flush()
    return CaseResponse.model_validate(case)


@router.patch("/{case_id}/status", response_model=CaseResponse)
async def update_case_status(
    case_id: UUID,
    body: CaseStatusUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    result = await db.execute(select(Case).where(Case.id == case_id, Case.creator_id == current_user.id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    case.status = body.status
    await db.flush()
    return CaseResponse.model_validate(case)


@router.delete("/{case_id}", status_code=204)
async def delete_case(
    case_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    result = await db.execute(select(Case).where(Case.id == case_id, Case.creator_id == current_user.id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    case.status = CaseStatus.closed  # soft delete
    await db.flush()
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/schemas/case.py backend/app/routers/cases.py
git commit -m "feat: cases CRUD router"
```

---

## Task 9: Criteria & Alternatives Routers

**Files:**
- Create: `backend/app/schemas/criteria.py`
- Create: `backend/app/schemas/alternative.py`
- Create: `backend/app/routers/criteria.py`
- Create: `backend/app/routers/alternatives.py`

- [ ] **Step 1: Buat `backend/app/schemas/criteria.py`**

```python
from pydantic import BaseModel
from uuid import UUID
from typing import Optional


class CriteriaCreate(BaseModel):
    label: str
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    order_index: int = 0


class CriteriaUpdate(BaseModel):
    label: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None


class CriteriaResponse(BaseModel):
    id: UUID
    case_id: UUID
    parent_id: Optional[UUID]
    label: str
    description: Optional[str]
    level: int
    order_index: int
    children: list["CriteriaResponse"] = []

    model_config = {"from_attributes": True}


CriteriaResponse.model_rebuild()
```

- [ ] **Step 2: Buat `backend/app/schemas/alternative.py`**

```python
from pydantic import BaseModel
from uuid import UUID
from typing import Optional


class AlternativeCreate(BaseModel):
    label: str
    description: Optional[str] = None
    order_index: int = 0


class AlternativeUpdate(BaseModel):
    label: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None


class AlternativeResponse(BaseModel):
    id: UUID
    case_id: UUID
    label: str
    description: Optional[str]
    order_index: int

    model_config = {"from_attributes": True}
```

- [ ] **Step 3: Buat `backend/app/routers/criteria.py`**

```python
from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.criteria import Criteria
from app.models.case import Case
from app.models.user import User
from app.schemas.criteria import CriteriaCreate, CriteriaUpdate, CriteriaResponse
from app.dependencies import require_creator

router = APIRouter()


def build_tree(rows: list[Criteria]) -> list[CriteriaResponse]:
    """Konversi flat list ke nested tree untuk response."""
    nodes = {str(r.id): CriteriaResponse.model_validate(r) for r in rows}
    roots = []
    for node in nodes.values():
        if node.parent_id is None:
            roots.append(node)
        else:
            parent = nodes.get(str(node.parent_id))
            if parent:
                parent.children.append(node)
    return sorted(roots, key=lambda x: x.order_index)


@router.post("/cases/{case_id}/criteria", response_model=CriteriaResponse, status_code=201)
async def create_criteria(
    case_id: UUID,
    body: CriteriaCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    result = await db.execute(select(Case).where(Case.id == case_id, Case.creator_id == current_user.id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Case not found")
    level = 1
    if body.parent_id:
        parent = await db.get(Criteria, body.parent_id)
        if not parent:
            raise HTTPException(status_code=404, detail="Parent criteria not found")
        level = parent.level + 1
    criteria = Criteria(**body.model_dump(), case_id=case_id, level=level)
    db.add(criteria)
    await db.flush()
    return CriteriaResponse.model_validate(criteria)


@router.get("/cases/{case_id}/criteria", response_model=list[CriteriaResponse])
async def list_criteria(
    case_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    result = await db.execute(select(Criteria).where(Criteria.case_id == case_id).order_by(Criteria.order_index))
    return build_tree(result.scalars().all())


@router.patch("/criteria/{criteria_id}", response_model=CriteriaResponse)
async def update_criteria(
    criteria_id: UUID,
    body: CriteriaUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    criteria = await db.get(Criteria, criteria_id)
    if not criteria:
        raise HTTPException(status_code=404, detail="Criteria not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(criteria, field, value)
    await db.flush()
    return CriteriaResponse.model_validate(criteria)


@router.delete("/criteria/{criteria_id}", status_code=204)
async def delete_criteria(
    criteria_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    criteria = await db.get(Criteria, criteria_id)
    if not criteria:
        raise HTTPException(status_code=404, detail="Criteria not found")
    await db.delete(criteria)
```

- [ ] **Step 4: Buat `backend/app/routers/alternatives.py`**

```python
from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.alternative import Alternative
from app.models.case import Case
from app.models.user import User
from app.schemas.alternative import AlternativeCreate, AlternativeUpdate, AlternativeResponse
from app.dependencies import require_creator

router = APIRouter()


@router.post("/cases/{case_id}/alternatives", response_model=AlternativeResponse, status_code=201)
async def create_alternative(
    case_id: UUID,
    body: AlternativeCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    result = await db.execute(select(Case).where(Case.id == case_id, Case.creator_id == current_user.id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Case not found")
    alt = Alternative(**body.model_dump(), case_id=case_id)
    db.add(alt)
    await db.flush()
    return AlternativeResponse.model_validate(alt)


@router.get("/cases/{case_id}/alternatives", response_model=list[AlternativeResponse])
async def list_alternatives(
    case_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    result = await db.execute(select(Alternative).where(Alternative.case_id == case_id).order_by(Alternative.order_index))
    return [AlternativeResponse.model_validate(a) for a in result.scalars().all()]


@router.patch("/alternatives/{alt_id}", response_model=AlternativeResponse)
async def update_alternative(
    alt_id: UUID,
    body: AlternativeUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    alt = await db.get(Alternative, alt_id)
    if not alt:
        raise HTTPException(status_code=404, detail="Alternative not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(alt, field, value)
    await db.flush()
    return AlternativeResponse.model_validate(alt)


@router.delete("/alternatives/{alt_id}", status_code=204)
async def delete_alternative(
    alt_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    alt = await db.get(Alternative, alt_id)
    if not alt:
        raise HTTPException(status_code=404, detail="Alternative not found")
    await db.delete(alt)
```

- [ ] **Step 5: Commit**

```bash
git add backend/app/schemas/ backend/app/routers/
git commit -m "feat: criteria and alternatives routers"
```

---

## Task 10: Experts Router (Undangan Pakar)

**Files:**
- Create: `backend/app/schemas/expert.py`
- Create: `backend/app/routers/experts.py`

- [ ] **Step 1: Buat `backend/app/schemas/expert.py`**

```python
from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.expert_invite import InviteStatus


class ExpertInviteRequest(BaseModel):
    email: EmailStr


class ExpertProgressResponse(BaseModel):
    expert_id: UUID
    email: str
    full_name: str
    status: InviteStatus
    invited_at: datetime
    accepted_at: Optional[datetime]
    completed_at: Optional[datetime]
    comparisons_submitted: int
    comparisons_required: int
    progress_percent: float
```

- [ ] **Step 2: Buat `backend/app/routers/experts.py`**

```python
from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.expert_invite import ExpertInvite, InviteStatus
from app.models.user import User, UserRole
from app.models.case import Case
from app.models.criteria import Criteria
from app.models.alternative import Alternative
from app.models.comparison import Comparison
from app.schemas.expert import ExpertInviteRequest, ExpertProgressResponse
from app.dependencies import require_creator

router = APIRouter()


def _count_required_comparisons(criteria_rows: list, has_alternatives: bool) -> int:
    """
    Hitung total matriks yang harus diisi oleh satu pakar.
    = 1 (antar kriteria level 1) + jumlah parent node (antar sub-kriteria)
    + jumlah leaf criteria (antar alternatif per kriteria)
    """
    parent_ids = {str(c.parent_id) for c in criteria_rows if c.parent_id is not None}
    leaf_count = sum(1 for c in criteria_rows if str(c.id) not in parent_ids)
    # 1 matriks kriteria level-1 + matriks per parent + matriks alternatif per leaf
    top_level_parents = sum(1 for c in criteria_rows if c.parent_id is not None)
    num_sub_comparisons = len(set(str(c.parent_id) for c in criteria_rows if c.parent_id is not None))
    if not has_alternatives:
        return 1 + num_sub_comparisons
    return 1 + num_sub_comparisons + leaf_count


@router.post("/cases/{case_id}/experts", status_code=201)
async def invite_expert(
    case_id: UUID,
    body: ExpertInviteRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    result = await db.execute(select(Case).where(Case.id == case_id, Case.creator_id == current_user.id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Case not found")

    # Cari expert user atau buat placeholder
    exp_result = await db.execute(select(User).where(User.email == body.email))
    expert = exp_result.scalar_one_or_none()
    if not expert:
        # Buat user dengan role expert (belum punya password, akan register sendiri)
        expert = User(email=body.email, full_name=body.email.split("@")[0], role=UserRole.expert)
        db.add(expert)
        await db.flush()

    # Cek sudah diundang?
    existing = await db.execute(
        select(ExpertInvite).where(ExpertInvite.case_id == case_id, ExpertInvite.expert_id == expert.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Expert already invited")

    invite = ExpertInvite(case_id=case_id, expert_id=expert.id)
    db.add(invite)
    await db.flush()
    return {"message": f"Expert {body.email} invited successfully", "invite_id": str(invite.id)}


@router.get("/cases/{case_id}/experts", response_model=list[ExpertProgressResponse])
async def list_experts(
    case_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    result = await db.execute(select(Case).where(Case.id == case_id, Case.creator_id == current_user.id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Case not found")

    invites_result = await db.execute(select(ExpertInvite).where(ExpertInvite.case_id == case_id))
    invites = invites_result.scalars().all()

    criteria_result = await db.execute(select(Criteria).where(Criteria.case_id == case_id))
    criteria_rows = criteria_result.scalars().all()

    alt_result = await db.execute(select(Alternative).where(Alternative.case_id == case_id))
    has_alternatives = len(alt_result.scalars().all()) > 0

    required = _count_required_comparisons(criteria_rows, has_alternatives)
    responses = []
    for invite in invites:
        expert = await db.get(User, invite.expert_id)
        comp_count_result = await db.execute(
            select(func.count()).where(Comparison.case_id == case_id, Comparison.expert_id == invite.expert_id)
        )
        submitted = comp_count_result.scalar() or 0
        progress = (submitted / required * 100) if required > 0 else 0
        responses.append(ExpertProgressResponse(
            expert_id=invite.expert_id,
            email=expert.email,
            full_name=expert.full_name,
            status=invite.status,
            invited_at=invite.invited_at,
            accepted_at=invite.accepted_at,
            completed_at=invite.completed_at,
            comparisons_submitted=submitted,
            comparisons_required=required,
            progress_percent=round(progress, 1),
        ))
    return responses


@router.delete("/cases/{case_id}/experts/{expert_id}", status_code=204)
async def remove_expert(
    case_id: UUID,
    expert_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    result = await db.execute(
        select(ExpertInvite).where(
            ExpertInvite.case_id == case_id,
            ExpertInvite.expert_id == expert_id,
            ExpertInvite.status == InviteStatus.pending,
        )
    )
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="Pending invite not found")
    await db.delete(invite)
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/schemas/expert.py backend/app/routers/experts.py
git commit -m "feat: experts invitation and progress router"
```

---

## Task 11: Comparisons Router (Scoring Pakar)

**Files:**
- Create: `backend/app/schemas/comparison.py`
- Create: `backend/app/routers/comparisons.py`

- [ ] **Step 1: Buat `backend/app/schemas/comparison.py`**

```python
from pydantic import BaseModel, field_validator
from uuid import UUID
from datetime import datetime
from typing import Optional


class ComparisonCreate(BaseModel):
    node_type: str  # 'criteria' | 'alternative'
    parent_id: Optional[UUID] = None
    value_matrix: list[list[float]]

    @field_validator("node_type")
    @classmethod
    def validate_node_type(cls, v):
        if v not in ("criteria", "alternative"):
            raise ValueError("node_type must be 'criteria' or 'alternative'")
        return v


class ComparisonUpdate(BaseModel):
    value_matrix: list[list[float]]


class ComparisonResponse(BaseModel):
    id: UUID
    case_id: UUID
    expert_id: UUID
    node_type: str
    parent_id: Optional[UUID]
    value_matrix: list[list[float]]
    priority_vector: Optional[list[float]]
    cr: Optional[float]
    is_consistent: Optional[bool]
    submitted_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 2: Buat `backend/app/routers/comparisons.py`**

```python
from typing import Annotated
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import numpy as np
from app.database import get_db
from app.models.comparison import Comparison
from app.models.expert_invite import ExpertInvite, InviteStatus
from app.models.criteria import Criteria
from app.models.alternative import Alternative
from app.models.case import Case
from app.models.user import User
from app.schemas.comparison import ComparisonCreate, ComparisonUpdate, ComparisonResponse
from app.dependencies import require_expert
from app.core.ahp.matrix import validate_matrix
from app.core.ahp.consistency import check_consistency

router = APIRouter()


async def _verify_expert_invite(case_id: UUID, expert_id: UUID, db: AsyncSession) -> ExpertInvite:
    result = await db.execute(
        select(ExpertInvite).where(
            ExpertInvite.case_id == case_id,
            ExpertInvite.expert_id == expert_id,
        )
    )
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=403, detail="Not invited to this case")
    return invite


@router.get("/expert/cases", response_model=list[dict])
async def list_expert_cases(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_expert)],
):
    result = await db.execute(
        select(ExpertInvite, Case)
        .join(Case, Case.id == ExpertInvite.case_id)
        .where(ExpertInvite.expert_id == current_user.id)
    )
    rows = result.all()
    return [
        {
            "case_id": str(row.Case.id),
            "title": row.Case.title,
            "method": row.Case.method,
            "invite_status": row.ExpertInvite.status,
            "invited_at": row.ExpertInvite.invited_at,
        }
        for row in rows
    ]


@router.get("/expert/cases/{case_id}", response_model=dict)
async def get_expert_case_detail(
    case_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_expert)],
):
    await _verify_expert_invite(case_id, current_user.id, db)
    case = await db.get(Case, case_id)
    criteria_result = await db.execute(select(Criteria).where(Criteria.case_id == case_id))
    alt_result = await db.execute(select(Alternative).where(Alternative.case_id == case_id))
    comp_result = await db.execute(
        select(Comparison).where(Comparison.case_id == case_id, Comparison.expert_id == current_user.id)
    )
    return {
        "case": {"id": str(case.id), "title": case.title, "method": case.method},
        "criteria": [{"id": str(c.id), "label": c.label, "parent_id": str(c.parent_id) if c.parent_id else None, "level": c.level} for c in criteria_result.scalars().all()],
        "alternatives": [{"id": str(a.id), "label": a.label} for a in alt_result.scalars().all()],
        "submitted_comparisons": [str(c.id) for c in comp_result.scalars().all()],
    }


@router.post("/expert/cases/{case_id}/comparisons", response_model=ComparisonResponse, status_code=201)
async def submit_comparison(
    case_id: UUID,
    body: ComparisonCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_expert)],
):
    invite = await _verify_expert_invite(case_id, current_user.id, db)

    is_valid, error_msg = validate_matrix(body.value_matrix)
    if not is_valid:
        raise HTTPException(status_code=422, detail=f"Invalid matrix: {error_msg}")

    matrix_np = np.array(body.value_matrix)
    consistency = check_consistency(matrix_np)

    # Cek apakah sudah ada (upsert)
    existing_result = await db.execute(
        select(Comparison).where(
            Comparison.case_id == case_id,
            Comparison.expert_id == current_user.id,
            Comparison.node_type == body.node_type,
            Comparison.parent_id == body.parent_id,
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing:
        existing.value_matrix = body.value_matrix
        existing.priority_vector = consistency["priority_vector"]
        existing.cr = consistency["cr"]
        existing.is_consistent = consistency["is_consistent"]
        existing.updated_at = datetime.utcnow()
        comp = existing
    else:
        comp = Comparison(
            case_id=case_id,
            expert_id=current_user.id,
            node_type=body.node_type,
            parent_id=body.parent_id,
            value_matrix=body.value_matrix,
            priority_vector=consistency["priority_vector"],
            cr=consistency["cr"],
            is_consistent=consistency["is_consistent"],
        )
        db.add(comp)

    # Update invite status ke accepted jika masih pending
    if invite.status == InviteStatus.pending:
        invite.status = InviteStatus.accepted
        invite.accepted_at = datetime.utcnow()

    await db.flush()
    return ComparisonResponse.model_validate(comp)


@router.get("/expert/cases/{case_id}/comparisons", response_model=list[ComparisonResponse])
async def get_expert_comparisons(
    case_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_expert)],
):
    await _verify_expert_invite(case_id, current_user.id, db)
    result = await db.execute(
        select(Comparison).where(Comparison.case_id == case_id, Comparison.expert_id == current_user.id)
    )
    return [ComparisonResponse.model_validate(c) for c in result.scalars().all()]
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/schemas/comparison.py backend/app/routers/comparisons.py
git commit -m "feat: comparisons router - expert scoring with auto CR calculation"
```

---

## Task 12: Results Router (Agregasi & Ranking)

**Files:**
- Create: `backend/app/schemas/result.py`
- Create: `backend/app/routers/results.py`

- [ ] **Step 1: Buat `backend/app/schemas/result.py`**

```python
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.case import AggregationMethod


class AggregationTrigger(BaseModel):
    pass  # Tidak butuh body — gunakan setting dari Case


class RankingItem(BaseModel):
    rank: int
    alternative_id: UUID
    alternative_label: str
    global_weight: float
    percentage: float


class ResultResponse(BaseModel):
    case_id: UUID
    aggregation_method_used: AggregationMethod
    ranking: list[RankingItem]
    criteria_weights: dict
    aggregate_cr: Optional[float]
    computed_at: datetime
    experts_included: int
```

- [ ] **Step 2: Buat `backend/app/routers/results.py`**

```python
from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import numpy as np
import json
from app.database import get_db
from app.models.case import Case, AggregationMethod
from app.models.criteria import Criteria
from app.models.alternative import Alternative
from app.models.comparison import Comparison
from app.models.expert_invite import ExpertInvite, InviteStatus
from app.models.aggregated_result import AggregatedResult
from app.models.user import User
from app.schemas.result import ResultResponse, RankingItem
from app.dependencies import require_creator, get_current_user
from app.core.ahp.aggregation import aggregate_gmj, aggregate_gmp
from app.core.ahp.consistency import check_consistency
from app.core.ahp.hierarchy import build_criteria_tree, compute_global_weights

router = APIRouter()


@router.get("/cases/{case_id}/progress", response_model=dict)
async def get_progress(
    case_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    result = await db.execute(select(Case).where(Case.id == case_id, Case.creator_id == current_user.id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Case not found")

    invites_result = await db.execute(select(ExpertInvite).where(ExpertInvite.case_id == case_id))
    invites = invites_result.scalars().all()
    total = len(invites)
    completed = sum(1 for i in invites if i.status == InviteStatus.completed)
    return {
        "total_experts": total,
        "completed": completed,
        "pending": sum(1 for i in invites if i.status == InviteStatus.pending),
        "accepted": sum(1 for i in invites if i.status == InviteStatus.accepted),
        "completion_percent": round(completed / total * 100, 1) if total > 0 else 0,
    }


@router.post("/cases/{case_id}/aggregate", response_model=ResultResponse)
async def aggregate(
    case_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_creator)],
):
    # 1. Validasi kasus
    case_result = await db.execute(select(Case).where(Case.id == case_id, Case.creator_id == current_user.id))
    case = case_result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # 2. Ambil data
    criteria_result = await db.execute(select(Criteria).where(Criteria.case_id == case_id))
    criteria_rows = criteria_result.scalars().all()
    alt_result = await db.execute(select(Alternative).where(Alternative.case_id == case_id))
    alternatives = alt_result.scalars().all()
    if not criteria_rows or not alternatives:
        raise HTTPException(status_code=422, detail="Case must have criteria and alternatives")

    # 3. Ambil pakar yang sudah accepted/completed
    invite_result = await db.execute(
        select(ExpertInvite).where(
            ExpertInvite.case_id == case_id,
            ExpertInvite.status.in_([InviteStatus.accepted, InviteStatus.completed]),
        )
    )
    invites = invite_result.scalars().all()
    if not invites:
        raise HTTPException(status_code=422, detail="No expert has submitted comparisons yet")

    expert_ids = [inv.expert_id for inv in invites]

    # 4. Build criteria tree
    criteria_dicts = [{"id": str(c.id), "parent_id": str(c.parent_id) if c.parent_id else None, "label": c.label, "level": c.level} for c in criteria_rows]
    criteria_tree = build_criteria_tree(criteria_dicts)

    # 5. Identifikasi semua node_key yang perlu diagregasi
    # node_key = (node_type, parent_id_str)
    comp_result = await db.execute(
        select(Comparison).where(Comparison.case_id == case_id, Comparison.expert_id.in_(expert_ids))
    )
    all_comparisons = comp_result.scalars().all()

    # Group by (node_type, parent_id)
    from collections import defaultdict
    grouped: dict[tuple, list[Comparison]] = defaultdict(list)
    for comp in all_comparisons:
        key = (comp.node_type, str(comp.parent_id) if comp.parent_id else None)
        grouped[key].append(comp)

    # 6. Agregasi per node
    agg_method = case.aggregation_method
    comparisons_by_node = {}  # {None | criteria_id: np.array priority_vector}
    alt_comparisons = {}  # {criteria_id: {alt_id: weight}}

    for (node_type, parent_id_str), comps in grouped.items():
        matrices = [np.array(c.value_matrix) for c in comps]

        if agg_method == AggregationMethod.GMJ:
            agg_matrix = aggregate_gmj(matrices)
            result_dict = check_consistency(agg_matrix)
            pv = np.array(result_dict["priority_vector"])
        else:  # GMP
            pvs = [np.array(c.priority_vector) for c in comps if c.priority_vector]
            pv = aggregate_gmp(pvs)

        if node_type == "criteria":
            node_key = parent_id_str  # None = level 1, UUID = sub-kriteria parent
            # Urutkan sesuai criteria_rows order
            if parent_id_str is None:
                ordered_ids = [str(c.id) for c in sorted(criteria_rows, key=lambda x: x.order_index) if c.parent_id is None]
            else:
                ordered_ids = [str(c.id) for c in sorted(criteria_rows, key=lambda x: x.order_index) if str(c.parent_id) == parent_id_str]
            # pv urutan sesuai ordered_ids
            pv_dict = {cid: float(pv[i]) for i, cid in enumerate(ordered_ids)}
            comparisons_by_node[parent_id_str] = np.array([pv_dict.get(cid, 0.0) for cid in ordered_ids])
            comparisons_by_node[f"_ids_{parent_id_str}"] = ordered_ids

        elif node_type == "alternative":
            alt_ids_ordered = [str(a.id) for a in sorted(alternatives, key=lambda x: x.order_index)]
            alt_comparisons[parent_id_str] = {alt_ids_ordered[i]: float(pv[i]) for i in range(len(alt_ids_ordered))}

    # 7. Hitung global weights
    top_level_criteria_ids = comparisons_by_node.get("_ids_None", [str(c.id) for c in sorted(criteria_rows, key=lambda x: x.order_index) if c.parent_id is None])
    alt_ids = [str(a.id) for a in alternatives]

    global_weights = compute_global_weights(
        criteria_tree=criteria_tree,
        comparisons_by_node={k: v for k, v in comparisons_by_node.items() if not k.startswith("_ids_")},
        alternative_comparisons=alt_comparisons,
        criteria_ids=top_level_criteria_ids,
        alternative_ids=alt_ids,
    )

    # 8. Simpan atau update aggregated_results
    existing = await db.execute(select(AggregatedResult).where(AggregatedResult.case_id == case_id))
    existing_result = existing.scalar_one_or_none()

    criteria_weights_out = {k: float(v) for k, v in comparisons_by_node.items() if not k.startswith("_ids_") and k is not None}
    expert_priorities_out = {str(expert_id): {} for expert_id in expert_ids}

    if existing_result:
        existing_result.aggregation_method_used = agg_method
        existing_result.global_weights = {str(k): v for k, v in global_weights.items()}
        existing_result.criteria_weights = criteria_weights_out
        existing_result.expert_priorities = expert_priorities_out
        agg_result = existing_result
    else:
        agg_result = AggregatedResult(
            case_id=case_id,
            aggregation_method_used=agg_method,
            global_weights={str(k): v for k, v in global_weights.items()},
            criteria_weights=criteria_weights_out,
            expert_priorities=expert_priorities_out,
        )
        db.add(agg_result)
    await db.flush()

    # 9. Build ranking response
    alt_label_map = {str(a.id): a.label for a in alternatives}
    sorted_alts = sorted(global_weights.items(), key=lambda x: x[1], reverse=True)
    total_w = sum(global_weights.values()) or 1.0
    ranking = [
        RankingItem(
            rank=i + 1,
            alternative_id=UUID(aid),
            alternative_label=alt_label_map.get(aid, aid),
            global_weight=round(w, 6),
            percentage=round(w / total_w * 100, 2),
        )
        for i, (aid, w) in enumerate(sorted_alts)
    ]

    return ResultResponse(
        case_id=case_id,
        aggregation_method_used=agg_method,
        ranking=ranking,
        criteria_weights=criteria_weights_out,
        aggregate_cr=None,
        computed_at=agg_result.computed_at,
        experts_included=len(expert_ids),
    )


@router.get("/cases/{case_id}/results", response_model=ResultResponse)
async def get_results(
    case_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    agg_result = await db.execute(select(AggregatedResult).where(AggregatedResult.case_id == case_id))
    result = agg_result.scalar_one_or_none()
    if not result:
        raise HTTPException(status_code=404, detail="No aggregated results yet. Trigger /aggregate first.")

    alt_result = await db.execute(select(Alternative).where(Alternative.case_id == case_id))
    alternatives = alt_result.scalars().all()
    alt_label_map = {str(a.id): a.label for a in alternatives}

    global_weights = result.global_weights
    sorted_alts = sorted(global_weights.items(), key=lambda x: x[1], reverse=True)
    total_w = sum(global_weights.values()) or 1.0
    ranking = [
        RankingItem(
            rank=i + 1,
            alternative_id=UUID(aid),
            alternative_label=alt_label_map.get(aid, aid),
            global_weight=round(w, 6),
            percentage=round(w / total_w * 100, 2),
        )
        for i, (aid, w) in enumerate(sorted_alts)
    ]

    return ResultResponse(
        case_id=case_id,
        aggregation_method_used=result.aggregation_method_used,
        ranking=ranking,
        criteria_weights=result.criteria_weights,
        aggregate_cr=result.aggregate_cr,
        computed_at=result.computed_at,
        experts_included=len(result.expert_priorities),
    )
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/schemas/result.py backend/app/routers/results.py
git commit -m "feat: results router - aggregation trigger and ranking output"
```

---

## Task 13: Verifikasi End-to-End & Run Server

**Files:**
- Modify: `backend/app/routers/__init__.py` (pastikan semua router ter-import)

- [ ] **Step 1: Update `backend/app/routers/__init__.py`**

```python
from app.routers import auth, cases, criteria, alternatives, experts, comparisons, results

__all__ = ["auth", "cases", "criteria", "alternatives", "experts", "comparisons", "results"]
```

- [ ] **Step 2: Jalankan semua unit tests**

```bash
cd backend
pytest tests/ -v --tb=short
```

Expected: semua test PASS (minimal 16 tests dari Task 4 & 5)

- [ ] **Step 3: Jalankan server**

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

- [ ] **Step 4: Verifikasi Swagger docs**

Buka browser: `http://localhost:8000/docs`

Expected: Swagger UI dengan semua endpoint terdaftar (Auth, Cases, Criteria, Alternatives, Experts, Comparisons, Results)

- [ ] **Step 5: Test health endpoint**

```bash
curl http://localhost:8000/health
```

Expected: `{"status":"ok","version":"0.1.0"}`

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "feat: Think Decision backend v0.1.0 - AHP multi-expert platform complete"
```

---

## Catatan untuk Eksekusi di VS Code

1. **Buat `.env`** dari `.env.example` dan isi dengan credentials Supabase Anda sebelum Task 3
2. **Supabase project** harus sudah dibuat di [supabase.com](https://supabase.com) — ambil `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, dan `DATABASE_URL` dari Settings → Database
3. **Jalankan dari direktori `backend/`** — semua command `pytest`, `alembic`, dan `uvicorn` dijalankan dari sana
4. **Python 3.11+** diperlukan — cek dengan `python --version`
5. **Virtual environment** disarankan: `python -m venv .venv && .venv\Scripts\activate` (Windows)
