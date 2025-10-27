import { Component, OnInit, ChangeDetectorRef, OnDestroy, Input, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PoIconModule, PoAvatarModule } from '@po-ui/ng-components';
import { PoMenuModule } from '@po-ui/ng-components';
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
    private menuStateService: MenuStateService,
    private patentesService: PatentesService
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.updateDisplayName();
    
    this.userSubscription = this.authService.userUpdate$.subscribe(() => {
      this.updateDisplayName();
    });
    
    this.menusSubscription = this.patentesService.menusUsuario$.subscribe((menus: MenuItem[]) => {
      this.buildMenuFromPatentes(menus);
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
    this.menuItems = [];
    const menuMap = new Map<string, MenuItemWithSubmenu>();
    
    menus.forEach(menu => {
      if (menu.rota === '/home') {
        this.menuItems.push({
          label: menu.nome,
          icon: 'home',
          link: menu.rota
        });
      } else if (menu.rota === '/dashboard') {
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