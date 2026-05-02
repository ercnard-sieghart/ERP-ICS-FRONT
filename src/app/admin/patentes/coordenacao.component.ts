import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatentesService } from '../../shared/services/patentes.service';
import type { Patente, Usuario } from '../../shared/models/patentes.models';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-patentes-coordenacao',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Loading overlay -->
    <div *ngIf="loading" class="fixed inset-0 bg-[#1A4E79]/80 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div class="bg-white rounded-xl p-6 shadow-2xl text-center">
        <div class="w-10 h-10 border-4 border-[#75C9C8]/30 border-t-[#1A4E79] rounded-full mx-auto mb-3 animate-spin"></div>
        <p class="text-sm font-semibold text-[#1A4E79]">Carregando...</p>
      </div>
    </div>

    <!-- Notificação flutuante -->
    <div *ngIf="notifMsg"
         class="fixed top-4 right-4 z-[9998] max-w-sm px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white transition-all"
         [class.bg-green-500]="notifType === 'success'"
         [class.bg-amber-500]="notifType === 'warning'"
         [class.bg-red-500]="notifType === 'error'">
      {{ notifMsg }}
    </div>

    <main class="h-full flex flex-col bg-gradient-to-br from-[#1A4E79] to-[#75C9C8] overflow-hidden">
      <div class="flex-shrink-0 px-3 md:px-6 pt-3 md:pt-6 pb-2">
        <div class="max-w-5xl mx-auto">
          <h1 class="text-xl md:text-2xl font-bold text-white text-center md:text-left mx-auto md:mx-0">Coordenação de Patentes</h1>
        </div>
      </div>

      <div class="flex-1 min-h-0 overflow-hidden flex flex-col px-3 md:px-6 pb-3 md:pb-6">
        <div class="max-w-5xl mx-auto w-full flex-1 min-h-0 flex flex-col">

          <!-- ── MOBILE: accordion ── -->
          <div class="flex flex-col gap-2 lg:hidden flex-1 overflow-y-auto">
            <div *ngIf="!loading && patentes.length === 0"
                 class="bg-white/90 rounded-xl p-6 text-center text-[#1A4E79]/60 text-sm">
              Nenhuma patente cadastrada.
            </div>
            <div *ngFor="let p of patentes" class="bg-white rounded-xl shadow overflow-hidden">
              <div class="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-[#f8fdfd] active:bg-[#edf7f7]"
                   (click)="toggleAccordion(p)">
                <svg class="w-4 h-4 flex-shrink-0 text-[#75C9C8] transition-transform duration-200"
                     [class.rotate-180]="selectedPatente?.id === p.id"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
                </svg>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-[#1A4E79] truncate">{{ p.nome || p.label || p.id }}</div>
                  <div class="text-xs text-gray-400">ID: {{ p.id }}</div>
                </div>
              </div>
              <ng-container *ngIf="selectedPatente?.id === p.id">
                <ng-container *ngTemplateOutlet="usersPanel"></ng-container>
              </ng-container>
            </div>
          </div>

          <!-- ── DESKTOP: split ── -->
          <div class="hidden lg:flex flex-1 min-h-0 bg-white rounded-xl shadow overflow-hidden">
            <!-- Left: patent list -->
            <div class="w-[280px] flex-shrink-0 border-r border-[#E6EEF2] flex flex-col overflow-hidden">
              <div class="px-4 py-3 border-b border-[#E6EEF2] bg-[#f8fdfd] flex-shrink-0">
                <span class="text-xs font-semibold text-[#1A4E79] uppercase tracking-wide">
                  Patentes ({{ patentes.length }})
                </span>
              </div>
              <div *ngIf="!loading && patentes.length === 0" class="p-4 text-sm text-[#1A4E79]/50">
                Nenhuma cadastrada.
              </div>
              <ul class="flex-1 overflow-y-auto divide-y divide-[#E6EEF2]">
                <li *ngFor="let p of patentes"
                    (click)="selecionarPatente(p)"
                    class="flex items-start gap-2 px-4 py-3 cursor-pointer hover:bg-[#f8fdfd] transition-colors"
                    [class.bg-[#edf7f7]]="selectedPatente?.id === p.id"
                    [class.border-l-2]="selectedPatente?.id === p.id"
                    [class.border-l-[#75C9C8]]="selectedPatente?.id === p.id">
                  <div class="flex-1 min-w-0 pt-0.5">
                    <div class="text-sm font-semibold text-[#1A4E79] truncate">{{ p.nome || p.label || p.id }}</div>
                    <div class="text-xs text-gray-400">ID: {{ p.id }}</div>
                  </div>
                </li>
              </ul>
            </div>

            <!-- Right: users panel -->
            <div class="flex-1 flex flex-col overflow-y-auto">
              <div *ngIf="!selectedPatente" class="flex-1 flex items-center justify-center text-sm text-[#1A4E79]/40">
                <div class="text-center">
                  <svg class="w-10 h-10 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Selecione uma patente
                </div>
              </div>
              <ng-container *ngIf="selectedPatente">
                <ng-container *ngTemplateOutlet="usersPanel"></ng-container>
              </ng-container>
            </div>
          </div>

          <div *ngIf="mensagem" class="mt-3 flex-shrink-0 bg-red-100 border border-red-300 rounded-lg p-3 text-sm text-red-700">
            {{ mensagem }}
          </div>
        </div>
      </div>
    </main>

    <!-- ═══ TEMPLATE COMPARTILHADO: painel de usuários ═══ -->
    <ng-template #usersPanel>
      <div class="border-t border-[#E6EEF2] bg-[#f8fdfd] p-4">

        <!-- Header do painel -->
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-[#1A4E79] uppercase tracking-wide">
            Usuários<span *ngIf="usuarios.length"> ({{ usuarios.length }})</span>
          </span>
          <button
            (click)="toggleAddUserForm()"
            class="flex items-center gap-1 text-xs text-[#1A4E79] border border-[#75C9C8] px-2.5 py-1 rounded-lg hover:bg-[#75C9C8]/10 font-medium transition-colors">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
            </svg>
            Adicionar
          </button>
        </div>

        <!-- Formulário de busca de usuário -->
        <div *ngIf="showAddUserForm" class="mb-3 p-3 bg-white rounded-lg border border-[#CBD8E1]">
          <div class="flex gap-2">
            <div class="relative flex-1">
              <div class="flex rounded-lg border border-[#CBD8E1] focus-within:ring-2 focus-within:ring-[#75C9C8] overflow-hidden">
                <input
                  type="text"
                  [(ngModel)]="userSearchQuery"
                  (ngModelChange)="onUserQueryChange($event)"
                  (blur)="fecharUserDropdown()"
                  placeholder="Buscar usuário..."
                  autocomplete="off"
                  class="flex-1 px-3 py-2 text-sm text-[#1A4E79] bg-white focus:outline-none min-w-0" />
              </div>
              <ul *ngIf="showUserDropdown && userSearchSuggestions.length > 0"
                  class="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#CBD8E1] rounded-lg shadow-xl max-h-44 overflow-y-auto">
                <li *ngFor="let u of userSearchSuggestions"
                    (mousedown)="selectUserSuggestion(u)"
                    class="px-3 py-2 cursor-pointer hover:bg-[#f0f9f9] border-b border-[#E6EEF2] last:border-0">
                  <div class="text-sm font-medium text-[#1A4E79]">{{ u.nome || u.login || u.id }}</div>
                  <div class="text-xs text-gray-400">{{ u.email || '' }}</div>
                </li>
              </ul>
            </div>
            <button
              (click)="confirmarAdicionarUsuario()"
              [disabled]="!novoUsuarioId || usersLoading"
              class="flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#1A4E79] to-[#75C9C8] text-white disabled:opacity-40 active:scale-95 transition-all">
              OK
            </button>
            <button
              (click)="cancelarAdicionarUsuario()"
              class="flex-shrink-0 px-3 py-2 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">
              ✕
            </button>
          </div>
          <div *ngIf="!novoUsuarioId && userSearchQuery" class="mt-1.5 text-xs text-amber-600">
            Selecione um usuário na lista antes de confirmar.
          </div>
        </div>

        <!-- Loading -->
        <div *ngIf="usersLoading" class="text-sm text-[#1A4E79]/50 text-center py-4">Carregando...</div>

        <!-- Vazio -->
        <div *ngIf="!usersLoading && usuarios.length === 0" class="text-xs text-gray-400 py-2">
          Nenhum usuário atribuído a esta patente.
        </div>

        <!-- Lista de usuários -->
        <ul *ngIf="!usersLoading && usuarios.length > 0"
            class="divide-y divide-[#E6EEF2] rounded-lg border border-[#E6EEF2] overflow-hidden bg-white">
          <li *ngFor="let u of usuarios" class="flex items-center gap-3 px-3 py-2.5 hover:bg-[#f8fdfd]">
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-[#1A4E79] truncate">{{ u.nome || u.login || u.id }}</div>
              <div *ngIf="u.email" class="text-xs text-gray-400">{{ u.email }}</div>
            </div>
            <button (click)="openRemoveModal(u)"
              class="flex-shrink-0 p-1.5 rounded text-red-400 hover:bg-red-50 active:bg-red-100 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </li>
        </ul>
      </div>
    </ng-template>

    <!-- ═══ MODAL: Confirmar remoção ═══ -->
    <div *ngIf="showRemoveModal" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div class="absolute inset-0 bg-black/50" (click)="cancelRemove()"></div>
      <div class="relative bg-white w-full sm:max-w-sm sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl p-5">
        <h3 class="text-base font-semibold text-[#1A4E79] mb-2">Remover usuário</h3>
        <p class="text-sm text-gray-600 mb-4">
          Remover <span class="font-semibold text-[#1A4E79]">{{ userToRemove?.nome || userToRemove?.login || userToRemove?.id }}</span> desta patente?
        </p>
        <div class="flex gap-3">
          <button (click)="cancelRemove()" class="flex-1 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-600">Cancelar</button>
          <button (click)="confirmRemoveUser()" class="flex-1 py-2.5 rounded-lg text-sm bg-red-600 text-white font-medium">Remover</button>
        </div>
      </div>
    </div>
  `
})
export class CoordenacaoComponent implements OnInit, OnDestroy {
  loading = false;
  mensagem = '';
  notifMsg = '';
  notifType: 'success' | 'warning' | 'error' = 'success';
  private notifTimer: any;

  patentes: Patente[] = [];
  selectedPatente: Patente | null = null;
  usuarios: Usuario[] = [];
  usersLoading = false;

  showAddUserForm = false;
  userSearchQuery = '';
  novoUsuarioId = '';
  userSearchSuggestions: Usuario[] = [];
  showUserDropdown = false;

  showRemoveModal = false;
  userToRemove: Usuario | null = null;

  private userSearch$ = new Subject<string>();
  private userSearchSub?: Subscription;

  constructor(private patentesService: PatentesService) {}

  ngOnInit(): void {
    this.carregarPatentes();
    this.userSearchSub = this.userSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => this.patentesService.searchUsuarios(q))
    ).subscribe(results => {
      this.userSearchSuggestions = Array.isArray(results) ? results : [];
      this.showUserDropdown = this.userSearchSuggestions.length > 0;
    });
  }

  ngOnDestroy(): void {
    this.userSearchSub?.unsubscribe();
    clearTimeout(this.notifTimer);
  }

  private mostrarNotif(msg: string, type: 'success' | 'warning' | 'error' = 'success'): void {
    clearTimeout(this.notifTimer);
    this.notifMsg = msg;
    this.notifType = type;
    this.notifTimer = setTimeout(() => { this.notifMsg = ''; }, 3500);
  }

  carregarPatentes(): void {
    this.loading = true;
    this.patentesService.listarPatentes().subscribe({
      next: dados => { this.patentes = Array.isArray(dados) ? dados : []; this.loading = false; },
      error: () => { this.mensagem = 'Erro ao carregar patentes.'; this.loading = false; }
    });
  }

  toggleAccordion(p: Patente): void {
    if (this.selectedPatente?.id === p.id) {
      this.selectedPatente = null;
      this.usuarios = [];
      this.resetAddUserForm();
    } else {
      this.selecionarPatente(p);
    }
  }

  selecionarPatente(p: Patente): void {
    if (this.selectedPatente?.id === p.id) return;
    this.selectedPatente = p;
    this.usuarios = [];
    this.resetAddUserForm();
    if (!p?.id) return;
    this.usersLoading = true;
    this.patentesService.listarUsuariosPorPatentePertence(p.id).subscribe({
      next: dados => { this.usuarios = Array.isArray(dados) ? dados : []; this.usersLoading = false; },
      error: () => { this.mensagem = 'Erro ao carregar usuários.'; this.usersLoading = false; }
    });
  }

  private refreshUsuarios(): void {
    if (!this.selectedPatente?.id) return;
    this.usersLoading = true;
    this.patentesService.listarUsuariosPorPatentePertence(this.selectedPatente.id).subscribe({
      next: dados => { this.usuarios = Array.isArray(dados) ? dados : []; this.usersLoading = false; },
      error: () => { this.usersLoading = false; }
    });
  }

  toggleAddUserForm(): void {
    this.showAddUserForm = !this.showAddUserForm;
    if (!this.showAddUserForm) this.resetAddUserForm();
  }

  cancelarAdicionarUsuario(): void {
    this.showAddUserForm = false;
    this.resetAddUserForm();
  }

  private resetAddUserForm(): void {
    this.userSearchQuery = '';
    this.novoUsuarioId = '';
    this.userSearchSuggestions = [];
    this.showUserDropdown = false;
  }

  onUserQueryChange(q: string): void {
    this.novoUsuarioId = '';
    if (q) {
      this.showUserDropdown = true;
      this.userSearch$.next(q);
    } else {
      this.userSearchSuggestions = [];
      this.showUserDropdown = false;
    }
  }

  fecharUserDropdown(): void {
    setTimeout(() => { this.showUserDropdown = false; }, 150);
  }

  selectUserSuggestion(user: any): void {
    this.userSearchQuery = (user.nome || user.name || user.login || user.id || '').toString();
    this.novoUsuarioId = (user.id || user.USER_ID || user.usuario_id || user.USERID || '').toString();
    this.userSearchSuggestions = [];
    this.showUserDropdown = false;
  }

  confirmarAdicionarUsuario(): void {
    const uid = this.novoUsuarioId?.trim();
    if (!this.selectedPatente?.id || !uid) return;
    this.patentesService.atribuirUsuarioPatente(this.selectedPatente.id, uid).subscribe({
      next: () => {
        this.mostrarNotif('Usuário atribuído com sucesso.', 'success');
        this.cancelarAdicionarUsuario();
        this.refreshUsuarios();
      },
      error: () => {
        this.mostrarNotif('Erro ao atribuir usuário.', 'error');
        this.cancelarAdicionarUsuario();
      }
    });
  }

  openRemoveModal(usuario: Usuario): void {
    this.userToRemove = usuario;
    this.showRemoveModal = true;
  }

  cancelRemove(): void {
    this.userToRemove = null;
    this.showRemoveModal = false;
  }

  confirmRemoveUser(): void {
    if (!this.selectedPatente?.id || !this.userToRemove) return;
    const usuario = this.userToRemove;
    this.cancelRemove();
    this.patentesService.removerUsuarioPatente(this.selectedPatente.id, usuario.id).subscribe({
      next: (resp: any) => {
        if (resp?.alreadyRemoved) {
          this.mostrarNotif('Usuário já removido da patente.', 'warning');
        } else {
          this.mostrarNotif('Usuário removido com sucesso.', 'success');
        }
        this.refreshUsuarios();
      },
      error: (err: any) => {
        if (err?.status === 404) {
          this.mostrarNotif('Usuário já removido da patente.', 'warning');
          this.refreshUsuarios();
          return;
        }
        this.mostrarNotif('Erro ao remover usuário.', 'error');
      }
    });
  }
}
