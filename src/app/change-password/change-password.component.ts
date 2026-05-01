import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../shared/services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {
  username = '';
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  erro = '';
  sucesso = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const state = history.state;
    if (state?.username) {
      this.username = state.username;
      this.oldPassword = state.oldPassword || '';
    } else {
      this.router.navigate(['/login']);
    }
  }

  submit(): void {
    this.erro = '';
    if (!this.newPassword) {
      this.erro = 'Informe a nova senha.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.erro = 'As senhas não conferem.';
      return;
    }

    this.loading = true;
    this.authService.changePassword(this.username, this.oldPassword, this.newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.sucesso = true;
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err: any) => {
        this.loading = false;
        this.erro = err?.error?.message || err?.message || 'Erro ao alterar senha. Verifique os dados e tente novamente.';
      }
    });
  }

  voltar(): void {
    this.router.navigate(['/login']);
  }
}
