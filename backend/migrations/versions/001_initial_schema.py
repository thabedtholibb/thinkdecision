"""initial_schema

Revision ID: 001
Revises:
Create Date: 2026-04-27 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('role', sa.Enum('creator', 'expert', name='userrole'), nullable=False, server_default='creator'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('email'),
    )

    op.create_table(
        'cases',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('creator_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('method', sa.Enum('AHP', 'ANP', 'FUZZY_AHP', 'FUZZY_ANP', name='decisionmethod'), nullable=False, server_default='AHP'),
        sa.Column('aggregation_method', sa.Enum('GMJ', 'GMP', name='aggregationmethod'), nullable=False, server_default='GMJ'),
        sa.Column('status', sa.Enum('draft', 'active', 'closed', name='casestatus'), nullable=False, server_default='draft'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['creator_id'], ['users.id'], ondelete='CASCADE'),
    )

    op.create_table(
        'criteria',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('case_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('label', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('level', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['criteria.id'], ondelete='CASCADE'),
    )

    op.create_table(
        'alternatives',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('case_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('label', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id'], ondelete='CASCADE'),
    )

    op.create_table(
        'expert_invites',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('case_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('expert_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.Enum('pending', 'accepted', 'completed', name='invitestatus'), nullable=False, server_default='pending'),
        sa.Column('invited_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('accepted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['expert_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('case_id', 'expert_id'),
    )

    op.create_table(
        'comparisons',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('case_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('expert_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('node_type', sa.String(), nullable=False),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('value_matrix', postgresql.JSONB(), nullable=False),
        sa.Column('priority_vector', postgresql.JSONB(), nullable=True),
        sa.Column('cr', sa.Float(), nullable=True),
        sa.Column('is_consistent', sa.Boolean(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("node_type IN ('criteria', 'alternative')", name="check_node_type"),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['expert_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('case_id', 'expert_id', 'node_type', 'parent_id'),
    )

    op.create_table(
        'aggregated_results',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('case_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('aggregation_method_used', sa.Enum('GMJ', 'GMP', name='aggregationmethod'), nullable=False),
        sa.Column('global_weights', postgresql.JSONB(), nullable=False),
        sa.Column('criteria_weights', postgresql.JSONB(), nullable=False),
        sa.Column('expert_priorities', postgresql.JSONB(), nullable=False),
        sa.Column('aggregate_cr', sa.Float(), nullable=True),
        sa.Column('computed_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('case_id'),
    )


def downgrade() -> None:
    op.drop_table('aggregated_results')
    op.drop_table('comparisons')
    op.drop_table('expert_invites')
    op.drop_table('alternatives')
    op.drop_table('criteria')
    op.drop_table('cases')
    op.drop_table('users')
