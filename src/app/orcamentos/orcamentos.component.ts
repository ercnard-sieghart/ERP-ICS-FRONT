import { Component } from '@angular/core';
import { UniqueCentroCustoPipe } from './unique-centro-custo.pipe';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PoTableModule, PoTableColumn, PoModalModule } from '@po-ui/ng-components';
import { MenuComponent } from "../shared/menu/menu.component";

@Component({
  selector: 'app-orcamentos',
  templateUrl: './orcamentos.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, PoTableModule, PoModalModule, MenuComponent, UniqueCentroCustoPipe]
})
export class OrcamentosComponent {
  filtroItemContabil: string = '';
  filtroAno: string = '';
  filtroCentroCusto: string = '';
  anosDisponiveis: string[] = ['2024', '2025', '2026'];

  getSinteticosTableDataFiltrados() {
    let lista = this.getSinteticosTableData();
    if (this.filtroItemContabil) {
      const termo = this.filtroItemContabil.toLowerCase();
      lista = lista.filter(item =>
        item.nome.toLowerCase().includes(termo) ||
        item.codigo.toLowerCase().includes(termo)
      );
    }
    if (this.filtroAno) {
      lista = lista.filter(item => item.ano === this.filtroAno);
    }
    if (this.filtroCentroCusto) {
      lista = lista.filter(item => item.codigoCentroCusto === this.filtroCentroCusto);
    }
    return lista;
  }
  showDetalhesAnaliticoModal = false;
  analiticoSelecionado: any = null;

  onAnaliticoClick(row: any) {
    this.analiticoSelecionado = row;
    this.showDetalhesAnaliticoModal = true;
  }

  closeDetalhesAnaliticoModal() {
    this.showDetalhesAnaliticoModal = false;
    this.analiticoSelecionado = null;
  }
  showRemanejamentoModal = false;
  remOrigem: string = '';
  remDestino: string = '';
  remValor: number | null = null;

  openRemanejamentoModal() {
    this.showRemanejamentoModal = true;
    this.remOrigem = '';
    this.remDestino = '';
    this.remValor = null;
  }

  closeRemanejamentoModal() {
    this.showRemanejamentoModal = false;
  }

