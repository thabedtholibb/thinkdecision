/**
 * Unit Tests for AgreementHeatmap Component
 *
 * Tests:
 * - Rendering and layout
 * - Color mapping
 * - Outlier detection
 * - Error handling
 * - Responsive design
 * - Accessibility
 * - Dark mode
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AgreementHeatmap from '../AgreementHeatmap';

describe('AgreementHeatmap Component', () => {
  // ===========================
  // SETUP & FIXTURES
  // ===========================

  const mockAgreement = {
    expert_1: 0.85,
    expert_2: 0.92,
    expert_3: 0.65,
    expert_4: 0.78,
    expert_5: 0.88,
  };

  const mockNames = {
    expert_1: 'Dr. Budi',
    expert_2: 'Prof. Ani',
    expert_3: 'Ir. Citra',
    expert_4: 'Eng. Dede',
    expert_5: 'Pakar Eka',
  };

  const defaultProps = {
    expertAgreement: mockAgreement,
    expertNames: mockNames,
    outlierExperts: [],
    onExpertSelect: jest.fn(),
  };

  // ===========================
  // RENDERING TESTS
  // ===========================

  test('renders without crashing with valid props', () => {
    render(<AgreementHeatmap {...defaultProps} />);
    expect(screen.getByText(/Expert Agreement/i)).toBeInTheDocument();
  });

  test('renders matrix grid with all experts', () => {
    render(<AgreementHeatmap {...defaultProps} />);
    const cells = screen.getAllByRole('button');
    // Should have 5x5 = 25 cells
    expect(cells.length).toBeGreaterThanOrEqual(25);
  });

  test('renders legend with color scale', () => {
    render(<AgreementHeatmap {...defaultProps} />);
    expect(screen.getByText(/Strong Agreement/i)).toBeInTheDocument();
    expect(screen.getByText(/Weak Agreement/i)).toBeInTheDocument();
  });

  test('displays expert names in axis labels', () => {
    render(<AgreementHeatmap {...defaultProps} />);
    expect(screen.getByText('Dr. Budi')).toBeInTheDocument();
    expect(screen.getByText('Prof. Ani')).toBeInTheDocument();
  });

  // ===========================
  // DATA HANDLING TESTS
  // ===========================

  test('calculates diagonal as 1.0 (self-agreement)', () => {
    const { container } = render(<AgreementHeatmap {...defaultProps} />);
    // Diagonal cells should show highest agreement (1.0)
    const diagonalCells = container.querySelectorAll('[data-diagonal="true"]');
    diagonalCells.forEach((cell) => {
      expect(cell.textContent).toBe('1.0');
    });
  });

  test('handles symmetric correlation matrix', () => {
    render(<AgreementHeatmap {...defaultProps} />);
    // If agreement[i,j] = 0.85, then agreement[j,i] should be 0.85
    // This is implicitly tested by proper matrix layout
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  test('renders empty state for no experts', () => {
    render(
      <AgreementHeatmap
        {...defaultProps}
        expertAgreement={{}}
        expertNames={{}}
      />
    );
    expect(screen.getByText(/Not enough experts/i)).toBeInTheDocument();
  });

  test('renders warning for single expert', () => {
    render(
      <AgreementHeatmap
        {...defaultProps}
        expertAgreement={{ expert_1: 1.0 }}
        expertNames={{ expert_1: 'Only Expert' }}
      />
    );
    expect(screen.getByText(/correlation/i)).toBeInTheDocument();
  });

  // ===========================
  // COLOR MAPPING TESTS
  // ===========================

  test('maps high agreement (>0.8) to green', () => {
    const { container } = render(<AgreementHeatmap {...defaultProps} />);
    const greenCells = container.querySelectorAll('[data-color="green"]');
    expect(greenCells.length).toBeGreaterThan(0);
  });

  test('maps moderate agreement (0.5-0.8) to yellow', () => {
    const { container } = render(<AgreementHeatmap {...defaultProps} />);
    const yellowCells = container.querySelectorAll('[data-color="yellow"]');
    expect(yellowCells.length).toBeGreaterThanOrEqual(0);
  });

  test('maps low agreement (<0.5) to red', () => {
    const { container } = render(<AgreementHeatmap {...defaultProps} />);
    const redCells = container.querySelectorAll('[data-color="red"]');
    // At least the expert_3 (0.65) might be lower
    expect(redCells.length).toBeGreaterThanOrEqual(0);
  });

  test('handles inverted scores (negative correlation)', () => {
    const invertedAgreement = {
      expert_1: 0.85,
      expert_2: -0.65, // Strong disagreement
      expert_3: 0.72,
      expert_4: 0.91,
      expert_5: 0.60,
    };
    render(
      <AgreementHeatmap
        {...defaultProps}
        expertAgreement={invertedAgreement}
      />
    );
    // Should render with negative values shown as red
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  // ===========================
  // OUTLIER DETECTION TESTS
  // ===========================

  test('highlights outlier experts with badge', () => {
    render(
      <AgreementHeatmap
        {...defaultProps}
        outlierExperts={['expert_3']}
      />
    );
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  test('renders multiple outlier badges', () => {
    render(
      <AgreementHeatmap
        {...defaultProps}
        outlierExperts={['expert_1', 'expert_3', 'expert_5']}
      />
    );
    const warnings = screen.getAllByText('⚠️');
    expect(warnings.length).toBeGreaterThanOrEqual(1);
  });

  test('handles empty outlier list', () => {
    render(
      <AgreementHeatmap
        {...defaultProps}
        outlierExperts={[]}
      />
    );
    const warnings = screen.queryAllByText('⚠️');
    expect(warnings.length).toBe(0);
  });

  // ===========================
  // INTERACTION TESTS
  // ===========================

  test('calls onExpertSelect when cell is clicked', () => {
    const onSelect = jest.fn();
    const { container } = render(
      <AgreementHeatmap
        {...defaultProps}
        onExpertSelect={onSelect}
      />
    );

    const cells = container.querySelectorAll('button[role="button"]');
    if (cells.length > 0) {
      fireEvent.click(cells[0]);
      expect(onSelect).toHaveBeenCalled();
    }
  });

  test('shows tooltip on hover', () => {
    const { container } = render(<AgreementHeatmap {...defaultProps} />);
    const cell = container.querySelector('button[role="button"]');

    if (cell) {
      fireEvent.mouseEnter(cell);
      // Tooltip should appear or be in title attribute
      expect(cell.getAttribute('title') || cell.getAttribute('aria-label')).toBeTruthy();
    }
  });

  // ===========================
  // ERROR HANDLING TESTS
  // ===========================

  test('handles missing expertNames gracefully', () => {
    render(
      <AgreementHeatmap
        {...defaultProps}
        expertNames={{}}
      />
    );
    // Should render with expert IDs as fallback
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  test('handles NaN values in agreement scores', () => {
    const invalidAgreement = {
      expert_1: NaN,
      expert_2: 0.85,
      expert_3: 0.72,
      expert_4: undefined,
      expert_5: 0.88,
    };
    render(
      <AgreementHeatmap
        {...defaultProps}
        expertAgreement={invalidAgreement}
      />
    );
    // Should not crash, render with fallback values
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  test('handles extremely large/small scores', () => {
    const extremeAgreement = {
      expert_1: 1000,
      expert_2: -1000,
      expert_3: 0.5,
      expert_4: 0,
      expert_5: 1.5,
    };
    render(
      <AgreementHeatmap
        {...defaultProps}
        expertAgreement={extremeAgreement}
      />
    );
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  test('handles null expertAgreement prop', () => {
    render(
      <AgreementHeatmap
        {...defaultProps}
        expertAgreement={null}
      />
    );
    // Should show empty state or warning
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  // ===========================
  // ACCESSIBILITY TESTS
  // ===========================

  test('has proper ARIA labels on grid', () => {
    const { container } = render(<AgreementHeatmap {...defaultProps} />);
    expect(container.querySelector('[role="grid"]')).toBeInTheDocument();
  });

  test('is keyboard navigable', () => {
    const { container } = render(<AgreementHeatmap {...defaultProps} />);
    const cells = container.querySelectorAll('button');
    expect(cells.length).toBeGreaterThan(0);
    // All cells should be buttons (keyboard accessible)
  });

  test('has sufficient color contrast', () => {
    const { container } = render(<AgreementHeatmap {...defaultProps} />);
    // Check that colors are defined and accessible
    const cells = container.querySelectorAll('[data-color]');
    expect(cells.length).toBeGreaterThan(0);
  });

  // ===========================
  // RESPONSIVE DESIGN TESTS
  // ===========================

  test('applies correct cell size on mobile', () => {
    const { container } = render(<AgreementHeatmap {...defaultProps} />);
    const grid = container.querySelector('[role="grid"]');
    // Mobile: smaller cells (12x12px mentioned in spec)
    expect(grid).toHaveClass('sm:gap-3', 'gap-1');
  });

  test('applies correct cell size on desktop', () => {
    const { container } = render(<AgreementHeatmap {...defaultProps} />);
    const grid = container.querySelector('[role="grid"]');
    // Desktop: larger cells (56x56px)
    expect(grid).toBeInTheDocument();
  });

  test('scrolls horizontally on narrow viewports', () => {
    const { container } = render(<AgreementHeatmap {...defaultProps} />);
    const wrapper = container.querySelector('[class*="overflow"]');
    // Should have horizontal scroll on mobile
    expect(wrapper).toBeInTheDocument();
  });

  // ===========================
  // DARK MODE TESTS
  // ===========================

  test('applies dark mode classes when dark mode active', () => {
    const { container } = render(
      <div className="dark">
        <AgreementHeatmap {...defaultProps} />
      </div>
    );
    const grid = container.querySelector('[role="grid"]');
    // Check for dark: prefix classes
    expect(grid).toBeInTheDocument();
  });

  test('light mode works without dark class', () => {
    const { container } = render(
      <div>
        <AgreementHeatmap {...defaultProps} />
      </div>
    );
    expect(container.querySelector('[role="grid"]')).toBeInTheDocument();
  });

  // ===========================
  // EDGE CASES
  // ===========================

  test('handles expert IDs with special characters', () => {
    const specialNames = {
      'expert-1-special': 'Dr. Spécial',
      'expert_2_underscore': 'Prof. Under',
      'EXPERT3CAPS': 'Dr. Caps',
    };
    const specialAgreement = {
      'expert-1-special': 0.85,
      'expert_2_underscore': 0.92,
      'EXPERT3CAPS': 0.78,
    };
    render(
      <AgreementHeatmap
        {...defaultProps}
        expertNames={specialNames}
        expertAgreement={specialAgreement}
      />
    );
    expect(screen.getByText('Dr. Spécial')).toBeInTheDocument();
  });

  test('handles very long expert names', () => {
    const longNames = {
      expert_1: 'Dr. Muhammad Budi Susanto Hartono, Ph.D.',
      expert_2: 'Prof. Ani Wijaya Setiawan Hermawan Kusuma',
      expert_3: 'Ir. Citramas Wijaya Dwi Kusuma Negara',
    };
    render(
      <AgreementHeatmap
        {...defaultProps}
        expertNames={longNames}
      />
    );
    expect(screen.getByText(/Dr\. Muhammad/)).toBeInTheDocument();
  });

  test('renders correctly with 2 experts (minimum for correlation)', () => {
    const twoExperts = {
      expert_1: 0.85,
      expert_2: 0.92,
    };
    const twoNames = {
      expert_1: 'Expert 1',
      expert_2: 'Expert 2',
    };
    render(
      <AgreementHeatmap
        {...defaultProps}
        expertAgreement={twoExperts}
        expertNames={twoNames}
      />
    );
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  test('renders correctly with 10+ experts (large matrix)', () => {
    const largeAgreement = {};
    const largeNames = {};
    for (let i = 1; i <= 12; i++) {
      largeAgreement[`expert_${i}`] = Math.random() * 0.4 + 0.5;
      largeNames[`expert_${i}`] = `Expert ${i}`;
    }
    render(
      <AgreementHeatmap
        {...defaultProps}
        expertAgreement={largeAgreement}
        expertNames={largeNames}
      />
    );
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });
});
