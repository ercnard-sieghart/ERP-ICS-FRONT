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
export class HomeComponent {
  eventos = [
    {
      subject: 'Reunião Equipe ICS',
      start: { dateTime: new Date().toISOString() }
    },
    {
      subject: 'Sprint Review',
      start: { dateTime: new Date(Date.now() + 3600 * 1000).toISOString() }
    },
    {
      subject: 'Reunião com Cliente',
      start: { dateTime: new Date(Date.now() + 7200 * 1000).toISOString() }
    }
  ];
}
