"""
Expert Agreement Analysis Module

Analyzes inter-expert disagreement in pairwise comparison judgments.
Detects conflicts, identifies outlier experts, and recommends problematic pairs for revision.
"""

import numpy as np
from scipy.stats import spearmanr
from typing import List, Dict, Tuple, Optional


def calculate_matrix_distance(matrix_a: np.ndarray, matrix_b: np.ndarray) -> float:
    """
    Calculate Frobenius distance between two pairwise comparison matrices.

    Normalized to [0, 1] range where:
    - 0 = identical matrices
    - 1 = completely different judgments

    Args:
        matrix_a: First pairwise comparison matrix (n × n)
        matrix_b: Second pairwise comparison matrix (n × n)

    Returns:
        Distance value [0, 1]

    Notes:
        - Distance is calculated on log scale to account for reciprocal property
        - e.g., judgment "5" is equally different from "1/5" as from "1"
    """
    if matrix_a.shape != matrix_b.shape:
        raise ValueError("Matrices must have same shape")

    n = matrix_a.shape[0]

    # Convert to log scale (1 → 0, 5 → ln(5) ≈ 1.61, 1/5 → -ln(5) ≈ -1.61)
    log_a = np.log(np.maximum(matrix_a, 0.001))  # Avoid log(0)
    log_b = np.log(np.maximum(matrix_b, 0.001))

    # Only compare upper triangle (reciprocal property symmetric)
    upper_indices = np.triu_indices(n, k=1)
    diff = log_a[upper_indices] - log_b[upper_indices]

    # Frobenius norm of differences
    frobenius = np.sqrt(np.sum(diff ** 2))

    # Normalize: max difference when one is all 9s and other all 1s
    # Max per-cell difference: ln(9) ≈ 2.2
    # Number of upper triangle cells: n*(n-1)/2
    max_diff = 2.2 * np.sqrt(n * (n - 1) / 2)

    if max_diff == 0:
        return 0.0

    distance = min(frobenius / max_diff, 1.0)
    return float(distance)


def calculate_priority_correlation(priorities_a: List[float], priorities_b: List[float]) -> float:
    """
    Calculate Spearman rank correlation between two priority vectors.

    Measures agreement on ranking order, not absolute values.

    Args:
        priorities_a: First expert's priority vector (sum = 1.0)
        priorities_b: Second expert's priority vector (sum = 1.0)

    Returns:
        Correlation coefficient [-1, 1]:
        - 1.0 = perfect agreement on ranking
        - 0.0 = no correlation (random ranking difference)
        - -1.0 = inverted ranking (complete disagreement)

    Notes:
        - Uses Spearman (rank) rather than Pearson to account for scale differences
        - E.g., {0.5, 0.3, 0.2} vs {0.4, 0.35, 0.25} are highly correlated
    """
    if len(priorities_a) != len(priorities_b) or len(priorities_a) < 2:
        return 0.0

    try:
        # Spearman correlation: ranks the priorities and correlates ranks
        correlation, _ = spearmanr(priorities_a, priorities_b)
        # Handle NaN case (identical values all zeros)
        if np.isnan(correlation):
            return 0.0
        return float(correlation)
    except Exception:
        return 0.0


def identify_disagreement_pairs(
    matrices: Dict[str, np.ndarray],
    threshold: float = 0.4
) -> List[Tuple[int, int, float, Dict[str, float]]]:
    """
    Identify specific pairs (cells) with high disagreement across experts.

    Calculates coefficient of variation for each judgment across experts.

    Args:
        matrices: Dict[expert_id] → pairwise matrix (n × n)
        threshold: CV threshold [0, 1] - higher CV = more disagreement
                 0.4 means values differ by ~40% around mean

    Returns:
        List of [(i, j, variance, {expert_id: value})]:
        - i, j: Item indices in comparison
        - variance: Coefficient of Variation (std/mean)
        - Values: Dict mapping each expert to their judgment

        Sorted by variance (highest first = most disagreement)

    Notes:
        - Only examines upper triangle (reciprocal symmetric)
        - Filters out pairs where experts fully agree (variance < threshold)
    """
    if not matrices or len(matrices) < 2:
        return []

    expert_ids = list(matrices.keys())
    n = matrices[expert_ids[0]].shape[0]

    disagreements = []

    # Examine each pair (only upper triangle due to reciprocal property)
    for i in range(n):
        for j in range(i + 1, n):
            # Collect all experts' judgments for this pair
            values = [matrices[exp_id][i, j] for exp_id in expert_ids]

            # Calculate coefficient of variation (std/mean)
            mean_val = np.mean(values)
            if mean_val == 0:
                continue

            std_val = np.std(values)
            cv = std_val / mean_val if mean_val != 0 else 0

            # Only include if high disagreement
            if cv >= threshold:
                values_dict = {exp_id: float(values[idx]) for idx, exp_id in enumerate(expert_ids)}
                disagreements.append((i, j, float(cv), values_dict))

    # Sort by variance (highest disagreement first)
    disagreements.sort(key=lambda x: x[2], reverse=True)

    return disagreements


