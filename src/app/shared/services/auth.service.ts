import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // Subject para notificar mudanças no usuário
  private userUpdateSubject = new BehaviorSubject<string>('Usuário');
  public userUpdate$ = this.userUpdateSubject.asObservable();

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  authenticate(username: string, password: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    
    const body = `grant_type=password&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    
    const oauthUrl = this.configService.getRestEndpoint('/api/oauth2/v1/token');
    return this.http.post(oauthUrl, body, { headers, observe: 'response' })
      .pipe(
        catchError(this.handleAuthError.bind(this, 'OAuth2 Authentication'))
      );
  }

  login(token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    const loginUrl = this.configService.getRestEndpoint('/login');
    return this.http.post(loginUrl, {}, { headers, observe: 'response' })
      .pipe(
        catchError(this.handleAuthError.bind(this, 'Login Validation'))
      );
  }

  private handleAuthError(operation: string, error: HttpErrorResponse): Observable<never> {
    // Log mínimo apenas para debug em desenvolvimento
    if (error.status !== 401 && error.status !== 403) {
      console.error(`[AUTH] ${operation} failed - HTTP ${error.status}`);
    }
    
    // Retorna o erro original para o componente tratar
    return throwError(() => error);
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_fullname');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_id');
    localStorage.removeItem('empresa');
    localStorage.removeItem('filial');
    
    this.userUpdateSubject.next('Usuário');
  }

  updateUserDisplay(): void {
    const fullName = localStorage.getItem('user_fullname');
    const displayName = fullName || 'Usuário';
    this.userUpdateSubject.next(displayName);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    
    // Verifica se o token não está vazio ou com valor inválido
    if (token.length < 10) {
      this.logout(); // Remove token inválido
      return false;
    }
    
    return true;
  }

  // Método para verificar se o usuário tem uma sessão válida
  hasValidSession(): boolean {
    const token = this.getToken();
    // Verifica apenas o token, pois user_name pode não estar sendo salvo
    
    if (!token || token.length < 10) {
      return false;
    }
    
    // Verificação adicional - token não pode ser apenas espaços ou string vazia
    if (token.trim().length === 0) {
      return false;
    }
    
    return true;
  }

  // Método para limpar sessão inválida
  clearInvalidSession(): void {
    if (!this.hasValidSession()) {
      this.logout();
    }
  }
}