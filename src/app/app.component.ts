import { CommonModule } from '@angular/common';
import { Component, OnInit, HostListener } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import {
  PoMenuItem,
  PoMenuModule,
  PoPageModule,
  PoToolbarModule,
} from '@po-ui/ng-components';

import { LanguageBlockComponent, LanguageGuardService } from './language-block.component';
import { MenuComponent } from './shared/menu/menu.component';
import { MenuStateService } from './shared/services/menu-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    PoToolbarModule,
    PoMenuModule,
    PoPageModule,
    RouterOutlet,
    LanguageBlockComponent,
    MenuComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  readonly menus: Array<PoMenuItem> = [
    { label: 'Home', action: this.onClick.bind(this) },
  ];

  blocked = false;
  currentRoute = '';
  menuCollapsed = false;
  isMobile = false;

  constructor(
    private langGuard: LanguageGuardService,
    private router: Router,
    private menuStateService: MenuStateService
  ) {}

  ngOnInit(): void {
    // Verifica o idioma ao iniciar o app
    this.blocked = this.langGuard.isBlocked();

    // Verifica o tamanho da tela inicial
    this.checkScreenSize();

    // Monitora mudanças de rota
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.url;
    });

    // Monitora estado do menu
    this.menuStateService.menuCollapsed$.subscribe(collapsed => {
      this.menuCollapsed = collapsed;
    });

    // Carregar estado inicial do menu do localStorage
    const savedState = localStorage.getItem('menuCollapsed');
    if (savedState) {
      this.menuCollapsed = JSON.parse(savedState);

      // Em mobile, forçar menu fechado
      if (this.isMobile) {
        this.menuCollapsed = true;
        this.menuStateService.setMenuCollapsed(true);
      }
    }

    // Garante menus persistentes ao iniciar
    this.garantirMenusPersistentes();
  }

  // Garante que os menus estejam sempre presentes após navegação
  garantirMenusPersistentes(): void {
    // Verifica se há menus válidos no localStorage
    const menusLocal = localStorage.getItem('menusUsuario');
    let menusArray: any[] = [];
    try {
      menusArray = menusLocal ? JSON.parse(menusLocal) : [];
    } catch {
      menusArray = [];
    }

    // Se não houver menus válidos, força o carregamento do backend
    if (!menusArray || !Array.isArray(menusArray) || menusArray.length === 0) {
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('user_id');
      if (token && userId) {
        // Importa dinamicamente o AuthService e força o carregamento dos menus
        // @ts-ignore
        import('./shared/services/auth.service').then(mod => {
          const injector = (window as any).ng?.injector;
          if (injector) {
            const authService = injector.get(mod.AuthService);
            authService.carregarMenusLiberadosUsuario().subscribe((menus: any[]) => {
              // Salva menus no localStorage para garantir persistência
              if (menus && Array.isArray(menus)) {
                localStorage.setItem('menusUsuario', JSON.stringify(menus));
              }
            });
          }
        });
      }
    }
  }

  @HostListener('window:resize', ['$event'])
  checkScreenSize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 680;
    
    // Se mudou para mobile e o menu estava aberto, fecha o menu
    if (!wasMobile && this.isMobile && !this.menuCollapsed) {
      this.menuCollapsed = true;
      this.menuStateService.setMenuCollapsed(true);
      localStorage.setItem('menuCollapsed', 'true');
    }
    
    // Se mudou para desktop, restaura o estado salvo
    if (wasMobile && !this.isMobile) {
      const savedState = localStorage.getItem('menuCollapsed');
      if (savedState) {
        this.menuCollapsed = JSON.parse(savedState);
        this.menuStateService.setMenuCollapsed(this.menuCollapsed);
      }
    }
  }

  // CORREÇÃO: O método agora recebe um booleano diretamente
  onMenuToggled(collapsed: boolean) {
    this.menuCollapsed = collapsed;
  }
  
  shouldShowMenu(): boolean {
    // Não mostra menu na página de login e error
    return !this.currentRoute.includes('/login') && 
           !this.currentRoute.includes('/error') &&
           this.currentRoute !== '' &&
           this.currentRoute !== '/';
  }

  // Método para obter as classes do conteúdo principal
  getContentClasses(): string {
    if (this.isMobile) {
      return 'transition-all duration-300 ml-0';
    } else {
      return this.menuCollapsed ? 
        'transition-all duration-300 ml-16' : 
        'transition-all duration-300 ml-80';
    }
  }

  private onClick() {
    alert('Clicked in menu item');
  }
}