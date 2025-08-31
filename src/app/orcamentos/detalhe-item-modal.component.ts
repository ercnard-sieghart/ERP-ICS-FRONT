import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PoModalModule } from '@po-ui/ng-components';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-detalhe-item-modal',
  templateUrl: './detalhe-item-modal.component.html',
  standalone: true,
  imports: [CommonModule, PoModalModule]
})
export class DetalheItemModalComponent {
  @Input() show: boolean = false;
  @Input() item: any = null;
  @Output() close = new EventEmitter<void>();

  constructor() {
    // Se o componente for carregado via rota, pega o item do history.state
    if (!this.item && typeof window !== 'undefined' && window.history.state && window.history.state.item) {
      this.item = window.history.state.item;
    }
  }

  onClose() {
    this.close.emit();
  }
}