def calculate_expert_agreement_score(
    expert_id: str,
    expert_matrix: np.ndarray,
    other_matrices: Dict[str, np.ndarray]
) -> float:
    """
    Calculate average agreement of one expert vs all others.

    Combines matrix distance and priority correlation.

    Args:
        expert_id: ID of expert to evaluate (for reference)
        expert_matrix: Pairwise matrix from this expert
        other_matrices: Dict[other_expert_id] → their matrices

    Returns:
        Agreement score [-1, 1]:
        - 1.0 = perfect agreement with all peers
        - 0.5 = moderate agreement
        - 0.0 = no correlation
        - -1.0 = inverse agreement (very unlikely)

    Notes:
        - Averages correlation with each other expert
        - Uses priority vector correlation as main metric
    """
    if not other_matrices:
        return 0.0

    try:
        # Calculate expert's priority vector
        eigenvalues, eigenvectors = np.linalg.eig(expert_matrix)
        max_idx = np.argmax(eigenvalues.real)
        expert_priorities = np.abs(eigenvectors[:, max_idx].real)
        expert_priorities = expert_priorities / expert_priorities.sum()

        # Calculate correlation with each other expert
        correlations = []
        for other_id, other_matrix in other_matrices.items():
            try:
                # Other expert's priority vector
                other_eigenvalues, other_eigenvectors = np.linalg.eig(other_matrix)
                other_max_idx = np.argmax(other_eigenvalues.real)
                other_priorities = np.abs(other_eigenvectors[:, other_max_idx].real)
                other_priorities = other_priorities / other_priorities.sum()

                # Correlation with this expert
                corr = calculate_priority_correlation(expert_priorities.tolist(), other_priorities.tolist())
                correlations.append(corr)
            except Exception:
                continue

        if not correlations:
            return 0.0

        # Average correlation with all peers
        avg_agreement = float(np.mean(correlations))
        return max(-1.0, min(1.0, avg_agreement))

    except Exception:
        return 0.0


def detect_outlier_experts(
    matrices: Dict[str, np.ndarray],
    method: str = 'iqr'
) -> List[str]:
    """
    Detect experts who are statistical outliers in their judgments.

    Uses Interquartile Range (IQR) method:
    - Outlier if agreement_score < Q1 - 1.5*IQR

    Args:
        matrices: Dict[expert_id] → pairwise matrix (n × n)
        method: 'iqr' (default) - use IQR method
               'zscore' - use Z-score method (>2 std devs)

    Returns:
        List of [expert_id] that are outliers

    Notes:
        - Requires at least 3 experts to detect outliers
        - An outlier doesn't mean "wrong", just "different from group"
    """
    if len(matrices) < 3:
        return []

    expert_ids = list(matrices.keys())

    # Calculate agreement score for each expert vs all others
    agreement_scores = {}
    for exp_id in expert_ids:
        other_matrices = {k: v for k, v in matrices.items() if k != exp_id}
        score = calculate_expert_agreement_score(exp_id, matrices[exp_id], other_matrices)
        agreement_scores[exp_id] = score

    scores = list(agreement_scores.values())

    if method == 'iqr':
        # IQR method
        q1 = np.percentile(scores, 25)
        q3 = np.percentile(scores, 75)
        iqr = q3 - q1

        lower_bound = q1 - 1.5 * iqr

        outliers = [
            exp_id for exp_id, score in agreement_scores.items()
            if score < lower_bound
        ]

    elif method == 'zscore':
        # Z-score method (>2 std devs from mean)
        mean_score = np.mean(scores)
        std_score = np.std(scores)

        if std_score == 0:
            return []

        outliers = [
            exp_id for exp_id, score in agreement_scores.items()
            if abs((score - mean_score) / std_score) > 2
        ]

    else:
        raise ValueError(f"Unknown method: {method}")

    return outliers


def generate_conflict_recommendations(
    disagreement_pairs: List[Tuple[int, int, float, Dict[str, float]]],
    item_names: List[str],
    outlier_experts: List[str] = None
) -> List[Dict]:
    """
    Generate human-readable recommendations for resolving conflicts.

    Args:
        disagreement_pairs: Output from identify_disagreement_pairs()
        item_names: Names of items being compared (criteria or alternatives)
        outlier_experts: List of expert IDs detected as outliers

    Returns:
        List of recommendation dicts:
        {
            'pair': (i, j),
            'item_a': str,
            'item_b': str,
            'variance': float,
            'expert_views': [{'expert_id': str, 'value': float}],
            'suggestion': 'HIGH_CONFLICT' | 'MODERATE_CONFLICT' | 'REVIEW',
            'median': float,
            'min': float,
            'max': float
        }
    """
    recommendations = []

    for i, j, variance, expert_values in disagreement_pairs:
        if i >= len(item_names) or j >= len(item_names):
            continue

        values_list = list(expert_values.values())
        median_val = float(np.median(values_list))
        min_val = float(np.min(values_list))
        max_val = float(np.max(values_list))

        # Classify conflict severity
        if variance > 0.8:
            suggestion = 'HIGH_CONFLICT'
        elif variance > 0.5:
            suggestion = 'MODERATE_CONFLICT'
        else:
            suggestion = 'REVIEW'

        # Build expert views
        expert_views = [
            {'expert_id': exp_id, 'value': float(value)}
            for exp_id, value in expert_values.items()
        ]

        recommendations.append({
            'pair': (int(i), int(j)),
            'item_a': item_names[i] if i < len(item_names) else f'Item {i}',
            'item_b': item_names[j] if j < len(item_names) else f'Item {j}',
            'variance': float(variance),
            'expert_views': expert_views,
            'suggestion': suggestion,
            'median': median_val,
            'min': min_val,
            'max': max_val
        })

    return recommendations


# Export all functions
__all__ = [
    'calculate_matrix_distance',
    'calculate_priority_correlation',
    'identify_disagreement_pairs',
    'calculate_expert_agreement_score',
    'detect_outlier_experts',
    'generate_conflict_recommendations'
]
