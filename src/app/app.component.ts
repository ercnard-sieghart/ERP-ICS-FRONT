import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import {
  PoMenuItem,
  PoMenuModule,
  PoPageModule,
  PoToolbarModule,
} from '@po-ui/ng-components';

import { LanguageBlockComponent, LanguageGuardService } from './language-block.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    PoToolbarModule,
    PoMenuModule,
    PoPageModule,
    RouterOutlet,
    LanguageBlockComponent // 🔹 importa o componente do bloqueio
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  readonly menus: Array<PoMenuItem> = [
    { label: 'Home', action: this.onClick.bind(this) },
  ];

  blocked = false; // 🔹 flag para controlar o bloqueio

  constructor(private langGuard: LanguageGuardService) {}

  ngOnInit(): void {
    // 🔹 Verifica o idioma ao iniciar o app
    this.blocked = this.langGuard.isBlocked();
  }

  private onClick() {
    alert('Clicked in menu item');
  }
}
