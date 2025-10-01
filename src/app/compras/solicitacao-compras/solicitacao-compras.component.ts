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
  solicitacoesFiltradas: SolicitacaoCompra[] = [];
  registroSelecionado: SolicitacaoCompra | null = null;
  
  // Propriedades de filtros
  filtros = {
    numeroSolicitacao: '',
    data: '',
    cc: '',
    contato: ''
  };

  // Listas para autocomplete
  ccSugestoes: string[] = [];
  contatoSugestoes: string[] = [];
  ccSugestoesFiltradas: string[] = [];
  contatoSugestoesFiltradas: string[] = [];
  mostrarSugestoesCc: boolean = false;
  mostrarSugestoesContato: boolean = false;
  
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
      width: '10%'
    },
    {
      property: 'dataSolicitacao',
      label: 'Data',
      type: 'date',
      width: '15%'
    },
    {
      property: 'produto',
      label: 'Produto',
      type: 'string',
      width: '10%'
    },
    {
      property: 'cc',
      label: 'Centro de Custo',
      type: 'string',
      width: '10%'
    },
    {
      property: 'contato',
      label: 'Contato',
      type: 'string',
      width: '12%'
    },
    {
      property: 'status',
      label: 'Situação',
      type: 'label',
      width: '10%',
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
      width: '15%'
    },
    {
      property: 'obs',
      label: 'Observações',
      type: 'string',
      width: '18%'
    }
  ];

  constructor(
    private poNotification: PoNotificationService,
    private solicitacaoService: SolicitacaoComprasService
  ) {}

  ngOnInit(): void {
    this.carregarSolicitacoes();
    // Centralizar na tabela após o carregamento inicial
    this.centralizarTabela();
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
        this.solicitacoesFiltradas = [...this.solicitacoes];
        
        // Extrair listas únicas para autocomplete
        this.extrairSugestoes();
        
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

  aplicarFiltros(): void {
    this.solicitacoesFiltradas = this.solicitacoes.filter(solicitacao => {
      let atendeFiltro = true;

      if (this.filtros.numeroSolicitacao && this.filtros.numeroSolicitacao.trim()) {
        atendeFiltro = atendeFiltro && solicitacao.numeroSolicitacao
          .toLowerCase()
          .includes(this.filtros.numeroSolicitacao.toLowerCase());
      }

      if (this.filtros.data && this.filtros.data.trim()) {
        const dataFiltro = new Date(this.filtros.data);
        const dataSolicitacao = new Date(solicitacao.dataSolicitacao);
        atendeFiltro = atendeFiltro && dataSolicitacao.toDateString() === dataFiltro.toDateString();
      }

      if (this.filtros.cc && this.filtros.cc.trim()) {
        atendeFiltro = atendeFiltro && (solicitacao as any).cc
          .toLowerCase()
          .includes(this.filtros.cc.toLowerCase());
      }

      if (this.filtros.contato && this.filtros.contato.trim()) {
        atendeFiltro = atendeFiltro && (solicitacao as any).contato
          .toLowerCase()
          .includes(this.filtros.contato.toLowerCase());
      }

      return atendeFiltro;
    });

    this.poNotification.success({
      message: `${this.solicitacoesFiltradas.length} registros encontrados`,
      duration: 3000
    });
  }

  limparFiltros(): void {
    this.filtros = {
      numeroSolicitacao: '',
      data: '',
      cc: '',
      contato: ''
    };
    
    this.solicitacoesFiltradas = [...this.solicitacoes];
    
    this.poNotification.information({
      message: 'Filtros limpos. Exibindo todas as solicitações.',
      duration: 3000
    });
  }

  extrairSugestoes(): void {
    // Extrair CCs únicos
    const ccsUnicos = [...new Set(this.solicitacoes.map(s => (s as any).cc).filter(cc => cc && cc.trim()))];
    this.ccSugestoes = ccsUnicos.sort();

    // Extrair contatos únicos
    const contatosUnicos = [...new Set(this.solicitacoes.map(s => (s as any).contato).filter(contato => contato && contato.trim()))];
    this.contatoSugestoes = contatosUnicos.sort();
  }

  onCcInput(valor: string): void {
    if (valor && valor.length > 0) {
      this.ccSugestoesFiltradas = this.ccSugestoes.filter(cc => 
        cc.toLowerCase().includes(valor.toLowerCase())
      ).slice(0, 5); // Mostrar apenas 5 sugestões
      this.mostrarSugestoesCc = this.ccSugestoesFiltradas.length > 0;
    } else {
      this.mostrarSugestoesCc = false;
    }
  }

  onContatoInput(valor: string): void {
    if (valor && valor.length > 0) {
      this.contatoSugestoesFiltradas = this.contatoSugestoes.filter(contato => 
        contato.toLowerCase().includes(valor.toLowerCase())
      ).slice(0, 5); // Mostrar apenas 5 sugestões
      this.mostrarSugestoesContato = this.contatoSugestoesFiltradas.length > 0;
    } else {
      this.mostrarSugestoesContato = false;
    }
  }

  selecionarCc(cc: string): void {
    this.filtros.cc = cc;
    this.mostrarSugestoesCc = false;
  }

  selecionarContato(contato: string): void {
    this.filtros.contato = contato;
    this.mostrarSugestoesContato = false;
  }

  onCcInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.onCcInput(target.value);
  }

  onContatoInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.onContatoInput(target.value);
  }

  onCcBlur(): void {
    // Delay para permitir clique na sugestão
    setTimeout(() => {
      this.mostrarSugestoesCc = false;
    }, 200);
  }

  onContatoBlur(): void {
    // Delay para permitir clique na sugestão
    setTimeout(() => {
      this.mostrarSugestoesContato = false;
    }, 200);
  }

  centralizarTabela(): void {
    // Aguardar um tempo para a tabela ser renderizada
    setTimeout(() => {
      // Tentar diferentes seletores para encontrar a tabela
      let tabelaElement = document.getElementById('tabela-solicitacoes');
      
      if (!tabelaElement) {
        tabelaElement = document.getElementById('secao-tabela');
      }
      
      if (!tabelaElement) {
        tabelaElement = document.querySelector('po-table');
      }
      
      if (tabelaElement) {
        // Scroll suave para o início da tabela
        tabelaElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
        
        console.log('Tabela centralizada na tela');
      } else {
        // Fallback: scroll para uma posição aproximada
        const aproximatePosition = window.innerHeight * 0.8; // 80% da altura da tela
        window.scrollTo({
          top: aproximatePosition,
          behavior: 'smooth'
        });
        
        console.warn('Elemento da tabela não encontrado, usando posição aproximada');
      }
    }, 2000); // Delay maior para garantir renderização completa no carregamento inicial
  }
}