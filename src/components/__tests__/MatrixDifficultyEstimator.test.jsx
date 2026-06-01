/**
 * Comprehensive test suite for MatrixDifficultyEstimator component
 * Tests: Calculations, Props Validation, Data Flow, Edge Cases, Accessibility
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MatrixDifficultyEstimator from '../MatrixDifficultyEstimator';

describe('MatrixDifficultyEstimator Component', () => {

  // ======================
  // 1. CALCULATION TESTS
  // ======================

  describe('Pair Calculations', () => {
    test('Should calculate criteria pairs correctly: n*(n-1)/2', () => {
      render(<MatrixDifficultyEstimator criteriaCount={3} alternativeCount={0} />);
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    test('Should calculate alternative pairs per criterion', () => {
      render(<MatrixDifficultyEstimator criteriaCount={1} alternativeCount={4} />);
      expect(screen.getByText('6')).toBeInTheDocument();
    });

    test('Should calculate total pairs correctly', () => {
      render(<MatrixDifficultyEstimator criteriaCount={2} alternativeCount={3} />);
      expect(screen.getByText('7 pairs to compare')).toBeInTheDocument();
    });

    test('Should handle single criterion', () => {
      render(<MatrixDifficultyEstimator criteriaCount={1} alternativeCount={2} />);
      expect(screen.getByText('1 pairs to compare')).toBeInTheDocument();
    });

    test('Should return 0 for zero criteria/alternatives', () => {
      render(<MatrixDifficultyEstimator criteriaCount={0} alternativeCount={0} />);
      expect(screen.getByText('0 pairs to compare')).toBeInTheDocument();
    });
  });

  // ======================
  // 2. TIME ESTIMATION TESTS
  // ======================

  describe('Time Estimation', () => {
    test('Should estimate 1.5 minutes per pair', () => {
      render(<MatrixDifficultyEstimator criteriaCount={2} alternativeCount={3} />);
      expect(screen.getByText(/11 minutes/)).toBeInTheDocument();
    });

    test('Should show "No comparisons" for zero pairs', () => {
      render(<MatrixDifficultyEstimator criteriaCount={0} alternativeCount={0} />);
      expect(screen.getByText('No comparisons')).toBeInTheDocument();
    });

    test('Should format time correctly for larger tasks', () => {
      render(<MatrixDifficultyEstimator criteriaCount={8} alternativeCount={4} />);
      expect(screen.getByText(/hour/)).toBeInTheDocument();
    });
  });

  // ======================
  // 3. DIFFICULTY ASSESSMENT
  // ======================

  describe('Difficulty Levels', () => {
    test('Should be EASY for 0-6 pairs', () => {
      render(<MatrixDifficultyEstimator criteriaCount={2} alternativeCount={2} />);
      expect(screen.getByText(/Easy/)).toBeInTheDocument();
    });

    test('Should be MODERATE for 7-15 pairs', () => {
      render(<MatrixDifficultyEstimator criteriaCount={3} alternativeCount={3} />);
      expect(screen.getByText(/Moderate/)).toBeInTheDocument();
    });

    test('Should be CHALLENGING for 16-28 pairs', () => {
      render(<MatrixDifficultyEstimator criteriaCount={5} alternativeCount={3} />);
      expect(screen.getByText(/Challenging/)).toBeInTheDocument();
    });

    test('Should be COMPLEX for 29+ pairs', () => {
      render(<MatrixDifficultyEstimator criteriaCount={8} alternativeCount={4} />);
      expect(screen.getByText(/Complex/)).toBeInTheDocument();
    });
  });

  // ======================
  // 4. RECOMMENDATIONS
  // ======================

  describe('Smart Recommendations', () => {
    test('Should give positive recommendation for EASY tasks', () => {
      render(<MatrixDifficultyEstimator criteriaCount={2} alternativeCount={2} />);
      expect(screen.getByText(/Great! This is a quick task/)).toBeInTheDocument();
    });

    test('Should recommend careful approach for MODERATE', () => {
      render(<MatrixDifficultyEstimator criteriaCount={3} alternativeCount={3} />);
      expect(screen.getByText(/Take your time and do this carefully/)).toBeInTheDocument();
    });

    test('Should recommend phased approach for CHALLENGING', () => {
      render(<MatrixDifficultyEstimator criteriaCount={5} alternativeCount={3} />);
      expect(screen.getByText(/start with top/)).toBeInTheDocument();
    });

    test('Should recommend breaking into sessions for COMPLEX', () => {
      render(<MatrixDifficultyEstimator criteriaCount={8} alternativeCount={4} />);
      expect(screen.getByText(/breaking into multiple sessions/)).toBeInTheDocument();
    });
  });

  // ======================
  // 5. PROPS VALIDATION
  // ======================

  describe('Props Validation', () => {
    test('Should handle default props', () => {
      const { container } = render(<MatrixDifficultyEstimator />);
      expect(container).toBeTruthy();
      expect(screen.getByText('No comparisons')).toBeInTheDocument();
    });

    test('Should validate criteriaCount as number', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      render(<MatrixDifficultyEstimator criteriaCount="abc" alternativeCount={2} />);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid criteriaCount')
      );
      consoleWarnSpy.mockRestore();
    });

    test('Should handle string numbers correctly', () => {
      render(<MatrixDifficultyEstimator criteriaCount="3" alternativeCount="2" />);
      expect(screen.getByText('3 pairs to compare')).toBeInTheDocument();
    });

    test('Should handle negative numbers', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      render(<MatrixDifficultyEstimator criteriaCount={-5} alternativeCount={2} />);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    test('Should round float numbers to integers', () => {
      render(<MatrixDifficultyEstimator criteriaCount={2.7} alternativeCount={3.4} />);
      expect(screen.getByText('7 pairs to compare')).toBeInTheDocument();
    });
  });

  // ======================
  // 6. CALLBACK TESTS
  // ======================

  describe('Difficulty Change Callback', () => {
    test('Should call onDifficultyChange with correct level', async () => {
      const mockCallback = jest.fn();
      render(
        <MatrixDifficultyEstimator
          criteriaCount={3}
          alternativeCount={3}
          onDifficultyChange={mockCallback}
        />
      );

      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalledWith('MODERATE');
      });
    });

    test('Should handle invalid callback gracefully', () => {
      const { container } = render(
        <MatrixDifficultyEstimator
          criteriaCount={3}
          alternativeCount={3}
          onDifficultyChange="not a function"
        />
      );
      expect(container).toBeTruthy();
    });
  });

  // ======================
  // 7. RENDERING TESTS
  // ======================

  describe('Rendering', () => {
    test('Should display breakdown details when pairs > 0', () => {
      render(<MatrixDifficultyEstimator criteriaCount={3} alternativeCount={2} />);
      expect(screen.getByText('Criteria Pairs')).toBeInTheDocument();
      expect(screen.getByText('Alt Pairs')).toBeInTheDocument();
    });

    test('Should not crash with large numbers', () => {
      const { container } = render(
        <MatrixDifficultyEstimator criteriaCount={50} alternativeCount={50} />
      );
      expect(container).toBeTruthy();
    });

    test('Should have collapsible "How time is estimated" section', () => {
      render(<MatrixDifficultyEstimator criteriaCount={3} alternativeCount={2} />);
      expect(screen.getByText('How is time estimated?')).toBeInTheDocument();
    });
  });

  // ======================
  // 8. EDGE CASES
  // ======================

  describe('Edge Cases', () => {
    test('Should handle float rounding correctly', () => {
      render(<MatrixDifficultyEstimator criteriaCount={2.5} alternativeCount={2.5} />);
      expect(screen.getByText('3 pairs to compare')).toBeInTheDocument();
    });

    test('Should not crash with extremely large numbers', () => {
      const { container } = render(
        <MatrixDifficultyEstimator criteriaCount={1000} alternativeCount={1000} />
      );
      expect(container).toBeTruthy();
    });
  });

  // ======================
  // 9. ACCESSIBILITY TESTS
  // ======================

  describe('Accessibility', () => {
    test('Should have semantic HTML structure', () => {
      const { container } = render(
        <MatrixDifficultyEstimator criteriaCount={3} alternativeCount={2} />
      );
      const details = container.querySelector('details');
      const summary = container.querySelector('summary');
      expect(details).toBeTruthy();
      expect(summary).toBeTruthy();
    });

    test('Should have descriptive text for screen readers', () => {
      render(<MatrixDifficultyEstimator criteriaCount={3} alternativeCount={2} />);
      expect(screen.getByText(/pairs to compare/)).toBeInTheDocument();
      expect(screen.getByText(/comparing/)).toBeInTheDocument();
    });
  });
});
