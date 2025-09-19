import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PoTableColumn } from '@po-ui/ng-components';
import { PoTableModule, PoModalModule } from '@po-ui/ng-components';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analiticos-modal',
  templateUrl: './analiticos-modal.component.html',
  standalone: true,
  imports: [
    CommonModule,
    PoTableModule,
    PoModalModule
  ],
})
export class AnaliticosModalComponent {
  @Input() show: boolean = false;
  @Input() title: string = '';
  @Input() columns: PoTableColumn[] = [];
  @Input() items: any[] = [];
  @Input() sintetico: any;
  @Output() close = new EventEmitter<void>();
  @Output() rowClick = new EventEmitter<any>();

  onClose() {
    this.close.emit();
  }

  onRowClick(event: any) {
    this.rowClick.emit(event);
  }
}
