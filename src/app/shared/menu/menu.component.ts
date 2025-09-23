import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PoIconModule, PoAvatarModule } from '@po-ui/ng-components';
import { PoMenuModule, PoMenuItem } from '@po-ui/ng-components';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

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
export class MenuComponent implements OnInit, OnDestroy {
  avatarUrl: string = `https://i.pravatar.cc/150?u=${Math.random()}`;
  displayName: string = 'Usuário';
  private userSubscription?: Subscription;
  
  constructor(private cdr: ChangeDetectorRef, private authService: AuthService) {}



  ngOnInit(): void {
    this.updateDisplayName();
    
    // Subscrever às atualizações do usuário
    this.userSubscription = this.authService.userUpdate$.subscribe(userName => {
      this.displayName = userName;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  updateDisplayName(): void {
    const fullName = localStorage.getItem('user_fullname');
    const userName = localStorage.getItem('user_name');
    
    this.displayName = fullName || userName || 'Usuário';
    console.log('ATUALIZANDO NOME:', this.displayName);
    console.log('user_fullname:', fullName);
    console.log('user_name:', userName);
    
    this.cdr.detectChanges();
  }

  get userName(): string {
    return this.displayName;
  }

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
    // Usar o service para logout
    this.authService.logout();
    window.location.href = '/login';
  }
}
