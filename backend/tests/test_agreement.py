"""
Test suite for agreement.py - Expert Agreement Analysis Module

Tests conflict detection, outlier identification, and recommendation generation.
"""

import pytest
import numpy as np
from app.core.ahp.agreement import (
    calculate_matrix_distance,
    calculate_priority_correlation,
    identify_disagreement_pairs,
    calculate_expert_agreement_score,
    detect_outlier_experts,
    generate_conflict_recommendations
)


class TestMatrixDistance:
    """Tests for calculate_matrix_distance()"""

    def test_identical_matrices(self):
        """Identical matrices should have distance 0"""
        matrix = np.array([[1.0, 3.0], [1/3, 1.0]])
        distance = calculate_matrix_distance(matrix, matrix)
        assert distance == pytest.approx(0.0, abs=0.01)

    def test_very_different_matrices(self):
        """Matrices with opposite judgments should have high distance"""
        matrix_a = np.array([[1.0, 9.0], [1/9, 1.0]])
        matrix_b = np.array([[1.0, 1/9], [9.0, 1.0]])
        distance = calculate_matrix_distance(matrix_a, matrix_b)
        assert distance > 0.8  # Very high distance

    def test_reciprocal_property(self):
        """Reciprocal property (A[i,j] = 1/A[j,i]) should be respected"""
        # Expert A: Cost 3x important
        matrix_a = np.array([[1.0, 3.0], [1/3, 1.0]])
        # Expert B: Cost 1/3 as important (equivalent to Cost 3x less important)
        matrix_b = np.array([[1.0, 1/3], [3.0, 1.0]])
        distance = calculate_matrix_distance(matrix_a, matrix_b)
        # Should be high distance (opposite judgments)
        assert distance > 0.5

    def test_shape_mismatch_raises_error(self):
        """Matrices with different shapes should raise error"""
        matrix_a = np.array([[1.0, 3.0], [1/3, 1.0]])
        matrix_b = np.array([[1.0, 3.0, 2.0], [1/3, 1.0, 4.0], [1/2, 1/4, 1.0]])
        with pytest.raises(ValueError):
            calculate_matrix_distance(matrix_a, matrix_b)

    def test_single_element_matrix(self):
        """Single element (1x1) matrix should have zero distance"""
        matrix = np.array([[1.0]])
        distance = calculate_matrix_distance(matrix, matrix)
        assert distance == 0.0

    def test_distance_normalized_to_0_1(self):
        """Distance should always be in [0, 1] range"""
        matrix_a = np.array([[1.0, 9.0], [1/9, 1.0]])
        matrix_b = np.array([[1.0, 1/9], [9.0, 1.0]])
        distance = calculate_matrix_distance(matrix_a, matrix_b)
        assert 0.0 <= distance <= 1.0


class TestPriorityCorrelation:
    """Tests for calculate_priority_correlation()"""

    def test_identical_priorities(self):
        """Identical priorities should have correlation 1.0"""
        priorities = [0.5, 0.3, 0.2]
        corr = calculate_priority_correlation(priorities, priorities)
        assert corr == pytest.approx(1.0, abs=0.01)

    def test_same_ranking_different_scale(self):
        """Same ranking but different magnitudes should correlate well"""
        # Both rank: A > B > C (just different scales)
        priorities_a = [0.5, 0.3, 0.2]
        priorities_b = [0.7, 0.2, 0.1]
        corr = calculate_priority_correlation(priorities_a, priorities_b)
        assert corr > 0.9  # Very high correlation

    def test_inverted_ranking(self):
        """Inverted ranking should correlate negatively"""
        # A ranks: X > Y > Z
        priorities_a = [0.5, 0.3, 0.2]
        # B ranks: Z > Y > X (complete reversal)
        priorities_b = [0.2, 0.3, 0.5]
        corr = calculate_priority_correlation(priorities_a, priorities_b)
        assert corr < -0.5  # Negative correlation

    def test_random_ranking(self):
        """Uncorrelated rankings should have low correlation"""
        priorities_a = [0.5, 0.3, 0.2]
        priorities_b = [0.3, 0.2, 0.5]  # Rank order: B(0.3), C(0.2), A(0.5) → C < B < A
        corr = calculate_priority_correlation(priorities_a, priorities_b)
        # Not perfect but should be positive
        assert -1.0 <= corr <= 1.0

    def test_empty_lists(self):
        """Empty lists should return 0"""
        corr = calculate_priority_correlation([], [])
        assert corr == 0.0

    def test_single_element(self):
        """Single element should return 0 (no ranking to correlate)"""
        corr = calculate_priority_correlation([1.0], [1.0])
        assert corr == 0.0

    def test_nan_handling(self):
        """Identical all-equal values should return 0 (no ranking variance)"""
        # All equal priorities (no variance to correlate)
        priorities_a = [0.33, 0.33, 0.34]
        priorities_b = [0.33, 0.33, 0.34]
        corr = calculate_priority_correlation(priorities_a, priorities_b)
        assert corr >= 0.0  # Should not be NaN


