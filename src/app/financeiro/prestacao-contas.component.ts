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

const INPUT_CLASS = 'w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all shadow-sm';
const DROPDOWN_CLASS = 'absolute z-20 w-full bg-white border border-[#75C9C8]/30 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto';
const DROPDOWN_ITEM_CLASS = 'px-3 py-2 hover:bg-[#e6eef0] cursor-pointer text-sm border-b border-gray-100 last:border-0 flex gap-2';

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

                  <!-- Participante (typeahead via API) -->
                  <div>
                    <label class="block text-sm font-semibold text-[#1A4E79] mb-1">Participante *</label>
                    <div class="relative">
                      <input type="text" name="codParticipante" [(ngModel)]="model.codParticipante" required
                        autocomplete="off" placeholder="Digite código ou nome..."
                        (ngModelChange)="onParticipanteInput($event)"
                        (blur)="fecharParticipanteDropdown()"
                        class="${INPUT_CLASS}" />
                      <div *ngIf="showParticipanteDropdown && participanteResults.length > 0" class="${DROPDOWN_CLASS}">
                        <div *ngFor="let r of participanteResults"
                          (mousedown)="selecionarParticipante(r)" class="${DROPDOWN_ITEM_CLASS}">
                          <span class="font-semibold text-[#1A4E79] shrink-0">{{ r.codigo }}</span>
                          <span class="text-gray-500 truncate">{{ r.nome }}</span>
                        </div>
                      </div>
                      <div *ngIf="isLoadingParticipante"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#75C9C8]">Buscando...</div>
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

                  <!-- Item Contábil (typeahead local) -->
                  <div>
                    <label class="block text-sm font-medium text-[#1A4E79] mb-1">Item Contábil</label>
                    <div class="relative">
                      <input type="text" name="itemContabilSearch" [(ngModel)]="model.itemContabilSearch"
                        autocomplete="off" placeholder="Digite código ou descrição..."
                        (ngModelChange)="onItemContabilInput($event)"
                        (blur)="fecharItemContabilDropdown()"
                        class="${INPUT_CLASS}" />
                      <div *ngIf="showItemContabilDropdown && itemContabilFiltered.length > 0" class="${DROPDOWN_CLASS}">
                        <div *ngFor="let it of itemContabilFiltered"
                          (mousedown)="selecionarItemContabil(it)" class="${DROPDOWN_ITEM_CLASS}">
                          <span class="font-semibold text-[#1A4E79] shrink-0">{{ it.codigo }}</span>
                          <span class="text-gray-500 truncate">{{ it.descricao }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Centro de Custo (typeahead local) -->
                  <div>
                    <label class="block text-sm font-medium text-[#1A4E79] mb-1">Centro de Custo</label>
                    <div class="relative">
                      <input type="text" name="centroCustoSearch" [(ngModel)]="model.centroCustoSearch"
                        autocomplete="off" placeholder="Digite código ou descrição..."
                        (ngModelChange)="onCentroCustoInput($event)"
                        (blur)="fecharCentroCustoDropdown()"
                        class="${INPUT_CLASS}" />
                      <div *ngIf="showCentroCustoDropdown && centroCustoFiltered.length > 0" class="${DROPDOWN_CLASS}">
                        <div *ngFor="let cc of centroCustoFiltered"
                          (mousedown)="selecionarCentroCusto(cc)" class="${DROPDOWN_ITEM_CLASS}">
                          <span class="font-semibold text-[#1A4E79] shrink-0">{{ cc.codigo }}</span>
                          <span class="text-gray-500 truncate">{{ cc.descricao }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Classe Valor (typeahead local) -->
                  <div>
                    <label class="block text-sm font-medium text-[#1A4E79] mb-1">Classe Valor</label>
                    <div class="relative">
                      <input type="text" name="classeValorSearch" [(ngModel)]="model.classeValorSearch"
                        autocomplete="off" placeholder="Digite código ou descrição..."
                        (ngModelChange)="onClasseValorInput($event)"
                        (blur)="fecharClasseValorDropdown()"
                        class="${INPUT_CLASS}" />
                      <div *ngIf="showClasseValorDropdown && classeValorFiltered.length > 0" class="${DROPDOWN_CLASS}">
                        <div *ngFor="let cv of classeValorFiltered"
                          (mousedown)="selecionarClasseValor(cv)" class="${DROPDOWN_ITEM_CLASS}">
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

                  <!-- Cliente / Fornecedor (typeahead via API) -->
                  <div>
                    <label class="block text-sm font-medium text-[#1A4E79] mb-1">Cliente / Fornecedor</label>
                    <div class="relative">
                      <input type="text" name="flf_clifor" [(ngModel)]="model.flf_clifor"
                        autocomplete="off" placeholder="Digite código ou nome..."
                        (ngModelChange)="onClienteInput($event)"
                        (blur)="fecharClienteDropdown()"
                        class="${INPUT_CLASS}" />
                      <div *ngIf="showClienteDropdown && clienteResults.length > 0" class="${DROPDOWN_CLASS}">
                        <div *ngFor="let r of clienteResults"
                          (mousedown)="selecionarCliente(r)" class="${DROPDOWN_ITEM_CLASS}">
                          <span class="font-semibold text-[#1A4E79] shrink-0">{{ r.codigo }}/{{ r.loja }}</span>
                          <span class="text-gray-500 truncate">{{ r.nome }}</span>
                        </div>
                      </div>
                      <div *ngIf="isLoadingCliente"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#75C9C8]">Buscando...</div>
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

  // Autocomplete via API — participante
  participanteResults: ParticipanteResult[] = [];
  showParticipanteDropdown = false;
  isLoadingParticipante = false;
  private participanteSearch$ = new Subject<string>();
  private participanteSub?: Subscription;

  // Autocomplete via API — cliente/fornecedor
  clienteResults: ClienteResult[] = [];
  showClienteDropdown = false;
  isLoadingCliente = false;
  private clienteSearch$ = new Subject<string>();
  private clienteSub?: Subscription;

  // Listas carregadas em memória (filtro local)
  itensContabeis: ItemContabilResult[] = [];
  centrosCusto: CentroCustoResult[] = [];
  classesValor: ClasseValorResult[] = [];

  // Typeahead local — item contábil
  itemContabilFiltered: ItemContabilResult[] = [];
  showItemContabilDropdown = false;

  // Typeahead local — centro de custo
  centroCustoFiltered: CentroCustoResult[] = [];
  showCentroCustoDropdown = false;

  // Typeahead local — classe valor
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
      next: res => {
        this.participanteResults = res;
        this.showParticipanteDropdown = res.length > 0;
        this.isLoadingParticipante = false;
      },
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
      next: res => {
        this.clienteResults = res;
        this.showClienteDropdown = res.length > 0;
        this.isLoadingCliente = false;
      },
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
      flf_tipo: '2',
      flf_presta: '',
      codParticipante: '',
      nomeParticipante: '',
      flf_emissa: '',
      flf_dtini: '',
      flf_dtfim: '',
      itemContabilSearch: '',
      itemContabil: '',
      centroCustoSearch: '',
      centroCusto: '',
      classeValorSearch: '',
      classeValor: '',
      motivo: '',
      flf_fatcli: 0,
      flf_fatemp: 0,
      flf_clifor: '',
      flf_floja: '',
      nomeCliente: ''
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
    const t = valor.toLowerCase();
    this.itemContabilFiltered = this.itensContabeis.filter(
      i => i.codigo.toLowerCase().includes(t) || i.descricao.toLowerCase().includes(t)
    );
    this.showItemContabilDropdown = this.itemContabilFiltered.length > 0;
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
    const t = valor.toLowerCase();
    this.centroCustoFiltered = this.centrosCusto.filter(
      cc => cc.codigo.toLowerCase().includes(t) || cc.descricao.toLowerCase().includes(t)
    );
    this.showCentroCustoDropdown = this.centroCustoFiltered.length > 0;
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
    const t = valor.toLowerCase();
    this.classeValorFiltered = this.classesValor.filter(
      cv => cv.codigo.toLowerCase().includes(t) || cv.descricao.toLowerCase().includes(t)
    );
    this.showClasseValorDropdown = this.classeValorFiltered.length > 0;
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
