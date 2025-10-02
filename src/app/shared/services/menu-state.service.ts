import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MenuStateService {
  private menuCollapsedSubject = new BehaviorSubject<boolean>(false);
  public menuCollapsed$ = this.menuCollapsedSubject.asObservable();

  setMenuCollapsed(collapsed: boolean): void {
    this.menuCollapsedSubject.next(collapsed);
  }

  getMenuCollapsed(): boolean {
    return this.menuCollapsedSubject.value;
  }
}