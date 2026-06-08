# API Response Format Standard

## Overview
All API services follow a **consistent normalized response format** to ensure predictable data handling across the frontend and backend.

---

## Normalized Response Format

Every API response has the following structure:

```typescript
{
  success: boolean,           // true if status 2xx, false otherwise
  data: any | null,          // The actual response payload (array, object, null)
  message?: string,          // Optional success/error message
  error?: {                  // Optional error details
    code: string,
    message: string,
    details?: any
  }
}
```

### Example Responses

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "case-123",
    "name": "Project Selection",
    "status": "active"
  },
  "message": "Case retrieved successfully"
}
```

**Array Response:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Case 1" },
    { "id": 2, "name": "Case 2" }
  ]
}
```

**Error Response:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "CASE_NOT_FOUND",
    "message": "The requested case does not exist"
  }
}
```

---

## Service Method Conventions

All service methods return the **full normalized response object**, not just the `.data` property:

### ✓ CORRECT - Return full response
```javascript
// src/api-init.js
async getCases(filters = {}) {
  const response = await apiClient.get('/cases', filters);
  return response;  // Return { success, data, message?, error? }
}
```

### ✗ WRONG - Return only .data
```javascript
// INCORRECT - don't do this
async getCases(filters = {}) {
  const response = await apiClient.get('/cases', filters);
  return response.data;  // Loses success, error info
}
```

---

## Using API Services in Components

### In Hooks
Extract `.data` from the normalized response:

```javascript
// src/hooks/useCases.js
const fetchCases = useCallback(async () => {
  try {
    const response = await casesService.getCases(filters);
    const data = response.data || [];  // Extract data
    setCases(Array.isArray(data) ? data : []);
    
    // Can also check: if (!response.success) { ... }
    if (!response.success) {
      setError(response.error?.message || 'Unknown error');
    }
  } catch (err) {
    setError(err.message);
  }
}, [filters]);
```

### In Components
Components using hooks don't see the normalized response (hooks handle it):

```javascript
// src/creator.jsx
const { cases, loading, error } = useCases();

return (
  <div>
    {cases.map(c => <CaseCard key={c.id} case={c} />)}
  </div>
);
```

### In Direct Component Calls (No Hook)
Extract `.data` from the response:

```javascript
// src/creator.jsx - Results fetching
const response = await casesService.getResults(caseId);
const results = response.data;  // Extract the payload
const isSuccess = response.success;  // Check status
const errorMsg = response.error?.message;  // Get error if needed
```

---

## List of API Services & Response Handling

| Service | Method | Returns | Usage |
|---------|--------|---------|-------|
| authService | loginCreator() | `{ success, data: {user, token}, ...}` | Use `response.data.token` |
| authService | getMe() | `{ success, data: {user}, ...}` | Use `response.data` |
| casesService | getCases() | `{ success, data: [{...}], ...}` | Use `response.data` (array) |
| casesService | getCaseById() | `{ success, data: {...}, ...}` | Use `response.data` |
| casesService | getResults() | `{ success, data: {...}, ...}` | Use `response.data` |
| casesService | getDiscrepancy() | `{ success, data: {...}, ...}` | Use `response.data` |
| expertsService | getExpertDashboard() | `{ success, data: {...}, ...}` | Use `response.data` |
| judgmentsService | saveDraft() | `{ success, data: {...}, ...}` | Use `response.data` |
| notificationsService | getNotifications() | `{ success, data: [{...}], ...}` | Use `response.data` (array) |
| notificationsService | markAllAsRead() | `{ success, data: {...}, ...}` | Use `response.success` to check |
| analyticsService | getCreatorAnalytics() | `{ success, data: {...}, ...}` | Use `response.data` |

---

## Error Handling Pattern

### Standard Pattern
```javascript
try {
  const response = await apiService.someMethod();
  
  // Always check success status
  if (!response.success) {
    const errorMsg = response.error?.message || 'Unknown error';
    console.error(errorMsg);
    setError(errorMsg);
    return;
  }
  
  // Use the data
  const data = response.data;
  setState(data);
  
} catch (err) {
  // Network/parsing errors
  console.error('Request failed:', err.message);
  setError(err.message);
}
```

### With Error Details
```javascript
if (!response.success) {
  const { code, message, details } = response.error || {};
  
  // Handle specific errors
  if (code === 'CASE_NOT_FOUND') {
    // Navigate to 404
  } else if (code === 'UNAUTHORIZED') {
    // Redirect to login
  }
  
  console.error(`[${code}] ${message}`, details);
}
```

---

## Migration Guide

If you find code that doesn't follow this pattern:

### Before (Incorrect)
```javascript
const data = await casesService.getCases();  // Was returning .data directly
const cases = data;  // data is array, but we lost success/error info
```

### After (Correct)
```javascript
const response = await casesService.getCases();  // Returns full response
const cases = response.data || [];  // Extract array from .data
if (!response.success) {
  // Handle error properly
}
```

---

## Backend Response Format

Backend should return responses in this normalized format. The `APIClient.normalizeResponse()` method in `src/api-init.js` handles transformation, but backend should ideally return:

```json
{
  "success": true/false,
  "data": { ... },
  "message": "...",
  "error": { "code": "...", "message": "..." }
}
```

Or at minimum, include a `data` wrapper:
```json
{
  "data": { ... }
}
```

The normalizeResponse() will wrap it correctly.

---

## Checklist for New API Endpoints

When adding a new API endpoint:

- [ ] Backend returns response with `data` property (or will be normalized)
- [ ] Service method in `api-init.js` returns `response` (full normalized object)
- [ ] Hook (if created) extracts `response.data`
- [ ] Component extraction code checks `response.success` if needed
- [ ] Error handling includes `response.error?.message`
- [ ] Documentation added to this file

---

**Last Updated**: 2026-06-08
**Status**: Complete and enforced across codebase
