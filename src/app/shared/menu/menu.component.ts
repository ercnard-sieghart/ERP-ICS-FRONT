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
  id?: string;
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
  private validatedMenuIds = new Set<string>();
  onMenuClick(item: MenuItemWithSubmenu) {
    if (!item.id || item.id === 'home') {
      // Home não precisa validar
      this.navigateTo(item.link);
      return;
    }
    if (this.validatedMenuIds.has(item.id)) {
      this.navigateTo(item.link);
      return;
    }
    this.patentesService.validarAcessoMenu(item.id).subscribe({
      next: (resp) => {
        if (resp.acess) {
          this.validatedMenuIds.add(item.id!);
          this.navigateTo(item.link);
        } else {
          alert(resp.message || 'Acesso negado');
        }
      },
      error: () => {
        alert('Erro ao validar acesso ao menu.');
      }
    });
  }

  private navigateTo(link?: string) {
    if (link) {
      window.location.href = link;
    }
  }
  
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

    // Sempre adiciona o Home fixo
    this.menuItems.push({ id: 'home', label: 'Home', icon: 'home', link: '/home' });

    // Adiciona todos os outros menus recebidos do backend, exceto o Home

    menus.forEach(menu => {
      if (menu.rota !== '/home') {
        // Definir ícone por rota
        let icon = 'list';
        if (menu.rota === '/dashboard') icon = 'chart';
        else if (menu.rota.startsWith('/compras')) icon = 'shopping';
        else if (menu.rota.startsWith('/consultas')) icon = 'search';
        else if (menu.rota === '/orcamentos') icon = 'money';
        else if (menu.rota === '/admin/patentes') icon = 'users';
        // Adicione mais regras conforme necessário

        this.menuItems.push({
          id: menu.id,
          label: menu.nome,
          icon,
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
