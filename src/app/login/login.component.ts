
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
    
    // Primeira requisição OAuth2 para obter tokens
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    
    // Dados OAuth2 no formato form-encoded padrão
    const body = `grant_type=password&username=${encodeURIComponent(loginData.login)}&password=${encodeURIComponent(loginData.password)}`;
    
    this.http.post('http://institutoclima200507.protheus.cloudtotvs.com.br:4050/rest/api/oauth2/v1/token', body, { headers, observe: 'response' }).subscribe({
      next: (oauthResponse) => {
        const oauthBody = oauthResponse.body as any;
        console.log('OAuth2 response:', oauthBody);
        
        if (oauthBody && oauthBody.access_token) {
          // Armazenar tokens OAuth2
          localStorage.setItem('authToken', oauthBody.access_token);
          if (oauthBody.refresh_token) {
            localStorage.setItem('refreshToken', oauthBody.refresh_token);
          }
          

          const headers = {
            'Authorization': `Bearer ${oauthBody.access_token}`
          };
          
          this.http.post('/login', {}, { headers, observe: 'response' }).subscribe({
            next: (loginResponse) => {
              const loginBody = loginResponse.body as any;
              console.log('Login response:', loginBody);
              
              if (loginBody && (loginBody.success === true || loginBody.success === 'true')) {
                // Armazenar dados do usuário
                if (loginBody.name) {
                  localStorage.setItem('user_name', loginBody.name);
                }
                if (loginBody.email) {
                  localStorage.setItem('user_email', loginBody.email);
                }
                
                setTimeout(() => {
                  this.loading = false;
                  this.popupType = 'success';
                  this.popupMessage = loginBody.message || 'Autenticação realizada com sucesso!';
                  this.showPopup = true;
                  setTimeout(() => {
                    this.showPopup = false;
                    this.router.navigate(['/home']);
                  }, 2000);
                }, 1200);
              } else {
                this.handleLoginError(loginBody && loginBody.message ? loginBody.message : 'Erro na autenticação.');
              }
            },
            error: (error: HttpErrorResponse) => {
              // Log removido para evitar exposição no console
              this.handleLoginError('Erro na segunda etapa de autenticação.');
            }
          });
        } else {
          this.handleLoginError('Falha na obtenção dos tokens OAuth2.');
        }
      },
      error: (error: HttpErrorResponse) => {
        // Log removido para evitar exposição no console
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

  private handleLoginError(message: string) {
    setTimeout(() => {
      this.loading = false;
      this.popupType = 'error';
      this.popupMessage = message;
      this.showPopup = true;
      setTimeout(() => this.showPopup = false, 3000);
    }, 1200);
  }
}