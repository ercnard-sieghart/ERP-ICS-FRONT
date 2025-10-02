import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PoIconModule } from '@po-ui/ng-components';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  standalone: true,
  imports: [CommonModule, PoIconModule]
})
export class DashboardComponent {}
