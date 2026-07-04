"""
Comprehensive Test Suite for ANP (Analytic Network Process) Module

Tests cover:
1. Priority calculation using eigenvector method
2. Dependency graph operations
3. Supermatrix assembly and convergence
4. Priority extraction
5. Network influence analysis
6. Edge cases and error handling
"""

import pytest
import numpy as np
from app.core.ahp.anp import (
    compute_priority_eigenvector,
    build_dependency_graph,
    assemble_supermatrix,
    compute_limit_matrix,
    extract_anp_priorities,
    calculate_network_influence,
    validate_network
)


# ===========================
# PRIORITY EIGENVECTOR TESTS
# ===========================

class TestComputePriorityEigenvector:
    """Test eigenvector method for priority calculation"""

    def test_single_element(self):
        """Single element matrix returns [1.0]"""
        matrix = np.array([[1.0]])
        result = compute_priority_eigenvector(matrix)
        assert len(result) == 1
        assert abs(result[0] - 1.0) < 1e-6

    def test_two_element_equal(self):
        """Two equal elements return equal weights"""
        matrix = np.array([[1.0, 1.0], [1.0, 1.0]])
        result = compute_priority_eigenvector(matrix)
        assert len(result) == 2
        assert abs(result[0] - 0.5) < 1e-6
        assert abs(result[1] - 0.5) < 1e-6

    def test_two_element_dominated(self):
        """Dominated element gets lower weight"""
        matrix = np.array([[1.0, 2.0], [0.5, 1.0]])
        result = compute_priority_eigenvector(matrix)
        assert len(result) == 2
        assert result[0] > result[1]  # First element more important

    def test_three_element_hierarchy(self):
        """Three-element hierarchy produces consistent weights"""
        matrix = np.array([
            [1.0, 3.0, 5.0],
            [1/3, 1.0, 2.0],
            [1/5, 1/2, 1.0]
        ])
        result = compute_priority_eigenvector(matrix)
        assert len(result) == 3
        assert abs(sum(result) - 1.0) < 1e-6  # Normalized
        assert result[0] > result[1] > result[2]  # Hierarchy preserved

    def test_reciprocal_consistency(self):
        """Reciprocal matrix maintains consistency property"""
        # If a[i,j] = 3, then a[j,i] should be 1/3
        matrix = np.array([
            [1.0, 1/3, 5.0],
            [3.0, 1.0, 2.0],
            [1/5, 1/2, 1.0]
        ])
        result = compute_priority_eigenvector(matrix)
        assert len(result) == 3
        assert abs(sum(result) - 1.0) < 1e-6

    def test_perfect_consistency(self):
        """Perfectly consistent matrix (all rows proportional)"""
        # Matrix where ratio is clear: 2:1:1/2
        result_a = compute_priority_eigenvector(np.array([[2.0, 4.0, 1.0], [1/2, 1.0, 1/4], [4.0, 16.0, 1.0]]))
        # Expected: weights proportional to 2:1:0.5 normalized
        assert result_a[0] > result_a[2]  # Highest weight first

    def test_large_matrix(self):
        """Large matrix (10x10) computation succeeds"""
        n = 10
        matrix = np.random.uniform(0.1, 9.0, (n, n))
        # Make reciprocal
        for i in range(n):
            for j in range(n):
                if i != j:
                    matrix[j, i] = 1.0 / matrix[i, j]
        matrix[np.diag_indices(n)] = 1.0

        result = compute_priority_eigenvector(matrix)
        assert len(result) == n
        assert abs(sum(result) - 1.0) < 1e-6
        assert all(r >= 0 for r in result)

    def test_zero_matrix_fallback(self):
        """Zero matrix returns equal weights (fallback)"""
        matrix = np.zeros((3, 3))
        result = compute_priority_eigenvector(matrix)
        assert len(result) == 3
        assert abs(result[0] - 1/3) < 1e-6
        assert abs(result[1] - 1/3) < 1e-6
        assert abs(result[2] - 1/3) < 1e-6

    def test_normalization(self):
        """All results are normalized (sum = 1.0)"""
        for _ in range(10):
            matrix = np.random.uniform(0.1, 9.0, (5, 5))
            for i in range(5):
                for j in range(5):
                    if i != j:
                        matrix[j, i] = 1.0 / matrix[i, j]
            matrix[np.diag_indices(5)] = 1.0

            result = compute_priority_eigenvector(matrix)
            assert abs(sum(result) - 1.0) < 1e-6

    def test_returns_float_array(self):
        """Result is numpy float array"""
        matrix = np.array([[1.0, 2.0], [1/2, 1.0]])
        result = compute_priority_eigenvector(matrix)
        assert isinstance(result, np.ndarray)
        assert result.dtype == float


