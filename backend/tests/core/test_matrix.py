import pytest
import numpy as np
from app.core.ahp.matrix import validate_matrix, normalize_matrix


def test_validate_matrix_valid():
    matrix = [[1, 3, 5], [1/3, 1, 2], [1/5, 1/2, 1]]
    is_valid, msg = validate_matrix(matrix)
    assert is_valid is True
    assert msg == ""


def test_validate_matrix_not_square():
    matrix = [[1, 3], [1/3, 1], [1, 2]]
    is_valid, msg = validate_matrix(matrix)
    assert is_valid is False
    assert "square" in msg.lower()


def test_validate_matrix_diagonal_not_one():
    matrix = [[2, 3], [1/3, 1]]
    is_valid, msg = validate_matrix(matrix)
    assert is_valid is False
    assert "diagonal" in msg.lower()


def test_validate_matrix_not_reciprocal():
    matrix = [[1, 3], [3, 1]]  # harusnya [1/3, ...]
    is_valid, msg = validate_matrix(matrix)
    assert is_valid is False
    assert "reciprocal" in msg.lower()


def test_normalize_matrix_columns_sum_to_one():
    matrix = np.array([[1, 3, 5], [1/3, 1, 2], [1/5, 1/2, 1]])
    normalized = normalize_matrix(matrix)
    col_sums = normalized.sum(axis=0)
    np.testing.assert_allclose(col_sums, np.ones(3), atol=1e-9)
