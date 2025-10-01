import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { 
  PoTableModule, 
  PoTableColumn, 
  PoButtonModule,
  PoFieldModule,
  PoLoadingModule,
  PoNotificationModule,
  PoToolbarModule,
  PoModalModule,
  PoTagModule,
  PoNotificationService
} from '@po-ui/ng-components';
import { MenuComponent } from '../../shared/menu/menu.component';
import { SolicitacaoComprasService } from '../../compras/services/solicitacao-compras.service';

interface SolicitacaoCompra {
  id: string;
  numeroSolicitacao: string;
  dataSolicitacao: string;
  solicitante: string;
  departamento: string;
  status: string;
  valorTotal: number;
  observacoes?: string;
}

@Component({
  selector: 'app-solicitacao-compras',
  templateUrl: './solicitacao-compras.component.html',
  styleUrls: ['./solicitacao-compras.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    PoTableModule,
    PoButtonModule,
    PoFieldModule,
    PoLoadingModule,
    PoNotificationModule,
    PoToolbarModule,
    PoModalModule,
    PoTagModule,
    MenuComponent
  ],
  providers: [SolicitacaoComprasService]
})
export class SolicitacaoComprasComponent implements OnInit {
  loading: boolean = false;
  solicitacoes: SolicitacaoCompra[] = [];
  registroSelecionado: SolicitacaoCompra | null = null;
  
  // Propriedades do modal de edição
  showEditModal: boolean = false;
  registroEdicao: SolicitacaoCompra = {
    id: '',
    numeroSolicitacao: '',
    dataSolicitacao: '',
    solicitante: '',
    departamento: '',
    status: 'pendente',
    valorTotal: 0,
    observacoes: ''
  };
  
  // Colunas da tabela
  columns: PoTableColumn[] = [
    {
      property: 'numeroSolicitacao',
      label: 'Número',
      type: 'string',
      width: '12%'
    },
    {
      property: 'dataSolicitacao',
      label: 'Data',
      type: 'date',
      width: '10%'
    },
    {
      property: 'contato',
      label: 'Contato',
      type: 'string',
      width: '20%'
    },
    {
      property: 'status',
      label: 'Situação',
      type: 'label',
      width: '12%',
      labels: [
        { value: 'pendente', color: 'color-08', label: 'Pendente' },
        { value: 'aprovado', color: 'color-11', label: 'Aprovado' },
        { value: 'rejeitado', color: 'color-07', label: 'Rejeitado' },
        { value: 'processando', color: 'color-03', label: 'Processando' }
      ]
    },
    {
      property: 'valorTotal',
      label: 'Valor Total',
      type: 'currency',
      format: 'BRL',
      width: '12%'
    },
    {
      property: 'obs',
      label: 'Observações',
      type: 'string',
      width: '34%'
    }
  ];

  constructor(
    private poNotification: PoNotificationService,
    private solicitacaoService: SolicitacaoComprasService
  ) {}

  ngOnInit(): void {
    this.carregarSolicitacoes();
  }

  onRowSelect(selectedRows: SolicitacaoCompra[]): void {
    this.registroSelecionado = selectedRows.length > 0 ? selectedRows[0] : null;
    console.log('Registro selecionado:', this.registroSelecionado);
  }

  onRowClick(event: any): void {
    // O evento do po-table contém a row clicada
    const row = event.row || event;
    if (this.registroSelecionado?.id === row.id) {
      this.registroSelecionado = null; // Desselecionar se já estiver selecionado
    } else {
      this.registroSelecionado = row; // Selecionar novo registro
    }
    console.log('Linha clicada:', row);
    console.log('Registro selecionado:', this.registroSelecionado);
  }

  isRowSelected(row: SolicitacaoCompra): boolean {
    return this.registroSelecionado?.id === row.id;
  }

  criarRegistroVazio(): SolicitacaoCompra {
    return {
      id: '',
      numeroSolicitacao: '',
      dataSolicitacao: '',
      solicitante: '',
      departamento: '',
      status: 'pendente',
      valorTotal: 0,
      observacoes: ''
    };
  }

  copiarRegistro(): void {
    if (!this.registroSelecionado) {
      return;
    }

    // Preparar dados para edição
    const novaData = new Date().toISOString().split('T')[0];
    const novoNumero = 'SOL-' + new Date().getTime().toString().slice(-6);
    
    this.registroEdicao = {
      ...this.registroSelecionado,
      id: 'new-' + new Date().getTime(),
      numeroSolicitacao: novoNumero,
      dataSolicitacao: novaData,
      status: 'pendente'
    };

    // Abrir modal de edição
    this.showEditModal = true;
  }

  cancelarEdicao(): void {
    this.showEditModal = false;
    this.registroEdicao = this.criarRegistroVazio();
    this.registroSelecionado = null;
  }

