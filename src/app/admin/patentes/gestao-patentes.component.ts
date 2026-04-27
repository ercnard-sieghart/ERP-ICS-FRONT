import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatentesService, PatenteGestao, MenuAcessoPatente, MenuSZC } from '../../shared/services/patentes.service';

type Tab = 'patentes' | 'menus';

@Component({
  selector: 'app-gestao-patentes',
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

    <main class="h-full flex flex-col bg-gradient-to-br from-[#1A4E79] to-[#75C9C8] overflow-hidden">
      <!-- Cabeçalho fixo: título + tabs -->
      <div class="flex-shrink-0 px-3 md:px-6 pt-3 md:pt-6 pb-2">
        <div class="max-w-5xl mx-auto">
          <h1 class="text-xl md:text-2xl font-bold text-white mb-3">Gestão de Patentes</h1>
          <div class="flex gap-1 bg-white/20 rounded-xl p-1 w-fit">
            <button (click)="activeTab = 'patentes'" [class]="activeTab === 'patentes' ? tabActive : tabInactive">Patentes</button>
            <button (click)="activeTab = 'menus'" [class]="activeTab === 'menus' ? tabActive : tabInactive">Menus do Sistema</button>
          </div>
        </div>
      </div>

      <!-- Conteúdo: preenche o restante da viewport -->
      <div class="flex-1 min-h-0 overflow-hidden flex flex-col px-3 md:px-6 pb-3 md:pb-6">
        <div class="max-w-5xl mx-auto w-full flex-1 min-h-0 flex flex-col">

        <!-- ══════════════════════════════════════════════════
             TAB: PATENTES
        ══════════════════════════════════════════════════ -->
        <div *ngIf="activeTab === 'patentes'" class="flex-1 min-h-0 flex flex-col">

          <!-- "+ Nova Patente" always visible -->
          <div class="flex justify-end mb-3 flex-shrink-0">
            <button
              (click)="abrirFormNova()"
              class="flex items-center gap-2 bg-white text-[#1A4E79] px-4 py-2 rounded-lg text-sm font-semibold shadow hover:bg-[#f0f9f9] active:scale-95 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
              Nova Patente
            </button>
          </div>

          <!-- ── MOBILE: accordion (hidden on lg+) ── -->
          <div class="flex flex-col gap-2 lg:hidden flex-1 overflow-y-auto">
            <div *ngIf="!loading && patentes.length === 0" class="bg-white/90 rounded-xl p-6 text-center text-[#1A4E79]/60 text-sm">
              Nenhuma patente cadastrada.
            </div>
            <div *ngFor="let p of patentes" class="bg-white rounded-xl shadow overflow-hidden">
              <!-- Patent row -->
              <div class="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-[#f8fdfd] active:bg-[#edf7f7]"
                   (click)="toggleAccordion(p)">
                <svg class="w-4 h-4 flex-shrink-0 text-[#75C9C8] transition-transform duration-200"
                     [class.rotate-180]="expandedId === p.codigo"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
                </svg>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-[#1A4E79] truncate">{{ p.patente }}</div>
                  <div class="text-xs text-gray-400">ID: {{ p.codigo }}<span *ngIf="p.descricao"> · {{ p.descricao }}</span></div>
                </div>
                <div class="flex gap-1 flex-shrink-0" (click)="$event.stopPropagation()">
                  <button (click)="abrirFormEditar(p)" class="p-2 rounded text-[#1A4E79] hover:bg-[#1A4E79]/10">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button (click)="confirmarExcluirPatente(p)" class="p-2 rounded text-red-400 hover:bg-red-50">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
              <!-- Accordion body -->
              <ng-container *ngIf="expandedId === p.codigo">
                <ng-container *ngTemplateOutlet="menusPanel"></ng-container>
              </ng-container>
            </div>
          </div>

          <!-- ── DESKTOP: split layout (hidden on mobile) ── -->
          <div class="hidden lg:flex flex-1 min-h-0 bg-white rounded-xl shadow overflow-hidden">
            <!-- Left: patent list -->
            <div class="w-[280px] flex-shrink-0 border-r border-[#E6EEF2] flex flex-col overflow-hidden">
              <div class="px-4 py-3 border-b border-[#E6EEF2] bg-[#f8fdfd]">
                <span class="text-xs font-semibold text-[#1A4E79] uppercase tracking-wide">Patentes ({{ patentes.length }})</span>
              </div>
              <div *ngIf="!loading && patentes.length === 0" class="p-4 text-sm text-[#1A4E79]/50">Nenhuma cadastrada.</div>
              <ul class="flex-1 overflow-y-auto divide-y divide-[#E6EEF2]">
                <li *ngFor="let p of patentes"
                    (click)="selecionarDesktop(p)"
                    class="group flex items-start gap-2 px-4 py-3 cursor-pointer hover:bg-[#f8fdfd] transition-colors"
                    [class.bg-[#edf7f7]]="expandedId === p.codigo"
                    [class.border-l-2]="expandedId === p.codigo"
                    [class.border-l-[#75C9C8]]="expandedId === p.codigo">
                  <div class="flex-1 min-w-0 pt-0.5">
                    <div class="text-sm font-semibold text-[#1A4E79] truncate">{{ p.patente }}</div>
                    <div class="text-xs text-gray-400">ID: {{ p.codigo }}</div>
                    <div *ngIf="p.descricao" class="text-xs text-gray-400 truncate">{{ p.descricao }}</div>
                  </div>
                  <div class="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 pt-0.5" (click)="$event.stopPropagation()">
                    <button (click)="abrirFormEditar(p)" class="p-1.5 rounded text-[#1A4E79] hover:bg-[#1A4E79]/10">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button (click)="confirmarExcluirPatente(p)" class="p-1.5 rounded text-red-400 hover:bg-red-50">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </li>
              </ul>
            </div>

            <!-- Right: menus panel -->
            <div class="flex-1 flex flex-col overflow-y-auto">
              <div *ngIf="!expandedId" class="flex-1 flex items-center justify-center text-sm text-[#1A4E79]/40">
                <div class="text-center">
                  <svg class="w-10 h-10 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                  Selecione uma patente
                </div>
              </div>
              <ng-container *ngIf="expandedId">
                <ng-container *ngTemplateOutlet="menusPanel"></ng-container>
              </ng-container>
            </div>
          </div>
        </div>

        <!-- ══════════════════════════════════════════════════
             TAB: MENUS DO SISTEMA
        ══════════════════════════════════════════════════ -->
        <div *ngIf="activeTab === 'menus'" class="flex-1 min-h-0 flex flex-col">
          <div class="bg-white rounded-xl shadow overflow-hidden flex-1 flex flex-col">
            <!-- Header -->
            <div class="flex items-center justify-between px-4 py-3 border-b border-[#E6EEF2] bg-[#f8fdfd]">
              <span class="text-sm font-semibold text-[#1A4E79]">Menus do sistema</span>
              <button
                (click)="abrirFormNovoMenu()"
                class="flex items-center gap-1.5 bg-gradient-to-r from-[#1A4E79] to-[#75C9C8] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 active:scale-95 transition-all">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                Novo Menu
              </button>
            </div>

            <!-- Mobile: card list -->
            <div class="lg:hidden flex-1 overflow-y-auto divide-y divide-[#E6EEF2]">
              <div *ngIf="!menusAdmin.length && !loading" class="p-6 text-center text-sm text-[#1A4E79]/50">Nenhum menu cadastrado.</div>
              <div *ngFor="let m of menusAdmin" class="px-4 py-3 flex items-start gap-3">
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-sm text-[#1A4E79]">{{ m.menu }}</div>
                  <div class="text-xs text-gray-400 font-mono">{{ m.rota }}</div>
                  <div *ngIf="m.descricao" class="text-xs text-gray-400">{{ m.descricao }}</div>
                  <div class="text-xs text-gray-300">ID: {{ m.id }}</div>
                </div>
                <div class="flex gap-1 flex-shrink-0">
                  <button (click)="abrirFormEditarMenu(m)" class="p-1.5 rounded text-[#1A4E79] hover:bg-[#1A4E79]/10">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button (click)="confirmarExcluirMenu(m)" class="p-1.5 rounded text-red-400 hover:bg-red-50">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Desktop: table -->
            <div class="hidden lg:block flex-1 overflow-y-auto overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-[#f8fdfd] text-xs text-[#1A4E79]/70 uppercase tracking-wide">
                    <th class="px-4 py-2.5 text-left font-semibold w-24">ID</th>
                    <th class="px-4 py-2.5 text-left font-semibold">Label</th>
                    <th class="px-4 py-2.5 text-left font-semibold">Rota</th>
                    <th class="px-4 py-2.5 text-left font-semibold">Descrição</th>
                    <th class="px-4 py-2.5 text-center font-semibold w-24">Ações</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E6EEF2]">
                  <tr *ngIf="!menusAdmin.length && !loading">
                    <td colspan="5" class="px-4 py-8 text-center text-[#1A4E79]/40">Nenhum menu cadastrado.</td>
                  </tr>
                  <tr *ngFor="let m of menusAdmin" class="hover:bg-[#f8fdfd] transition-colors">
                    <td class="px-4 py-2.5 font-mono text-xs text-gray-400">{{ m.id }}</td>
                    <td class="px-4 py-2.5 font-medium text-[#1A4E79]">{{ m.menu }}</td>
                    <td class="px-4 py-2.5 font-mono text-xs text-[#75C9C8]">{{ m.rota }}</td>
                    <td class="px-4 py-2.5 text-gray-500 text-xs">{{ m.descricao }}</td>
                    <td class="px-4 py-2.5">
                      <div class="flex items-center justify-center gap-1">
                        <button (click)="abrirFormEditarMenu(m)" class="p-1.5 rounded text-[#1A4E79] hover:bg-[#1A4E79]/10">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button (click)="confirmarExcluirMenu(m)" class="p-1.5 rounded text-red-400 hover:bg-red-50">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div *ngIf="mensagem" class="mt-3 flex-shrink-0 bg-red-100 border border-red-300 rounded-lg p-3 text-sm text-red-700">{{ mensagem }}</div>
        </div>
      </div>
    </main>

    <!-- ═══ SHARED TEMPLATE: Menus panel (usado em accordion mobile + desktop split) ═══ -->
    <ng-template #menusPanel>
      <div class="border-t border-[#E6EEF2] bg-[#f8fdfd] p-4">
        <!-- Panel header -->
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-[#1A4E79] uppercase tracking-wide">
            Menus de acesso<span *ngIf="menusPatente.length"> ({{ menusPatente.length }})</span>
          </span>
          <button
            (click)="showAddMenu = !showAddMenu; msgMenu = ''"
            class="flex items-center gap-1 text-xs text-[#1A4E79] border border-[#75C9C8] px-2.5 py-1 rounded-lg hover:bg-[#75C9C8]/10 font-medium transition-colors">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
            Adicionar
          </button>
        </div>

        <!-- Add menu form -->
        <div *ngIf="showAddMenu" class="mb-3 p-3 bg-white rounded-lg border border-[#CBD8E1]">
          <div class="flex gap-2">
            <div class="relative flex-1">
              <div class="flex rounded-lg border border-[#CBD8E1] focus-within:ring-2 focus-within:ring-[#75C9C8] overflow-hidden">
                <input
                  type="text"
                  [(ngModel)]="menuSearch"
                  (input)="onMenuInput($event)"
                  (blur)="fecharMenuDropdown()"
                  placeholder="Buscar menu..."
                  autocomplete="off"
                  class="flex-1 px-3 py-2 text-sm text-[#1A4E79] bg-white focus:outline-none min-w-0" />
                <button type="button" (mousedown)="toggleMenuDropdown($event)"
                  class="px-2 bg-white border-l border-[#CBD8E1] text-[#1A4E79] hover:bg-[#f0f9f9] focus:outline-none">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </button>
              </div>
              <ul *ngIf="showMenuDropdown && menuFiltered.length > 0"
                  class="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#CBD8E1] rounded-lg shadow-xl max-h-44 overflow-y-auto">
                <li *ngFor="let m of menuFiltered" (mousedown)="selecionarMenuDropdown(m)"
                    class="px-3 py-2 cursor-pointer hover:bg-[#f0f9f9] border-b border-[#E6EEF2] last:border-0">
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

        <!-- Menu list -->
        <div *ngIf="menusLoading" class="text-sm text-[#1A4E79]/50 text-center py-4">Carregando...</div>
        <div *ngIf="!menusLoading && menusPatente.length === 0" class="text-xs text-gray-400 py-2">
          Nenhum menu associado a esta patente.
        </div>
        <ul *ngIf="!menusLoading && menusPatente.length > 0"
            class="divide-y divide-[#E6EEF2] rounded-lg border border-[#E6EEF2] overflow-hidden bg-white">
          <li *ngFor="let m of menusPatente" class="flex items-center gap-3 px-3 py-2.5 hover:bg-[#f8fdfd]">
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-[#1A4E79] truncate">{{ m.descricao || m.menu }}</div>
              <div class="text-xs text-gray-400">ID: {{ m.menu }}</div>
            </div>
            <button (click)="confirmarRemoverMenu(m)"
              class="flex-shrink-0 p-1.5 rounded text-red-400 hover:bg-red-50 active:bg-red-100 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </li>
        </ul>
      </div>
    </ng-template>

    <!-- ═══ MODAL: Criar / Editar patente ═══ -->
    <div *ngIf="showFormPatente" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div class="absolute inset-0 bg-black/50" (click)="fecharFormPatente()"></div>
      <div class="relative bg-white w-full sm:max-w-md sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl p-5">
        <h3 class="text-base font-semibold text-[#1A4E79] mb-4">{{ isEditingPatente ? 'Editar Patente' : 'Nova Patente' }}</h3>
        <div class="flex flex-col gap-3">
          <div>
            <label class="block text-xs font-medium text-[#1A4E79] mb-1">Nome *</label>
            <input type="text" [(ngModel)]="formPatente.nome" maxlength="30" placeholder="Ex: Financeiro"
              class="w-full border border-[#CBD8E1] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#75C9C8] text-[#1A4E79]" />
          </div>
          <div>
            <label class="block text-xs font-medium text-[#1A4E79] mb-1">Descrição</label>
            <input type="text" [(ngModel)]="formPatente.desc" maxlength="60" placeholder="Descrição opcional"
              class="w-full border border-[#CBD8E1] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#75C9C8] text-[#1A4E79]" />
          </div>
          <div *ngIf="formErroPatente" class="text-xs text-red-500 bg-red-50 rounded p-2">{{ formErroPatente }}</div>
        </div>
        <div class="flex gap-3 mt-5">
          <button (click)="fecharFormPatente()" class="flex-1 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-600">Cancelar</button>
          <button (click)="salvarPatente()" [disabled]="saving"
            class="flex-1 py-2.5 rounded-lg text-sm bg-gradient-to-r from-[#1A4E79] to-[#75C9C8] text-white font-medium disabled:opacity-40">
            {{ saving ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ═══ MODAL: Criar / Editar menu SZC ═══ -->
    <div *ngIf="showFormMenu" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div class="absolute inset-0 bg-black/50" (click)="fecharFormMenu()"></div>
      <div class="relative bg-white w-full sm:max-w-md sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl p-5">
        <h3 class="text-base font-semibold text-[#1A4E79] mb-4">{{ isEditingMenu ? 'Editar Menu' : 'Novo Menu' }}</h3>
        <div class="flex flex-col gap-3">
          <div>
            <label class="block text-xs font-medium text-[#1A4E79] mb-1">Label  *</label>
            <input type="text" [(ngModel)]="formMenu.menu" maxlength="30" placeholder="Ex: Financeiro"
              class="w-full border border-[#CBD8E1] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#75C9C8] text-[#1A4E79]" />
          </div>
          <div>
            <label class="block text-xs font-medium text-[#1A4E79] mb-1">Rota  *</label>
            <input type="text" [(ngModel)]="formMenu.rota" maxlength="80" placeholder="Ex: /financeiro"
              class="w-full border border-[#CBD8E1] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#75C9C8] text-[#1A4E79] font-mono" />
          </div>
          <div>
            <label class="block text-xs font-medium text-[#1A4E79] mb-1">Descrição </label>
            <input type="text" [(ngModel)]="formMenu.desc" maxlength="60" placeholder="Descrição opcional"
              class="w-full border border-[#CBD8E1] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#75C9C8] text-[#1A4E79]" />
          </div>
          <div *ngIf="formErroMenu" class="text-xs text-red-500 bg-red-50 rounded p-2">{{ formErroMenu }}</div>
        </div>
        <div class="flex gap-3 mt-5">
          <button (click)="fecharFormMenu()" class="flex-1 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-600">Cancelar</button>
          <button (click)="salvarMenu()" [disabled]="saving"
            class="flex-1 py-2.5 rounded-lg text-sm bg-gradient-to-r from-[#1A4E79] to-[#75C9C8] text-white font-medium disabled:opacity-40">
            {{ saving ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ═══ MODAL: Confirmar exclusão de patente ═══ -->
    <div *ngIf="showConfirmDeletePatente" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div class="absolute inset-0 bg-black/50" (click)="showConfirmDeletePatente = false"></div>
      <div class="relative bg-white w-full sm:max-w-sm sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl p-5">
        <h3 class="text-base font-semibold text-[#1A4E79] mb-2">Excluir patente</h3>
        <p class="text-sm text-gray-600 mb-4">Excluir <span class="font-semibold text-[#1A4E79]">{{ patenteToDelete?.patente }}</span>? Todos os menus vinculados serão removidos.</p>
        <div class="flex gap-3">
          <button (click)="showConfirmDeletePatente = false" class="flex-1 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-600">Cancelar</button>
          <button (click)="executarExcluirPatente()" class="flex-1 py-2.5 rounded-lg text-sm bg-red-600 text-white font-medium">Excluir</button>
        </div>
      </div>
    </div>

    <!-- ═══ MODAL: Confirmar exclusão de menu SZC ═══ -->
    <div *ngIf="showConfirmDeleteMenu" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div class="absolute inset-0 bg-black/50" (click)="showConfirmDeleteMenu = false"></div>
      <div class="relative bg-white w-full sm:max-w-sm sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl p-5">
        <h3 class="text-base font-semibold text-[#1A4E79] mb-2">Excluir menu</h3>
        <p class="text-sm text-gray-600 mb-4">Excluir o menu <span class="font-semibold text-[#1A4E79]">{{ menuToDeleteSZC?.menu }}</span>? Todos os vínculos com patentes serão removidos.</p>
        <div class="flex gap-3">
          <button (click)="showConfirmDeleteMenu = false" class="flex-1 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-600">Cancelar</button>
          <button (click)="executarExcluirMenu()" class="flex-1 py-2.5 rounded-lg text-sm bg-red-600 text-white font-medium">Excluir</button>
        </div>
      </div>
    </div>

    <!-- ═══ MODAL: Confirmar remoção de menu da patente ═══ -->
    <div *ngIf="showConfirmRemoveMenu" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div class="absolute inset-0 bg-black/50" (click)="showConfirmRemoveMenu = false"></div>
      <div class="relative bg-white w-full sm:max-w-sm sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl p-5">
        <h3 class="text-base font-semibold text-[#1A4E79] mb-2">Remover menu</h3>
        <p class="text-sm text-gray-600 mb-4">Remover acesso ao menu <span class="font-semibold text-[#1A4E79]">{{ menuToRemove?.descricao || menuToRemove?.menu }}</span>?</p>
        <div class="flex gap-3">
          <button (click)="showConfirmRemoveMenu = false" class="flex-1 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-600">Cancelar</button>
          <button (click)="executarRemoverMenu()" class="flex-1 py-2.5 rounded-lg text-sm bg-red-600 text-white font-medium">Remover</button>
        </div>
      </div>
    </div>
  `
})
export class GestaoPatentesComponent implements OnInit {
  readonly tabActive  = 'px-4 py-1.5 rounded-lg text-sm font-semibold bg-white text-[#1A4E79] shadow transition-all';
  readonly tabInactive = 'px-4 py-1.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all';

  loading = false;
  mensagem = '';
  activeTab: Tab = 'patentes';

  // ─── Patents ─────────────────────────────────────────────────
  patentes: PatenteGestao[] = [];

  // Accordion/selection state (shared between mobile accordion and desktop panel)
  expandedId: string | null = null;
  menusPatente: MenuAcessoPatente[] = [];
  menusLoading = false;

  // All SZC menus (for combobox + Menus tab)
  menusAdmin: MenuSZC[] = [];
  menuSearch = '';
  menuFiltered: MenuSZC[] = [];
  showMenuDropdown = false;
  selectedMenuId = '';
  showAddMenu = false;
  addingMenu = false;
  msgMenu = '';
  msgMenuErro = false;

  // ─── Form: patent ────────────────────────────────────────────
  showFormPatente = false;
  isEditingPatente = false;
  formPatente = { id: '', nome: '', desc: '' };
  formErroPatente = '';
  saving = false;

  // ─── Form: SZC menu ──────────────────────────────────────────
  showFormMenu = false;
  isEditingMenu = false;
  formMenu = { id: '', menu: '', desc: '', rota: '' };
  formErroMenu = '';

  // ─── Delete modals ───────────────────────────────────────────
  showConfirmDeletePatente = false;
  patenteToDelete: PatenteGestao | null = null;
  showConfirmDeleteMenu = false;
  menuToDeleteSZC: MenuSZC | null = null;
  showConfirmRemoveMenu = false;
  menuToRemove: MenuAcessoPatente | null = null;

  constructor(private patentesService: PatentesService) {}

  ngOnInit(): void {
    this.carregarPatentes();
    this.carregarMenusAdmin();
  }

  carregarPatentes(): void {
    this.loading = true;
    this.patentesService.listarPatentesCrud().subscribe({
      next: dados => { this.patentes = Array.isArray(dados) ? dados : []; this.loading = false; },
      error: () => { this.mensagem = 'Erro ao carregar patentes.'; this.loading = false; }
    });
  }

  carregarMenusAdmin(): void {
    this.patentesService.listarTodosMenusAdmin().subscribe({
      next: dados => { this.menusAdmin = Array.isArray(dados) ? dados : []; },
      error: () => {}
    });
  }

  // ─── Accordion (mobile) ──────────────────────────────────────
  toggleAccordion(p: PatenteGestao): void {
    if (this.expandedId === p.codigo) { this.expandedId = null; this.menusPatente = []; this.resetCombobox(); return; }
    this.abrirPainelMenus(p);
  }

  // ─── Selection (desktop split) ───────────────────────────────
  selecionarDesktop(p: PatenteGestao): void {
    if (this.expandedId === p.codigo) return;
    this.abrirPainelMenus(p);
  }

  private abrirPainelMenus(p: PatenteGestao): void {
    this.expandedId = p.codigo;
    this.menusPatente = [];
    this.resetCombobox();
    this.menusLoading = true;
    this.patentesService.listarAcessosPatente(p.codigo).subscribe({
      next: dados => { this.menusPatente = Array.isArray(dados) ? dados : []; this.menusLoading = false; },
      error: () => { this.menusLoading = false; }
    });
  }

  // ─── Patent form ─────────────────────────────────────────────
  abrirFormNova(): void {
    this.formPatente = { id: '', nome: '', desc: '' };
    this.formErroPatente = '';
    this.isEditingPatente = false;
    this.showFormPatente = true;
  }

  abrirFormEditar(p: PatenteGestao): void {
    this.formPatente = { id: p.codigo, nome: p.patente, desc: p.descricao };
    this.formErroPatente = '';
    this.isEditingPatente = true;
    this.showFormPatente = true;
  }

  fecharFormPatente(): void { this.showFormPatente = false; this.formErroPatente = ''; }

  salvarPatente(): void {
    const nome = this.formPatente.nome.trim();
    const desc = this.formPatente.desc.trim();
    if (!nome) { this.formErroPatente = 'Nome é obrigatório.'; return; }
    this.saving = true;
    this.formErroPatente = '';
    const obs = this.isEditingPatente
      ? this.patentesService.atualizarPatente(this.formPatente.id, nome, desc)
      : this.patentesService.criarPatente(nome, desc);
    obs.subscribe({
      next: res => {
        this.saving = false;
        if (res?.success === false) { this.formErroPatente = res.message || 'Erro.'; return; }
        this.fecharFormPatente();
        this.carregarPatentes();
      },
      error: err => { this.saving = false; this.formErroPatente = err?.message || 'Erro ao salvar.'; }
    });
  }

  // ─── Delete patent ───────────────────────────────────────────
  confirmarExcluirPatente(p: PatenteGestao): void { this.patenteToDelete = p; this.showConfirmDeletePatente = true; }

  executarExcluirPatente(): void {
    if (!this.patenteToDelete) return;
    const p = this.patenteToDelete;
    this.showConfirmDeletePatente = false;
    this.patenteToDelete = null;
    this.loading = true;
    this.patentesService.excluirPatente(p.codigo).subscribe({
      next: () => { if (this.expandedId === p.codigo) { this.expandedId = null; this.menusPatente = []; } this.carregarPatentes(); },
      error: err => { this.mensagem = err?.message || 'Erro ao excluir.'; this.loading = false; }
    });
  }

  // ─── Menu combobox (add to patent) ───────────────────────────
  onMenuInput(event: Event): void {
    const q = (event.target as HTMLInputElement).value.toLowerCase();
    this.selectedMenuId = '';
    this.menuFiltered = q
      ? this.menusAdmin.filter(m => m.menu.toLowerCase().includes(q) || m.descricao.toLowerCase().includes(q))
      : this.menusAdmin;
    this.showMenuDropdown = true;
  }

  toggleMenuDropdown(event: MouseEvent): void {
    event.preventDefault();
    if (this.showMenuDropdown) { this.showMenuDropdown = false; return; }
    this.menuFiltered = this.menusAdmin;
    this.showMenuDropdown = true;
  }

  fecharMenuDropdown(): void { setTimeout(() => { this.showMenuDropdown = false; }, 150); }

  selecionarMenuDropdown(m: MenuSZC): void {
    this.menuSearch = m.menu + (m.descricao ? ' — ' + m.descricao : '');
    this.selectedMenuId = m.id;
    this.showMenuDropdown = false;
  }

  private resetCombobox(): void {
    this.menuSearch = ''; this.selectedMenuId = ''; this.showMenuDropdown = false;
    this.menuFiltered = []; this.showAddMenu = false; this.msgMenu = '';
  }

  adicionarMenu(): void {
    if (!this.expandedId || !this.selectedMenuId || this.addingMenu) return;
    this.addingMenu = true;
    this.msgMenu = '';
    this.patentesService.adicionarMenuPatente(this.expandedId, this.selectedMenuId).subscribe({
      next: res => {
        this.addingMenu = false;
        if (res?.success === false) { this.msgMenu = res.message || 'Erro.'; this.msgMenuErro = true; return; }
        this.msgMenu = 'Menu adicionado.'; this.msgMenuErro = false;
        this.resetCombobox();
        this.recarregarMenusPatente();
        setTimeout(() => { this.msgMenu = ''; }, 2500);
      },
      error: err => { this.addingMenu = false; this.msgMenu = err?.message || 'Erro.'; this.msgMenuErro = true; }
    });
  }

  confirmarRemoverMenu(m: MenuAcessoPatente): void { this.menuToRemove = m; this.showConfirmRemoveMenu = true; }

  executarRemoverMenu(): void {
    if (!this.expandedId || !this.menuToRemove) return;
    const m = this.menuToRemove;
    this.showConfirmRemoveMenu = false; this.menuToRemove = null;
    this.patentesService.removerMenuPatente(this.expandedId, m.menu).subscribe({
      next: () => { this.recarregarMenusPatente(); },
      error: err => { this.msgMenu = err?.message || 'Erro.'; this.msgMenuErro = true; }
    });
  }

  private recarregarMenusPatente(): void {
    if (!this.expandedId) return;
    this.menusLoading = true;
    this.patentesService.listarAcessosPatente(this.expandedId).subscribe({
      next: dados => { this.menusPatente = Array.isArray(dados) ? dados : []; this.menusLoading = false; },
      error: () => { this.menusLoading = false; }
    });
  }

  // ─── SZC Menu CRUD ───────────────────────────────────────────
  abrirFormNovoMenu(): void {
    this.formMenu = { id: '', menu: '', desc: '', rota: '' };
    this.formErroMenu = '';
    this.isEditingMenu = false;
    this.showFormMenu = true;
  }

  abrirFormEditarMenu(m: MenuSZC): void {
    this.formMenu = { id: m.id, menu: m.menu, desc: m.descricao, rota: m.rota };
    this.formErroMenu = '';
    this.isEditingMenu = true;
    this.showFormMenu = true;
  }

  fecharFormMenu(): void { this.showFormMenu = false; this.formErroMenu = ''; }

  salvarMenu(): void {
    const menu = this.formMenu.menu.trim();
    const rota = this.formMenu.rota.trim();
    const desc = this.formMenu.desc.trim();
    if (!menu || !rota) { this.formErroMenu = 'Label e Rota são obrigatórios.'; return; }
    this.saving = true;
    this.formErroMenu = '';
    const obs = this.isEditingMenu
      ? this.patentesService.atualizarMenuSZC(this.formMenu.id, menu, desc, rota)
      : this.patentesService.criarMenuSZC(menu, desc, rota);
    obs.subscribe({
      next: res => {
        this.saving = false;
        if (res?.success === false) { this.formErroMenu = res.message || 'Erro.'; return; }
        this.fecharFormMenu();
        this.carregarMenusAdmin();
      },
      error: err => { this.saving = false; this.formErroMenu = err?.message || 'Erro ao salvar.'; }
    });
  }

  confirmarExcluirMenu(m: MenuSZC): void { this.menuToDeleteSZC = m; this.showConfirmDeleteMenu = true; }

  executarExcluirMenu(): void {
    if (!this.menuToDeleteSZC) return;
    const m = this.menuToDeleteSZC;
    this.showConfirmDeleteMenu = false; this.menuToDeleteSZC = null;
    this.loading = true;
    this.patentesService.excluirMenuSZC(m.id).subscribe({
      next: () => { this.loading = false; this.carregarMenusAdmin(); },
      error: err => { this.mensagem = err?.message || 'Erro ao excluir.'; this.loading = false; }
    });
  }
}
