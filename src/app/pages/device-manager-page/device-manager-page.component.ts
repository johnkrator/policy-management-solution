import {Component, OnInit, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Subscription} from 'rxjs';
import {WebsocketService} from '../../services/websocket.service';

interface Policy {
  id: number;
  name: string;
  enabled: boolean;
}

@Component({
  selector: 'app-device-manager-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './device-manager-page.component.html',
  styleUrl: './device-manager-page.component.css'
})
export class DeviceManagerPageComponent implements OnInit, OnDestroy {
  private wsSubscription?: Subscription;
  private statusSubscription?: Subscription;
  isConnected = false;
  sendingInProgress = false;
  lastMessage: string = '';

  policies: Policy[] = [
    {id: 1, name: 'lock screen', enabled: false},
    {id: 2, name: 'disable camera', enabled: false},
    {id: 3, name: 'geo location', enabled: false},
    {id: 4, name: 'screenshot', enabled: false},
    {id: 5, name: 'shutdown', enabled: false},
    {id: 6, name: 'restart', enabled: false},
    {id: 7, name: 'disable browser', enabled: false},
    {id: 8, name: 'disable usb', enabled: false},
    {id: 9, name: 'force password change', enabled: false},
  ];

  constructor(private wsService: WebsocketService) {
  }

  ngOnInit() {
    // Monitor WebSocket connection status
    this.statusSubscription = this.wsService.connectionStatus().subscribe(connected => {
      this.isConnected = connected;
      if (connected) {
        console.log('Connected to WebSocket server');
      } else {
        console.log('Disconnected from WebSocket server');
      }
    });

    // Subscribe to messages
    this.wsSubscription = this.wsService.getMessages().subscribe({
      next: (message: string) => {
        console.log('Received message:', message);
        this.lastMessage = message;
        this.sendingInProgress = false;

        // Handle policy update responses
        if (message.startsWith('POLICY_UPDATE')) {
          const parts = message.split('|');
          if (parts.length === 3) {
            const policyId = parseInt(parts[1], 10);
            const enabled = parts[2] === 'true';

            const policy = this.policies.find(p => p.id === policyId);
            if (policy) {
              policy.enabled = enabled;
            }
          }
        }
        // Other message types can be handled here
        else if (message.startsWith('CONNECT')) {
          console.log('Connection confirmed by server');
        }
      },
      error: (err) => {
        console.error('WebSocket message error:', err);
        this.sendingInProgress = false;
      }
    });
  }

  togglePolicy(policyId: number): void {
    // Don't allow toggling if already in progress or disconnected
    if (this.sendingInProgress || !this.isConnected) {
      console.warn('Cannot toggle: WebSocket not connected or operation in progress');
      return;
    }

    const policy = this.policies.find(p => p.id === policyId);
    if (policy) {
      // Optimistically update UI (will be confirmed by echo response)
      policy.enabled = !policy.enabled;
      this.sendingInProgress = true;

      // Create a string-based policy update message
      const message = this.wsService.createPolicyUpdateMessage(policyId, policy.enabled);

      const sent = this.wsService.sendMessage(message);
      if (!sent) {
        // Revert the optimistic update if sending failed
        policy.enabled = !policy.enabled;
        this.sendingInProgress = false;
      }
    }
  }

  ngOnDestroy() {
    this.wsSubscription?.unsubscribe();
    this.statusSubscription?.unsubscribe();
    this.wsService.closeConnection();
  }
}
