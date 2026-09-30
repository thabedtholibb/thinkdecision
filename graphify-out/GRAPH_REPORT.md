# Graph Report - .  (2026-07-07)

## Corpus Check
- 76 files · ~61,529 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 582 nodes · 693 edges · 60 communities (43 shown, 17 thin omitted)
- Extraction: 75% EXTRACTED · 25% INFERRED · 0% AMBIGUOUS · INFERRED: 170 edges (avg confidence: 0.53)
- Token cost: 57,146 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Expert Judgment Dashboard UI|Expert Judgment Dashboard UI]]
- [[_COMMUNITY_Backend Package Config|Backend Package Config]]
- [[_COMMUNITY_Express App Route Registration|Express App Route Registration]]
- [[_COMMUNITY_API Route Handlers (analyticsauthcases)|API Route Handlers (analytics/auth/cases)]]
- [[_COMMUNITY_API Specification Docs|API Specification Docs]]
- [[_COMMUNITY_Results & AHP Computation Routes|Results & AHP Computation Routes]]
- [[_COMMUNITY_Frontend Bootstrap & App Context|Frontend Bootstrap & App Context]]
- [[_COMMUNITY_Custom Application Error Classes|Custom Application Error Classes]]
- [[_COMMUNITY_Request Logging|Request Logging]]
- [[_COMMUNITY_Frontend API Client|Frontend API Client]]
- [[_COMMUNITY_Creator Dashboard UI|Creator Dashboard UI]]
- [[_COMMUNITY_Transaction Wrapper & Case Service|Transaction Wrapper & Case Service]]
- [[_COMMUNITY_AHPANPFuzzy Calculation Engine|AHP/ANP/Fuzzy Calculation Engine]]
- [[_COMMUNITY_Pagination Middleware|Pagination Middleware]]
- [[_COMMUNITY_Auth Service (JWT & bcrypt)|Auth Service (JWT & bcrypt)]]
- [[_COMMUNITY_Input Sanitization|Input Sanitization]]
- [[_COMMUNITY_Auth Routes|Auth Routes]]
- [[_COMMUNITY_Judgment Routes|Judgment Routes]]
- [[_COMMUNITY_Judgment Service & Aggregation Cache|Judgment Service & Aggregation Cache]]
- [[_COMMUNITY_Async Handler & Audit Log Routes|Async Handler & Audit Log Routes]]
- [[_COMMUNITY_Server Bootstrap (server.js)|Server Bootstrap (server.js)]]
- [[_COMMUNITY_Supabase Client & Audit Service|Supabase Client & Audit Service]]
- [[_COMMUNITY_Error Handler & Validation Middleware|Error Handler & Validation Middleware]]
- [[_COMMUNITY_Frontend App Context Provider|Frontend App Context Provider]]
- [[_COMMUNITY_Frontend Error Message Utils|Frontend Error Message Utils]]
- [[_COMMUNITY_Rate Limiter Middleware (UNUSED  disconnected)|Rate Limiter Middleware (UNUSED / disconnected)]]
- [[_COMMUNITY_React Error Boundary|React Error Boundary]]
- [[_COMMUNITY_Analytics Route|Analytics Route]]
- [[_COMMUNITY_Notifications Route|Notifications Route]]
- [[_COMMUNITY_Users Route|Users Route]]
- [[_COMMUNITY_Authenticate Middleware|Authenticate Middleware]]
- [[_COMMUNITY_Saaty Reference Guide Component|Saaty Reference Guide Component]]
- [[_COMMUNITY_Matrix Difficulty Estimator Component|Matrix Difficulty Estimator Component]]
- [[_COMMUNITY_Form Validation Hook|Form Validation Hook]]
- [[_COMMUNITY_DatabaseError class|DatabaseError class]]
- [[_COMMUNITY_ExpertNotFoundError class|ExpertNotFoundError class]]
- [[_COMMUNITY_ForbiddenError class|ForbiddenError class]]
- [[_COMMUNITY_InconsistentDataError class|InconsistentDataError class]]
- [[_COMMUNITY_InternalServerError class|InternalServerError class]]
- [[_COMMUNITY_InvalidStateError class|InvalidStateError class]]
- [[_COMMUNITY_InvalidTokenError class|InvalidTokenError class]]
- [[_COMMUNITY_MatrixValidationError class|MatrixValidationError class]]
- [[_COMMUNITY_ServiceUnavailableError class|ServiceUnavailableError class]]
- [[_COMMUNITY_UnauthorizedError class|UnauthorizedError class]]
- [[_COMMUNITY_ValidationError class|ValidationError class]]

