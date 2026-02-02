import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { UiStateService } from '../../services/ui-state-service';

@Component({
  standalone: true,
  selector: 'app-sample-header',
  imports: [CommonModule],
  templateUrl: './sample-header.html',
  styleUrl: './sample-header.css',
})
export class SampleHeader {

 userName = 'User';

  constructor(
    private ui: UiStateService
  ) {}

  onMenuClick() {
    console.log('☰ Toggle sidebar');
    this.ui.toggleSidebar();
  }

  ngOnInit() {
    this.userName = localStorage.getItem('name') ?? 'Guest';
  }
}