import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-consulta-relatorio',
  standalone: true,
  template: `
    <div class="p-4">
      <h2 class="text-xl font-semibold text-[#1A4E79] mb-4">Consulta de Relatório</h2>
      <p class="text-[#1A4E79]/70">Componente temporário - implementar funcionalidade específica conforme necessário.</p>
    </div>
  `,
  imports: [CommonModule, FormsModule]
})
export class ConsultaRelatorioComponent {
  filtros = {
    filial: '',
    banco: '',
    conta: '',
    periodo: ''
  };

  dados: any[] = [];

  buscarRelatorio() {
    console.log('Buscar relatório com filtros:', this.filtros);
  }
}