import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PoModalModule } from '@po-ui/ng-components';
import { PoTableModule, PoFieldModule, PoButtonModule, PoDatepickerModule, PoDialogModule } from '@po-ui/ng-components';

@Component({
  selector: 'app-consulta-extrato',
  standalone: true,
  templateUrl: './consulta-extrato.component.html',
  styleUrls: ['./consulta-extrato.component.css'],
  imports: [CommonModule, FormsModule, PoTableModule, PoFieldModule, PoButtonModule, PoDatepickerModule, PoDialogModule]
})
export class ConsultaExtratoComponent {
  modalAberto = false;
  filtros = {
    filial: '',
    banco: '',
    conta: '',
    periodoInicio: '',
    periodoFim: ''
  };

  filiais = [
    { label: 'Filial 01', value: '01' },
    { label: 'Filial 02', value: '02' }
  ];
  bancos = [
    { label: 'Banco A', value: 'Banco A' },
    { label: 'Banco B', value: 'Banco B' }
  ];
  contas = [
    { label: '12345', value: '12345' },
    { label: '67890', value: '67890' }
  ];

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
  this.modalAberto = true;
    }, 1200);
  }
}
