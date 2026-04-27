import numpy as np


def validate_matrix(matrix: list[list[float]]) -> tuple[bool, str]:
    """Validasi PCM: square, diagonal=1, reciprocal, positive, n>=2."""
    n = len(matrix)
    if n < 2:
        return False, "Matrix must have at least 2x2 size"
    for row in matrix:
        if len(row) != n:
            return False, "Matrix must be square (n x n)"
    for i in range(n):
        if abs(matrix[i][i] - 1.0) > 1e-9:
            return False, f"Diagonal element [{i}][{i}] must be 1.0"
        for j in range(n):
            if matrix[i][j] <= 0:
                return False, f"All values must be positive, got {matrix[i][j]} at [{i}][{j}]"
            if abs(matrix[i][j] * matrix[j][i] - 1.0) > 1e-6:
                return False, f"Matrix must be reciprocal: [{i}][{j}] * [{j}][{i}] must equal 1.0"
    return True, ""


def normalize_matrix(matrix: np.ndarray) -> np.ndarray:
    """Normalisasi kolom: bagi tiap elemen dengan jumlah kolomnya."""
    col_sums = matrix.sum(axis=0)
    return matrix / col_sums
