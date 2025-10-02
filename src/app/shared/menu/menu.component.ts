import { Component, OnInit, ChangeDetectorRef, OnDestroy, Input } from '@angular/core';
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
  @Input() isLoading: boolean = false;
  avatarUrl: string = `https://i.pravatar.cc/150?u=${Math.random()}`;
  displayName: string = 'Usuário';
  isMenuCollapsed: boolean = false;
  private userSubscription?: Subscription;
  
  constructor(private cdr: ChangeDetectorRef, private authService: AuthService) {}



  ngOnInit(): void {
    this.updateDisplayName();
    
    // Subscrever às atualizações do usuário
    this.userSubscription = this.authService.userUpdate$.subscribe(() => {
      this.updateDisplayName();
    });
    
    // Verificar estado salvo do menu
    const savedCollapsedState = localStorage.getItem('menuCollapsed');
    if (savedCollapsedState) {
      this.isMenuCollapsed = JSON.parse(savedCollapsedState);
    }
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  updateDisplayName(): void {
    const fullName = localStorage.getItem('user_fullname');
    
    if (fullName) {
      const nomes = fullName.split(' ');
      this.displayName = nomes.slice(0, 2).join(' ');
    } else {
      this.displayName = 'Usuário';
    }
    
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
      label: 'Compras', 
      icon: 'shopping', 
      expanded: false,
      submenus: [
        { label: 'Solicitação de Compras', icon: 'cart', link: '/compras/solicitacao' }
      ]
    },
    { 
      label: 'Gestão de Orçamentos', 
      icon: 'money', 
      link: '/orcamentos'
    }
    // Menus temporariamente ocultos
    /* 
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
    */
  ];

  toggleSubmenu(item: MenuItemWithSubmenu) {
    if (item.submenus && item.submenus.length > 0) {
      item.expanded = !item.expanded;
    }
  }

  toggleMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed;
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
