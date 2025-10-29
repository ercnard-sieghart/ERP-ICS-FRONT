import { Component, OnInit, ChangeDetectorRef, OnDestroy, Input, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PoIconModule, PoAvatarModule } from '@po-ui/ng-components';
import { PoMenuModule } from '@po-ui/ng-components';
import { RouterModule, Router } from '@angular/router';
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
    private router: Router
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
      icon: 'house', // Animalia: an-house
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
      // Remove menus indesejados de verdade
      const nomeLower = (menu.nome || '').toLowerCase();
      if (menu.rota === '/dashboard') {
        this.menuItems.push({
          id: menu.id,
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
            id: menu.id,
            label: 'Consultas',
            icon: 'magnifying-glass',
            expanded: false,
            submenus: [
              { label: 'Extrato Bancário', icon: 'bank', link: '/consultas/extrato-bancario' },
              { label: 'Relatórios', icon: 'list', link: '/consultas/relatorio' }
            ]
          };
          menuMap.set('consultas', consultasMenu);
          this.menuItems.push(consultasMenu);
        }
        return;
      }
      // Menu principal /compras
      if (menu.rota === '/compras') {
        let comprasMenu = menuMap.get('compras');
        if (!comprasMenu) {
          comprasMenu = {
            id: menu.id,
            label: 'Compras',
            icon: 'shopping-cart', // Animalia: an-shopping-cart
            expanded: false,
            submenus: [
              { label: 'Solicitação', icon: 'cart', link: '/compras/solicitacao' }
            ]
          };
          menuMap.set('compras', comprasMenu);
          this.menuItems.push(comprasMenu);
        }
        return;
      }
      // Menu principal /orcamentos
      if (menu.rota === '/orcamentos') {
        this.menuItems.push({
          id: menu.id,
          label: menu.nome,
          icon: 'money',
          link: menu.rota,
          submenus: [
            { label: 'Analíticos', icon: 'list', link: '/orcamentos/analiticos' }
          ]
        });
        return;
      }
      // Submenus que não têm menu principal
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
          id: menu.id,
          label: menu.nome,
          icon: 'list',
          link: menu.rota
        });
        return;
      }
      // Se não se encaixa em nenhum caso, adiciona como menu simples
      this.menuItems.push({
        id: menu.id,
        label: menu.nome,
        icon: 'list',
        link: menu.rota
      });
    });

    // Garantir que o menu "Patentes" exista (sem rota) e contenha o submenu "Coordenação"
    const hasPatentes = this.menuItems.some(mi => mi.label && mi.label.toLowerCase() === 'patentes');
    if (!hasPatentes) {
      this.menuItems.push({
        label: 'Patentes',
        icon: 'users',
        expanded: false,
        submenus: [
          {
            label: 'Coordenação',
            icon: 'list',
            link: '/patentes/coordenacao'
          }
        ]
      });
    } else {
      // se já existe, garantir que tenha submenu Coordenação
      const patentes = this.menuItems.find(mi => mi.label && mi.label.toLowerCase() === 'patentes');
      if (patentes) {
        patentes.submenus = patentes.submenus || [];
        const hasCoord = patentes.submenus.some(s => s.label && s.label.toLowerCase() === 'coordenação' || s.label.toLowerCase() === 'coordenacao');
        if (!hasCoord) {
          patentes.submenus.push({ label: 'Coordenação', icon: 'list', link: '/patentes/coordenacao' });
        }
      }
    }
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

  onMenuItemClicked(item: MenuItemWithSubmenu, event: MouseEvent): void {
    event.preventDefault();
    if (!item.link) return;

    const navigate = () => {
      try {
        this.router.navigateByUrl(item.link!);
      } catch {
        window.location.href = item.link!;
      }
      // Fecha em mobile
      if (this.isMobile) {
        this.closeMenu();
      }
    };

    if (item.id) {
      this.authService.validarAcessoPatente(item.id).subscribe({
        next: (allowed: boolean) => {
          if (allowed) {
            navigate();
          } else {
            window.alert('Acesso negado');
          }
        },
        error: () => {
          window.alert('Erro ao validar acesso');
        }
      });
    } else {
      navigate();
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

  // Função de ícone removida. Use item.icon diretamente no template.

  logout(): void {
    this.cleanupBodyClass();
    this.authService.logout();
    window.location.href = '/login';
  }
}