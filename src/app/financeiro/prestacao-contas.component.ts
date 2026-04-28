import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, of, firstValueFrom } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
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
  TipoDespResult,
  NaturezaResult,
  DespesaRow
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
  <div *ngIf="isSaving || isSavingDespesa"
    class="fixed inset-0 bg-[#1A4E79]/70 backdrop-blur-sm z-[9999] flex items-center justify-center">
    <div class="bg-white rounded-xl p-6 shadow-2xl text-center min-w-[160px]">
      <div class="w-10 h-10 border-4 border-[#75C9C8]/30 border-t-[#1A4E79] rounded-full mx-auto mb-3 animate-spin"></div>
      <p class="text-sm font-semibold text-[#1A4E79]">{{ isSavingDespesa ? 'Salvando despesa...' : 'Salvando...' }}</p>
    </div>
  </div>

  <main class="h-full flex flex-col bg-gradient-to-br from-[#1A4E79] to-[#75C9C8] overflow-hidden">

    <!-- ── Cabeçalho fixo da página ── -->
    <div class="flex-shrink-0 px-4 md:px-6 pt-4 md:pt-6 pb-3">
      <div class="max-w-5xl mx-auto">
        <h1 class="text-xl md:text-2xl font-bold text-white mb-3">Prestação de Contas</h1>
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
            <div class="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1">
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
              <div class="min-w-0">
                <div class="text-[10px] text-gray-400 uppercase tracking-wide">Motivo</div>
                <div class="text-sm text-gray-700 truncate">{{ model.motivo || '—' }}</div>
              </div>
            </div>
            <div class="flex gap-2 flex-shrink-0">
              <button type="button" (click)="voltar()"
                class="px-3 py-1.5 text-xs border border-[#75C9C8]/40 rounded-lg text-[#1A4E79] hover:bg-[#e6eef0] transition-all">
                Voltar
              </button>
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
            <span *ngIf="model.flf_presta" class="ml-auto text-xs font-mono bg-[#1A4E79]/10 text-[#1A4E79] px-2 py-1 rounded font-semibold">
              {{ isGeneratingCode ? '...' : model.flf_presta }}
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
                  <label class="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Saída</label>
                  <input type="date" name="flf_dtini" [(ngModel)]="model.flf_dtini"
                    class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Chegada</label>
                  <input type="date" name="flf_dtfim" [(ngModel)]="model.flf_dtfim"
                    class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all text-sm" />
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
                <label class="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  Motivo <span class="normal-case font-normal text-gray-300">({{ (model.motivo || '').length }}/80)</span>
                </label>
                <textarea name="motivo" [(ngModel)]="model.motivo" maxlength="80" rows="3"
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
              <button type="button" (click)="voltar()"
                class="px-4 py-2 text-sm border border-[#75C9C8]/40 rounded-lg text-[#1A4E79] hover:bg-[#e6eef0] transition-all">
                Voltar
              </button>
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

                <div>
                  <label class="block text-xs font-semibold text-[#1A4E79] mb-1 uppercase tracking-wide">Data *</label>
                  <input type="date" [(ngModel)]="nd.data"
                    class="w-full p-2 text-sm border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all" />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-[#1A4E79] mb-1 uppercase tracking-wide">Tipo de Despesa</label>
                  <div class="${CW}">
                    <input type="text" [(ngModel)]="nd.tipoDespSearch" autocomplete="off" placeholder="Buscar tipo..."
                      (ngModelChange)="onNdTipoDespInput($event)" (blur)="fecharNdTipoDespDropdown()"
                      class="flex-1 min-w-0 p-2 text-sm border border-[#75C9C8]/30 rounded-l-lg focus:outline-none transition-all" />
                    <button type="button" (mousedown)="toggleNdTipoDespDropdown($event)" class="${CB}">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                    </button>
                    <div *ngIf="ndShowTipoDespDropdown && ndTipoDespFiltered.length > 0" class="${DD}">
                      <div *ngFor="let t of ndTipoDespFiltered" (mousedown)="selecionarNdTipoDesp(t)" class="${DI}">
                        <span class="font-semibold text-[#1A4E79] shrink-0">{{ t.codigo }}</span>
                        <span class="text-gray-500 truncate">{{ t.descricao }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-[#1A4E79] mb-1 uppercase tracking-wide">Valor *</label>
                  <input type="number" [(ngModel)]="nd.valor" min="0.01" step="0.01"
                    class="w-full p-2 text-sm border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all" />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-[#1A4E79] mb-1 uppercase tracking-wide">Natureza *</label>
                  <div class="${CW}">
                    <input type="text" [(ngModel)]="nd.naturezaSearch" autocomplete="off" placeholder="Buscar natureza..."
                      (ngModelChange)="onNdNaturezaInput($event)" (blur)="fecharNdNaturezaDropdown()"
                      class="flex-1 min-w-0 p-2 text-sm border border-[#75C9C8]/30 rounded-l-lg focus:outline-none transition-all" />
                    <button type="button" (mousedown)="toggleNdNaturezaDropdown($event)" class="${CB}">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                    </button>
                    <div *ngIf="ndShowNaturezaDropdown && ndNaturezaFiltered.length > 0" class="${DD}">
                      <div *ngFor="let n of ndNaturezaFiltered" (mousedown)="selecionarNdNatureza(n)" class="${DI}">
                        <span class="font-semibold text-[#1A4E79] shrink-0">{{ n.codigo }}</span>
                        <span class="text-gray-500 truncate">{{ n.descricao }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-[#1A4E79] mb-1 uppercase tracking-wide">Centro de Custo</label>
                  <div class="${CW}">
                    <input type="text" [(ngModel)]="nd.ccSearch" autocomplete="off" placeholder="Buscar CC..."
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

                <div>
                  <label class="block text-xs font-semibold text-[#1A4E79] mb-1 uppercase tracking-wide">Item Contábil</label>
                  <div class="${CW}">
                    <input type="text" [(ngModel)]="nd.itemCtbSearch" autocomplete="off" placeholder="Buscar item..."
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

                <div class="md:col-span-2">
                  <label class="block text-xs font-semibold text-[#1A4E79] mb-1 uppercase tracking-wide">Descrição *</label>
                  <input type="text" [(ngModel)]="nd.descricao" maxlength="100" placeholder="Descreva a despesa..."
                    class="w-full p-2 text-sm border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all" />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-[#1A4E79] mb-1 uppercase tracking-wide">Documento</label>
                  <input type="text" [(ngModel)]="nd.doc" maxlength="20" placeholder="Nº do documento..."
                    class="w-full p-2 text-sm border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all" />
                </div>

                <div class="md:col-span-3">
                  <label class="block text-xs font-semibold text-[#1A4E79] mb-1 uppercase tracking-wide">Comprovantes</label>
                  <div class="flex items-center gap-2 flex-wrap">
                    <label class="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 border border-[#75C9C8]/40 text-[#1A4E79] rounded-lg text-xs hover:bg-[#e6eef0] transition-all">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                      Anexar arquivo
                      <input type="file" (change)="onFileSelected($event)" accept=".jpg,.jpeg,.png,.pdf" multiple hidden />
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
                <button type="button" (click)="salvarDespesa()" [disabled]="isSavingDespesa"
                  class="px-4 py-1.5 text-xs bg-gradient-to-r from-[#1A4E79] to-[#75C9C8] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all font-semibold">
                  {{ isSavingDespesa ? 'Salvando...' : 'Confirmar Despesa' }}
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
                    <span class="text-sm font-semibold text-[#1A4E79]">{{ d.tipoDesp || 'Despesa' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-[#1A4E79]">R$ {{ d.valor | number:'1.2-2' }}</span>
                    <button type="button" (click)="confirmarExcluirDespesa(d)"
                      class="p-1.5 rounded text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                    </button>
                  </div>
                </div>
                <div class="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div><span class="text-gray-400">Data</span><div class="text-gray-700 font-medium">{{ d.data }}</div></div>
                  <div><span class="text-gray-400">Natureza</span><div class="text-gray-700">{{ d.natureza || '—' }}</div></div>
                  <div><span class="text-gray-400">Centro de Custo</span><div class="text-gray-700">{{ d.cc || '—' }}</div></div>
                  <div><span class="text-gray-400">Anexos</span><div class="text-gray-700">{{ d.qtdAnexos }} arq.</div></div>
                  <div class="col-span-2"><span class="text-gray-400">Descrição</span><div class="text-gray-700 break-words">{{ d.descricao || '—' }}</div></div>
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
                    <th class="px-3 py-2.5 text-left font-semibold uppercase tracking-wide">Tipo</th>
                    <th class="px-3 py-2.5 text-right font-semibold uppercase tracking-wide">Valor</th>
                    <th class="px-3 py-2.5 text-left font-semibold uppercase tracking-wide">Natureza</th>
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
                    <td class="px-3 py-2.5 text-gray-700">{{ d.tipoDesp }}</td>
                    <td class="px-3 py-2.5 text-right font-semibold text-[#1A4E79]">R$ {{ d.valor | number:'1.2-2' }}</td>
                    <td class="px-3 py-2.5 text-gray-600">{{ d.natureza }}</td>
                    <td class="px-3 py-2.5 text-gray-600">{{ d.cc }}</td>
                    <td class="px-3 py-2.5 text-gray-600 max-w-[180px] truncate" [title]="d.descricao">{{ d.descricao }}</td>
                    <td class="px-3 py-2.5 text-center text-gray-500">{{ d.qtdAnexos }}</td>
                    <td class="px-3 py-2.5 text-center">
                      <button type="button" (click)="confirmarExcluirDespesa(d)"
                        class="p-1.5 rounded text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="despesas.length === 0 && !showNovaDespesa">
                    <td colspan="9" class="px-3 py-10 text-center text-gray-400 text-sm">
                      <svg class="w-8 h-8 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                      Nenhuma despesa cadastrada
                    </td>
                  </tr>
                </tbody>
                <tfoot *ngIf="despesas.length > 0" class="border-t-2 border-[#E6EEF2]">
                  <tr class="bg-[#f8fdfd]">
                    <td colspan="3" class="px-3 py-2.5 text-xs font-semibold text-[#1A4E79]">
                      Total ({{ despesas.length }} despesa{{ despesas.length !== 1 ? 's' : '' }})
                    </td>
                    <td class="px-3 py-2.5 text-right text-sm font-bold text-[#1A4E79]">R$ {{ totalDespesas | number:'1.2-2' }}</td>
                    <td colspan="5"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

          </div>
        </div>

      </div>
    </div>
  </main>
  `
})
export class PrestacaoContasComponent implements OnInit, OnDestroy {

  // ── Estado do cabeçalho ─────────────────────────────────────────────────────
  model: any = {};
  isGeneratingCode  = false;
  isSaving          = false;
  headerSaved       = false;

  // Combobox via API — participante
  participanteResults: ParticipanteResult[] = [];
  showParticipanteDropdown = false;
  isLoadingParticipante    = false;
  private participanteSearch$ = new Subject<string>();
  private participanteSub?: Subscription;

  // Combobox via API — cliente/fornecedor
  clienteResults: ClienteResult[] = [];
  showClienteDropdown = false;
  isLoadingCliente    = false;
  private clienteSearch$ = new Subject<string>();
  private clienteSub?: Subscription;

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
  isLoadingDespesas = false;
  showNovaDespesa   = false;
  isSavingDespesa   = false;
  erroDespesa       = '';
  pendingFiles:     File[] = [];

  nd: any = {}; // nova despesa form

  tiposDesp: TipoDespResult[] = [];
  naturezas: NaturezaResult[] = [];

  // Combobox local — nova despesa (nd = nova despesa)
  ndTipoDespFiltered: TipoDespResult[]   = [];
  ndShowTipoDespDropdown = false;
  ndNaturezaFiltered:  NaturezaResult[]  = [];
  ndShowNaturezaDropdown = false;
  ndCCFiltered:        CentroCustoResult[] = [];
  ndShowCCDropdown     = false;
  ndItemCtbFiltered:   ItemContabilResult[] = [];
  ndShowItemCtbDropdown = false;

  constructor(
    private prestacaoService: PrestacaoContasService,
    private despesaService: DespesaService
  ) {}

  ngOnInit(): void {
    this.initModel();
    this.gerarCodigo();
    this.carregarListasCabecalho();
    this.carregarListasDespesa();
    this.initAutocomplete();
  }

  ngOnDestroy(): void {
    this.participanteSub?.unsubscribe();
    this.clienteSub?.unsubscribe();
  }

  get somaPercentuais(): number {
    return (Number(this.model.flf_fatcli) || 0) + (Number(this.model.flf_fatemp) || 0);
  }

  get percentuaisInvalidos(): boolean {
    const s = this.somaPercentuais;
    return s > 0 && s !== 100;
  }

  get totalDespesas(): number {
    return this.despesas.reduce((acc, d) => acc + d.valor, 0);
  }

  // ── Inicialização ───────────────────────────────────────────────────────────

  private initAutocomplete(): void {
    this.participanteSub = this.participanteSearch$.pipe(
      debounceTime(300), distinctUntilChanged(),
      switchMap(t => { if (t.length < 2) return of([]); this.isLoadingParticipante = true; return this.prestacaoService.buscarParticipantePorTermo(t); })
    ).subscribe({
      next: r => { this.participanteResults = r; this.showParticipanteDropdown = r.length > 0; this.isLoadingParticipante = false; },
      error: () => { this.isLoadingParticipante = false; }
    });

    this.clienteSub = this.clienteSearch$.pipe(
      debounceTime(300), distinctUntilChanged(),
      switchMap(t => { if (t.length < 2) return of([]); this.isLoadingCliente = true; return this.prestacaoService.buscarClientePorTermo(t); })
    ).subscribe({
      next: r => { this.clienteResults = r; this.showClienteDropdown = r.length > 0; this.isLoadingCliente = false; },
      error: () => { this.isLoadingCliente = false; }
    });
  }

  private carregarListasCabecalho(): void {
    this.prestacaoService.listarItensContabeis().subscribe({ next: i => this.itensContabeis = i, error: () => {} });
    this.prestacaoService.listarCentrosCusto().subscribe({   next: i => this.centrosCusto = i,   error: () => {} });
    this.prestacaoService.listarClassesValor().subscribe({   next: i => this.classesValor = i,    error: () => {} });
  }

  private carregarListasDespesa(): void {
    this.despesaService.listarTiposDesp().subscribe({ next: i => this.tiposDesp = i, error: () => {} });
    this.despesaService.listarNaturezas().subscribe({ next: i => this.naturezas = i, error: () => {} });
  }

  initModel(): void {
    this.model = {
      flf_tipo: '2', flf_presta: '',
      codParticipante: '', nomeParticipante: '',
      flf_emissa: '', flf_dtini: '', flf_dtfim: '',
      itemContabilSearch: '', itemContabil: '',
      centroCustoSearch: '', centroCusto: '',
      classeValorSearch: '', classeValor: '',
      motivo: '', flf_fatcli: 0, flf_fatemp: 0,
      flf_clifor: '', flf_floja: '', nomeCliente: ''
    };
  }

  private initNd(): void {
    this.nd = { data: '', tipoDespSearch: '', tipoDesp: '', valor: 0,
      naturezaSearch: '', natureza: '', ccSearch: '', cc: '',
      itemCtbSearch: '', itemCtb: '', descricao: '', doc: '' };
    this.pendingFiles = [];
    this.erroDespesa  = '';
    this.ndTipoDespFiltered = [];  this.ndShowTipoDespDropdown = false;
    this.ndNaturezaFiltered = [];  this.ndShowNaturezaDropdown = false;
    this.ndCCFiltered       = [];  this.ndShowCCDropdown       = false;
    this.ndItemCtbFiltered  = [];  this.ndShowItemCtbDropdown  = false;
  }

  gerarCodigo(): void {
    this.isGeneratingCode = true;
    this.prestacaoService.gerarCodigoPrestacao().subscribe({
      next: c => { this.model.flf_presta = c; this.isGeneratingCode = false; },
      error: () => { this.isGeneratingCode = false; }
    });
  }

  // ── Ações do cabeçalho ──────────────────────────────────────────────────────

  voltar(): void { try { window.history.back(); } catch {} }

  novaPrestacao(): void {
    this.headerSaved = false;
    this.despesas = [];
    this.showNovaDespesa = false;
    this.initModel();
    this.gerarCodigo();
  }

  salvar(): void {
    if (!this.model.flf_presta || !this.model.codParticipante?.trim() || !this.model.flf_emissa) {
      alert('Preencha todos os campos obrigatórios marcados com *.');
      return;
    }
    if (this.percentuaisInvalidos) {
      alert('% Cliente + % Empresa devem somar exatamente 100%.');
      return;
    }

    this.isSaving = true;
    const payload = {
      FLF_TIPO:   this.model.flf_tipo,
      FLF_PRESTA: this.model.flf_presta,
      FLF_PARTIC: this.model.codParticipante,
      FLF_EMISSA: this.model.flf_emissa,
      FLF_DTINI:  this.model.flf_dtini,
      FLF_DTFIM:  this.model.flf_dtfim,
      FLF_CC:     this.model.centroCusto,
      FLF_ITCTB:  this.model.itemContabil,
      FLF_CLVL:   this.model.classeValor,
      FLF_MOTIVO: this.model.motivo,
      FLF_FATCLI: Number(this.model.flf_fatcli) || 0,
      FLF_FATEMP: Number(this.model.flf_fatemp) || 0,
      FLF_CLIFOR: this.model.flf_clifor,
      FLF_FLOJA:  this.model.flf_floja
    };

    this.prestacaoService.salvarPrestacao(payload).subscribe({
      next: () => { this.isSaving = false; this.headerSaved = true; },
      error: (err: Error) => { this.isSaving = false; alert(`Erro ao salvar: ${err.message}`); }
    });
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
    if (!input.files) return;
    const allowed = ['jpg', 'jpeg', 'png', 'pdf'];
    Array.from(input.files).forEach(f => {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      if (allowed.includes(ext)) {
        this.pendingFiles = [...this.pendingFiles, f];
      } else {
        alert(`Arquivo "${f.name}" não permitido. Use jpg, png ou pdf.`);
      }
    });
    input.value = '';
  }

  removerArquivo(index: number): void {
    this.pendingFiles = this.pendingFiles.filter((_, i) => i !== index);
  }

  async salvarDespesa(): Promise<void> {
    if (!this.nd.data || this.nd.valor <= 0 || !this.nd.natureza || !this.nd.descricao?.trim()) {
      this.erroDespesa = 'Preencha os campos obrigatórios: Data, Valor, Natureza e Descrição.';
      return;
    }

    this.erroDespesa    = '';
    this.isSavingDespesa = true;

    try {
      const resp = await firstValueFrom(this.despesaService.inserirDespesa({
        FLE_PRESTA:  this.model.flf_presta,
        FLE_DATA:    this.nd.data,
        FLE_TPDESP:  this.nd.tipoDesp,
        FLE_VALOR:   Number(this.nd.valor),
        FLE_MOEDA:   '01',
        FLE_NATUREZ: this.nd.natureza,
        FLE_CC:      this.nd.cc,
        FLE_ITEMCTA: this.nd.itemCtb,
        FLE_DESC:    this.nd.descricao,
        FLE_DOC:     this.nd.doc
      }));

      if (!resp?.success) {
        this.erroDespesa = resp?.message || 'Erro ao salvar despesa.';
        this.isSavingDespesa = false;
        return;
      }

      const nItem = resp.item as number;

      for (const file of this.pendingFiles) {
        const base64 = await this.fileToBase64(file);
        const ext    = file.name.split('.').pop()?.toLowerCase() || '';
        await firstValueFrom(this.despesaService.uploadAnexo({
          presta: this.model.flf_presta,
          item:   nItem,
          nome:   file.name,
          tipo:   ext,
          arquivo: base64
        })).catch(() => {});
      }

      this.showNovaDespesa  = false;
      this.isSavingDespesa  = false;
      this.initNd();
      this.recarregarDespesas();
    } catch (err: any) {
      this.erroDespesa    = err?.message || 'Erro inesperado ao salvar despesa.';
      this.isSavingDespesa = false;
    }
  }

  confirmarExcluirDespesa(d: DespesaRow): void {
    if (!confirm(`Excluir despesa ${d.item} — ${d.descricao}?`)) return;
    this.despesaService.excluirDespesa(this.model.flf_presta, d.item).subscribe({
      next: () => this.recarregarDespesas(),
      error: (err: Error) => alert(`Erro ao excluir: ${err.message}`)
    });
  }

  private recarregarDespesas(): void {
    if (!this.model.flf_presta) return;
    this.isLoadingDespesas = true;
    this.despesaService.listarDespesas(this.model.flf_presta).subscribe({
      next: rows => { this.despesas = rows; this.isLoadingDespesas = false; },
      error: () => { this.isLoadingDespesas = false; }
    });
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

  // ── Participante (API) ───────────────────────────────────────────────────────

  onParticipanteInput(v: string): void {
    this.model.nomeParticipante = '';
    if (!v?.trim()) { this.showParticipanteDropdown = false; this.participanteResults = []; return; }
    this.participanteSearch$.next(v);
  }
  toggleParticipanteDropdown(e: MouseEvent): void {
    e.preventDefault();
    this.showParticipanteDropdown = !this.showParticipanteDropdown && this.participanteResults.length > 0;
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

  // ── Centro de Custo (local) ──────────────────────────────────────────────────

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
    this.clienteSearch$.next(v);
  }
  toggleClienteDropdown(e: MouseEvent): void {
    e.preventDefault();
    this.showClienteDropdown = !this.showClienteDropdown && this.clienteResults.length > 0;
  }
  selecionarCliente(item: ClienteResult): void {
    this.model.flf_clifor = item.codigo; this.model.flf_floja = item.loja; this.model.nomeCliente = item.nome;
    this.clienteResults = []; this.showClienteDropdown = false;
  }
  fecharClienteDropdown(): void { setTimeout(() => { this.showClienteDropdown = false; }, 150); }

  // ── Comboboxes da nova despesa ───────────────────────────────────────────────

  onNdTipoDespInput(v: string): void {
    this.nd.tipoDesp = '';
    if (!v?.trim()) { this.ndShowTipoDespDropdown = false; this.ndTipoDespFiltered = []; return; }
    this.ndTipoDespFiltered = this.filtrar(this.tiposDesp, v);
    this.ndShowTipoDespDropdown = this.ndTipoDespFiltered.length > 0;
  }
  toggleNdTipoDespDropdown(e: MouseEvent): void {
    e.preventDefault();
    if (this.ndShowTipoDespDropdown) { this.ndShowTipoDespDropdown = false; return; }
    const t = (this.nd.tipoDespSearch || '').trim();
    this.ndTipoDespFiltered = t ? this.filtrar(this.tiposDesp, t) : [...this.tiposDesp];
    this.ndShowTipoDespDropdown = this.ndTipoDespFiltered.length > 0;
  }
  selecionarNdTipoDesp(item: TipoDespResult): void {
    this.nd.tipoDesp = item.codigo; this.nd.tipoDespSearch = `${item.codigo} - ${item.descricao}`;
    this.ndTipoDespFiltered = []; this.ndShowTipoDespDropdown = false;
  }
  fecharNdTipoDespDropdown(): void { setTimeout(() => { this.ndShowTipoDespDropdown = false; }, 150); }

  onNdNaturezaInput(v: string): void {
    this.nd.natureza = '';
    if (!v?.trim()) { this.ndShowNaturezaDropdown = false; this.ndNaturezaFiltered = []; return; }
    this.ndNaturezaFiltered = this.filtrar(this.naturezas, v);
    this.ndShowNaturezaDropdown = this.ndNaturezaFiltered.length > 0;
  }
  toggleNdNaturezaDropdown(e: MouseEvent): void {
    e.preventDefault();
    if (this.ndShowNaturezaDropdown) { this.ndShowNaturezaDropdown = false; return; }
    const t = (this.nd.naturezaSearch || '').trim();
    this.ndNaturezaFiltered = t ? this.filtrar(this.naturezas, t) : [...this.naturezas];
    this.ndShowNaturezaDropdown = this.ndNaturezaFiltered.length > 0;
  }
  selecionarNdNatureza(item: NaturezaResult): void {
    this.nd.natureza = item.codigo; this.nd.naturezaSearch = `${item.codigo} - ${item.descricao}`;
    this.ndNaturezaFiltered = []; this.ndShowNaturezaDropdown = false;
  }
  fecharNdNaturezaDropdown(): void { setTimeout(() => { this.ndShowNaturezaDropdown = false; }, 150); }

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
}
