"""
ANP (Analytic Network Process) Computation Module

Implements true ANP with feedback loops and supermatrix convergence.
Extends AHP to support network structures where criteria can influence each other.

Key Algorithms:
1. Supermatrix Assembly - Build block matrix from all relationships
2. Eigenvalue-based Prioritization - More accurate than normalized average
3. Limit Matrix Convergence - W^∞ = lim(W^k) as k→∞
4. Network Influence Analysis - Betweenness centrality and cascade effects
"""

import numpy as np
from scipy.sparse.linalg import eigs
from typing import Dict, List, Tuple, Optional
from collections import defaultdict, deque
import logging

logger = logging.getLogger(__name__)


# ===========================
# PRIORITY CALCULATION
# ===========================

def compute_priority_eigenvector(matrix: np.ndarray) -> np.ndarray:
    """
    Compute priority vector using the eigenvector method.

    Uses the right eigenvector of the largest eigenvalue.
    More mathematically sound than normalized average, especially for
    inconsistent matrices.

    Args:
        matrix: Pairwise comparison matrix (n × n)

    Returns:
        Normalized priority vector summing to 1.0

    Notes:
        - More accurate for non-ideal matrices
        - Required for ANP convergence
        - Matches Saaty's theoretical foundation
    """
    if matrix.shape[0] == 1:
        return np.array([1.0])

    try:
        # Compute eigenvalues and eigenvectors
        eigenvalues, eigenvectors = np.linalg.eig(matrix.astype(float))

        # Find the largest eigenvalue
        max_idx = np.argmax(eigenvalues.real)

        # Extract corresponding eigenvector (principal eigenvector)
        priority = np.abs(eigenvectors[:, max_idx].real)

        # Normalize to sum = 1.0
        priority_sum = priority.sum()
        if priority_sum > 0:
            priority = priority / priority_sum
        else:
            # Fallback to equal weights if computation fails
            priority = np.ones(matrix.shape[0]) / matrix.shape[0]

        return priority.astype(float)

    except Exception as e:
        logger.warning(f"Eigenvector computation failed: {e}. Using equal weights.")
        return np.ones(matrix.shape[0]) / matrix.shape[0]


# ===========================
# DEPENDENCY GRAPH OPERATIONS
# ===========================

def build_dependency_graph(dependencies: List[Tuple[str, str]]) -> Dict:
    """
    Build adjacency matrix and reachability matrix from dependency list.

    Validates network structure and detects properties like cycles.

    Args:
        dependencies: List of (source_id, target_id) tuples

    Returns:
        {
            'adjacency': Adjacency matrix (1 if edge exists),
            'reachability': Transitive closure (1 if path exists),
            'node_order': Sorted list of unique nodes,
            'has_cycles': Boolean indicating presence of cycles,
            'strongly_connected_components': List of SCCs
        }
    """
    if not dependencies:
        return {
            'adjacency': np.array([]),
            'reachability': np.array([]),
            'node_order': [],
            'has_cycles': False,
            'strongly_connected_components': []
        }

    # Extract unique nodes
    nodes = set()
    for source, target in dependencies:
        nodes.add(source)
        nodes.add(target)

    node_list = sorted(list(nodes))
    node_to_idx = {node: i for i, node in enumerate(node_list)}
    n = len(node_list)

    # Build adjacency matrix
    adjacency = np.zeros((n, n), dtype=int)
    for source, target in dependencies:
        i, j = node_to_idx[source], node_to_idx[target]
        adjacency[i, j] = 1

    # Compute transitive closure (reachability matrix)
    # Using Floyd-Warshall algorithm
    reachability = adjacency.copy().astype(int)
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if reachability[i, k] and reachability[k, j]:
                    reachability[i, j] = 1

    # Detect cycles: if reachability[i, i] > 0, node i is in a cycle
    has_cycles = any(reachability[i, i] > 0 for i in range(n))

    # Find strongly connected components (Tarjan's algorithm)
    sccs = _tarjan_scc(adjacency)

    return {
        'adjacency': adjacency,
        'reachability': reachability,
        'node_order': node_list,
        'has_cycles': has_cycles,
        'strongly_connected_components': sccs,
        'node_to_idx': node_to_idx
    }


