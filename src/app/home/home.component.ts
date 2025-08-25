import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PoIconModule } from '@po-ui/ng-components';
import { MenuComponent } from '../shared/menu/menu.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [CommonModule, PoIconModule, MenuComponent]
})
export class HomeComponent {}
