import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  PrestacaoContasService,
  ParticipanteResult,
  ClienteResult,
  ItemContabilResult,
  CentroCustoResult,
  ClasseValorResult
} from './services/prestacao-contas.service';
import {
  DespesaService,
  DespesaRow,
  FLGResult,
  ContaContabilResult,
  GrupoResult,
  DestinacaoResult,
  TipoRecursoResult,
  TipoExecucaoResult
} from './services/despesa.service';

// ── Shared CSS constants ─────────────────────────────────────────────────────
const CI = 'flex-1 min-w-0 p-3 border border-[#75C9C8]/30 rounded-l-lg focus:outline-none transition-all';
const CB = 'shrink-0 px-2.5 border border-l-0 border-[#75C9C8]/30 rounded-r-lg bg-white hover:bg-[#e6eef0] text-[#1A4E79] flex items-center justify-center';
const CW = 'relative flex focus-within:ring-2 focus-within:ring-[#75C9C8] rounded-lg shadow-sm';
const DD = 'absolute z-20 top-full w-full bg-white border border-[#75C9C8]/30 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto';
const DI = 'px-3 py-2 hover:bg-[#e6eef0] cursor-pointer text-sm border-b border-gray-100 last:border-0 flex gap-2';

@Component({
  selector: 'app-prestacao-contas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [PrestacaoContasService],
  template: `
  <!-- Loading overlay -->
  <div *ngIf="isFinalizando"
    class="fixed inset-0 bg-[#1A4E79]/70 backdrop-blur-sm z-[9999] flex items-center justify-center">
    <div class="bg-white rounded-xl p-6 shadow-2xl text-center min-w-[160px]">
      <div class="w-10 h-10 border-4 border-[#75C9C8]/30 border-t-[#1A4E79] rounded-full mx-auto mb-3 animate-spin"></div>
      <p class="text-sm font-semibold text-[#1A4E79]">Finalizando...</p>
    </div>
  </div>

  <!-- Modal de confirmação genérico -->
  <div *ngIf="confirmModal"
    class="fixed inset-0 bg-[#1A4E79]/60 backdrop-blur-sm z-[10001] flex items-center justify-center px-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
      <!-- cabeçalho -->
      <div [ngClass]="confirmModal.danger ? 'from-red-600 to-red-400' : 'from-[#1A4E79] to-[#75C9C8]'"
        class="bg-gradient-to-r px-5 py-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <svg *ngIf="!confirmModal.danger" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <svg *ngIf="confirmModal.danger" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </div>
          <p class="text-white font-semibold text-sm">{{ confirmModal.title }}</p>
        </div>
      </div>
      <!-- corpo -->
      <div class="px-5 py-5 space-y-4">
        <div *ngIf="confirmModal.detail"
          class="text-center bg-[#f8fdfd] rounded-xl py-4 border border-[#75C9C8]/20">
          <p class="text-xs text-gray-400 uppercase tracking-wide mb-1">{{ confirmModal.detailLabel }}</p>
          <p class="text-3xl font-bold text-[#1A4E79]">{{ confirmModal.detail }}</p>
          <p *ngIf="confirmModal.detailSub" class="text-xs text-gray-400 mt-1">{{ confirmModal.detailSub }}</p>
        </div>
        <p class="text-sm text-gray-600 text-center">{{ confirmModal.body }}</p>
      </div>
      <!-- botões -->
      <div class="flex gap-3 px-5 pb-5">
        <button type="button" (click)="fecharConfirmModal()"
          class="flex-1 py-2.5 text-sm border border-[#1A4E79]/30 text-[#1A4E79] rounded-xl hover:bg-[#e6eef0] transition-all font-semibold">
          Cancelar
        </button>
        <button type="button" (click)="executarConfirmModal()"
          [ngClass]="confirmModal.danger
            ? 'bg-gradient-to-r from-red-600 to-red-400'
            : 'bg-gradient-to-r from-[#1A4E79] to-[#75C9C8]'"
          class="flex-1 py-2.5 text-sm text-white rounded-xl hover:opacity-90 transition-all font-semibold shadow-sm">
          {{ confirmModal.confirmLabel }}
        </button>
      </div>
    </div>
  </div>

  <!-- Toast notification -->
  <div *ngIf="toast"
    class="fixed top-5 right-5 z-[10000] max-w-sm w-full shadow-2xl rounded-xl overflow-hidden transition-all"
    [ngClass]="{
      'bg-red-600':    toast.type === 'error',
      'bg-[#1A4E79]': toast.type === 'success',
      'bg-amber-500': toast.type === 'warning'
    }">
    <div class="flex items-start gap-3 px-4 py-3">
      <!-- ícone -->
      <svg *ngIf="toast.type === 'error'" class="w-5 h-5 text-white shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      </svg>
      <svg *ngIf="toast.type === 'success'" class="w-5 h-5 text-white shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
      </svg>
      <svg *ngIf="toast.type === 'warning'" class="w-5 h-5 text-white shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z"/>
      </svg>
      <!-- mensagem -->
      <p class="text-sm text-white leading-snug flex-1 whitespace-pre-line">{{ toast.message }}</p>
      <!-- fechar -->
      <button type="button" (click)="closeToast()"
        class="shrink-0 text-white/70 hover:text-white transition-colors ml-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>

  <main class="h-full flex flex-col bg-gradient-to-br from-[#1A4E79] to-[#75C9C8] overflow-hidden">

    <!-- ── Cabeçalho fixo da página ── -->
    <div class="flex-shrink-0 px-4 md:px-6 pt-4 md:pt-6 pb-3">
      <div class="max-w-5xl mx-auto">
        <h1 class="text-xl md:text-2xl font-bold text-white mb-3 text-center md:text-left">Prestação de Contas</h1>
        <!-- Step indicator -->
        <div class="flex items-center gap-2">
          <div [ngClass]="!headerSaved ? 'bg-white text-[#1A4E79]' : 'bg-white/20 text-white'"
            class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all">
            <span [ngClass]="headerSaved ? 'bg-[#75C9C8]' : 'bg-[#1A4E79]'"
              class="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold leading-none text-white">
              {{ headerSaved ? '✓' : '1' }}
            </span>
            Cabeçalho
          </div>
          <svg class="w-3 h-3 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
          </svg>
          <div [ngClass]="headerSaved ? 'bg-white text-[#1A4E79]' : 'bg-white/20 text-white/60'"
            class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all">
            <span [ngClass]="headerSaved ? 'bg-[#1A4E79] text-white' : 'bg-white/30 text-white/50'"
              class="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold leading-none">2</span>
            Despesas
          </div>
        </div>
      </div>
    </div>

    <!-- ── Conteúdo scrollável ── -->
    <div class="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 pb-4 md:pb-6">
      <div class="max-w-5xl mx-auto space-y-4">

        <!-- ══════════════ CABEÇALHO SALVO — resumo compacto ══════════════ -->
        <div *ngIf="headerSaved" class="bg-white rounded-xl shadow-lg overflow-hidden border-l-4 border-[#75C9C8]">
          <div class="flex items-center gap-4 p-4">
            <div class="w-10 h-10 bg-[#75C9C8]/10 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-[#75C9C8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-1">
              <div>
                <div class="text-[10px] text-gray-400 uppercase tracking-wide">Código</div>
                <div class="text-sm font-bold text-[#1A4E79]">{{ model.flf_presta }}</div>
              </div>
              <div class="min-w-0">
                <div class="text-[10px] text-gray-400 uppercase tracking-wide">Participante</div>
                <div class="text-sm font-semibold text-[#1A4E79] truncate">{{ model.nomeParticipante || model.codParticipante }}</div>
              </div>
              <div>
                <div class="text-[10px] text-gray-400 uppercase tracking-wide">Emissão</div>
                <div class="text-sm text-gray-700">{{ model.flf_emissa }}</div>
              </div>
              <div>
                <div class="text-[10px] text-gray-400 uppercase tracking-wide">Gasto Nacional</div>
                <div class="text-sm text-gray-700">{{ model.flf_nacion === 'S' ? 'Sim' : 'Não' }}</div>
              </div>
              <div class="min-w-0">
                <div class="text-[10px] text-gray-400 uppercase tracking-wide">Motivo</div>
                <div class="text-sm text-gray-700 truncate">{{ model.motivo || '—' }}</div>
              </div>
            </div>
            <div class="flex gap-2 flex-shrink-0">
              <button type="button" (click)="novaPrestacao()"
                class="px-3 py-1.5 text-xs bg-gradient-to-r from-[#1A4E79] to-[#75C9C8] text-white rounded-lg hover:opacity-90 transition-all font-semibold">
                Nova Prestação
              </button>
            </div>
          </div>
        </div>

        <!-- ══════════════ CABEÇALHO — formulário completo ══════════════ -->
        <div *ngIf="!headerSaved" class="bg-white rounded-xl shadow-lg overflow-hidden">
          <!-- Card header -->
          <div class="flex items-center gap-3 px-4 py-3 border-b border-[#E6EEF2] bg-[#f8fdfd]">
            <i class="po-icon po-icon-finance text-[#1A4E79] text-lg"></i>
            <div>
              <div class="text-sm font-semibold text-[#1A4E79]">Dados da Prestação</div>
              <div class="text-xs text-gray-400">Preencha os campos obrigatórios (*)</div>
            </div>
            <span class="ml-auto text-xs bg-[#1A4E79]/10 text-[#1A4E79] px-2 py-1 rounded italic">
              Código gerado ao finalizar
            </span>
          </div>

          <form #prestacaoForm="ngForm" class="p-4 md:p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

              <!-- ── Participante ── -->
              <div>
                <label class="block text-xs font-semibold text-[#1A4E79] mb-1.5 uppercase tracking-wide">Participante *</label>
                <div class="${CW}">
                  <input type="text" name="codParticipante" [(ngModel)]="model.codParticipante" required
                    autocomplete="off" placeholder="Código ou nome..."
                    (ngModelChange)="onParticipanteInput($event)" (blur)="fecharParticipanteDropdown()"
                    class="${CI}" />
                  <button type="button" (mousedown)="toggleParticipanteDropdown($event)" class="${CB}">
                    <svg *ngIf="!isLoadingParticipante" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                    <svg *ngIf="isLoadingParticipante" class="animate-spin h-4 w-4 text-[#75C9C8]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                  </button>
                  <div *ngIf="showParticipanteDropdown && participanteResults.length > 0" class="${DD}">
                    <div *ngFor="let r of participanteResults" (mousedown)="selecionarParticipante(r)" class="${DI}">
                      <span class="font-semibold text-[#1A4E79] shrink-0">{{ r.codigo }}</span>
                      <span class="text-gray-500 truncate">{{ r.nome }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Nome do Participante</label>
                <input type="text" [value]="model.nomeParticipante" readonly placeholder="Preenchido ao selecionar"
                  class="w-full p-3 bg-gray-50 border border-[#e6eef0] rounded-lg text-sm text-gray-600" />
              </div>

              <!-- ── Datas ── -->
              <div>
                <label class="block text-xs font-semibold text-[#1A4E79] mb-1.5 uppercase tracking-wide">Data de Emissão *</label>
                <input type="date" name="flf_emissa" [(ngModel)]="model.flf_emissa" required
                  class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all text-sm" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-[#1A4E79] mb-1.5 uppercase tracking-wide">Saída *</label>
                  <input type="date" name="flf_dtini" [(ngModel)]="model.flf_dtini" required
                    class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#1A4E79] mb-1.5 uppercase tracking-wide">Chegada *</label>
                  <input type="date" name="flf_dtfim" [(ngModel)]="model.flf_dtfim" required
                    class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all text-sm" />
                </div>
              </div>

              <!-- ── Gasto Nacional ── -->
              <div class="md:col-span-2">
                <label class="block text-xs font-semibold text-[#1A4E79] mb-1.5 uppercase tracking-wide">Gasto Nacional *</label>
                <div class="flex rounded-lg border border-[#75C9C8]/30 overflow-hidden w-fit shadow-sm">
                  <label class="flex items-center justify-center px-6 py-2.5 cursor-pointer text-sm transition-all"
                    [ngClass]="model.flf_nacion === 'S' ? 'bg-[#1A4E79] text-white font-semibold' : 'bg-white text-gray-600 hover:bg-[#f0f9f9]'">
                    <input type="radio" name="flf_nacion" [(ngModel)]="model.flf_nacion" value="S" class="sr-only" required />
                    Sim
                  </label>
                  <label class="flex items-center justify-center px-6 py-2.5 cursor-pointer text-sm border-l border-[#75C9C8]/30 transition-all"
                    [ngClass]="model.flf_nacion === 'N' ? 'bg-[#1A4E79] text-white font-semibold' : 'bg-white text-gray-600 hover:bg-[#f0f9f9]'">
                    <input type="radio" name="flf_nacion" [(ngModel)]="model.flf_nacion" value="N" class="sr-only" required />
                    Não
                  </label>
                </div>
              </div>

              <!-- ── Item Contábil ── -->
              <div>
                <label class="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Item Contábil</label>
                <div class="${CW}">
                  <input type="text" name="itemContabilSearch" [(ngModel)]="model.itemContabilSearch"
                    autocomplete="off" placeholder="Código ou descrição..."
                    (ngModelChange)="onItemContabilInput($event)" (blur)="fecharItemContabilDropdown()"
                    class="${CI}" />
                  <button type="button" (mousedown)="toggleItemContabilDropdown($event)" class="${CB}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                  </button>
                  <div *ngIf="showItemContabilDropdown && itemContabilFiltered.length > 0" class="${DD}">
                    <div *ngFor="let it of itemContabilFiltered" (mousedown)="selecionarItemContabil(it)" class="${DI}">
                      <span class="font-semibold text-[#1A4E79] shrink-0">{{ it.codigo }}</span>
                      <span class="text-gray-500 truncate">{{ it.descricao }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ── Centro de Custo ── -->
              <div>
                <label class="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Centro de Custo</label>
                <div class="${CW}">
                  <input type="text" name="centroCustoSearch" [(ngModel)]="model.centroCustoSearch"
                    autocomplete="off" placeholder="Código ou descrição..."
                    (ngModelChange)="onCentroCustoInput($event)" (blur)="fecharCentroCustoDropdown()"
                    class="${CI}" />
                  <button type="button" (mousedown)="toggleCentroCustoDropdown($event)" class="${CB}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                  </button>
                  <div *ngIf="showCentroCustoDropdown && centroCustoFiltered.length > 0" class="${DD}">
                    <div *ngFor="let cc of centroCustoFiltered" (mousedown)="selecionarCentroCusto(cc)" class="${DI}">
                      <span class="font-semibold text-[#1A4E79] shrink-0">{{ cc.codigo }}</span>
                      <span class="text-gray-500 truncate">{{ cc.descricao }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ── Classe Valor ── -->
              <div>
                <label class="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Classe Valor</label>
                <div class="${CW}">
                  <input type="text" name="classeValorSearch" [(ngModel)]="model.classeValorSearch"
                    autocomplete="off" placeholder="Código ou descrição..."
                    (ngModelChange)="onClasseValorInput($event)" (blur)="fecharClasseValorDropdown()"
                    class="${CI}" />
                  <button type="button" (mousedown)="toggleClasseValorDropdown($event)" class="${CB}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                  </button>
                  <div *ngIf="showClasseValorDropdown && classeValorFiltered.length > 0" class="${DD}">
                    <div *ngFor="let cv of classeValorFiltered" (mousedown)="selecionarClasseValor(cv)" class="${DI}">
                      <span class="font-semibold text-[#1A4E79] shrink-0">{{ cv.codigo }}</span>
                      <span class="text-gray-500 truncate">{{ cv.descricao }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ── Motivo ── -->
              <div>
                <label class="block text-xs font-semibold text-[#1A4E79] mb-1.5 uppercase tracking-wide">
                  Motivo * <span class="normal-case font-normal text-gray-300">({{ (model.motivo || '').length }}/80)</span>
                </label>
                <textarea name="motivo" [(ngModel)]="model.motivo" maxlength="80" rows="3" required
                  placeholder="Descreva o motivo da prestação..."
                  class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all text-sm resize-none"></textarea>
              </div>

              <!-- ── Percentuais ── -->
              <div class="md:col-span-2">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">% Cliente</label>
                    <input type="number" name="flf_fatcli" [(ngModel)]="model.flf_fatcli" min="0" max="100"
                      [ngClass]="{'border-red-400': percentuaisInvalidos}"
                      class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">% Empresa</label>
                    <input type="number" name="flf_fatemp" [(ngModel)]="model.flf_fatemp" min="0" max="100"
                      [ngClass]="{'border-red-400': percentuaisInvalidos}"
                      class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all text-sm" />
                  </div>
                </div>
                <p *ngIf="percentuaisInvalidos" class="text-red-500 text-xs mt-1">
                  % Cliente + % Empresa devem somar 100% (atual: {{ somaPercentuais }}%)
                </p>
              </div>

              <!-- ── Cliente / Fornecedor ── -->
              <div>
                <label class="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Cliente / Fornecedor</label>
                <div class="${CW}">
                  <input type="text" name="flf_clifor" [(ngModel)]="model.flf_clifor"
                    autocomplete="off" placeholder="Código ou nome..."
                    (ngModelChange)="onClienteInput($event)" (blur)="fecharClienteDropdown()"
                    class="${CI}" />
                  <button type="button" (mousedown)="toggleClienteDropdown($event)" class="${CB}">
                    <svg *ngIf="!isLoadingCliente" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                    <svg *ngIf="isLoadingCliente" class="animate-spin h-4 w-4 text-[#75C9C8]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                  </button>
                  <div *ngIf="showClienteDropdown && clienteResults.length > 0" class="${DD}">
                    <div *ngFor="let r of clienteResults" (mousedown)="selecionarCliente(r)" class="${DI}">
                      <span class="font-semibold text-[#1A4E79] shrink-0">{{ r.codigo }}/{{ r.loja }}</span>
                      <span class="text-gray-500 truncate">{{ r.nome }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Loja</label>
                  <input type="text" [value]="model.flf_floja" readonly placeholder="Auto"
                    class="w-full p-3 bg-gray-50 border border-[#e6eef0] rounded-lg text-sm text-gray-600" />
                </div>
                <div *ngIf="model.nomeCliente">
                  <label class="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Nome</label>
                  <input type="text" [value]="model.nomeCliente" readonly
                    class="w-full p-3 bg-gray-50 border border-[#e6eef0] rounded-lg text-sm text-gray-600 truncate" />
                </div>
              </div>

            </div>

            <!-- Barra de ações -->
            <div class="flex justify-between items-center pt-4 mt-4 border-t border-[#E6EEF2]">
              <button type="button" (click)="salvar()" [disabled]="isSaving || percentuaisInvalidos"
                class="px-5 py-2 text-sm bg-gradient-to-r from-[#1A4E79] to-[#75C9C8] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all font-semibold shadow-sm">
                {{ isSaving ? 'Salvando...' : 'Salvar Cabeçalho' }}
              </button>
            </div>
          </form>
        </div>

        <!-- ══════════════ DESPESAS ══════════════ -->
        <div class="bg-white rounded-xl shadow-lg overflow-hidden"
          [class.opacity-50]="!headerSaved" [class.pointer-events-none]="!headerSaved">

          <!-- Card header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-[#E6EEF2] bg-[#f8fdfd]">
            <div class="flex items-center gap-2">
              <i class="po-icon po-icon-list text-[#1A4E79]"></i>
              <span class="text-sm font-semibold text-[#1A4E79]">Despesas</span>
              <span *ngIf="despesas.length > 0"
                class="text-xs bg-[#1A4E79]/10 text-[#1A4E79] px-2 py-0.5 rounded-full font-semibold">{{ despesas.length }}</span>
              <span *ngIf="!headerSaved" class="text-xs text-gray-400">(Salve o cabeçalho primeiro)</span>
            </div>
            <div class="flex items-center gap-3">
              <span *ngIf="despesas.length > 0" class="text-sm text-gray-600">
                Total: <strong class="text-[#1A4E79]">R$ {{ totalDespesas | number:'1.2-2' }}</strong>
              </span>
              <button type="button" (click)="abrirNovaDespesa()" [disabled]="!headerSaved || showNovaDespesa"
                class="flex items-center gap-1.5 bg-gradient-to-r from-[#1A4E79] to-[#75C9C8] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                Despesa
              </button>
            </div>
          </div>

          <div class="p-4">

            <!-- ── Formulário nova despesa ── -->
            <div *ngIf="showNovaDespesa" class="mb-4 p-4 bg-[#f8fdfd] rounded-xl border border-[#75C9C8]/20">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-1 h-4 bg-[#75C9C8] rounded-full"></div>
                <h5 class="text-sm font-semibold text-[#1A4E79]">Nova Despesa</h5>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">

                <!-- Data -->
                <div>
                  <label class="block text-xs font-semibold text-[#1A4E79] mb-1 uppercase tracking-wide">Data *</label>
                  <input type="date" [(ngModel)]="nd.data"
                    class="w-full p-2 text-sm border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all" />
                </div>

                <!-- Local (UF) -->
                <div>
                  <label class="block text-xs font-semibold text-[#1A4E79] mb-1 uppercase tracking-wide">Local *</label>
                  <select [(ngModel)]="nd.local"
                    class="w-full p-2 text-sm border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all bg-white">
                    <option value="">Selecione o estado...</option>
                    <option *ngFor="let uf of UF_ESTADOS" [value]="uf.sigla">{{ uf.sigla }} — {{ uf.nome }}</option>
                  </select>
                </div>

                <!-- Despesa (FLG) -->
                <div>
                  <label class="block text-xs font-semibold text-[#1A4E79] mb-1 uppercase tracking-wide">Despesa *</label>
                  <div class="${CW}">
                    <input type="text" [(ngModel)]="nd.flgSearch" autocomplete="off" placeholder="Código ou descrição..."
                      (ngModelChange)="onNdFLGInput($event)" (blur)="fecharNdFLGDropdown()"
                      class="flex-1 min-w-0 p-2 text-sm border border-[#75C9C8]/30 rounded-l-lg focus:outline-none transition-all" />
                    <button type="button" (mousedown)="toggleNdFLGDropdown($event)" class="${CB}">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                    </button>
                    <div *ngIf="ndShowFLGDropdown && ndFLGFiltered.length > 0" class="${DD}">
                      <div *ngFor="let f of ndFLGFiltered" (mousedown)="selecionarNdFLG(f)" class="${DI}">
                        <span class="font-semibold text-[#1A4E79] shrink-0">{{ f.codigo }}</span>
                        <span class="text-gray-500 truncate">{{ f.descricao }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Descrição (auto-fill, readonly) -->
                <div class="md:col-span-2">
                  <label class="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Descrição</label>
                  <input type="text" [value]="nd.descri" readonly placeholder="Preenchida ao selecionar despesa..."
                    class="w-full p-2 text-sm bg-gray-50 border border-[#e6eef0] rounded-lg text-gray-600" />
                </div>

                <!-- Quantidade -->
                <div>
                  <label class="block text-xs font-semibold text-[#1A4E79] mb-1 uppercase tracking-wide">Quantidade</label>
                  <input type="number" [(ngModel)]="nd.quant" min="1" step="1"
                    class="w-full p-2 text-sm border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all" />
                </div>

                <!-- Valor Total -->
                <div>
                  <label class="block text-xs font-semibold text-[#1A4E79] mb-1 uppercase tracking-wide">Valor Total *</label>
                  <input type="number" [(ngModel)]="nd.total" min="0.01" step="0.01"
                    class="w-full p-2 text-sm border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all" />
                </div>

                <!-- Conta Contábil -->
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Conta Contábil</label>
                  <div class="${CW}">
                    <input type="text" [(ngModel)]="nd.contaSearch" autocomplete="off" placeholder="Buscar conta..."
                      (ngModelChange)="onNdContaInput($event)" (blur)="fecharNdContaDropdown()"
                      class="flex-1 min-w-0 p-2 text-sm border border-[#75C9C8]/30 rounded-l-lg focus:outline-none transition-all" />
                    <button type="button" (mousedown)="toggleNdContaDropdown($event)" class="${CB}">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                    </button>
                    <div *ngIf="ndShowContaDropdown && ndContaFiltered.length > 0" class="${DD}">
                      <div *ngFor="let c of ndContaFiltered" (mousedown)="selecionarNdConta(c)" class="${DI}">
                        <span class="font-semibold text-[#1A4E79] shrink-0">{{ c.codigo }}</span>
                        <span class="text-gray-500 truncate">{{ c.descricao }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- C. Custo (auto-fill, obrigatório) -->
                <div>
                  <label class="block text-xs font-semibold text-[#1A4E79] mb-1 uppercase tracking-wide">C. Custo *</label>
                  <div class="${CW}">
                    <input type="text" [(ngModel)]="nd.ccSearch" autocomplete="off" placeholder="Auto / buscar CC..."
                      (ngModelChange)="onNdCCInput($event)" (blur)="fecharNdCCDropdown()"
                      class="flex-1 min-w-0 p-2 text-sm border border-[#75C9C8]/30 rounded-l-lg focus:outline-none transition-all" />
                    <button type="button" (mousedown)="toggleNdCCDropdown($event)" class="${CB}">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                    </button>
                    <div *ngIf="ndShowCCDropdown && ndCCFiltered.length > 0" class="${DD}">
                      <div *ngFor="let cc of ndCCFiltered" (mousedown)="selecionarNdCC(cc)" class="${DI}">
                        <span class="font-semibold text-[#1A4E79] shrink-0">{{ cc.codigo }}</span>
                        <span class="text-gray-500 truncate">{{ cc.descricao }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Item Contábil (auto-fill) -->
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Item Contábil</label>
                  <div class="${CW}">
                    <input type="text" [(ngModel)]="nd.itemCtbSearch" autocomplete="off" placeholder="Auto / buscar item..."
                      (ngModelChange)="onNdItemCtbInput($event)" (blur)="fecharNdItemCtbDropdown()"
                      class="flex-1 min-w-0 p-2 text-sm border border-[#75C9C8]/30 rounded-l-lg focus:outline-none transition-all" />
                    <button type="button" (mousedown)="toggleNdItemCtbDropdown($event)" class="${CB}">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                    </button>
                    <div *ngIf="ndShowItemCtbDropdown && ndItemCtbFiltered.length > 0" class="${DD}">
                      <div *ngFor="let it of ndItemCtbFiltered" (mousedown)="selecionarNdItemCtb(it)" class="${DI}">
                        <span class="font-semibold text-[#1A4E79] shrink-0">{{ it.codigo }}</span>
                        <span class="text-gray-500 truncate">{{ it.descricao }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Classe Valor (auto-fill) -->
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Classe Valor</label>
                  <div class="${CW}">
                    <input type="text" [(ngModel)]="nd.clVlSearch" autocomplete="off" placeholder="Auto / buscar classe..."
                      (ngModelChange)="onNdClVlInput($event)" (blur)="fecharNdClVlDropdown()"
                      class="flex-1 min-w-0 p-2 text-sm border border-[#75C9C8]/30 rounded-l-lg focus:outline-none transition-all" />
                    <button type="button" (mousedown)="toggleNdClVlDropdown($event)" class="${CB}">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                    </button>
                    <div *ngIf="ndShowClVlDropdown && ndClVlFiltered.length > 0" class="${DD}">
                      <div *ngFor="let cv of ndClVlFiltered" (mousedown)="selecionarNdClVl(cv)" class="${DI}">
                        <span class="font-semibold text-[#1A4E79] shrink-0">{{ cv.codigo }}</span>
                        <span class="text-gray-500 truncate">{{ cv.descricao }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Grupo (FLK) -->
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Grupo</label>
                  <div class="${CW}">
                    <input type="text" [(ngModel)]="nd.grupoSearch" autocomplete="off" placeholder="Buscar grupo..."
                      (ngModelChange)="onNdGrupoInput($event)" (blur)="fecharNdGrupoDropdown()"
                      class="flex-1 min-w-0 p-2 text-sm border border-[#75C9C8]/30 rounded-l-lg focus:outline-none transition-all" />
                    <button type="button" (mousedown)="toggleNdGrupoDropdown($event)" class="${CB}">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                    </button>
                    <div *ngIf="ndShowGrupoDropdown && ndGrupoFiltered.length > 0" class="${DD}">
                      <div *ngFor="let g of ndGrupoFiltered" (mousedown)="selecionarNdGrupo(g)" class="${DI}">
                        <span class="font-semibold text-[#1A4E79] shrink-0">{{ g.codigo }}</span>
                        <span class="text-gray-500 truncate">{{ g.descricao }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Destinação (AMF) -->
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Destinação</label>
                  <div class="${CW}">
                    <input type="text" [(ngModel)]="nd.destinacaoSearch" autocomplete="off" placeholder="Buscar destinação..."
                      (ngModelChange)="onNdDestinacaoInput($event)" (blur)="fecharNdDestinacaoDropdown()"
                      class="flex-1 min-w-0 p-2 text-sm border border-[#75C9C8]/30 rounded-l-lg focus:outline-none transition-all" />
                    <button type="button" (mousedown)="toggleNdDestinacaoDropdown($event)" class="${CB}">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                    </button>
                    <div *ngIf="ndShowDestinacaoDropdown && ndDestinacaoFiltered.length > 0" class="${DD}">
                      <div *ngFor="let d of ndDestinacaoFiltered" (mousedown)="selecionarNdDestinacao(d)" class="${DI}">
                        <span class="font-semibold text-[#1A4E79] shrink-0">{{ d.codigo }}</span>
                        <span class="text-gray-500 truncate">{{ d.descricao }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Tipo Recurso (AK6) -->
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Tipo Recurso</label>
                  <div class="${CW}">
                    <input type="text" [(ngModel)]="nd.tipoRecursoSearch" autocomplete="off" placeholder="Buscar tipo recurso..."
                      (ngModelChange)="onNdTipoRecursoInput($event)" (blur)="fecharNdTipoRecursoDropdown()"
                      class="flex-1 min-w-0 p-2 text-sm border border-[#75C9C8]/30 rounded-l-lg focus:outline-none transition-all" />
                    <button type="button" (mousedown)="toggleNdTipoRecursoDropdown($event)" class="${CB}">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                    </button>
                    <div *ngIf="ndShowTipoRecursoDropdown && ndTipoRecursoFiltered.length > 0" class="${DD}">
                      <div *ngFor="let r of ndTipoRecursoFiltered" (mousedown)="selecionarNdTipoRecurso(r)" class="${DI}">
                        <span class="font-semibold text-[#1A4E79] shrink-0">{{ r.codigo }}</span>
                        <span class="text-gray-500 truncate">{{ r.descricao }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Tipo Execução (AKF) -->
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Tipo Execução</label>
                  <div class="${CW}">
                    <input type="text" [(ngModel)]="nd.tipoExecucaoSearch" autocomplete="off" placeholder="Buscar tipo execução..."
                      (ngModelChange)="onNdTipoExecucaoInput($event)" (blur)="fecharNdTipoExecucaoDropdown()"
                      class="flex-1 min-w-0 p-2 text-sm border border-[#75C9C8]/30 rounded-l-lg focus:outline-none transition-all" />
                    <button type="button" (mousedown)="toggleNdTipoExecucaoDropdown($event)" class="${CB}">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                    </button>
                    <div *ngIf="ndShowTipoExecucaoDropdown && ndTipoExecucaoFiltered.length > 0" class="${DD}">
                      <div *ngFor="let e of ndTipoExecucaoFiltered" (mousedown)="selecionarNdTipoExecucao(e)" class="${DI}">
                        <span class="font-semibold text-[#1A4E79] shrink-0">{{ e.codigo }}</span>
                        <span class="text-gray-500 truncate">{{ e.descricao }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Observação (obrigatória) -->
                <div class="md:col-span-3">
                  <label class="block text-xs font-semibold text-[#1A4E79] mb-1 uppercase tracking-wide">Observação *</label>
                  <textarea [(ngModel)]="nd.obs" maxlength="254" rows="2" placeholder="Observação obrigatória..."
                    class="w-full p-2 text-sm border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all resize-none"></textarea>
                </div>

                <!-- Comprovantes -->
                <div class="md:col-span-3">
                  <label class="block text-xs font-semibold text-[#1A4E79] mb-1 uppercase tracking-wide">Comprovantes</label>
                  <div class="flex items-center gap-2 flex-wrap">
                    <label [class.opacity-40]="pendingFiles.length >= 1" [class.pointer-events-none]="pendingFiles.length >= 1"
                      class="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 border border-[#75C9C8]/40 text-[#1A4E79] rounded-lg text-xs hover:bg-[#e6eef0] transition-all">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                      Anexar comprovante
                      <input type="file" (change)="onFileSelected($event)" accept=".jpg,.jpeg,.png,.pdf" hidden />
                    </label>
                    <div *ngFor="let f of pendingFiles; let i = index"
                      class="flex items-center gap-1.5 bg-[#e6eef0] rounded-lg px-2.5 py-1 text-xs text-[#1A4E79]">
                      <span class="truncate max-w-[120px]">{{ f.name }}</span>
                      <button type="button" (click)="removerArquivo(i)" class="text-red-400 hover:text-red-600">×</button>
                    </div>
                    <span *ngIf="pendingFiles.length === 0" class="text-xs text-gray-400">Nenhum arquivo</span>
                  </div>
                </div>

              </div>

              <div *ngIf="erroDespesa"
                class="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-xs">
                <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                {{ erroDespesa }}
              </div>

              <div class="flex justify-end gap-2 mt-3 pt-3 border-t border-[#E6EEF2]">
                <button type="button" (click)="cancelarNovaDespesa()"
                  class="px-3 py-1.5 text-xs border border-[#75C9C8]/40 rounded-lg text-[#1A4E79] hover:bg-[#e6eef0] transition-all">
                  Cancelar
                </button>
                <button type="button" (click)="salvarDespesa()"
                  class="px-4 py-1.5 text-xs bg-gradient-to-r from-[#1A4E79] to-[#75C9C8] text-white rounded-lg hover:opacity-90 transition-all font-semibold">
                  Confirmar Despesa
                </button>
              </div>
            </div>

            <!-- ── Mobile: cards ── -->
            <div class="lg:hidden flex flex-col gap-2">
              <div *ngIf="isLoadingDespesas" class="py-8 text-center text-[#75C9C8] text-sm">
                <div class="w-6 h-6 border-2 border-[#75C9C8]/30 border-t-[#75C9C8] rounded-full mx-auto mb-2 animate-spin"></div>
                Carregando...
              </div>
              <div *ngIf="!isLoadingDespesas && despesas.length === 0 && !showNovaDespesa"
                class="py-10 text-center text-gray-400 text-sm">
                <svg class="w-8 h-8 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                Nenhuma despesa cadastrada
              </div>
              <div *ngFor="let d of despesas" class="bg-white border border-[#e6eef0] rounded-xl overflow-hidden shadow-sm">
                <div class="flex items-center justify-between px-4 py-2.5 bg-[#f8fdfd] border-b border-[#E6EEF2]">
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] font-bold text-[#1A4E79] bg-white border border-[#75C9C8]/30 rounded px-1.5 py-0.5">#{{ d.item }}</span>
                    <span class="text-sm font-semibold text-[#1A4E79]">{{ d.despes || 'Despesa' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-[#1A4E79]">R$ {{ d.total | number:'1.2-2' }}</span>
                    <button type="button" (click)="confirmarExcluirDespesa(d)"
                      class="p-1.5 rounded text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                    </button>
                  </div>
                </div>
                <div class="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div><span class="text-gray-400">Data</span><div class="text-gray-700 font-medium">{{ d.data }}</div></div>
                  <div><span class="text-gray-400">Local</span><div class="text-gray-700">{{ d.local || '—' }}</div></div>
                  <div><span class="text-gray-400">Qtd</span><div class="text-gray-700">{{ d.quant }}</div></div>
                  <div><span class="text-gray-400">Total</span><div class="text-gray-700 font-semibold">R$ {{ d.total | number:'1.2-2' }}</div></div>
                  <div><span class="text-gray-400">C. Custo</span><div class="text-gray-700">{{ d.cc || '—' }}</div></div>
                  <div><span class="text-gray-400">Anexos</span>
                    <div>
                      <button *ngIf="d.qtdAnexos > 0" type="button" (click)="verAnexos(d)"
                        class="text-[#1A4E79] font-semibold text-xs underline hover:no-underline">
                        {{ d.qtdAnexos }} arq.
                      </button>
                      <span *ngIf="d.qtdAnexos === 0" class="text-gray-400 text-xs">—</span>
                    </div>
                  </div>
                  <div class="col-span-2"><span class="text-gray-400">Descrição</span><div class="text-gray-700 break-words">{{ d.descri || '—' }}</div></div>
                </div>
              </div>
            </div>

            <!-- ── Desktop: tabela ── -->
            <div class="hidden lg:block overflow-x-auto">
              <div *ngIf="isLoadingDespesas" class="py-8 text-center text-[#75C9C8] text-sm">
                <div class="w-6 h-6 border-2 border-[#75C9C8]/30 border-t-[#75C9C8] rounded-full mx-auto mb-2 animate-spin"></div>
                Carregando...
              </div>
              <table *ngIf="!isLoadingDespesas" class="w-full text-sm border-collapse">
                <thead>
                  <tr class="text-[#1A4E79] text-xs bg-[#f8fdfd] border-b border-[#E6EEF2]">
                    <th class="px-3 py-2.5 text-left font-semibold uppercase tracking-wide">Item</th>
                    <th class="px-3 py-2.5 text-left font-semibold uppercase tracking-wide">Data</th>
                    <th class="px-3 py-2.5 text-left font-semibold uppercase tracking-wide">Local</th>
                    <th class="px-3 py-2.5 text-left font-semibold uppercase tracking-wide">Despesa</th>
                    <th class="px-3 py-2.5 text-center font-semibold uppercase tracking-wide">Qtd</th>
                    <th class="px-3 py-2.5 text-right font-semibold uppercase tracking-wide">Total</th>
                    <th class="px-3 py-2.5 text-left font-semibold uppercase tracking-wide">CC</th>
                    <th class="px-3 py-2.5 text-left font-semibold uppercase tracking-wide">Descrição</th>
                    <th class="px-3 py-2.5 text-center font-semibold uppercase tracking-wide">Anex.</th>
                    <th class="px-3 py-2.5"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E6EEF2]">
                  <tr *ngFor="let d of despesas" class="hover:bg-[#f8fdfd] transition-colors text-xs">
                    <td class="px-3 py-2.5 font-bold text-[#1A4E79]">{{ d.item }}</td>
                    <td class="px-3 py-2.5 text-gray-600">{{ d.data }}</td>
                    <td class="px-3 py-2.5 text-gray-600">{{ d.local }}</td>
                    <td class="px-3 py-2.5 text-gray-700">{{ d.despes }}</td>
                    <td class="px-3 py-2.5 text-center text-gray-600">{{ d.quant }}</td>
                    <td class="px-3 py-2.5 text-right font-semibold text-[#1A4E79]">R$ {{ d.total | number:'1.2-2' }}</td>
                    <td class="px-3 py-2.5 text-gray-600">{{ d.cc }}</td>
                    <td class="px-3 py-2.5 text-gray-600 max-w-[180px] truncate" [title]="d.descri">{{ d.descri }}</td>
                    <td class="px-3 py-2.5 text-center">
                      <button *ngIf="d.qtdAnexos > 0" type="button" (click)="verAnexos(d)"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#75C9C8]/20 text-[#1A4E79] hover:bg-[#75C9C8]/40 transition-colors">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                        </svg>
                        {{ d.qtdAnexos }}
                      </button>
                      <span *ngIf="d.qtdAnexos === 0" class="text-gray-300 text-xs">—</span>
                    </td>
                    <td class="px-3 py-2.5 text-center">
                      <button type="button" (click)="confirmarExcluirDespesa(d)"
                        class="p-1.5 rounded text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="despesas.length === 0 && !showNovaDespesa">
                    <td colspan="10" class="px-3 py-10 text-center text-gray-400 text-sm">
                      <svg class="w-8 h-8 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                      Nenhuma despesa cadastrada
                    </td>
                  </tr>
                </tbody>
                <tfoot *ngIf="despesas.length > 0" class="border-t-2 border-[#E6EEF2]">
                  <tr class="bg-[#f8fdfd]">
                    <td colspan="4" class="px-3 py-2.5 text-xs font-semibold text-[#1A4E79]">
                      Total ({{ despesas.length }} despesa{{ despesas.length !== 1 ? 's' : '' }})
                    </td>
                    <td class="px-3 py-2.5 text-right text-sm font-bold text-[#1A4E79]">R$ {{ totalDespesas | number:'1.2-2' }}</td>
                    <td colspan="5"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

          </div>

          <!-- ── Finalizar ── -->
          <div *ngIf="headerSaved && despesas.length > 0 && !showNovaDespesa"
            class="flex justify-end px-4 py-3 border-t border-[#E6EEF2] bg-[#f8fdfd]">
            <button type="button" (click)="finalizar()" [disabled]="isFinalizando"
              class="px-5 py-2 text-sm bg-gradient-to-r from-[#75C9C8] to-[#1A4E79] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all font-semibold shadow-sm">
              Finalizar Prestação
            </button>
          </div>

        </div>

      </div>
    </div>

  <!-- ── Modal Anexos Locais ── -->
  <div *ngIf="modalAnexosLocal"
    class="fixed inset-0 bg-[#1A4E79]/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
    (click)="fecharModalAnexosLocal()">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" (click)="$event.stopPropagation()">
      <div class="bg-gradient-to-r from-[#1A4E79] to-[#75C9C8] px-5 py-4 flex items-center justify-between">
        <span class="text-white font-semibold text-sm">Anexos — Item {{ anexosLocalItem }}</span>
        <button type="button" (click)="fecharModalAnexosLocal()"
          class="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="p-4 max-h-80 overflow-y-auto">
        <div *ngIf="anexosLocalFiles.length === 0"
          class="text-center py-8 text-gray-400 text-sm">Nenhum arquivo encontrado.</div>
        <div *ngIf="anexosLocalFiles.length > 0" class="space-y-2">
          <div *ngFor="let f of anexosLocalFiles"
            (click)="abrirAnexoLocal(f)"
            class="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-[#f0fafa] transition-colors cursor-pointer">
            <div class="w-8 h-8 rounded-lg bg-[#1A4E79]/10 flex items-center justify-center shrink-0">
              <svg class="w-4 h-4 text-[#1A4E79]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0121 9.414V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-800 break-all">{{ f.name }}</p>
            </div>
            <svg class="w-4 h-4 text-[#75C9C8] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
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
export class PrestacaoContasComponent implements OnInit {

  // ── Modal de confirmação genérico ────────────────────────────────────────────
  confirmModal: {
    title:        string;
    body:         string;
    confirmLabel: string;
    danger:       boolean;
    detail?:      string;
    detailLabel?: string;
    detailSub?:   string;
    onConfirm:    () => void;
  } | null = null;

  fecharConfirmModal(): void { this.confirmModal = null; }

  executarConfirmModal(): void {
    const fn = this.confirmModal?.onConfirm;
    this.confirmModal = null;
    fn?.();
  }

  async confirmarFinalizar(): Promise<void> {
    this.isFinalizando = true;

    const payload = {
      FLF_TIPO:   this.model.flf_tipo,
      FLF_PRESTA: '',
      FLF_PARTIC: this.model.codParticipante,
      FLF_EMISSA: this.model.flf_emissa,
      FLF_DTINI:  this.model.flf_dtini,
      FLF_DTFIM:  this.model.flf_dtfim,
      FLF_NACION: this.model.flf_nacion === 'S' ? '1' : '2',
      FLF_CC:     this.model.centroCusto,
      FLF_ITCTB:  this.model.itemContabil,
      FLF_CLVL:   this.model.classeValor,
      FLF_MOTIVO: this.model.motivo,
      FLF_FATCLI: Number(this.model.flf_fatcli) || 0,
      FLF_FATEMP: Number(this.model.flf_fatemp) || 0,
      FLF_CLIFOR: this.model.flf_clifor,
      FLF_FLOJA:  this.model.flf_floja
    };

    try {
      const cabResp = await firstValueFrom(this.prestacaoService.salvarPrestacao(payload));
      const presta  = cabResp?.codigo as string;

      for (let i = 0; i < this.despesas.length; i++) {
        const d    = this.despesas[i];
        const resp = await firstValueFrom(this.despesaService.inserirDespesa({
          FLE_PRESTA:  presta,
          FLE_DATA:    d.data,
          FLE_LOCAL:   d.local,
          FLE_DESPES:  d.despes,
          FLE_DESCRI:  d.descri,
          FLE_QUANT:   d.quant,
          FLE_TOTAL:   d.total,
          FLE_CONTA:   d.conta,
          FLE_CC:      d.cc,
          FLE_ITEMCTA: d.itemCtb,
          FLE_CLVL:    d.clvl,
          FLE_OBS:     d.obs,
          FLE_GRUPO:   d.grupo,
          FLE_EC05DB:      d.destinacao,
          FLE_EC06DB:      d.tipoRecurso,
          FLE_EC07DB:      d.tipoExecucao
        }));

        const nItem = resp?.item as number;
        for (const file of (this.despesaFiles[i] || [])) {
          const base64 = await this.fileToBase64(file);
          const ext    = file.name.split('.').pop()?.toLowerCase() || '';
          await firstValueFrom(this.despesaService.uploadAnexo({
            presta, item: nItem, nome: file.name, tipo: ext, arquivo: base64
          }));
        }
      }

      this.isFinalizando = false;
      this.showToast(`Prestação de contas ${presta} salva com sucesso!`, 'success');
      setTimeout(() => this.novaPrestacao(), 6000);
    } catch (err: any) {
      this.isFinalizando = false;
      this.showToast(`Erro ao finalizar: ${err?.message || 'Erro desconhecido'}`, 'error');
    }
  }

  // ── Toast ───────────────────────────────────────────────────────────────────
  toast: { message: string; type: 'error' | 'success' | 'warning' } | null = null;
  private toastTimer: any = null;

  showToast(message: string, type: 'error' | 'success' | 'warning' = 'error', durationMs = 6000): void {
    clearTimeout(this.toastTimer);
    this.toast = { message, type };
    this.toastTimer = setTimeout(() => { this.toast = null; }, durationMs);
  }

  closeToast(): void {
    clearTimeout(this.toastTimer);
    this.toast = null;
  }

  // ── Estado do cabeçalho ─────────────────────────────────────────────────────
  model: any = {};
  isGeneratingCode  = false;
  isSaving          = false;
  headerSaved       = false;
  isFinalizando     = false;

  // Combobox local pré-carregado — participante
  participantes:           ParticipanteResult[] = [];
  participanteResults:     ParticipanteResult[] = [];
  showParticipanteDropdown = false;
  isLoadingParticipante    = false;

  // Combobox local pré-carregado — cliente/fornecedor
  clientes:           ClienteResult[] = [];
  clienteResults:     ClienteResult[] = [];
  showClienteDropdown = false;
  isLoadingCliente    = false;

  // Listas locais
  itensContabeis: ItemContabilResult[] = [];
  centrosCusto:   CentroCustoResult[]  = [];
  classesValor:   ClasseValorResult[]  = [];

  // Combobox local — cabeçalho
  itemContabilFiltered: ItemContabilResult[] = [];
  showItemContabilDropdown = false;
  centroCustoFiltered: CentroCustoResult[] = [];
  showCentroCustoDropdown  = false;
  classeValorFiltered: ClasseValorResult[] = [];
  showClasseValorDropdown  = false;

  // ── Estado das despesas ─────────────────────────────────────────────────────
  despesas:         DespesaRow[] = [];
  despesaFiles:     File[][]    = [];
  isLoadingDespesas = false;
  showNovaDespesa   = false;
  isSavingDespesa   = false;
  erroDespesa       = '';
  pendingFiles:     File[] = [];

  // ── Visualização de anexos ───────────────────────────────────────────────────
  modalAnexosLocal     = false;
  anexosLocalItem      = 0;
  anexosLocalFiles:    File[] = [];
  previewUrl:          SafeResourceUrl | null = null;
  previewNome          = '';
  previewTipo          = '';
  private _previewBlobUrl = '';

  nd: any = {}; // nova despesa form

  flgList:         FLGResult[]          = [];
  contasContabeis: ContaContabilResult[] = [];
  grupos:          GrupoResult[]         = [];
  destinacoes:     DestinacaoResult[]    = [];
  tiposRecurso:    TipoRecursoResult[]   = [];
  tiposExecucao:   TipoExecucaoResult[]  = [];

  readonly UF_ESTADOS = [
    { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AM', nome: 'Amazonas' },
    { sigla: 'AP', nome: 'Amapá' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' },
    { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' },
    { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' },
    { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' },
    { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' }, { sigla: 'PR', nome: 'Paraná' },
    { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' },
    { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'RS', nome: 'Rio Grande do Sul' },
    { sigla: 'SC', nome: 'Santa Catarina' }, { sigla: 'SE', nome: 'Sergipe' },
    { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'TO', nome: 'Tocantins' }
  ];

  // Combobox local — nova despesa (nd = nova despesa)
  ndFLGFiltered:        FLGResult[]          = [];
  ndShowFLGDropdown     = false;
  ndContaFiltered:      ContaContabilResult[] = [];
  ndShowContaDropdown   = false;
  ndCCFiltered:         CentroCustoResult[]  = [];
  ndShowCCDropdown      = false;
  ndItemCtbFiltered:    ItemContabilResult[] = [];
  ndShowItemCtbDropdown = false;
  ndClVlFiltered:          ClasseValorResult[]  = [];
  ndShowClVlDropdown       = false;
  ndGrupoFiltered:         GrupoResult[]        = [];
  ndShowGrupoDropdown      = false;
  ndDestinacaoFiltered:    DestinacaoResult[]   = [];
  ndShowDestinacaoDropdown = false;
  ndTipoRecursoFiltered:   TipoRecursoResult[]  = [];
  ndShowTipoRecursoDropdown = false;
  ndTipoExecucaoFiltered:  TipoExecucaoResult[] = [];
  ndShowTipoExecucaoDropdown = false;

  constructor(
    private prestacaoService: PrestacaoContasService,
    private despesaService:   DespesaService,
    private sanitizer:        DomSanitizer
  ) {}

  ngOnInit(): void {
    this.initModel();
    this.carregarListasCabecalho();
    this.carregarListasDespesa();
  }

  get somaPercentuais(): number {
    return (Number(this.model.flf_fatcli) || 0) + (Number(this.model.flf_fatemp) || 0);
  }

  get percentuaisInvalidos(): boolean {
    const s = this.somaPercentuais;
    return s > 0 && s !== 100;
  }

  get totalDespesas(): number {
    return this.despesas.reduce((acc, d) => acc + d.total, 0);
  }

  verAnexos(d: DespesaRow): void {
    const idx = this.despesas.indexOf(d);
    if (idx < 0) return;
    this.anexosLocalItem  = d.item;
    this.anexosLocalFiles = this.despesaFiles[idx] || [];
    this.modalAnexosLocal = true;
  }

  fecharModalAnexosLocal(): void {
    this.modalAnexosLocal = false;
    this.anexosLocalFiles = [];
  }

  abrirAnexoLocal(file: File): void {
    const tipo = file.type || 'application/octet-stream';
    const url  = URL.createObjectURL(file);
    const viewable = tipo.startsWith('image/') || tipo === 'application/pdf';
    if (viewable) {
      this._previewBlobUrl = url;
      this.previewUrl  = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      this.previewNome = file.name;
      this.previewTipo = tipo;
    } else {
      const link    = document.createElement('a');
      link.href     = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
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

  private carregarListasCabecalho(): void {
    this.prestacaoService.listarItensContabeis().subscribe({ next: i => this.itensContabeis = i, error: () => {} });
    this.prestacaoService.listarCentrosCusto().subscribe({   next: i => this.centrosCusto = i,   error: () => {} });
    this.prestacaoService.listarClassesValor().subscribe({   next: i => this.classesValor = i,    error: () => {} });
    this.isLoadingCliente = true;
    this.prestacaoService.listarClientes().subscribe({ next: i => { this.clientes = i; this.isLoadingCliente = false; }, error: () => { this.isLoadingCliente = false; } });
    this.isLoadingParticipante = true;
    this.prestacaoService.listarParticipantes().subscribe({ next: i => { this.participantes = i; this.isLoadingParticipante = false; }, error: () => { this.isLoadingParticipante = false; } });
  }

  private carregarListasDespesa(): void {
    this.despesaService.listarFLG().subscribe({ next: i => this.flgList = i, error: () => {} });
    this.despesaService.listarContasContabeis().subscribe({ next: i => this.contasContabeis = i, error: () => {} });
    this.despesaService.listarGrupos().subscribe({ next: i => this.grupos = i, error: () => {} });
    this.despesaService.listarDestinacoes().subscribe({ next: i => this.destinacoes = i, error: () => {} });
    this.despesaService.listarTiposRecurso().subscribe({ next: i => this.tiposRecurso = i, error: () => {} });
    this.despesaService.listarTiposExecucao().subscribe({ next: i => this.tiposExecucao = i, error: () => {} });
  }

  initModel(): void {
    this.model = {
      flf_tipo: '2', flf_presta: '',
      codParticipante: '', nomeParticipante: '',
      flf_emissa: '', flf_dtini: '', flf_dtfim: '',
      flf_nacion: 'S',
      itemContabilSearch: '', itemContabil: '',
      centroCustoSearch: '', centroCusto: '',
      classeValorSearch: '', classeValor: '',
      motivo: '', flf_fatcli: 0, flf_fatemp: 0,
      flf_clifor: '', flf_floja: '', nomeCliente: ''
    };
  }

  private initNd(): void {
    this.nd = {
      data: '', local: '',
      flgSearch: '', despes: '', descri: '',
      quant: 1, total: 0,
      contaSearch: '', conta: '',
      ccSearch: '', cc: '',
      itemCtbSearch: '', itemCtb: '',
      clVlSearch: '', clvl: '',
      obs: '',
      grupoSearch: '', grupo: '',
      destinacaoSearch: '', destinacao: '',
      tipoRecursoSearch: '', tipoRecurso: '',
      tipoExecucaoSearch: '', tipoExecucao: ''
    };
    this.pendingFiles             = [];
    this.erroDespesa              = '';
    this.ndFLGFiltered            = [];  this.ndShowFLGDropdown          = false;
    this.ndContaFiltered          = [];  this.ndShowContaDropdown        = false;
    this.ndCCFiltered             = [];  this.ndShowCCDropdown           = false;
    this.ndItemCtbFiltered        = [];  this.ndShowItemCtbDropdown      = false;
    this.ndClVlFiltered           = [];  this.ndShowClVlDropdown         = false;
    this.ndGrupoFiltered          = [];  this.ndShowGrupoDropdown        = false;
    this.ndDestinacaoFiltered     = [];  this.ndShowDestinacaoDropdown   = false;
    this.ndTipoRecursoFiltered    = [];  this.ndShowTipoRecursoDropdown  = false;
    this.ndTipoExecucaoFiltered   = [];  this.ndShowTipoExecucaoDropdown = false;
  }

  // ── Ações do cabeçalho ──────────────────────────────────────────────────────

  voltar(): void { try { window.history.back(); } catch {} }

  novaPrestacao(): void {
    this.headerSaved = false;
    this.despesas = [];
    this.despesaFiles = [];
    this.showNovaDespesa = false;
    this.initModel();
  }

  salvar(): void {
    const erros: string[] = [];
    if (!this.model.codParticipante?.trim()) erros.push('Participante');
    if (!this.model.flf_emissa)             erros.push('Data de Emissão');
    if (!this.model.flf_dtini)              erros.push('Data de Saída');
    if (!this.model.flf_dtfim)              erros.push('Data de Chegada');
    if (!this.model.flf_nacion)             erros.push('Gasto Nacional');
    if (!this.model.motivo?.trim())         erros.push('Motivo');
    if (erros.length) {
      this.showToast(`Preencha os campos obrigatórios:\n• ${erros.join('\n• ')}`, 'error');
      return;
    }
    if (this.somaPercentuais !== 100) {
      this.showToast(`% Cliente + % Empresa devem somar exatamente 100%.\nAtual: ${this.somaPercentuais}% — faltam ${100 - this.somaPercentuais}%.`, 'warning');
      return;
    }
    this.headerSaved = true;
  }

  // ── Despesas ────────────────────────────────────────────────────────────────

  abrirNovaDespesa(): void {
    this.initNd();
    this.showNovaDespesa = true;
  }

  cancelarNovaDespesa(): void {
    this.showNovaDespesa = false;
    this.initNd();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    if (this.pendingFiles.length >= 1) {
      input.value = '';
      return;
    }
    const f   = input.files[0];
    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    const allowed = ['jpg', 'jpeg', 'png', 'pdf'];
    if (allowed.includes(ext)) {
      this.pendingFiles = [f];
    } else {
      this.showToast(`Arquivo "${f.name}" não permitido.\nUse jpg, jpeg, png ou pdf.`, 'warning');
    }
    input.value = '';
  }

  removerArquivo(index: number): void {
    this.pendingFiles = this.pendingFiles.filter((_, i) => i !== index);
  }

  salvarDespesa(): void {
    if (!this.nd.data || !this.nd.local || !this.nd.despes || Number(this.nd.total) <= 0
        || !this.nd.cc || !this.nd.obs?.trim()) {
      this.erroDespesa = 'Preencha os campos obrigatórios: Data, Local, Despesa, Valor Total, Centro de Custo e Observação.';
      return;
    }
    this.erroDespesa = '';
    const nextItem = this.despesas.length + 1;
    this.despesas = [...this.despesas, {
      item:      nextItem,
      data:      this.nd.data,
      local:     this.nd.local,
      despes:    this.nd.despes,
      descri:    this.nd.descri,
      quant:        Number(this.nd.quant) || 1,
      total:        Number(this.nd.total),
      conta:        this.nd.conta,
      cc:           this.nd.cc,
      itemCtb:      this.nd.itemCtb,
      clvl:         this.nd.clvl,
      obs:          this.nd.obs,
      grupo:        this.nd.grupo,
      destinacao:   this.nd.destinacao,
      tipoRecurso:  this.nd.tipoRecurso,
      tipoExecucao: this.nd.tipoExecucao,
      qtdAnexos:    this.pendingFiles.length
    }];
    this.despesaFiles = [...this.despesaFiles, [...this.pendingFiles]];
    this.showNovaDespesa = false;
    this.initNd();
  }

  confirmarExcluirDespesa(d: DespesaRow): void {
    this.confirmModal = {
      title:        'Excluir Despesa',
      body:         `Despesa #${d.item} — ${d.descri || d.despes}`,
      confirmLabel: 'Excluir',
      danger:       true,
      onConfirm: () => {
        const idx = this.despesas.indexOf(d);
        if (idx < 0) return;
        this.despesas     = this.despesas.filter((_, i) => i !== idx).map((x, i) => ({ ...x, item: i + 1 }));
        this.despesaFiles = this.despesaFiles.filter((_, i) => i !== idx);
      }
    };
  }

  finalizar(): void {
    if (!this.despesas.length) return;
    this.confirmModal = {
      title:        'Confirmar Finalização',
      body:         'Deseja finalizar e enviar esta prestação ao sistema?',
      confirmLabel: 'Finalizar',
      danger:       false,
      detail:       `R$ ${this.totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      detailLabel:  'Saldo Calculado',
      detailSub:    `${this.despesas.length} despesa${this.despesas.length !== 1 ? 's' : ''}`,
      onConfirm:    () => this.confirmarFinalizar()
    };
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const res = r.result as string;
        resolve(res.includes(',') ? res.split(',')[1] : res);
      };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  // ── Filtro local genérico ────────────────────────────────────────────────────

  private filtrar(lista: any[], termo: string): any[] {
    const t = termo.toLowerCase();
    return lista.filter(i => i.codigo.toLowerCase().includes(t) || i.descricao.toLowerCase().includes(t));
  }

  private filtrarCliente(lista: ClienteResult[], termo: string): ClienteResult[] {
    const t = termo.toLowerCase();
    return lista.filter(i => i.codigo.toLowerCase().includes(t) || i.nome.toLowerCase().includes(t));
  }

  private filtrarParticipante(lista: ParticipanteResult[], termo: string): ParticipanteResult[] {
    const t = termo.toLowerCase();
    return lista.filter(i => i.codigo.toLowerCase().includes(t) || i.nome.toLowerCase().includes(t));
  }

  // ── Participante (local) ─────────────────────────────────────────────────────

  onParticipanteInput(v: string): void {
    this.model.nomeParticipante = '';
    if (!v?.trim()) { this.showParticipanteDropdown = false; this.participanteResults = []; return; }
    this.participanteResults = this.filtrarParticipante(this.participantes, v);
    this.showParticipanteDropdown = this.participanteResults.length > 0;
  }
  toggleParticipanteDropdown(e: MouseEvent): void {
    e.preventDefault();
    if (this.showParticipanteDropdown) { this.showParticipanteDropdown = false; return; }
    const t = (this.model.codParticipante || '').trim();
    this.participanteResults = t ? this.filtrarParticipante(this.participantes, t) : [...this.participantes];
    this.showParticipanteDropdown = this.participanteResults.length > 0;
  }
  selecionarParticipante(item: ParticipanteResult): void {
    this.model.codParticipante = item.codigo; this.model.nomeParticipante = item.nome;
    this.participanteResults = []; this.showParticipanteDropdown = false;
  }
  fecharParticipanteDropdown(): void { setTimeout(() => { this.showParticipanteDropdown = false; }, 150); }

  // ── Item Contábil (local) ────────────────────────────────────────────────────

  onItemContabilInput(v: string): void {
    this.model.itemContabil = '';
    if (!v?.trim()) { this.showItemContabilDropdown = false; this.itemContabilFiltered = []; return; }
    this.itemContabilFiltered = this.filtrar(this.itensContabeis, v);
    this.showItemContabilDropdown = this.itemContabilFiltered.length > 0;
  }
  toggleItemContabilDropdown(e: MouseEvent): void {
    e.preventDefault();
    if (this.showItemContabilDropdown) { this.showItemContabilDropdown = false; return; }
    const t = (this.model.itemContabilSearch || '').trim();
    this.itemContabilFiltered = t ? this.filtrar(this.itensContabeis, t) : [...this.itensContabeis];
    this.showItemContabilDropdown = this.itemContabilFiltered.length > 0;
  }
  selecionarItemContabil(item: ItemContabilResult): void {
    this.model.itemContabil = item.codigo; this.model.itemContabilSearch = `${item.codigo} - ${item.descricao}`;
    this.itemContabilFiltered = []; this.showItemContabilDropdown = false;
  }
  fecharItemContabilDropdown(): void { setTimeout(() => { this.showItemContabilDropdown = false; }, 150); }

  // ── Centro de Custo (API) ──────────────────────────────────────────────────

  onCentroCustoInput(v: string): void {
    this.model.centroCusto = '';
    if (!v?.trim()) { this.showCentroCustoDropdown = false; this.centroCustoFiltered = []; return; }
    this.centroCustoFiltered = this.filtrar(this.centrosCusto, v);
    this.showCentroCustoDropdown = this.centroCustoFiltered.length > 0;
  }
  toggleCentroCustoDropdown(e: MouseEvent): void {
    e.preventDefault();
    if (this.showCentroCustoDropdown) { this.showCentroCustoDropdown = false; return; }
    const t = (this.model.centroCustoSearch || '').trim();
    this.centroCustoFiltered = t ? this.filtrar(this.centrosCusto, t) : [...this.centrosCusto];
    this.showCentroCustoDropdown = this.centroCustoFiltered.length > 0;
  }
  selecionarCentroCusto(item: CentroCustoResult): void {
    this.model.centroCusto = item.codigo; this.model.centroCustoSearch = `${item.codigo} - ${item.descricao}`;
    this.centroCustoFiltered = []; this.showCentroCustoDropdown = false;
  }
  fecharCentroCustoDropdown(): void { setTimeout(() => { this.showCentroCustoDropdown = false; }, 150); }

  // ── Classe Valor (local) ─────────────────────────────────────────────────────

  onClasseValorInput(v: string): void {
    this.model.classeValor = '';
    if (!v?.trim()) { this.showClasseValorDropdown = false; this.classeValorFiltered = []; return; }
    this.classeValorFiltered = this.filtrar(this.classesValor, v);
    this.showClasseValorDropdown = this.classeValorFiltered.length > 0;
  }
  toggleClasseValorDropdown(e: MouseEvent): void {
    e.preventDefault();
    if (this.showClasseValorDropdown) { this.showClasseValorDropdown = false; return; }
    const t = (this.model.classeValorSearch || '').trim();
    this.classeValorFiltered = t ? this.filtrar(this.classesValor, t) : [...this.classesValor];
    this.showClasseValorDropdown = this.classeValorFiltered.length > 0;
  }
  selecionarClasseValor(item: ClasseValorResult): void {
    this.model.classeValor = item.codigo; this.model.classeValorSearch = `${item.codigo} - ${item.descricao}`;
    this.classeValorFiltered = []; this.showClasseValorDropdown = false;
  }
  fecharClasseValorDropdown(): void { setTimeout(() => { this.showClasseValorDropdown = false; }, 150); }

  // ── Cliente / Fornecedor (API) ───────────────────────────────────────────────

  onClienteInput(v: string): void {
    this.model.flf_floja = ''; this.model.nomeCliente = '';
    if (!v?.trim()) { this.showClienteDropdown = false; this.clienteResults = []; return; }
    this.clienteResults = this.filtrarCliente(this.clientes, v);
    this.showClienteDropdown = this.clienteResults.length > 0;
  }
  toggleClienteDropdown(e: MouseEvent): void {
    e.preventDefault();
    if (this.showClienteDropdown) { this.showClienteDropdown = false; return; }
    const t = (this.model.flf_clifor || '').trim();
    this.clienteResults = t ? this.filtrarCliente(this.clientes, t) : [...this.clientes];
    this.showClienteDropdown = this.clienteResults.length > 0;
  }
  selecionarCliente(item: ClienteResult): void {
    this.model.flf_clifor = item.codigo; this.model.flf_floja = item.loja; this.model.nomeCliente = item.nome;
    this.clienteResults = []; this.showClienteDropdown = false;
  }
  fecharClienteDropdown(): void { setTimeout(() => { this.showClienteDropdown = false; }, 150); }

  // ── Comboboxes da nova despesa ───────────────────────────────────────────────

  onNdFLGInput(v: string): void {
    this.nd.despes = '';
    if (!v?.trim()) { this.ndShowFLGDropdown = false; this.ndFLGFiltered = []; return; }
    this.ndFLGFiltered = this.filtrar(this.flgList, v);
    this.ndShowFLGDropdown = this.ndFLGFiltered.length > 0;
  }
  toggleNdFLGDropdown(e: MouseEvent): void {
    e.preventDefault();
    if (this.ndShowFLGDropdown) { this.ndShowFLGDropdown = false; return; }
    const t = (this.nd.flgSearch || '').trim();
    this.ndFLGFiltered = t ? this.filtrar(this.flgList, t) : [...this.flgList];
    this.ndShowFLGDropdown = this.ndFLGFiltered.length > 0;
  }
  selecionarNdFLG(item: FLGResult): void {
    this.nd.despes = item.codigo;
    this.nd.flgSearch = `${item.codigo} - ${item.descricao}`;
    this.nd.descri = item.descricao;
    if (item.custo)  { this.nd.cc      = item.custo;  this.nd.ccSearch      = item.custo; }
    if (item.itectb) { this.nd.itemCtb = item.itectb; this.nd.itemCtbSearch = item.itectb; }
    if (item.clvl)   { this.nd.clvl    = item.clvl;   this.nd.clVlSearch    = item.clvl; }
    this.ndFLGFiltered = []; this.ndShowFLGDropdown = false;
  }
  fecharNdFLGDropdown(): void { setTimeout(() => { this.ndShowFLGDropdown = false; }, 150); }

  onNdContaInput(v: string): void {
    this.nd.conta = '';
    if (!v?.trim()) { this.ndShowContaDropdown = false; this.ndContaFiltered = []; return; }
    this.ndContaFiltered = this.filtrar(this.contasContabeis, v);
    this.ndShowContaDropdown = this.ndContaFiltered.length > 0;
  }
  toggleNdContaDropdown(e: MouseEvent): void {
    e.preventDefault();
    if (this.ndShowContaDropdown) { this.ndShowContaDropdown = false; return; }
    const t = (this.nd.contaSearch || '').trim();
    this.ndContaFiltered = t ? this.filtrar(this.contasContabeis, t) : [...this.contasContabeis];
    this.ndShowContaDropdown = this.ndContaFiltered.length > 0;
  }
  selecionarNdConta(item: ContaContabilResult): void {
    this.nd.conta = item.codigo; this.nd.contaSearch = `${item.codigo} - ${item.descricao}`;
    this.ndContaFiltered = []; this.ndShowContaDropdown = false;
  }
  fecharNdContaDropdown(): void { setTimeout(() => { this.ndShowContaDropdown = false; }, 150); }

  onNdCCInput(v: string): void {
    this.nd.cc = '';
    if (!v?.trim()) { this.ndShowCCDropdown = false; this.ndCCFiltered = []; return; }
    this.ndCCFiltered = this.filtrar(this.centrosCusto, v);
    this.ndShowCCDropdown = this.ndCCFiltered.length > 0;
  }
  toggleNdCCDropdown(e: MouseEvent): void {
    e.preventDefault();
    if (this.ndShowCCDropdown) { this.ndShowCCDropdown = false; return; }
    const t = (this.nd.ccSearch || '').trim();
    this.ndCCFiltered = t ? this.filtrar(this.centrosCusto, t) : [...this.centrosCusto];
    this.ndShowCCDropdown = this.ndCCFiltered.length > 0;
  }
  selecionarNdCC(item: CentroCustoResult): void {
    this.nd.cc = item.codigo; this.nd.ccSearch = `${item.codigo} - ${item.descricao}`;
    this.ndCCFiltered = []; this.ndShowCCDropdown = false;
  }
  fecharNdCCDropdown(): void { setTimeout(() => { this.ndShowCCDropdown = false; }, 150); }

  onNdItemCtbInput(v: string): void {
    this.nd.itemCtb = '';
    if (!v?.trim()) { this.ndShowItemCtbDropdown = false; this.ndItemCtbFiltered = []; return; }
    this.ndItemCtbFiltered = this.filtrar(this.itensContabeis, v);
    this.ndShowItemCtbDropdown = this.ndItemCtbFiltered.length > 0;
  }
  toggleNdItemCtbDropdown(e: MouseEvent): void {
    e.preventDefault();
    if (this.ndShowItemCtbDropdown) { this.ndShowItemCtbDropdown = false; return; }
    const t = (this.nd.itemCtbSearch || '').trim();
    this.ndItemCtbFiltered = t ? this.filtrar(this.itensContabeis, t) : [...this.itensContabeis];
    this.ndShowItemCtbDropdown = this.ndItemCtbFiltered.length > 0;
  }
  selecionarNdItemCtb(item: ItemContabilResult): void {
    this.nd.itemCtb = item.codigo; this.nd.itemCtbSearch = `${item.codigo} - ${item.descricao}`;
    this.ndItemCtbFiltered = []; this.ndShowItemCtbDropdown = false;
  }
  fecharNdItemCtbDropdown(): void { setTimeout(() => { this.ndShowItemCtbDropdown = false; }, 150); }

  onNdClVlInput(v: string): void {
    this.nd.clvl = '';
    if (!v?.trim()) { this.ndShowClVlDropdown = false; this.ndClVlFiltered = []; return; }
    this.ndClVlFiltered = this.filtrar(this.classesValor, v);
    this.ndShowClVlDropdown = this.ndClVlFiltered.length > 0;
  }
  toggleNdClVlDropdown(e: MouseEvent): void {
    e.preventDefault();
    if (this.ndShowClVlDropdown) { this.ndShowClVlDropdown = false; return; }
    const t = (this.nd.clVlSearch || '').trim();
    this.ndClVlFiltered = t ? this.filtrar(this.classesValor, t) : [...this.classesValor];
    this.ndShowClVlDropdown = this.ndClVlFiltered.length > 0;
  }
  selecionarNdClVl(item: ClasseValorResult): void {
    this.nd.clvl = item.codigo; this.nd.clVlSearch = `${item.codigo} - ${item.descricao}`;
    this.ndClVlFiltered = []; this.ndShowClVlDropdown = false;
  }
  fecharNdClVlDropdown(): void { setTimeout(() => { this.ndShowClVlDropdown = false; }, 150); }

  // ── Grupo FLK (local) ────────────────────────────────────────────────────────

  onNdGrupoInput(v: string): void {
    this.nd.grupo = '';
    if (!v?.trim()) { this.ndShowGrupoDropdown = false; this.ndGrupoFiltered = []; return; }
    this.ndGrupoFiltered = this.filtrar(this.grupos, v);
    this.ndShowGrupoDropdown = this.ndGrupoFiltered.length > 0;
  }
  toggleNdGrupoDropdown(e: MouseEvent): void {
    e.preventDefault();
    if (this.ndShowGrupoDropdown) { this.ndShowGrupoDropdown = false; return; }
    const t = (this.nd.grupoSearch || '').trim();
    this.ndGrupoFiltered = t ? this.filtrar(this.grupos, t) : [...this.grupos];
    this.ndShowGrupoDropdown = this.ndGrupoFiltered.length > 0;
  }
  selecionarNdGrupo(item: GrupoResult): void {
    this.nd.grupo = item.codigo; this.nd.grupoSearch = `${item.codigo} - ${item.descricao}`;
    this.ndGrupoFiltered = []; this.ndShowGrupoDropdown = false;
  }
  fecharNdGrupoDropdown(): void { setTimeout(() => { this.ndShowGrupoDropdown = false; }, 150); }

  // ── Destinação AMF (local) ───────────────────────────────────────────────────

  onNdDestinacaoInput(v: string): void {
    this.nd.destinacao = '';
    if (!v?.trim()) { this.ndShowDestinacaoDropdown = false; this.ndDestinacaoFiltered = []; return; }
    this.ndDestinacaoFiltered = this.filtrar(this.destinacoes, v);
    this.ndShowDestinacaoDropdown = this.ndDestinacaoFiltered.length > 0;
  }
  toggleNdDestinacaoDropdown(e: MouseEvent): void {
    e.preventDefault();
    if (this.ndShowDestinacaoDropdown) { this.ndShowDestinacaoDropdown = false; return; }
    const t = (this.nd.destinacaoSearch || '').trim();
    this.ndDestinacaoFiltered = t ? this.filtrar(this.destinacoes, t) : [...this.destinacoes];
    this.ndShowDestinacaoDropdown = this.ndDestinacaoFiltered.length > 0;
  }
  selecionarNdDestinacao(item: DestinacaoResult): void {
    this.nd.destinacao = item.codigo; this.nd.destinacaoSearch = `${item.codigo} - ${item.descricao}`;
    this.ndDestinacaoFiltered = []; this.ndShowDestinacaoDropdown = false;
  }
  fecharNdDestinacaoDropdown(): void { setTimeout(() => { this.ndShowDestinacaoDropdown = false; }, 150); }

  // ── Tipo Recurso AK6 (local) ─────────────────────────────────────────────────

  onNdTipoRecursoInput(v: string): void {
    this.nd.tipoRecurso = '';
    if (!v?.trim()) { this.ndShowTipoRecursoDropdown = false; this.ndTipoRecursoFiltered = []; return; }
    this.ndTipoRecursoFiltered = this.filtrar(this.tiposRecurso, v);
    this.ndShowTipoRecursoDropdown = this.ndTipoRecursoFiltered.length > 0;
  }
  toggleNdTipoRecursoDropdown(e: MouseEvent): void {
    e.preventDefault();
    if (this.ndShowTipoRecursoDropdown) { this.ndShowTipoRecursoDropdown = false; return; }
    const t = (this.nd.tipoRecursoSearch || '').trim();
    this.ndTipoRecursoFiltered = t ? this.filtrar(this.tiposRecurso, t) : [...this.tiposRecurso];
    this.ndShowTipoRecursoDropdown = this.ndTipoRecursoFiltered.length > 0;
  }
  selecionarNdTipoRecurso(item: TipoRecursoResult): void {
    this.nd.tipoRecurso = item.codigo; this.nd.tipoRecursoSearch = `${item.codigo} - ${item.descricao}`;
    this.ndTipoRecursoFiltered = []; this.ndShowTipoRecursoDropdown = false;
  }
  fecharNdTipoRecursoDropdown(): void { setTimeout(() => { this.ndShowTipoRecursoDropdown = false; }, 150); }

  // ── Tipo Execução AKF (local) ────────────────────────────────────────────────

  onNdTipoExecucaoInput(v: string): void {
    this.nd.tipoExecucao = '';
    if (!v?.trim()) { this.ndShowTipoExecucaoDropdown = false; this.ndTipoExecucaoFiltered = []; return; }
    this.ndTipoExecucaoFiltered = this.filtrar(this.tiposExecucao, v);
    this.ndShowTipoExecucaoDropdown = this.ndTipoExecucaoFiltered.length > 0;
  }
  toggleNdTipoExecucaoDropdown(e: MouseEvent): void {
    e.preventDefault();
    if (this.ndShowTipoExecucaoDropdown) { this.ndShowTipoExecucaoDropdown = false; return; }
    const t = (this.nd.tipoExecucaoSearch || '').trim();
    this.ndTipoExecucaoFiltered = t ? this.filtrar(this.tiposExecucao, t) : [...this.tiposExecucao];
    this.ndShowTipoExecucaoDropdown = this.ndTipoExecucaoFiltered.length > 0;
  }
  selecionarNdTipoExecucao(item: TipoExecucaoResult): void {
    this.nd.tipoExecucao = item.codigo; this.nd.tipoExecucaoSearch = `${item.codigo} - ${item.descricao}`;
    this.ndTipoExecucaoFiltered = []; this.ndShowTipoExecucaoDropdown = false;
  }
  fecharNdTipoExecucaoDropdown(): void { setTimeout(() => { this.ndShowTipoExecucaoDropdown = false; }, 150); }
}
