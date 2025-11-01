import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatentesService } from '../../shared/services/patentes.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-patentes-coordenacao',
  templateUrl: './coordenacao.component.html',
  styleUrls: ['./coordenacao.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class CoordenacaoComponent implements OnInit {
  loading = false;
  isMobile: boolean = false;
  patentes: any[] = [];
  selectedPatente: any | null = null;
  usuarios: any[] = [];
  novoUsuarioId = '';
  mensagem = '';
  usersLoading: boolean = false; // loading apenas para lista de usuários
  showAddUserForm = false;
  userSearchQuery = '';
  userSearchSuggestions: any[] = [];
  private userSearch$ = new Subject<string>();
  private userSearchSub?: Subscription;

  constructor(private patentesService: PatentesService) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.carregarPatentes();
    this.userSearchSub = this.userSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => this.patentesService.searchUsuarios(q))
    ).subscribe(results => {
      this.userSearchSuggestions = Array.isArray(results) ? results : [];
    });
  }

  ngOnDestroy(): void {
    this.userSearchSub?.unsubscribe();
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < 680;
  }

  carregarPatentes(): void {
    this.loading = true;
  this.patentesService.listarPatentes().subscribe({
      next: (dados) => {
        this.patentes = Array.isArray(dados) ? dados : [];
        this.loading = false;
      },
      error: () => {
        this.mensagem = 'Erro ao carregar patentes';
        this.loading = false;
      }
    });
  }

  selecionarPatente(p: any): void {
    this.selectedPatente = p;
    this.usuarios = [];
    if (!p || !p.id) return;
    // Carrega usuários sem mostrar o overlay global de carregamento
    this.usersLoading = true;
  this.patentesService.listarUsuariosPorPatentePertence(p.id).subscribe({
      next: (dados) => {
        this.usuarios = Array.isArray(dados) ? dados : [];
        this.usersLoading = false;
      },
      error: () => {
        this.mensagem = 'Erro ao carregar usuários desta patente';
        this.usersLoading = false;
      }
    });
  }

  removerUsuario(usuario: any): void {
    if (!this.selectedPatente || !this.selectedPatente.id) return;
    const confirmar = confirm(`Remover ${usuario.nome || usuario.id} desta patente?`);
    if (!confirmar) return;
  this.patentesService.removerUsuarioPatente(this.selectedPatente.id, usuario.id).subscribe({
      next: () => {
        this.usuarios = this.usuarios.filter(u => u.id !== usuario.id);
      },
      error: () => alert('Erro ao remover usuário')
    });
  }

  abrirAdicionarUsuario(): void {
    this.showAddUserForm = true;
    this.userSearchQuery = '';
    this.novoUsuarioId = '';
  }

  cancelarAdicionarUsuario(): void {
    this.showAddUserForm = false;
    this.userSearchQuery = '';
    this.novoUsuarioId = '';
  }

  onUserQueryChange(q: string): void {
    this.userSearchQuery = q;
    this.userSearch$.next(q);
  }

  selectUserSuggestion(user: any): void {
    this.userSearchQuery = user.nome || user.name || user.login || user.id || '';
    this.novoUsuarioId = user.id || user.usuario_id || '';
    this.userSearchSuggestions = [];
  }

  confirmarAdicionarUsuario(): void {
    const candidateName = (this.userSearchQuery || this.novoUsuarioId || '').toString().trim();
    if (!this.selectedPatente || !this.selectedPatente.id || !candidateName) return;
    // enviar o nome do usuário para o backend; backend deve resolver para ID
    this.patentesService.atribuirUsuarioPatente(this.selectedPatente.id, candidateName).subscribe({
      next: (resp) => {
        // inserir localmente para resposta imediata
        this.usuarios.push({ id: candidateName, nome: candidateName });
        this.novoUsuarioId = '';
        this.userSearchQuery = '';
        this.showAddUserForm = false;
      },
      error: () => alert('Erro ao atribuir usuário')
    });
  }
}
