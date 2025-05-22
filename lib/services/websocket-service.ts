"use client";

import { VideoData } from "@/lib/types/video";

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface JobUpdate {
  jobId: string;
  status: JobStatus;
  progress: number;
  message?: string;
  updatedAt: string;
  result?: {
    success: boolean;
    data: VideoData['data'];
  };
}

export class WebSocketService {
  private socket: WebSocket | null = null;
  private jobId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private listeners: { [key: string]: ((data: any) => void)[] } = {
    'update': [],
    'error': [],
    'connected': [],
    'disconnected': [],
  };

  /**
   * Connect to the WebSocket server for a specific job
   * @param jobId - The ID of the job to connect to
   */
  public connect(jobId: string): void {
    if (this.socket) {
      this.disconnect();
    }

    this.jobId = jobId;
    const wsUrl = `${process.env.NEXT_PUBLIC_BACKEND_WS}/jobs/${jobId}/updates`;
    
    try {
      console.log(`Connecting to WebSocket at ${wsUrl}`);
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connection established');
        this.reconnectAttempts = 0;
        this.notifyListeners('connected', { jobId });
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as JobUpdate;
          console.log('WebSocket message received:', data);
          this.notifyListeners('update', data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          this.notifyListeners('error', { message: 'Failed to parse WebSocket message' });
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.notifyListeners('error', { message: 'WebSocket connection error' });
      };
      
      this.socket.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        this.notifyListeners('disconnected', { code: event.code, reason: event.reason });
        
        // Try to reconnect if not a normal closure
        if (event.code !== 1000 && event.code !== 1001) {
          this.attemptReconnect();
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.notifyListeners('error', { message: 'Failed to establish WebSocket connection' });
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.jobId = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Register a listener for WebSocket events
   * @param event - The event to listen for ('update', 'error', 'connected', 'disconnected')
   * @param callback - The callback function to call when the event occurs
   */
  public on(event: 'update' | 'error' | 'connected' | 'disconnected', callback: (data: any) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    
    this.listeners[event].push(callback);
  }

  /**
   * Remove a listener for WebSocket events
   * @param event - The event to stop listening for
   * @param callback - The callback function to remove
   */
  public off(event: 'update' | 'error' | 'connected' | 'disconnected', callback: (data: any) => void): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Maximum reconnect attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff with max of 30 seconds
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.jobId) {
        this.connect(this.jobId);
      }
    }, delay);
  }

  /**
   * Notify all listeners of an event
   * @param event - The event that occurred
   * @param data - The data to pass to the listeners
   */
  private notifyListeners(event: string, data: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }
}

// Export a singleton instance
export const websocketService = new WebSocketService();