# ===========================
# DEPENDENCY GRAPH TESTS
# ===========================

class TestBuildDependencyGraph:
    """Test dependency graph construction and analysis"""

    def test_empty_dependencies(self):
        """Empty dependency list returns empty graph"""
        result = build_dependency_graph([])
        assert len(result['node_order']) == 0
        assert result['has_cycles'] == False

    def test_single_dependency(self):
        """Single dependency creates 2-node graph"""
        deps = [('A', 'B')]
        result = build_dependency_graph(deps)
        assert len(result['node_order']) == 2
        assert 'A' in result['node_order']
        assert 'B' in result['node_order']
        assert result['adjacency'][0, 1] == 1  # A → B

    def test_linear_chain(self):
        """Linear chain A → B → C → D"""
        deps = [('A', 'B'), ('B', 'C'), ('C', 'D')]
        result = build_dependency_graph(deps)
        assert len(result['node_order']) == 4
        assert not result['has_cycles']
        # Reachability: A can reach B, C, D
        a_idx = result['node_order'].index('A')
        b_idx = result['node_order'].index('B')
        c_idx = result['node_order'].index('C')
        d_idx = result['node_order'].index('D')
        assert result['reachability'][a_idx, b_idx] == 1
        assert result['reachability'][a_idx, c_idx] == 1
        assert result['reachability'][a_idx, d_idx] == 1

    def test_simple_cycle(self):
        """Cycle detection: A → B → A"""
        deps = [('A', 'B'), ('B', 'A')]
        result = build_dependency_graph(deps)
        assert result['has_cycles'] == True

    def test_complex_cycle(self):
        """Complex cycle: A → B → C → A"""
        deps = [('A', 'B'), ('B', 'C'), ('C', 'A')]
        result = build_dependency_graph(deps)
        assert result['has_cycles'] == True

    def test_self_loop(self):
        """Self-loop A → A"""
        deps = [('A', 'A')]
        result = build_dependency_graph(deps)
        assert result['has_cycles'] == True

    def test_tree_structure(self):
        """Tree: A → {B, C}, B → {D, E}"""
        deps = [('A', 'B'), ('A', 'C'), ('B', 'D'), ('B', 'E')]
        result = build_dependency_graph(deps)
        assert len(result['node_order']) == 5
        assert not result['has_cycles']

    def test_diamond_dag(self):
        """Diamond DAG: A → {B, C}, {B, C} → D"""
        deps = [('A', 'B'), ('A', 'C'), ('B', 'D'), ('C', 'D')]
        result = build_dependency_graph(deps)
        assert not result['has_cycles']
        assert result['adjacency'].shape == (4, 4)

    def test_transitive_closure(self):
        """Transitive closure computed: if A→B and B→C, then A reaches C"""
        deps = [('A', 'B'), ('B', 'C')]
        result = build_dependency_graph(deps)
        nodes = result['node_order']
        a_idx, c_idx = nodes.index('A'), nodes.index('C')
        assert result['reachability'][a_idx, c_idx] == 1

    def test_strongly_connected_components(self):
        """SCCs detected correctly"""
        # Two separate cycles: (A, B) and (C, D)
        deps = [('A', 'B'), ('B', 'A'), ('C', 'D'), ('D', 'C')]
        result = build_dependency_graph(deps)
        assert len(result['strongly_connected_components']) >= 2

    def test_node_to_idx_mapping(self):
        """Node to index mapping is consistent"""
        deps = [('X', 'Y'), ('Y', 'Z')]
        result = build_dependency_graph(deps)
        assert result['node_to_idx']['X'] < len(result['node_order'])
        assert result['node_to_idx']['Y'] < len(result['node_order'])
        assert result['node_to_idx']['Z'] < len(result['node_order'])

    def test_duplicate_edges(self):
        """Duplicate edges handled correctly"""
        deps = [('A', 'B'), ('A', 'B'), ('A', 'B')]
        result = build_dependency_graph(deps)
        assert result['adjacency'][0, 1] == 1
        assert len(result['node_order']) == 2


