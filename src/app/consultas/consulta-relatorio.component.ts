import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-consulta-relatorio',
  standalone: true,
  templateUrl: './consulta-relatorio.component.html',
  // styleUrls: ['./consulta-relatorio.component.css'],
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
  carregando = false;

  buscarRelatorio() {
    this.carregando = true;
    // Simulação de requisição ao backend
    setTimeout(() => {
      this.dados = [
        { filial: '01', banco: 'Banco A', conta: '12345', periodo: '2025-08', valor: 1000 },
        { filial: '02', banco: 'Banco B', conta: '67890', periodo: '2025-08', valor: 2000 }
      ];
      this.carregando = false;
    }, 1200);
  }
}
