import { Component } from '@angular/core';
import { UniqueCentroCustoPipe } from './unique-centro-custo.pipe';
import { FilterItemContabilPipe } from './filter-item-contabil.pipe';
import { FilterAnoPipe } from './filter-ano.pipe';
import { FilterCentroCustoPipe } from './filter-centro-custo.pipe';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// import removido: DetalheItemModalComponent
import { PoTableModule, PoTableColumn, PoModalModule } from '@po-ui/ng-components';
import { AnaliticosModalComponent } from './analiticos-modal.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-orcamentos',
  templateUrl: './orcamentos.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PoTableModule,
    PoModalModule,
    UniqueCentroCustoPipe,
    FilterItemContabilPipe,
    FilterAnoPipe,
    FilterCentroCustoPipe,
  AnaliticosModalComponent,
  // DetalheItemModalComponent removido
  ]
})
export class OrcamentosComponent {
  // Método irParaDetalheItem removido
  // Método abrirDetalhamento removido
  constructor(private router: Router) {}
  irParaHome() {
    this.router.navigate(['/home']);
  }
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
      analiticos: [
        { codigo: 'A1001', nome: 'Analítico 1', valorOrcado: 50000, valorRealizado: 40000, saldo: 10000 },
        { codigo: 'A1002', nome: 'Analítico 2', valorOrcado: 50000, valorRealizado: 40000, saldo: 10000 }
      ]
    },
    {
      codigo: '71401', nome: 'EIXO 04 GRANTMAKING', valorOrcado: 96000, valorRealizado: 78000,
      codigoCentroCusto: '71401', centroCusto: 'EIXO 04 GRANTMAKING', codigoItemContabil: '10209004001', nomeItemContabil: 'GMF JM SALLES INST DADOS 2025', ano: '2025', analiticos: []
    },
    {
      codigo: '72104',
      nome: 'RH TREINAMENTO PROGRAMA',
      valorOrcado: 0,
      valorRealizado: 0,
      codigoCentroCusto: '72104',
      centroCusto: 'RH TREINAMENTO PROGRAMA',
      codigoItemContabil: '10101015001',
      nomeItemContabil: 'CORE CWF GENERAL SUPPORT 2025',
      ano: '2025',
      analiticos: [
        { codigo: 'B2001', nome: 'Analítico RH 1', valorOrcado: 20000, valorRealizado: 15000, saldo: 5000 },
        { codigo: 'B2002', nome: 'Analítico RH 2', valorOrcado: 30000, valorRealizado: 25000, saldo: 5000 }
      ]
    },
      {
        codigo: '72105',
        nome: 'RH TREINAMENTO OPERACAO',
        valorOrcado: 0,
        valorRealizado: 0,
        codigoCentroCusto: '72105',
        centroCusto: 'RH TREINAMENTO OPERACAO',
        codigoItemContabil: '10103008001',
        nomeItemContabil: 'CORE OAK GENERAL SUPPORT 2025',
        ano: '2025',
        analiticos: [
          { codigo: 'C3001', nome: 'Analítico OP 1', valorOrcado: 10000, valorRealizado: 8000, saldo: 2000 },
          { codigo: 'C3002', nome: 'Analítico OP 2', valorOrcado: 15000, valorRealizado: 12000, saldo: 3000 }
        ]
      },
      {
        codigo: '72105',
        nome: 'RH TREINAMENTO OPERACAO',
        valorOrcado: 0,
        valorRealizado: 0,
        codigoCentroCusto: '72105',
        centroCusto: 'RH TREINAMENTO OPERACAO',
        codigoItemContabil: '10102004004',
        nomeItemContabil: 'CORE CIFF 2025',
        ano: '2025',
        analiticos: [
          { codigo: 'D4001', nome: 'Analítico CIFF 1', valorOrcado: 8000, valorRealizado: 6000, saldo: 2000 },
          { codigo: 'D4002', nome: 'Analítico CIFF 2', valorOrcado: 12000, valorRealizado: 10000, saldo: 2000 }
        ]
      },
      {
        codigo: '72105',
        nome: 'RH TREINAMENTO OPERACAO',
        valorOrcado: 0,
        valorRealizado: 0,
        codigoCentroCusto: '72105',
        centroCusto: 'RH TREINAMENTO OPERACAO',
        codigoItemContabil: '10137001002',
        nomeItemContabil: 'CORE BALLMER 2025',
        ano: '2025',
        analiticos: [
          { codigo: 'E5001', nome: 'Analítico BALLMER 1', valorOrcado: 9000, valorRealizado: 7000, saldo: 2000 },
          { codigo: 'E5002', nome: 'Analítico BALLMER 2', valorOrcado: 11000, valorRealizado: 9000, saldo: 2000 }
        ]
      }
  ];
  selectedSintetico: any = null;
  showAnaliticosModal: boolean = false;
  // showDetalhesAnaliticoModal removido
    showRemanejamentoModal: boolean = false;
  // analiticoSelecionado removido
    remOrigem: string = '';
    remDestino: string = '';
    remValor: number | null = null;
PoButtonType: any;

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
    // Força detecção de mudanças caso o modal não abra
    Promise.resolve().then(() => {});
  }

  closeAnaliticosModal() {
    this.showAnaliticosModal = false;
    this.selectedSintetico = null;
  }

    // Método onAnaliticoClick removido

    // Método closeDetalhesAnaliticoModal removido

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