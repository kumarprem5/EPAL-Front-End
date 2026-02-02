import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UiStateService {
  
sidebarCollapsed$ = new BehaviorSubject<boolean>(false);

  toggleSidebar() {
    this.sidebarCollapsed$.next(!this.sidebarCollapsed$.value);
  }
}