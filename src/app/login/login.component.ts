
import { Component } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { PoDialogService } from '@po-ui/ng-components';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PoPageLoginModule, PoPageLogin } from '@po-ui/ng-templates';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, PoPageLoginModule]
})
export class LoginComponent {
  loading: boolean = false;
  username: string = '';
  password: string = '';

  constructor(private http: HttpClient, private poDialog: PoDialogService) {}

  loginSubmit(loginData: any) {
    this.loading = true;
    const payload = {
      username: loginData.login,
      password: loginData.password
    };
    this.http.post('http://localhost:8181/rest/login', payload, { observe: 'response' }).subscribe({
      next: (response) => {
        const body = response.body as { access_token?: string };
        const token = body && body.access_token;
        if (token) {
          localStorage.setItem('access_token', token);
        }
        setTimeout(() => {
          this.loading = false;
          this.poDialog.alert({
            title: 'Login realizado',
            message: 'Autenticação realizada com sucesso!',
          });
        }, 1200);
      },
      error: (error: HttpErrorResponse) => {
        setTimeout(() => {
          this.loading = false;
          this.poDialog.alert({
            title: 'Falha no login',
            message: 'Usuário ou senha inválidos.',
          });
        }, 1200);
      }
    });
  }
}