  solicitarRemanejamento() {
    // Aqui você pode implementar a lógica de validação e envio do remanejamento
    // Exemplo: alert ou integração futura
    alert(`Solicitação de remanejamento:\nOrigem: ${this.remOrigem}\nDestino: ${this.remDestino}\nValor: ${this.remValor}`);
    this.closeRemanejamentoModal();
  }
  itensSinteticos = [
    {
      codigo: '71401',
      nome: 'EIXO 04 GRANTMAKING',
      valorOrcado: 100000,
      valorRealizado: 80000,
      codigoCentroCusto: '71401',
      centroCusto: 'EIXO 04 GRANTMAKING',
      codigoItemContabil: '10113003003',
      nomeItemContabil: 'CORE SEQUOIA 2025',
      ano: '2025',
      analiticos: []
    },
    {
      codigo: '71401',
      nome: 'EIXO 04 GRANTMAKING',
      valorOrcado: 90000,
      valorRealizado: 70000,
      codigoCentroCusto: '71401',
      centroCusto: 'EIXO 04 GRANTMAKING',
      codigoItemContabil: '10119001005',
      nomeItemContabil: 'PROJ CLUA 2025',
      ano: '2025',
      analiticos: []
    },
    {
      codigo: '71401',
      nome: 'EIXO 04 GRANTMAKING',
      valorOrcado: 120000,
      valorRealizado: 95000,
      codigoCentroCusto: '71401',
      centroCusto: 'EIXO 04 GRANTMAKING',
      codigoItemContabil: '10101016003',
      nomeItemContabil: 'PROJ CWF FILANTROPIA E SUBNACIONA...',
      ano: '2025',
      analiticos: []
    },
    {
      codigo: '71401',
      nome: 'EIXO 04 GRANTMAKING',
      valorOrcado: 110000,
      valorRealizado: 90000,
      codigoCentroCusto: '71401',
      centroCusto: 'EIXO 04 GRANTMAKING',
      codigoItemContabil: '10143001001',
      nomeItemContabil: 'PROJ FC UNFCCC 2025',
      ano: '2025',
      analiticos: []
    },
    {
      codigo: '71401',
      nome: 'EIXO 04 GRANTMAKING',
      valorOrcado: 95000,
      valorRealizado: 70000,
      codigoCentroCusto: '71401',
      centroCusto: 'EIXO 04 GRANTMAKING',
      codigoItemContabil: '10130005005',
      nomeItemContabil: 'PROJ OAK PEOPLE CENTRIC 2025',
      ano: '2025',
      analiticos: []
    },
    {
      codigo: '71401',
      nome: 'EIXO 04 GRANTMAKING',
      valorOrcado: 80000,
      valorRealizado: 60000,
      codigoCentroCusto: '71401',
      centroCusto: 'EIXO 04 GRANTMAKING',
      codigoItemContabil: '10208008001',
      nomeItemContabil: 'PROJ ITAUSA ANUARIO 2.0 2025',
      ano: '2025',
      analiticos: []
    },
    {
      codigo: '71401',
      nome: 'EIXO 04 GRANTMAKING',
      valorOrcado: 85000,
      valorRealizado: 65000,
      codigoCentroCusto: '71401',
      centroCusto: 'EIXO 04 GRANTMAKING',
      codigoItemContabil: '10124001007',
      nomeItemContabil: 'GMF BEZOS AMAZONIA 2025',
      ano: '2025',
      analiticos: []
    },
    {
      codigo: '71401',
      nome: 'EIXO 04 GRANTMAKING',
      valorOrcado: 90000,
      valorRealizado: 70000,
      codigoCentroCusto: '71401',
      centroCusto: 'EIXO 04 GRANTMAKING',
      codigoItemContabil: '10102005003',
      nomeItemContabil: 'PROJ CIFF FISCAL POLICY 2025',
      ano: '2025',
      analiticos: []
    },
    {
      codigo: '71401',
      nome: 'EIXO 04 GRANTMAKING',
      valorOrcado: 95000,
      valorRealizado: 80000,
      codigoCentroCusto: '71401',
      centroCusto: 'EIXO 04 GRANTMAKING',
      codigoItemContabil: '10124002001',
      nomeItemContabil: 'GMF BEZOS USP_IPEA 2025',
      ano: '2025',
      analiticos: []
    },
    {
      codigo: '71401',
      nome: 'EIXO 04 GRANTMAKING',
      valorOrcado: 100000,
      valorRealizado: 85000,
      codigoCentroCusto: '71401',
      centroCusto: 'EIXO 04 GRANTMAKING',
      codigoItemContabil: '10108002002',
      nomeItemContabil: 'GMF FILE CLIMATE ACTION 2025',
      ano: '2025',
      analiticos: []
    }
  ];

  columnsSinteticos: PoTableColumn[] = [
    { property: 'codigo', label: 'Código', width: '10%' },
    { property: 'nome', label: 'Item Sintético', width: '30%' },
    { property: 'valorOrcado', label: 'Orçado', type: 'currency', format: 'BRL', width: '20%' },
    { property: 'valorRealizado', label: 'Realizado', type: 'currency', format: 'BRL', width: '20%' },
    { property: 'saldo', label: 'Saldo', type: 'currency', format: 'BRL', width: '20%' }
  ];

  selectedSintetico: any = null;
  showAnaliticosModal = false;

  columnsAnaliticos: PoTableColumn[] = [
    { property: 'codigo', label: 'Código', width: '15%' },
    { property: 'nome', label: 'Item Analítico', width: '35%' },
    { property: 'valorOrcado', label: 'Orçado', type: 'currency', format: 'BRL', width: '20%' },
    { property: 'valorRealizado', label: 'Realizado', type: 'currency', format: 'BRL', width: '20%' },
    { property: 'saldo', label: 'Saldo', type: 'currency', format: 'BRL', width: '10%' }
  ];

  getSinteticosTableData() {
    return this.itensSinteticos.map(item => ({
      ...item,
      saldo: item.valorOrcado - item.valorRealizado
    }));
  }

  onSinteticoClick(row: any) {
    this.selectedSintetico = row;
    this.showAnaliticosModal = true;
  }

  getAnaliticosTableData() {
    if (!this.selectedSintetico) return [];
    return this.selectedSintetico.analiticos.map((a: any) => ({
      ...a,
      saldo: a.valorOrcado - a.valorRealizado
    }));
  }

  closeAnaliticosModal() {
    this.showAnaliticosModal = false;
    this.selectedSintetico = null;
  }
// ...fim do arquivo...
}
