import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsultaPrestacaoService, DespesaDetalheRow } from './services/consulta-prestacao.service';

const STATUS_MAP: Record<string, { label: string; cls: string; dot: string }> = {
  '1': { label: 'Aberta',      cls: 'bg-amber-100 text-amber-800 border-amber-200',    dot: 'bg-amber-500'  },
  '2': { label: 'Em análise',  cls: 'bg-blue-100  text-blue-800  border-blue-200',     dot: 'bg-blue-500'   },
  '3': { label: 'Conferida',   cls: 'bg-purple-100 text-purple-800 border-purple-200', dot: 'bg-purple-500' },
  '4': { label: 'Rejeitada',   cls: 'bg-red-100   text-red-800   border-red-200',      dot: 'bg-red-500'    },
  '5': { label: 'Finalizada',  cls: 'bg-green-100 text-green-800 border-green-200',    dot: 'bg-green-500'  },
};

@Component({
  selector: 'app-detalhe-prestacao',
  standalone: true,
  imports: [CommonModule],
  template: `
  <main class="h-full flex flex-col bg-gradient-to-br from-[#1A4E79] to-[#75C9C8] overflow-hidden">

    <!-- ── Cabeçalho da página ── -->
    <div class="flex-shrink-0 px-4 md:px-6 pt-4 md:pt-6 pb-3">
      <div class="max-w-5xl mx-auto">
        <div class="flex items-center gap-3 mb-1">
          <button type="button" (click)="voltar()"
            class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shrink-0">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <div>
            <h1 class="text-xl md:text-2xl font-bold text-white leading-tight">
              Prestação {{ codigo || '...' }}
            </h1>
            <p class="text-white/60 text-xs mt-0.5">Detalhes e despesas</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Conteúdo ── -->
    <div class="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 pb-6">
      <div class="max-w-5xl mx-auto space-y-4">

        <!-- Loading -->
        <div *ngIf="isLoading" class="bg-white rounded-xl shadow-lg flex flex-col items-center justify-center py-16 gap-3">
          <div class="w-10 h-10 border-4 border-[#75C9C8]/30 border-t-[#1A4E79] rounded-full animate-spin"></div>
          <p class="text-sm text-gray-400">Carregando despesas...</p>
        </div>

        <!-- Erro -->
        <div *ngIf="!isLoading && errorMsg" class="bg-white rounded-xl shadow-lg flex flex-col items-center justify-center py-16 gap-3 px-6 text-center">
          <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
          </div>
          <p class="text-sm font-semibold text-red-600">{{ errorMsg }}</p>
          <button type="button" (click)="carregar()" class="text-xs text-[#1A4E79] underline hover:no-underline">
            Tentar novamente
          </button>
        </div>

        <ng-container *ngIf="!isLoading && !errorMsg">

          <!-- ── Cabeçalho resumo ── -->
          <div class="bg-white rounded-xl shadow-lg overflow-hidden border-l-4 border-[#75C9C8]">
            <div class="px-4 py-3 border-b border-[#E6EEF2] bg-[#f8fdfd] flex items-center gap-2">
              <svg class="w-4 h-4 text-[#1A4E79]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0121 9.414V19a2 2 0 01-2 2z"/>
              </svg>
              <span class="text-sm font-semibold text-[#1A4E79]">Informações da Prestação</span>
            </div>
            <div class="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div class="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Código</div>
                <div class="text-sm font-bold text-[#1A4E79]">{{ codigo }}</div>
              </div>
              <div>
                <div class="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Status</div>
                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border {{ statusInfo.cls }}">
                  <span class="w-1.5 h-1.5 rounded-full {{ statusInfo.dot }}"></span>
                  {{ statusInfo.label }}
                </span>
              </div>
              <div>
                <div class="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Total de Despesas</div>
                <div class="text-sm font-bold text-[#1A4E79]">{{ rows.length }}</div>
              </div>
              <div>
                <div class="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Valor Total</div>
                <div class="text-sm font-bold text-[#1A4E79]">R$ {{ totalGeral | number:'1.2-2' }}</div>
              </div>
            </div>
          </div>

          <!-- ── Lista de despesas ── -->
          <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="px-4 py-3 border-b border-[#E6EEF2] bg-[#f8fdfd] flex items-center gap-2">
              <svg class="w-4 h-4 text-[#1A4E79]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"/>
              </svg>
              <span class="text-sm font-semibold text-[#1A4E79]">Despesas</span>
              <span class="ml-auto text-xs bg-[#1A4E79]/10 text-[#1A4E79] px-2 py-0.5 rounded-full font-semibold">
                {{ rows.length }} item{{ rows.length !== 1 ? 's' : '' }}
              </span>
            </div>

            <!-- Lista vazia -->
            <div *ngIf="rows.length === 0" class="flex flex-col items-center justify-center py-12 gap-2">
              <svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              <p class="text-sm text-gray-400">Nenhuma despesa nesta prestação</p>
            </div>

            <!-- Tabela -->
            <div *ngIf="rows.length > 0" class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-[#f8fdfd] border-b border-[#E6EEF2]">
                    <th class="px-3 py-2.5 text-left text-xs font-semibold text-[#1A4E79] uppercase tracking-wide w-12">Item</th>
                    <th class="px-3 py-2.5 text-left text-xs font-semibold text-[#1A4E79] uppercase tracking-wide">Data</th>
                    <th class="px-3 py-2.5 text-left text-xs font-semibold text-[#1A4E79] uppercase tracking-wide">Descrição</th>
                    <th class="px-3 py-2.5 text-left text-xs font-semibold text-[#1A4E79] uppercase tracking-wide hidden md:table-cell">C. Custo</th>
                    <th class="px-3 py-2.5 text-right text-xs font-semibold text-[#1A4E79] uppercase tracking-wide">Valor</th>
                    <th class="px-3 py-2.5 text-center text-xs font-semibold text-[#1A4E79] uppercase tracking-wide w-20">Anexos</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let d of rows" class="border-b border-[#E6EEF2] last:border-0 hover:bg-[#f0fafa] transition-colors">
                    <td class="px-3 py-3">
                      <span class="w-7 h-7 rounded-full bg-[#1A4E79]/10 text-[#1A4E79] text-xs font-bold flex items-center justify-center">
                        {{ d.item }}
                      </span>
                    </td>
                    <td class="px-3 py-3 text-gray-600 whitespace-nowrap">{{ d.data }}</td>
                    <td class="px-3 py-3">
                      <div class="font-semibold text-gray-800 text-xs">{{ d.despes }}</div>
                      <div *ngIf="d.descricao" class="text-gray-500 text-xs mt-0.5 truncate max-w-xs">{{ d.descricao }}</div>
                      <div *ngIf="d.obs" class="text-gray-400 text-[11px] mt-0.5 truncate max-w-xs italic">{{ d.obs }}</div>
                    </td>
                    <td class="px-3 py-3 text-gray-500 text-xs hidden md:table-cell">{{ d.cc || '—' }}</td>
                    <td class="px-3 py-3 text-right font-semibold text-gray-700 whitespace-nowrap">
                      R$ {{ d.total | number:'1.2-2' }}
                    </td>
                    <td class="px-3 py-3 text-center">
                      <span *ngIf="d.qtdAnexos > 0"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#75C9C8]/20 text-[#1A4E79]">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                        </svg>
                        {{ d.qtdAnexos }}
                      </span>
                      <span *ngIf="d.qtdAnexos === 0" class="text-gray-300 text-xs">—</span>
                    </td>
                  </tr>
                </tbody>
                <tfoot class="border-t-2 border-[#E6EEF2]">
                  <tr class="bg-[#f8fdfd]">
                    <td colspan="4" class="px-3 py-2.5 text-xs font-semibold text-[#1A4E79]">Total</td>
                    <td class="px-3 py-2.5 text-right text-sm font-bold text-[#1A4E79]">
                      R$ {{ totalGeral | number:'1.2-2' }}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </ng-container>
      </div>
    </div>
  </main>
  `
})
export class DetalhePrestacaoComponent implements OnInit {

  codigo    = '';
  status    = '';
  rows:     DespesaDetalheRow[] = [];
  isLoading = false;
  errorMsg  = '';

  constructor(
    private route:   ActivatedRoute,
    private router:  Router,
    private service: ConsultaPrestacaoService
  ) {}

  ngOnInit(): void {
    this.codigo = this.route.snapshot.paramMap.get('codigo') || '';
    this.carregar();
  }

  carregar(): void {
    if (!this.codigo) { this.errorMsg = 'Código não informado.'; return; }
    this.isLoading = true;
    this.errorMsg  = '';
    this.service.listarDespesas(this.codigo).subscribe({
      next: rows => {
        this.rows     = rows;
        this.isLoading = false;
      },
      error: e => {
        this.errorMsg  = e.message;
        this.isLoading = false;
      }
    });
  }

  voltar(): void {
    this.router.navigate(['/financeiro/minhas-prestacoes']);
  }

  get totalGeral(): number {
    return this.rows.reduce((s, r) => s + r.total, 0);
  }

  get statusInfo(): { label: string; cls: string; dot: string } {
    return STATUS_MAP[this.status] ?? { label: '—', cls: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
  }
}
