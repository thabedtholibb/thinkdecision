from app.core.ahp.hierarchy import build_criteria_tree, compute_global_weights
import uuid
import numpy as np


def test_build_criteria_tree_flat():
    cid1, cid2 = str(uuid.uuid4()), str(uuid.uuid4())
    rows = [
        {"id": cid1, "parent_id": None, "label": "Biaya", "level": 1},
        {"id": cid2, "parent_id": None, "label": "Kualitas", "level": 1},
    ]
    tree = build_criteria_tree(rows)
    assert cid1 in tree
    assert cid2 in tree
    assert tree[cid1]["children"] == {}


def test_build_criteria_tree_nested():
    cid1 = str(uuid.uuid4())
    cid1a = str(uuid.uuid4())
    rows = [
        {"id": cid1, "parent_id": None, "label": "Biaya", "level": 1},
        {"id": cid1a, "parent_id": cid1, "label": "Biaya Operasional", "level": 2},
    ]
    tree = build_criteria_tree(rows)
    assert cid1a in tree[cid1]["children"]


def test_compute_global_weights_simple():
    # 2 kriteria, 2 alternatif
    cid1, cid2 = str(uuid.uuid4()), str(uuid.uuid4())
    aid1, aid2 = str(uuid.uuid4()), str(uuid.uuid4())
    rows = [
        {"id": cid1, "parent_id": None, "label": "C1", "level": 1},
        {"id": cid2, "parent_id": None, "label": "C2", "level": 1},
    ]
    tree = build_criteria_tree(rows)
    # Kriteria: [0.6, 0.4]
    comparisons_by_node = {None: np.array([0.6, 0.4])}
    # Alternatif per kriteria
    alt_ids = [aid1, aid2]
    alternative_comparisons = {
        cid1: {aid1: 0.7, aid2: 0.3},
        cid2: {aid1: 0.4, aid2: 0.6},
    }
    criteria_ids = [cid1, cid2]
    global_weights = compute_global_weights(tree, comparisons_by_node, alternative_comparisons, criteria_ids, alt_ids)
    # aid1: 0.6*0.7 + 0.4*0.4 = 0.42 + 0.16 = 0.58
    assert abs(global_weights[aid1] - 0.58) < 1e-6
    assert abs(global_weights[aid2] - 0.42) < 1e-6
