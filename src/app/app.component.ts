import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
    LanguageBlockComponent, // 🔹 importa o componente do bloqueio
    MenuComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  readonly menus: Array<PoMenuItem> = [
    { label: 'Home', action: this.onClick.bind(this) },
  ];

  blocked = false; // 🔹 flag para controlar o bloqueio
  currentRoute = '';
  menuCollapsed = false;

  constructor(
    private langGuard: LanguageGuardService,
    private router: Router,
    private menuStateService: MenuStateService
  ) {}

  ngOnInit(): void {
    // 🔹 Verifica o idioma ao iniciar o app
    this.blocked = this.langGuard.isBlocked();
    
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
  }
  
  shouldShowMenu(): boolean {
    // Não mostra menu na página de login e error
    return !this.currentRoute.includes('/login') && 
           !this.currentRoute.includes('/error') &&
           this.currentRoute !== '' &&
           this.currentRoute !== '/';
  }

  private onClick() {
    alert('Clicked in menu item');
  }
}
