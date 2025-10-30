import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';

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

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.carregarPatentes();
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
    this.authService.listarPatentes().subscribe({
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
    this.loading = true;
    this.authService.listarUsuariosPorPatente(p.id).subscribe({
      next: (dados) => {
        this.usuarios = Array.isArray(dados) ? dados : [];
        this.loading = false;
      },
      error: () => {
        this.mensagem = 'Erro ao carregar usuários desta patente';
        this.loading = false;
      }
    });
  }

  removerUsuario(usuario: any): void {
    if (!this.selectedPatente || !this.selectedPatente.id) return;
    const confirmar = confirm(`Remover ${usuario.nome || usuario.id} desta patente?`);
    if (!confirmar) return;
    this.authService.removerUsuarioPatente(this.selectedPatente.id, usuario.id).subscribe({
      next: () => {
        this.usuarios = this.usuarios.filter(u => u.id !== usuario.id);
      },
      error: () => alert('Erro ao remover usuário')
    });
  }

  abrirAdicionarUsuario(): void {
    const id = prompt('Informe o id do usuário para atribuir:');
    if (!id) return;
    this.novoUsuarioId = id.trim();
    this.confirmarAdicionarUsuario();
  }

  confirmarAdicionarUsuario(): void {
    if (!this.selectedPatente || !this.selectedPatente.id || !this.novoUsuarioId) return;
    this.authService.atribuirUsuarioPatente(this.selectedPatente.id, this.novoUsuarioId).subscribe({
      next: (resp) => {
        // inserir localmente para resposta imediata
        this.usuarios.push({ id: this.novoUsuarioId, nome: this.novoUsuarioId });
        this.novoUsuarioId = '';
      },
      error: () => alert('Erro ao atribuir usuário')
    });
  }
}
