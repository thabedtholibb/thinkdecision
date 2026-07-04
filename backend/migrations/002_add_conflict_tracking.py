"""
Migration: Add conflict tracking and revision workflow fields

Extends Comparison and ExpertInvite models to support:
- Expert disagreement detection
- Conflict resolution workflow
- Revision request and tracking
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# Revision identifiers
revision = '002_add_conflict_tracking'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None


def upgrade():
    """Add conflict tracking fields to Comparison table"""

    # Add new columns to Comparison table
    op.add_column('comparisons',
        sa.Column('agreement_score', sa.Float, nullable=True,
                 comment='Agreement score with other experts [-1, 1]')
    )

    op.add_column('comparisons',
        sa.Column('disagreement_pairs', postgresql.JSONB, nullable=True,
                 comment='List of problematic pairs detected in this matrix')
    )

    op.add_column('comparisons',
        sa.Column('is_outlier', sa.Boolean, default=False, nullable=False,
                 comment='Whether expert is statistical outlier')
    )

    op.add_column('comparisons',
        sa.Column('needs_review', sa.Boolean, default=False, nullable=False,
                 comment='Flagged for potential revision by creator')
    )

    op.add_column('comparisons',
        sa.Column('revision_requested_at', sa.DateTime, nullable=True,
                 comment='When creator requested revision')
    )

    op.add_column('comparisons',
        sa.Column('revision_notes', sa.String, nullable=True,
                 comment='Why creator thinks this needs review')
    )

    # Add new columns to ExpertInvite table for revision tracking
    op.add_column('expert_invites',
        sa.Column('revision_count', sa.Integer, default=0, nullable=False,
                 comment='How many revisions have been submitted')
    )

    op.add_column('expert_invites',
        sa.Column('revision_requested_at', sa.DateTime, nullable=True,
                 comment='When creator requested revision')
    )

    op.add_column('expert_invites',
        sa.Column('revision_notes', sa.String, nullable=True,
                 comment='Why revision was requested')
    )

    op.add_column('expert_invites',
        sa.Column('revision_completed_at', sa.DateTime, nullable=True,
                 comment='When expert submitted revised judgments')
    )

    # Add new status values to InviteStatus enum
    # (This is Python-side; actual enum update depends on database)
    # Possible new statuses: 'revision_requested', 'revision_in_progress'

    # Create index for quick lookup of outliers
    op.create_index(
        'idx_comparisons_is_outlier',
        'comparisons',
        ['case_id', 'is_outlier'],
        postgresql_where=sa.text('is_outlier = true')
    )

    # Create index for revision requests
    op.create_index(
        'idx_comparisons_needs_review',
        'comparisons',
        ['case_id', 'needs_review'],
        postgresql_where=sa.text('needs_review = true')
    )

    # Create index for finding pending revisions
    op.create_index(
        'idx_expert_invites_revision_requested',
        'expert_invites',
        ['case_id', 'revision_requested_at'],
        postgresql_where=sa.text('revision_requested_at IS NOT NULL')
    )


def downgrade():
    """Rollback: Remove conflict tracking fields"""

    # Drop indices
    op.drop_index('idx_comparisons_is_outlier', table_name='comparisons')
    op.drop_index('idx_comparisons_needs_review', table_name='comparisons')
    op.drop_index('idx_expert_invites_revision_requested', table_name='expert_invites')

    # Drop columns from Comparison table
    op.drop_column('comparisons', 'agreement_score')
    op.drop_column('comparisons', 'disagreement_pairs')
    op.drop_column('comparisons', 'is_outlier')
    op.drop_column('comparisons', 'needs_review')
    op.drop_column('comparisons', 'revision_requested_at')
    op.drop_column('comparisons', 'revision_notes')

    # Drop columns from ExpertInvite table
    op.drop_column('expert_invites', 'revision_count')
    op.drop_column('expert_invites', 'revision_requested_at')
    op.drop_column('expert_invites', 'revision_notes')
    op.drop_column('expert_invites', 'revision_completed_at')
