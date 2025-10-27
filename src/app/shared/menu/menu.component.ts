import { Component, OnInit, ChangeDetectorRef, OnDestroy, Input, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PoIconModule, PoAvatarModule } from '@po-ui/ng-components';
import { PoMenuModule } from '@po-ui/ng-components';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MenuStateService } from '../services/menu-state.service';

import { Subscription } from 'rxjs';


interface MenuItem {
  id: string;
  nome: string;
  rota: string;
  icone?: string;
  ordem?: number;
}

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
  @Output() menuToggled = new EventEmitter<boolean>();
  
  displayName: string = 'Usuário';
  isMenuCollapsed: boolean = false;
  isMobile: boolean = false;
  menuItems: MenuItemWithSubmenu[] = [];
  
  private userSubscription?: Subscription;
  private menusSubscription?: Subscription;
  
  constructor(
    private cdr: ChangeDetectorRef, 
    private authService: AuthService,
    private menuStateService: MenuStateService
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.updateDisplayName();

    this.userSubscription = this.authService.userUpdate$.subscribe(() => {
      this.updateDisplayName();
    });

    // Restaurar menus do localStorage se existirem
  const savedMenus = localStorage.getItem('app_menus_v1');
    if (savedMenus) {
      try {
        const parsedMenus = JSON.parse(savedMenus);
        if (Array.isArray(parsedMenus)) {
          this.buildMenuFromPatentes(parsedMenus);
        }
      } catch {}
    }

    this.menusSubscription = this.authService.menusUsuario$.subscribe((menus: MenuItem[]) => {
      if (Array.isArray(menus) && menus.length > 0) {
        this.buildMenuFromPatentes(menus);
      }
    });

    // Carregar estado salvo
    const savedCollapsedState = localStorage.getItem('menuCollapsed');
    if (savedCollapsedState) {
      this.isMenuCollapsed = JSON.parse(savedCollapsedState);
      // Em mobile, forçar menu fechado inicialmente
      if (this.isMobile) {
        this.isMenuCollapsed = true;
      }
    }

    this.menuStateService.setMenuCollapsed(this.isMenuCollapsed);
    this.updateBodyClass();
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.menusSubscription?.unsubscribe();
    this.cleanupBodyClass();
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 680;
    
    // Se mudou para mobile e o menu estava aberto, fecha o menu
    if (!wasMobile && this.isMobile && !this.isMenuCollapsed) {
      this.isMenuCollapsed = true;
      this.updateBodyClass();
    }
    
    // Se mudou para desktop, restaura o estado salvo
    if (wasMobile && !this.isMobile) {
      const savedState = localStorage.getItem('menuCollapsed');
      if (savedState) {
        this.isMenuCollapsed = JSON.parse(savedState);
      }
    }
    
    this.menuStateService.setMenuCollapsed(this.isMenuCollapsed);
    this.cdr.detectChanges();
  }

  buildMenuFromPatentes(menus: MenuItem[]): void {
    // Sempre adiciona /home
    this.menuItems = [{
      label: 'Home',
      icon: 'home',
      link: '/home'
    }];
    const menuMap = new Map<string, MenuItemWithSubmenu>();

    // Agrupa submenus por prefixo principal
    const submenusByPrefix: { [prefix: string]: MenuItem[] } = {};
    menus.forEach(menu => {
      const parts = menu.rota.split('/').filter(Boolean);
      if (parts.length > 1) {
        const prefix = '/' + parts[0];
        if (!submenusByPrefix[prefix]) submenusByPrefix[prefix] = [];
        submenusByPrefix[prefix].push(menu);
      }
    });

    menus.forEach(menu => {
      if (menu.rota === '/home') {
        // já adicionado
        return;
      }
      if (menu.rota === '/dashboard') {
        this.menuItems.push({
          label: menu.nome,
          icon: 'chart',
          link: menu.rota
        });
        return;
      }
      // Menu principal /consultas
      if (menu.rota === '/consultas') {
        let consultasMenu = menuMap.get('consultas');
        if (!consultasMenu) {
          consultasMenu = {
            label: 'Consultas',
            icon: 'search',
            expanded: false,
            submenus: []
          };
          menuMap.set('consultas', consultasMenu);
          this.menuItems.push(consultasMenu);
        }
        // Adiciona todos submenus /consultas/...
        (submenusByPrefix['/consultas'] || []).forEach(sub => {
          if (sub.rota !== '/consultas') {
            consultasMenu.submenus?.push({
              label: sub.nome,
              icon: 'bank',
              link: sub.rota
            });
          }
        });
        return;
      }
      // Menu principal /compras
      if (menu.rota === '/compras') {
        let comprasMenu = menuMap.get('compras');
        if (!comprasMenu) {
          comprasMenu = {
            label: 'Compras',
            icon: 'shopping',
            expanded: false,
            submenus: []
          };
          menuMap.set('compras', comprasMenu);
          this.menuItems.push(comprasMenu);
        }
        (submenusByPrefix['/compras'] || []).forEach(sub => {
          if (sub.rota !== '/compras') {
            comprasMenu.submenus?.push({
              label: sub.nome,
              icon: 'cart',
              link: sub.rota
            });
          }
        });
        return;
      }
      // Menu principal /orcamentos
      if (menu.rota === '/orcamentos') {
        this.menuItems.push({
          label: menu.nome,
          icon: 'money',
          link: menu.rota
        });
        return;
      }
      // Submenus que não têm menu principal
      // Exemplo: /consultas/solicitacao sem /consultas
      const parts = menu.rota.split('/').filter(Boolean);
      if (parts.length > 1) {
        const prefix = '/' + parts[0];
        let parentMenu = menuMap.get(parts[0]);
        if (!parentMenu) {
          parentMenu = {
            label: parts[0].charAt(0).toUpperCase() + parts[0].slice(1),
            icon: 'list',
            expanded: false,
            submenus: []
          };
          menuMap.set(parts[0], parentMenu);
          this.menuItems.push(parentMenu);
        }
        parentMenu.submenus?.push({
          label: menu.nome,
          icon: 'list',
          link: menu.rota
        });
        return;
      }
      // Se não se encaixa em nenhum caso, adiciona como menu simples
      this.menuItems.push({
        label: menu.nome,
        icon: 'list',
        link: menu.rota
      });
    });
    this.cdr.detectChanges();
  }

  updateDisplayName(): void {
    const fullName = localStorage.getItem('user_fullname');
    this.displayName = fullName ? fullName.split(' ').slice(0, 2).join(' ') : 'Usuário';
    this.cdr.detectChanges();
  }

  get userName(): string {
    return this.displayName;
  }

  toggleSubmenu(item: MenuItemWithSubmenu): void {
    if (item.submenus && item.submenus.length > 0) {
      item.expanded = !item.expanded;
    }
  }

  handleMenuItemClick(): void {
    // Fecha o menu automaticamente em mobile quando um item é clicado
    if (this.isMobile && !this.isMenuCollapsed) {
      this.closeMenu();
    }
  }

  closeMenu(): void {
    if (this.isMobile && !this.isMenuCollapsed) {
      this.toggleMenu();
    }
  }

  toggleMenu(): void {
    this.isMenuCollapsed = !this.isMenuCollapsed;
    this.menuStateService.setMenuCollapsed(this.isMenuCollapsed);
    this.updateBodyClass();
    
    // Salvar estado (apenas em desktop)
    if (!this.isMobile) {
      localStorage.setItem('menuCollapsed', JSON.stringify(this.isMenuCollapsed));
    }
    
    this.menuToggled.emit(this.isMenuCollapsed);
  }

  private updateBodyClass(): void {
    if (this.isMobile && !this.isMenuCollapsed) {
      document.body.classList.add('menu-open-mobile');
    } else {
      this.cleanupBodyClass();
    }
  }

  private cleanupBodyClass(): void {
    document.body.classList.remove('menu-open-mobile');
    document.body.style.overflow = '';
  }

  getIconSymbol(iconName: string): string {
    const iconMap: { [key: string]: string } = {
      'home': '🏠', 'money': '💰', 'shopping': '🛒', 'cart': '🛍️',
      'search': '🔍', 'users': '👥', 'calendar': '📅', 'document': '📄',
      'list': '📋', 'chart': '📊', 'clock': '🕒', 'folder': '📁',
      'globe': '🌐', 'plus': '➕', 'bank': '🏦'
    };
    return iconMap[iconName] || '📝';
  }

  logout(): void {
    this.cleanupBodyClass();
    this.authService.logout();
    window.location.href = '/login';
  }
}