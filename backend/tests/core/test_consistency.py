import pytest
import numpy as np
from app.core.ahp.priority import compute_priority_vector
from app.core.ahp.consistency import compute_lambda_max, compute_ci, compute_cr, check_consistency


def test_priority_vector_sums_to_one():
    matrix = np.array([[1, 3, 5], [1/3, 1, 2], [1/5, 1/2, 1]])
    pv = compute_priority_vector(matrix)
    assert abs(pv.sum() - 1.0) < 1e-9
    assert len(pv) == 3


def test_consistent_matrix_cr_below_threshold():
    # Matriks yang sangat konsisten
    matrix = np.array([[1, 1, 1], [1, 1, 1], [1, 1, 1]])
    result = check_consistency(matrix)
    assert result["cr"] < 0.1
    assert result["is_consistent"] is True


def test_inconsistent_matrix_cr_above_threshold():
    # Matriks yang jelas inkonsisten
    matrix = np.array([[1, 9, 1/9], [1/9, 1, 9], [9, 1/9, 1]])
    result = check_consistency(matrix)
    assert result["cr"] > 0.1
    assert result["is_consistent"] is False


def test_check_consistency_keys():
    matrix = np.array([[1, 3], [1/3, 1]])
    result = check_consistency(matrix)
    assert all(k in result for k in ["lambda_max", "ci", "cr", "is_consistent", "priority_vector"])