## God Nodes (most connected - your core abstractions)
1. `DecideAI.html (Frontend Entry Point)` - 23 edges
2. `Think Decision Root README` - 12 edges
3. `Think Decision Backend README` - 11 edges
4. `APIClient` - 9 edges
5. `APIClient` - 9 edges
6. `AppError` - 8 edges
7. `/api/v1 Endpoint Namespace` - 8 edges
8. `auditLog()` - 7 edges
9. `scripts` - 5 edges
10. `generateAccessToken()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Swagger API Documentation (/api/docs)` --semantically_similar_to--> `API_SPECIFICATION.md`  [INFERRED] [semantically similar]
  README.md → backend/README.md
- `Backend Component (Node.js/Express + Supabase, port 3000)` --references--> `Think Decision Backend README`  [INFERRED]
  README.md → backend/README.md
- `/api/v1 Endpoint Namespace` --conceptually_related_to--> `Analytics Endpoints (/api/v1/analytics)`  [INFERRED]
  README.md → backend/README.md
- `/api/v1 Endpoint Namespace` --conceptually_related_to--> `Authentication Endpoints (/api/v1/auth)`  [INFERRED]
  README.md → backend/README.md
- `/api/v1 Endpoint Namespace` --conceptually_related_to--> `Cases Endpoints (/api/v1/cases)`  [INFERRED]
  README.md → backend/README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Supported MCDM Methods (AHP, Fuzzy AHP, ANP, Fuzzy ANP)** — readme_ahp, readme_fuzzy_ahp, readme_anp, readme_fuzzy_anp [EXTRACTED 1.00]
- **Backend Request Handling Pipeline** — backend_readme_server_js, backend_readme_app_js, backend_readme_routes, backend_readme_services, backend_readme_config_supabase [EXTRACTED 1.00]
- **Frontend App Composition (Script Load Order)** — frontend_decideai_appcontext, frontend_decideai_utils, frontend_decideai_components, frontend_decideai_hooks, frontend_decideai_auth, frontend_decideai_creator, frontend_decideai_expert, frontend_decideai_app [EXTRACTED 1.00]

## Communities (60 total, 17 thin omitted)

### Community 1 - "Expert Judgment Dashboard UI"
Cohesion: 0.07
Nodes (19): EXPERT_NAV, ExpertFill(), ahpCRfromMatrix(), ahpLambdaMax(), ahpPriorities(), ALL_CASES, calculateCRImpact(), EXPERT_INBOX (+11 more)

### Community 2 - "Backend Package Config"
Cohesion: 0.06
Nodes (32): dependencies, bcryptjs, cookie-parser, cors, dotenv, express, express-async-errors, express-rate-limit (+24 more)

### Community 3 - "Express App Route Registration"
Cohesion: 0.06
Nodes (27): analyticsRoutes, app, auditLogsRoutes, authRoutes, casesRoutes, cookieParser, cors, corsOptions (+19 more)

### Community 4 - "API Route Handlers (analytics/auth/cases)"
Cohesion: 0.09
Nodes (8): analyticsService, authService, casesService, APIClient, expertsService, judgementsService, notificationsService, resultsService

### Community 5 - "API Specification Docs"
Cohesion: 0.11
Nodes (27): Analytics Endpoints (/api/v1/analytics), API_SPECIFICATION.md, app.js (Express Setup), Authentication Endpoints (/api/v1/auth), Cases Endpoints (/api/v1/cases), config/supabase.js (Database), Think Decision Backend README, Experts Endpoints (/api/v1/experts) (+19 more)

### Community 6 - "Results & AHP Computation Routes"
Cohesion: 0.08
Nodes (18): ahpService, asyncHandler, authenticate, cacheService, express, router, supabase, ahpService (+10 more)

### Community 7 - "Frontend Bootstrap & App Context"
Cohesion: 0.09
Nodes (24): src/api-init.js, src/app.jsx, src/context/AppContext.jsx, src/auth.jsx, Babel Standalone 7.29.0 (In-Browser JSX Transpiler), src/components.jsx, src/creator.jsx, DecideAI.html (Frontend Entry Point) (+16 more)

### Community 8 - "Custom Application Error Classes"
Cohesion: 0.09
Nodes (11): { AppError }, CaseNotFoundError, ConflictError, DuplicateEmailError, InvalidCredentialsError, InvalidInputError, JudgmentNotFoundError, NotFoundError (+3 more)

### Community 9 - "Request Logging"
Cohesion: 0.12
Nodes (13): { apiLogger }, apiLogger, cacheLogger, colors, DailyRotateFile, dbLogger, format, fs (+5 more)

### Community 10 - "Frontend API Client"
Cohesion: 0.16
Nodes (8): analyticsService, APIClient, authService, casesService, expertsService, judgmentsService, notificationsService, resultsService

