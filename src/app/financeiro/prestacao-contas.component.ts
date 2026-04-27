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
const CHV = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>`;

@Component({
  selector: 'app-prestacao-contas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [PrestacaoContasService],
  template: `
  <main class="h-full overflow-y-auto p-4 md:p-6 bg-gradient-to-br from-[#1A4E79] to-[#75C9C8]">
    <div class="max-w-full mx-auto px-4">
      <div class="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 overflow-hidden">

        <!-- Header -->
        <div class="bg-gradient-to-r from-[#1A4E79] to-[#75C9C8] p-4 md:p-6 rounded-t-lg flex items-center gap-4 border-b border-white/10">
          <div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
            <i class="po-icon po-icon-finance text-white text-xl"></i>
          </div>
          <div>
            <h1 class="text-white text-xl md:text-2xl font-bold leading-tight">Prestação de Contas</h1>
            <p class="text-white/80 text-xs md:text-sm mt-1">Cadastro de prestação de contas avulsa</p>
          </div>
        </div>

        <!-- Content -->
        <div class="p-4 md:p-6 max-h-[calc(100vh-160px)] overflow-y-auto space-y-6">

          <!-- ══════════════ CABEÇALHO ══════════════ -->
          <div class="bg-white rounded-lg p-6 md:p-8 border border-[#e6eef0] shadow-md w-full md:w-[90%] mx-auto">

            <!-- Header salvo banner -->
            <div *ngIf="headerSaved" class="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
              <svg class="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              Cabeçalho salvo — adicione as despesas abaixo.
            </div>

            <form #prestacaoForm="ngForm">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

                <!-- Código -->
                <div>
                  <label class="block text-sm font-semibold text-[#1A4E79] mb-1">Código da Prestação</label>
                  <input type="text" [value]="model.flf_presta" readonly
                    [placeholder]="isGeneratingCode ? 'Gerando...' : '—'"
                    class="w-full p-3 bg-gray-100 border border-[#e6eef0] rounded-lg shadow-inner" />
                </div>

                <!-- Tipo -->
                <div>
                  <label class="block text-sm font-semibold text-[#1A4E79] mb-1">Tipo de Prestação</label>
                  <input type="text" value="Avulsa" readonly
                    class="w-full p-3 bg-gray-100 border border-[#e6eef0] rounded-lg shadow-inner" />
                </div>

                <!-- ── Participante ── -->
                <div>
                  <label class="block text-sm font-semibold text-[#1A4E79] mb-1">Participante *</label>
                  <div class="${CW}">
                    <input type="text" name="codParticipante" [(ngModel)]="model.codParticipante" required
                      autocomplete="off" placeholder="Digite código ou nome..."
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
                  <label class="block text-sm font-semibold text-[#1A4E79] mb-1">Nome do Participante</label>
                  <input type="text" [value]="model.nomeParticipante" readonly placeholder="Preenchido ao selecionar"
                    class="w-full p-3 bg-gray-100 border border-[#e6eef0] rounded-lg shadow-inner" />
                </div>

                <!-- Datas -->
                <div>
                  <label class="block text-sm font-semibold text-[#1A4E79] mb-1">Data de Emissão *</label>
                  <input type="date" name="flf_emissa" [(ngModel)]="model.flf_emissa" required
                    class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-[#1A4E79] mb-1">Data de Saída</label>
                  <input type="date" name="flf_dtini" [(ngModel)]="model.flf_dtini"
                    class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-[#1A4E79] mb-1">Data de Chegada</label>
                  <input type="date" name="flf_dtfim" [(ngModel)]="model.flf_dtfim"
                    class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all" />
                </div>

                <!-- ── Item Contábil ── -->
                <div>
                  <label class="block text-sm font-medium text-[#1A4E79] mb-1">Item Contábil</label>
                  <div class="${CW}">
                    <input type="text" name="itemContabilSearch" [(ngModel)]="model.itemContabilSearch"
                      autocomplete="off" placeholder="Digite código ou descrição..."
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
                  <label class="block text-sm font-medium text-[#1A4E79] mb-1">Centro de Custo</label>
                  <div class="${CW}">
                    <input type="text" name="centroCustoSearch" [(ngModel)]="model.centroCustoSearch"
                      autocomplete="off" placeholder="Digite código ou descrição..."
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
                  <label class="block text-sm font-medium text-[#1A4E79] mb-1">Classe Valor</label>
                  <div class="${CW}">
                    <input type="text" name="classeValorSearch" [(ngModel)]="model.classeValorSearch"
                      autocomplete="off" placeholder="Digite código ou descrição..."
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

                <!-- Motivo -->
                <div>
                  <label class="block text-sm font-medium text-[#1A4E79] mb-1">
                    Motivo <span class="text-gray-400 font-normal text-xs ml-1">({{ (model.motivo || '').length }}/80)</span>
                  </label>
                  <textarea name="motivo" [(ngModel)]="model.motivo" maxlength="80" rows="3"
                    placeholder="Descreva o motivo da prestação..."
                    class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all shadow-sm resize-none"></textarea>
                </div>

                <!-- Percentuais -->
                <div class="md:col-span-2">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-[#1A4E79] mb-1">% Cliente</label>
                      <input type="number" name="flf_fatcli" [(ngModel)]="model.flf_fatcli" min="0" max="100"
                        [ngClass]="{'border-red-500': percentuaisInvalidos}"
                        class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-[#1A4E79] mb-1">% Empresa</label>
                      <input type="number" name="flf_fatemp" [(ngModel)]="model.flf_fatemp" min="0" max="100"
                        [ngClass]="{'border-red-500': percentuaisInvalidos}"
                        class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all" />
                    </div>
                  </div>
                  <small *ngIf="percentuaisInvalidos" class="text-red-600 mt-1 block">
                    % Cliente + % Empresa devem somar exatamente 100% (atual: {{ somaPercentuais }}%)
                  </small>
                </div>

                <!-- ── Cliente / Fornecedor ── -->
                <div>
                  <label class="block text-sm font-medium text-[#1A4E79] mb-1">Cliente / Fornecedor</label>
                  <div class="${CW}">
                    <input type="text" name="flf_clifor" [(ngModel)]="model.flf_clifor"
                      autocomplete="off" placeholder="Digite código ou nome..."
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
                <div>
                  <label class="block text-sm font-medium text-[#1A4E79] mb-1">Loja</label>
                  <input type="text" [value]="model.flf_floja" readonly placeholder="Preenchida ao selecionar"
                    class="w-full p-3 bg-gray-100 border border-[#e6eef0] rounded-lg shadow-inner" />
                </div>
                <div *ngIf="model.nomeCliente" class="md:col-span-2">
                  <label class="block text-sm font-medium text-[#1A4E79] mb-1">Nome do Cliente</label>
                  <input type="text" [value]="model.nomeCliente" readonly
                    class="w-full p-3 bg-gray-100 border border-[#e6eef0] rounded-lg shadow-inner" />
                </div>

              </div>
            </form>

            <!-- Ações do cabeçalho -->
            <div class="flex justify-end gap-3 mt-6">
              <button type="button" (click)="voltar()"
                class="px-4 py-2 border rounded text-[#1A4E79] border-[#75C9C8] bg-white hover:bg-[#e6eef0] transition-all">
                Voltar
              </button>
              <button *ngIf="headerSaved" type="button" (click)="novaPrestacao()"
                class="px-4 py-2 border rounded text-[#1A4E79] border-[#1A4E79] bg-white hover:bg-[#e6eef0] transition-all">
                Nova Prestação
              </button>
              <button type="button" (click)="salvar()" [disabled]="isSaving || percentuaisInvalidos || headerSaved"
                class="px-4 py-2 bg-gradient-to-r from-[#1A4E79] to-[#75C9C8] text-white rounded hover:shadow-lg disabled:opacity-50 transition-all">
                {{ isSaving ? 'Salvando...' : headerSaved ? '✓ Cabeçalho Salvo' : 'Salvar Cabeçalho' }}
              </button>
            </div>
          </div>

          <!-- ══════════════ DESPESAS ══════════════ -->
          <div class="bg-white rounded-lg p-6 md:p-8 border border-[#e6eef0] shadow-md w-full md:w-[90%] mx-auto"
            [class.opacity-50]="!headerSaved" [class.pointer-events-none]="!headerSaved">

            <!-- Grid header -->
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <i class="po-icon po-icon-list text-[#1A4E79] text-lg"></i>
                <h4 class="text-[#1A4E79] font-semibold">Despesas</h4>
                <span *ngIf="!headerSaved" class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Salve o cabeçalho primeiro</span>
              </div>
              <div class="flex items-center gap-4">
                <span class="text-sm text-gray-600">Total:
                  <strong class="text-[#1A4E79]">R$ {{ totalDespesas | number:'1.2-2' }}</strong>
                </span>
                <button type="button" (click)="abrirNovaDespesa()"
                  [disabled]="!headerSaved || showNovaDespesa"
                  class="px-3 py-1.5 bg-[#1A4E79] text-white rounded text-sm hover:bg-[#1A4E79]/80 disabled:opacity-40 transition-all">
                  + Despesa
                </button>
              </div>
            </div>

            <!-- Tabela de despesas salvas -->
            <div class="overflow-x-auto">
              <table class="w-full text-sm border-collapse">
                <thead>
                  <tr class="bg-[#e6eef0] text-[#1A4E79] text-xs">
                    <th class="p-2 text-left font-semibold">Item</th>
                    <th class="p-2 text-left font-semibold">Data</th>
                    <th class="p-2 text-left font-semibold">Tipo</th>
                    <th class="p-2 text-right font-semibold">Valor</th>
                    <th class="p-2 text-left font-semibold">Natureza</th>
                    <th class="p-2 text-left font-semibold">CC</th>
                    <th class="p-2 text-left font-semibold">Descrição</th>
                    <th class="p-2 text-center font-semibold">Anexos</th>
                    <th class="p-2 text-center font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let d of despesas" class="border-b border-gray-100 hover:bg-gray-50 text-xs">
                    <td class="p-2 text-[#1A4E79] font-semibold">{{ d.item }}</td>
                    <td class="p-2">{{ d.data }}</td>
                    <td class="p-2">{{ d.tipoDesp }}</td>
                    <td class="p-2 text-right font-medium">R$ {{ d.valor | number:'1.2-2' }}</td>
                    <td class="p-2">{{ d.natureza }}</td>
                    <td class="p-2">{{ d.cc }}</td>
                    <td class="p-2 truncate max-w-[150px]" [title]="d.descricao">{{ d.descricao }}</td>
                    <td class="p-2 text-center">
                      <span class="text-gray-500">{{ d.qtdAnexos }} arq.</span>
                    </td>
                    <td class="p-2 text-center">
                      <button type="button" (click)="confirmarExcluirDespesa(d)"
                        class="text-red-400 hover:text-red-600 transition-colors" title="Excluir despesa">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="despesas.length === 0 && !isLoadingDespesas">
                    <td colspan="9" class="p-6 text-center text-gray-400 text-sm">Nenhuma despesa cadastrada</td>
                  </tr>
                  <tr *ngIf="isLoadingDespesas">
                    <td colspan="9" class="p-6 text-center text-[#75C9C8] text-sm">Carregando...</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- ── Formulário de nova despesa ── -->
            <div *ngIf="showNovaDespesa" class="mt-4 p-4 bg-[#e6eef0]/40 rounded-lg border border-[#75C9C8]/30">
              <h5 class="text-sm font-semibold text-[#1A4E79] mb-3">Nova Despesa</h5>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">

                <!-- Data -->
                <div>
                  <label class="block text-xs font-medium text-[#1A4E79] mb-1">Data *</label>
                  <input type="date" [(ngModel)]="nd.data"
                    class="w-full p-2 text-sm border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all" />
                </div>

                <!-- Tipo Despesa -->
                <div>
                  <label class="block text-xs font-medium text-[#1A4E79] mb-1">Tipo de Despesa</label>
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

                <!-- Valor -->
                <div>
                  <label class="block text-xs font-medium text-[#1A4E79] mb-1">Valor *</label>
                  <input type="number" [(ngModel)]="nd.valor" min="0.01" step="0.01"
                    class="w-full p-2 text-sm border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all" />
                </div>

                <!-- Natureza -->
                <div>
                  <label class="block text-xs font-medium text-[#1A4E79] mb-1">Natureza *</label>
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

                <!-- Centro de Custo (despesa) -->
                <div>
                  <label class="block text-xs font-medium text-[#1A4E79] mb-1">Centro de Custo</label>
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

                <!-- Item Contábil (despesa) -->
                <div>
                  <label class="block text-xs font-medium text-[#1A4E79] mb-1">Item Contábil</label>
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

                <!-- Descrição -->
                <div class="md:col-span-2">
                  <label class="block text-xs font-medium text-[#1A4E79] mb-1">Descrição *</label>
                  <input type="text" [(ngModel)]="nd.descricao" maxlength="100" placeholder="Descreva a despesa..."
                    class="w-full p-2 text-sm border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all" />
                </div>

                <!-- Documento -->
                <div>
                  <label class="block text-xs font-medium text-[#1A4E79] mb-1">Documento</label>
                  <input type="text" [(ngModel)]="nd.doc" maxlength="20" placeholder="Nº do documento..."
                    class="w-full p-2 text-sm border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all" />
                </div>

                <!-- Anexos -->
                <div class="md:col-span-3">
                  <label class="block text-xs font-medium text-[#1A4E79] mb-1">Comprovantes (jpg, png, pdf)</label>
                  <div class="flex items-center gap-3 flex-wrap">
                    <label class="cursor-pointer px-3 py-1.5 border border-[#75C9C8] text-[#1A4E79] rounded text-xs hover:bg-[#e6eef0] transition-all">
                      Anexar arquivo
                      <input type="file" (change)="onFileSelected($event)" accept=".jpg,.jpeg,.png,.pdf" multiple hidden />
                    </label>
                    <div *ngFor="let f of pendingFiles; let i = index"
                      class="flex items-center gap-1 bg-[#e6eef0] rounded px-2 py-1 text-xs text-[#1A4E79]">
                      <span>{{ f.name }}</span>
                      <button type="button" (click)="removerArquivo(i)" class="text-red-400 hover:text-red-600 ml-1">×</button>
                    </div>
                    <span *ngIf="pendingFiles.length === 0" class="text-xs text-gray-400">Nenhum arquivo selecionado</span>
                  </div>
                </div>

              </div>

              <!-- Erros da despesa -->
              <p *ngIf="erroDespesa" class="mt-2 text-red-600 text-xs">{{ erroDespesa }}</p>

              <!-- Ações da despesa -->
              <div class="flex justify-end gap-2 mt-4">
                <button type="button" (click)="cancelarNovaDespesa()"
                  class="px-3 py-1.5 border rounded text-xs text-[#1A4E79] border-[#75C9C8] bg-white hover:bg-[#e6eef0] transition-all">
                  Cancelar
                </button>
                <button type="button" (click)="salvarDespesa()" [disabled]="isSavingDespesa"
                  class="px-3 py-1.5 bg-[#1A4E79] text-white rounded text-xs hover:bg-[#1A4E79]/80 disabled:opacity-50 transition-all">
                  {{ isSavingDespesa ? 'Salvando...' : 'Salvar Despesa' }}
                </button>
              </div>
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
