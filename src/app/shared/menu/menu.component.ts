import { Component, OnInit, ChangeDetectorRef, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PoIconModule, PoAvatarModule } from '@po-ui/ng-components';
import { PoMenuModule, PoMenuItem } from '@po-ui/ng-components';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MenuStateService } from '../services/menu-state.service';
import { PatentesService, MenuItem } from '../services/patentes.service';
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
  menuItems: MenuItemWithSubmenu[] = [];
  private userSubscription?: Subscription;
  private menusSubscription?: Subscription;
  
  constructor(
    private cdr: ChangeDetectorRef, 
    private authService: AuthService,
    private menuStateService: MenuStateService,
    private patentesService: PatentesService
  ) {}



  ngOnInit(): void {
    this.updateDisplayName();
    
    this.userSubscription = this.authService.userUpdate$.subscribe(() => {
      this.updateDisplayName();
    });
    
    this.menusSubscription = this.patentesService.menusUsuario$.subscribe((menus: MenuItem[]) => {
      this.buildMenuFromPatentes(menus);
    });
    
    const savedCollapsedState = localStorage.getItem('menuCollapsed');
    if (savedCollapsedState) {
      this.isMenuCollapsed = JSON.parse(savedCollapsedState);
    }
    
    this.menuStateService.setMenuCollapsed(this.isMenuCollapsed);
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.menusSubscription) {
      this.menusSubscription.unsubscribe();
    }
  }

  buildMenuFromPatentes(menus: MenuItem[]): void {
    this.menuItems = [];

  this.menuItems.push({ label: 'Home', icon: 'home', link: '/home' });

    const menuMap = new Map<string, MenuItemWithSubmenu>();

    menus.forEach(menu => {
      if (menu.rota === '/home') {
        return;
      }

      if (menu.rota === '/dashboard') {
        this.menuItems.push({
          label: menu.nome,
          icon: 'chart',
          link: menu.rota
        });
      } else if (menu.rota.startsWith('/compras')) {
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
        comprasMenu.submenus?.push({
          label: menu.nome,
          icon: 'cart',
          link: menu.rota
        });
      } else if (menu.rota.startsWith('/consultas')) {
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
        consultasMenu.submenus?.push({
          label: menu.nome,
          icon: 'bank',
          link: menu.rota
        });
      } else if (menu.rota === '/orcamentos') {
        this.menuItems.push({
          label: menu.nome,
          icon: 'money',
          link: menu.rota
        });
      }
    });
    
    this.cdr.detectChanges();
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

  toggleSubmenu(item: MenuItemWithSubmenu) {
    if (item.submenus && item.submenus.length > 0) {
      item.expanded = !item.expanded;
    }
  }

  toggleMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed;
    this.menuStateService.setMenuCollapsed(this.isMenuCollapsed);
    
  localStorage.setItem('menuCollapsed', JSON.stringify(this.isMenuCollapsed));
    localStorage.setItem('menuCollapsed', JSON.stringify(this.isMenuCollapsed));
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
  this.authService.logout();
    window.location.href = '/login';
  }
}