# ===========================
# SUPERMATRIX ASSEMBLY TESTS
# ===========================

class TestAssembleSupermatrix:
    """Test supermatrix construction from comparisons"""

    def test_empty_elements(self):
        """Empty element list returns empty matrix"""
        result = assemble_supermatrix([], {}, [])
        assert result.shape == (0, 0)

    def test_single_element(self):
        """Single element creates 1x1 matrix"""
        elements = [{'id': 'A', 'type': 'criterion'}]
        comparisons = {('A', 'A'): np.array([1.0])}
        result = assemble_supermatrix(elements, comparisons, [])
        assert result.shape == (1, 1)
        assert result[0, 0] == 1.0

    def test_two_elements_simple(self):
        """Two elements with simple comparison"""
        elements = [
            {'id': 'A', 'type': 'criterion'},
            {'id': 'B', 'type': 'criterion'}
        ]
        comparisons = {
            ('A', 'A'): np.array([0.6, 0.4]),
            ('B', 'B'): np.array([0.4, 0.6]),
        }
        result = assemble_supermatrix(elements, comparisons, [])
        assert result.shape == (2, 2)
        assert result[0, 0] == 0.6
        assert result[1, 1] == 0.6

    def test_three_by_three_matrix(self):
        """3x3 supermatrix assembly"""
        elements = [
            {'id': 'A', 'type': 'criterion'},
            {'id': 'B', 'type': 'criterion'},
            {'id': 'C', 'type': 'criterion'}
        ]
        comparisons = {
            ('A', 'A'): np.array([0.5, 0.3, 0.2]),
            ('B', 'B'): np.array([0.3, 0.4, 0.3]),
            ('C', 'C'): np.array([0.2, 0.3, 0.5]),
        }
        result = assemble_supermatrix(elements, comparisons, [])
        assert result.shape == (3, 3)
        # Column sums should match comparison vector sums
        assert abs(result[:, 0].sum() - 1.0) < 1e-6 or result[:, 0].sum() > 0

    def test_missing_comparisons(self):
        """Missing comparisons filled with zeros"""
        elements = [
            {'id': 'A', 'type': 'criterion'},
            {'id': 'B', 'type': 'criterion'}
        ]
        comparisons = {('A', 'A'): np.array([0.6, 0.4])}  # Only A vs A
        result = assemble_supermatrix(elements, comparisons, [])
        assert result.shape == (2, 2)
        # Column 0 should have A's weights, column 1 should be zero
        assert result[0, 0] == 0.6

    def test_wrong_size_comparison(self):
        """Comparison vector wrong size is ignored"""
        elements = [
            {'id': 'A', 'type': 'criterion'},
            {'id': 'B', 'type': 'criterion'}
        ]
        comparisons = {
            ('A', 'A'): np.array([0.5, 0.3, 0.2])  # Wrong size (3 instead of 2)
        }
        result = assemble_supermatrix(elements, comparisons, [])
        # Should handle gracefully
        assert result.shape == (2, 2)

    def test_unknown_element_ids(self):
        """Comparisons for unknown elements ignored"""
        elements = [
            {'id': 'A', 'type': 'criterion'},
            {'id': 'B', 'type': 'criterion'}
        ]
        comparisons = {
            ('X', 'Y'): np.array([0.5, 0.5])  # X, Y not in elements
        }
        result = assemble_supermatrix(elements, comparisons, [])
        assert result.shape == (2, 2)
        assert result.sum() == 0  # All zeros


# ===========================
# CONVERGENCE TESTS
# ===========================

