# Graph Report - C:\Users\thabe\OneDrive\Dokumen\Code Project\thinkdecision  (2026-09-30)

## Corpus Check
- 38 files · ~60,496 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 556 nodes · 639 edges · 41 communities (35 shown, 6 thin omitted)
- Extraction: 74% EXTRACTED · 26% INFERRED · 0% AMBIGUOUS · INFERRED: 167 edges (avg confidence: 0.53)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Express App Wiring|Express App Wiring]]
- [[_COMMUNITY_Error Classes|Error Classes]]
- [[_COMMUNITY_Authenticated Routes|Authenticated Routes]]
- [[_COMMUNITY_Backend Dependencies|Backend Dependencies]]
- [[_COMMUNITY_Judgment Service|Judgment Service]]
- [[_COMMUNITY_Frontend Math Utils|Frontend Math Utils]]
- [[_COMMUNITY_API Documentation|API Documentation]]
- [[_COMMUNITY_Auth Service and Tokens|Auth Service and Tokens]]
- [[_COMMUNITY_Logging and Validation|Logging and Validation]]
- [[_COMMUNITY_Expert Routes and RBAC|Expert Routes and RBAC]]
- [[_COMMUNITY_Case Service|Case Service]]
- [[_COMMUNITY_AHP ANP Math Engine|AHP ANP Math Engine]]
- [[_COMMUNITY_API Client|API Client]]
- [[_COMMUNITY_Creator Screens|Creator Screens]]
- [[_COMMUNITY_Case Routes|Case Routes]]
- [[_COMMUNITY_Server Entry|Server Entry]]
- [[_COMMUNITY_Supabase and Audit|Supabase and Audit]]
- [[_COMMUNITY_Aggregation Cache|Aggregation Cache]]
- [[_COMMUNITY_Redis Cache|Redis Cache]]
- [[_COMMUNITY_App Global State|App Global State]]
- [[_COMMUNITY_Sanitization Service|Sanitization Service]]
- [[_COMMUNITY_Sanitization Middleware|Sanitization Middleware]]
- [[_COMMUNITY_Error Boundary|Error Boundary]]
- [[_COMMUNITY_Expert Screens|Expert Screens]]
- [[_COMMUNITY_Swagger Docs|Swagger Docs]]
- [[_COMMUNITY_Pagination Helpers|Pagination Helpers]]
- [[_COMMUNITY_Entry Page and Config|Entry Page and Config]]
- [[_COMMUNITY_Form Validation|Form Validation]]
- [[_COMMUNITY_Backend CI Workflow|Backend CI Workflow]]

## God Nodes (most connected - your core abstractions)
1. `Think Decision Root README` - 12 edges
2. `Think Decision Backend README` - 11 edges
3. `APIClient` - 9 edges
4. `/api/v1 Endpoint Namespace` - 8 edges
5. `updateCase()` - 6 edges
6. `scripts` - 5 edges
7. `ForbiddenError` - 5 edges
8. `generateAccessToken()` - 5 edges
9. `ErrorBoundary` - 5 edges
10. `useAppContext()` - 5 edges

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

## Communities (41 total, 6 thin omitted)

### Community 0 - "Express App Wiring"
Cohesion: 0.06
Nodes (37): analyticsRoutes, app, auditLogsRoutes, authRoutes, casesRoutes, cookieParser, cors, corsOptions (+29 more)

### Community 1 - "Error Classes"
Cohesion: 0.06
Nodes (29): { AppError }, DuplicateEmailError, ForbiddenError, InvalidCredentialsError, NotFoundError, TokenExpiredError, UnauthorizedError, asyncHandler (+21 more)

### Community 3 - "Authenticated Routes"
Cohesion: 0.06
Nodes (27): jwt, { UnauthorizedError, TokenExpiredError, InvalidTokenError }, authenticate, express, router, supabase, { AppError }, asyncHandler (+19 more)

### Community 4 - "Backend Dependencies"
Cohesion: 0.06
Nodes (32): dependencies, bcryptjs, cookie-parser, cors, dotenv, express, express-async-errors, express-rate-limit (+24 more)

### Community 5 - "Judgment Service"
Cohesion: 0.08
Nodes (22): MatrixValidationError, aggregationCacheService, ahpService, { AppError }, assertExpertCaseMembership(), { auditLog }, buildMatrix(), cacheService (+14 more)

### Community 6 - "Frontend Math Utils"
Cohesion: 0.09
Nodes (17): ahpCRfromMatrix(), ahpLambdaMax(), ahpPriorities(), ALL_CASES, calculateCRImpact(), EXPERT_INBOX, formatDeadlineMessage(), fuzzyPriorities() (+9 more)

