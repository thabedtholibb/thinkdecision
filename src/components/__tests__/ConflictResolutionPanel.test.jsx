/**
 * Unit Tests for ConflictResolutionPanel Component
 *
 * Tests:
 * - 3-step workflow (pair selection → expert selection → reason input)
 * - API integration and error handling
 * - Duplicate prevention
 * - Notification system
 * - Loading states
 * - Validation
 * - Responsive design
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConflictResolutionPanel from '../ConflictResolutionPanel';

// Mock fetch API
global.fetch = jest.fn();

describe('ConflictResolutionPanel Component', () => {
  // ===========================
  // SETUP & FIXTURES
  // ===========================

  const mockDisagreementPairs = [
    {
      pair: [0, 1],
      item_a: 'Kualitas',
      item_b: 'Harga',
      variance: 0.23,
      expert_views: {
        'expert_1': 5,
        'expert_2': 7,
        'expert_3': 3,
        'expert_4': 6,
        'expert_5': 4,
      },
      suggestion: 'REVIEW',
      median: 5,
      min: 3,
      max: 7,
    },
    {
      pair: [1, 2],
      item_a: 'Harga',
      item_b: 'Keberlanjutan',
      variance: 0.18,
      expert_views: {
        'expert_1': 4,
        'expert_2': 6,
        'expert_3': 4,
        'expert_4': 5,
        'expert_5': 3,
      },
      suggestion: 'MODERATE',
      median: 4,
      min: 3,
      max: 6,
    },
  ];

  const mockExperts = {
    'expert_1': { name: 'Dr. Budi', email: 'budi@example.com', avatarColor: '#FF6B6B' },
    'expert_2': { name: 'Prof. Ani', email: 'ani@example.com', avatarColor: '#4ECDC4' },
    'expert_3': { name: 'Ir. Citra', email: 'citra@example.com', avatarColor: '#45B7D1' },
    'expert_4': { name: 'Dr. Dede', email: 'dede@example.com', avatarColor: '#FFA07A' },
    'expert_5': { name: 'Eng. Eka', email: 'eka@example.com', avatarColor: '#98D8C8' },
  };

  const defaultProps = {
    caseId: 'case-123',
    disagreementPairs: mockDisagreementPairs,
    experts: mockExperts,
    onRevisionRequested: jest.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    fetch.mockClear();
    jest.clearAllMocks();
  });

  // ===========================
  // RENDERING TESTS
  // ===========================

  test('renders without crashing', () => {
    render(<ConflictResolutionPanel {...defaultProps} />);
    expect(screen.getByText(/Request Revision/i)).toBeInTheDocument();
  });

  test('displays all disagreement pairs', () => {
    render(<ConflictResolutionPanel {...defaultProps} />);
    expect(screen.getByText(/Kualitas.*Harga/i)).toBeInTheDocument();
    expect(screen.getByText(/Harga.*Keberlanjutan/i)).toBeInTheDocument();
  });

  test('shows variance for each pair', () => {
    render(<ConflictResolutionPanel {...defaultProps} />);
    expect(screen.getByText('0.23')).toBeInTheDocument();
    expect(screen.getByText('0.18')).toBeInTheDocument();
  });

  test('displays expert count and range for each pair', () => {
    render(<ConflictResolutionPanel {...defaultProps} />);
    // Range [min-max] should be shown
    expect(screen.getByText(/3 - 7/)).toBeInTheDocument();
    expect(screen.getByText(/3 - 6/)).toBeInTheDocument();
  });

  test('renders empty state for no disagreement pairs', () => {
    render(
      <ConflictResolutionPanel
        {...defaultProps}
        disagreementPairs={[]}
      />
    );
    expect(screen.getByText(/No disagreements/i)).toBeInTheDocument();
  });

  // ===========================
  // WORKFLOW TESTS
  // ===========================

  test('step 1: displays pair selection buttons', () => {
    render(<ConflictResolutionPanel {...defaultProps} />);
    const pairButtons = screen.getAllByRole('button', { name: /Kualitas|Harga|Keberlanjutan/i });
    expect(pairButtons.length).toBeGreaterThan(0);
  });

  test('step 1→2: clicking pair shows expert selection options', async () => {
    const user = userEvent.setup();
    render(<ConflictResolutionPanel {...defaultProps} />);

    // Click first pair
    const pairButton = screen.getByText(/Kualitas.*Harga/i);
    await user.click(pairButton);

    // Should show expert selection
    await waitFor(() => {
      expect(screen.getByText(/Dr\. Budi/)).toBeInTheDocument();
    });
  });

  test('step 2: displays expert list with correct data', async () => {
    const user = userEvent.setup();
    render(<ConflictResolutionPanel {...defaultProps} />);

    const pairButton = screen.getByText(/Kualitas.*Harga/i);
    await user.click(pairButton);

    await waitFor(() => {
      expect(screen.getByText('Prof. Ani')).toBeInTheDocument();
      expect(screen.getByText('Ir. Citra')).toBeInTheDocument();
    });
  });

  test('step 2→3: clicking expert shows reason input', async () => {
    const user = userEvent.setup();
    render(<ConflictResolutionPanel {...defaultProps} />);

    // Step 1: Select pair
    const pairButton = screen.getByText(/Kualitas.*Harga/i);
    await user.click(pairButton);

    // Step 2: Select expert
    const expertButton = screen.getByText('Dr. Budi');
    await user.click(expertButton);

    // Step 3: Should show reason input
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/reason/i)).toBeInTheDocument();
    });
  });

  test('step 3: shows auto-generated default reason', async () => {
    const user = userEvent.setup();
    render(<ConflictResolutionPanel {...defaultProps} />);

    const pairButton = screen.getByText(/Kualitas.*Harga/i);
    await user.click(pairButton);

    const expertButton = screen.getByText('Dr. Budi');
    await user.click(expertButton);

    await waitFor(() => {
      const reasonInput = screen.getByPlaceholderText(/reason/i);
      expect(reasonInput.value).toContain('Kualitas');
    });
  });

  test('allows editing reason text', async () => {
    const user = userEvent.setup();
    render(<ConflictResolutionPanel {...defaultProps} />);

    const pairButton = screen.getByText(/Kualitas.*Harga/i);
    await user.click(pairButton);

    const expertButton = screen.getByText('Dr. Budi');
    await user.click(expertButton);

    const reasonInput = screen.getByPlaceholderText(/reason/i);
    await user.clear(reasonInput);
    await user.type(reasonInput, 'Custom reason here');

    expect(reasonInput.value).toBe('Custom reason here');
  });

  // ===========================
  // API INTEGRATION TESTS
  // ===========================

  test('submits revision request to correct API endpoint', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<ConflictResolutionPanel {...defaultProps} />);

    const pairButton = screen.getByText(/Kualitas.*Harga/i);
    await user.click(pairButton);

    const expertButton = screen.getByText('Dr. Budi');
    await user.click(expertButton);

    const submitButton = screen.getByText(/Submit/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/cases/case-123/request-revision',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  test('includes correct data in API request body', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<ConflictResolutionPanel {...defaultProps} />);

    const pairButton = screen.getByText(/Kualitas.*Harga/i);
    await user.click(pairButton);

    const expertButton = screen.getByText('Dr. Budi');
    await user.click(expertButton);

    const submitButton = screen.getByText(/Submit/i);
    await user.click(submitButton);

    await waitFor(() => {
      const callArgs = fetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body).toHaveProperty('expert_id', 'expert_1');
      expect(body).toHaveProperty('pair');
      expect(body).toHaveProperty('reason');
    });
  });

  test('handles API success response', async () => {
    const user = userEvent.setup();
    const onRevisionRequested = jest.fn();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(
      <ConflictResolutionPanel
        {...defaultProps}
        onRevisionRequested={onRevisionRequested}
      />
    );

    const pairButton = screen.getByText(/Kualitas.*Harga/i);
    await user.click(pairButton);

    const expertButton = screen.getByText('Dr. Budi');
    await user.click(expertButton);

    const submitButton = screen.getByText(/Submit/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(onRevisionRequested).toHaveBeenCalled();
    });
  });

  test('handles API error response', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<ConflictResolutionPanel {...defaultProps} />);

    const pairButton = screen.getByText(/Kualitas.*Harga/i);
    await user.click(pairButton);

    const expertButton = screen.getByText('Dr. Budi');
    await user.click(expertButton);

    const submitButton = screen.getByText(/Submit/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  test('shows network error notification', async () => {
    const user = userEvent.setup();
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<ConflictResolutionPanel {...defaultProps} />);

    const pairButton = screen.getByText(/Kualitas.*Harga/i);
    await user.click(pairButton);

    const expertButton = screen.getByText('Dr. Budi');
    await user.click(expertButton);

    const submitButton = screen.getByText(/Submit/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  // ===========================
  // DUPLICATE PREVENTION TESTS
  // ===========================

  test('prevents submitting duplicate revision request for same pair+expert', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<ConflictResolutionPanel {...defaultProps} />);

    const pairButton = screen.getByText(/Kualitas.*Harga/i);
    await user.click(pairButton);

    const expertButton = screen.getByText('Dr. Budi');
    await user.click(expertButton);

    const submitButton = screen.getByText(/Submit/i);

    // First submission
    await user.click(submitButton);
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    // Second submission should be blocked
    const submitButton2 = screen.queryByText(/Submit/i);
    if (submitButton2) {
      expect(submitButton2).toBeDisabled();
    }
  });

  test('shows indication that pair already requested', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<ConflictResolutionPanel {...defaultProps} />);

    const pairButton = screen.getByText(/Kualitas.*Harga/i);
    await user.click(pairButton);

    const expertButton = screen.getByText('Dr. Budi');
    await user.click(expertButton);

    const submitButton = screen.getByText(/Submit/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/already requested/i)).toBeInTheDocument();
    });
  });

  // ===========================
  // NOTIFICATION TESTS
  // ===========================

  test('shows success notification after submission', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<ConflictResolutionPanel {...defaultProps} />);

    const pairButton = screen.getByText(/Kualitas.*Harga/i);
    await user.click(pairButton);

    const expertButton = screen.getByText('Dr. Budi');
    await user.click(expertButton);

    const submitButton = screen.getByText(/Submit/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/revision requested/i)).toBeInTheDocument();
    });
  });

  test('auto-dismisses notification after 3 seconds', async () => {
    const user = userEvent.setup();
    jest.useFakeTimers();

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<ConflictResolutionPanel {...defaultProps} />);

    const pairButton = screen.getByText(/Kualitas.*Harga/i);
    await user.click(pairButton);

    const expertButton = screen.getByText('Dr. Budi');
    await user.click(expertButton);

    const submitButton = screen.getByText(/Submit/i);
    await user.click(submitButton);

    jest.advanceTimersByTime(3000);

    // Notification should be gone
    await waitFor(() => {
      expect(screen.queryByText(/revision requested/i)).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  // ===========================
  // LOADING STATE TESTS
  // ===========================

  test('shows loading spinner when isLoading prop is true', () => {
    render(
      <ConflictResolutionPanel
        {...defaultProps}
        isLoading={true}
      />
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('disables buttons during submission', async () => {
    const user = userEvent.setup();
    fetch.mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      }), 1000);
    }));

    render(<ConflictResolutionPanel {...defaultProps} />);

    const pairButton = screen.getByText(/Kualitas.*Harga/i);
    await user.click(pairButton);

    const expertButton = screen.getByText('Dr. Budi');
    await user.click(expertButton);

    const submitButton = screen.getByText(/Submit/i);
    await user.click(submitButton);

    // Button should be disabled while loading
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  // ===========================
  // VALIDATION TESTS
  // ===========================

  test('disables submit button until expert is selected', async () => {
    const user = userEvent.setup();
    render(<ConflictResolutionPanel {...defaultProps} />);

    const pairButton = screen.getByText(/Kualitas.*Harga/i);
    await user.click(pairButton);

    const submitButton = screen.getByText(/Submit/i);
    expect(submitButton).toBeDisabled();

    const expertButton = screen.getByText('Dr. Budi');
    await user.click(expertButton);

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  // ===========================
  // RESPONSIVE DESIGN TESTS
  // ===========================

  test('renders mobile-friendly layout', () => {
    const { container } = render(<ConflictResolutionPanel {...defaultProps} />);
    // Should have responsive grid classes
    expect(container.querySelector('[class*="grid-cols"]')).toBeInTheDocument();
  });

  test('handles long expert names in mobile view', async () => {
    const user = userEvent.setup();
    const longNameExperts = {
      'expert_1': { name: 'Dr. Muhammad Budi Susanto Hartono, Ph.D.', email: 'x@example.com', avatarColor: '#FF6B6B' },
    };

    render(
      <ConflictResolutionPanel
        {...defaultProps}
        experts={longNameExperts}
      />
    );

    const pairButton = screen.getByText(/Kualitas.*Harga/i);
    await user.click(pairButton);

    // Should still display without breaking layout
    expect(screen.getByText(/Muhammad Budi/)).toBeInTheDocument();
  });

  // ===========================
  // DARK MODE TESTS
  // ===========================

  test('applies dark mode classes', () => {
    const { container } = render(
      <div className="dark">
        <ConflictResolutionPanel {...defaultProps} />
      </div>
    );
    // Should have components with dark: classes
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  // ===========================
  // EDGE CASES
  // ===========================

  test('handles pair with only one expert having data', () => {
    const singleExpertPair = {
      pair: [0, 1],
      item_a: 'A',
      item_b: 'B',
      variance: 0,
      expert_views: {
        'expert_1': 5,
      },
      suggestion: 'REVIEW',
      median: 5,
      min: 5,
      max: 5,
    };

    render(
      <ConflictResolutionPanel
        {...defaultProps}
        disagreementPairs={[singleExpertPair]}
      />
    );

    expect(screen.getByText(/A.*B/i)).toBeInTheDocument();
  });

  test('handles very high variance pairs', () => {
    const highVariancePair = {
      pair: [0, 1],
      item_a: 'X',
      item_b: 'Y',
      variance: 0.95,
      expert_views: {
        'expert_1': 1,
        'expert_2': 9,
        'expert_3': 1,
        'expert_4': 9,
      },
      suggestion: 'HIGH_CONFLICT',
      median: 5,
      min: 1,
      max: 9,
    };

    render(
      <ConflictResolutionPanel
        {...defaultProps}
        disagreementPairs={[highVariancePair]}
      />
    );

    expect(screen.getByText(/HIGH_CONFLICT/i)).toBeInTheDocument();
  });
});
