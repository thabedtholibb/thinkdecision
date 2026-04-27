# Frontend Integration Checklist

## Setup Phase

- [ ] **Environment Configuration**
  - [ ] API Base URL set in environment file
  - [ ] Development: `http://localhost:8000`
  - [ ] Production: `https://your-domain.com`

- [ ] **Dependencies Installed**
  - [ ] HTTP client library (fetch/axios/httpx)
  - [ ] State management (Redux/Context/Zustand)
  - [ ] Authentication storage (localStorage/sessionStorage)

- [ ] **CORS Configured**
  - [ ] Backend CORS allows frontend origin
  - [ ] Check CORS_ORIGINS in backend `.env`

---

## Authentication Implementation

- [ ] **Register Page**
  - [ ] Form fields: email, password, full_name, role (dropdown)
  - [ ] POST to `/auth/register`
  - [ ] Save token: `localStorage.setItem('token', response.access_token)`
  - [ ] Redirect to login or dashboard
  - [ ] Show error messages on failure

- [ ] **Login Page**
  - [ ] Form fields: email, password
  - [ ] POST to `/auth/login`
  - [ ] Save token to localStorage
  - [ ] Redirect to dashboard
  - [ ] Handle "Invalid email or password" error

- [ ] **Token Management**
  - [ ] Retrieve token from localStorage on app start
  - [ ] Include token in all API requests: `Authorization: Bearer {token}`
  - [ ] Handle 401 Unauthorized: redirect to login, clear localStorage

- [ ] **User Profile**
  - [ ] GET `/auth/me` on app load
  - [ ] Display user name and role
  - [ ] Logout button: clear localStorage and redirect

---

## Dashboard - Creator View

- [ ] **Cases List Page**
  - [ ] GET `/cases` to load cases
  - [ ] Display: title, status, created_at, method
  - [ ] Button to create new case
  - [ ] Button to open each case
  - [ ] Filter by status (draft/active/closed)

- [ ] **Create Case Dialog/Page**
  - [ ] Form fields: title, description, method (dropdown), aggregation_method (dropdown)
  - [ ] POST to `/cases`
  - [ ] Methods: AHP, ANP, FUZZY_AHP, FUZZY_ANP
  - [ ] Aggregation: GMJ, GMP
  - [ ] Redirect to case editor on success

- [ ] **Case Editor Page**
  - [ ] Display case details (title, description, status)
  - [ ] Button to update case
  - [ ] Button to change status (draft → active → closed)
  - [ ] Tabs for: Criteria, Alternatives, Experts, Progress, Results

---

## Criteria Management

- [ ] **Criteria Tab**
  - [ ] GET `/cases/{case_id}/criteria` to load hierarchical structure
  - [ ] Display as tree view (root criteria with children)
  - [ ] Button to add root criteria
  - [ ] Each criteria can expand/collapse to show children
  - [ ] Button to add sub-criteria (with parent_id)
  - [ ] Edit criteria: PATCH `/criteria/{criteria_id}`
  - [ ] Delete criteria: DELETE `/criteria/{criteria_id}`
  - [ ] Drag-to-reorder with order_index updates

**UI Example:**
```
├─ Harga (order_index: 0)
│  ├─ Harga per unit
│  └─ Biaya pengiriman
└─ Kualitas (order_index: 1)
   ├─ Durabilitas
   └─ Akurasi
```

---

## Alternatives Management

- [ ] **Alternatives Tab**
  - [ ] GET `/cases/{case_id}/alternatives` to load
  - [ ] Display as list/cards
  - [ ] Button to add alternative
  - [ ] Edit alternative: PATCH `/alternatives/{alt_id}`
  - [ ] Delete alternative: DELETE `/alternatives/{alt_id}`
  - [ ] Reorder with order_index
  - [ ] Show count: "3 alternatives"

---

## Expert Management

- [ ] **Experts Tab**
  - [ ] GET `/cases/{case_id}/experts` to load with progress
  - [ ] Display per expert:
    - [ ] Email, Full Name
    - [ ] Status (pending/accepted/completed)
    - [ ] Progress bar: comparisons_submitted / comparisons_required
    - [ ] Progress percent
    - [ ] Invited date, Accepted date
  - [ ] Input to invite new expert by email
  - [ ] POST to `/cases/{case_id}/experts`
  - [ ] Button to remove pending invites
  - [ ] Show "No experts invited" message when empty

