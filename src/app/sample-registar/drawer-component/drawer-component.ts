import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { UiStateService } from '../../services/ui-state-service';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  active?: boolean;
}
@Component({
  selector: 'app-drawer-component',
    standalone: true,   
  imports: [CommonModule],
  templateUrl: './drawer-component.html',
  styleUrl: './drawer-component.css',
})
export class DrawerComponent {
isOpen = false;

  menuItems: MenuItem[] = [
    { icon: '📊', label: 'Dashboard', route: '#', active: true },
    { icon: '➕', label: 'Add New Sample', route: '#add-sample' },
    { icon: '🔬', label: 'Under Analysis', route: '#under-analysis' },
    { icon: '✅', label: 'Approved Samples', route: '#approved' },
    { icon: '📦', label: 'Total Samples', route: '#total-samples' },
    { icon: '🕒', label: 'Recent Samples', route: '#recent-samples' },
    { icon: '📅', label: 'Today\'s Samples', route: '#today-samples' },
    { icon: '📚', label: 'Sample Library', route: '#sample-library' },
    { icon: '📄', label: 'Reports', route: '#reports' },
    { icon: '⚙️', label: 'Settings', route: '#settings' },
  ];

  constructor(private uiState: UiStateService) {
    // Subscribe to global sidebar state (optional)
    this.uiState.sidebarCollapsed$.subscribe(collapsed => {
      this.isOpen = !collapsed;
    });
  }

  toggleDrawer(): void {
    this.uiState.toggleSidebar();
  }

  closeDrawer(): void {
    this.isOpen = false;
    this.uiState.sidebarCollapsed$.next(true);
  }

  onMenuItemClick(item: MenuItem): void {
    this.menuItems.forEach(menuItem => (menuItem.active = false));
    item.active = true;
    this.closeDrawer();
  }
}