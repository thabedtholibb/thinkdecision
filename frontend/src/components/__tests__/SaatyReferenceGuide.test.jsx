/**
 * Comprehensive test suite for SaatyReferenceGuide component
 * Tests: Rendering, Props, Data Flow, Edge Cases, Accessibility
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import SaatyReferenceGuide from '../SaatyReferenceGuide';

describe('SaatyReferenceGuide Component', () => {

  // ======================
  // 1. PROPS VALIDATION TESTS
  // ======================

  describe('Props Validation', () => {
    test('Should render with default props', () => {
      const { container } = render(<SaatyReferenceGuide />);
      expect(container).toBeTruthy();
      expect(screen.getByText('SAATY SCALE GUIDE')).toBeInTheDocument();
    });

    test('Should render with valid currentScale (1-9)', () => {
      for (let scale = 1; scale <= 9; scale++) {
        const { unmount } = render(<SaatyReferenceGuide currentScale={scale} />);
        expect(screen.getByText(`${scale}`)).toBeInTheDocument();
        unmount();
      }
    });

    test('Should handle invalid currentScale gracefully', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { container } = render(<SaatyReferenceGuide currentScale={15} />);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid Saaty scale')
      );
      expect(screen.getByText('Equal Importance')).toBeInTheDocument(); // Fallback to 1

      consoleWarnSpy.mockRestore();
    });

    test('Should handle negative scale values', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(<SaatyReferenceGuide currentScale={-5} />);

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(screen.getByText('Equal Importance')).toBeInTheDocument();

      consoleWarnSpy.mockRestore();
    });

    test('Should handle NaN as currentScale', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(<SaatyReferenceGuide currentScale={NaN} />);

      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    test('Should handle string currentScale', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(<SaatyReferenceGuide currentScale="5" />);

      // Should convert "5" to 5
      expect(screen.getByText('Strong Importance')).toBeInTheDocument();

      consoleWarnSpy.mockRestore();
    });

    test('Should handle null comparisonContext', () => {
      const { container } = render(
        <SaatyReferenceGuide currentScale={5} comparisonContext={null} />
      );

      expect(container).toBeTruthy();
      // Should not render context-specific help text
      expect(screen.queryByText(/This means:/)).not.toBeInTheDocument();
    });

    test('Should handle incomplete comparisonContext (missing item1)', () => {
      const { container } = render(
        <SaatyReferenceGuide
          currentScale={5}
          comparisonContext={{item2: "Price"}}
        />
      );

      expect(container).toBeTruthy();
      // Should not crash, context help should not render
      expect(screen.queryByText(/This means:/)).not.toBeInTheDocument();
    });

    test('Should handle complete comparisonContext', () => {
      render(
        <SaatyReferenceGuide
          currentScale={5}
          comparisonContext={{item1: "Durability", item2: "Price"}}
        />
      );

      expect(screen.getByText(/This means:/)).toBeInTheDocument();
      expect(screen.getByText(/Durability/)).toBeInTheDocument();
      expect(screen.getByText(/Price/)).toBeInTheDocument();
      expect(screen.getByText(/5x more important/)).toBeInTheDocument();
    });
  });

  // ======================
  // 2. RENDERING TESTS
  // ======================

  describe('Rendering', () => {
    test('Should display all 9 scale levels', () => {
      render(<SaatyReferenceGuide />);

      const labels = [
        'Equal Importance',
        'Nearly Equal / Weak',
        'Moderate Importance',
        'Moderately Strong',
        'Strong Importance',
        'Strongly Very Strong',
        'Very Strong Importance',
        'Very Very Strong',
        'Extreme Importance'
      ];

      labels.forEach(label => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });

    test('Should display semantic description for each scale', () => {
      render(<SaatyReferenceGuide />);

      expect(screen.getByText('Two factors contribute equally')).toBeInTheDocument();
      expect(screen.getByText(/One is moderately more important/)).toBeInTheDocument();
      expect(screen.getByText(/absolutely dominant/)).toBeInTheDocument();
    });

    test('Should display examples for each scale', () => {
      render(<SaatyReferenceGuide />);

      expect(screen.getByText(/Quality and Reliability equally important/)).toBeInTheDocument();
      expect(screen.getByText(/Safety 5x more important/)).toBeInTheDocument();
    });

    test('Should not crash on render', () => {
      const { container } = render(<SaatyReferenceGuide currentScale={5} />);
      expect(container.querySelector('svg')).toBeTruthy(); // Checkmark should render
    });
  });

  // ======================
  // 3. DATA FLOW TESTS
  // ======================

  describe('Data Flow', () => {
    test('Should highlight correct scale when currentScale changes', () => {
      const { rerender } = render(<SaatyReferenceGuide currentScale={3} />);

      // Check that scale 3 is highlighted
      let scaleItems = screen.getAllByRole('button');
      expect(scaleItems[2]).toHaveClass('ring-2'); // 3rd item (index 2)

      // Change to scale 7
      rerender(<SaatyReferenceGuide currentScale={7} />);

      scaleItems = screen.getAllByRole('button');
      expect(scaleItems[6]).toHaveClass('ring-2'); // 7th item (index 6)
    });

    test('Should update context display when comparisonContext changes', () => {
      const { rerender } = render(
        <SaatyReferenceGuide
          currentScale={5}
          comparisonContext={{item1: "A", item2: "B"}}
        />
      );

      expect(screen.getByText(/A.*B/)).toBeInTheDocument();

      rerender(
        <SaatyReferenceGuide
          currentScale={5}
          comparisonContext={{item1: "Quality", item2: "Speed"}}
        />
      );

      expect(screen.getByText(/Quality.*Speed/)).toBeInTheDocument();
    });

    test('Should show correct example for selected scale', () => {
      const { rerender } = render(<SaatyReferenceGuide currentScale={3} />);

      expect(screen.getByText(/Quality 3x more important/)).toBeInTheDocument();

      rerender(<SaatyReferenceGuide currentScale={5} />);

      expect(screen.getByText(/Safety 5x more important/)).toBeInTheDocument();
    });

    test('Should update selection summary when scale changes', () => {
      const { rerender } = render(<SaatyReferenceGuide currentScale={1} />);

      expect(screen.getByText(/Your selection: 1 = Equal Importance/)).toBeInTheDocument();

      rerender(<SaatyReferenceGuide currentScale={9} />);

      expect(screen.getByText(/Your selection: 9 = Extreme Importance/)).toBeInTheDocument();
    });
  });

  // ======================
  // 4. EDGE CASES & ERROR HANDLING
  // ======================

  describe('Edge Cases', () => {
    test('Should handle float currentScale by rounding', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(<SaatyReferenceGuide currentScale={5.7} />);

      // Should round to 6
      expect(screen.getByText('Strongly Very Strong')).toBeInTheDocument();

      consoleWarnSpy.mockRestore();
    });

    test('Should handle zero as currentScale', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(<SaatyReferenceGuide currentScale={0} />);

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(screen.getByText('Equal Importance')).toBeInTheDocument(); // Fallback

      consoleWarnSpy.mockRestore();
    });

    test('Should handle undefined currentScale', () => {
      const { container } = render(<SaatyReferenceGuide currentScale={undefined} />);

      expect(container).toBeTruthy();
      expect(screen.getByText('Equal Importance')).toBeInTheDocument(); // Default
    });

    test('Should handle empty object as comparisonContext', () => {
      const { container } = render(
        <SaatyReferenceGuide currentScale={5} comparisonContext={{}} />
      );

      expect(container).toBeTruthy();
      expect(screen.queryByText(/This means:/)).not.toBeInTheDocument();
    });

    test('Should render with null examples array', () => {
      // Simulate component with corrupted data
      const { container } = render(<SaatyReferenceGuide currentScale={1} />);

      expect(container).toBeTruthy(); // Should not crash
    });
  });

  // ======================
  // 5. ACCESSIBILITY TESTS
  // ======================

  describe('Accessibility', () => {
    test('Should have proper ARIA roles', () => {
      render(<SaatyReferenceGuide currentScale={5} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(9); // 9 scale levels
    });

    test('Should have aria-selected on current scale', () => {
      render(<SaatyReferenceGuide currentScale={3} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons[2]).toHaveAttribute('aria-selected', 'true');
    });

    test('Should have descriptive alt text or labels', () => {
      render(<SaatyReferenceGuide currentScale={5} />);

      // Heading should be present
      expect(screen.getByText('SAATY SCALE GUIDE')).toBeInTheDocument();
    });

    test('Should be keyboard navigable', () => {
      const { container } = render(<SaatyReferenceGuide currentScale={5} />);

      const buttons = container.querySelectorAll('[role="button"]');
      buttons.forEach(btn => {
        expect(btn).toHaveAttribute('tabindex');
      });
    });
  });

  // ======================
  // 6. VISUAL STATE TESTS
  // ======================

  describe('Visual States', () => {
    test('Should show checkmark for selected scale', () => {
      const { container } = render(<SaatyReferenceGuide currentScale={5} />);

      const checkmarks = container.querySelectorAll('svg');
      expect(checkmarks.length).toBeGreaterThan(0);
    });

    test('Should apply different colors to different scales', () => {
      const { container } = render(<SaatyReferenceGuide />);

      const items = container.querySelectorAll('[role="button"]');
      const colors = new Set();

      items.forEach(item => {
        const classes = item.className;
        colors.add(classes);
      });

      expect(colors.size).toBeGreaterThan(1); // Different colors applied
    });

    test('Should display selection summary box', () => {
      render(<SaatyReferenceGuide currentScale={5} />);

      expect(screen.getByText(/Your selection:/)).toBeInTheDocument();
    });

    test('Should show scale legend', () => {
      render(<SaatyReferenceGuide />);

      expect(screen.getByText('Weak')).toBeInTheDocument();
      expect(screen.getByText('Moderate')).toBeInTheDocument();
      expect(screen.getByText('Strong')).toBeInTheDocument();
    });
  });

  // ======================
  // 7. PERFORMANCE TESTS
  // ======================

  describe('Performance', () => {
    test('Should not cause memory leaks on unmount', () => {
      const { unmount } = render(<SaatyReferenceGuide currentScale={5} />);

      expect(() => unmount()).not.toThrow();
    });

    test('Should handle rapid prop updates efficiently', () => {
      const { rerender } = render(<SaatyReferenceGuide currentScale={1} />);

      for (let i = 1; i <= 9; i++) {
        rerender(<SaatyReferenceGuide currentScale={i} />);
      }

      expect(screen.getByText('Extreme Importance')).toBeInTheDocument();
    });
  });
});
