import {Injectable} from '@angular/core';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';
import {Observable, timer, Subject, BehaviorSubject} from 'rxjs';
import {takeUntil, tap, share} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket$: WebSocketSubject<string> | null = null;
  private readonly SOCKET_URL = 'wss://echo.websocket.org';
  private messagesSubject = new Subject<string>();
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
          next: (message: string) => {
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

  private createWebSocket(): WebSocketSubject<string> {
    return webSocket<string>({
      url: this.SOCKET_URL,
      // Use raw string data for both incoming and outgoing messages
      deserializer: ({data}) => {
        // Return the raw data as a string
        return data.toString();
      },
      serializer: (value) => {
        // All outgoing messages are strings
        return value;
      },
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

  sendMessage(message: string): boolean {
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

  // Helper method to create a policy update message string
  createPolicyUpdateMessage(policyId: number, enabled: boolean): string {
    return `POLICY_UPDATE|${policyId}|${enabled}`;
  }

  getMessages(): Observable<string> {
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