  confirmarCopia(): void {
    // Tentar salvar na API primeiro
    this.loading = true;
    
    this.solicitacaoService.criarSolicitacao(this.registroEdicao).subscribe({
      next: (resposta) => {
        console.log('Solicitação criada na API:', resposta);
        
        // Adicionar à lista local
        this.solicitacoes.unshift({ ...this.registroEdicao });
        
        // Notificação de sucesso
        this.poNotification.success({
          message: `Solicitação ${this.registroEdicao.numeroSolicitacao} criada com sucesso!`,
          duration: 4000
        });
        
        // Fechar modal e limpar
        this.showEditModal = false;
        this.registroEdicao = this.criarRegistroVazio();
        this.registroSelecionado = null;
        this.loading = false;
      },
      error: (erro) => {
        console.error('Erro ao criar solicitação na API:', erro);
        
        // Mesmo com erro na API, adicionar localmente
        this.solicitacoes.unshift({ ...this.registroEdicao });
        
        // Notificação de aviso
        this.poNotification.warning({
          message: `Solicitação ${this.registroEdicao.numeroSolicitacao} criada localmente. Erro na API: ${erro.message}`,
          duration: 6000
        });
        
        // Fechar modal e limpar
        this.showEditModal = false;
        this.registroEdicao = this.criarRegistroVazio();
        this.registroSelecionado = null;
        this.loading = false;
      }
    });
  }

  carregarSolicitacoes(mostrarNotificacao: boolean = false): void {
    this.loading = true;
    
    this.solicitacaoService.getSolicitacoes().subscribe({
      next: (dadosAPI) => {
        console.log('Dados recebidos da API:', dadosAPI);
        
        this.solicitacoes = this.solicitacaoService.mapearDadosAPI(dadosAPI);
        
        console.log('Dados mapeados:', this.solicitacoes);
        
        if (mostrarNotificacao) {
          this.poNotification.success({
            message: `${this.solicitacoes.length} solicitações carregadas com sucesso!`,
            duration: 3000
          });
        }
        
        this.loading = false;
      },
      error: (erro) => {
        console.error('Erro ao carregar solicitações:', erro);
        
        this.poNotification.error({
          message: `Erro ao carregar solicitações: ${erro.message}`,
          duration: 5000
        });
        
        this.carregarDadosExemplo();
        this.loading = false;
      }
    });
  }

  /**
   * Carrega dados de exemplo caso a API falhe
   */
  private carregarDadosExemplo(): void {
    console.log('Carregando dados de exemplo...');
    
    this.solicitacoes = [
      {
        id: '1',
        numeroSolicitacao: 'SC001/2024',
        dataSolicitacao: '2024-01-15',
        solicitante: 'João Silva',
        departamento: 'TI',
        status: 'pendente',
        valorTotal: 2500.00,
        observacoes: 'Equipamentos para desenvolvimento'
      },
      {
        id: '2',
        numeroSolicitacao: 'SC002/2024',
        dataSolicitacao: '2024-01-14',
        solicitante: 'Maria Santos',
        departamento: 'Financeiro',
        status: 'aprovado',
        valorTotal: 1200.50,
        observacoes: 'Material de escritório'
      },
      {
        id: '3',
        numeroSolicitacao: 'SC003/2024',
        dataSolicitacao: '2024-01-13',
        solicitante: 'Pedro Costa',
        departamento: 'Operações',
        status: 'processando',
        valorTotal: 5800.75,
        observacoes: 'Ferramentas industriais'
      },
      {
        id: '4',
        numeroSolicitacao: 'SC004/2024',
        dataSolicitacao: '2024-01-12',
        solicitante: 'Ana Lima',
        departamento: 'RH',
        status: 'rejeitado',
        valorTotal: 800.00,
        observacoes: 'Mobiliário de escritório'
      }
    ];
  }

  novaSolicitacao(): void {
    console.log('Nova solicitação clicada');
    // Aqui você implementaria a navegação para o formulário de nova solicitação
  }

  exportar(): void {
    console.log('Exportar dados');
    // Implementar exportação
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pendente': 'Pendente',
      'aprovado': 'Aprovado',
      'rejeitado': 'Rejeitado',
      'processando': 'Processando'
    };
    return statusMap[status] || status;
  }

  getStatusType(status: string): string {
    const typeMap: { [key: string]: string } = {
      'pendente': 'warning',
      'aprovado': 'success',
      'rejeitado': 'danger',
      'processando': 'info'
    };
    return typeMap[status] || 'default';
  }

  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'pendente': 'status-pendente',
      'aprovado': 'status-aprovado',
      'rejeitado': 'status-rejeitado',
      'processando': 'status-processando'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
  }
}