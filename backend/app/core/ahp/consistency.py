import numpy as np
from app.core.ahp.priority import compute_priority_vector


RI_TABLE: dict[int, float] = {
    1: 0.00, 2: 0.00, 3: 0.58, 4: 0.90, 5: 1.12,
    6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49,
}


def compute_lambda_max(matrix: np.ndarray, priority_vector: np.ndarray) -> float:
    """Hitung λmax: rata-rata dari (Aw)_i / w_i."""
    weighted = matrix @ priority_vector
    ratios = weighted / priority_vector
    return float(ratios.mean())


def compute_ci(lambda_max: float, n: int) -> float:
    """CI = (λmax - n) / (n - 1). Untuk n=1, CI=0."""
    if n <= 1:
        return 0.0
    return (lambda_max - n) / (n - 1)


def compute_cr(ci: float, n: int) -> float:
    """CR = CI / RI[n]. Jika n > 10, gunakan RI=1.49."""
    ri = RI_TABLE.get(n, 1.49)
    if ri == 0.0:
        return 0.0
    return ci / ri


def check_consistency(matrix: np.ndarray) -> dict:
    """
    Hitung lengkap: lambda_max, CI, CR, is_consistent, priority_vector.
    CR <= 0.1 dianggap konsisten (threshold Saaty).
    """
    n = matrix.shape[0]
    pv = compute_priority_vector(matrix)
    lmax = compute_lambda_max(matrix, pv)
    ci = compute_ci(lmax, n)
    cr = compute_cr(ci, n)
    return {
        "lambda_max": round(lmax, 6),
        "ci": round(ci, 6),
        "cr": round(cr, 6),
        "is_consistent": cr <= 0.1,
        "priority_vector": pv.tolist(),
    }