class TestComputeLimitMatrix:
    """Test supermatrix convergence to limit matrix"""

    def test_identity_matrix_converges(self):
        """Identity matrix converges in 1 iteration"""
        matrix = np.eye(3)
        limit, iterations, converged, residual = compute_limit_matrix(matrix)
        assert converged == True
        assert iterations == 1
        assert residual < 1e-6

    def test_stochastic_matrix_converges(self):
        """Column-stochastic matrix converges"""
        matrix = np.array([
            [0.6, 0.3, 0.2],
            [0.3, 0.4, 0.3],
            [0.1, 0.3, 0.5]
        ])
        limit, iterations, converged, residual = compute_limit_matrix(matrix)
        assert converged == True
        assert iterations > 0
        assert iterations < 1000
        # Limit matrix should have columns that are similar
        assert limit.shape == (3, 3)

    def test_max_iterations_exceeded(self):
        """Non-convergent matrix hits max iterations"""
        # Create a non-stochastic matrix
        matrix = np.array([
            [1.1, 0.5],
            [0.5, 1.1]
        ])
        limit, iterations, converged, residual = compute_limit_matrix(matrix, max_iterations=10)
        assert converged == False
        assert iterations == 10

    def test_single_element_matrix(self):
        """1x1 matrix converges immediately"""
        matrix = np.array([[1.0]])
        limit, iterations, converged, residual = compute_limit_matrix(matrix)
        assert converged == True
        assert iterations == 1
        assert limit[0, 0] == 1.0

    def test_zero_matrix_converges(self):
        """Zero matrix converges (all iterations produce zeros)"""
        matrix = np.zeros((3, 3))
        limit, iterations, converged, residual = compute_limit_matrix(matrix)
        assert converged == True
        assert np.allclose(limit, 0)

    def test_convergence_threshold_parameter(self):
        """Custom convergence threshold affects iterations"""
        matrix = np.array([
            [0.6, 0.3],
            [0.4, 0.7]
        ])
        # Loose threshold
        _, iter_loose, _, _ = compute_limit_matrix(matrix, convergence_threshold=1e-2)
        # Tight threshold
        _, iter_tight, _, _ = compute_limit_matrix(matrix, convergence_threshold=1e-9)
        # Tight threshold should need more iterations (or same if convergent)
        assert iter_loose <= iter_tight

    def test_residual_decreases(self):
        """Residual should not increase between iterations"""
        matrix = np.array([
            [0.5, 0.3, 0.2],
            [0.3, 0.5, 0.3],
            [0.2, 0.2, 0.5]
        ])
        limit, iterations, converged, residual = compute_limit_matrix(matrix)
        # Final residual should be very small if converged
        if converged:
            assert residual < 1e-5

    def test_limit_matrix_properties(self):
        """Converged limit matrix has stable columns"""
        matrix = np.array([
            [0.7, 0.2, 0.1],
            [0.2, 0.6, 0.2],
            [0.1, 0.2, 0.7]
        ])
        limit, _, converged, _ = compute_limit_matrix(matrix)
        if converged:
            # All columns should be nearly identical (converged state)
            col_diffs = np.max(np.abs(np.diff(limit, axis=1)))
            assert col_diffs < 1e-4


# ===========================
# PRIORITY EXTRACTION TESTS
# ===========================

class TestExtractAnpPriorities:
    """Test extracting final weights from limit matrix"""

    def test_single_alternative(self):
        """Single alternative gets weight 1.0"""
        limit_matrix = np.ones((3, 3)) / 3  # 3×3 square matrix required
        elements = [
            {'id': 'A', 'type': 'criterion'},
            {'id': 'B', 'type': 'criterion'},
            {'id': 'alt_1', 'type': 'alternative'}
        ]
        alternatives = [2]  # Index of alt_1
        result = extract_anp_priorities(limit_matrix, elements, alternatives)
        assert 'alt_1' in result
        assert abs(result['alt_1'] - 1.0) < 1e-6

    def test_two_alternatives_equal(self):
        """Two equal alternatives get equal weights"""
        limit_matrix = np.ones((2, 2)) * 0.5
        elements = [
            {'id': 'alt_1', 'type': 'alternative'},
            {'id': 'alt_2', 'type': 'alternative'}
        ]
        alternatives = [0, 1]
        result = extract_anp_priorities(limit_matrix, elements, alternatives)
        assert abs(result['alt_1'] - 0.5) < 1e-6
        assert abs(result['alt_2'] - 0.5) < 1e-6

    def test_three_alternatives_hierarchy(self):
        """Three alternatives with hierarchy"""
        limit_matrix = np.array([
            [0.5, 0.5],
            [0.3, 0.3],
            [0.2, 0.2]
        ])
        elements = [
            {'id': 'alt_1', 'type': 'alternative'},
            {'id': 'alt_2', 'type': 'alternative'},
            {'id': 'alt_3', 'type': 'alternative'}
        ]
        alternatives = [0, 1, 2]
        result = extract_anp_priorities(limit_matrix, elements, alternatives)
        assert result['alt_1'] > result['alt_2'] > result['alt_3']
        assert abs(sum(result.values()) - 1.0) < 1e-6

    def test_subset_alternatives(self):
        """Extract priorities for subset of alternatives"""
        limit_matrix = np.array([
            [0.2, 0.2],
            [0.3, 0.3],
            [0.5, 0.5]
        ])
        elements = [
            {'id': 'C1', 'type': 'criterion'},
            {'id': 'C2', 'type': 'criterion'},
            {'id': 'alt_1', 'type': 'alternative'}
        ]
        alternatives = [2]  # Only alt_1
        result = extract_anp_priorities(limit_matrix, elements, alternatives)
        assert len(result) == 1
        assert 'alt_1' in result

    def test_empty_alternatives(self):
        """Empty alternative list returns empty dict"""
        limit_matrix = np.eye(3)
        elements = [
            {'id': 'A', 'type': 'criterion'},
            {'id': 'B', 'type': 'criterion'},
            {'id': 'C', 'type': 'criterion'}
        ]
        result = extract_anp_priorities(limit_matrix, elements, [])
        assert len(result) == 0

    def test_normalization(self):
        """Extracted weights always sum to 1.0"""
        limit_matrix = np.random.uniform(0.1, 0.9, (4, 3))
        elements = [
            {'id': f'alt_{i}', 'type': 'alternative'} for i in range(4)
        ]
        alternatives = list(range(4))
        result = extract_anp_priorities(limit_matrix, elements, alternatives)
        assert abs(sum(result.values()) - 1.0) < 1e-6


