
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PoTableModule, PoTableColumn, PoModalModule } from '@po-ui/ng-components';
import { MenuComponent } from "../shared/menu/menu.component";

@Component({
  selector: 'app-orcamentos',
  templateUrl: './orcamentos.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, PoTableModule, PoModalModule, MenuComponent]
})
export class OrcamentosComponent {
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
      codigo: '1001',
      nome: 'Despesas Operacionais',
      valorOrcado: 5000,
      valorRealizado: 3200,
      analiticos: [
        { codigo: 'A01', nome: 'Energia', valorOrcado: 2000, valorRealizado: 1200 },
        { codigo: 'A02', nome: 'Água', valorOrcado: 1500, valorRealizado: 1100 },
        { codigo: 'A03', nome: 'Internet', valorOrcado: 1500, valorRealizado: 900 }
      ]
    },
    {
      codigo: '1002',
      nome: 'Despesas Administrativas',
      valorOrcado: 3000,
      valorRealizado: 1800,
      analiticos: [
        { codigo: 'A10', nome: 'Material Escritório', valorOrcado: 2000, valorRealizado: 1200 },
        { codigo: 'A11', nome: 'Serviços Terceiros', valorOrcado: 1000, valorRealizado: 600 }
      ]
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