### Community 7 - "API Documentation"
Cohesion: 0.10
Nodes (28): Analytics Endpoints (/api/v1/analytics), API_SPECIFICATION.md, app.js (Express Setup), Authentication Endpoints (/api/v1/auth), Cases Endpoints (/api/v1/cases), config/supabase.js (Database), Think Decision Backend README, Experts Endpoints (/api/v1/experts) (+20 more)

### Community 8 - "Auth Service and Tokens"
Cohesion: 0.11
Nodes (22): InvalidTokenError, authenticate, authService, express, router, bcrypt, crypto, {
  DuplicateEmailError,
  InvalidCredentialsError,
  InvalidTokenError,
} (+14 more)

### Community 9 - "Logging and Validation"
Cohesion: 0.08
Nodes (18): AppError, { errorLogger }, { apiLogger }, { AppError }, apiLogger, authLogger, cacheLogger, colors (+10 more)

### Community 10 - "Expert Routes and RBAC"
Cohesion: 0.08
Nodes (19): ExpertNotFoundError, { ForbiddenError }, requireRole(), asyncHandler, { auditLog }, authenticate, bcrypt, createExpertSchema (+11 more)

### Community 11 - "Case Service"
Cohesion: 0.11
Nodes (14): CaseNotFoundError, { AppError }, { auditLog }, cacheService, { CaseNotFoundError }, crypto, getCaseById(), insertAlternatives() (+6 more)

### Community 12 - "AHP ANP Math Engine"
Cohesion: 0.17
Nodes (13): buildSupermatrix(), calculateANPWeights(), calculateCR(), fuzzifyMatrix(), fuzzifyValue(), fuzzyPriorities(), getLambdaMax(), getPriorities() (+5 more)

### Community 13 - "API Client"
Cohesion: 0.16
Nodes (8): analyticsService, APIClient, authService, casesService, expertsService, judgmentsService, notificationsService, resultsService

### Community 15 - "Case Routes"
Cohesion: 0.15
Nodes (11): asyncHandler, authenticate, caseService, createCaseSchema, express, Joi, { parsePaginationParams, buildPaginationResponse }, router (+3 more)

### Community 16 - "Server Entry"
Cohesion: 0.18
Nodes (10): app, cacheService, express, { logger }, missingEnvVars, morgan, os, REQUIRED_ENV_VARS (+2 more)

### Community 17 - "Supabase and Audit"
Cohesion: 0.18
Nodes (5): { createClient }, supabase, ws, supabase, supabase

### Community 18 - "Aggregation Cache"
Cohesion: 0.24
Nodes (7): ahpService, cacheService, getAggregation(), getCacheKey, getIncrementalAggregation(), preCalculateAggregation(), supabase

### Community 19 - "Redis Cache"
Cohesion: 0.25
Nodes (4): del(), getCacheKeys, invalidatePattern(), redis

### Community 20 - "App Global State"
Cohesion: 0.39
Nodes (6): AppContext, useAppContext(), useAppUI(), useAuth(), useNotifications(), useTheme()

### Community 21 - "Sanitization Service"
Cohesion: 0.43
Nodes (6): sanitizeFields(), sanitizeObject(), sanitizeOptions, sanitizeText(), stripHtmlOptions, xss

### Community 23 - "Sanitization Middleware"
Cohesion: 0.47
Nodes (5): fieldsToSanitize, sanitizationMiddleware(), sanitizationService, sanitizeObject(), shouldSanitizeField()

### Community 26 - "Swagger Docs"
Cohesion: 0.50
Nodes (3): options, swaggerJsdoc, swaggerSpec

### Community 28 - "Entry Page and Config"
Cohesion: 0.50
Nodes (4): window.__APP_CONFIG__ API_URL override, DecideAI.html entry page, api-init.js API client, python http.server port 8000

## Knowledge Gaps
- **245 isolated node(s):** `name`, `version`, `description`, `main`, `start` (+240 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `InvalidTokenError` connect `Auth Service and Tokens` to `Error Classes`, `Authenticated Routes`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **Why does `ForbiddenError` connect `Error Classes` to `Expert Routes and RBAC`, `Judgment Service`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Think Decision Backend README` (e.g. with `Swagger API Documentation (/api/docs)` and `Backend Component (Node.js/Express + Supabase, port 3000)`) actually correct?**
  _`Think Decision Backend README` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `/api/v1 Endpoint Namespace` (e.g. with `Analytics Endpoints (/api/v1/analytics)` and `Authentication Endpoints (/api/v1/auth)`) actually correct?**
  _`/api/v1 Endpoint Namespace` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _245 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Express App Wiring` be split into smaller, more focused modules?**
  _Cohesion score 0.05512820512820513 - nodes in this community are weakly interconnected._
- **Should `Error Classes` be split into smaller, more focused modules?**
  _Cohesion score 0.05547652916073969 - nodes in this community are weakly interconnected._