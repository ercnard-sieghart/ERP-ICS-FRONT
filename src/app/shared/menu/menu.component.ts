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

    // Mapear ids de menus principais por prefixo (ex: '/compras' -> id) para que
    // submenus possam usar o id da rota principal ao validar acesso.
    const principalIdByPrefix: { [prefix: string]: string } = {};
    menus.forEach(m => {
      const p = (m.rota || '').split('/').filter(Boolean);
      if (p.length === 1) {
        principalIdByPrefix['/' + p[0]] = m.id;
      }
    });

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
                { id: menu.id, label: 'Extrato Bancário', icon: 'bank', link: '/consultas/extrato-bancario' },
                { id: menu.id, label: 'Relatórios', icon: 'list', link: '/consultas/relatorio' }
              ]
            };
            menuMap.set('consultas', consultasMenu);
            this.menuItems.push(consultasMenu);
          } else {
            // se o menu principal já existia (criado por submenus), atualiza o id e propaga
            const cm: any = consultasMenu;
            if (!cm.id) cm.id = menu.id;
            if (cm.submenus && cm.submenus.length > 0) {
              cm.submenus = cm.submenus.map((s: any) => ({ id: cm.id || s.id, label: s.label, icon: s.icon, link: s.link }));
            }
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
              icon: 'shopping-cart',
              expanded: false,
              submenus: [
                { id: menu.id, label: 'Solicitação', icon: 'an an-note-pencil', link: '/compras/solicitacao' }
              ]
            };
            menuMap.set('compras', comprasMenu);
            this.menuItems.push(comprasMenu);
          } else {
            // se o menu principal já existia (criado por submenus), atualiza o id e propaga
            const cm: any = comprasMenu;
            if (!cm.id) cm.id = menu.id;
            if (cm.submenus && cm.submenus.length > 0) {
              cm.submenus = cm.submenus.map((s: any) => ({ id: cm.id || s.id, label: s.label, icon: s.icon, link: s.link }));
            }
          }
        return;
      }
      // Menu principal /orcamentos
      if (menu.rota === '/orcamentos') {
        let nomeOrcamento = menu.nome;
        if (!nomeOrcamento || nomeOrcamento.includes('�')) {
          nomeOrcamento = 'Orçamentos';
        }
        this.menuItems.push({
          id: menu.id,
          label: nomeOrcamento,
          icon: 'money',
          link: menu.rota,
          submenus: [
            { id: menu.id, label: 'Analíticos', icon: 'list', link: '/orcamentos/analiticos' }
          ]
        });
        return;
      }
      // Menu principal /patentes
      if (menu.rota === '/patentes') {
        let patentesMenu = menuMap.get('patentes');
        const mySub = submenusByPrefix['/patentes'] || [];
        // Submenus vindos do backend (se houver)
        let submenus: MenuItemWithSubmenu[] = mySub.map((m: any) => ({ id: menu.id, label: m.nome, icon: 'list', link: m.rota }));

        // Se backend retornou apenas a rota principal, derivamos submenus das rotas do cliente
        if (submenus.length === 0) {
          try {
            const prefix = 'patentes';
            const cfg = this.router && Array.isArray(this.router.config) ? this.router.config : [];
            const found = cfg.filter(r => r.path && r.path.startsWith(prefix + '/'));
            if (found && found.length > 0) {
              submenus = found.map((r: any) => {
                const path = (r.path || '').replace(/^\//, '');
                const segs = path.split('/').filter(Boolean);
                const last = segs.length > 0 ? segs[segs.length - 1] : path;
                const label = last ? last.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : (r.path || '');
                return { id: menu.id, label, icon: 'list', link: '/' + (r.path || '') } as MenuItemWithSubmenu;
              });
            }
          } catch (e) {
            // falha ao derivar rotas do router.config - ignore
          }
        }

        if (!patentesMenu) {
          patentesMenu = {
            id: menu.id,
            label: menu.nome || 'Patentes',
            icon: 'users',
            expanded: false,
            submenus: submenus
          };
          menuMap.set('patentes', patentesMenu);
          this.menuItems.push(patentesMenu);
        } else {
          const pm: any = patentesMenu;
          if (!pm.id) pm.id = menu.id;
          pm.label = menu.nome || pm.label;
          pm.submenus = submenus;
        }
        return;
      }
      // Submenus que não têm menu principal
      const parts = menu.rota.split('/').filter(Boolean);
      if (parts.length > 1) {
        const prefix = '/' + parts[0];
        const principalId = principalIdByPrefix[prefix];
        if (!principalId) {
          // Ignora este submenu — o backend não liberou o menu pai
          return;
        }

        let parentMenu = menuMap.get(parts[0]);
        if (!parentMenu) {
          parentMenu = {
            // Usa o id do menu principal retornado pelo backend
            id: principalId,
            label: parts[0].charAt(0).toUpperCase() + parts[0].slice(1),
            icon: 'list',
            expanded: false,
            submenus: []
          };
          menuMap.set(parts[0], parentMenu);
          this.menuItems.push(parentMenu);
        }

        // Os submenus devem usar o id do menu principal ao validar acesso.
        parentMenu.submenus?.push({
          id: parentMenu.id,
          label: menu.nome,
          icon: 'list',
          link: menu.rota
        });
        return;
      }
      // Se for uma rota principal (ex: '/patentes') e não entrou em casos específicos acima,
      // o front deve liberar submenus existentes nas rotas do cliente. Se não houver subrotas,
      // adiciona como menu simples (link direto).
      if (parts.length === 1) {
        const prefix = '/' + parts[0];
        const key = parts[0];
        // Se já existe um menu criado para esse prefixo, atualiza e retorna
        let parent = menuMap.get(key);
        if (parent) {
          if (!parent.id) parent.id = menu.id;
          parent.label = menu.nome || parent.label;
          // se já houver submenus do backend, usa-os; caso contrário, tentamos derivar das rotas do app
          if (!parent.submenus || parent.submenus.length === 0) {
            try {
              const cfg = this.router && Array.isArray(this.router.config) ? this.router.config : [];
              const children = cfg.filter((r: any) => r.path && r.path.startsWith(parts[0] + '/'));
              if (children && children.length > 0) {
                parent.submenus = children.map((r: any) => {
                  const path = (r.path || '').replace(/^\//, '');
                  const segs = path.split('/').filter(Boolean);
                  const last = segs.length > 0 ? segs[segs.length - 1] : path;
                  const label = last ? last.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : (r.path || '');
                  return { id: menu.id, label, icon: 'list', link: '/' + (r.path || '') } as MenuItemWithSubmenu;
                });
              }
            } catch {}
          }
          this.menuItems.push(parent);
          return;
        }

        // Se não existe parent, tenta derivar submenus das rotas do cliente
        try {
          const cfg = this.router && Array.isArray(this.router.config) ? this.router.config : [];
          const children = cfg.filter((r: any) => r.path && r.path.startsWith(parts[0] + '/'));
          if (children && children.length > 0) {
            const submenusDerived = children.map((r: any) => {
              const path = (r.path || '').replace(/^\//, '');
              const segs = path.split('/').filter(Boolean);
              const last = segs.length > 0 ? segs[segs.length - 1] : path;
              const label = last ? last.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : (r.path || '');
              return { id: menu.id, label, icon: 'list', link: '/' + (r.path || '') } as MenuItemWithSubmenu;
            });
            const newParent: MenuItemWithSubmenu = {
              id: menu.id,
              label: menu.nome || (parts[0].charAt(0).toUpperCase() + parts[0].slice(1)),
              icon: 'list',
              expanded: false,
              submenus: submenusDerived
            };
            menuMap.set(key, newParent);
            this.menuItems.push(newParent);
            return;
          }
        } catch {}

        // Se não encontrou subrotas, add como menu simples
        this.menuItems.push({ id: menu.id, label: menu.nome, icon: 'list', link: menu.rota });
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

    // Não adicionar menus 'Patentes' automaticamente — mostrar apenas o que o backend retornou
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

  // clique em item do menu (validação é executada quando aplicável)

    const attemptNavigate = () => {
        // Navegação SPA via Router; fallback para navegar via Router mesmo em erros
        try {
          this.router.navigateByUrl(item.link!);
        } catch {
          try { this.router.navigate([item.link!]); } catch {}
        }
      // Fecha em mobile
      if (this.isMobile) {
        this.closeMenu();
      }
    };

    // Validação dinâmica por id do menu pai: para qualquer item que tenha `id`
    // (exceto rotas públicas como /home e /login) fazemos a validação no primeiro acesso
    // enviando o id do menu pai. O guard continua protegendo a rota como segunda barreira.
    const publicRoutes = ['/home', '/login', '/error'];
  if (item.link && !publicRoutes.includes(item.link)) {
      // Determinar id do menu pai: preferir item.id, senão buscar em menusUsuario pelo prefixo
      let menuId = item.id as string | undefined;
      
      if (!menuId) {
        try {
          const raw = localStorage.getItem('menusUsuario');
          const menus = raw ? JSON.parse(raw) : [];
          const parts = (item.link || '').split('/').filter(Boolean);
          const prefix = parts.length > 0 ? '/' + parts[0] : item.link;
          const found = (menus || []).find((m: any) => (m.rota || '').toLowerCase() === prefix || (m.rota || '').toLowerCase().startsWith(prefix));
          
          menuId = found && found.id ? found.id : undefined;
        } catch {}
      }
      if (!menuId) {
        // Não conseguimos determinar id do menu pai; ainda assim forçar validação com id vazio
        
        this.authService.validarAcessoPatente('').subscribe(allowed => {
          if (allowed) {
            attemptNavigate();
          } else {
            console.warn('[menu] acesso negado (sem id) para rota', item.link);
          }
        }, err => {
          console.warn('[menu] erro ao validar menu (sem id)', err);
        });
        return;
      }

      // Validar via AuthService antes de navegar
      this.authService.validarAcessoPatente(menuId).subscribe(allowed => {
        if (allowed) {
          attemptNavigate();
        } else {
          console.warn('[menu] acesso negado para menu pai id', menuId);
        }
      }, err => {
        console.warn('[menu] erro ao validar menu', err);
      });
      return;
    }

    attemptNavigate();
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


  logout(): void {
    this.cleanupBodyClass();
    this.authService.logout();
    try { this.router.navigate(['/login']); } catch { window.location.href = '/login'; }
  }
}