def _tarjan_scc(adjacency: np.ndarray) -> List[List[int]]:
    """Find strongly connected components using Tarjan's algorithm"""
    n = adjacency.shape[0]
    index_counter = [0]
    stack = []
    lowlinks = [0] * n
    index = [0] * n
    on_stack = [False] * n
    index_initialized = [False] * n
    sccs = []

    def strongconnect(v):
        index[v] = index_counter[0]
        lowlinks[v] = index_counter[0]
        index_counter[0] += 1
        index_initialized[v] = True
        stack.append(v)
        on_stack[v] = True

        # Consider successors of v
        for w in range(n):
            if adjacency[v, w]:  # Edge from v to w
                if not index_initialized[w]:
                    strongconnect(w)
                    lowlinks[v] = min(lowlinks[v], lowlinks[w])
                elif on_stack[w]:
                    lowlinks[v] = min(lowlinks[v], index[w])

        # If v is a root node, pop the stack and generate SCC
        if lowlinks[v] == index[v]:
            component = []
            while True:
                w = stack.pop()
                on_stack[w] = False
                component.append(w)
                if w == v:
                    break
            sccs.append(component)

    for v in range(n):
        if not index_initialized[v]:
            strongconnect(v)

    return sccs


# ===========================
# SUPERMATRIX ASSEMBLY
# ===========================

def assemble_supermatrix(
    element_list: List[Dict],  # [{id, type: 'criterion'|'alternative', ...}]
    comparisons_by_pair: Dict[Tuple[str, str], np.ndarray],  # {(source, target): priority_vector}
    dependencies: List[Tuple[str, str]]
) -> np.ndarray:
    """
    Assemble n×n supermatrix from pairwise comparison matrices.

    The supermatrix has block structure:
    W[i,j] = priority vector of element i with respect to element j

    For ANP:
    - Only populate blocks where dependencies exist
    - For ANP with all-pairs: populate all blocks

    Args:
        element_list: All elements (criteria + alternatives)
        comparisons_by_pair: Pre-computed priority vectors for all pairs
        dependencies: Feedback relationships (for validation)

    Returns:
        Supermatrix (n × n) ready for convergence
    """
    n = len(element_list)
    element_to_idx = {elem['id']: i for i, elem in enumerate(element_list)}

    supermatrix = np.zeros((n, n), dtype=float)

    # Populate supermatrix from comparisons
    for (source_id, target_id), priority_vector in comparisons_by_pair.items():
        if source_id in element_to_idx and target_id in element_to_idx:
            source_idx = element_to_idx[source_id]
            target_idx = element_to_idx[target_id]

            # Column target_idx contains priorities from source perspective
            # (standard ANP notation: column stochastic)
            if len(priority_vector) == n:
                supermatrix[:, target_idx] = priority_vector

    return supermatrix


# ===========================
# CONVERGENCE CALCULATION
# ===========================

def compute_limit_matrix(
    supermatrix: np.ndarray,
    max_iterations: int = 1000,
    convergence_threshold: float = 1e-6
) -> Tuple[np.ndarray, int, bool, float]:
    """
    Compute the limit matrix W^∞ by raising W to successive powers.

    W^k converges to a stable matrix where each column contains the
    final synthesized priorities.

    Args:
        supermatrix: Initial supermatrix (n × n)
        max_iterations: Maximum power iterations
        convergence_threshold: Residual threshold for convergence

    Returns:
        (limit_matrix, iterations, converged, final_residual)
        - limit_matrix: W^∞
        - iterations: How many multiplications were performed
        - converged: Whether convergence was achieved
        - final_residual: |W^k - W^(k-1)| at end
    """
    W_current = supermatrix.copy().astype(float)
    W_previous = np.zeros_like(W_current)

    for iteration in range(max_iterations):
        # Calculate residual
        residual = np.max(np.abs(W_current - W_previous))

        if residual < convergence_threshold:
            logger.info(f"Convergence achieved at iteration {iteration + 1}, residual: {residual:.2e}")
            return W_current, iteration + 1, True, residual

        # W^(k+1) = W × W^k
        W_previous = W_current.copy()
        W_current = np.dot(supermatrix, W_current)

        if iteration % 100 == 0:
            logger.debug(f"Iteration {iteration}: residual = {residual:.2e}")

    # Did not converge within max_iterations
    final_residual = np.max(np.abs(W_current - W_previous))
    logger.warning(f"Did not converge within {max_iterations} iterations. Final residual: {final_residual:.2e}")

    return W_current, max_iterations, False, final_residual


