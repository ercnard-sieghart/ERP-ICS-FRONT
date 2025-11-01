import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PatentesService {
  // Cache local para a lista completa de usuários do sistema (evita múltiplas requests)
  private _usersCache: any[] | null = null;
  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private authService: AuthService
  ) {}

  private handleError(operation: string, error: HttpErrorResponse): Observable<never> {
    if (error.status !== 401 && error.status !== 403) {
      console.error(`[PATENTES] ${operation} failed - HTTP ${error.status}`);
    }
    return throwError(() => error);
  }

  listarPatentes(): Observable<any[]> {
    const token = this.authService.getToken();
    const url = this.configService.getRestEndpoint('/patentes');
    return this.http.get<any>(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).pipe(
      map(resp => {
        const raw = Array.isArray(resp) ? resp : (resp && resp.patentes) ? resp.patentes : [];
        if (!Array.isArray(raw)) return [];
        return raw.map((p: any) => ({
          id: p.id || p.ID || p.codigo || '',
          nome: p.nome || p.menu || p.label || p.name || p.descricao || p.description || p.ID || p.id || '',
          ...p
        }));
      }),
      catchError(err => this.handleError('Listar Patentes', err))
    );
  }

  listarUsuariosPorPatente(patenteId: string): Observable<any[]> {
    const token = this.authService.getToken();
    const url = this.configService.getRestEndpoint(`/patentes/${encodeURIComponent(patenteId)}/usuarios`);
    return this.http.get<any>(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).pipe(
      map(resp => Array.isArray(resp) ? resp : (resp && resp.usuarios) ? resp.usuarios : []),
      catchError(err => this.handleError('Listar Usuários por Patente', err))
    );
  }

  listarUsuariosPorPatentePertence(patenteId: string): Observable<any[]> {
    const token = this.authService.getToken();
    const url = this.configService.getRestEndpoint('/patentes/pertence');
  const body = { Id: patenteId };
    const headers: any = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Request-Name': 'patentes.pertence'
    };
    const userId = localStorage.getItem('user_id');
    if (userId) headers['X-User-Id'] = userId;

    const normalize = (resp: any) => {
      const arr = Array.isArray(resp) ? resp : (resp && resp.usuarios) ? resp.usuarios : (resp && resp.pertence) ? resp.pertence : [];
      if (!Array.isArray(arr)) return [];
      return arr.map((u: any) => ({
        id: u.usuario_id || u.id || u.USER_ID || u.USERID || u.usuario || '',
        nome: u.usuario_nome || u.nome || u.name || u.USER_NAME || u.login || '',
        ...u
      }));
    };

    try {
      const safeHeaders = { ...headers };
      if (safeHeaders['Authorization']) safeHeaders['Authorization'] = 'Bearer ****';
      // eslint-disable-next-line no-console
      console.debug('[patentes] /patentes/pertence request', { url, body: JSON.stringify(body), headers: safeHeaders });
    } catch {}

    return this.http.post<any>(url, body, { headers }).pipe(
      map(resp => normalize(resp)),
      catchError(err => this.handleError('Listar Usuários (patentes/pertence)', err as HttpErrorResponse))
    );
  }

  atribuirUsuarioPatente(patenteId: string, usuarioId: string): Observable<any> {
    const token = this.authService.getToken();
    const url = this.configService.getRestEndpoint(`/patentes/${encodeURIComponent(patenteId)}/usuarios`);
    const body = { usuarioId };
    return this.http.post<any>(url, body, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).pipe(catchError(err => this.handleError('Atribuir Usuário à Patente', err)));
  }

  removerUsuarioPatente(patenteId: string, usuarioId: string): Observable<any> {
    const token = this.authService.getToken();
    const url = this.configService.getRestEndpoint(`/patentes/${encodeURIComponent(patenteId)}/usuarios/${encodeURIComponent(usuarioId)}`);
    return this.http.delete<any>(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).pipe(catchError(err => this.handleError('Remover Usuário da Patente', err)));
  }

  /**
   * Busca de usuários por texto (autocomplete). Tentamos um endpoint de busca geral;
   * em caso de erro retornamos lista vazia para não quebrar o frontend enquanto o
   * backend não estiver disponível.
   */
  searchUsuarios(query: string): Observable<any[]> {
    // Se query vazia, não sugerir nada
    if (!query || query.trim().length === 0) return of([]);
    const q = query.trim().toLowerCase();

    // Se já temos cache, filtra client-side e retorna imediatamente
    if (this._usersCache && Array.isArray(this._usersCache)) {
      const filtered = this._usersCache
        .filter(u => {
          const name = (u.USER_NAME ?? '').toString().toLowerCase();
          return name.startsWith(q);
        })
        .map(u => ({ id: u.USER_ID ?? u.USERID ?? '', nome: u.USER_NAME ?? '', ...u }));
      return of(filtered);
    }

    // Caso não tenhamos cache, buscar /sysusr/lista uma vez e armazenar
    const token = this.authService.getToken();
    const url = this.configService.getRestEndpoint('/sysusr/lista');
    return this.http.get<any>(url, { headers: { 'Authorization': `Bearer ${token}` } }).pipe(
      map(resp => {
        const arr = resp && Array.isArray(resp.USERS) ? resp.USERS : [];
        this._usersCache = Array.isArray(arr) ? arr : [];
        const filtered = this._usersCache
          .filter((u: any) => {
            const name = (u.USER_NAME ?? '').toString().toLowerCase();
            return name.startsWith(q);
          })
          .map((u: any) => ({ id: u.USER_ID, nome: u.USER_NAME, ...u }));
        return filtered;
      }),
      catchError(() => of([]))
    );
  }
}
