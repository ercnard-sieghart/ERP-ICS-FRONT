import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import {
  PoTableModule,
  PoTableColumn,
  PoButtonModule,
  PoFieldModule,
  PoNotificationModule,
  PoNotificationService,
  PoLoadingModule,
  PoModalModule,
  PoSelectOption,
  PoTagModule,
  PoDatepickerModule
} from '@po-ui/ng-components';
import { 
  ExtratoBancarioService, 
  FiltrosExtrato, 
  MovimentoBancario, 
  RespostaExtrato, 
  Banco,
  Agencia,
  ContaItem
} from './services/extrato-bancario.service';


@Component({
  selector: 'app-consulta-extrato',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PoTableModule,
    PoButtonModule,
    PoFieldModule,
    PoLoadingModule,
    PoModalModule,
    PoTagModule,
    PoDatepickerModule
  ],
  templateUrl: './consulta-extrato.component.html',
  styleUrls: ['./consulta-extrato.component.css']
})
export class ConsultaExtratoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Filtros
  filtros: FiltrosExtrato = {
    filial: '01',
    banco: '',
    agencia: '',
    conta: '',
    dataInicio: '',
    dataFim: ''
  };

  // Dados
  movimentos: MovimentoBancario[] = [];
  bancos: Banco[] = [];
  bancosOptions: PoSelectOption[] = [];
  agenciasOptions: PoSelectOption[] = [];
  contasOptions: PoSelectOption[] = [];
  
  // Estados
  isLoading = false;
  totalSaldo = 0;
  totalCredito = 0;
  totalDebito = 0;
  qtdMovimentos = 0;

  // Colunas da tabela
  columns: PoTableColumn[] = [
    {
      property: 'dataMov',
      label: 'Data',
      type: 'date',
      width: '100px'
    },
    {
      property: 'historico',
      label: 'Histórico',
      width: '300px'
    },
    {
      property: 'documento',
      label: 'Documento',
      width: '120px'
    },
    {
      property: 'beneficiario',
      label: 'Beneficiário',
      width: '200px'
    },
    {
      property: 'entrada',
      label: 'Entrada',
      type: 'currency',
      format: 'BRL',
      width: '120px'
    },
    {
      property: 'saida',
      label: 'Saída',
      type: 'currency',
      format: 'BRL',
      width: '120px'
    },
    {
      property: 'recPag',
      label: 'Tipo',
      width: '80px',
      type: 'label',
      labels: [
        { value: 'R', color: 'color-11', label: 'Recebimento' },
        { value: 'P', color: 'color-07', label: 'Pagamento' }
      ]
    }
  ];

  // Opções de filtro
  tipoOperacaoOptions: PoSelectOption[] = [
    { label: 'Todos', value: '' },
    { label: 'Recebimentos', value: 'R' },
    { label: 'Pagamentos', value: 'P' }
  ];

  constructor(
    private extratoService: ExtratoBancarioService,
    private notification: PoNotificationService
  ) {}

  ngOnInit() {
    this.carregarBancos();
    this.setupSearchDebounce();
    this.setDatasPadrao();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchDebounce() {
    this.searchSubject
      .pipe(
        debounceTime(500),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.consultarExtrato();
      });
  }

  private setDatasPadrao() {
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    this.filtros.dataInicio = this.formatDate(primeiroDiaMes);
    this.filtros.dataFim = this.formatDate(hoje);
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  async carregarBancos() {
    try {
      const response = await this.extratoService.listarBancos().toPromise();
      if (response?.success) {
        this.bancos = response.bancos || [];
        this.bancosOptions = [
          { label: 'Selecione um banco', value: '' },
          ...this.bancos.map(banco => ({
            label: `${banco.codigo} - ${banco.nomeReduzido}`,
            value: banco.codigo
          }))
        ];
      }
    } catch (error) {
      this.notification.error('Erro ao carregar bancos');
      console.error('Erro ao carregar bancos:', error);
    }
  }

  onBancoChange(codigoBanco: string) {
    this.filtros.banco = codigoBanco;
    this.filtros.agencia = '';
    this.filtros.conta = '';
    this.agenciasOptions = [];
    this.contasOptions = [];
    
    if (codigoBanco) {
      this.carregarAgencias(codigoBanco);
    }
  }

  onAgenciaChange(codigoAgencia: string) {
    this.filtros.agencia = codigoAgencia;
    this.filtros.conta = '';
    this.contasOptions = [];
    
    if (this.filtros.banco && codigoAgencia) {
      this.carregarContas(this.filtros.banco, codigoAgencia);
    }
  }

  onContaChange(codigoConta: string) {
    this.filtros.conta = codigoConta;
  }

  async carregarAgencias(codigoBanco: string) {
    try {
      const response = await this.extratoService.listarAgencias(codigoBanco).toPromise();
      if (response?.success) {
        this.agenciasOptions = response.agencias.map(agencia => ({
          label: agencia.AGENCIAS,
          value: agencia.AGENCIAS
        }));
      }
    } catch (error) {
      this.notification.error('Erro ao carregar agências');
    }
  }

  async carregarContas(codigoBanco: string, codigoAgencia?: string) {
    try {
      const response = await this.extratoService.listarContas(codigoBanco, codigoAgencia).toPromise();
      if (response?.success) {
        this.contasOptions = response.contas.map(contaItem => ({
          label: contaItem.contas,
          value: contaItem.contas
        }));
      }
    } catch (error) {
      this.notification.error('Erro ao carregar contas');
    }
  }

  async consultarExtrato() {
    if (!this.validarFiltros()) {
      return;
    }

    this.isLoading = true;



    try {
      const response = await this.extratoService.consultarExtrato(this.filtros).toPromise();
      
      if (response?.success) {
        this.movimentos = response.movimentos || [];
        this.atualizarResumo();
        
        if (this.movimentos.length === 0) {
          this.notification.warning('Nenhum movimento encontrado para os filtros informados');
        } else {
          this.notification.success(`${this.movimentos.length} movimento(s) encontrado(s)`);
        }
      } else {
        this.notification.error(response?.message || 'Erro ao consultar extrato');
      }
    } catch (error) {
      this.notification.error('Erro ao consultar extrato bancário');
      console.error('Erro na consulta:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private validarFiltros(): boolean {
    if (!this.filtros.banco) {
      this.notification.warning('Selecione um banco');
      return false;
    }

    if (!this.filtros.agencia) {
      this.notification.warning('Informe a agência');
      return false;
    }

    if (!this.filtros.conta) {
      this.notification.warning('Informe a conta');
      return false;
    }

    if (!this.filtros.dataInicio || !this.filtros.dataFim) {
      this.notification.warning('Informe o período de consulta');
      return false;
    }

    const dataInicial = new Date(this.filtros.dataInicio);
    const dataFinal = new Date(this.filtros.dataFim);

    if (dataInicial > dataFinal) {
      this.notification.warning('Data inicial não pode ser maior que data final');
      return false;
    }

    return true;
  }

  private atualizarResumo() {
    this.qtdMovimentos = this.movimentos.length;
    this.totalCredito = this.movimentos
      .filter(m => m.recPag === 'R')
      .reduce((sum, m) => sum + m.entrada, 0);
    
    this.totalDebito = this.movimentos
      .filter(m => m.recPag === 'P')
      .reduce((sum, m) => sum + m.saida, 0);
    
    this.totalSaldo = this.totalCredito - this.totalDebito;
  }

  onFiltroChange() {
    this.searchSubject.next('');
  }

  limparFiltros() {
    this.filtros = {
      filial: '01',
      banco: '',
      agencia: '',
      conta: '',
      dataInicio: '',
      dataFim: ''
    };
    
    this.movimentos = [];
    this.setDatasPadrao();
    this.atualizarResumo();
  }

  exportarExtrato() {
    if (this.movimentos.length === 0) {
      this.notification.warning('Nenhum dado para exportar');
      return;
    }

    // Implementar exportação CSV/Excel
    this.notification.information('Funcionalidade de exportação em desenvolvimento');
  }

  // TrackBy function para performance
  trackByMovimento(index: number, movimento: MovimentoBancario): string {
    return `${movimento.documento}-${movimento.dataMov}-${index}`;
  }
}