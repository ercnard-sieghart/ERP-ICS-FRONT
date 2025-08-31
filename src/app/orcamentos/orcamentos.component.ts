import { Component } from '@angular/core';
import { UniqueCentroCustoPipe } from './unique-centro-custo.pipe';
import { FilterItemContabilPipe } from './filter-item-contabil.pipe';
import { FilterAnoPipe } from './filter-ano.pipe';
import { FilterCentroCustoPipe } from './filter-centro-custo.pipe';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PoTableModule, PoTableColumn, PoModalModule } from '@po-ui/ng-components';
import { MenuComponent } from "../shared/menu/menu.component";

@Component({
  selector: 'app-orcamentos',
  templateUrl: './orcamentos.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PoTableModule,
    PoModalModule,
    MenuComponent,
    UniqueCentroCustoPipe,
    FilterItemContabilPipe,
    FilterAnoPipe,
    FilterCentroCustoPipe
  ]
})
export class OrcamentosComponent {
  filtroItemContabil: string = '';
  filtroAno: string = '';
  filtroCentroCusto: string = '';
  anosDisponiveis: string[] = ['2025', '2024', '2023'];
  analiticosColumns: PoTableColumn[] = [
    { property: 'codigo', label: 'Código', type: 'string' },
    { property: 'nome', label: 'Nome', type: 'string' },
    { property: 'valorOrcado', label: 'Orçado', type: 'number' },
    { property: 'valorRealizado', label: 'Realizado', type: 'number' },
    { property: 'saldo', label: 'Saldo', type: 'number' }
  ];
  itensSinteticos = [
    {
      codigo: '71401',
      nome: 'EIXO 04 GRANTMAKING',
      valorOrcado: 100000,
      valorRealizado: 80000,
      codigoCentroCusto: '71401',
      centroCusto: 'EIXO 04 GRANTMAKING',
      codigoItemContabil: '10104007001',
      nomeItemContabil: 'CORE HEWLETT GEN SUPPORT 2025',
      ano: '2025',
      analiticos: []
    },
    {
      codigo: '71401', nome: 'EIXO 04 GRANTMAKING', valorOrcado: 96000, valorRealizado: 78000,
      codigoCentroCusto: '71401', centroCusto: 'EIXO 04 GRANTMAKING', codigoItemContabil: '10209004001', nomeItemContabil: 'GMF JM SALLES INST DADOS 2025', ano: '2025', analiticos: []
    }
  ];
  selectedSintetico: any = null;
  showAnaliticosModal: boolean = false;
    showDetalhesAnaliticoModal: boolean = false;
    showRemanejamentoModal: boolean = false;
    analiticoSelecionado: any = null;
    remOrigem: string = '';
    remDestino: string = '';
    remValor: number | null = null;

  getAnaliticosTableData() {
    if (!this.selectedSintetico) return [];
    return this.selectedSintetico.analiticos.map((a: any) => ({
      ...a,
      saldo: a.valorOrcado - a.valorRealizado
    }));
  }

  onSinteticoClick(row: any) {
    this.selectedSintetico = row;
    this.showAnaliticosModal = true;
  }

  closeAnaliticosModal() {
    this.showAnaliticosModal = false;
    this.selectedSintetico = null;
  }

    onAnaliticoClick(analitico: any) {
      this.analiticoSelecionado = analitico;
      this.showDetalhesAnaliticoModal = true;
    }

    closeDetalhesAnaliticoModal() {
      this.showDetalhesAnaliticoModal = false;
      this.analiticoSelecionado = null;
    }

    openRemanejamentoModal() {
      this.showRemanejamentoModal = true;
    }

    closeRemanejamentoModal() {
      this.showRemanejamentoModal = false;
      this.remOrigem = '';
      this.remDestino = '';
      this.remValor = null;
    }

    solicitarRemanejamento() {
      // Aqui você pode implementar a lógica de solicitação, exibir mensagem, etc.
      alert(`Solicitação de remanejamento enviada:\nOrigem: ${this.remOrigem}\nDestino: ${this.remDestino}\nValor: ${this.remValor}`);
      this.closeRemanejamentoModal();
    }
}