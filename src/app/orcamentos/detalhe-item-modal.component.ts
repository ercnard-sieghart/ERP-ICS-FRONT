import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PoModalModule } from '@po-ui/ng-components';
import { CommonModule } from '@angular/common';

@Component({
  // Componente removido
  standalone: true,
  imports: [CommonModule, PoModalModule]
})
export class DetalheItemModalComponent {
  @Input() show: boolean = false;
  @Input() item: any = null;
  @Output() close = new EventEmitter<void>();

  constructor() {
    // Componente DetalheItemModalComponent removido
  }

  onClose() {
    // Método removido
}
