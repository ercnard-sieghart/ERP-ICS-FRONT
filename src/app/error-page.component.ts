import { Component, Input } from '@angular/core';

import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-error-page',
  templateUrl: './error-page.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class ErrorPageComponent {
  @Input() errorMessage: string = 'Desculpe, não foi possível completar sua solicitação.';
  @Input() errorCode: string = '';
  constructor(private location: Location, private router: Router) {}

  goBack(): void {
    // Tenta voltar no histórico do navegador; se não houver histórico, vai para home
    try {
      this.location.back();
    } catch (e) {
      this.router.navigate(['/']);
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
