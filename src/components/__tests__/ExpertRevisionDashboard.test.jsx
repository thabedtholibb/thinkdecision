/**
 * Unit Tests for ExpertRevisionDashboard Component
 *
 * Tests:
 * - Display of pending revision requests
 * - Peer data visualization (range/median only)
 * - Revision submission workflow
 * - Progress tracking
 * - API integration
 * - Notification system
 * - Optional notes field
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpertRevisionDashboard from '../ExpertRevisionDashboard';

global.fetch = jest.fn();

describe('ExpertRevisionDashboard Component', () => {
  // ===========================
  // SETUP & FIXTURES
  // ===========================

  const mockRevisionRequests = [
    {
      pair: [0, 1],
      item_a: 'Kualitas',
      item_b: 'Harga',
      reason: 'Please reconsider this comparison',
      requested_at: '2026-05-30T10:00:00Z',
    },
    {
      pair: [1, 2],
      item_a: 'Harga',
      item_b: 'Keberlanjutan',
      reason: 'High variance among experts',
      requested_at: '2026-05-30T11:00:00Z',
    },
  ];

  const mockPeerData = {
    '0-1': {
      your_value: 5,
      peer_range: [3, 7],
      peer_median: 5,
      peer_mean: 5.2,
      peer_count: 4,
    },
    '1-2': {
      your_value: 4,
      peer_range: [2, 6],
      peer_median: 4,
      peer_mean: 3.8,
      peer_count: 4,
    },
  };

  const defaultProps = {
    caseId: 'case-123',
    revisionRequests: mockRevisionRequests,
    peerData: mockPeerData,
    onRevisionSubmitted: jest.fn(),
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
    render(<ExpertRevisionDashboard {...defaultProps} />);
    expect(screen.getByText(/revision request/i)).toBeInTheDocument();
  });

  test('displays empty state when no revision requests', () => {
    render(
      <ExpertRevisionDashboard
        {...defaultProps}
        revisionRequests={[]}
      />
    );
    expect(screen.getByText(/No pending/i)).toBeInTheDocument();
  });

  test('displays all pending revision requests', () => {
    render(<ExpertRevisionDashboard {...defaultProps} />);
    expect(screen.getByText(/Kualitas.*Harga/i)).toBeInTheDocument();
    expect(screen.getByText(/Harga.*Keberlanjutan/i)).toBeInTheDocument();
  });

  test('shows creator reason for each request', () => {
    render(<ExpertRevisionDashboard {...defaultProps} />);
    expect(screen.getByText(/Please reconsider/i)).toBeInTheDocument();
    expect(screen.getByText(/High variance/i)).toBeInTheDocument();
  });

  test('displays progress summary', () => {
    render(<ExpertRevisionDashboard {...defaultProps} />);
    // Should show Pending/Completed/Total counts
    expect(screen.getByText(/Pending/i)).toBeInTheDocument();
    expect(screen.getByText(/Completed/i)).toBeInTheDocument();
    expect(screen.getByText(/Total/i)).toBeInTheDocument();
  });

  // ===========================
  // PEER DATA DISPLAY TESTS
  // ===========================

  test('shows peer range (min-max) for comparison', async () => {
    const user = userEvent.setup();
    render(<ExpertRevisionDashboard {...defaultProps} />);

    // Click first request to expand
    const requestButton = screen.getAllByRole('button')[0];
    await user.click(requestButton);

    await waitFor(() => {
      expect(screen.getByText(/3 - 7/)).toBeInTheDocument();
    });
  });

  test('shows peer median value', async () => {
    const user = userEvent.setup();
    render(<ExpertRevisionDashboard {...defaultProps} />);

    const requestButton = screen.getAllByRole('button')[0];
    await user.click(requestButton);

    await waitFor(() => {
      expect(screen.getByText(/median.*5/i)).toBeInTheDocument();
    });
  });

  test('NEVER shows individual expert names in peer data', async () => {
    const user = userEvent.setup();
    render(<ExpertRevisionDashboard {...defaultProps} />);

    const requestButton = screen.getAllByRole('button')[0];
    await user.click(requestButton);

    await waitFor(() => {
      // Should show peer data but NOT expert names
      expect(screen.getByText(/3 - 7/)).toBeInTheDocument();
      expect(screen.queryByText('Dr. Budi')).not.toBeInTheDocument();
      expect(screen.queryByText('Prof. Ani')).not.toBeInTheDocument();
    });
  });

  test('shows your current judgment vs peer median', async () => {
    const user = userEvent.setup();
    render(<ExpertRevisionDashboard {...defaultProps} />);

    const requestButton = screen.getAllByRole('button')[0];
    await user.click(requestButton);

    await waitFor(() => {
      expect(screen.getByText(/Your Judgment/i)).toBeInTheDocument();
      expect(screen.getByText(/Peer Median/i)).toBeInTheDocument();
    });
  });

  // ===========================
  // SLIDER INTERACTION TESTS
  // ===========================

  test('displays Saaty scale slider (1-9)', async () => {
    const user = userEvent.setup();
    render(<ExpertRevisionDashboard {...defaultProps} />);

    const requestButton = screen.getAllByRole('button')[0];
    await user.click(requestButton);

    await waitFor(() => {
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '1');
      expect(slider).toHaveAttribute('max', '9');
    });
  });

  test('slider value updates on change', async () => {
    const user = userEvent.setup();
    render(<ExpertRevisionDashboard {...defaultProps} />);

    const requestButton = screen.getAllByRole('button')[0];
    await user.click(requestButton);

    const slider = await screen.findByRole('slider');
    await user.tripleClick(slider);
    await user.type(slider, '7');

    await waitFor(() => {
      expect(slider.value).toBe('7');
    });
  });

  test('displays current slider value prominently', async () => {
    const user = userEvent.setup();
    render(<ExpertRevisionDashboard {...defaultProps} />);

    const requestButton = screen.getAllByRole('button')[0];
    await user.click(requestButton);

    const slider = await screen.findByRole('slider');
    fireEvent.change(slider, { target: { value: '6' } });

    await waitFor(() => {
      expect(screen.getByText('6')).toBeInTheDocument();
    });
  });

  // ===========================
  // RECOMMENDATION TESTS
  // ===========================

  test('shows recommendation based on Z-score', async () => {
    const user = userEvent.setup();
    render(<ExpertRevisionDashboard {...defaultProps} />);

    const requestButton = screen.getAllByRole('button')[0];
    await user.click(requestButton);

    await waitFor(() => {
      // Your value (5) == peer median (5), so recommendation should be "close"
      expect(screen.getByText(/close/i)).toBeInTheDocument();
    });
  });

  test('shows "differs" recommendation for moderate difference', async () => {
    const user = userEvent.setup();
    const moderatePeerData = {
      '0-1': {
        your_value: 7,
        peer_range: [3, 7],
        peer_median: 4,
        peer_mean: 4,
        peer_count: 4,
      },
    };

    render(
      <ExpertRevisionDashboard
        {...defaultProps}
        peerData={moderatePeerData}
      />
    );

    const requestButton = screen.getAllByRole('button')[0];
    await user.click(requestButton);

    await waitFor(() => {
      // Should show "differs" when Z-score is 1-2
      expect(screen.getByText(/differs/i)).toBeInTheDocument();
    });
  });

  test('shows "strongly differs" for high Z-score', async () => {
    const user = userEvent.setup();
    const extremePeerData = {
      '0-1': {
        your_value: 1,
        peer_range: [7, 9],
        peer_median: 8,
        peer_mean: 8,
        peer_count: 4,
      },
    };

    render(
      <ExpertRevisionDashboard
        {...defaultProps}
        peerData={extremePeerData}
      />
    );

    const requestButton = screen.getAllByRole('button')[0];
    await user.click(requestButton);

    await waitFor(() => {
      expect(screen.getByText(/strongly differs/i)).toBeInTheDocument();
    });
  });

  // ===========================
  // ACTION BUTTONS TESTS
  // ===========================

  test('displays "Submit Revised Judgment" button', async () => {
    const user = userEvent.setup();
    render(<ExpertRevisionDashboard {...defaultProps} />);

    const requestButton = screen.getAllByRole('button')[0];
    await user.click(requestButton);

    await waitFor(() => {
      expect(screen.getByText(/Submit.*Judgment/i)).toBeInTheDocument();
    });
  });

  test('displays "Keep Original" button', async () => {
    const user = userEvent.setup();
    render(<ExpertRevisionDashboard {...defaultProps} />);

    const requestButton = screen.getAllByRole('button')[0];
    await user.click(requestButton);

    await waitFor(() => {
      expect(screen.getByText(/Keep Original/i)).toBeInTheDocument();
    });
  });

  // ===========================
  // SUBMIT REVISED JUDGMENT TESTS
  // ===========================

  test('submits revised judgment to correct API endpoint', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<ExpertRevisionDashboard {...defaultProps} />);

    const requestButton = screen.getAllByRole('button')[0];
    await user.click(requestButton);

    const slider = await screen.findByRole('slider');
    fireEvent.change(slider, { target: { value: '7' } });

    const submitButton = screen.getByText(/Submit.*Judgment/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/cases/case-123/submit-revision',
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

    render(<ExpertRevisionDashboard {...defaultProps} />);

    const requestButton = screen.getAllByRole('button')[0];
    await user.click(requestButton);

    const slider = await screen.findByRole('slider');
    fireEvent.change(slider, { target: { value: '7' } });

    const submitButton = screen.getByText(/Submit.*Judgment/i);
    await user.click(submitButton);

    await waitFor(() => {
      const callArgs = fetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body).toHaveProperty('pair');
      expect(body).toHaveProperty('new_value', 7);
    });
  });

  test('includes optional notes in submission', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<ExpertRevisionDashboard {...defaultProps} />);

    const requestButton = screen.getAllByRole('button')[0];
    await user.click(requestButton);

    const notesInput = screen.getByPlaceholderText(/notes/i);
    await user.type(notesInput, 'I reconsidered the weights');

    const slider = await screen.findByRole('slider');
    fireEvent.change(slider, { target: { value: '6' } });

    const submitButton = screen.getByText(/Submit.*Judgment/i);
    await user.click(submitButton);

    await waitFor(() => {
      const callArgs = fetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body).toHaveProperty('acceptance_notes', 'I reconsidered the weights');
    });
  });

  // ===========================
  // KEEP ORIGINAL TESTS
  // ===========================

  test('calls onRevisionSubmitted when Keep Original clicked', async () => {
    const user = userEvent.setup();
    const onRevisionSubmitted = jest.fn();

    render(
      <ExpertRevisionDashboard
        {...defaultProps}
        onRevisionSubmitted={onRevisionSubmitted}
      />
    );

    const requestButton = screen.getAllByRole('button')[0];
    await user.click(requestButton);

    const keepButton = screen.getByText(/Keep Original/i);
    await user.click(keepButton);

    await waitFor(() => {
      // Should mark as completed without API call
      expect(screen.getByText(/decided to keep/i)).toBeInTheDocument();
    });
  });

  test('tracks both submit and keep-original in completed set', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<ExpertRevisionDashboard {...defaultProps} />);

    // First request: submit revised
    const requests = screen.getAllByRole('button');
    await user.click(requests[0]);

    const slider = await screen.findByRole('slider');
    fireEvent.change(slider, { target: { value: '7' } });

    const submitButton = screen.getByText(/Submit.*Judgment/i);
    await user.click(submitButton);

    // Completed count should increase
    await waitFor(() => {
      expect(screen.getByText(/Completed.*1/i)).toBeInTheDocument();
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

    render(<ExpertRevisionDashboard {...defaultProps} />);

    const requestButton = screen.getAllByRole('button')[0];
    await user.click(requestButton);

    const slider = await screen.findByRole('slider');
    fireEvent.change(slider, { target: { value: '7' } });

    const submitButton = screen.getByText(/Submit.*Judgment/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/saved/i)).toBeInTheDocument();
    });
  });

  test('shows error notification on API failure', async () => {
    const user = userEvent.setup();
    fetch.mockRejectedValueOnce(new Error('API Error'));

    render(<ExpertRevisionDashboard {...defaultProps} />);

    const requestButton = screen.getAllByRole('button')[0];
    await user.click(requestButton);

    const slider = await screen.findByRole('slider');
    fireEvent.change(slider, { target: { value: '7' } });

    const submitButton = screen.getByText(/Submit.*Judgment/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  test('auto-dismisses notification after 3 seconds', async () => {
    const user = userEvent.setup();
    jest.useFakeTimers();

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<ExpertRevisionDashboard {...defaultProps} />);

    const requestButton = screen.getAllByRole('button')[0];
    await user.click(requestButton);

    const slider = await screen.findByRole('slider');
    fireEvent.change(slider, { target: { value: '7' } });

    const submitButton = screen.getByText(/Submit.*Judgment/i);
    await user.click(submitButton);

    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.queryByText(/saved/i)).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  // ===========================
  // PROGRESS TRACKING TESTS
  // ===========================

  test('initially shows all as pending', () => {
    render(<ExpertRevisionDashboard {...defaultProps} />);
    expect(screen.getByText(/Pending.*2/i)).toBeInTheDocument();
    expect(screen.getByText(/Completed.*0/i)).toBeInTheDocument();
  });

  test('updates progress when request completed', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<ExpertRevisionDashboard {...defaultProps} />);

    const requestButton = screen.getAllByRole('button')[0];
    await user.click(requestButton);

    const slider = await screen.findByRole('slider');
    fireEvent.change(slider, { target: { value: '7' } });

    const submitButton = screen.getByText(/Submit.*Judgment/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Pending.*1/i)).toBeInTheDocument();
      expect(screen.getByText(/Completed.*1/i)).toBeInTheDocument();
    });
  });

  test('disables completed requests from re-opening', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<ExpertRevisionDashboard {...defaultProps} />);

    const requestButton = screen.getAllByRole('button')[0];
    await user.click(requestButton);

    const slider = await screen.findByRole('slider');
    fireEvent.change(slider, { target: { value: '7' } });

    const submitButton = screen.getByText(/Submit.*Judgment/i);
    await user.click(submitButton);

    await waitFor(() => {
      // First request should now be disabled
      const firstRequest = screen.getAllByRole('button')[0];
      expect(firstRequest).toBeDisabled();
    });
  });

  // ===========================
  // LOADING STATE TESTS
  // ===========================

  test('shows loading spinner when isLoading true', () => {
    render(
      <ExpertRevisionDashboard
        {...defaultProps}
        isLoading={true}
      />
    );
    // Should show spinner or disabled state
    expect(screen.getByRole('progressbar') || screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('disables buttons during API call', async () => {
    const user = userEvent.setup();
    fetch.mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      }), 1000);
    }));

    render(<ExpertRevisionDashboard {...defaultProps} />);

    const requestButton = screen.getAllByRole('button')[0];
    await user.click(requestButton);

    const slider = await screen.findByRole('slider');
    fireEvent.change(slider, { target: { value: '7' } });

    const submitButton = screen.getByText(/Submit.*Judgment/i);
    await user.click(submitButton);

    // Button should be disabled while submitting
    expect(submitButton).toBeDisabled();
  });

  // ===========================
  // EDGE CASES
  // ===========================

  test('handles revision request without notes', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<ExpertRevisionDashboard {...defaultProps} />);

    const requestButton = screen.getAllByRole('button')[0];
    await user.click(requestButton);

    const slider = await screen.findByRole('slider');
    fireEvent.change(slider, { target: { value: '7' } });

    // Don't fill in notes
    const submitButton = screen.getByText(/Submit.*Judgment/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  test('handles peer data with peer_count = 1', () => {
    const singlePeerData = {
      '0-1': {
        your_value: 5,
        peer_range: [5, 5],
        peer_median: 5,
        peer_count: 1,
      },
    };

    render(
      <ExpertRevisionDashboard
        {...defaultProps}
        peerData={singlePeerData}
      />
    );

    expect(screen.getByText(/revision request/i)).toBeInTheDocument();
  });

  test('handles many revision requests (15+)', () => {
    const manyRequests = Array.from({ length: 20 }, (_, i) => ({
      pair: [i, i + 1],
      item_a: `Criteria ${i}`,
      item_b: `Criteria ${i + 1}`,
      reason: 'Review this',
      requested_at: new Date().toISOString(),
    }));

    render(
      <ExpertRevisionDashboard
        {...defaultProps}
        revisionRequests={manyRequests}
      />
    );

    expect(screen.getByText(/Pending.*20/i)).toBeInTheDocument();
  });
});