**UI Example:**
```
Expert 1 (expert1@example.com)
├─ Status: Accepted ✓
├─ Progress: 3/4 comparisons (75%)
└─ [Remove] button

Expert 2 (expert2@example.com)
├─ Status: Pending ⏳
├─ Progress: 0/4 comparisons (0%)
└─ [Remove] button
```

---

## Expert Interface - Comparison Submission

- [ ] **Expert Case List**
  - [ ] GET `/expert/cases` to show assigned cases
  - [ ] Display: case title, status, method
  - [ ] Click to open case comparison interface

- [ ] **Expert Case Detail**
  - [ ] GET `/expert/cases/{case_id}` to load structure
  - [ ] Display: case name, criteria tree, alternatives
  - [ ] Show submitted comparisons

- [ ] **Comparison Interface**
  - [ ] Display current matrix to compare
  - [ ] Render pairwise comparison UI:
    - [ ] Row/Column labels (criteria or alternatives)
    - [ ] Matrix input (9-point Saaty scale is standard)
    - [ ] Reciprocal values auto-fill (if A=3, then B=1/3)
  - [ ] Submit button: POST to `/expert/cases/{case_id}/comparisons`
  - [ ] Display result:
    - [ ] Priority vector
    - [ ] Consistency Ratio (CR)
    - [ ] ⚠️ Warning if CR > 0.1 (inconsistent)
    - [ ] ✓ Success if CR ≤ 0.1 (consistent)
  - [ ] Show all submitted comparisons
  - [ ] Allow update/resubmit comparison

**Comparison Checklist:**
```
Comparing Criteria (Level 1)
┌─────────────────────────────┐
│        Harga | Kualitas    │
├─────────────────────────────┤
│ Harga  [1]  [3]            │
│ Kualitas [0.33] [1]        │
└─────────────────────────────┘
Priority Vector: Harga=0.75, Kualitas=0.25
Consistency Ratio: 0.0 ✓
```

---

## Results & Aggregation

- [ ] **Progress Tab (Creator)**
  - [ ] GET `/cases/{case_id}/progress`
  - [ ] Display:
    - [ ] Total experts: 3
    - [ ] Completed: 1
    - [ ] Accepted: 1
    - [ ] Pending: 1
    - [ ] Completion %: 33.3%
  - [ ] Show timeline/status
  - [ ] **Aggregate Button** (only if all required comparisons submitted)

- [ ] **Results Tab**
  - [ ] POST to `/cases/{case_id}/aggregate` (trigger calculation)
  - [ ] Display ranking table:
    - [ ] Rank (1, 2, 3, ...)
    - [ ] Alternative name
    - [ ] Global weight (decimal)
    - [ ] Percentage (%)
    - [ ] Visual bar chart
  - [ ] Display criteria weights
  - [ ] Show aggregation method used (GMJ/GMP)
  - [ ] Show number of experts included
  - [ ] Show timestamp (computed_at)
  - [ ] Export ranking (CSV/PDF)

**Results Display:**
```
Ranking Results
┌───────────────────────────────────┐
│ Rank │ Alternative │ Score │ % │
├───────────────────────────────────┤
│ 1    │ Supplier A  │ 0.604 │ 60.4% ████████
│ 2    │ Supplier B  │ 0.286 │ 28.6% ███
│ 3    │ Supplier C  │ 0.110 │ 11.0% █
└───────────────────────────────────┘

Aggregation Method: GMJ
Experts Included: 3
Computed: 2026-04-27 10:40:00
```

---

## Error Handling

- [ ] **HTTP Errors**
  - [ ] 400 Bad Request: Show field-specific errors
  - [ ] 401 Unauthorized: Redirect to login
  - [ ] 403 Forbidden: Show "Access Denied"
  - [ ] 404 Not Found: Show "Not Found"
  - [ ] 422 Unprocessable Entity: Show validation errors

- [ ] **Network Errors**
  - [ ] Show "Network error - check connection"
  - [ ] Retry button for failed requests
  - [ ] Timeout handling (> 30s)

