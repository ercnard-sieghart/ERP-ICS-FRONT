
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
  inactivityTimeout: any;
  loading: boolean = false;
  username: string = '';
  password: string = '';
  showPopup: boolean = false;
  popupMessage: string = '';
  popupType: 'success' | 'error' = 'success';

  constructor(private http: HttpClient, private router: Router) {
    this.setupInactivityTimer();
  }

  setupInactivityTimer() {
    const resetTimer = () => {
      if (this.inactivityTimeout) {
        clearTimeout(this.inactivityTimeout);
      }
      this.inactivityTimeout = setTimeout(() => {
        this.logoutByInactivity();
      }, 15 * 60 * 1000);
    };
    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(event => {
      window.addEventListener(event, resetTimer);
    });
    resetTimer();
  }

  logoutByInactivity() {
  localStorage.removeItem('authToken');
    this.popupType = 'error';
    this.popupMessage = 'Sessão expirada por inatividade.';
    this.showPopup = true;
    setTimeout(() => {
      this.showPopup = false;
      this.router.navigate(['/login']);
    }, 2500);
  }

  loginSubmit(loginData: any) {
    this.loading = true;
    const payload = {
      username: loginData.login,
      password: loginData.password
    };
    this.http.post('/rest/login', payload, { observe: 'response' }).subscribe({
      next: (response) => {
        const body = response.body as any;
  if (body && (body.success === true || body.success === 'true')) {
          if (body.access_token) {
            localStorage.setItem('authToken', body.access_token);
          }
          if (body.name) {
            localStorage.setItem('user_name', body.name);
          }
          setTimeout(() => {
            this.loading = false;
            this.popupType = 'success';
            this.popupMessage = body.message || 'Autenticação realizada com sucesso!';
            this.showPopup = true;
            setTimeout(() => {
              this.showPopup = false;
              this.router.navigate(['/home']);
            }, 2000);
          }, 1200);
        } else {
          setTimeout(() => {
            this.loading = false;
            this.popupType = 'error';
            this.popupMessage = body && body.message ? body.message : 'Usuário ou senha inválidos.';
            this.showPopup = true;
            setTimeout(() => this.showPopup = false, 3000);
          }, 1200);
        }
      },
      error: (error: HttpErrorResponse) => {
        setTimeout(() => {
          this.loading = false;
          this.popupType = 'error';
          if (error.status === 403) {
            this.popupMessage = 'Acesso negado.';
          } else {
            this.popupMessage = 'Usuário ou senha inválidos.';
          }
          this.showPopup = true;
          setTimeout(() => this.showPopup = false, 3000);
        }, 1200);
      }
    });
  }
}