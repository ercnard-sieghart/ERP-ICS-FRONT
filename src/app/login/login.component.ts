
import { Component } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
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
  showPopup: boolean = false;
  popupMessage: string = '';
  popupType: 'success' | 'error' = 'success';

  constructor(private http: HttpClient, private router: Router) {}

  loginSubmit(loginData: any) {
    this.loading = true;
    const payload = {
      username: loginData.login,
      password: loginData.password
    };
    this.http.post('/rest/login', payload, { observe: 'response' }).subscribe({
      next: (response) => {
        const body = response.body as { access_token?: string };
        const token = body && body.access_token;
        if (token) {
          localStorage.setItem('access_token', token);
        }
        setTimeout(() => {
          this.loading = false;
          this.popupType = 'success';
          this.popupMessage = 'Autenticação realizada com sucesso!';
          this.showPopup = true;
          setTimeout(() => {
            this.showPopup = false;
            this.router.navigate(['/home']);
          }, 2000);
        }, 1200);
      },
      error: (error: HttpErrorResponse) => {
        setTimeout(() => {
          this.loading = false;
          this.popupType = 'error';
          this.popupMessage = 'Usuário ou senha inválidos.';
          this.showPopup = true;
          setTimeout(() => this.showPopup = false, 3000);
        }, 1200);
      }
    });
  }
}