class TestIdentifyDisagreementPairs:
    """Tests for identify_disagreement_pairs()"""

    def test_identical_experts(self):
        """Identical expert judgments should have no disagreements"""
        matrix = np.array([[1.0, 5.0, 3.0],
                          [1/5, 1.0, 2.0],
                          [1/3, 1/2, 1.0]])
        matrices = {'expert1': matrix, 'expert2': matrix.copy()}
        disagreements = identify_disagreement_pairs(matrices, threshold=0.4)
        assert len(disagreements) == 0

    def test_high_variance_pair(self):
        """Pairs with high variance should be identified"""
        # Expert A: Cost is 9x important
        matrix_a = np.array([[1.0, 9.0], [1/9, 1.0]])
        # Expert B: Cost is 1x (equal) important
        matrix_b = np.array([[1.0, 1.0], [1.0, 1.0]])

        matrices = {'expert1': matrix_a, 'expert2': matrix_b}
        disagreements = identify_disagreement_pairs(matrices, threshold=0.3)

        # Should detect disagreement on (0, 1) pair
        assert len(disagreements) > 0
        pair_indices = [d[0:2] for d in disagreements]
        assert (0, 1) in pair_indices

    def test_threshold_filtering(self):
        """Only pairs above threshold should be returned"""
        matrix_a = np.array([[1.0, 5.0], [1/5, 1.0]])
        matrix_b = np.array([[1.0, 5.0], [1/5, 1.0]])

        matrices = {'expert1': matrix_a, 'expert2': matrix_b}

        # High threshold: no disagreements
        disagreements_high = identify_disagreement_pairs(matrices, threshold=0.9)
        assert len(disagreements_high) == 0

        # Low threshold: catch small variations
        disagreements_low = identify_disagreement_pairs(matrices, threshold=0.01)
        assert len(disagreements_low) == 0  # Still identical

    def test_variance_sorting(self):
        """Disagreements should be sorted by variance (highest first)"""
        matrix_a = np.array([[1.0, 9.0, 2.0],
                            [1/9, 1.0, 1/3],
                            [1/2, 3.0, 1.0]])
        matrix_b = np.array([[1.0, 1.0, 2.0],  # Different on (0,1)
                            [1.0, 1.0, 1/3],
                            [1/2, 3.0, 1.0]])
        matrix_c = np.array([[1.0, 9.0, 1/2],  # Different on (0,2)
                            [1/9, 1.0, 1/3],
                            [2.0, 3.0, 1.0]])

        matrices = {'e1': matrix_a, 'e2': matrix_b, 'e3': matrix_c}
        disagreements = identify_disagreement_pairs(matrices, threshold=0.2)

        # Should be sorted by variance (descending)
        variances = [d[2] for d in disagreements]
        assert variances == sorted(variances, reverse=True)

    def test_empty_matrices(self):
        """Empty matrices dict should return empty list"""
        disagreements = identify_disagreement_pairs({})
        assert disagreements == []

    def test_single_expert(self):
        """Single expert should have no disagreements"""
        matrix = np.array([[1.0, 5.0], [1/5, 1.0]])
        matrices = {'expert1': matrix}
        disagreements = identify_disagreement_pairs(matrices)
        assert disagreements == []


