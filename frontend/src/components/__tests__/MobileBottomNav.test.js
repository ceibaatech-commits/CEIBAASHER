import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import MobileBottomNav from '../MobileBottomNav';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

jest.mock('axios');
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));
jest.mock('framer-motion', () => {
  const React = require('react');
  const stripMotionProps = ({ children, whileTap, initial, animate, exit, transition, ...props }) => ({ children, ...props });
  return {
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: {
      div: (props) => {
        const cleaned = stripMotionProps(props);
        return <div {...cleaned}>{cleaned.children}</div>;
      },
      button: (props) => {
        const cleaned = stripMotionProps(props);
        return <button {...cleaned}>{cleaned.children}</button>;
      },
    },
  };
});

describe('MobileBottomNav join room behavior', () => {
  const navigateMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(navigateMock);
    useLocation.mockReturnValue({ pathname: '/' });
    useAuth.mockReturnValue({
      user: { id: 'u1', name: 'Demo One', username: 'demo1' },
      isAuthenticated: () => true,
    });
  });

  test('joins battle room directly when battle endpoint succeeds', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true } });
    render(<MobileBottomNav />);

    fireEvent.click(screen.getByRole('button', { name: 'Join Room' }));
    const roomInput = screen.getByPlaceholderText('• • • • • •');
    fireEvent.change(roomInput, { target: { value: 'abc123' } });
    await waitFor(() => expect(roomInput.value).toBe('ABC123'));
    fireEvent.click(screen.getByText('Join Room', { selector: 'button' }));

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

  test('falls back to social quiz-room when battle endpoint returns 404', async () => {
    axios.get
      .mockRejectedValueOnce({ response: { status: 404 } })
      .mockResolvedValueOnce({
        data: {
          success: true,
          room: { title: 'Social Room', questions: [{ id: 1 }] },
        },
      });

    render(<MobileBottomNav />);

    fireEvent.click(screen.getByRole('button', { name: 'Join Room' }));
    const roomInput = screen.getByPlaceholderText('• • • • • •');
    fireEvent.change(roomInput, { target: { value: 'abc123' } });
    await waitFor(() => expect(roomInput.value).toBe('ABC123'));
    fireEvent.click(screen.getByText('Join Room', { selector: 'button' }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/quiz-room/ABC123', {
        state: {
          room: { title: 'Social Room', questions: [{ id: 1 }] },
          questions: [{ id: 1 }],
        },
      });
    });
  });
});
