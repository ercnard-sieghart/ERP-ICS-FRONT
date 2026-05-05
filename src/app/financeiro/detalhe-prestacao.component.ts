import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ConsultaPrestacaoService, DespesaDetalheRow, DespesasResult } from './services/consulta-prestacao.service';
import { DespesaService, AnexoRow } from './services/despesa.service';

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
  selector: 'app-detalhe-prestacao',
  standalone: true,
  imports: [CommonModule],
  template: `
  <main class="h-full flex flex-col bg-gradient-to-br from-[#1A4E79] to-[#75C9C8] overflow-hidden">

    <!-- ── Cabeçalho da página ── -->
    <div class="flex-shrink-0 px-4 md:px-6 pt-4 md:pt-6 pb-3">
      <div class="max-w-5xl mx-auto">
        <div class="flex items-center">

          <!-- Espaçador ajustado -->
          <div class="w-14"></div>

          <!-- Título -->
          <div class="flex-1 text-center md:text-left">
            <h1 class="text-xl md:text-2xl font-bold text-white leading-tight">
              Prestação {{ codigo || '...' }}
            </h1>
            <p class="text-white/60 text-xs mt-0.5">
              Detalhes e despesas
            </p>
          </div>

          <!-- Botão -->
          <button
            type="button"
            (click)="voltar()"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                  bg-white/20 hover:bg-white/30 transition-colors shrink-0"
          >
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
            </svg>
            <span class="text-white text-xs font-medium">Voltar</span>
          </button>

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
              <div *ngIf="nomecf" class="col-span-2 md:col-span-4">
                <div class="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Cliente / Fornecedor</div>
                <div class="text-sm font-semibold text-gray-700">{{ nomecf }}</div>
              </div>
            </div>
          </div>

          <!-- ── Motivo de reprovação ── -->
          <div *ngIf="status === '5' && motvfl"
            class="bg-red-50 border border-red-200 rounded-xl shadow-sm overflow-hidden">
            <div class="px-4 py-3 bg-red-100 flex items-center gap-2 border-b border-red-200">
              <svg class="w-4 h-4 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="text-sm font-semibold text-red-700">Motivo da Reprovação</span>
            </div>
            <div class="px-4 py-3">
              <p class="text-sm text-red-800">{{ motvfl }}</p>
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
                      <div class="flex flex-col items-center gap-0.5">
                        <span class="w-7 h-7 rounded-full bg-[#1A4E79]/10 text-[#1A4E79] text-xs font-bold flex items-center justify-center">
                          {{ d.item }}
                        </span>
                        <span *ngIf="d.partic" class="text-[9px] text-gray-400 leading-tight text-center">{{ d.partic }}</span>
                      </div>
                    </td>
                    <td class="px-3 py-3 whitespace-nowrap">
                      <div class="text-gray-600">{{ formatDate(d.data) }}</div>
                      <div *ngIf="d.moeda" class="text-[10px] text-gray-400 mt-0.5">Moeda: {{ d.moeda }}</div>
                    </td>
                    <td class="px-3 py-3">
                      <div class="font-semibold text-gray-800 text-xs">{{ d.despes }}</div>
                      <div *ngIf="d.descricao" class="text-gray-500 text-xs mt-0.5 truncate max-w-xs">{{ d.descricao }}</div>
                      <div *ngIf="d.obs" class="text-gray-400 text-[11px] mt-0.5 truncate max-w-xs italic">{{ d.obs }}</div>
                      <div *ngIf="d.ec05db || d.ec06db || d.ec07db" class="flex flex-wrap gap-1 mt-1">
                        <span *ngIf="d.ec05db" class="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">EC5: {{ d.ec05db }}</span>
                        <span *ngIf="d.ec06db" class="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100">EC6: {{ d.ec06db }}</span>
                        <span *ngIf="d.ec07db" class="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">EC7: {{ d.ec07db }}</span>
                      </div>
                    </td>
                    <td class="px-3 py-3 text-xs hidden md:table-cell">
                      <div class="flex flex-col gap-0.5">
                        <div class="flex items-center gap-1">
                          <span class="text-[10px] text-gray-400 uppercase w-8 shrink-0">CC</span>
                          <span class="text-gray-600">{{ d.cc || '—' }}</span>
                        </div>
                        <div *ngIf="d.conta" class="flex items-center gap-1">
                          <span class="text-[10px] text-gray-400 uppercase w-8 shrink-0">Cta</span>
                          <span class="text-gray-600">{{ d.conta }}</span>
                        </div>
                        <div *ngIf="d.itectb" class="flex items-center gap-1">
                          <span class="text-[10px] text-gray-400 uppercase w-8 shrink-0">Itm</span>
                          <span class="text-gray-600">{{ d.itectb }}</span>
                        </div>
                        <div *ngIf="d.clvl" class="flex items-center gap-1">
                          <span class="text-[10px] text-gray-400 uppercase w-8 shrink-0">CVl</span>
                          <span class="text-gray-600">{{ d.clvl }}</span>
                        </div>
                        <div *ngIf="d.grupo" class="flex items-center gap-1">
                          <span class="text-[10px] text-gray-400 uppercase w-8 shrink-0">Grp</span>
                          <span class="text-gray-600">{{ d.grupo }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="px-3 py-3 text-right font-semibold text-gray-700 whitespace-nowrap">
                      R$ {{ d.total | number:'1.2-2' }}
                    </td>
                    <td class="px-3 py-3 text-center">
                      <button *ngIf="d.qtdAnexos > 0" type="button"
                        (click)="verAnexos(d)"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#75C9C8]/20 text-[#1A4E79] hover:bg-[#75C9C8]/40 transition-colors cursor-pointer">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                        </svg>
                        {{ d.qtdAnexos }}
                      </button>
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

    <!-- ── Modal de Anexos ── -->
    <div *ngIf="modalAnexos"
      class="fixed inset-0 bg-[#1A4E79]/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
      (click)="fecharModalAnexos()">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" (click)="$event.stopPropagation()">
        <div class="bg-gradient-to-r from-[#1A4E79] to-[#75C9C8] px-5 py-4 flex items-center justify-between">
          <span class="text-white font-semibold text-sm">Anexos — Item {{ anexosItem }}</span>
          <button type="button" (click)="fecharModalAnexos()"
            class="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="p-4 max-h-80 overflow-y-auto">
          <div *ngIf="loadingAnexos" class="flex justify-center py-8">
            <div class="w-8 h-8 border-4 border-[#75C9C8]/30 border-t-[#1A4E79] rounded-full animate-spin"></div>
          </div>
          <div *ngIf="!loadingAnexos && anexosRows.length === 0"
            class="text-center py-8 text-gray-400 text-sm">Nenhum anexo encontrado.</div>
          <div *ngIf="!loadingAnexos && anexosRows.length > 0" class="space-y-2">
            <div *ngFor="let a of anexosRows"
              (click)="abrirAnexo(a)"
              class="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-[#f0fafa] transition-colors cursor-pointer">
              <div class="w-8 h-8 rounded-lg bg-[#1A4E79]/10 flex items-center justify-center shrink-0">
                <svg class="w-4 h-4 text-[#1A4E79]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0121 9.414V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-800 break-all">{{ a.nome }}</p>
                <p *ngIf="a.descricao" class="text-xs text-gray-500 mt-0.5">{{ a.descricao }}</p>
              </div>
              <div class="shrink-0">
                <div *ngIf="abrindoAnexo === a.binId"
                  class="w-5 h-5 border-2 border-[#75C9C8]/30 border-t-[#1A4E79] rounded-full animate-spin"></div>
                <svg *ngIf="abrindoAnexo !== a.binId" class="w-4 h-4 text-[#75C9C8]"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- ── Modal Preview Anexo ── -->
    <div *ngIf="previewUrl"
      class="fixed inset-0 bg-black/85 z-[60] flex flex-col"
      (click)="fecharPreview()">
      <div class="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-[#1A4E79]"
        (click)="$event.stopPropagation()">
        <span class="text-white text-sm font-semibold truncate max-w-xs">{{ previewNome }}</span>
        <div class="flex items-center gap-2 shrink-0">
          <button type="button" (click)="downloadPreview()"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Baixar
          </button>
          <button type="button" (click)="fecharPreview()"
            class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="flex-1 min-h-0 overflow-auto" (click)="$event.stopPropagation()">
        <iframe *ngIf="previewTipo === 'application/pdf'" [src]="previewUrl"
          class="w-full h-full border-0"></iframe>
        <div *ngIf="previewTipo.startsWith('image/')"
          class="flex items-center justify-center w-full h-full p-4">
          <img [src]="previewUrl" class="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
        </div>
      </div>
    </div>

  </main>
  `
})
export class DetalhePrestacaoComponent implements OnInit {

