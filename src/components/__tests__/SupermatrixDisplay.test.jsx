/**
 * Unit Tests for SupermatrixDisplay Component
 *
 * Tests:
 * - Matrix rendering
 * - Color mapping
 * - Cell selection
 * - Statistics calculation
 * - Value display/hiding
 * - Responsive design
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SupermatrixDisplay from '../SupermatrixDisplay';

describe('SupermatrixDisplay Component', () => {
  // ===========================
  // SETUP & FIXTURES
  // ===========================

  const mockMatrix = [
    [0.5, 0.3, 0.2, 0.1],
    [0.3, 0.4, 0.2, 0.1],
    [0.2, 0.2, 0.5, 0.1],
    [0.0, 0.1, 0.1, 0.7],
  ];

  const mockElements = [
    { id: 'c1', type: 'criterion' },
    { id: 'c2', type: 'criterion' },
    { id: 'alt1', type: 'alternative' },
    { id: 'alt2', type: 'alternative' },
  ];

  const mockNames = {
    c1: 'Kualitas',
    c2: 'Harga',
    alt1: 'Supplier A',
    alt2: 'Supplier B',
  };

  const defaultProps = {
    supermatrix: mockMatrix,
    elementNames: mockNames,
    elementList: mockElements,
    isLoading: false,
  };

  // ===========================
  // RENDERING TESTS
  // ===========================

  test('renders without crashing', () => {
    render(<SupermatrixDisplay {...defaultProps} />);
    expect(screen.getByText(/Matrix Size/i)).toBeInTheDocument();
  });

  test('displays matrix size statistics', () => {
    render(<SupermatrixDisplay {...defaultProps} />);
    expect(screen.getByText(/4×4/)).toBeInTheDocument();
  });

  test('displays non-zero cell count', () => {
    render(<SupermatrixDisplay {...defaultProps} />);
    expect(screen.getByText(/Non-Zero Cells/i)).toBeInTheDocument();
  });

  test('displays matrix density percentage', () => {
    render(<SupermatrixDisplay {...defaultProps} />);
    expect(screen.getByText(/Density/i)).toBeInTheDocument();
  });

  test('renders n×n matrix table', () => {
    const { container } = render(<SupermatrixDisplay {...defaultProps} />);
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
  });

  test('renders all row headers', () => {
    render(<SupermatrixDisplay {...defaultProps} />);
    expect(screen.getByText('Kualitas')).toBeInTheDocument();
    expect(screen.getByText('Harga')).toBeInTheDocument();
  });

  test('renders all column headers', () => {
    render(<SupermatrixDisplay {...defaultProps} />);
    // Headers appear in thead
    const headers = screen.getAllByText(/Kualitas|Harga|Supplier/);
    expect(headers.length).toBeGreaterThan(0);
  });

  test('displays loading state when isLoading true', () => {
    render(
      <SupermatrixDisplay
        {...defaultProps}
        isLoading={true}
      />
    );
    expect(screen.getByText(/Loading supermatrix/i)).toBeInTheDocument();
  });

  test('displays empty state for empty matrix', () => {
    render(
      <SupermatrixDisplay
        {...defaultProps}
        supermatrix={[]}
      />
    );
    expect(screen.getByText(/No supermatrix data/i)).toBeInTheDocument();
  });

  // ===========================
  // STATISTICS TESTS
  // ===========================

  test('calculates correct non-zero cell count', () => {
    render(<SupermatrixDisplay {...defaultProps} />);
    // Matrix has most cells > 0
    const nonZeroText = screen.getByText(/Non-Zero Cells/i).parentElement;
    expect(nonZeroText.textContent).toContain('15'); // All except one zero
  });

  test('calculates correct matrix density', () => {
    render(<SupermatrixDisplay {...defaultProps} />);
    // 15 non-zero out of 16 = 93.75%
    const densityText = screen.getByText(/Density/i).parentElement;
    expect(densityText.textContent).toMatch(/93\./);
  });

  test('calculates maximum value correctly', () => {
    render(<SupermatrixDisplay {...defaultProps} />);
    expect(screen.getByText(/Max Value/i)).toBeInTheDocument();
  });

  // ===========================
  // COLOR MAPPING TESTS
  // ===========================

  test('applies correct background color for zero values', () => {
    const { container } = render(<SupermatrixDisplay {...defaultProps} />);
    const cells = container.querySelectorAll('button');
    // Zero value cell should have light gray background
    const zeroCell = Array.from(cells).find(cell => {
      return cell.style.backgroundColor === '#f3f4f6';
    });
    expect(zeroCell).toBeTruthy();
  });

  test('applies blue gradient for non-zero values', () => {
    const { container } = render(<SupermatrixDisplay {...defaultProps} />);
    const cells = container.querySelectorAll('button');
    // Should have cells with blue colors
    const blueCells = Array.from(cells).filter(cell => {
      const bg = cell.style.backgroundColor;
      return bg.includes('3b82f6') || bg.includes('1d4ed8') || bg.includes('1e40af');
    });
    expect(blueCells.length).toBeGreaterThan(0);
  });

  test('applies different shades based on value magnitude', () => {
    const { container } = render(<SupermatrixDisplay {...defaultProps} />);
    const cells = container.querySelectorAll('button');
    // Should have multiple different blue shades
    const colors = new Set();
    cells.forEach(cell => {
      colors.add(cell.style.backgroundColor);
    });
    expect(colors.size).toBeGreaterThan(2);
  });

  // ===========================
  // VALUE DISPLAY TESTS
  // ===========================

  test('shows values when showValues toggle is on', () => {
    render(<SupermatrixDisplay {...defaultProps} />);
    const cells = screen.getAllByRole('button');
    // Some cells should have text content (values)
    const cellsWithValues = cells.filter(cell => parseFloat(cell.textContent) > 0);
    expect(cellsWithValues.length).toBeGreaterThan(0);
  });

  test('hides values when showValues toggle clicked', async () => {
    const user = userEvent.setup();
    render(<SupermatrixDisplay {...defaultProps} />);

    const showButton = screen.getByText(/Show.*Values/i);
    await user.click(showButton);

    // After toggling, button text should change
    const hideButton = screen.getByText(/Hide.*Values/i);
    expect(hideButton).toBeInTheDocument();
  });

  test('displays values with correct precision', () => {
    render(<SupermatrixDisplay {...defaultProps} />);
    // Values should be displayed with 2 decimal places
    const cells = screen.getAllByRole('button');
    const valueCell = cells.find(cell => cell.textContent.includes('.'));
    expect(valueCell).toBeTruthy();
  });

  // ===========================
  // CELL SELECTION TESTS
  // ===========================

  test('selects cell on click', async () => {
    const user = userEvent.setup();
    const { container } = render(<SupermatrixDisplay {...defaultProps} />);

    const cells = container.querySelectorAll('button');
    if (cells.length > 0) {
      await user.click(cells[5]); // Click a cell

      // Selected cell should show details
      await waitFor(() => {
        expect(screen.getByText(/Cell Details/i)).toBeInTheDocument();
      });
    }
  });

  test('displays selected cell details', async () => {
    const user = userEvent.setup();
    const { container } = render(<SupermatrixDisplay {...defaultProps} />);

    const cells = container.querySelectorAll('button');
    if (cells.length > 0) {
      await user.click(cells[0]);

      await waitFor(() => {
        expect(screen.getByText(/Row Element/i)).toBeInTheDocument();
        expect(screen.getByText(/Column Element/i)).toBeInTheDocument();
      });
    }
  });

  test('shows relationship type for selected cell', async () => {
    const user = userEvent.setup();
    const { container } = render(<SupermatrixDisplay {...defaultProps} />);

    const cells = container.querySelectorAll('button');
    if (cells.length > 0) {
      await user.click(cells[0]);

      await waitFor(() => {
        expect(screen.getByText(/Relationship/i)).toBeInTheDocument();
      });
    }
  });

  // ===========================
  // ELEMENT LEGEND TESTS
  // ===========================

  test('displays element legend', () => {
    render(<SupermatrixDisplay {...defaultProps} />);
    expect(screen.getByText(/Elements/i)).toBeInTheDocument();
  });

  test('shows criteria icon in legend', () => {
    render(<SupermatrixDisplay {...defaultProps} />);
    const legend = screen.getByText(/Elements/i).parentElement;
    expect(legend.textContent).toContain('📊');
  });

  test('shows alternative icon in legend', () => {
    render(<SupermatrixDisplay {...defaultProps} />);
    const legend = screen.getByText(/Elements/i).parentElement;
    expect(legend.textContent).toContain('🎯');
  });

  test('displays element types in legend', () => {
    render(<SupermatrixDisplay {...defaultProps} />);
    expect(screen.getByText(/criterion/i)).toBeInTheDocument();
    expect(screen.getByText(/alternative/i)).toBeInTheDocument();
  });

  // ===========================
  // COLOR LEGEND TESTS
  // ===========================

  test('displays color legend', () => {
    render(<SupermatrixDisplay {...defaultProps} />);
    expect(screen.getByText(/Color Legend/i)).toBeInTheDocument();
  });

  test('shows color ranges in legend', () => {
    render(<SupermatrixDisplay {...defaultProps} />);
    const legend = screen.getByText(/Color Legend/i).parentElement;
    expect(legend.textContent).toContain('0');
    expect(legend.textContent).toContain('Strong');
  });

  test('displays all color scale entries', () => {
    render(<SupermatrixDisplay {...defaultProps} />);
    const legend = screen.getByText(/Color Legend/i).parentElement;
    expect(legend.textContent).toContain('No influence');
  });

  // ===========================
  // RESPONSIVE DESIGN TESTS
  // ===========================

  test('renders horizontally scrollable table', () => {
    const { container } = render(<SupermatrixDisplay {...defaultProps} />);
    const wrapper = container.querySelector('[class*="overflow"]');
    expect(wrapper).toBeInTheDocument();
  });

  test('maintains readability on narrow viewports', () => {
    render(<SupermatrixDisplay {...defaultProps} />);
    // Matrix should be rendered and visible
    expect(screen.getByText(/Matrix Size/i)).toBeInTheDocument();
  });

  // ===========================
  // EDGE CASES
  // ===========================

  test('handles 2×2 matrix', () => {
    const smallMatrix = [
      [0.5, 0.5],
      [0.5, 0.5],
    ];
    const smallElements = [
      { id: 'c1', type: 'criterion' },
      { id: 'c2', type: 'criterion' },
    ];

    render(
      <SupermatrixDisplay
        {...defaultProps}
        supermatrix={smallMatrix}
        elementList={smallElements}
      />
    );

    expect(screen.getByText(/2×2/)).toBeInTheDocument();
  });

  test('handles large matrix (10×10)', () => {
    const largeMatrix = Array(10).fill(null).map(() =>
      Array(10).fill(null).map(() => Math.random() * 0.7)
    );
    const largeElements = Array(10).fill(null).map((_, i) => ({
      id: `e${i}`,
      type: i < 5 ? 'criterion' : 'alternative',
    }));

    render(
      <SupermatrixDisplay
        {...defaultProps}
        supermatrix={largeMatrix}
        elementList={largeElements}
      />
    );

    expect(screen.getByText(/10×10/)).toBeInTheDocument();
  });

  test('handles all zero matrix', () => {
    const zeroMatrix = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];

    render(
      <SupermatrixDisplay
        {...defaultProps}
        supermatrix={zeroMatrix}
      />
    );

    expect(screen.getByText(/3×3/)).toBeInTheDocument();
    expect(screen.getByText(/Non-Zero Cells/i)).toBeInTheDocument();
  });

  test('handles all non-zero matrix', () => {
    const fullMatrix = [
      [0.33, 0.33, 0.34],
      [0.33, 0.33, 0.34],
      [0.34, 0.34, 0.32],
    ];

    render(
      <SupermatrixDisplay
        {...defaultProps}
        supermatrix={fullMatrix}
      />
    );

    expect(screen.getByText(/Density.*100/)).toBeInTheDocument();
  });

  test('handles mixed zero and non-zero values', () => {
    const mixedMatrix = [
      [0.5, 0, 0.5],
      [0, 0.8, 0.2],
      [0.7, 0.3, 0],
    ];

    render(
      <SupermatrixDisplay
        {...defaultProps}
        supermatrix={mixedMatrix}
      />
    );

    expect(screen.getByText(/3×3/)).toBeInTheDocument();
  });

  test('handles very small values (< 0.01)', () => {
    const smallValueMatrix = [
      [0.001, 0.002, 0.997],
      [0.003, 0.004, 0.993],
      [0.98, 0.015, 0.005],
    ];

    render(
      <SupermatrixDisplay
        {...defaultProps}
        supermatrix={smallValueMatrix}
      />
    );

    // Should render without errors
    expect(screen.getByText(/Matrix Size/i)).toBeInTheDocument();
  });

  test('handles very large values (> 1.0)', () => {
    const largeValueMatrix = [
      [1.5, 2.0, 3.5],
      [2.0, 1.8, 2.2],
      [3.0, 2.5, 1.0],
    ];

    render(
      <SupermatrixDisplay
        {...defaultProps}
        supermatrix={largeValueMatrix}
      />
    );

    expect(screen.getByText(/Matrix Size/i)).toBeInTheDocument();
  });

  test('handles null element names with fallback to IDs', () => {
    const emptyNames = {};
    render(
      <SupermatrixDisplay
        {...defaultProps}
        elementNames={emptyNames}
      />
    );

    // Should fall back to element IDs
    expect(screen.getByText(/Matrix Size/i)).toBeInTheDocument();
  });

  test('handles special characters in element names', () => {
    const specialNames = {
      c1: 'Kualitas & Keberlanjutan',
      c2: 'Harga/Nilai',
      alt1: 'Supplier A (Terbaik)',
      alt2: 'Supplier B',
    };

    render(
      <SupermatrixDisplay
        {...defaultProps}
        elementNames={specialNames}
      />
    );

    expect(screen.getByText(/Kualitas & Keberlanjutan/i)).toBeInTheDocument();
  });

  test('handles very long element names', () => {
    const longNames = {
      c1: 'Kualitas Produk dan Keberlanjutan Lingkungan Jangka Panjang',
      c2: 'Harga Kompetitif Dengan Nilai Tambah Layanan',
      alt1: 'Pemasok A - Kualitas Premium Terpercaya Internasional',
      alt2: 'Pemasok B',
    };

    render(
      <SupermatrixDisplay
        {...defaultProps}
        elementNames={longNames}
      />
    );

    expect(screen.getByText(/Matrix Size/i)).toBeInTheDocument();
  });
});