# ===========================
# PRIORITY EXTRACTION
# ===========================

def extract_anp_priorities(
    limit_matrix: np.ndarray,
    element_list: List[Dict],
    alternative_indices: List[int]
) -> Dict[str, float]:
    """
    Extract final ANP priorities from the limit matrix.

    In the limit matrix, each column stabilizes to a single value
    that represents the synthesized weight of that element.

    For ranking alternatives, we use the final column values.

    Args:
        limit_matrix: Converged limit matrix W^∞
        element_list: All elements [{id, type, ...}]
        alternative_indices: Indices of alternatives in element_list

    Returns:
        {alternative_id: final_weight}
    """
    priorities = {}

    # Average the limit matrix columns to get final weights
    # (all columns converge to the same value in limit matrix)
    final_weights = np.mean(limit_matrix, axis=1)

    # Normalize
    total = np.sum(final_weights)
    if total > 0:
        final_weights = final_weights / total
    else:
        # Fallback: equal weights
        final_weights = np.ones(len(element_list)) / len(element_list)

    # Extract alternative weights
    for idx in alternative_indices:
        if idx < len(element_list):
            elem = element_list[idx]
            priorities[elem['id']] = float(final_weights[idx])

    return priorities


# ===========================
# NETWORK INFLUENCE ANALYSIS
# ===========================

def calculate_network_influence(
    dependencies: List[Tuple[str, str]],
    criteria_ids: List[str]
) -> Dict[str, float]:
    """
    Calculate which criteria have most influence in the network.

    Uses betweenness centrality: how many shortest paths pass through
    each node. Higher = more influential in connecting others.

    Args:
        dependencies: Feedback relationships
        criteria_ids: List of criterion IDs

    Returns:
        {criterion_id: influence_score (0-1)}
    """
    if not dependencies:
        # No dependencies: equal influence
        return {cid: 1.0 / len(criteria_ids) for cid in criteria_ids}

    # Build adjacency list
    graph = defaultdict(list)
    all_nodes = set(criteria_ids)

    for source, target in dependencies:
        graph[source].append(target)
        all_nodes.add(source)
        all_nodes.add(target)

    # Compute betweenness centrality for each criterion
    centrality = {node: 0.0 for node in all_nodes}

    for source in all_nodes:
        # BFS from source to find shortest paths
        distances = {source: 0}
        predecessors = defaultdict(list)
        queue = deque([source])

        while queue:
            v = queue.popleft()
            for w in graph[v]:
                if w not in distances:
                    distances[w] = distances[v] + 1
                    queue.append(w)
                if distances[w] == distances[v] + 1:
                    predecessors[w].append(v)

        # Count paths through each node
        dependency = {node: 0 for node in all_nodes}
        dependency[source] = 1

        for node in sorted(all_nodes, key=lambda x: distances.get(x, float('inf')), reverse=True):
            if node != source:
                for pred in predecessors[node]:
                    dependency[node] += dependency[pred]

        # Accumulate dependencies into centrality scores
        for node in all_nodes:
            if node != source:
                centrality[node] += dependency[node]

    # Normalize centrality scores
    total = sum(centrality.values())
    if total > 0:
        return {node: centrality[node] / total for node in centrality}
    else:
        return {node: 1.0 / len(centrality) for node in centrality}


# ===========================
# VALIDATION
# ===========================

def validate_network(graph_data: Dict) -> Tuple[bool, str]:
    """
    Validate network structure for ANP computation.

    Args:
        graph_data: Output from build_dependency_graph()

    Returns:
        (is_valid, message)
    """
    if graph_data['has_cycles']:
        return False, "Network contains cycles - not a valid hierarchy or pure network"

    n = graph_data['adjacency'].shape[0]
    if n == 0:
        return False, "No criteria or relationships defined"

    # Check for disconnected components (warning, not error)
    # This is valid in ANP but may indicate incomplete definition

    return True, "Network structure is valid for ANP computation"


# ===========================
# EXPORTS
# ===========================

__all__ = [
    'compute_priority_eigenvector',
    'build_dependency_graph',
    'assemble_supermatrix',
    'compute_limit_matrix',
    'extract_anp_priorities',
    'calculate_network_influence',
    'validate_network'
]
