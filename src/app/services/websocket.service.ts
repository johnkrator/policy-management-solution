import {Injectable} from '@angular/core';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';
import {Observable, timer, Subject, BehaviorSubject} from 'rxjs';
import {takeUntil, tap, share} from 'rxjs/operators';

export interface PolicyUpdateMessage {
  type: 'POLICY_UPDATE';
  policyId: number;
  enabled: boolean;
}

export interface ServerMessage {
  type: string;
  success: boolean;
  message?: string;
  data?: any;
}

export type WSMessage = PolicyUpdateMessage | ServerMessage;

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket$: WebSocketSubject<WSMessage> | null = null;
  private readonly SOCKET_URL = 'wss://echo.websocket.org';
  private messagesSubject = new Subject<WSMessage>();
  private messages$ = this.messagesSubject.asObservable().pipe(share());
  private connectionStatus$ = new BehaviorSubject<boolean>(false);
  private destroy$ = new Subject<void>();
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;

  constructor() {
    this.connect();
  }

  // Public API to get connection status
  public connectionStatus(): Observable<boolean> {
    return this.connectionStatus$.asObservable();
  }

  public connect(): void {
    if (!this.socket$ || this.socket$.closed) {
      this.socket$ = this.createWebSocket();

      this.socket$.pipe(
        tap({
          next: (message: WSMessage) => {
            console.log('Received message:', message);
            this.messagesSubject.next(message);
          },
          error: (error: any) => {
            console.error('WebSocket error:', error);
            this.connectionStatus$.next(false);
            this.reconnect();
          },
          complete: () => {
            console.log('WebSocket connection closed');
            this.connectionStatus$.next(false);
            this.reconnect();
          }
        }),
        takeUntil(this.destroy$)
      ).subscribe();
    }
  }

  private createWebSocket(): WebSocketSubject<WSMessage> {
    return webSocket<WSMessage>({
      url: this.SOCKET_URL,
      deserializer: ({data}) => {
        if (typeof data === 'string' && data.startsWith('Request served')) {
          return {
            type: 'CONNECT',
            success: true,
            message: data
          } as ServerMessage;
        }
        try {
          return typeof data === 'string' ? JSON.parse(data) : data;
        } catch (err) {
          console.warn('Invalid JSON response:', data);
          return {
            type: 'ERROR',
            success: false,
            message: 'Invalid server response'
          } as ServerMessage;
        }
      },
      serializer: (value) => JSON.stringify(value),
      openObserver: {
        next: () => {
          console.log('WebSocket connected');
          this.connectionStatus$.next(true);
          this.reconnectAttempts = 0;
        }
      },
      closeObserver: {
        next: () => {
          console.log('WebSocket disconnected');
          this.connectionStatus$.next(false);
        }
      }
    });
  }

  private reconnect(): void {
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})...`);

      // Exponential backoff for reconnection
      const backoffTime = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      timer(backoffTime).pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => this.connect());
    } else {
      console.error('Maximum reconnection attempts reached. Please refresh the page.');
    }
  }

  sendMessage(message: WSMessage): boolean {
    if (this.socket$ && this.connectionStatus$.value) {
      try {
        this.socket$.next(message);
        return true;
      } catch (error) {
        console.error('Failed to send message:', error);
        return false;
      }
    } else {
      console.warn('WebSocket not connected. Message not sent:', message);
      return false;
    }
  }

  getMessages(): Observable<WSMessage> {
    return this.messages$;
  }

  closeConnection(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }
  }
}