  codigo        = '';
  status        = '';
  nomecf        = '';
  motvfl        = '';
  rows:         DespesaDetalheRow[] = [];
  isLoading     = false;
  errorMsg      = '';
  modalAnexos   = false;
  anexosItem    = 0;
  anexosRows:   AnexoRow[] = [];
  loadingAnexos = false;
  abrindoAnexo         = '';
  previewUrl:          SafeResourceUrl | null = null;
  previewNome          = '';
  previewTipo          = '';
  private _previewBlobUrl = '';

  constructor(
    private route:          ActivatedRoute,
    private router:         Router,
    private service:        ConsultaPrestacaoService,
    private despesaService: DespesaService,
    private sanitizer:      DomSanitizer
  ) {}

  ngOnInit(): void {
    this.codigo = this.route.snapshot.paramMap.get('codigo') || '';
    this.status = this.route.snapshot.queryParamMap.get('status') || '';
    this.carregar();
  }

  carregar(): void {
    if (!this.codigo) { this.errorMsg = 'Código não informado.'; return; }
    this.isLoading = true;
    this.errorMsg  = '';
    this.service.listarDespesas(this.codigo).subscribe({
      next: (result: DespesasResult) => {
        this.rows      = result.rows;
        this.nomecf    = result.nomecf;
        this.motvfl    = result.motvfl;
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

  verAnexos(d: DespesaDetalheRow): void {
    this.anexosItem    = d.item;
    this.anexosRows    = [];
    this.modalAnexos   = true;
    this.loadingAnexos = true;
    this.despesaService.listarAnexos(this.codigo, d.item).subscribe({
      next: rows => { this.anexosRows = rows; this.loadingAnexos = false; },
      error: ()   => { this.loadingAnexos = false; }
    });
  }

  fecharModalAnexos(): void {
    this.modalAnexos = false;
    this.anexosRows  = [];
  }

  abrirAnexo(a: AnexoRow): void {
    if (this.abrindoAnexo) return;
    this.abrindoAnexo = a.binId;
    this.despesaService.baixarAnexo(a.binId).subscribe({
      next: ({ base64, nome, tipo }) => {
        try {
          const bin   = atob(base64.replace(/[\s\r\n]/g, ''));
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          const blob  = new Blob([bytes], { type: tipo });
          const url   = URL.createObjectURL(blob);
          const viewable = tipo.startsWith('image/') || tipo === 'application/pdf';
          if (viewable) {
            this._previewBlobUrl = url;
            this.previewUrl  = this.sanitizer.bypassSecurityTrustResourceUrl(url);
            this.previewNome = nome;
            this.previewTipo = tipo;
          } else {
            const link    = document.createElement('a');
            link.href     = url;
            link.download = nome;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 5000);
          }
        } catch { /* ignore */ }
        this.abrindoAnexo = '';
      },
      error: () => { this.abrindoAnexo = ''; }
    });
  }

  fecharPreview(): void {
    this.previewUrl  = null;
    this.previewNome = '';
    this.previewTipo = '';
    if (this._previewBlobUrl) {
      URL.revokeObjectURL(this._previewBlobUrl);
      this._previewBlobUrl = '';
    }
  }

  downloadPreview(): void {
    if (!this._previewBlobUrl || !this.previewNome) return;
    const link    = document.createElement('a');
    link.href     = this._previewBlobUrl;
    link.download = this.previewNome;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  formatDate(d: string): string {
    if (!d) return '—';
    const s = d.replace(/\D/g, '');
    if (s.length === 8) return `${s.slice(6)}/${s.slice(4, 6)}/${s.slice(0, 4)}`;
    return d || '—';
  }

  get totalGeral(): number {
    return this.rows.reduce((s, r) => s + r.total, 0);
  }

  get statusInfo(): { label: string; cls: string; dot: string } {
    return STATUS_MAP[this.status] ?? { label: '—', cls: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
  }
}
