import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';

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
export class DeviceManagerPageComponent {
  policies: Policy[] = [
    {id: 1, name: 'lock screen', enabled: false},
    {id: 2, name: 'disable camera', enabled: false},
    {id: 3, name: 'geo location', enabled: false},
    {id: 4, name: 'screenshot', enabled: false},
  ];

  togglePolicy(policyId: number): void {
    const policyIndex = this.policies.findIndex(policy => policy.id === policyId);
    if (policyIndex !== -1) {
      this.policies[policyIndex].enabled = !this.policies[policyIndex].enabled;
    }
  }
}
