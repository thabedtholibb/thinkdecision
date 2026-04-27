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
