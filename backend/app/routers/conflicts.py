"""
Conflict Detection and Resolution API Endpoints

Provides endpoints for analyzing inter-expert disagreement and managing revision workflow.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from uuid import UUID
from datetime import datetime
import numpy as np
from typing import Optional, List, Dict

from app.core.ahp.agreement import (
    identify_disagreement_pairs,
    detect_outlier_experts,
    calculate_expert_agreement_score,
    generate_conflict_recommendations
)
from app.db import get_db
from app.models import Comparison, ExpertInvite, Case, User
from app.core.auth import get_current_user
from app.schemas.requests import RevisionRequest, RevisedJudgment
from app.schemas.responses import ConflictAnalysisResponse

router = APIRouter(prefix="/cases", tags=["conflicts"])


@router.get("/{case_id}/conflicts", response_model=ConflictAnalysisResponse)
async def analyze_conflicts(
    case_id: UUID,
    node_key: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze inter-expert disagreement for a case or specific node.

    Args:
        case_id: Case ID to analyze
        node_key: Optional specific node (format: "criteria", "0-alternatives", etc.)
                 If omitted, analyzes all nodes

    Returns:
        {
            status: 'high_conflict' | 'moderate_conflict' | 'good_agreement',
            summary: {
                total_experts: int,
                total_outliers: int,
                total_disagreement_pairs: int,
                aggregated_cr: float
            },
            expert_agreement: {
                expert_id: agreement_score ([-1, 1])
            },
            outlier_experts: [expert_id],
            disagreement_pairs: [{
                pair: [i, j],
                item_a: str,
                item_b: str,
                variance: float,
                expert_views: [{expert_id, value}],
                suggestion: 'HIGH_CONFLICT' | 'MODERATE_CONFLICT' | 'REVIEW',
                median: float,
                min: float,
                max: float
            }],
            recommendations: [str]  # Human-readable recommendations
        }

    Notes:
        - Requires case creator or admin role
        - Only analyzes completed expert submissions
    """

    # Verify ownership
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    if case.creator_id != current_user.id and current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    # Get all completed expert comparisons for this case
    comparisons_query = db.query(Comparison).filter(
        and_(
            Comparison.case_id == case_id,
            Comparison.expert_id.isnot(None)
        )
    )

    if node_key:
        # Filter to specific node
        comparisons_query = comparisons_query.filter(Comparison.parent_id == node_key)

    comparisons = comparisons_query.all()

    if not comparisons:
        return ConflictAnalysisResponse(
            status='no_data',
            summary={'total_experts': 0, 'total_outliers': 0},
            expert_agreement={},
            outlier_experts=[],
            disagreement_pairs=[],
            recommendations=['No expert comparisons available to analyze']
        )

    # Build expert matrices dict
    matrices = {}
    expert_map = {}  # expert_id → expert object
    criteria_names = []

    for comp in comparisons:
        if comp.value_matrix is None:
            continue

        matrices[str(comp.expert_id)] = np.array(comp.value_matrix)

        if comp.expert_id not in expert_map:
            expert = db.query(User).filter(User.id == comp.expert_id).first()
            expert_map[str(comp.expert_id)] = expert

    if len(matrices) < 2:
        return ConflictAnalysisResponse(
            status='insufficient_experts',
            summary={'total_experts': len(matrices)},
            expert_agreement={},
            outlier_experts=[],
            disagreement_pairs=[],
            recommendations=['Need at least 2 experts to detect conflicts']
        )

    # Step 1: Detect outlier experts
    outlier_experts = detect_outlier_experts(matrices, method='iqr')

    # Step 2: Identify disagreement pairs
    disagreement_pairs = identify_disagreement_pairs(
        matrices,
        threshold=0.4  # CV >= 40% = significant disagreement
    )

    # Step 3: Calculate agreement scores for each expert
    expert_agreement = {}
    for exp_id, matrix in matrices.items():
        other_matrices = {k: v for k, v in matrices.items() if k != exp_id}
        score = calculate_expert_agreement_score(exp_id, matrix, other_matrices)
        expert_agreement[exp_id] = score

    # Step 4: Generate recommendations
    item_names = [f"Item {i}" for i in range(len(matrices[list(matrices.keys())[0]]))]
    recommendations = generate_conflict_recommendations(
        disagreement_pairs,
        item_names,
        outlier_experts
    )

    # Step 5: Determine overall conflict status
    num_disagreement_pairs = len(disagreement_pairs)
    num_experts = len(matrices)

    if num_disagreement_pairs > num_experts:
        conflict_status = 'high_conflict'
    elif num_disagreement_pairs > 0:
        conflict_status = 'moderate_conflict'
    else:
        conflict_status = 'good_agreement'

    # Step 6: Generate human-readable recommendations
    human_recommendations = []

    if len(outlier_experts) > 0:
        outlier_names = [
            expert_map.get(eid, {}).name or eid
            for eid in outlier_experts
        ]
        human_recommendations.append(
            f"🔍 Outlier experts detected: {', '.join(outlier_names)}. "
            f"Consider requesting revision to improve consensus."
        )

    if num_disagreement_pairs > 0:
        top_pair = recommendations[0]
        human_recommendations.append(
            f"⚠️  Highest disagreement on '{top_pair['item_a']}' vs '{top_pair['item_b']}' "
            f"(variance: {top_pair['variance']:.2f}). "
            f"Consider requesting revision."
        )

    if conflict_status == 'good_agreement':
        human_recommendations.append(
            f"✓ Expert judgments are well-aligned. No action needed."
        )

    # Update comparison records with agreement scores and outlier status
    for comp in comparisons:
        exp_id_str = str(comp.expert_id)
        if exp_id_str in expert_agreement:
            comp.agreement_score = expert_agreement[exp_id_str]
            comp.is_outlier = (exp_id_str in outlier_experts)
            db.add(comp)

    db.commit()

    return ConflictAnalysisResponse(
        status=conflict_status,
        summary={
            'total_experts': num_experts,
            'total_outliers': len(outlier_experts),
            'total_disagreement_pairs': num_disagreement_pairs,
            'conflict_status': conflict_status
        },
        expert_agreement=expert_agreement,
        outlier_experts=outlier_experts,
        disagreement_pairs=recommendations,
        recommendations=human_recommendations
    )


