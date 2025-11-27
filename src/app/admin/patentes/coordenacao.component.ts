import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatentesService } from '../../shared/services/patentes.service';
import type { Patente, Usuario } from '../../shared/models/patentes.models';
import { PoNotificationService, PoToasterOrientation } from '@po-ui/ng-components';
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
  patentes: Patente[] = [];
  selectedPatente: Patente | null = null;
  usuarios: Usuario[] = [];
  novoUsuarioId = '';
  mensagem = '';
  usersLoading: boolean = false;
  showAddUserForm = false;
  userSearchQuery = '';
  userSearchSuggestions: Usuario[] = [];
  showRemoveModal: boolean = false;
  userToRemove: Usuario | null = null;
  private userSearch$ = new Subject<string>();
  private userSearchSub?: Subscription;

  constructor(private patentesService: PatentesService,
              private poNotification: PoNotificationService) {}

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

  @HostListener('window:resize')
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

  selecionarPatente(p: Patente): void {
    this.selectedPatente = p;
    this.usuarios = [];
    if (!p || !p.id) return;
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

  removerUsuario(usuario: Usuario): void {
    this.openRemoveModal(usuario);
  }

  openRemoveModal(usuario: Usuario | null): void {
    this.userToRemove = usuario;
    this.showRemoveModal = true;
  }

  cancelRemove(): void {
    this.userToRemove = null;
    this.showRemoveModal = false;
  }

  confirmRemoveUser(): void {
    if (!this.selectedPatente || !this.selectedPatente.id || !this.userToRemove) return;
    const usuario = this.userToRemove;
    this.patentesService.removerUsuarioPatente(this.selectedPatente.id, usuario.id).subscribe({
      next: (resp: any) => {
        // Se o serviço indicar que já estava removido, avisar o usuário
        if (resp && resp.alreadyRemoved) {
          this.poNotification.warning({ message: 'Usuário já removido da patente', orientation: PoToasterOrientation.Bottom });
          this.cancelRemove();
          // atualizar lista via /patentes/pertence
          this.refreshUsuariosForSelectedPatente();
          return;
        }
  // Remoção bem-sucedida: atualizar lista local e mostrar popup de sucesso
  this.usuarios = this.usuarios.filter((u: Usuario) => u.id !== usuario.id);
        this.poNotification.success({ message: 'Usuário removido da patente', duration: 4000, orientation: PoToasterOrientation.Bottom });
        this.cancelRemove();
        // atualizar a lista a partir do backend para garantir consistência
        this.refreshUsuariosForSelectedPatente();
      },
      error: (err: any) => {
        // Se o servidor respondeu 404, interpretar como 'já removido' e mostrar popup
        if (err && err.status === 404) {
          this.poNotification.warning({ message: 'Usuário já removido da patente', orientation: PoToasterOrientation.Bottom });
          this.cancelRemove();
          // atualizar lista via /patentes/pertence
          this.refreshUsuariosForSelectedPatente();
          return;
        }
        this.poNotification.error({ message: 'Erro ao remover usuário', orientation: PoToasterOrientation.Bottom, showClose: true });
        this.cancelRemove();
      }
    });
  }

  /**
   * Recarrega a lista de usuários da patente selecionada usando o endpoint /patentes/pertence
   */
  private refreshUsuariosForSelectedPatente(): void {
    if (!this.selectedPatente || !this.selectedPatente.id) return;
    this.usersLoading = true;
    this.patentesService.listarUsuariosPorPatentePertence(this.selectedPatente.id).subscribe({
      next: (dados) => {
        this.usuarios = Array.isArray(dados) ? dados : [];
        this.usersLoading = false;
      },
      error: () => {
        // manter a lista atual em caso de falha, apenas limpar o loading
        this.usersLoading = false;
      }
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
    
    this.novoUsuarioId = '';
    this.userSearch$.next(q);
  }

  selectUserSuggestion(user: Partial<Usuario> | any): void {
    this.userSearchQuery = (user.nome || user.name || user.login || user.id || '').toString();
    this.novoUsuarioId = (user.id || user.USER_ID || user.usuario_id || user.USERID || '').toString();
    this.userSearchSuggestions = [];
  }

  confirmarAdicionarUsuario(): void {
    const userIdentifier = (this.novoUsuarioId && this.novoUsuarioId.toString().trim()) || '';
    if (!this.selectedPatente?.id) return;
    if (!userIdentifier) {
      this.mensagem = 'Por favor selecione um usuário válido nas sugestões antes de confirmar.';
      setTimeout(() => this.mensagem = '', 4000);
      return;
    }

    this.patentesService.atribuirUsuarioPatente(this.selectedPatente.id, userIdentifier).subscribe({
      next: (resp: any) => {
        const added = resp?.usuario ?? resp?.user ?? resp?.data ?? resp ?? null;
        const id = added?.id ?? added?.USER_ID ?? added?.usuario_id ?? userIdentifier;
        const nome = added?.nome ?? added?.USER_NAME ?? added?.usuario_nome ?? added?.name ?? this.userSearchQuery ?? userIdentifier;
        this.usuarios.push({ id, nome, ...added } as Usuario);
        this.resetAddUserForm('Usuário atribuído com sucesso.', 4000);
      },
      error: () => this.resetAddUserForm('Erro ao atribuir usuário. Verifique os dados e tente novamente.', 6000)
    });
  }

  private resetAddUserForm(message: string, timeoutMs: number): void {
    this.novoUsuarioId = '';
    this.userSearchQuery = '';
    this.showAddUserForm = false;
    this.mensagem = message;
    setTimeout(() => this.mensagem = '', timeoutMs);
  }

  voltarLista(): void {
    this.selectedPatente = null;
    this.userSearchSuggestions = [];
    this.showAddUserForm = false;
  }
}
