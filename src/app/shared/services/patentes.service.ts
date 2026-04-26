import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { AuthService } from './auth.service';
import type { Patente, Usuario } from '../models/patentes.models';

@Injectable({ providedIn: 'root' })
export class PatentesService {
  private _usersCache: Usuario[] | null = null;

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

  listarPatentes(): Observable<Patente[]> {
    const token = this.authService.getToken();
    const url = this.configService.getRestEndpoint('/patentes');
    return this.http.get<any>(url, { headers: { Authorization: `Bearer ${token}` } }).pipe(
      map(resp => {
        const raw = Array.isArray(resp) ? resp : (resp && resp.patentes) ? resp.patentes : [];
        if (!Array.isArray(raw)) return [];
        return raw.map((p: any) => ({
          id: (p.id || p.ID || p.codigo || '').toString(),
          nome: p.nome || p.menu || p.label || p.name || p.descricao || p.description || p.ID || p.id || '',
          ...p
        } as Patente));
      }),
      catchError(err => this.handleError('Listar Patentes', err))
    );
  }

  listarUsuariosPorPatente(patenteId: string): Observable<Usuario[]> {
    const token = this.authService.getToken();
    const url = this.configService.getRestEndpoint(`/patentes/${encodeURIComponent(patenteId)}/usuarios`);
    return this.http.get<any>(url, { headers: { Authorization: `Bearer ${token}` } }).pipe(
      map(resp => Array.isArray(resp) ? resp : (resp && resp.usuarios) ? resp.usuarios : []),
      catchError(err => this.handleError('Listar Usuários por Patente', err))
    );
  }

  listarUsuariosPorPatentePertence(patenteId: string): Observable<Usuario[]> {
    const token = this.authService.getToken();
    const url = this.configService.getRestEndpoint('/patentes/pertence');
    const body = { Id: patenteId };
    const headers: any = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Request-Name': 'patentes.pertence'
    };
    const userId = localStorage.getItem('user_id');
    if (userId) headers['X-User-Id'] = userId;

    const normalize = (resp: any): Usuario[] => {
      const arr = Array.isArray(resp) ? resp : (resp && resp.usuarios) ? resp.usuarios : (resp && resp.pertence) ? resp.pertence : [];
      if (!Array.isArray(arr)) return [];
      return arr.map((u: any) => {
        const id = (u['usuario_id'] || u['id'] || u['USER_ID'] || u['USERID'] || u['usuario'] || '').toString();
        const nome = u['usuario_nome'] || u['nome'] || u['name'] || u['USER_NAME'] || u['login'] || '';
        return { ...u, id, nome } as Usuario;
      });
    };

    return this.http.post<any>(url, body, { headers }).pipe(
      map(resp => normalize(resp)),
      catchError(err => this.handleError('Listar Usuários (patentes/pertence)', err as HttpErrorResponse))
    );
  }

  atribuirUsuarioPatente(patenteId: string, usuarioId: string): Observable<any> {
    const token = this.authService.getToken();
    const encodedPatente = encodeURIComponent(patenteId);
    const encodedUsuario = encodeURIComponent(usuarioId);
    const url = this.configService.getRestEndpoint(`/patentes/${encodedPatente}/${encodedUsuario}`);
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    return this.http.post<any>(url, null, { headers }).pipe(catchError(err => this.handleError('Atribuir Usuário à Patente', err)));
  }

  removerUsuarioPatente(patenteId: string, usuarioId: string): Observable<any> {
    const token = this.authService.getToken();
    // tentar primeiro a rota preferida (patente/usuario), em seguida alternar se necessário
    const urlPrimary = this.configService.getRestEndpoint(`/patentes/${encodeURIComponent(patenteId)}/${encodeURIComponent(usuarioId)}`);
    const urlAlt = this.configService.getRestEndpoint(`/patentes/${encodeURIComponent(usuarioId)}/${encodeURIComponent(patenteId)}`);
    const headers = { Authorization: `Bearer ${token}` };

    return this.http.delete<any>(urlPrimary, { headers }).pipe(
      catchError((err: any) => {
        if (err && err.status === 404) return of({ alreadyRemoved: true });
        return this.http.delete<any>(urlAlt, { headers }).pipe(
          catchError((e: any) => {
            if (e && e.status === 404) return of({ alreadyRemoved: true });
            return this.handleError('Remover Usuário da Patente', e);
          })
        );
      })
    );
  }

  searchUsuarios(query: string): Observable<Usuario[]> {
    if (!query || query.trim().length === 0) return of([]);
    const q = query.trim().toLowerCase();

    if (this._usersCache && Array.isArray(this._usersCache)) {
      const filtered = this._usersCache
        .filter(u => ((u as any)['USER_NAME'] ?? '').toString().toLowerCase().startsWith(q))
        .map(u => {
          const id = (u as any)['USER_ID'] ?? (u as any)['USERID'] ?? '';
          const nome = (u as any)['USER_NAME'] ?? '';
          return { ...u, id, nome } as Usuario;
        });
      return of(filtered);
    }

    const token = this.authService.getToken();
    const url = this.configService.getRestEndpoint('/sysusr/lista');
    return this.http.get<any>(url, { headers: { Authorization: `Bearer ${token}` } }).pipe(
      map(resp => {
        const arr = resp && Array.isArray(resp.USERS) ? resp.USERS : [];
        this._usersCache = Array.isArray(arr) ? arr : [];
        const filtered = this._usersCache
          .filter((u: any) => ((u['USER_NAME'] ?? '') as string).toString().toLowerCase().startsWith(q))
          .map((u: any) => {
            const id = u['USER_ID'];
            const nome = u['USER_NAME'];
            return { ...u, id, nome } as Usuario;
          });
        return filtered;
      }),
      catchError(() => of([]))
    );
  }
}
