# Quick Start - API Examples

## Using cURL (Command Line)

### 1. Register User
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "creator@example.com",
    "password": "password123",
    "full_name": "John Doe",
    "role": "creator"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "creator@example.com",
    "password": "password123"
  }'
```

Save the `access_token` from response.

### 3. Create Case
```bash
TOKEN="your_access_token_here"

curl -X POST http://localhost:8000/cases \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pemilihan Supplier",
    "description": "Memilih supplier terbaik",
    "method": "AHP",
    "aggregation_method": "GMJ"
  }'
```

Save the `id` from response.

### 4. Add Criteria
```bash
TOKEN="your_token"
CASE_ID="case_id_from_previous_step"

curl -X POST http://localhost:8000/cases/$CASE_ID/criteria \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Harga",
    "description": "Harga penawaran",
    "order_index": 0
  }'
```

### 5. Add Another Criteria
```bash
curl -X POST http://localhost:8000/cases/$CASE_ID/criteria \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Kualitas",
    "description": "Kualitas produk",
    "order_index": 1
  }'
```

### 6. Add Alternative
```bash
curl -X POST http://localhost:8000/cases/$CASE_ID/alternatives \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Supplier A",
    "order_index": 0
  }'
```

### 7. Invite Expert
```bash
curl -X POST http://localhost:8000/cases/$CASE_ID/experts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "expert@example.com"
  }'
```

### 8. Expert Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "expert@example.com",
    "password": "password123"
  }'
```

### 9. Expert - Submit Comparison
```bash
EXPERT_TOKEN="expert_access_token"
CASE_ID="case_id"

curl -X POST http://localhost:8000/expert/cases/$CASE_ID/comparisons \
  -H "Authorization: Bearer $EXPERT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "node_type": "criteria",
    "parent_id": null,
    "value_matrix": [
      [1, 3],
      [0.333, 1]
    ]
  }'
```

### 10. Get Results
```bash
TOKEN="creator_token"
CASE_ID="case_id"

curl -X POST http://localhost:8000/cases/$CASE_ID/aggregate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

---

## Using JavaScript/Fetch

### 1. Register & Login
```javascript
async function registerUser() {
  const response = await fetch('http://localhost:8000/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'creator@example.com',
      password: 'password123',
      full_name: 'John Doe',
      role: 'creator'
    })
  });
  
  const data = await response.json();
  localStorage.setItem('token', data.access_token);
  return data;
}
```

### 2. Create Case with Helper Function
```javascript
async function createCase(title, description) {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:8000/cases', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title,
      description,
      method: 'AHP',
      aggregation_method: 'GMJ'
    })
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}
```

### 3. List Cases
```javascript
async function listCases() {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:8000/cases', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return await response.json();
}
```

### 4. Get Case with Criteria and Alternatives
```javascript
async function getCaseDetail(caseId) {
  const token = localStorage.getItem('token');
  
  const caseRes = await fetch(`http://localhost:8000/cases/${caseId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const caseData = await caseRes.json();
  
  const criteriaRes = await fetch(
    `http://localhost:8000/cases/${caseId}/criteria`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  const criteria = await criteriaRes.json();
  
  const altRes = await fetch(
    `http://localhost:8000/cases/${caseId}/alternatives`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  const alternatives = await altRes.json();
  
  return { caseData, criteria, alternatives };
}
```

### 5. Expert Submit Comparison
```javascript
async function submitComparison(caseId, matrix) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(
    `http://localhost:8000/expert/cases/${caseId}/comparisons`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        node_type: 'criteria',
        parent_id: null,
        value_matrix: matrix
      })
    }
  );
  
  const data = await response.json();
  
  // Check consistency
  if (data.cr > 0.1) {
    console.warn(`⚠️ Consistency Ratio: ${data.cr} (Threshold: 0.1)`);
    console.warn(`Please review your judgments - matrix may be inconsistent`);
  } else {
    console.log(`✓ Consistent (CR: ${data.cr})`);
  }
  
  return data;
}
```

### 6. Trigger Aggregation
```javascript
async function aggregateResults(caseId) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(
    `http://localhost:8000/cases/${caseId}/aggregate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  
  // Display ranking
  console.log('Ranking Results:');
  data.ranking.forEach(item => {
    console.log(`${item.rank}. ${item.alternative_label}: ${item.percentage}%`);
  });
  
  return data;
}
```

---

## Using React Hooks

### Custom Hook for API Calls
```javascript
import { useState, useCallback } from 'react';

function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const call = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      };
      
      const response = await fetch(
        `http://localhost:8000${endpoint}`,
        { ...options, headers }
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);
  
  return { call, loading, error };
}

// Usage:
function CasesList() {
  const { call, loading, error } = useApi();
  const [cases, setCases] = useState([]);
  
  useEffect(() => {
    call('/cases').then(setCases);
  }, [call]);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <ul>
      {cases.map(c => <li key={c.id}>{c.title}</li>)}
    </ul>
  );
}
```

---

## Testing Comparison Matrix

### Valid Matrix (Consistent)
```javascript
// 2x2 matrix - Symmetric comparisons
const matrix = [
  [1, 3],        // A vs B: A is 3x more important
  [1/3, 1]       // B vs A: B is 1/3 as important (reciprocal)
];

// Expected: CR < 0.1 (consistent)
// Priority vector: A=0.75, B=0.25
```

### Valid Matrix (3x3)
```javascript
// 3x3 matrix
const matrix = [
  [1, 3, 5],        // A: 3x better than B, 5x better than C
  [1/3, 1, 2],      // B: reciprocal of A-B, 2x better than C
  [1/5, 1/2, 1]     // C: reciprocals preserved
];

// Validation checks:
// ✓ Square (3x3)
// ✓ Diagonal = 1
// ✓ Reciprocal: matrix[0][1] * matrix[1][0] = 3 * (1/3) = 1
// ✓ All positive
```

### Invalid Matrix (Will be rejected)
```javascript
// Wrong - not reciprocal
const matrix = [
  [1, 3],
  [3, 1]  // Should be 1/3, not 3
];

// Wrong - diagonal not 1
const matrix = [
  [2, 3],  // Should be 1
  [1/3, 1]
];

// Wrong - not square
const matrix = [
  [1, 3, 5],
  [1/3, 1]  // Only 2 elements instead of 3
];
```

---

## Common Issues & Solutions

### Issue: "Invalid API key"
**Solution:** Verify token in localStorage, re-login if needed

### Issue: "Creator access required"
**Solution:** Current user is not a creator. Check user role and login with correct account.

### Issue: "Invalid matrix: reciprocal"
**Solution:** Ensure matrix[i][j] × matrix[j][i] = 1. If you put 3, put 1/3 in the opposite cell.

### Issue: "Case must have criteria and alternatives"
**Solution:** Before aggregating, ensure the case has:
- At least 2 criteria
- At least 2 alternatives
- All experts submitted comparisons

### Issue: "Not invited to this case"
**Solution:** Expert trying to access case they weren't invited to. Check ExpertInvites table.

---

**Version:** 0.1.0  
**Last Updated:** 2026-04-27
