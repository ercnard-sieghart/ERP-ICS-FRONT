import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import {
  PrestacaoContasService,
  ParticipanteResult,
  ClienteResult,
  ItemContabilResult,
  CentroCustoResult,
  ClasseValorResult
} from './services/prestacao-contas.service';

const COMBOBOX_INPUT = 'flex-1 min-w-0 p-3 border border-[#75C9C8]/30 rounded-l-lg focus:outline-none transition-all';
const COMBOBOX_BTN   = 'shrink-0 px-2.5 border border-l-0 border-[#75C9C8]/30 rounded-r-lg bg-white hover:bg-[#e6eef0] text-[#1A4E79] transition-all flex items-center justify-center';
const COMBOBOX_WRAP  = 'relative flex focus-within:ring-2 focus-within:ring-[#75C9C8] rounded-lg shadow-sm';
const DROPDOWN       = 'absolute z-20 top-full w-full bg-white border border-[#75C9C8]/30 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto';
const DROPDOWN_ITEM  = 'px-3 py-2 hover:bg-[#e6eef0] cursor-pointer text-sm border-b border-gray-100 last:border-0 flex gap-2';


@Component({
  selector: 'app-prestacao-contas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [PrestacaoContasService],
  template: `
  <main class="min-h-screen p-4 md:p-6 bg-gradient-to-br from-[#1A4E79] to-[#75C9C8]">
    <div class="max-w-full mx-auto px-4">
      <div class="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 overflow-hidden">

        <!-- Header -->
        <div class="bg-gradient-to-r from-[#1A4E79] to-[#75C9C8] p-4 md:p-6 rounded-t-lg flex items-center justify-between border-b border-white/10">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shadow-inner border border-white/10">
              <i class="po-icon po-icon-finance text-white text-xl"></i>
            </div>
            <div>
              <h1 class="text-white text-xl md:text-2xl font-bold leading-tight">Prestação de Contas</h1>
              <p class="text-white/80 text-xs md:text-sm mt-1">Cadastro de prestação de contas avulsa</p>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-4 md:p-6 max-h-[calc(100vh-160px)] overflow-y-auto">
          <div class="grid grid-cols-1 gap-6">

            <!-- Main Form -->
            <div class="bg-white rounded-lg p-6 md:p-8 border border-[#e6eef0] shadow-md w-full md:w-[90%] mx-auto">
              <form #prestacaoForm="ngForm">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <!-- Código da Prestação -->
                  <div>
                    <label class="block text-sm font-semibold text-[#1A4E79] mb-1">Código da Prestação</label>
                    <input type="text" [value]="model.flf_presta" readonly
                      [placeholder]="isGeneratingCode ? 'Gerando...' : '—'"
                      class="w-full p-3 bg-gray-100 border border-[#e6eef0] rounded-lg shadow-inner" />
                  </div>

                  <!-- Tipo de Prestação -->
                  <div>
                    <label class="block text-sm font-semibold text-[#1A4E79] mb-1">Tipo de Prestação</label>
                    <input type="text" value="Avulsa" readonly
                      class="w-full p-3 bg-gray-100 border border-[#e6eef0] rounded-lg shadow-inner" />
                  </div>

                  <!-- ── Participante (combobox via API) ───────────────────── -->
                  <div>
                    <label class="block text-sm font-semibold text-[#1A4E79] mb-1">Participante *</label>
                    <div class="${COMBOBOX_WRAP}">
                      <input type="text" name="codParticipante" [(ngModel)]="model.codParticipante" required
                        autocomplete="off" placeholder="Digite código ou nome..."
                        (ngModelChange)="onParticipanteInput($event)"
                        (blur)="fecharParticipanteDropdown()"
                        class="${COMBOBOX_INPUT}" />
                      <button type="button" (mousedown)="toggleParticipanteDropdown($event)" class="${COMBOBOX_BTN}">
                        <svg *ngIf="!isLoadingParticipante" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                        </svg>
                        <svg *ngIf="isLoadingParticipante" class="animate-spin h-4 w-4 text-[#75C9C8]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                      </button>
                      <div *ngIf="showParticipanteDropdown && participanteResults.length > 0" class="${DROPDOWN}">
                        <div *ngFor="let r of participanteResults"
                          (mousedown)="selecionarParticipante(r)" class="${DROPDOWN_ITEM}">
                          <span class="font-semibold text-[#1A4E79] shrink-0">{{ r.codigo }}</span>
                          <span class="text-gray-500 truncate">{{ r.nome }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Nome do Participante -->
                  <div>
                    <label class="block text-sm font-semibold text-[#1A4E79] mb-1">Nome do Participante</label>
                    <input type="text" [value]="model.nomeParticipante" readonly
                      placeholder="Preenchido ao selecionar"
                      class="w-full p-3 bg-gray-100 border border-[#e6eef0] rounded-lg shadow-inner" />
                  </div>

                  <!-- Data de Emissão -->
                  <div>
                    <label class="block text-sm font-semibold text-[#1A4E79] mb-1">Data de Emissão *</label>
                    <input type="date" name="flf_emissa" [(ngModel)]="model.flf_emissa" required
                      class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all" />
                  </div>

                  <!-- Data de Saída -->
                  <div>
                    <label class="block text-sm font-medium text-[#1A4E79] mb-1">Data de Saída</label>
                    <input type="date" name="flf_dtini" [(ngModel)]="model.flf_dtini"
                      class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all" />
                  </div>

                  <!-- Data de Chegada -->
                  <div>
                    <label class="block text-sm font-medium text-[#1A4E79] mb-1">Data de Chegada</label>
                    <input type="date" name="flf_dtfim" [(ngModel)]="model.flf_dtfim"
                      class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all" />
                  </div>

                  <!-- ── Item Contábil (combobox local) ───────────────────── -->
                  <div>
                    <label class="block text-sm font-medium text-[#1A4E79] mb-1">Item Contábil</label>
                    <div class="${COMBOBOX_WRAP}">
                      <input type="text" name="itemContabilSearch" [(ngModel)]="model.itemContabilSearch"
                        autocomplete="off" placeholder="Digite código ou descrição..."
                        (ngModelChange)="onItemContabilInput($event)"
                        (blur)="fecharItemContabilDropdown()"
                        class="${COMBOBOX_INPUT}" />
                      <button type="button" (mousedown)="toggleItemContabilDropdown($event)" class="${COMBOBOX_BTN}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                        </svg>
                      </button>
                      <div *ngIf="showItemContabilDropdown && itemContabilFiltered.length > 0" class="${DROPDOWN}">
                        <div *ngFor="let it of itemContabilFiltered"
                          (mousedown)="selecionarItemContabil(it)" class="${DROPDOWN_ITEM}">
                          <span class="font-semibold text-[#1A4E79] shrink-0">{{ it.codigo }}</span>
                          <span class="text-gray-500 truncate">{{ it.descricao }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- ── Centro de Custo (combobox local) ─────────────────── -->
                  <div>
                    <label class="block text-sm font-medium text-[#1A4E79] mb-1">Centro de Custo</label>
                    <div class="${COMBOBOX_WRAP}">
                      <input type="text" name="centroCustoSearch" [(ngModel)]="model.centroCustoSearch"
                        autocomplete="off" placeholder="Digite código ou descrição..."
                        (ngModelChange)="onCentroCustoInput($event)"
                        (blur)="fecharCentroCustoDropdown()"
                        class="${COMBOBOX_INPUT}" />
                      <button type="button" (mousedown)="toggleCentroCustoDropdown($event)" class="${COMBOBOX_BTN}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                        </svg>
                      </button>
                      <div *ngIf="showCentroCustoDropdown && centroCustoFiltered.length > 0" class="${DROPDOWN}">
                        <div *ngFor="let cc of centroCustoFiltered"
                          (mousedown)="selecionarCentroCusto(cc)" class="${DROPDOWN_ITEM}">
                          <span class="font-semibold text-[#1A4E79] shrink-0">{{ cc.codigo }}</span>
                          <span class="text-gray-500 truncate">{{ cc.descricao }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- ── Classe Valor (combobox local) ────────────────────── -->
                  <div>
                    <label class="block text-sm font-medium text-[#1A4E79] mb-1">Classe Valor</label>
                    <div class="${COMBOBOX_WRAP}">
                      <input type="text" name="classeValorSearch" [(ngModel)]="model.classeValorSearch"
                        autocomplete="off" placeholder="Digite código ou descrição..."
                        (ngModelChange)="onClasseValorInput($event)"
                        (blur)="fecharClasseValorDropdown()"
                        class="${COMBOBOX_INPUT}" />
                      <button type="button" (mousedown)="toggleClasseValorDropdown($event)" class="${COMBOBOX_BTN}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                        </svg>
                      </button>
                      <div *ngIf="showClasseValorDropdown && classeValorFiltered.length > 0" class="${DROPDOWN}">
                        <div *ngFor="let cv of classeValorFiltered"
                          (mousedown)="selecionarClasseValor(cv)" class="${DROPDOWN_ITEM}">
                          <span class="font-semibold text-[#1A4E79] shrink-0">{{ cv.codigo }}</span>
                          <span class="text-gray-500 truncate">{{ cv.descricao }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Motivo (memo 80 chars) -->
                  <div>
                    <label class="block text-sm font-medium text-[#1A4E79] mb-1">
                      Motivo
                      <span class="text-gray-400 font-normal text-xs ml-1">({{ (model.motivo || '').length }}/80)</span>
                    </label>
                    <textarea name="motivo" [(ngModel)]="model.motivo" maxlength="80" rows="3"
                      placeholder="Descreva o motivo da prestação..."
                      class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all shadow-sm resize-none"></textarea>
                  </div>

                  <!-- Percentuais -->
                  <div class="md:col-span-2">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <!-- ── Cliente / Fornecedor (combobox via API) ───────────── -->
                  <div>
                    <label class="block text-sm font-medium text-[#1A4E79] mb-1">Cliente / Fornecedor</label>
                    <div class="${COMBOBOX_WRAP}">
                      <input type="text" name="flf_clifor" [(ngModel)]="model.flf_clifor"
                        autocomplete="off" placeholder="Digite código ou nome..."
                        (ngModelChange)="onClienteInput($event)"
                        (blur)="fecharClienteDropdown()"
                        class="${COMBOBOX_INPUT}" />
                      <button type="button" (mousedown)="toggleClienteDropdown($event)" class="${COMBOBOX_BTN}">
                        <svg *ngIf="!isLoadingCliente" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                        </svg>
                        <svg *ngIf="isLoadingCliente" class="animate-spin h-4 w-4 text-[#75C9C8]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                      </button>
                      <div *ngIf="showClienteDropdown && clienteResults.length > 0" class="${DROPDOWN}">
                        <div *ngFor="let r of clienteResults"
                          (mousedown)="selecionarCliente(r)" class="${DROPDOWN_ITEM}">
                          <span class="font-semibold text-[#1A4E79] shrink-0">{{ r.codigo }}/{{ r.loja }}</span>
                          <span class="text-gray-500 truncate">{{ r.nome }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Loja -->
                  <div>
                    <label class="block text-sm font-medium text-[#1A4E79] mb-1">Loja</label>
                    <input type="text" [value]="model.flf_floja" readonly
                      placeholder="Preenchida ao selecionar"
                      class="w-full p-3 bg-gray-100 border border-[#e6eef0] rounded-lg shadow-inner" />
                  </div>

                  <!-- Nome do Cliente (informativo) -->
                  <div *ngIf="model.nomeCliente" class="md:col-span-2">
                    <label class="block text-sm font-medium text-[#1A4E79] mb-1">Nome do Cliente</label>
                    <input type="text" [value]="model.nomeCliente" readonly
                      class="w-full p-3 bg-gray-100 border border-[#e6eef0] rounded-lg shadow-inner" />
                  </div>

                </div>
              </form>
            </div>

            <!-- Placeholder: Despesas (fase futura) -->
            <div class="bg-white rounded-lg p-4 md:p-6 border border-dashed border-[#75C9C8]/40 shadow-sm w-full md:w-[90%] mx-auto">
              <div class="flex items-center gap-3 mb-2">
                <i class="po-icon po-icon-list text-[#1A4E79] text-lg"></i>
                <h4 class="text-[#1A4E79] font-semibold">Despesas</h4>
                <span class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Disponível na próxima fase</span>
              </div>
              <p class="text-sm text-gray-400">
                A inclusão de despesas estará disponível após a validação do cadastro da prestação.
              </p>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 w-full md:w-[90%] mx-auto">
              <button type="button" (click)="voltar()"
                class="px-4 py-2 border rounded text-[#1A4E79] border-[#75C9C8] bg-white hover:bg-[#e6eef0] transition-all">
                Voltar
              </button>
              <button type="button" (click)="salvar()" [disabled]="isSaving || percentuaisInvalidos"
                class="px-4 py-2 bg-gradient-to-r from-[#1A4E79] to-[#75C9C8] text-white rounded hover:shadow-lg disabled:opacity-50 transition-all">
                {{ isSaving ? 'Salvando...' : 'Salvar' }}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  </main>
  `
})
export class PrestacaoContasComponent implements OnInit, OnDestroy {
  model: any = {};
  isGeneratingCode = false;
  isSaving = false;

