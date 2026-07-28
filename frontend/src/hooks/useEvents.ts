import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getToken } from '../api/client';

export type EventName =
  | 'scooter:changed'
  | 'rental:changed'
  | 'analytics:changed';

export function useEvents(handlers: Partial<Record<EventName, () => void>>) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const wsOrigin = import.meta.env.VITE_WS_URL || '';
    const token = getToken();
    const socket: Socket = io(wsOrigin || undefined, {
      transports: ['websocket'],
      path: '/events/',
      auth: token ? { token } : undefined,
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1500,
    });

    const onChange = (name: EventName) => () => {
      handlersRef.current[name]?.();
    };

    socket.on('connect', () => {
      // eslint-disable-next-line no-console
      console.debug('[ws] connected', socket.id);
    });
    socket.on('disconnect', (reason) => {
      // eslint-disable-next-line no-console
      console.debug('[ws] disconnected', reason);
    });

    socket.on('scooter:changed', onChange('scooter:changed'));
    socket.on('rental:changed', onChange('rental:changed'));
    socket.on('analytics:changed', onChange('analytics:changed'));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);
}
