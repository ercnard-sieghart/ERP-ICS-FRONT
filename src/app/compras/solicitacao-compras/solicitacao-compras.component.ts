import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  PoTableModule, 
  PoTableColumn, 
  PoButtonModule,
  PoFieldModule,
  PoLoadingModule,
  PoNotificationModule,
  PoToolbarModule,
  PoModalModule,
  PoTagModule
} from '@po-ui/ng-components';
import { MenuComponent } from '../../shared/menu/menu.component';

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
    PoTableModule,
    PoButtonModule,
    PoFieldModule,
    PoLoadingModule,
    PoNotificationModule,
    PoToolbarModule,
    PoModalModule,
    PoTagModule,
    MenuComponent
  ]
})
export class SolicitacaoComprasComponent implements OnInit {
  loading: boolean = false;
  solicitacoes: SolicitacaoCompra[] = [];
  
  // Colunas da tabela
  columns: PoTableColumn[] = [
    {
      property: 'numeroSolicitacao',
      label: 'Nº Solicitação',
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
      property: 'solicitante',
      label: 'Solicitante',
      type: 'string',
      width: '20%'
    },
    {
      property: 'departamento',
      label: 'Departamento',
      type: 'string',
      width: '15%'
    },
    {
      property: 'status',
      label: 'Status',
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
      property: 'observacoes',
      label: 'Observações',
      type: 'string',
      width: '19%'
    }
  ];

  // Ações da tabela
  actions = [
    {
      action: this.visualizar.bind(this),
      label: 'Visualizar',
      icon: 'po-icon-eye'
    },
    {
      action: this.editar.bind(this),
      label: 'Editar',
      icon: 'po-icon-edit'
    }
  ];

  constructor() {}

  ngOnInit(): void {
    this.carregarSolicitacoes();
  }

  carregarSolicitacoes(): void {
    this.loading = true;
    
    // Simulando dados - aqui você faria a chamada para a API
    setTimeout(() => {
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
      this.loading = false;
    }, 1000);
  }

  novaSolicitacao(): void {
    console.log('Nova solicitação clicada');
    // Aqui você implementaria a navegação para o formulário de nova solicitação
  }

  visualizar(item: SolicitacaoCompra): void {
    console.log('Visualizar solicitação:', item);
    // Implementar visualização detalhada
  }

  editar(item: SolicitacaoCompra): void {
    console.log('Editar solicitação:', item);
    // Implementar edição
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
      'pendente': 'bg-yellow-100 text-yellow-800',
      'aprovado': 'bg-green-100 text-green-800',
      'rejeitado': 'bg-red-100 text-red-800',
      'processando': 'bg-blue-100 text-blue-800'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
  }
}