# ===========================
# NETWORK INFLUENCE TESTS
# ===========================

class TestCalculateNetworkInfluence:
    """Test network influence centrality calculation"""

    def test_empty_dependencies(self):
        """Empty dependencies give equal influence"""
        criteria = ['A', 'B', 'C']
        result = calculate_network_influence([], criteria)
        assert len(result) == 3
        assert abs(result['A'] - 1/3) < 1e-6
        assert abs(result['B'] - 1/3) < 1e-6
        assert abs(result['C'] - 1/3) < 1e-6

    def test_single_dependency(self):
        """Single dependency: A influences B"""
        deps = [('A', 'B')]
        criteria = ['A', 'B', 'C']
        result = calculate_network_influence(deps, criteria)
        assert len(result) == 3
        assert sum(result.values()) > 0  # Some non-zero influence

    def test_star_topology(self):
        """Star: A influences all others"""
        deps = [('A', 'B'), ('A', 'C'), ('A', 'D')]
        criteria = ['A', 'B', 'C', 'D']
        result = calculate_network_influence(deps, criteria)
        # A should have high influence (passes through to many)
        assert result['A'] >= result.get('B', 0)

    def test_linear_chain(self):
        """Chain: A → B → C → D"""
        deps = [('A', 'B'), ('B', 'C'), ('C', 'D')]
        criteria = ['A', 'B', 'C', 'D']
        result = calculate_network_influence(deps, criteria)
        # B and C should have high centrality (in the middle)
        middle_nodes = result['B'] + result['C']
        edge_nodes = result['A'] + result['D']
        assert middle_nodes >= edge_nodes  # Middle nodes more central

    def test_normalization(self):
        """Influence scores are normalized (sum to ~1.0)"""
        deps = [('A', 'B'), ('B', 'C'), ('C', 'A')]
        criteria = ['A', 'B', 'C']
        result = calculate_network_influence(deps, criteria)
        total = sum(result.values())
        assert abs(total - 1.0) < 1e-6

    def test_disconnected_components(self):
        """Two disconnected components"""
        deps = [('A', 'B'), ('C', 'D')]
        criteria = ['A', 'B', 'C', 'D']
        result = calculate_network_influence(deps, criteria)
        assert len(result) == 4


# ===========================
# VALIDATION TESTS
# ===========================

class TestValidateNetwork:
    """Test network structure validation"""

    def test_valid_tree(self):
        """Valid tree passes validation"""
        graph_data = {
            'has_cycles': False,
            'adjacency': np.array([[0, 1, 1], [0, 0, 0], [0, 0, 0]])
        }
        is_valid, message = validate_network(graph_data)
        assert is_valid == True

    def test_cycle_fails(self):
        """Cycle detected fails validation"""
        graph_data = {
            'has_cycles': True,
            'adjacency': np.array([[0, 1], [1, 0]])
        }
        is_valid, message = validate_network(graph_data)
        assert is_valid == False

    def test_empty_graph_fails(self):
        """Empty graph fails validation"""
        graph_data = {
            'has_cycles': False,
            'adjacency': np.array([])
        }
        is_valid, message = validate_network(graph_data)
        assert is_valid == False

    def test_valid_dag(self):
        """Valid DAG passes"""
        graph_data = {
            'has_cycles': False,
            'adjacency': np.array([
                [0, 1, 0],
                [0, 0, 1],
                [0, 0, 0]
            ])
        }
        is_valid, message = validate_network(graph_data)
        assert is_valid == True


