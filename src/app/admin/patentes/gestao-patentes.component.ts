import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatentesService, PatenteGestao, MenuAcessoPatente, MenuSZC } from '../../shared/services/patentes.service';

@Component({
  selector: 'app-gestao-patentes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Loading overlay -->
    <div *ngIf="loading" class="fixed inset-0 bg-gradient-to-br from-[#1A4E79]/90 to-[#75C9C8]/90 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div class="bg-white rounded-xl p-8 shadow-2xl text-center">
        <div class="w-12 h-12 border-4 border-[#75C9C8]/30 border-t-[#1A4E79] rounded-full mx-auto mb-4 animate-spin"></div>
        <p class="text-base font-semibold text-[#1A4E79]">Carregando...</p>
      </div>
    </div>

    <main class="min-h-screen bg-gradient-to-br from-[#1A4E79] to-[#75C9C8] p-4 md:p-6 overflow-y-auto">
      <div class="max-w-2xl mx-auto">

        <!-- Header -->
        <div class="flex items-center justify-between mb-5 gap-3">
          <h1 class="text-xl md:text-2xl font-semibold text-white">Gestão de Patentes</h1>
          <button
            (click)="abrirFormNova()"
            class="flex-shrink-0 flex items-center gap-2 bg-white text-[#1A4E79] px-3 py-2 md:px-4 rounded-lg text-sm font-semibold shadow hover:bg-[#f0f9f9] active:scale-95 transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
            Nova Patente
          </button>
        </div>

        <!-- Empty state -->
        <div *ngIf="!loading && patentes.length === 0" class="bg-white/95 rounded-xl shadow p-8 text-center text-[#1A4E79]/60 text-sm">
          Nenhuma patente cadastrada.
        </div>

        <!-- Accordion list -->
        <div class="flex flex-col gap-3">
          <div *ngFor="let p of patentes" class="bg-white rounded-xl shadow-md overflow-hidden border border-white/30">

            <!-- Patent header row (always visible) -->
            <div
              class="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-[#f8fdfd] active:bg-[#edf7f7] transition-colors"
              (click)="togglePatente(p)">

              <!-- Chevron -->
              <svg
                class="w-4 h-4 flex-shrink-0 text-[#75C9C8] transition-transform duration-200"
                [class.rotate-180]="expandedId === p.codigo"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
              </svg>

              <!-- Patent info -->
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-[#1A4E79] truncate">{{ p.patente }}</div>
                <div class="text-xs text-gray-400 mt-0.5">
                  <span class="mr-2">ID: {{ p.codigo }}</span>
                  <span *ngIf="p.descricao" class="truncate">{{ p.descricao }}</span>
                </div>
              </div>

              <!-- Action buttons (stop propagation so row click doesn't toggle) -->
              <div class="flex items-center gap-1 flex-shrink-0" (click)="$event.stopPropagation()">
                <button
                  (click)="abrirFormEditar(p)"
                  title="Editar"
                  class="p-2 rounded-lg text-[#1A4E79] hover:bg-[#1A4E79]/10 active:bg-[#1A4E79]/20 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button
                  (click)="confirmarExcluir(p)"
                  title="Excluir"
                  class="p-2 rounded-lg text-red-400 hover:bg-red-50 active:bg-red-100 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>

            <!-- Expanded: menus section -->
            <div *ngIf="expandedId === p.codigo" class="border-t border-[#E6EEF2] bg-[#f8fdfd]">

              <!-- Add menu bar -->
              <div class="px-4 pt-3 pb-2">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-semibold text-[#1A4E79] uppercase tracking-wide">Menus de acesso</span>
                  <button
                    (click)="showAddMenu = !showAddMenu"
                    class="flex items-center gap-1 text-xs text-[#1A4E79] border border-[#75C9C8] px-2.5 py-1 rounded-lg hover:bg-[#75C9C8]/10 transition-colors font-medium">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                    Adicionar
                  </button>
                </div>

                <!-- Inline add menu form -->
                <div *ngIf="showAddMenu" class="mb-3 p-3 bg-white rounded-lg border border-[#CBD8E1] shadow-sm">
                  <div class="flex gap-2">
                    <div class="relative flex-1">
                      <div class="flex rounded-lg border focus-within:ring-2 focus-within:ring-[#75C9C8] focus-within:border-[#75C9C8] overflow-hidden"
                           [class.border-[#CBD8E1]]="true">
                        <input
                          type="text"
                          [(ngModel)]="menuSearch"
                          (input)="onMenuInput($event)"
                          (blur)="fecharMenuDropdown()"
                          placeholder="Buscar menu..."
                          class="flex-1 px-3 py-2 text-sm text-[#1A4E79] bg-white focus:outline-none min-w-0"
                          autocomplete="off" />
                        <button
                          type="button"
                          (mousedown)="toggleMenuDropdown($event)"
                          class="px-2 bg-white border-l border-[#CBD8E1] text-[#1A4E79] hover:bg-[#f0f9f9] focus:outline-none flex-shrink-0">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                        </button>
                      </div>
                      <ul *ngIf="showMenuDropdown && menuFiltered.length > 0"
                          class="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#CBD8E1] rounded-lg shadow-xl max-h-48 overflow-y-auto">
                        <li
                          *ngFor="let m of menuFiltered"
                          (mousedown)="selecionarMenuDropdown(m)"
                          class="px-3 py-2.5 cursor-pointer hover:bg-[#f0f9f9] border-b border-[#E6EEF2] last:border-0">
                          <div class="text-sm font-medium text-[#1A4E79]">{{ m.menu }}</div>
                          <div class="text-xs text-gray-400">{{ m.descricao }}<span *ngIf="m.rota"> · {{ m.rota }}</span></div>
                        </li>
                      </ul>
                    </div>
                    <button
                      (click)="adicionarMenu()"
                      [disabled]="!selectedMenuId || addingMenu"
                      class="flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#1A4E79] to-[#75C9C8] text-white disabled:opacity-40 active:scale-95 transition-all">
                      {{ addingMenu ? '...' : 'OK' }}
                    </button>
                  </div>
                  <div *ngIf="msgMenu" class="mt-1.5 text-xs" [class.text-red-500]="msgMenuErro" [class.text-green-600]="!msgMenuErro">{{ msgMenu }}</div>
                </div>
              </div>

              <!-- Loading menus -->
              <div *ngIf="menusLoading" class="px-4 pb-4 text-sm text-[#1A4E79]/60 text-center py-3">
                Carregando menus...
              </div>

              <!-- Menus list -->
              <div *ngIf="!menusLoading" class="px-4 pb-4">
                <div *ngIf="menusPatente.length === 0" class="text-xs text-gray-400 py-2">
                  Nenhum menu associado a esta patente.
                </div>
                <ul *ngIf="menusPatente.length > 0" class="divide-y divide-[#E6EEF2] rounded-lg border border-[#E6EEF2] overflow-hidden bg-white">
                  <li *ngFor="let m of menusPatente" class="flex items-center gap-3 px-3 py-2.5 hover:bg-[#f8fdfd]">
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-[#1A4E79] truncate">{{ m.descricao || m.menu }}</div>
                      <div class="text-xs text-gray-400">ID: {{ m.menu }}</div>
                    </div>
                    <button
                      (click)="confirmarRemoverMenu(m)"
                      class="flex-shrink-0 p-1.5 rounded text-red-400 hover:bg-red-50 active:bg-red-100 transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </div>

        <div *ngIf="mensagem" class="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{{ mensagem }}</div>

      </div>
    </main>

    <!-- Modal: Create / Edit patent -->
    <div *ngIf="showForm" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div class="absolute inset-0 bg-black/50" (click)="fecharForm()"></div>
      <div class="relative bg-white w-full sm:max-w-md sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6">
        <h3 class="text-lg font-semibold text-[#1A4E79] mb-4">{{ isEditing ? 'Editar Patente' : 'Nova Patente' }}</h3>

        <div class="flex flex-col gap-3">
          <div>
            <label class="block text-xs font-medium text-[#1A4E79] mb-1">Nome *</label>
            <input
              type="text"
              [(ngModel)]="formData.nome"
              maxlength="30"
              placeholder="Ex: Financeiro"
              class="w-full border border-[#CBD8E1] rounded-lg px-3 py-2.5 text-sm text-[#1A4E79] focus:outline-none focus:ring-2 focus:ring-[#75C9C8]" />
          </div>
          <div>
            <label class="block text-xs font-medium text-[#1A4E79] mb-1">Descrição</label>
            <input
              type="text"
              [(ngModel)]="formData.desc"
              maxlength="60"
              placeholder="Descrição opcional"
              class="w-full border border-[#CBD8E1] rounded-lg px-3 py-2.5 text-sm text-[#1A4E79] focus:outline-none focus:ring-2 focus:ring-[#75C9C8]" />
          </div>
          <div *ngIf="formErro" class="text-xs text-red-500 bg-red-50 p-2 rounded">{{ formErro }}</div>
        </div>

        <div class="flex gap-3 mt-5">
          <button (click)="fecharForm()" class="flex-1 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button
            (click)="salvarPatente()"
            [disabled]="saving"
            class="flex-1 py-2.5 rounded-lg text-sm bg-gradient-to-r from-[#1A4E79] to-[#75C9C8] text-white font-medium disabled:opacity-40 active:scale-95 transition-all">
            {{ saving ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Confirm delete patent -->
    <div *ngIf="showConfirmDelete" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div class="absolute inset-0 bg-black/50" (click)="cancelarExcluir()"></div>
      <div class="relative bg-white w-full sm:max-w-sm sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6">
        <h3 class="text-base font-semibold text-[#1A4E79] mb-2">Excluir patente</h3>
        <p class="text-sm text-gray-600 mb-4">
          Excluir <span class="font-semibold text-[#1A4E79]">{{ patenteToDelete?.patente }}</span>?
          Todos os menus vinculados serão removidos.
        </p>
        <div class="flex gap-3">
          <button (click)="cancelarExcluir()" class="flex-1 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-600">Cancelar</button>
          <button (click)="executarExcluir()" class="flex-1 py-2.5 rounded-lg text-sm bg-red-600 text-white font-medium active:scale-95 transition-all">Excluir</button>
        </div>
      </div>
    </div>

    <!-- Modal: Confirm remove menu -->
    <div *ngIf="showConfirmRemoveMenu" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div class="absolute inset-0 bg-black/50" (click)="cancelarRemoverMenu()"></div>
      <div class="relative bg-white w-full sm:max-w-sm sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6">
        <h3 class="text-base font-semibold text-[#1A4E79] mb-2">Remover menu</h3>
        <p class="text-sm text-gray-600 mb-4">
          Remover acesso ao menu <span class="font-semibold text-[#1A4E79]">{{ menuToRemove?.descricao || menuToRemove?.menu }}</span>?
        </p>
        <div class="flex gap-3">
          <button (click)="cancelarRemoverMenu()" class="flex-1 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-600">Cancelar</button>
          <button (click)="executarRemoverMenu()" class="flex-1 py-2.5 rounded-lg text-sm bg-red-600 text-white font-medium active:scale-95 transition-all">Remover</button>
        </div>
      </div>
    </div>
  `
})
export class GestaoPatentesComponent implements OnInit {
  loading = false;
  mensagem = '';

  patentes: PatenteGestao[] = [];

  // Accordion state
  expandedId: string | null = null;
  menusPatente: MenuAcessoPatente[] = [];
  menusLoading = false;

  // All menus (for combobox)
  todosMenus: MenuSZC[] = [];
  menuSearch = '';
  menuFiltered: MenuSZC[] = [];
  showMenuDropdown = false;
  selectedMenuId = '';
  showAddMenu = false;
  addingMenu = false;
  msgMenu = '';
  msgMenuErro = false;

  // Form create/edit
  showForm = false;
  isEditing = false;
  formData = { id: '', nome: '', desc: '' };
  formErro = '';
  saving = false;

  // Delete patent modal
  showConfirmDelete = false;
  patenteToDelete: PatenteGestao | null = null;

  // Remove menu modal
  showConfirmRemoveMenu = false;
  menuToRemove: MenuAcessoPatente | null = null;

  constructor(private patentesService: PatentesService) {}

  ngOnInit(): void {
    this.carregarPatentes();
    this.carregarTodosMenus();
  }

  carregarPatentes(): void {
    this.loading = true;
    this.patentesService.listarPatentesCrud().subscribe({
      next: dados => {
        this.patentes = Array.isArray(dados) ? dados : [];
        this.loading = false;
      },
      error: () => {
        this.mensagem = 'Erro ao carregar patentes.';
        this.loading = false;
      }
    });
  }

  carregarTodosMenus(): void {
    this.patentesService.listarTodosMenusAdmin().subscribe({
      next: dados => { this.todosMenus = Array.isArray(dados) ? dados : []; },
      error: () => {}
    });
  }

  // ─── Accordion ──────────────────────────────────────────────
  togglePatente(p: PatenteGestao): void {
    if (this.expandedId === p.codigo) {
      this.expandedId = null;
      this.menusPatente = [];
      this.resetMenuCombobox();
      return;
    }
    this.expandedId = p.codigo;
    this.menusPatente = [];
    this.resetMenuCombobox();
    this.carregarMenusPatente(p.codigo);
  }

  carregarMenusPatente(codigo: string): void {
    this.menusLoading = true;
    this.patentesService.listarAcessosPatente(codigo).subscribe({
      next: dados => {
        this.menusPatente = Array.isArray(dados) ? dados : [];
        this.menusLoading = false;
      },
      error: () => { this.menusLoading = false; }
    });
  }

  // ─── Form create/edit ────────────────────────────────────────
  abrirFormNova(): void {
    this.formData = { id: '', nome: '', desc: '' };
    this.formErro = '';
    this.isEditing = false;
    this.showForm = true;
  }

  abrirFormEditar(p: PatenteGestao): void {
    this.formData = { id: p.codigo, nome: p.patente, desc: p.descricao };
    this.formErro = '';
    this.isEditing = true;
    this.showForm = true;
  }

  fecharForm(): void {
    this.showForm = false;
    this.formErro = '';
  }

  salvarPatente(): void {
    const nome = this.formData.nome.trim();
    const desc = this.formData.desc.trim();
    if (!nome) { this.formErro = 'Nome é obrigatório.'; return; }
    this.saving = true;
    this.formErro = '';

    const obs = this.isEditing
      ? this.patentesService.atualizarPatente(this.formData.id, nome, desc)
      : this.patentesService.criarPatente(nome, desc);

    obs.subscribe({
      next: res => {
        this.saving = false;
        if (res?.success === false) { this.formErro = res.message || 'Erro ao salvar.'; return; }
        this.fecharForm();
        this.carregarPatentes();
      },
      error: err => { this.saving = false; this.formErro = err?.message || 'Erro ao salvar.'; }
    });
  }

  // ─── Delete patent ───────────────────────────────────────────
  confirmarExcluir(p: PatenteGestao): void {
    this.patenteToDelete = p;
    this.showConfirmDelete = true;
  }

  cancelarExcluir(): void {
    this.patenteToDelete = null;
    this.showConfirmDelete = false;
  }

  executarExcluir(): void {
    if (!this.patenteToDelete) return;
    const p = this.patenteToDelete;
    this.showConfirmDelete = false;
    this.patenteToDelete = null;
    this.loading = true;
    this.patentesService.excluirPatente(p.codigo).subscribe({
      next: () => {
        if (this.expandedId === p.codigo) { this.expandedId = null; this.menusPatente = []; }
        this.carregarPatentes();
      },
      error: err => { this.mensagem = err?.message || 'Erro ao excluir.'; this.loading = false; }
    });
  }

  // ─── Menu combobox ───────────────────────────────────────────
  onMenuInput(event: Event): void {
    const q = (event.target as HTMLInputElement).value.toLowerCase();
    this.selectedMenuId = '';
    this.menuFiltered = q
      ? this.todosMenus.filter(m => m.menu.toLowerCase().includes(q) || m.descricao.toLowerCase().includes(q))
      : this.todosMenus;
    this.showMenuDropdown = true;
  }

  toggleMenuDropdown(event: MouseEvent): void {
    event.preventDefault();
    if (this.showMenuDropdown) { this.showMenuDropdown = false; return; }
    this.menuFiltered = this.todosMenus;
    this.showMenuDropdown = true;
  }

  fecharMenuDropdown(): void {
    setTimeout(() => { this.showMenuDropdown = false; }, 150);
  }

  selecionarMenuDropdown(m: MenuSZC): void {
    this.menuSearch = m.menu + (m.descricao ? ' — ' + m.descricao : '');
    this.selectedMenuId = m.id;
    this.showMenuDropdown = false;
  }

  private resetMenuCombobox(): void {
    this.menuSearch = '';
    this.selectedMenuId = '';
    this.showMenuDropdown = false;
    this.menuFiltered = [];
    this.showAddMenu = false;
    this.msgMenu = '';
  }

  // ─── Add menu ────────────────────────────────────────────────
  adicionarMenu(): void {
    if (!this.expandedId || !this.selectedMenuId || this.addingMenu) return;
    this.addingMenu = true;
    this.msgMenu = '';
    this.patentesService.adicionarMenuPatente(this.expandedId, this.selectedMenuId).subscribe({
      next: res => {
        this.addingMenu = false;
        if (res?.success === false) {
          this.msgMenu = res.message || 'Erro ao adicionar.';
          this.msgMenuErro = true;
          return;
        }
        this.msgMenu = 'Menu adicionado.';
        this.msgMenuErro = false;
        this.resetMenuCombobox();
        this.carregarMenusPatente(this.expandedId!);
        setTimeout(() => { this.msgMenu = ''; }, 2500);
      },
      error: err => {
        this.addingMenu = false;
        this.msgMenu = err?.message || 'Erro ao adicionar.';
        this.msgMenuErro = true;
      }
    });
  }

  // ─── Remove menu ─────────────────────────────────────────────
  confirmarRemoverMenu(m: MenuAcessoPatente): void {
    this.menuToRemove = m;
    this.showConfirmRemoveMenu = true;
  }

  cancelarRemoverMenu(): void {
    this.menuToRemove = null;
    this.showConfirmRemoveMenu = false;
  }

  executarRemoverMenu(): void {
    if (!this.expandedId || !this.menuToRemove) return;
    const m = this.menuToRemove;
    this.showConfirmRemoveMenu = false;
    this.menuToRemove = null;
    this.patentesService.removerMenuPatente(this.expandedId, m.menu).subscribe({
      next: () => { this.carregarMenusPatente(this.expandedId!); },
      error: err => {
        this.msgMenu = err?.message || 'Erro ao remover.';
        this.msgMenuErro = true;
      }
    });
  }
}