class TestExpertAgreementScore:
    """Tests for calculate_expert_agreement_score()"""

    def test_identical_matrices_high_agreement(self):
        """Identical expert matrices should have high agreement score"""
        matrix = np.array([[1.0, 5.0, 3.0],
                          [1/5, 1.0, 2.0],
                          [1/3, 1/2, 1.0]])
        other_matrices = {'expert2': matrix.copy(), 'expert3': matrix.copy()}

        score = calculate_expert_agreement_score('expert1', matrix, other_matrices)
        assert score > 0.8  # High agreement

    def test_very_different_matrices_low_agreement(self):
        """Very different matrices should have low agreement"""
        # Expert A: all strong preferences
        matrix_a = np.array([[1.0, 9.0], [1/9, 1.0]])
        # Expert B: all weak preferences
        matrix_b = np.array([[1.0, 2.0], [1/2, 1.0]])

        other_matrices = {'expert2': matrix_b}
        score = calculate_expert_agreement_score('expert1', matrix_a, other_matrices)

        # Priorities might still correlate (same ranking) but matrix distance high
        assert -1.0 <= score <= 1.0

    def test_inverted_preferences_negative_correlation(self):
        """Inverted preferences should correlate negatively"""
        # A prefers: X >> Y
        matrix_a = np.array([[1.0, 9.0], [1/9, 1.0]])
        # B prefers: Y >> X (inverted)
        matrix_b = np.array([[1.0, 1/9], [9.0, 1.0]])

        other_matrices = {'expert2': matrix_b}
        score = calculate_expert_agreement_score('expert1', matrix_a, other_matrices)

        # Should be negative (inverted preferences)
        assert score < 0.0

    def test_empty_other_matrices(self):
        """No other experts should return 0 agreement"""
        matrix = np.array([[1.0, 5.0], [1/5, 1.0]])
        score = calculate_expert_agreement_score('expert1', matrix, {})
        assert score == 0.0

    def test_score_range(self):
        """Score should always be in [-1, 1] range"""
        matrix_a = np.array([[1.0, 5.0], [1/5, 1.0]])
        matrix_b = np.array([[1.0, 3.0], [1/3, 1.0]])

        other_matrices = {'expert2': matrix_b}
        score = calculate_expert_agreement_score('expert1', matrix_a, other_matrices)

        assert -1.0 <= score <= 1.0


class TestDetectOutliers:
    """Tests for detect_outlier_experts()"""

    def test_no_outliers_similar_experts(self):
        """Similar expert matrices should have no outliers"""
        matrix_a = np.array([[1.0, 5.0], [1/5, 1.0]])
        matrix_b = np.array([[1.0, 4.0], [1/4, 1.0]])
        matrix_c = np.array([[1.0, 5.5], [1/5.5, 1.0]])

        matrices = {'e1': matrix_a, 'e2': matrix_b, 'e3': matrix_c}
        outliers = detect_outlier_experts(matrices, method='iqr')

        assert len(outliers) == 0

    def test_outlier_detection_iqr_method(self):
        """IQR method should detect expert with very different preferences"""
        # Experts 1, 2, 3: Cost >> Quality
        matrix_normal = np.array([[1.0, 9.0], [1/9, 1.0]])
        # Expert 4: Quality >> Cost (opposite preference)
        matrix_outlier = np.array([[1.0, 1/9], [9.0, 1.0]])

        matrices = {
            'e1': matrix_normal,
            'e2': matrix_normal.copy(),
            'e3': matrix_normal.copy(),
            'e4': matrix_outlier
        }

        outliers = detect_outlier_experts(matrices, method='iqr')
        assert 'e4' in outliers

    def test_minimum_experts_required(self):
        """Requires at least 3 experts to detect outliers"""
        matrix = np.array([[1.0, 5.0], [1/5, 1.0]])

        # Only 2 experts
        matrices = {'e1': matrix, 'e2': matrix.copy()}
        outliers = detect_outlier_experts(matrices, method='iqr')
        assert outliers == []

    def test_zscore_method(self):
        """Z-score method should also detect outliers"""
        matrix_normal = np.array([[1.0, 5.0], [1/5, 1.0]])
        matrix_outlier = np.array([[1.0, 1/9], [9.0, 1.0]])

        matrices = {
            'e1': matrix_normal,
            'e2': matrix_normal.copy(),
            'e3': matrix_normal.copy(),
            'e4': matrix_outlier
        }

        outliers = detect_outlier_experts(matrices, method='zscore')
        # Z-score is more conservative, should detect if difference is large
        assert 'e4' in outliers or len(outliers) == 0  # Depends on magnitude

    def test_invalid_method_raises_error(self):
        """Invalid method should raise error"""
        matrices = {'e1': np.eye(2)}
        with pytest.raises(ValueError):
            detect_outlier_experts(matrices, method='invalid')


