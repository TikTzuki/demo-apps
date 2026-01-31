import {useEffect, useRef, useState, useCallback} from 'react';

interface UseWebSocketOptions {
    url: string;
    onMessage?: (data: unknown) => void;
    onError?: (error: Event) => void;
    onOpen?: () => void;
    onClose?: () => void;
    reconnectAttempts?: number;
    reconnectInterval?: number;
}

export function useWebSocket({
                                 url,
                                 onMessage,
                                 onError,
                                 onOpen,
                                 onClose,
                                 reconnectAttempts = 5,
                                 reconnectInterval = 3000,
                             }: UseWebSocketOptions) {
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [reconnectCount, setReconnectCount] = useState(0);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        const ws = new WebSocket(url);

        ws.onopen = () => {
            setIsConnected(true);
            setReconnectCount(0);
            onOpen?.();
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage?.(data);
            } catch {
                onMessage?.(event.data);
            }
        };

        ws.onerror = (error) => {
            onError?.(error);
        };

        ws.onclose = () => {
            setIsConnected(false);
            onClose?.();

            if (reconnectCount < reconnectAttempts) {
                setTimeout(() => {
                    setReconnectCount((prev) => prev + 1);
                    connect();
                }, reconnectInterval);
            }
        };

        wsRef.current = ws;
    }, [url, onMessage, onError, onOpen, onClose, reconnectAttempts, reconnectInterval, reconnectCount]);

    const disconnect = useCallback(() => {
        wsRef.current?.close();
        wsRef.current = null;
    }, []);

    const sendMessage = useCallback((data: unknown) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(typeof data === 'string' ? data : JSON.stringify(data));
        }
    }, []);

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    return {
        isConnected,
        sendMessage,
        disconnect,
        reconnect: connect,
    };
}
