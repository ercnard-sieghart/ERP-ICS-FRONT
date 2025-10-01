import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_BASE = '/rest';
  private readonly ENDPOINTS = {
    oauth: `${this.API_BASE}/api/oauth2/v1/token`,
    login: `${this.API_BASE}/login`
  };

  // Subject para notificar mudanças no usuário
  private userUpdateSubject = new BehaviorSubject<string>('Usuário');
  public userUpdate$ = this.userUpdateSubject.asObservable();

  constructor(private http: HttpClient) {}

  authenticate(username: string, password: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    
    const body = `grant_type=password&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    
    return this.http.post(this.ENDPOINTS.oauth, body, { headers, observe: 'response' })
      .pipe(
        catchError(this.handleAuthError.bind(this, 'OAuth2 Authentication'))
      );
  }

  login(token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.post(this.ENDPOINTS.login, {}, { headers, observe: 'response' })
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
    return !!token;
  }
}