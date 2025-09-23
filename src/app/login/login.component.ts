
import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PoPageLoginModule, PoPageLogin } from '@po-ui/ng-templates';
import { AuthService } from '../shared/services/auth.service';

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

  constructor(private authService: AuthService, private router: Router) {
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
    this.authService.logout();
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
    this.authService.authenticate(loginData.login, loginData.password).subscribe({
      next: (oauthResponse: any) => {
        const oauthBody = oauthResponse.body as any;
        
        if (oauthBody && oauthBody.access_token) {
          // Armazenar tokens OAuth2
          localStorage.setItem('authToken', oauthBody.access_token);
          if (oauthBody.refresh_token) {
            localStorage.setItem('refreshToken', oauthBody.refresh_token);
          }
          
          // Segunda requisição para completar o login
          this.authService.login(oauthBody.access_token).subscribe({
            next: (loginResponse: any) => {
              const loginBody = loginResponse.body as any;
              console.log('[LOGIN] Response received:', {
                hasBody: !!loginBody,
                success: loginBody?.SUCCESS,
                message: loginBody?.MESSAGE
              });
              
              if (loginBody && (loginBody.SUCCESS === true || loginBody.SUCCESS === 'true')) {
                if (loginBody.USER_FULLNAME) {
                  localStorage.setItem('user_fullname', loginBody.USER_FULLNAME);
                }
                if (loginBody.USER_EMAIL) {
                  localStorage.setItem('user_email', loginBody.USER_EMAIL);
                }
                if (loginBody.USER_ID) {
                  localStorage.setItem('user_id', loginBody.USER_ID);
                }
                if (loginBody.EMPRESA) {
                  localStorage.setItem('empresa', loginBody.EMPRESA);
                }
                if (loginBody.FILIAL) {
                  localStorage.setItem('filial', loginBody.FILIAL);
                }
                
                console.log('[LOGIN] Authentication successful - redirecting to home');
                
                // Notificar o AuthService para atualizar o display do usuário
                this.authService.updateUserDisplay();
                
                setTimeout(() => {
                  this.loading = false;
                  this.popupType = 'success';
                  this.popupMessage = loginBody.MESSAGE || 'Autenticação realizada com sucesso!';
                  this.showPopup = true;
                  setTimeout(() => {
                    this.showPopup = false;
                    this.router.navigate(['/home']);
                  }, 2000);
                }, 1200);
              } else {
                console.error('[LOGIN] Authentication failed - invalid response structure');
                this.handleLoginError(loginBody && loginBody.MESSAGE ? loginBody.MESSAGE : 'Erro na autenticação.');
              }
            },
            error: (error: HttpErrorResponse) => {
              this.handleLoginError('Erro na segunda etapa de autenticação.');
            }
          });
        } else {
          this.handleLoginError('Falha na obtenção dos tokens OAuth2.');
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