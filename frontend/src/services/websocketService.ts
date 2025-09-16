import { io, Socket } from 'socket.io-client';

// WebSocket data types
interface WebSocketData {
  [key: string]: unknown;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      this.socket = io('http://localhost:3001', {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔌 Connected to WebSocket server');
      this.reconnectAttempts = 0;
      // Join analytics room
      this.socket?.emit('join-analytics');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from WebSocket server:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });

    // Listen for real-time data updates
    this.socket.on('prediction-data', (data) => {
      console.log('📈 Real-time prediction data:', data);
      // Emit custom event for React components
      window.dispatchEvent(new CustomEvent('predictionUpdate', { detail: data }));
    });

    this.socket.on('analytics-data', (data) => {
      console.log('📊 Real-time analytics data:', data);
      // Emit custom event for React components
      window.dispatchEvent(new CustomEvent('analyticsUpdate', { detail: data }));
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  // Public methods for sending data
  public sendPredictionUpdate(data: WebSocketData) {
    if (this.socket?.connected) {
      this.socket.emit('prediction-update', data);
    } else {
      console.warn('WebSocket not connected, cannot send prediction update');
    }
  }

  public sendAnalyticsUpdate(data: WebSocketData) {
    if (this.socket?.connected) {
      this.socket.emit('analytics-update', data);
    } else {
      console.warn('WebSocket not connected, cannot send analytics update');
    }
  }

  // Public methods for subscribing to updates
  public onPredictionUpdate(callback: (data: WebSocketData) => void) {
    const handler = (event: CustomEvent) => callback(event.detail);
    window.addEventListener('predictionUpdate', handler as EventListener);
    return () => window.removeEventListener('predictionUpdate', handler as EventListener);
  }

  public onAnalyticsUpdate(callback: (data: WebSocketData) => void) {
    const handler = (event: CustomEvent) => callback(event.detail);
    window.addEventListener('analyticsUpdate', handler as EventListener);
    return () => window.removeEventListener('analyticsUpdate', handler as EventListener);
  }

  // Connection status
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Disconnect
  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;