  // Combobox via API — participante
  participanteResults: ParticipanteResult[] = [];
  showParticipanteDropdown = false;
  isLoadingParticipante = false;
  private participanteSearch$ = new Subject<string>();
  private participanteSub?: Subscription;

  // Combobox via API — cliente/fornecedor
  clienteResults: ClienteResult[] = [];
  showClienteDropdown = false;
  isLoadingCliente = false;
  private clienteSearch$ = new Subject<string>();
  private clienteSub?: Subscription;

  // Listas locais
  itensContabeis: ItemContabilResult[] = [];
  centrosCusto: CentroCustoResult[] = [];
  classesValor: ClasseValorResult[] = [];

  // Combobox local — item contábil
  itemContabilFiltered: ItemContabilResult[] = [];
  showItemContabilDropdown = false;

  // Combobox local — centro de custo
  centroCustoFiltered: CentroCustoResult[] = [];
  showCentroCustoDropdown = false;

  // Combobox local — classe valor
  classeValorFiltered: ClasseValorResult[] = [];
  showClasseValorDropdown = false;

  constructor(private prestacaoService: PrestacaoContasService) {}

  ngOnInit(): void {
    this.initModel();
    this.gerarCodigo();
    this.carregarListas();
    this.initAutocomplete();
  }

  ngOnDestroy(): void {
    this.participanteSub?.unsubscribe();
    this.clienteSub?.unsubscribe();
  }

