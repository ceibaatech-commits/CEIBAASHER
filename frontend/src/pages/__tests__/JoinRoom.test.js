import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import JoinRoom from '../JoinRoom';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

jest.mock('axios');
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));
jest.mock('../../components/Header', () => () => <div data-testid="header" />);
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

describe('JoinRoom fallback flow', () => {
  const navigateMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(navigateMock);
    useLocation.mockReturnValue({ pathname: '/join-room', state: null });
    useAuth.mockReturnValue({
      user: { id: 'u1', name: 'Demo One', username: 'demo1' },
      isAuthenticated: () => true,
      loading: false,
    });
  });

  test('shows validation error for short room code', async () => {
    render(<JoinRoom />);

    fireEvent.change(screen.getByPlaceholderText('Enter 6-character code'), { target: { value: 'A1' } });
    expect(screen.getByRole('button', { name: 'Join Room' })).toBeDisabled();
    expect(axios.get).not.toHaveBeenCalled();
  });

  test('navigates to battle room when battle endpoint succeeds', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true } });
    render(<JoinRoom />);

    fireEvent.change(screen.getByPlaceholderText('Enter 6-character code'), { target: { value: 'abc123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join Room' }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/live-battle/ABC123', {
        state: {
          isHost: false,
          playerName: 'Demo One',
          autoJoin: true,
        },
      });
    });
  });

  test('falls back to social quiz-room endpoint on battle 404', async () => {
    axios.get
      .mockRejectedValueOnce({ message: 'Request failed with status code 404', response: { status: 404 } })
      .mockResolvedValueOnce({
        data: {
          success: true,
          room: { title: 'Social Room', questions: [{ id: 1 }] },
        },
      });

    render(<JoinRoom />);

    fireEvent.change(screen.getByPlaceholderText('Enter 6-character code'), { target: { value: 'abc123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join Room' }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/quiz-room/ABC123', {
        state: {
          room: { title: 'Social Room', questions: [{ id: 1 }] },
          questions: [{ id: 1 }],
        },
      });
    });
  });

  test('shows private-room message when social fallback returns 403', async () => {
    axios.get
      .mockRejectedValueOnce({ message: 'Request failed with status code 404', response: { status: 404 } })
      .mockRejectedValueOnce({
        message: 'Request failed with status code 403',
        response: { status: 403, data: { detail: 'Private quiz' } },
      });

    render(<JoinRoom />);

    fireEvent.change(screen.getByPlaceholderText('Enter 6-character code'), { target: { value: 'abc123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join Room' }));

    await waitFor(() => {
      expect(
        screen.queryByText('Private quiz') ||
        screen.queryByText('You do not have access to this quiz room.') ||
        screen.queryByText('Unable to join this room.')
      ).toBeTruthy();
    });
  });
});
