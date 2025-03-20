import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {SidebarService} from '../../services/sidebar.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, RouterLinkActive],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  constructor(public sidebarService: SidebarService) {
  }

  get isSidebarOpen(): boolean {
    return this.sidebarService.getSidebarState();
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }
}