### Community 12 - "Transaction Wrapper & Case Service"
Cohesion: 0.17
Nodes (11): supabase, withTransaction(), auditLog(), { AppError }, { auditLog }, createCase(), publishCase(), restoreCase() (+3 more)

### Community 13 - "AHP/ANP/Fuzzy Calculation Engine"
Cohesion: 0.19
Nodes (12): buildSupermatrix(), calculateANPWeights(), calculateCR(), fuzzifyMatrix(), fuzzifyValue(), fuzzyPriorities(), getLambdaMax(), getPriorities() (+4 more)

### Community 14 - "Pagination Middleware"
Cohesion: 0.16
Nodes (13): buildPaginationResponse(), paginationMiddleware(), parsePaginationParams(), asyncHandler, authenticate, caseService, createCaseSchema, express (+5 more)

### Community 15 - "Auth Service (JWT & bcrypt)"
Cohesion: 0.23
Nodes (12): bcrypt, {
  DuplicateEmailError,
  InvalidCredentialsError,
  InvalidTokenError,
  InternalServerError
}, generateAccessToken(), generateRefreshToken(), generateToken(), hashPassword(), jwt, loginCreator() (+4 more)

### Community 16 - "Input Sanitization"
Cohesion: 0.22
Nodes (11): fieldsToSanitize, sanitizationMiddleware(), sanitizationService, sanitizeObject(), shouldSanitizeField(), sanitizeFields(), sanitizeObject(), sanitizeOptions (+3 more)

### Community 17 - "Auth Routes"
Cohesion: 0.15
Nodes (12): { AppError }, asyncHandler, authenticate, { authLogger }, authService, express, Joi, loginSchema (+4 more)

### Community 18 - "Judgment Routes"
Cohesion: 0.17
Nodes (9): asyncHandler, authenticate, express, judgmentService, router, supabase, validationService, validateExpertJudgment() (+1 more)

### Community 19 - "Judgment Service & Aggregation Cache"
Cohesion: 0.20
Nodes (11): aggregationCacheService, ahpService, { auditLog }, buildMatrix(), cacheService, calculateAndStoreAggregatedResults(), notificationService, saveJudgment() (+3 more)

### Community 20 - "Async Handler & Audit Log Routes"
Cohesion: 0.20
Nodes (7): { AppError }, asyncHandler, { auditLogger }, authenticate, express, router, supabase

### Community 21 - "Server Bootstrap (server.js)"
Cohesion: 0.22
Nodes (8): app, cacheService, cors, express, morgan, os, startTime, supabase

### Community 22 - "Supabase Client & Audit Service"
Cohesion: 0.22
Nodes (5): { createClient }, supabase, ws, supabase, supabase

### Community 23 - "Error Handler & Validation Middleware"
Cohesion: 0.25
Nodes (4): AppError, { errorLogger }, { AppError }, errorLogger

### Community 24 - "Frontend App Context Provider"
Cohesion: 0.39
Nodes (6): AppContext, useAppContext(), useAppUI(), useAuth(), useNotifications(), useTheme()

### Community 26 - "Frontend Error Message Utils"
Cohesion: 0.33
Nodes (4): ERROR_CODE_MAP, formatErrorForUser(), getErrorMessage(), MESSAGES

### Community 27 - "Rate Limiter Middleware (UNUSED / disconnected)"
Cohesion: 0.33
Nodes (5): adminLimiter, authenticatedLimiter, loginLimiter, publicLimiter, rateLimit

### Community 29 - "Analytics Route"
Cohesion: 0.40
Nodes (4): authenticate, express, router, supabase

### Community 30 - "Notifications Route"
Cohesion: 0.40
Nodes (4): authenticate, express, router, supabase

### Community 31 - "Users Route"
Cohesion: 0.40
Nodes (4): authenticate, authService, express, router

## Knowledge Gaps
- **222 isolated node(s):** `name`, `version`, `description`, `main`, `start` (+217 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AppError` connect `Error Handler & Validation Middleware` to `Authenticate Middleware`, `Custom Application Error Classes`, `Transaction Wrapper & Case Service`, `Auth Routes`, `Async Handler & Audit Log Routes`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `Think Decision Root README` connect `API Specification Docs` to `Frontend Bootstrap & App Context`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Think Decision Backend README` (e.g. with `Swagger API Documentation (/api/docs)` and `Backend Component (Node.js/Express + Supabase, port 3000)`) actually correct?**
  _`Think Decision Backend README` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _223 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Shared UI Component Library` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `Expert Judgment Dashboard UI` be split into smaller, more focused modules?**
  _Cohesion score 0.06890756302521009 - nodes in this community are weakly interconnected._
- **Should `Backend Package Config` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._