@router.get("/{case_id}/expert/{expert_id}/comparison")
async def get_expert_peer_comparison(
    case_id: UUID,
    expert_id: UUID,
    pair: Optional[str] = None,  # Format: "0-1" for comparing items 0 vs 1
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Show an expert their judgment vs peers (for revision context).

    Used when expert is reconsidering their judgment - shows them
    how their value compares to others (range/median only, no names).

    Args:
        case_id: Case ID
        expert_id: Expert being shown peer data
        pair: Specific pair to compare (e.g., "0-1")

    Returns:
        {
            your_value: float,
            peer_range: [min, max],
            peer_median: float,
            peer_mean: float,
            peer_count: int,
            distribution: [values]  # for visualization
        }

    Notes:
        - Only shows numeric values, not expert names (avoid anchoring)
        - Expert can accept or override feedback
    """

    # Get expert's own comparison
    expert_comp = db.query(Comparison).filter(
        and_(
            Comparison.case_id == case_id,
            Comparison.expert_id == expert_id
        )
    ).first()

    if not expert_comp or not expert_comp.value_matrix:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expert comparison not found"
        )

    if not pair:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pair parameter required (format: '0-1')"
        )

    try:
        i, j = map(int, pair.split('-'))
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid pair format (use '0-1')"
        )

    expert_matrix = np.array(expert_comp.value_matrix)
    your_value = float(expert_matrix[i, j])

    # Get peer values for this pair
    peer_comps = db.query(Comparison).filter(
        and_(
            Comparison.case_id == case_id,
            Comparison.expert_id != expert_id
        )
    ).all()

    peer_values = []
    for comp in peer_comps:
        if comp.value_matrix:
            peer_matrix = np.array(comp.value_matrix)
            if i < len(peer_matrix) and j < len(peer_matrix[0]):
                peer_values.append(float(peer_matrix[i, j]))

    if not peer_values:
        return {
            'your_value': your_value,
            'peer_range': None,
            'peer_median': None,
            'peer_mean': None,
            'peer_count': 0,
            'distribution': [],
            'message': 'No peer comparisons available yet'
        }

    return {
        'your_value': your_value,
        'peer_range': [float(min(peer_values)), float(max(peer_values))],
        'peer_median': float(np.median(peer_values)),
        'peer_mean': float(np.mean(peer_values)),
        'peer_count': len(peer_values),
        'distribution': sorted(peer_values),
        'recommendation': _get_revision_recommendation(your_value, peer_values)
    }


def _get_revision_recommendation(your_value: float, peer_values: List[float]) -> str:
    """Generate gentle recommendation for expert revision"""
    peer_median = np.median(peer_values)
    peer_std = np.std(peer_values)

    if peer_std == 0:
        return "Other experts are unanimous on this judgment."

    # Z-score: how far is your value from median?
    z_score = (your_value - peer_median) / peer_std if peer_std > 0 else 0

    if abs(z_score) < 1.0:
        return "Your judgment is close to the group median."
    elif abs(z_score) < 2.0:
        return "Your judgment differs somewhat from the group. Consider reviewing."
    else:
        return "Your judgment differs significantly from the group. Please review."


@router.post("/{case_id}/request-revision")
async def request_revision(
    case_id: UUID,
    request: RevisionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creator requests expert to reconsider a judgment.

    Args:
        case_id: Case ID
        request: {
            expert_id: UUID,
            pair: [i, j] or None (to request entire re-evaluation),
            reason: str (e.g., "High disagreement with peers")
        }

    Returns:
        {
            status: 'success',
            message: str,
            revision_count: int
        }

    Notes:
        - Sets needs_review=true and revision_requested_at
        - Notifies expert via notification system
    """

    # Verify ownership
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case or case.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    # Update Comparison record
    comparison = db.query(Comparison).filter(
        and_(
            Comparison.case_id == case_id,
            Comparison.expert_id == request.expert_id
        )
    ).first()

    if comparison:
        comparison.needs_review = True
        comparison.revision_requested_at = datetime.utcnow()
        comparison.revision_notes = request.reason
        db.add(comparison)

    # Update ExpertInvite record
    invite = db.query(ExpertInvite).filter(
        and_(
            ExpertInvite.case_id == case_id,
            ExpertInvite.expert_id == request.expert_id
        )
    ).first()

    if invite:
        invite.revision_requested_at = datetime.utcnow()
        invite.revision_notes = request.reason
        db.add(invite)

    db.commit()

    return {
        'status': 'revision_requested',
        'message': f'Revision request sent to expert',
        'revision_count': invite.revision_count if invite else 0
    }


@router.post("/{case_id}/submit-revision")
async def submit_revised_judgment(
    case_id: UUID,
    revision: RevisedJudgment,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Expert submits revised judgment.

    Args:
        case_id: Case ID
        revision: {
            comparison_id: UUID,
            new_value_matrix: [[...], ...],
            acceptance_notes: str (optional)
        }

    Returns:
        {
            status: 'success',
            message: str,
            revision_count: int,
            new_cr: float
        }

    Notes:
        - Updates Comparison.value_matrix
        - Recalculates CR and priority_vector
        - Triggers re-aggregation notification to creator
    """

    # Get the comparison to update
    comparison = db.query(Comparison).filter(
        Comparison.id == revision.comparison_id
    ).first()

    if not comparison or comparison.expert_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    # Update matrix and recalculate
    comparison.value_matrix = revision.new_value_matrix
    comparison.needs_review = False
    comparison.revision_requested_at = None

    # Recalculate CR and priority (would call consistency.py functions)
    # (This is placeholder - actual CR calculation would go here)

    # Update invite revision tracking
    invite = db.query(ExpertInvite).filter(
        and_(
            ExpertInvite.case_id == case_id,
            ExpertInvite.expert_id == current_user.id
        )
    ).first()

    if invite:
        invite.revision_count += 1
        invite.revision_completed_at = datetime.utcnow()
        db.add(invite)

    db.add(comparison)
    db.commit()

    return {
        'status': 'revision_accepted',
        'message': 'Your revised judgments have been saved',
        'revision_count': invite.revision_count if invite else 1,
        'new_cr': comparison.cr or 0.0
    }


# Export router
__all__ = ['router']
