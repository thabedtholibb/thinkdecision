import numpy as np
from app.core.ahp.matrix import normalize_matrix


def compute_priority_vector(matrix: np.ndarray) -> np.ndarray:
    """
    Hitung priority vector via normalized column average.
    Setiap baris dinormalisasi, lalu dirata-rata.
    Output: 1D array panjang n, sum = 1.0
    """
    normalized = normalize_matrix(matrix)
    priority = normalized.mean(axis=1)
    return priority / priority.sum()  # pastikan sum = 1.0
