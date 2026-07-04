"""
Migration: Add ANP (Analytic Network Process) support to Think Decision

Enables true ANP with feedback loops by:
1. Creating criteria_dependencies table for network relationships
2. Extending comparisons table to support all relationship types
3. Creating supermatrices table for convergence results
4. Adding ANP fields to cases and aggregated_results tables
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# Revision identifiers
revision = '003_add_anp_support'
down_revision = '002_add_conflict_tracking'
branch_labels = None
depends_on = None


def upgrade():
    """Add ANP support to database schema"""

    # ===========================
    # 1. CREATE DEPENDENCIES TABLE
    # ===========================

    op.create_table(
        'criteria_dependencies',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('case_id', sa.UUID(), nullable=False),
        sa.Column('source_id', sa.UUID(), nullable=False, comment='Criterion that influences'),
        sa.Column('target_id', sa.UUID(), nullable=False, comment='Criterion being influenced'),
        sa.Column('feedback_type', sa.String(20), nullable=False, default='moderate',
                 comment='Relationship strength: strong|moderate|weak'),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id'], ),
        sa.ForeignKeyConstraint(['source_id'], ['criteria.id'], ),
        sa.ForeignKeyConstraint(['target_id'], ['criteria.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('case_id', 'source_id', 'target_id',
                           name='uq_dependencies_per_case'),
        comment='Network relationships for ANP (Analytic Network Process)'
    )

    # Index for quick dependency lookup
    op.create_index(
        'idx_criteria_dependencies_case',
        'criteria_dependencies',
        ['case_id']
    )

    # Index for finding all outgoing dependencies from a criterion
    op.create_index(
        'idx_criteria_dependencies_source',
        'criteria_dependencies',
        ['source_id']
    )

    # Index for finding all incoming dependencies to a criterion
    op.create_index(
        'idx_criteria_dependencies_target',
        'criteria_dependencies',
        ['target_id']
    )

    # ===========================
    # 2. CREATE SUPERMATRICES TABLE
    # ===========================

    op.create_table(
        'supermatrices',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('case_id', sa.UUID(), nullable=False),
        sa.Column('method', sa.String(20), nullable=False, comment='AHP|ANP'),
        sa.Column('supermatrix_data', postgresql.JSONB(), nullable=True,
                 comment='Full n×n supermatrix before convergence'),
        sa.Column('limit_matrix', postgresql.JSONB(), nullable=True,
                 comment='Converged limit matrix (W^∞)'),
        sa.Column('convergence_iterations', sa.Integer(), nullable=True,
                 comment='Number of iterations to converge'),
        sa.Column('convergence_achieved', sa.Boolean(), nullable=True,
                 comment='Whether convergence threshold was reached'),
        sa.Column('convergence_threshold', sa.Float(), nullable=True, default=1e-6),
        sa.Column('residual_final', sa.Float(), nullable=True,
                 comment='Final residual |W^k - W^(k-1)|'),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('case_id', 'method', name='uq_supermatrix_per_case_method'),
        comment='Supermatrix data and convergence results for ANP'
    )

    op.create_index(
        'idx_supermatrices_case',
        'supermatrices',
        ['case_id']
    )

    # ===========================
    # 3. EXTEND COMPARISONS TABLE
    # ===========================

    # Add column to distinguish comparison types
    op.add_column(
        'comparisons',
        sa.Column('comparison_type', sa.String(50), nullable=True, default='alternative_vs_criteria',
                 comment='Type: alternative_vs_criteria|criteria_vs_criteria|cluster_vs_cluster')
    )

    # Add field to track if this is a network comparison (for ANP)
    op.add_column(
        'comparisons',
        sa.Column('is_network_comparison', sa.Boolean(), nullable=False, default=False,
                 comment='True if this comparison is part of ANP network (criteria vs criteria)')
    )

    # Index for finding all network comparisons
    op.create_index(
        'idx_comparisons_network',
        'comparisons',
        ['case_id', 'is_network_comparison'],
        postgresql_where=sa.text('is_network_comparison = true')
    )

    # ===========================
    # 4. EXTEND CASES TABLE
    # ===========================

    op.add_column(
        'cases',
        sa.Column('method', sa.String(20), nullable=False, default='AHP',
                 comment='Analysis method: AHP|ANP|FUZZY_AHP|FUZZY_ANP')
    )

    op.add_column(
        'cases',
        sa.Column('has_network_dependencies', sa.Boolean(), nullable=False, default=False,
                 comment='Whether case has ANP feedback relationships defined')
    )

    op.add_column(
        'cases',
        sa.Column('anp_convergence_achieved', sa.Boolean(), nullable=True,
                 comment='Whether ANP computation converged to threshold')
    )

    op.add_column(
        'cases',
        sa.Column('anp_convergence_iterations', sa.Integer(), nullable=True,
                 comment='How many iterations ANP took to converge')
    )

    op.add_column(
        'cases',
        sa.Column('priority_calculation_method', sa.String(30), nullable=False, default='eigenvalue',
                 comment='Eigenvector or normalized_average')
    )

    # Index for finding ANP cases
    op.create_index(
        'idx_cases_method',
        'cases',
        ['method']
    )

    # ===========================
    # 5. EXTEND AGGREGATED_RESULTS TABLE
    # ===========================

    op.add_column(
        'aggregated_results',
        sa.Column('anp_weights', postgresql.JSONB(), nullable=True,
                 comment='ANP-computed global weights {alternative_id: weight}')
    )

    op.add_column(
        'aggregated_results',
        sa.Column('anp_limit_matrix', postgresql.JSONB(), nullable=True,
                 comment='Full limit matrix for analysis and sensitivity testing')
    )

    op.add_column(
        'aggregated_results',
        sa.Column('anp_convergence_iterations', sa.Integer(), nullable=True,
                 comment='How many iterations ANP took to converge')
    )

    op.add_column(
        'aggregated_results',
        sa.Column('ahp_weights', postgresql.JSONB(), nullable=True,
                 comment='AHP-computed weights (always computed for comparison)')
    )

    op.add_column(
        'aggregated_results',
        sa.Column('comparison_ahp_vs_anp', postgresql.JSONB(), nullable=True,
                 comment='Differences between AHP and ANP results {alternative_id: {ahp, anp, difference}}'
                )
    )

    op.add_column(
        'aggregated_results',
        sa.Column('network_influence_metrics', postgresql.JSONB(), nullable=True,
                 comment='Network analysis: betweenness centrality, influence scores')
    )

    op.add_column(
        'aggregated_results',
        sa.Column('computation_method', sa.String(20), nullable=False, default='AHP',
                 comment='Which method was used for final weights: AHP|ANP')
    )


def downgrade():
    """Rollback ANP support"""

    # Drop columns from aggregated_results
    op.drop_column('aggregated_results', 'anp_weights')
    op.drop_column('aggregated_results', 'anp_limit_matrix')
    op.drop_column('aggregated_results', 'anp_convergence_iterations')
    op.drop_column('aggregated_results', 'ahp_weights')
    op.drop_column('aggregated_results', 'comparison_ahp_vs_anp')
    op.drop_column('aggregated_results', 'network_influence_metrics')
    op.drop_column('aggregated_results', 'computation_method')

    # Drop columns from cases
    op.drop_column('cases', 'method')
    op.drop_column('cases', 'has_network_dependencies')
    op.drop_column('cases', 'anp_convergence_achieved')
    op.drop_column('cases', 'anp_convergence_iterations')
    op.drop_column('cases', 'priority_calculation_method')

    # Drop indices and columns from comparisons
    op.drop_index('idx_comparisons_network', table_name='comparisons')
    op.drop_column('comparisons', 'comparison_type')
    op.drop_column('comparisons', 'is_network_comparison')

    # Drop supermatrices table and indices
    op.drop_index('idx_supermatrices_case', table_name='supermatrices')
    op.drop_table('supermatrices')

    # Drop dependencies table and indices
    op.drop_index('idx_criteria_dependencies_target', table_name='criteria_dependencies')
    op.drop_index('idx_criteria_dependencies_source', table_name='criteria_dependencies')
    op.drop_index('idx_criteria_dependencies_case', table_name='criteria_dependencies')
    op.drop_table('criteria_dependencies')
