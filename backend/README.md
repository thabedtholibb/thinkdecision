# Think Decision - Backend API

Decision Support System Backend with Node.js/Express and Supabase

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd "C:\Apps\Think Decision\backend"
npm install
```

### Environment Setup

The `.env` file is already configured with your Supabase credentials.

### Start Development Server

```bash
npm run dev
```

Server will run on `http://localhost:3000`

### Test Health Endpoint

```bash
curl http://localhost:3000/health
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register creator
- `POST /api/v1/auth/login/creator` - Login creator
- `POST /api/v1/auth/login/expert` - Login expert
- `POST /api/v1/auth/logout` - Logout

### Cases
- `POST /api/v1/cases` - Create case
- `GET /api/v1/cases` - Get all cases
- `GET /api/v1/cases/:caseId` - Get case detail
- `POST /api/v1/cases/:caseId/publish` - Publish case

### Experts
- `GET /api/v1/experts/dashboard` - Expert dashboard

### Judgments
- `POST /api/v1/cases/:caseId/judgments/:levelId` - Save judgment
- `POST /api/v1/cases/:caseId/:expertId/submit` - Submit judgments

### Results
- `GET /api/v1/cases/:caseId/results` - Get aggregated results

### Notifications
- `GET /api/v1/notifications` - Get notifications
- `PATCH /api/v1/notifications/:id` - Mark as read
- `POST /api/v1/notifications/mark-all-read` - Mark all as read

### Analytics
- `GET /api/v1/analytics/dashboard` - Creator analytics

## Database

Connected to Supabase with 11 tables:
- users
- cases
- goals
- criteria
- alternatives
- case_experts
- dependencies
- judgments
- consistency_ratios
- aggregated_results
- notifications

## Architecture

```
server.js (Entry point)
  ↓
app.js (Express setup)
  ↓
routes/ (API endpoints)
  ↓
services/ (Business logic)
  ↓
config/supabase.js (Database)
```

## Testing

```bash
npm test
```

## Deployment

Set environment variables on production:
- `NODE_ENV=production`
- `PORT=3000`
- `SUPABASE_URL` - Your Supabase URL
- `SUPABASE_SERVICE_KEY` - Your service key
- `JWT_SECRET` - Generate a strong secret
- `CORS_ORIGIN` - Your frontend URL

## Support

Refer to `API_SPECIFICATION.md` for complete API documentation.
