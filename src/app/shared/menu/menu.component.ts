import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PoIconModule, PoAvatarModule } from '@po-ui/ng-components';
import { PoMenuModule, PoMenuItem } from '@po-ui/ng-components';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  // styleUrls: ['./menu.component.css'],
  standalone: true,
  imports: [CommonModule, PoIconModule, PoMenuModule, RouterModule, PoAvatarModule]
})
export class MenuComponent {
  avatarUrl: string = `https://i.pravatar.cc/150?u=${Math.random()}`;
  menuItems: Array<PoMenuItem> = [
    { label: 'Dashboards', icon: 'home', link: '/home' },
    { label: 'Colaboradores', icon: 'users', link: '#' },
    { label: 'Agenda', icon: 'calendar', link: '#' },
    { label: 'Documentos', icon: 'document', link: '#' },
    { label: 'Configurações', icon: 'settings', link: '#' }
  ];
  get userName(): string {
    return localStorage.getItem('user_name') || '';
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_name');
    window.location.href = '/login';
  }
}