- [ ] **Specific Validations**
  - [ ] Matrix reciprocal validation message
  - [ ] Consistency ratio warning (CR > 0.1)
  - [ ] "Cannot submit - case not ready" if missing data
  - [ ] "Case is closed" if trying to edit closed case

---

## Performance Optimization

- [ ] **Caching**
  - [ ] Cache current case data to reduce API calls
  - [ ] Cache criteria/alternatives (only refresh on update)
  - [ ] Don't cache expert progress (refresh on each view)

- [ ] **Lazy Loading**
  - [ ] Load criteria tree on demand
  - [ ] Load alternatives only when tab clicked
  - [ ] Load expert progress only when tab clicked

- [ ] **Request Deduplication**
  - [ ] Don't make duplicate `/cases/{case_id}` calls
  - [ ] Batch related requests where possible

- [ ] **UI Responsiveness**
  - [ ] Show loading spinners during API calls
  - [ ] Disable buttons while request pending
  - [ ] Show skeleton loaders for better UX

---

## Security

- [ ] **Token Security**
  - [ ] Store token in localStorage (or httpOnly cookie if possible)
  - [ ] Clear token on logout
  - [ ] Don't log or expose token in console
  - [ ] Refresh token implementation (if needed)

- [ ] **Input Validation**
  - [ ] Validate email format before submission
  - [ ] Validate matrix values (numeric, positive)
  - [ ] Sanitize user input before display

- [ ] **HTTPS**
  - [ ] Use HTTPS in production
  - [ ] Set secure cookie flag
  - [ ] Set SameSite cookie attribute

---

## Testing

- [ ] **Unit Tests**
  - [ ] API helper functions
  - [ ] Matrix validation logic
  - [ ] Token storage/retrieval

- [ ] **Integration Tests**
  - [ ] Complete register → login flow
  - [ ] Case creation → add criteria → add alternatives
  - [ ] Expert invitation → comparison submission
  - [ ] Aggregation → results display

- [ ] **Manual Testing**
  - [ ] Test with Swagger UI docs
  - [ ] Test all error scenarios
  - [ ] Test on mobile devices
  - [ ] Test with different browsers

---

## API Documentation for Developers

- [ ] **Keep API Reference Handy**
  - [ ] Bookmark: `http://localhost:8000/docs` (Swagger)
  - [ ] Reference: `API_INTEGRATION_GUIDE.md`
  - [ ] Examples: `QUICK_START_EXAMPLES.md`

- [ ] **Common Endpoints Mapped**
  ```
  Auth:
  POST /auth/register
  POST /auth/login
  GET /auth/me
  
  Cases:
  POST /cases, GET /cases, GET /cases/{id}, PATCH /cases/{id}
  
  Structure:
  POST /cases/{case_id}/criteria
  POST /cases/{case_id}/alternatives
  
  Experts:
  POST /cases/{case_id}/experts
  GET /cases/{case_id}/experts
  
  Expert Work:
  POST /expert/cases/{case_id}/comparisons
  
  Results:
  POST /cases/{case_id}/aggregate
  GET /cases/{case_id}/results
  ```

---

## Deployment Checklist

- [ ] **Environment Variables**
  - [ ] API_BASE_URL set to production domain
  - [ ] Ensure HTTPS enabled

- [ ] **Build & Minify**
  - [ ] Production build created
  - [ ] Bundle size optimized
  - [ ] No console.log statements in production

- [ ] **Testing**
  - [ ] Smoke test all main flows
  - [ ] Test with production database
  - [ ] Performance test (load time, response time)

- [ ] **Monitoring**
  - [ ] Error logging setup (Sentry, LogRocket, etc.)
  - [ ] API monitoring for uptime
  - [ ] User analytics

---

## Post-Launch

- [ ] **User Documentation**
  - [ ] User guide for creators
  - [ ] User guide for experts
  - [ ] FAQ section

- [ ] **Support**
  - [ ] Support email configured
  - [ ] Bug reporting mechanism
  - [ ] Feature request channel

---

**Version:** 0.1.0  
**Last Updated:** 2026-04-27  
**Status:** Ready for Frontend Development