  private initAutocomplete(): void {
    this.participanteSub = this.participanteSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(termo => {
        if (termo.length < 2) return of([]);
        this.isLoadingParticipante = true;
        return this.prestacaoService.buscarParticipantePorTermo(termo);
      })
    ).subscribe({
      next: res => { this.participanteResults = res; this.showParticipanteDropdown = res.length > 0; this.isLoadingParticipante = false; },
      error: () => { this.isLoadingParticipante = false; }
    });

    this.clienteSub = this.clienteSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(termo => {
        if (termo.length < 2) return of([]);
        this.isLoadingCliente = true;
        return this.prestacaoService.buscarClientePorTermo(termo);
      })
    ).subscribe({
      next: res => { this.clienteResults = res; this.showClienteDropdown = res.length > 0; this.isLoadingCliente = false; },
      error: () => { this.isLoadingCliente = false; }
    });
  }

  private carregarListas(): void {
    this.prestacaoService.listarItensContabeis().subscribe({ next: items => this.itensContabeis = items, error: () => {} });
    this.prestacaoService.listarCentrosCusto().subscribe({ next: items => this.centrosCusto = items, error: () => {} });
    this.prestacaoService.listarClassesValor().subscribe({ next: items => this.classesValor = items, error: () => {} });
  }

  initModel(): void {
    this.model = {
      flf_tipo: '2', flf_presta: '',
      codParticipante: '', nomeParticipante: '',
      flf_emissa: '', flf_dtini: '', flf_dtfim: '',
      itemContabilSearch: '', itemContabil: '',
      centroCustoSearch: '', centroCusto: '',
      classeValorSearch: '', classeValor: '',
      motivo: '',
      flf_fatcli: 0, flf_fatemp: 0,
      flf_clifor: '', flf_floja: '', nomeCliente: ''
    };
  }

  get somaPercentuais(): number {
    return (Number(this.model.flf_fatcli) || 0) + (Number(this.model.flf_fatemp) || 0);
  }

  get percentuaisInvalidos(): boolean {
    const soma = this.somaPercentuais;
    return soma > 0 && soma !== 100;
  }

  gerarCodigo(): void {
    this.isGeneratingCode = true;
    this.prestacaoService.gerarCodigoPrestacao().subscribe({
      next: codigo => { this.model.flf_presta = codigo; this.isGeneratingCode = false; },
      error: () => { this.isGeneratingCode = false; }
    });
  }

  // ── Participante (API) ───────────────────────────────────────────────────

  onParticipanteInput(valor: string): void {
    this.model.nomeParticipante = '';
    if (!valor?.trim()) { this.showParticipanteDropdown = false; this.participanteResults = []; return; }
    this.participanteSearch$.next(valor);
  }

  toggleParticipanteDropdown(event: MouseEvent): void {
    event.preventDefault();
    if (this.showParticipanteDropdown) {
      this.showParticipanteDropdown = false;
    } else {
      this.showParticipanteDropdown = this.participanteResults.length > 0;
    }
  }

  selecionarParticipante(item: ParticipanteResult): void {
    this.model.codParticipante = item.codigo;
    this.model.nomeParticipante = item.nome;
    this.participanteResults = [];
    this.showParticipanteDropdown = false;
  }

  fecharParticipanteDropdown(): void {
    setTimeout(() => { this.showParticipanteDropdown = false; }, 150);
  }

  // ── Item Contábil (filtro local) ─────────────────────────────────────────

  onItemContabilInput(valor: string): void {
    this.model.itemContabil = '';
    if (!valor?.trim()) { this.showItemContabilDropdown = false; this.itemContabilFiltered = []; return; }
    this.itemContabilFiltered = this.filtrarLista(this.itensContabeis, valor);
    this.showItemContabilDropdown = this.itemContabilFiltered.length > 0;
  }

  toggleItemContabilDropdown(event: MouseEvent): void {
    event.preventDefault();
    if (this.showItemContabilDropdown) {
      this.showItemContabilDropdown = false;
    } else {
      const t = (this.model.itemContabilSearch || '').trim();
      this.itemContabilFiltered = t ? this.filtrarLista(this.itensContabeis, t) : [...this.itensContabeis];
      this.showItemContabilDropdown = this.itemContabilFiltered.length > 0;
    }
  }

  selecionarItemContabil(item: ItemContabilResult): void {
    this.model.itemContabil = item.codigo;
    this.model.itemContabilSearch = `${item.codigo} - ${item.descricao}`;
    this.itemContabilFiltered = [];
    this.showItemContabilDropdown = false;
  }

  fecharItemContabilDropdown(): void {
    setTimeout(() => { this.showItemContabilDropdown = false; }, 150);
  }

  // ── Centro de Custo (filtro local) ───────────────────────────────────────

  onCentroCustoInput(valor: string): void {
    this.model.centroCusto = '';
    if (!valor?.trim()) { this.showCentroCustoDropdown = false; this.centroCustoFiltered = []; return; }
    this.centroCustoFiltered = this.filtrarLista(this.centrosCusto, valor);
    this.showCentroCustoDropdown = this.centroCustoFiltered.length > 0;
  }

  toggleCentroCustoDropdown(event: MouseEvent): void {
    event.preventDefault();
    if (this.showCentroCustoDropdown) {
      this.showCentroCustoDropdown = false;
    } else {
      const t = (this.model.centroCustoSearch || '').trim();
      this.centroCustoFiltered = t ? this.filtrarLista(this.centrosCusto, t) : [...this.centrosCusto];
      this.showCentroCustoDropdown = this.centroCustoFiltered.length > 0;
    }
  }

  selecionarCentroCusto(item: CentroCustoResult): void {
    this.model.centroCusto = item.codigo;
    this.model.centroCustoSearch = `${item.codigo} - ${item.descricao}`;
    this.centroCustoFiltered = [];
    this.showCentroCustoDropdown = false;
  }

  fecharCentroCustoDropdown(): void {
    setTimeout(() => { this.showCentroCustoDropdown = false; }, 150);
  }

  // ── Classe Valor (filtro local) ──────────────────────────────────────────

  onClasseValorInput(valor: string): void {
    this.model.classeValor = '';
    if (!valor?.trim()) { this.showClasseValorDropdown = false; this.classeValorFiltered = []; return; }
    this.classeValorFiltered = this.filtrarLista(this.classesValor, valor);
    this.showClasseValorDropdown = this.classeValorFiltered.length > 0;
  }

  toggleClasseValorDropdown(event: MouseEvent): void {
    event.preventDefault();
    if (this.showClasseValorDropdown) {
      this.showClasseValorDropdown = false;
    } else {
      const t = (this.model.classeValorSearch || '').trim();
      this.classeValorFiltered = t ? this.filtrarLista(this.classesValor, t) : [...this.classesValor];
      this.showClasseValorDropdown = this.classeValorFiltered.length > 0;
    }
  }

  selecionarClasseValor(item: ClasseValorResult): void {
    this.model.classeValor = item.codigo;
    this.model.classeValorSearch = `${item.codigo} - ${item.descricao}`;
    this.classeValorFiltered = [];
    this.showClasseValorDropdown = false;
  }

  fecharClasseValorDropdown(): void {
    setTimeout(() => { this.showClasseValorDropdown = false; }, 150);
  }

  // ── Cliente / Fornecedor (API) ───────────────────────────────────────────

  onClienteInput(valor: string): void {
    this.model.flf_floja = '';
    this.model.nomeCliente = '';
    if (!valor?.trim()) { this.showClienteDropdown = false; this.clienteResults = []; return; }
    this.clienteSearch$.next(valor);
  }

  toggleClienteDropdown(event: MouseEvent): void {
    event.preventDefault();
    if (this.showClienteDropdown) {
      this.showClienteDropdown = false;
    } else {
      this.showClienteDropdown = this.clienteResults.length > 0;
    }
  }

  selecionarCliente(item: ClienteResult): void {
    this.model.flf_clifor = item.codigo;
    this.model.flf_floja = item.loja;
    this.model.nomeCliente = item.nome;
    this.clienteResults = [];
    this.showClienteDropdown = false;
  }

  fecharClienteDropdown(): void {
    setTimeout(() => { this.showClienteDropdown = false; }, 150);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private filtrarLista(lista: any[], termo: string): any[] {
    const t = termo.toLowerCase();
    return lista.filter(i => i.codigo.toLowerCase().includes(t) || i.descricao.toLowerCase().includes(t));
  }

  // ── Ações do formulário ──────────────────────────────────────────────────

  voltar(): void {
    try { window.history.back(); } catch {}
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
      next: () => {
        this.isSaving = false;
        alert('Prestação de contas salva com sucesso!');
        this.initModel();
        this.gerarCodigo();
      },
      error: (err: Error) => {
        this.isSaving = false;
        alert(`Erro ao salvar: ${err.message}`);
      }
    });
  }
}
