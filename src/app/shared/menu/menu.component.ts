import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PoIconModule, PoAvatarModule } from '@po-ui/ng-components';
import { PoMenuModule, PoMenuItem } from '@po-ui/ng-components';
import { RouterModule } from '@angular/router';

interface MenuItemWithSubmenu {
  label: string;
  icon: string;
  link?: string;
  expanded?: boolean;
  submenus?: MenuItemWithSubmenu[];
}

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
  standalone: true,
  imports: [CommonModule, PoIconModule, PoMenuModule, RouterModule, PoAvatarModule]
})
export class MenuComponent {
  avatarUrl: string = `https://i.pravatar.cc/150?u=${Math.random()}`;
  
  menuItems: MenuItemWithSubmenu[] = [
    { 
      label: 'Home', 
      icon: 'home', 
      link: '/home' 
    },
    { 
      label: 'Gestão de Orçamentos', 
      icon: 'money', 
      link: '/orcamentos'
    },
    { 
      label: 'Compras', 
      icon: 'shopping', 
      expanded: false,
      submenus: [
        { label: 'Solicitação de Compras', icon: 'cart', link: '/compras/solicitacao' }
      ]
    },
    { 
      label: 'Consultas', 
      icon: 'search', 
      expanded: false,
      submenus: [
        { label: 'Extrato', icon: 'list', link: '/consultas' },
        { label: 'Relatórios', icon: 'chart', link: '/consultas/relatorios' },
        { label: 'Histórico', icon: 'clock', link: '/consultas/historico' }
      ]
    },
    { 
      label: 'SharePoint', 
      icon: 'users', 
      expanded: false,
      submenus: [
        { label: 'Documentos', icon: 'document', link: '#' },
        { label: 'Bibliotecas', icon: 'folder', link: '#' },
        { label: 'Sites', icon: 'globe', link: '#' }
      ]
    },
    { 
      label: 'Ramais', 
      icon: 'calendar', 
      link: '#'
    },
    { 
      label: 'Gestão de Patentes', 
      icon: 'document', 
      expanded: false,
      submenus: [
        { label: 'Nova Patente', icon: 'plus', link: '#' },
        { label: 'Consultar Patentes', icon: 'search', link: '#' },
        { label: 'Relatórios', icon: 'chart', link: '#' }
      ]
    }
  ];

  get userName(): string {
    return localStorage.getItem('user_name') || localStorage.getItem('user_fullname') || 'Usuário';
  }

  toggleSubmenu(item: MenuItemWithSubmenu) {
    if (item.submenus && item.submenus.length > 0) {
      item.expanded = !item.expanded;
    }
  }

  getIconSymbol(iconName: string): string {
    const iconMap: { [key: string]: string } = {
      'home': '🏠',
      'money': '💰',
      'shopping': '🛒',
      'cart': '🛍️',
      'search': '🔍',
      'users': '👥',
      'calendar': '📅',
      'document': '📄',
      'list': '📋',
      'chart': '📊',
      'clock': '🕒',
      'folder': '📁',
      'globe': '🌐',
      'plus': '➕'
    };
    return iconMap[iconName] || '📝';
  }

  logout() {
    // Limpar todos os dados do localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_fullname');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_id');
    localStorage.removeItem('empresa');
    localStorage.removeItem('filial');
    
    window.location.href = '/login';
  }
}
