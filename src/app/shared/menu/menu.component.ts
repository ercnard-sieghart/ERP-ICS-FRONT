import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PoIconModule } from '@po-ui/ng-components';
import { PoMenuModule, PoMenuItem } from '@po-ui/ng-components';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  // styleUrls: ['./menu.component.css'],
  standalone: true,
  imports: [CommonModule, PoIconModule, PoMenuModule, RouterModule]
})
export class MenuComponent {
  menuItems: Array<PoMenuItem> = [
    { label: 'Dashboards', icon: 'home', link: '/home' },
    { label: 'Colaboradores', icon: 'users', link: '#' },
    { label: 'Agenda', icon: 'calendar', link: '#' },
    { label: 'Documentos', icon: 'document', link: '#' },
    { label: 'Configurações', icon: 'settings', link: '#' }
  ];
}
