import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
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
  // Menus do usuário
  private menusUsuario = new BehaviorSubject<any[]>([]);
  public menusUsuario$ = this.menusUsuario.asObservable();

  carregarMenusLiberadosUsuario(): Observable<any[]> {
    // First, try to return cached menus immediately for faster UX
    try {
      const raw = localStorage.getItem('menusUsuario');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // refresh in background but return cached immediately
          this._refreshMenusFromServer();
          // ensure BehaviorSubject has the cached value
          this.menusUsuario.next(parsed as any[]);
          return of(parsed as any[]);
        }
      }
    } catch (e) {
      // parsing failed, fallback to network
    }

    const token = this.getToken();
    const userId = localStorage.getItem('user_id');

    const url = this.configService.getRestEndpoint('/patentes/menus');
    const headers: any = {
      'Authorization': `Bearer ${token}`,
      'X-Request-Name': 'patentes.menus.listByUser'
    };
    if (userId) {
      headers['X-User-Id'] = userId;
    }

    return this.http.get<any>(url, { headers }).pipe(
      map(response => {
        if (response && response.success === false) {
          try { localStorage.setItem('menusUsuario', JSON.stringify([])); } catch {}
          this.menusUsuario.next([]);
          return [];
        }

        let menusRaw = Array.isArray(response) ? response : response.menus;
        if (menusRaw && Array.isArray(menusRaw) && menusRaw.length > 0) {
          const menus = menusRaw.map((m: any) => ({
            id: m.id,
            nome: m.menu || m.nome,
            rota: m.rota,
            icone: m.icone,
            ordem: m.ordem
          }));
          this.menusUsuario.next(menus);
          try {
            localStorage.setItem('menusUsuario', JSON.stringify(menus));
          } catch (e) {}
          return menus;
        }

        // Caso não venha lista de menus, garantir que não exibimos menus antigos
        try { localStorage.setItem('menusUsuario', JSON.stringify([])); } catch {}
        this.menusUsuario.next([]);
        return [];
      }),
      catchError(this.handleAuthError.bind(this, 'Menus Liberados'))
    );
  }

  /**
   * Refresh menus from server and update cache/subject. Runs in background.
   */
  private _refreshMenusFromServer(): void {
    const token = this.getToken();
    const userId = localStorage.getItem('user_id');
    const url = this.configService.getRestEndpoint('/patentes/menus');
    const headers: any = {
      'Authorization': `Bearer ${token}`,
      'X-Request-Name': 'patentes.menus.listByUser'
    };
    if (userId) {
      headers['X-User-Id'] = userId;
    }

    this.http.get<any>(url, { headers }).pipe(
      map(response => {
        let menusRaw = Array.isArray(response) ? response : response.menus;
        if (menusRaw && Array.isArray(menusRaw) && menusRaw.length > 0) {
          const menus = menusRaw.map((m: any) => ({
            id: m.id,
            nome: m.menu || m.nome,
            rota: m.rota,
            icone: m.icone,
            ordem: m.ordem
          }));
          this.menusUsuario.next(menus);
          try { localStorage.setItem('menusUsuario', JSON.stringify(menus)); } catch {}
        }
      }),
      catchError(err => {
        // swallow errors on background refresh
        console.warn('[AUTH] background menu refresh failed', err);
        return of([]);
      })
    ).subscribe();
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
  
  constructorInit(): void {
    try {
      const raw = localStorage.getItem('menusUsuario');
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) {
        this.menusUsuario.next(parsed as any[]);
      }
    } catch {}
  }

  private _initOnce = (() => {
    let done = false;
    return () => {
      if (!done) {
        done = true;
        this.constructorInit();
      }
    };
  })();

  // Chama inicialização imediatamente
  private _ = this._initOnce();


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
  try { localStorage.removeItem('patenteAccessCache'); } catch {}
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

  validarAcessoPatente(menuId: string | null | undefined): Observable<boolean> {
    // menuId pode ser vazio; mesmo assim devemos forçar a requisição ao backend
    const cacheKey = 'patenteAccessCache';
    const key = (menuId === null || menuId === undefined || menuId === '') ? '__EMPTY__' : menuId.toString();
    try {
      const raw = localStorage.getItem(cacheKey);
      const cache = raw ? JSON.parse(raw) : {};
      if (cache && cache.hasOwnProperty(key)) {
        return of(!!cache[key]);
      }
    } catch {
      // ignore parse errors
    }

    const token = this.getToken();
    const url = this.configService.getRestEndpoint('/patentes/validar');
    // Envia body mesmo quando id for vazio/null para forçar a validação no servidor
    return this.http.post<any>(url, { id: menuId }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Request-Name': 'patentes.validar'
      }
    }).pipe(
      map(response => {
        const acess = response && (response.acess === true || response.access === true || response.acess === 'true');
        try {
          const raw = localStorage.getItem(cacheKey);
          const cache = raw ? JSON.parse(raw) : {};
          cache[key] = !!acess;
          localStorage.setItem(cacheKey, JSON.stringify(cache));
        } catch {}
        return !!acess;
      }),
      catchError(() => of(false))
    );
  }
}