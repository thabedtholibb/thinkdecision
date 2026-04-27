import numpy as np
from app.core.ahp.aggregation import aggregate_gmj, aggregate_gmp


def test_aggregate_gmj_two_experts():
    m1 = np.array([[1, 3], [1/3, 1]])
    m2 = np.array([[1, 5], [1/5, 1]])
    result = aggregate_gmj([m1, m2])
    # GMJ: geometric mean tiap sel
    expected_01 = (3 * 5) ** 0.5  # ≈ 3.873
    assert abs(result[0][1] - expected_01) < 1e-6
    assert abs(result[1][0] - 1/expected_01) < 1e-6


def test_aggregate_gmj_reciprocal_preserved():
    m1 = np.array([[1, 3], [1/3, 1]])
    m2 = np.array([[1, 5], [1/5, 1]])
    result = aggregate_gmj([m1, m2])
    assert abs(result[0][1] * result[1][0] - 1.0) < 1e-9


def test_aggregate_gmp_sums_to_one():
    pv1 = np.array([0.75, 0.25])
    pv2 = np.array([0.6, 0.4])
    result = aggregate_gmp([pv1, pv2])
    assert abs(result.sum() - 1.0) < 1e-9


def test_aggregate_gmp_two_experts():
    pv1 = np.array([0.75, 0.25])
    pv2 = np.array([0.25, 0.75])
    result = aggregate_gmp([pv1, pv2])
    # Geometric mean simetris → hasil harus sama untuk dua elemen
    assert abs(result[0] - result[1]) < 1e-6
