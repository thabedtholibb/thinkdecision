import numpy as np


def aggregate_gmj(matrices: list[np.ndarray]) -> np.ndarray:
    """
    Geometric Mean of Judgments:
    Tiap sel = geometric mean dari sel yang sama di semua pakar.
    matrix_agg[i][j] = prod(m[i][j]) ^ (1/k)
    """
    k = len(matrices)
    stacked = np.stack(matrices, axis=0)  # shape: (k, n, n)
    product = np.prod(stacked, axis=0)
    return np.power(product, 1.0 / k)


def aggregate_gmp(priority_vectors: list[np.ndarray]) -> np.ndarray:
    """
    Geometric Mean of Priorities:
    priority_agg[i] = prod(pv[i]) ^ (1/k), lalu dinormalisasi.
    """
    k = len(priority_vectors)
    stacked = np.stack(priority_vectors, axis=0)  # shape: (k, n)
    product = np.prod(stacked, axis=0)
    geo_mean = np.power(product, 1.0 / k)
    return geo_mean / geo_mean.sum()