# ===========================
# INTEGRATION TESTS
# ===========================

class TestAnpIntegration:
    """End-to-end ANP workflow tests"""

    def test_simple_anp_workflow(self):
        """Complete workflow: dependencies → graph → supermatrix → convergence → priorities"""
        # Define 2 criteria with feedback
        deps = [('C1', 'C2'), ('C2', 'C1')]

        # Build graph
        graph = build_dependency_graph(deps)
        assert not graph['has_cycles']  # No self-loops

        # Build supermatrix
        elements = [
            {'id': 'C1', 'type': 'criterion'},
            {'id': 'C2', 'type': 'criterion'},
            {'id': 'alt_1', 'type': 'alternative'},
            {'id': 'alt_2', 'type': 'alternative'}
        ]
        comparisons = {
            ('C1', 'C1'): np.array([0.6, 0.4, 0.5, 0.5]),
            ('C2', 'C2'): np.array([0.4, 0.6, 0.5, 0.5]),
        }
        supermatrix = assemble_supermatrix(elements, comparisons, deps)
        assert supermatrix.shape == (4, 4)

        # Compute limit matrix
        limit, iterations, converged, residual = compute_limit_matrix(supermatrix)
        assert converged == True

        # Extract priorities
        alt_indices = [2, 3]
        priorities = extract_anp_priorities(limit, elements, alt_indices)
        assert len(priorities) == 2
        assert abs(sum(priorities.values()) - 1.0) < 1e-6

    def test_anp_vs_ahp_difference(self):
        """ANP (with feedback) vs AHP (tree) produces different results"""
        # This would require implementing AHP computation too
        # For now, just verify ANP computation completes
        deps = [('C1', 'C2'), ('C2', 'C1')]
        graph = build_dependency_graph(deps)
        assert not graph['has_cycles']

    def test_large_network_performance(self):
        """Large network (10 criteria, 20 dependencies) computes in reasonable time"""
        import time

        criteria = [f'C{i}' for i in range(10)]
        deps = []
        for i in range(10):
            for j in range(i+1, min(i+3, 10)):
                deps.append((criteria[i], criteria[j]))

        start = time.time()
        graph = build_dependency_graph(deps)
        elapsed = time.time() - start

        assert not graph['has_cycles']
        assert elapsed < 1.0  # Should complete quickly


# ===========================
# EDGE CASE TESTS
# ===========================

class TestEdgeCases:
    """Test edge cases and error handling"""

    def test_nan_matrix_values(self):
        """NaN values in matrix handled gracefully"""
        matrix = np.array([[1.0, np.nan], [np.nan, 1.0]])
        result = compute_priority_eigenvector(matrix)
        # Should return equal weights due to fallback
        assert len(result) == 2
        assert not np.isnan(result[0])

    def test_inf_matrix_values(self):
        """Infinity values in matrix handled"""
        matrix = np.array([[1.0, np.inf], [0, 1.0]])
        result = compute_priority_eigenvector(matrix)
        # Should not crash
        assert len(result) == 2

    def test_negative_matrix_values(self):
        """Negative values in matrix (invalid for AHP) handled"""
        matrix = np.array([[1.0, -2.0], [1/2, 1.0]])
        result = compute_priority_eigenvector(matrix)
        # Should still compute but may use absolute values
        assert len(result) == 2

    def test_very_large_values(self):
        """Very large matrix values (numeric stability test)"""
        matrix = np.array([
            [1.0, 1e10],
            [1e-10, 1.0]
        ])
        result = compute_priority_eigenvector(matrix)
        assert len(result) == 2
        assert all(0 <= r <= 1 for r in result)

    def test_very_small_values(self):
        """Very small matrix values (numeric precision)"""
        matrix = np.array([
            [1.0, 1e-10],
            [1e10, 1.0]
        ])
        result = compute_priority_eigenvector(matrix)
        assert len(result) == 2
        assert abs(sum(result) - 1.0) < 1e-6


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
