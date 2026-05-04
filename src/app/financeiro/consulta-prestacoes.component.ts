import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConsultaPrestacaoService, PrestacaoRow } from './services/consulta-prestacao.service';

const STATUS_MAP: Record<string, { label: string; cls: string; dot: string }> = {
  '1': { label: 'Em aberto',                     cls: 'bg-amber-100  text-amber-800  border-amber-200',   dot: 'bg-amber-500'   },
  '2': { label: 'Em conferência sem bloqueio',   cls: 'bg-blue-100   text-blue-800   border-blue-200',    dot: 'bg-blue-500'    },
  '3': { label: 'Em conferência com bloqueio',   cls: 'bg-orange-100 text-orange-800 border-orange-200',  dot: 'bg-orange-500'  },
  '4': { label: 'Em avaliação do gestor',        cls: 'bg-violet-100 text-violet-800 border-violet-200',  dot: 'bg-violet-500'  },
  '5': { label: 'Reprovada',                     cls: 'bg-red-100    text-red-800    border-red-200',     dot: 'bg-red-500'     },
  '6': { label: 'Aprovada',                      cls: 'bg-green-100  text-green-800  border-green-200',   dot: 'bg-green-500'   },
  '7': { label: 'Em avaliação do financeiro',    cls: 'bg-indigo-100 text-indigo-800 border-indigo-200',  dot: 'bg-indigo-500'  },
  '8': { label: 'Finalizada',                    cls: 'bg-teal-100   text-teal-800   border-teal-200',    dot: 'bg-teal-500'    },
  '9': { label: 'Faturada',                      cls: 'bg-slate-100  text-slate-800  border-slate-200',   dot: 'bg-slate-500'   },
};

