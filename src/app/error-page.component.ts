import { Component, Input } from '@angular/core';

import { CommonModule } from '@angular/common';
import { MenuComponent } from "./shared/menu/menu.component";

@Component({
  selector: 'app-error-page',
  templateUrl: './error-page.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class ErrorPageComponent {
  @Input() errorMessage: string = 'Desculpe, não foi possível completar sua solicitação.';
  @Input() errorCode: string = '';
}
