import { Component, Input } from '@angular/core';
import { UiStateService } from '../../services/ui-state-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-side-bar',
  imports: [CommonModule],
  templateUrl: './side-bar.html',
  styleUrl: './side-bar.css',
})
export class SideBar {
 collapsed = false;

  constructor(private ui: UiStateService) {
    this.ui.sidebarCollapsed$
      .subscribe(v => this.collapsed = v);

    if (window.innerWidth < 1280) {
      this.ui.sidebarCollapsed$.next(true);
    }
  }

  go(view: string) {
    console.log('Go to:', view);
  }
}