@Component({
  selector: 'app-consulta-prestacoes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <main class="h-full flex flex-col bg-gradient-to-br from-[#1A4E79] to-[#75C9C8] overflow-hidden">

    <!-- ── Cabeçalho ── -->
    <div class="flex-shrink-0 px-4 md:px-6 pt-4 md:pt-6 pb-3">
      <div class="max-w-5xl mx-auto flex justify-center md:justify-start">
        <div class="text-center md:text-left">
          <h1 class="text-xl md:text-2xl font-bold text-white">
            Minhas Prestações
          </h1>
          <p class="text-white/60 text-xs mt-0.5">
            Histórico de prestações de contas
          </p>
        </div>
      </div>
    </div>


    <!-- ── Conteúdo ── -->
    <div class="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 pb-6">
      <div class="max-w-5xl mx-auto space-y-4">

        <!-- Filtros -->
        <div class="bg-white rounded-xl shadow-lg p-4">
          <div class="flex flex-col sm:flex-row gap-3">

            <!-- Busca por código -->
            <div class="flex-1">
              <label class="block text-xs font-semibold text-[#1A4E79] mb-1 uppercase tracking-wide">Buscar por código</label>
              <div class="relative">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
                </svg>
                <input type="text" [(ngModel)]="filtroBusca" placeholder="Ex: 000001"
                  (keyup.enter)="filtrar()"
                  class="w-full pl-9 pr-3 py-2.5 border border-[#75C9C8]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#75C9C8]" />
              </div>
            </div>

            <!-- Filtro de status -->
            <div class="sm:w-52">
              <label class="block text-xs font-semibold text-[#1A4E79] mb-1 uppercase tracking-wide">Status</label>
              <select [(ngModel)]="filtroStatus" (change)="filtrar()"
                class="w-full px-3 py-2.5 border border-[#75C9C8]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#75C9C8] bg-white">
                <option value="">Todos</option>
                <option *ngFor="let s of statusOpcoes" [value]="s.cod">{{ s.label }}</option>
              </select>
            </div>

            <!-- Botão buscar -->
            <div class="sm:self-end">
              <button type="button" (click)="filtrar()" [disabled]="isLoading"
                class="w-full sm:w-auto px-5 py-2.5 text-sm bg-gradient-to-r from-[#1A4E79] to-[#75C9C8] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all font-semibold">
                Buscar
              </button>
            </div>
          </div>
        </div>

        <!-- Tabela / estados -->
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">

          <!-- Loading -->
          <div *ngIf="isLoading" class="flex flex-col items-center justify-center py-16 gap-3">
            <div class="w-10 h-10 border-4 border-[#75C9C8]/30 border-t-[#1A4E79] rounded-full animate-spin"></div>
            <p class="text-sm text-gray-400">Carregando prestações...</p>
          </div>

          <!-- Erro -->
          <div *ngIf="!isLoading && errorMsg" class="flex flex-col items-center justify-center py-16 gap-3 px-6 text-center">
            <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
            </div>
            <p class="text-sm font-semibold text-red-600">{{ errorMsg }}</p>
            <button type="button" (click)="carregar()"
              class="text-xs text-[#1A4E79] underline hover:no-underline">Tentar novamente</button>
          </div>

          <!-- Lista vazia -->
          <div *ngIf="!isLoading && !errorMsg && rows.length === 0"
            class="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
            <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0121 9.414V19a2 2 0 01-2 2z"/>
            </svg>
            <p class="text-sm font-semibold text-gray-400">Nenhuma prestação encontrada</p>
            <p class="text-xs text-gray-300">Tente ajustar os filtros ou crie uma nova prestação</p>
          </div>

          <!-- Tabela -->
          <div *ngIf="!isLoading && !errorMsg && rows.length > 0" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-[#f8fdfd] border-b border-[#E6EEF2]">
                  <th class="px-4 py-3 text-left text-xs font-semibold text-[#1A4E79] uppercase tracking-wide">Código</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-[#1A4E79] uppercase tracking-wide">Emissão</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-[#1A4E79] uppercase tracking-wide">Status</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-[#1A4E79] uppercase tracking-wide hidden md:table-cell">Cliente/Fornecedor</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-[#1A4E79] uppercase tracking-wide hidden lg:table-cell">Conferência</th>
                  <th class="px-4 py-3 text-right text-xs font-semibold text-[#1A4E79] uppercase tracking-wide">Valor Total</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-[#1A4E79] uppercase tracking-wide w-12"></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let r of rows"
                  (click)="abrirDetalhe(r)"
                  class="border-b border-[#E6EEF2] hover:bg-[#f0fafa] cursor-pointer transition-colors group">
                  <td class="px-4 py-3 font-semibold text-[#1A4E79]">{{ r.codigo }}</td>
                  <td class="px-4 py-3 text-gray-600 whitespace-nowrap">{{ formatDate(r.emissao) }}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border {{ statusInfo(r.status).cls }}">
                      <span class="w-1.5 h-1.5 rounded-full {{ statusInfo(r.status).dot }}"></span>
                      {{ statusInfo(r.status).label }}
                    </span>
                    <p *ngIf="r.status === '5' && r.motvfl"
                      class="mt-1 text-[11px] text-red-600 max-w-[200px] truncate" [title]="r.motvfl">
                      {{ r.motvfl }}
                    </p>
                  </td>
                  <td class="px-4 py-3 text-gray-600 text-xs hidden md:table-cell">{{ r.nomecf || '—' }}</td>
                  <td class="px-4 py-3 text-gray-600 whitespace-nowrap hidden lg:table-cell">{{ formatDate(r.dtConf) }}</td>
                  <td class="px-4 py-3 text-right font-semibold text-gray-700 whitespace-nowrap">
                    R$ {{ r.valorTotal | number:'1.2-2' }}
                  </td>
                  <td class="px-4 py-3 text-center">
                    <svg class="w-4 h-4 text-gray-300 group-hover:text-[#75C9C8] transition-colors mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Paginação -->
          <div *ngIf="!isLoading && !errorMsg && totalPages > 1"
            class="flex items-center justify-between px-4 py-3 border-t border-[#E6EEF2] bg-[#f8fdfd]">
            <p class="text-xs text-gray-400">
              {{ (page - 1) * pageSize + 1 }}–{{ min(page * pageSize, total) }} de {{ total }} prestações
            </p>
            <div class="flex items-center gap-1">
              <button type="button" (click)="irParaPagina(page - 1)" [disabled]="page === 1"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-[#1A4E79] hover:bg-[#e6eef0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <ng-container *ngFor="let p of pageNumbers">
                <button type="button" (click)="irParaPagina(p)"
                  [ngClass]="p === page
                    ? 'bg-[#1A4E79] text-white'
                    : 'text-[#1A4E79] hover:bg-[#e6eef0]'"
                  class="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors">
                  {{ p }}
                </button>
              </ng-container>
              <button type="button" (click)="irParaPagina(page + 1)" [disabled]="page === totalPages"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-[#1A4E79] hover:bg-[#e6eef0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  </main>
  `
})
export class ConsultaPrestacoesComponent implements OnInit {

  rows:      PrestacaoRow[] = [];
  total      = 0;
  page       = 1;
  pageSize   = 20;
  isLoading  = false;
  errorMsg   = '';
  filtroStatus = '';
  filtroBusca  = '';

  readonly statusOpcoes = Object.entries(STATUS_MAP).map(([cod, v]) => ({ cod, label: v.label }));

  constructor(
    private service: ConsultaPrestacaoService,
    private router:  Router
  ) {}

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.isLoading = true;
    this.errorMsg  = '';
    this.service.listarPrestacoes({
      status:   this.filtroStatus,
      busca:    this.filtroBusca,
      page:     this.page,
      pageSize: this.pageSize
    }).subscribe({
      next: r => {
        this.rows     = r.rows;
        this.total    = r.total;
        this.page     = r.page;
        this.isLoading = false;
      },
      error: e => {
        this.errorMsg  = e.message;
        this.isLoading = false;
      }
    });
  }

  filtrar(): void {
    this.page = 1;
    this.carregar();
  }

  irParaPagina(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.carregar();
  }

  abrirDetalhe(r: PrestacaoRow): void {
    this.router.navigate(['/financeiro/minhas-prestacoes', r.codigo], {
      queryParams: { status: r.status }
    });
  }

  statusInfo(s: string): { label: string; cls: string; dot: string } {
    return STATUS_MAP[s] ?? { label: s || '—', cls: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
  }

  get totalPages(): number { return Math.ceil(this.total / this.pageSize) || 1; }

  get pageNumbers(): number[] {
    const t = this.totalPages;
    if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1);
    const near = new Set([1, t, this.page - 1, this.page, this.page + 1].filter(p => p >= 1 && p <= t));
    return [...near].sort((a, b) => a - b);
  }

  min(a: number, b: number): number { return Math.min(a, b); }

  formatDate(d: string): string {
    if (!d) return '—';
    const s = d.replace(/\D/g, '');
    if (s.length === 8) return `${s.slice(6)}/${s.slice(4, 6)}/${s.slice(0, 4)}`;
    return d || '—';
  }
}
