import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ConfigService } from './config.service';

export interface MenuItem {
  id: string;
  nome: string;
  rota: string;
  icone?: string;
  ordem?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // ...existing code...
  // Menus do usuário
  private menusUsuario = new BehaviorSubject<any[]>([]);
  public menusUsuario$ = this.menusUsuario.asObservable();

  carregarMenusLiberadosUsuario(): Observable<any[]> {
    const token = this.getToken();
    const userId = localStorage.getItem('user_id');
    const url = this.configService.getRestEndpoint(`/patentes/menus?usuario=${userId}`);
    return this.http.get<any>(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      map(response => {
        let menusRaw = Array.isArray(response) ? response : response.menus;
        if (menusRaw && Array.isArray(menusRaw)) {
          const menus = menusRaw.map((m: any) => ({
            id: m.id,
            nome: m.menu || m.nome,
            rota: m.rota,
            icone: m.icone,
            ordem: m.ordem
          }));
          this.menusUsuario.next(menus);
          return menus;
        }
        return [];
      }),
      catchError(this.handleAuthError.bind(this, 'Menus Liberados'))
    );
  }

  limparMenus(): void {
    this.menusUsuario.next([]);
  }

  // Subject para notificar mudanças no usuário
  private userUpdateSubject = new BehaviorSubject<string>('Usuário');
  public userUpdate$ = this.userUpdateSubject.asObservable();

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  // Cache de acessos às patentes durante a sessão (persistido em sessionStorage)
  private getPatenteAccessCache(): { [id: string]: boolean } {
    try {
      const raw = sessionStorage.getItem('patenteAccessCache');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private setPatenteAccessCache(cache: { [id: string]: boolean }): void {
    try {
      sessionStorage.setItem('patenteAccessCache', JSON.stringify(cache));
    } catch {}
  }

  /**
   * Valida se o usuário tem acesso à patente/menu especificado pelo id.
   * Faz POST para /rest/patentes/validar com body { id }
   * O resultado é cacheado em sessionStorage até logout.
   */
  validarAcessoPatente(id: string) {
    const cache = this.getPatenteAccessCache();
    if (cache.hasOwnProperty(id)) {
      return new Observable<boolean>(subscriber => {
        subscriber.next(!!cache[id]);
        subscriber.complete();
      });
    }

    const token = this.getToken();
    const url = this.configService.getRestEndpoint('/patentes/validar');
    const body = { id };
    return this.http.post<any>(url, body, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).pipe(
      map(response => {
        // backend pode retornar { message: '', acess: true }
        const acess = response && (response.acess === true || response.access === true);
        cache[id] = !!acess;
        this.setPatenteAccessCache(cache);
        return !!acess;
      }),
      catchError(err => {
        // Em caso de erro propaga o erro
        return throwError(() => err);
      })
    );
  }

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
  localStorage.removeItem('menusUsuario');
  try { sessionStorage.removeItem('patenteAccessCache'); } catch {}
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
    
    if (token.length < 10) {
      this.logout(); 
      return false;
    }
    
    return true;
  }
  hasValidSession(): boolean {
    const token = this.getToken();
    
    if (!token || token.length < 10) {
      return false;
    }
    
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