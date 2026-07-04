"""
ANP (Analytic Network Process) API Routes

Endpoints for managing network dependencies, computing ANP results,
and comparing ANP vs AHP outcomes.

Routes:
- GET    /cases/{case_id}/dependencies - List all dependencies
- POST   /cases/{case_id}/dependencies - Create dependency
- DELETE /cases/{case_id}/dependencies/{source}/{target} - Remove dependency
- GET    /cases/{case_id}/validate-network - Validate network structure
- POST   /cases/{case_id}/compute-anp - Trigger ANP computation
- GET    /cases/{case_id}/comparison/ahp-vs-anp - Compare results
"""

from fastapi import APIRouter, HTTPException, Depends, Path
from typing import List, Dict, Optional
from pydantic import BaseModel, Field
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cases", tags=["anp"])


# ===========================
# REQUEST/RESPONSE MODELS
# ===========================

class DependencyCreate(BaseModel):
    """Create a new dependency between criteria"""
    source_id: str = Field(..., description="Source criterion ID")
    target_id: str = Field(..., description="Target criterion ID")
    feedback_type: str = Field(default="moderate", description="strong|moderate|weak")


class DependencyResponse(BaseModel):
    """Dependency details"""
    id: str
    case_id: str
    source_id: str
    target_id: str
    feedback_type: str
    created_at: str


class NetworkValidationResponse(BaseModel):
    """Network structure validation result"""
    is_valid: bool
    message: str
    has_cycles: bool
    node_count: int
    edge_count: int
    warnings: List[str] = []


class AnpComputeRequest(BaseModel):
    """Request to compute ANP"""
    force_recompute: bool = Field(default=False, description="Force recalculation even if cached")


class AnpComputeResponse(BaseModel):
    """ANP computation result"""
    case_id: str
    method: str
    status: str  # 'success' | 'error'
    message: str
    anp_weights: Optional[Dict[str, float]] = None
    convergence_iterations: Optional[int] = None
    convergence_achieved: bool = False
    computation_time_ms: float
    error_details: Optional[str] = None


class AnpVsAhpComparison(BaseModel):
    """Comparison between ANP and AHP results"""
    alternative_id: str
    ahp_weight: float
    anp_weight: float
    difference: float
    difference_percent: float
    rank_change: Optional[int]  # Positive if ANP rank higher


class AnpVsAhpResponse(BaseModel):
    """Full AHP vs ANP comparison"""
    case_id: str
    comparison: List[AnpVsAhpComparison]
    summary: Dict = {
        "max_difference": float,
        "avg_difference": float,
        "alternatives_with_rank_change": int,
        "most_affected_alternative": str,
        "most_affected_difference": float
    }


# ===========================
# HELPER FUNCTIONS
# ===========================

def get_case_or_404(case_id: str):
    """Get case from database or raise 404"""
    # TODO: Implement with database
    # For now, placeholder
    return {"id": case_id}


def validate_case_ownership(case_id: str, current_user):
    """Validate that user owns the case"""
    # TODO: Implement with authentication
    return True


# ===========================
# ENDPOINTS
# ===========================

@router.get("/{case_id}/dependencies", response_model=List[DependencyResponse])
async def list_dependencies(
    case_id: str = Path(..., description="Case ID")
):
    """
    List all criteria dependencies for a case.

    Returns network structure showing which criteria influence others.
    Used for building ANP supermatrix.

    Args:
        case_id: UUID of the case

    Returns:
        List of dependencies with source, target, and feedback type
    """
    try:
        case = get_case_or_404(case_id)

        # TODO: Fetch from database
        # SELECT * FROM criteria_dependencies WHERE case_id = case_id

        dependencies = []  # Placeholder

        logger.info(f"Listed {len(dependencies)} dependencies for case {case_id}")
        return dependencies

    except Exception as e:
        logger.error(f"Error listing dependencies: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{case_id}/dependencies", response_model=DependencyResponse)
