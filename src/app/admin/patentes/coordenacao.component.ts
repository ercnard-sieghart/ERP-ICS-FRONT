import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatentesService } from '../../shared/services/patentes.service';
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
  patentes: any[] = [];
  selectedPatente: any | null = null;
  usuarios: any[] = [];
  novoUsuarioId = '';
  mensagem = '';
  usersLoading: boolean = false;
  showAddUserForm = false;
  userSearchQuery = '';
  userSearchSuggestions: any[] = [];
  showRemoveModal: boolean = false;
  userToRemove: any = null;
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
    this.openRemoveModal(usuario);
  }

  openRemoveModal(usuario: any): void {
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
  this.usuarios = this.usuarios.filter((u: any) => u.id !== usuario.id);
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

  selectUserSuggestion(user: any): void {
    this.userSearchQuery = user.nome || user.name || user.login || user.id || '';
    this.novoUsuarioId = user.id || user.USER_ID || user.usuario_id || user.USERID || '';
    this.userSearchSuggestions = [];
  }

  confirmarAdicionarUsuario(): void {
    const payload = (this.novoUsuarioId && this.novoUsuarioId.toString().trim()) || (this.userSearchQuery || '').toString().trim();
    if (!this.selectedPatente || !this.selectedPatente.id || !payload) return;
    
    this.patentesService.atribuirUsuarioPatente(this.selectedPatente.id, payload).subscribe({
      next: (resp) => {
        
        const added = resp && (resp.usuario || resp.user || resp.data) ? (resp.usuario || resp.user || resp.data) : null;
        if (added && (added.id || added.USER_ID || added.usuario_id)) {
          const id = added.id || added.USER_ID || added.usuario_id;
          const nome = added.nome || added.USER_NAME || added.usuario_nome || added.name || this.userSearchQuery;
          this.usuarios.push({ id, nome, ...added });
        } else {
          
          this.usuarios.push({ id: payload, nome: this.userSearchQuery || payload });
        }
        this.novoUsuarioId = '';
        this.userSearchQuery = '';
        this.showAddUserForm = false;
        // mensagem de sucesso visível por alguns segundos
        this.mensagem = 'Usuário atribuído com sucesso.';
        setTimeout(() => this.mensagem = '', 4000);
      },
      error: () => {
        this.mensagem = 'Erro ao atribuir usuário. Verifique os dados e tente novamente.';
        setTimeout(() => this.mensagem = '', 6000);
      }
    });
  }

  voltarLista(): void {
    this.selectedPatente = null;
    this.userSearchSuggestions = [];
    this.showAddUserForm = false;
  }
}