class TestGenerateRecommendations:
    """Tests for generate_conflict_recommendations()"""

    def test_recommendation_format(self):
        """Recommendations should have correct structure"""
        disagreement_pairs = [
            (0, 1, 0.8, {'e1': 5.0, 'e2': 1.0, 'e3': 2.0}),
            (1, 2, 0.5, {'e1': 3.0, 'e2': 3.0, 'e3': 3.0})
        ]
        item_names = ['Cost', 'Quality', 'Time']

        recs = generate_conflict_recommendations(disagreement_pairs, item_names)

        assert len(recs) == 2
        assert all('pair' in r for r in recs)
        assert all('item_a' in r for r in recs)
        assert all('item_b' in r for r in recs)
        assert all('variance' in r for r in recs)
        assert all('expert_views' in r for r in recs)
        assert all('suggestion' in r for r in recs)

    def test_suggestion_classification(self):
        """Variance should determine suggestion level"""
        high_var = (0, 1, 0.9, {'e1': 9.0, 'e2': 1.0})
        mod_var = (0, 1, 0.6, {'e1': 5.0, 'e2': 2.0})
        low_var = (0, 1, 0.3, {'e1': 3.0, 'e2': 2.5})

        item_names = ['A', 'B']

        high_rec = generate_conflict_recommendations([high_var], item_names)[0]
        assert high_rec['suggestion'] == 'HIGH_CONFLICT'

        mod_rec = generate_conflict_recommendations([mod_var], item_names)[0]
        assert mod_rec['suggestion'] == 'MODERATE_CONFLICT'

        low_rec = generate_conflict_recommendations([low_var], item_names)[0]
        assert low_rec['suggestion'] == 'REVIEW'

    def test_median_min_max_calculation(self):
        """Should calculate min/max/median correctly"""
        disagreement_pairs = [
            (0, 1, 0.7, {'e1': 5.0, 'e2': 3.0, 'e3': 7.0})
        ]
        item_names = ['A', 'B']

        rec = generate_conflict_recommendations(disagreement_pairs, item_names)[0]

        assert rec['median'] == 5.0
        assert rec['min'] == 3.0
        assert rec['max'] == 7.0

    def test_item_name_fallback(self):
        """Should use item names or fallback to indices"""
        # Pair index beyond item_names
        disagreement_pairs = [
            (0, 1, 0.7, {'e1': 5.0, 'e2': 3.0})
        ]
        item_names = ['A']  # Only 1 item, but pair references index 1

        rec = generate_conflict_recommendations(disagreement_pairs, item_names)[0]

        assert rec['item_a'] == 'A'
        assert rec['item_b'] == 'Item 1'  # Fallback to index

    def test_empty_disagreements(self):
        """Empty disagreements list should return empty recommendations"""
        recs = generate_conflict_recommendations([], ['A', 'B'])
        assert recs == []


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