async def create_dependency(
    case_id: str = Path(..., description="Case ID"),
    body: DependencyCreate = None
):
    """
    Create a new dependency between two criteria.

    Defines that criterion A influences criterion B in the ANP network.
    This establishes the network feedback loop structure.

    Args:
        case_id: UUID of the case
        body: Source and target criterion IDs

    Returns:
        Created dependency object

    Raises:
        400: If source == target (self-loop)
        404: If either criterion doesn't exist
        409: If dependency already exists
    """
    try:
        case = get_case_or_404(case_id)

        if body.source_id == body.target_id:
            raise HTTPException(
                status_code=400,
                detail="Source and target must be different (no self-loops)"
            )

        # TODO: Validate criteria exist in this case
        # TODO: Insert into database

        dependency = DependencyResponse(
            id=str(uuid.uuid4()),
            case_id=case_id,
            source_id=body.source_id,
            target_id=body.target_id,
            feedback_type=body.feedback_type,
            created_at=datetime.utcnow().isoformat()
        )

        # TODO: Insert and return created object

        logger.info(f"Created dependency {body.source_id} → {body.target_id}")
        return dependency

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating dependency: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{case_id}/dependencies/{source_id}/{target_id}")
async def delete_dependency(
    case_id: str = Path(..., description="Case ID"),
    source_id: str = Path(..., description="Source criterion ID"),
    target_id: str = Path(..., description="Target criterion ID")
):
    """
    Delete a dependency between two criteria.

    Removes a relationship from the ANP network. Automatically triggers
    network revalidation.

    Args:
        case_id: UUID of the case
        source_id: Source criterion ID
        target_id: Target criterion ID

    Returns:
        Success message

    Raises:
        404: If dependency doesn't exist
    """
    try:
        case = get_case_or_404(case_id)

        # TODO: DELETE FROM criteria_dependencies WHERE case_id AND source_id AND target_id

        logger.info(f"Deleted dependency {source_id} → {target_id}")

        return {"status": "success", "message": "Dependency deleted"}

    except Exception as e:
        logger.error(f"Error deleting dependency: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{case_id}/validate-network", response_model=NetworkValidationResponse)
async def validate_network_structure(
    case_id: str = Path(..., description="Case ID")
):
    """
    Validate ANP network structure for computational feasibility.

    Checks:
    - No cycles (ANP should be acyclic for convergence)
    - No self-loops
    - Proper dependency definitions
    - Network connectivity

    Args:
        case_id: UUID of the case

    Returns:
        Validation result with is_valid, message, and optional warnings

    Raises:
        404: If case not found
    """
    try:
        from app.core.ahp.anp import build_dependency_graph, validate_network

        case = get_case_or_404(case_id)

        # TODO: Fetch dependencies from database
        dependencies = []  # Placeholder: [(source, target), ...]

        # Build graph
        graph = build_dependency_graph(dependencies)

        # Validate
        is_valid, message = validate_network(graph)

        # Build response
        response = NetworkValidationResponse(
            is_valid=is_valid,
            message=message,
            has_cycles=graph['has_cycles'],
            node_count=len(graph['node_order']),
            edge_count=len(dependencies),
            warnings=[]
        )

        # Add warnings for non-critical issues
        if len(graph['node_order']) < 2:
            response.warnings.append("Network has very few criteria - may be redundant with AHP")

        # Check for disconnected components
        # (valid but may indicate incomplete definition)

        logger.info(f"Network validation: {is_valid}, {message}")
        return response

    except Exception as e:
        logger.error(f"Error validating network: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{case_id}/compute-anp", response_model=AnpComputeResponse)
async def compute_anp(
    case_id: str = Path(..., description="Case ID"),
    body: AnpComputeRequest = None
):
    """
    Trigger ANP computation for a case.

    Builds supermatrix from all pairwise comparisons and network dependencies,
    then iterates to compute limit matrix. Extracts final priorities for alternatives.

    Prerequisites:
    - All criteria pairwise comparisons completed
    - Network dependencies defined (if using ANP)
    - Expert agreement analysis completed

    Args:
        case_id: UUID of the case
        body: Computation options (force_recompute)

    Returns:
        Computation result with weights, convergence info, and timing

    Raises:
        400: If case incomplete (missing comparisons)
        409: If network has cycles
        503: If computation fails
    """
    import time
    from app.core.ahp.anp import (
        build_dependency_graph,
        assemble_supermatrix,
        compute_limit_matrix,
        extract_anp_priorities,
        validate_network
    )

    try:
        start_time = time.time()
        case = get_case_or_404(case_id)

        # TODO: Check if case is ready for ANP
        # - All experts submitted
        # - All comparisons available
        # - Aggregation complete

        # TODO: Fetch:
        # - criteria (list)
        # - alternatives (list)
        # - aggregated comparisons (dict of matrices)
        # - dependencies (list of tuples)

        criteria = []  # Placeholder
        alternatives = []  # Placeholder
        comparisons = {}  # Placeholder
        dependencies = []  # Placeholder

        # Validate network
        graph = build_dependency_graph(dependencies)
        is_valid, message = validate_network(graph)
        if not is_valid:
            raise HTTPException(status_code=409, detail=f"Invalid network: {message}")

        # Build element list
        elements = []
        for crit in criteria:
            elements.append({'id': crit['id'], 'type': 'criterion'})
        for alt in alternatives:
            elements.append({'id': alt['id'], 'type': 'alternative'})

        # Convert comparisons to priority vectors
        comparisons_by_pair = {}
        for (source_id, target_id), matrix in comparisons.items():
            # TODO: Compute eigenvector priority
            # comparisons_by_pair[(source_id, target_id)] = compute_priority_eigenvector(matrix)
            pass

        # Assemble supermatrix
        supermatrix = assemble_supermatrix(elements, comparisons_by_pair, dependencies)

        # Compute limit matrix
        limit_matrix, iterations, converged, residual = compute_limit_matrix(supermatrix)

        # Extract priorities
        alt_indices = [i for i, elem in enumerate(elements) if elem['type'] == 'alternative']
        anp_weights = extract_anp_priorities(limit_matrix, elements, alt_indices)

        # TODO: Save to database
        # INSERT INTO aggregated_results (anp_weights, anp_limit_matrix, convergence_iterations, ...)

        elapsed_ms = (time.time() - start_time) * 1000

        response = AnpComputeResponse(
            case_id=case_id,
            method="ANP",
            status="success",
            message="ANP computation completed successfully",
            anp_weights=anp_weights,
            convergence_iterations=iterations,
            convergence_achieved=converged,
            computation_time_ms=elapsed_ms
        )

        logger.info(f"ANP computation successful: {iterations} iterations, converged={converged}")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error computing ANP: {e}")
        elapsed_ms = (time.time() - start_time) * 1000
        raise HTTPException(
            status_code=503,
            detail=AnpComputeResponse(
                case_id=case_id,
                method="ANP",
                status="error",
                message="ANP computation failed",
                computation_time_ms=elapsed_ms,
                error_details=str(e)
            ).model_dump()
        )


