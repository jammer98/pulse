import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../api/client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, logout } = useAuth();
  const socketRef = useRef(null);
  const [status, setStatus] = useState('disconnected');
  const [unreadCount, setUnreadCount] = useState(0);
  const [inboxNotifications, setInboxNotifications] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setStatus('disconnected');
      return undefined;
    }
    const socket = io(API_URL, { auth: { token } });
    socketRef.current = socket;
    setStatus('connecting');
    socket.on('connect', () => setStatus('live'));
    socket.on('disconnect', () => setStatus('disconnected'));
    socket.on('connect_error', (error) => {
      setStatus('disconnected');
      if (error?.message?.includes('401') || error?.message?.toLowerCase().includes('auth')) logout();
    });
    socket.on('notification:new', (notification) => {
      const normalized = { ...notification, created_at: notification.created_at || notification.createdAt };
      setInboxNotifications((items) => [normalized, ...items.filter((item) => item.id !== normalized.id)]);
      setUnreadCount((count) => count + 1);
      setToast(normalized);
      window.setTimeout(() => setToast((current) => current?.id === normalized.id ? null : current), 4000);
    });
    return () => socket.disconnect();
  }, [token, logout]);

  const value = useMemo(() => ({
    status, unreadCount, setUnreadCount, inboxNotifications, setInboxNotifications, toast, setToast
  }), [status, unreadCount, inboxNotifications, toast]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);
