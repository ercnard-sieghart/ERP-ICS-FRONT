import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatentesService, PatenteGestao, MenuAcessoPatente, MenuSZC } from '../../shared/services/patentes.service';

const CI = 'flex items-center gap-2 px-3 py-2 rounded-lg border border-[#CBD8E1] bg-white text-sm text-[#1A4E79] focus:outline-none focus:ring-2 focus:ring-[#75C9C8] w-full';
const CB = 'px-3 py-2 bg-white border-l border-[#CBD8E1] rounded-r-lg text-[#1A4E79] hover:bg-[#f0f9f9] focus:outline-none flex-shrink-0';
const DD = 'absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#CBD8E1] rounded-lg shadow-lg max-h-52 overflow-y-auto';

@Component({
  selector: 'app-gestao-patentes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Loading overlay -->
    <div *ngIf="loading" class="fixed inset-0 bg-gradient-to-br from-[#1A4E79]/90 to-[#75C9C8]/90 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div class="bg-white rounded-xl p-8 shadow-2xl text-center min-w-[280px]">
        <div class="w-14 h-14 border-4 border-[#75C9C8]/30 border-t-[#1A4E79] rounded-full mx-auto mb-5 animate-spin"></div>
        <div class="text-lg font-bold text-[#1A4E79]">Carregando...</div>
      </div>
    </div>

    <main class="min-h-screen p-4 md:p-6 bg-gradient-to-br from-[#1A4E79] to-[#75C9C8] overflow-y-auto">
      <div class="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-5 md:p-8 border border-white/20">

        <!-- Header -->
        <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 class="text-2xl font-semibold text-[#1A4E79]">Gestão de Patentes</h1>
          <button
            (click)="abrirFormNova()"
            class="flex items-center gap-2 bg-gradient-to-r from-[#1A4E79] to-[#75C9C8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Nova Patente
          </button>
        </div>

        <!-- Two-column layout -->
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">

          <!-- Left: patent list -->
          <div class="lg:col-span-2 bg-white rounded-xl shadow border border-[#E6EEF2] flex flex-col">
            <div class="p-4 border-b border-[#E6EEF2]">
              <h2 class="font-semibold text-[#1A4E79]">Patentes cadastradas</h2>
            </div>
            <div *ngIf="patentes.length === 0" class="p-4 text-sm text-[#1A4E79]/60">Nenhuma patente encontrada.</div>
            <ul class="flex-1 overflow-y-auto divide-y divide-[#E6EEF2]">
              <li
                *ngFor="let p of patentes"
                class="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#f8fdfd] transition-colors cursor-pointer"
                [class.bg-[#edf7f7]]="selectedPatente?.codigo === p.codigo"
                (click)="selecionarPatente(p)">
                <div class="min-w-0">
                  <div class="font-medium text-[#1A4E79] truncate">{{ p.patente }}</div>
                  <div class="text-xs text-gray-500">ID: {{ p.codigo }}</div>
                  <div *ngIf="p.descricao" class="text-xs text-gray-400 truncate">{{ p.descricao }}</div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <button
                    (click)="abrirFormEditar(p); $event.stopPropagation()"
                    title="Editar"
                    class="p-1.5 rounded text-[#1A4E79] hover:bg-[#1A4E79]/10">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button
                    (click)="confirmarExcluir(p); $event.stopPropagation()"
                    title="Excluir"
                    class="p-1.5 rounded text-red-500 hover:bg-red-50">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </li>
            </ul>
          </div>

          <!-- Right: menu access panel -->
          <div class="lg:col-span-3 bg-white rounded-xl shadow border border-[#E6EEF2] flex flex-col">
            <div class="p-4 border-b border-[#E6EEF2]">
              <h2 class="font-semibold text-[#1A4E79]">
                <span *ngIf="!selectedPatente">Menus da patente</span>
                <span *ngIf="selectedPatente">
                  Menus: <span class="text-[#75C9C8]">{{ selectedPatente.patente }}</span>
                </span>
              </h2>
            </div>

            <div *ngIf="!selectedPatente" class="p-6 text-sm text-[#1A4E79]/60">
              Selecione uma patente à esquerda para gerenciar os menus de acesso.
            </div>

            <div *ngIf="selectedPatente" class="p-4 flex flex-col gap-4">

              <!-- Add menu typeahead -->
              <div>
                <label class="block text-xs font-medium text-[#1A4E79] mb-1">Adicionar menu</label>
                <div class="flex gap-2">
                  <div class="relative flex-1">
                    <div class="flex rounded-lg border border-[#CBD8E1] focus-within:ring-2 focus-within:ring-[#75C9C8] focus-within:border-[#75C9C8] overflow-hidden">
                      <input
                        type="text"
                        [(ngModel)]="menuSearch"
                        (input)="onMenuInput($event)"
                        (blur)="fecharMenuDropdown()"
                        placeholder="Buscar menu pelo nome..."
                        class="flex-1 px-3 py-2 text-sm text-[#1A4E79] bg-white focus:outline-none rounded-l-lg"
                        autocomplete="off" />
                      <button
                        type="button"
                        (mousedown)="toggleMenuDropdown($event)"
                        class="px-2 py-2 bg-white border-l border-[#CBD8E1] text-[#1A4E79] hover:bg-[#f0f9f9] focus:outline-none flex-shrink-0 rounded-r-lg">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                      </button>
                    </div>
                    <ul *ngIf="showMenuDropdown && menuFiltered.length > 0"
                        class="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#CBD8E1] rounded-lg shadow-lg max-h-52 overflow-y-auto">
                      <li
                        *ngFor="let m of menuFiltered"
                        (mousedown)="selecionarMenuDropdown(m)"
                        class="px-3 py-2 cursor-pointer hover:bg-[#f0f9f9]">
                        <div class="text-sm font-medium text-[#1A4E79]">{{ m.menu }}</div>
                        <div class="text-xs text-gray-500">{{ m.descricao }} — {{ m.rota }}</div>
                      </li>
                    </ul>
                  </div>
                  <button
                    (click)="adicionarMenu()"
                    [disabled]="!selectedMenuId || addingMenu"
                    class="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#1A4E79] to-[#75C9C8] text-white disabled:opacity-40 hover:opacity-90 transition-opacity flex-shrink-0">
                    {{ addingMenu ? '...' : 'Adicionar' }}
                  </button>
                </div>
                <div *ngIf="msgMenu" class="mt-1 text-xs" [class.text-red-600]="msgMenuErro" [class.text-green-600]="!msgMenuErro">{{ msgMenu }}</div>
              </div>

              <!-- Menus list -->
              <div>
                <div *ngIf="menusLoading" class="text-sm text-[#1A4E79]/60 py-4 text-center">Carregando menus...</div>
                <div *ngIf="!menusLoading && menusPatente.length === 0" class="text-sm text-[#1A4E79]/60 py-4">
                  Nenhum menu associado a esta patente.
                </div>
                <ul *ngIf="!menusLoading && menusPatente.length > 0" class="divide-y divide-[#E6EEF2] rounded-lg border border-[#E6EEF2] overflow-hidden">
                  <li *ngFor="let m of menusPatente" class="flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-[#f8fdfd]">
                    <div class="min-w-0">
                      <div class="text-sm font-medium text-[#1A4E79] truncate">{{ m.descricao || m.menu }}</div>
                      <div class="text-xs text-gray-400">ID: {{ m.menu }}</div>
                    </div>
                    <button
                      (click)="confirmarRemoverMenu(m)"
                      class="flex-shrink-0 text-xs text-red-500 border border-red-100 px-3 py-1 rounded hover:bg-red-50">
                      Remover
                    </button>
                  </li>
                </ul>
              </div>

            </div>
          </div>

        </div>

        <div *ngIf="mensagem" class="mt-4 text-sm text-red-600">{{ mensagem }}</div>
      </div>
    </main>

    <!-- Modal: Create / Edit patent -->
    <div *ngIf="showForm" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" (click)="fecharForm()"></div>
      <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h3 class="text-lg font-semibold text-[#1A4E79] mb-4">{{ isEditing ? 'Editar Patente' : 'Nova Patente' }}</h3>

        <div class="flex flex-col gap-4">
          <div>
            <label class="block text-xs font-medium text-[#1A4E79] mb-1">Nome *</label>
            <input
              type="text"
              [(ngModel)]="formData.nome"
              maxlength="30"
              placeholder="Nome da patente"
              class="w-full border border-[#CBD8E1] rounded-lg px-3 py-2 text-sm text-[#1A4E79] focus:outline-none focus:ring-2 focus:ring-[#75C9C8]" />
          </div>
          <div>
            <label class="block text-xs font-medium text-[#1A4E79] mb-1">Descrição</label>
            <input
              type="text"
              [(ngModel)]="formData.desc"
              maxlength="60"
              placeholder="Descrição da patente"
              class="w-full border border-[#CBD8E1] rounded-lg px-3 py-2 text-sm text-[#1A4E79] focus:outline-none focus:ring-2 focus:ring-[#75C9C8]" />
          </div>
          <div *ngIf="formErro" class="text-xs text-red-600">{{ formErro }}</div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button (click)="fecharForm()" class="px-4 py-2 rounded-lg text-sm border border-gray-200 bg-white text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button
            (click)="salvarPatente()"
            [disabled]="saving"
            class="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-[#1A4E79] to-[#75C9C8] text-white disabled:opacity-40 hover:opacity-90">
            {{ saving ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Confirm delete patent -->
    <div *ngIf="showConfirmDelete" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" (click)="cancelarExcluir()"></div>
      <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h3 class="text-lg font-semibold text-[#1A4E79] mb-2">Excluir patente</h3>
        <p class="text-sm text-gray-600 mb-4">
          Tem certeza que deseja excluir a patente
          <span class="font-medium text-[#1A4E79]">{{ patenteToDelete?.patente }}</span>?
          Todos os menus vinculados serão removidos.
        </p>
        <div class="flex justify-end gap-3">
          <button (click)="cancelarExcluir()" class="px-4 py-2 rounded-lg text-sm border border-gray-200 bg-white text-gray-600">Cancelar</button>
          <button (click)="executarExcluir()" class="px-4 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700">Excluir</button>
        </div>
      </div>
    </div>

    <!-- Modal: Confirm remove menu -->
    <div *ngIf="showConfirmRemoveMenu" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" (click)="cancelarRemoverMenu()"></div>
      <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h3 class="text-lg font-semibold text-[#1A4E79] mb-2">Remover menu</h3>
        <p class="text-sm text-gray-600 mb-4">
          Remover o acesso ao menu
          <span class="font-medium text-[#1A4E79]">{{ menuToRemove?.descricao || menuToRemove?.menu }}</span>
          desta patente?
        </p>
        <div class="flex justify-end gap-3">
          <button (click)="cancelarRemoverMenu()" class="px-4 py-2 rounded-lg text-sm border border-gray-200 bg-white text-gray-600">Cancelar</button>
          <button (click)="executarRemoverMenu()" class="px-4 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700">Remover</button>
        </div>
      </div>
    </div>
  `
})
export class GestaoPatentesComponent implements OnInit {
  loading = false;
  mensagem = '';

  patentes: PatenteGestao[] = [];
  selectedPatente: PatenteGestao | null = null;

  menusPatente: MenuAcessoPatente[] = [];
  menusLoading = false;
  todosMenus: MenuSZC[] = [];

  // Combobox para adicionar menu
  menuSearch = '';
  menuFiltered: MenuSZC[] = [];
  showMenuDropdown = false;
  selectedMenuId = '';
  addingMenu = false;
  msgMenu = '';
  msgMenuErro = false;

  // Form criar/editar patente
  showForm = false;
  isEditing = false;
  formData = { id: '', nome: '', desc: '' };
  formErro = '';
  saving = false;

  // Modais de confirmação
  showConfirmDelete = false;
  patenteToDelete: PatenteGestao | null = null;
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
        if (this.selectedPatente) {
          const atualizado = this.patentes.find(p => p.codigo === this.selectedPatente!.codigo);
          this.selectedPatente = atualizado || null;
        }
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

  selecionarPatente(p: PatenteGestao): void {
    this.selectedPatente = p;
    this.resetMenuCombobox();
    this.msgMenu = '';
    this.menusLoading = true;
    this.menusPatente = [];
    this.patentesService.listarAcessosPatente(p.codigo).subscribe({
      next: dados => {
        this.menusPatente = Array.isArray(dados) ? dados : [];
        this.menusLoading = false;
      },
      error: () => { this.menusLoading = false; }
    });
  }

  // ─── Form Create/Edit ───────────────────────────────────────
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
        if (res?.success === false) {
          this.formErro = res.message || 'Erro ao salvar.';
          return;
        }
        this.fecharForm();
        this.carregarPatentes();
      },
      error: err => {
        this.saving = false;
        this.formErro = err?.message || 'Erro ao salvar.';
      }
    });
  }

  // ─── Delete Patent ──────────────────────────────────────────
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
        if (this.selectedPatente?.codigo === p.codigo) {
          this.selectedPatente = null;
          this.menusPatente = [];
        }
        this.carregarPatentes();
      },
      error: err => {
        this.mensagem = err?.message || 'Erro ao excluir patente.';
        this.loading = false;
      }
    });
  }

  // ─── Menu combobox ──────────────────────────────────────────
  onMenuInput(event: Event): void {
    const q = (event.target as HTMLInputElement).value.toLowerCase();
    this.selectedMenuId = '';
    this.menuFiltered = q
      ? this.todosMenus.filter(m =>
          m.menu.toLowerCase().includes(q) || m.descricao.toLowerCase().includes(q))
      : this.todosMenus;
    this.showMenuDropdown = true;
  }

  toggleMenuDropdown(event: MouseEvent): void {
    event.preventDefault();
    if (this.showMenuDropdown) {
      this.showMenuDropdown = false;
    } else {
      this.menuFiltered = this.todosMenus;
      this.showMenuDropdown = true;
    }
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
  }

  // ─── Add menu to patent ─────────────────────────────────────
  adicionarMenu(): void {
    if (!this.selectedPatente || !this.selectedMenuId || this.addingMenu) return;
    this.addingMenu = true;
    this.msgMenu = '';
    this.patentesService.adicionarMenuPatente(this.selectedPatente.codigo, this.selectedMenuId).subscribe({
      next: res => {
        this.addingMenu = false;
        if (res?.success === false) {
          this.msgMenu = res.message || 'Erro ao adicionar.';
          this.msgMenuErro = true;
          return;
        }
        this.msgMenu = 'Menu adicionado com sucesso.';
        this.msgMenuErro = false;
        this.resetMenuCombobox();
        this.recarregarMenusPatente();
        setTimeout(() => { this.msgMenu = ''; }, 3000);
      },
      error: err => {
        this.addingMenu = false;
        this.msgMenu = err?.message || 'Erro ao adicionar menu.';
        this.msgMenuErro = true;
      }
    });
  }

  // ─── Remove menu from patent ────────────────────────────────
  confirmarRemoverMenu(m: MenuAcessoPatente): void {
    this.menuToRemove = m;
    this.showConfirmRemoveMenu = true;
  }

  cancelarRemoverMenu(): void {
    this.menuToRemove = null;
    this.showConfirmRemoveMenu = false;
  }

  executarRemoverMenu(): void {
    if (!this.selectedPatente || !this.menuToRemove) return;
    const m = this.menuToRemove;
    this.showConfirmRemoveMenu = false;
    this.menuToRemove = null;
    this.patentesService.removerMenuPatente(this.selectedPatente.codigo, m.menu).subscribe({
      next: () => { this.recarregarMenusPatente(); },
      error: err => {
        this.msgMenu = err?.message || 'Erro ao remover menu.';
        this.msgMenuErro = true;
      }
    });
  }

  private recarregarMenusPatente(): void {
    if (!this.selectedPatente) return;
    this.menusLoading = true;
    this.patentesService.listarAcessosPatente(this.selectedPatente.codigo).subscribe({
      next: dados => {
        this.menusPatente = Array.isArray(dados) ? dados : [];
        this.menusLoading = false;
      },
      error: () => { this.menusLoading = false; }
    });
  }
}
