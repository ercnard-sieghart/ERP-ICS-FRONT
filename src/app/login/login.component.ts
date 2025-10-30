
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

  constructor(
    private authService: AuthService, 
    private router: Router,
  ) {
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
  const loginLower = loginData.login ? loginData.login.toLowerCase() : '';
  this.authService.authenticate(loginLower, loginData.password).subscribe({
      next: (oauthResponse: any) => {
        const oauthBody = oauthResponse.body as any;
        
        if (oauthBody && oauthBody.access_token) {
          localStorage.setItem('authToken', oauthBody.access_token);
          if (oauthBody.refresh_token) {
            localStorage.setItem('refreshToken', oauthBody.refresh_token);
          }
          
          this.authService.login(oauthBody.access_token).subscribe({
            next: (loginResponse: any) => {
              const loginBody = loginResponse.body as any;
              
              if (loginBody && (loginBody.SUCCESS === true || loginBody.SUCCESS === 'true')) {
                localStorage.setItem('user_name', loginLower);
                if (loginBody.USER_FULLNAME) localStorage.setItem('user_fullname', loginBody.USER_FULLNAME);
                if (loginBody.USER_EMAIL) localStorage.setItem('user_email', loginBody.USER_EMAIL);
                if (loginBody.USER_ID) localStorage.setItem('user_id', loginBody.USER_ID);
                if (loginBody.EMPRESA) localStorage.setItem('empresa', loginBody.EMPRESA);
                if (loginBody.FILIAL) localStorage.setItem('filial', loginBody.FILIAL);
                
                this.authService.updateUserDisplay();
                
                // Carregar menus liberados do usuário via GET /patentes/menus?usuario=ID
                this.authService.carregarMenusLiberadosUsuario().subscribe({
                  next: (menus: any[]) => {
                    console.log('Menus carregados (liberados p/ usuário):', menus);
                    this.finishLoginSuccess(loginBody);
                  },
                  error: (error: any) => {
                    console.warn('Erro ao carregar menus liberados do usuário:', error);
                    this.finishLoginSuccess(loginBody);
                  }
                });
                
              } else {
                this.handleLoginError(loginBody?.MESSAGE || 'Erro na autenticação.');
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
        this.loading = false;
        this.popupType = 'error';
        if (error.status === 403) {
          this.popupMessage = 'Acesso negado.';
        } else {
          this.popupMessage = 'Usuário ou senha inválidos.';
        }
        this.showPopup = true;
        setTimeout(() => this.showPopup = false, 1500);
      }
    });
  }

  private handleLoginError(message: string) {
    this.loading = false;
    this.popupType = 'error';
    this.popupMessage = message;
    this.showPopup = true;
    setTimeout(() => this.showPopup = false, 1500);
  }

  private finishLoginSuccess(loginBody: any) {
    this.loading = false;
    this.popupType = 'success';
    this.popupMessage = loginBody.MESSAGE || 'Login realizado com sucesso!';
    this.showPopup = true;

    setTimeout(() => {
      this.showPopup = false;
      const redirectUrl = sessionStorage.getItem('redirectUrl');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectUrl');
        this.router.navigate([redirectUrl]);
      } else {
        this.router.navigate(['/home']);
      }
    }, 800);
  }
}