@router.get("/{case_id}/comparison/ahp-vs-anp", response_model=AnpVsAhpResponse)
async def compare_ahp_vs_anp(
    case_id: str = Path(..., description="Case ID")
):
    """
    Compare AHP and ANP results for the same case.

    Shows how network feedback loops change alternative rankings
    compared to traditional hierarchical AHP.

    Useful for:
    - Understanding impact of network effects
    - Sensitivity analysis across methods
    - Validating which method better fits the problem

    Args:
        case_id: UUID of the case

    Returns:
        Side-by-side comparison with differences and rank changes

    Raises:
        404: If ANP results not computed yet
    """
    try:
        case = get_case_or_404(case_id)

        # TODO: Fetch from database:
        # - AHP weights
        # - ANP weights
        # - alternative list

        ahp_weights = {}  # {alt_id: weight}
        anp_weights = {}  # {alt_id: weight}
        alternatives = []  # [alt_id, ...]

        # Calculate ranks
        ahp_ranks = {alt_id: rank + 1 for rank, (alt_id, _) in enumerate(
            sorted(ahp_weights.items(), key=lambda x: x[1], reverse=True)
        )}
        anp_ranks = {alt_id: rank + 1 for rank, (alt_id, _) in enumerate(
            sorted(anp_weights.items(), key=lambda x: x[1], reverse=True)
        )}

        # Build comparison
        comparison = []
        max_diff = 0
        sum_diff = 0

        for alt_id in alternatives:
            ahp_w = ahp_weights.get(alt_id, 0)
            anp_w = anp_weights.get(alt_id, 0)
            diff = anp_w - ahp_w
            diff_pct = (diff / ahp_w * 100) if ahp_w > 0 else 0
            rank_change = anp_ranks.get(alt_id) - ahp_ranks.get(alt_id)

            comparison.append(AnpVsAhpComparison(
                alternative_id=alt_id,
                ahp_weight=ahp_w,
                anp_weight=anp_w,
                difference=diff,
                difference_percent=diff_pct,
                rank_change=rank_change if rank_change != 0 else None
            ))

            max_diff = max(max_diff, abs(diff))
            sum_diff += abs(diff)

        # Find most affected
        most_affected = max(comparison, key=lambda x: abs(x.difference))

        # Summary
        summary = {
            "max_difference": max_diff,
            "avg_difference": sum_diff / len(alternatives) if alternatives else 0,
            "alternatives_with_rank_change": sum(1 for c in comparison if c.rank_change),
            "most_affected_alternative": most_affected.alternative_id,
            "most_affected_difference": most_affected.difference
        }

        response = AnpVsAhpResponse(
            case_id=case_id,
            comparison=comparison,
            summary=summary
        )

        logger.info(f"Generated ANP vs AHP comparison for case {case_id}")
        return response

    except Exception as e:
        logger.error(f"Error generating comparison: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===========================
# EXPORTS
# ===========================

__all__ = ['router']
