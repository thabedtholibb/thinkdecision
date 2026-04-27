import numpy as np


def build_criteria_tree(criteria_rows: list[dict]) -> dict:
    """
    Konversi flat list criteria ke nested dict tree.
    Returns: {id: {label, level, children: {id: {...}}}}
    """
    nodes = {
        row["id"]: {
            "id": row["id"],
            "label": row["label"],
            "level": row["level"],
            "parent_id": row.get("parent_id"),
            "children": {},
        }
        for row in criteria_rows
    }
    tree = {}
    for node_id, node in nodes.items():
        parent_id = node["parent_id"]
        if parent_id is None:
            tree[node_id] = node
        elif parent_id in nodes:
            nodes[parent_id]["children"][node_id] = node
    return tree


def compute_global_weights(
    criteria_tree: dict,
    comparisons_by_node: dict,
    alternative_comparisons: dict,
    criteria_ids: list[str],
    alternative_ids: list[str],
) -> dict[str, float]:
    """
    Hitung global weight tiap alternatif secara rekursif.

    comparisons_by_node: {parent_id_or_None: np.array of weights, indexed by criteria_ids order}
    alternative_comparisons: {criteria_id: {alt_id: weight}}
    criteria_ids: ordered list of top-level criteria ids
    alternative_ids: ordered list of alternative ids

    Returns: {alternative_id: global_weight}
    """
    global_weights = {aid: 0.0 for aid in alternative_ids}

    def _recurse(node_ids: list[str], parent_id, inherited_weight: float):
        priority_vector = comparisons_by_node.get(parent_id)
        if priority_vector is None:
            return
        for i, nid in enumerate(node_ids):
            local_weight = float(priority_vector[i]) * inherited_weight
            node = criteria_tree.get(nid)
            if node and node["children"]:
                # Node ini punya sub-kriteria → recurse
                child_ids = list(node["children"].keys())
                _recurse(child_ids, nid, local_weight)
            else:
                # Leaf node → kalikan dengan bobot alternatif
                alt_weights = alternative_comparisons.get(nid, {})
                for aid in alternative_ids:
                    global_weights[aid] += local_weight * alt_weights.get(aid, 0.0)

    _recurse(criteria_ids, None, 1.0)
    return global_weights
