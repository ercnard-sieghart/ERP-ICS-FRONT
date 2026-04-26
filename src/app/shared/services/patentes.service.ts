import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { AuthService } from './auth.service';
import type { Patente, Usuario } from '../models/patentes.models';

export interface PatenteGestao {
  codigo: string;
  patente: string;
  descricao: string;
}

export interface MenuAcessoPatente {
  patente: string;
  menu: string;
  descricao: string;
  acesso: boolean;
}

export interface MenuSZC {
  menu: string;
  id: string;
  descricao: string;
  rota: string;
}

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

  private getHeaders(): HttpHeaders {
    const token  = this.authService.getToken();
    const userId = localStorage.getItem('user_id');
    const h: { [k: string]: string } = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Request-Name': 'patentes.gestao'
    };
    if (token)  h['Authorization'] = `Bearer ${token}`;
    if (userId) h['X-User-Id'] = userId;
    return new HttpHeaders(h);
  }

  listarPatentesCrud(): Observable<PatenteGestao[]> {
    const url = this.configService.getRestEndpoint('/patentes');
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => {
        const raw: any[] = Array.isArray(res) ? res : (res?.patentes || []);
        return raw.map((p: any) => ({
          codigo:    (p.codigo || p.ID || p.id || '').toString(),
          patente:   p.patente || p.nome || '',
          descricao: p.descricao || ''
        }));
      }),
      catchError(() => throwError(() => new Error('Erro ao listar patentes')))
    );
  }

  criarPatente(nome: string, desc: string): Observable<any> {
    const url = this.configService.getRestEndpoint('/patentes/nova');
    return this.http.post<any>(url, { NOME: nome, DESC: desc }, { headers: this.getHeaders() }).pipe(
      catchError(this.handleGestaoError)
    );
  }

  atualizarPatente(id: string, nome: string, desc: string): Observable<any> {
    const url = this.configService.getRestEndpoint('/patentes/salvar');
    return this.http.post<any>(url, { ID: id, NOME: nome, DESC: desc }, { headers: this.getHeaders() }).pipe(
      catchError(this.handleGestaoError)
    );
  }

  excluirPatente(id: string): Observable<any> {
    const url = this.configService.getRestEndpoint(`/patentes/excluir/${encodeURIComponent(id)}`);
    return this.http.delete<any>(url, { headers: this.getHeaders() }).pipe(
      catchError(this.handleGestaoError)
    );
  }

  listarAcessosPatente(patenteId: string): Observable<MenuAcessoPatente[]> {
    const url = this.configService.getRestEndpoint('/patentes/acessos');
    return this.http.post<any>(url, { PATENTE: patenteId }, { headers: this.getHeaders() }).pipe(
      map(res => {
        const raw: any[] = Array.isArray(res) ? res : (res?.acessos || []);
        return raw.map((a: any) => ({
          patente:   a.patente   || '',
          menu:      a.menu      || '',
          descricao: a.descricao || '',
          acesso:    a.acesso === true || a.acesso === 'true'
        }));
      }),
      catchError(() => throwError(() => new Error('Erro ao listar acessos')))
    );
  }

  listarTodosMenusAdmin(): Observable<MenuSZC[]> {
    const url = this.configService.getRestEndpoint('/patentes/allmenus');
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => {
        const raw: any[] = Array.isArray(res) ? res : (res?.menus || []);
        return raw.map((m: any) => ({
          menu:      m.menu      || '',
          id:        m.id        || '',
          descricao: m.descricao || '',
          rota:      m.rota      || ''
        }));
      }),
      catchError(() => throwError(() => new Error('Erro ao listar menus')))
    );
  }

  adicionarMenuPatente(patenteId: string, menuId: string): Observable<any> {
    const url = this.configService.getRestEndpoint('/patentes/menu/incluir');
    return this.http.post<any>(url, { PATENTE: patenteId, MENU: menuId }, { headers: this.getHeaders() }).pipe(
      catchError(this.handleGestaoError)
    );
  }

  removerMenuPatente(patenteId: string, menuId: string): Observable<any> {
    const url = this.configService.getRestEndpoint('/patentes/menu/remover');
    return this.http.post<any>(url, { PATENTE: patenteId, MENU: menuId }, { headers: this.getHeaders() }).pipe(
      catchError(this.handleGestaoError)
    );
  }

  criarMenuSZC(menu: string, descricao: string, rota: string): Observable<any> {
    const url = this.configService.getRestEndpoint('/patentes/menus/novo');
    return this.http.post<any>(url, { MENU: menu, DESC: descricao, ROTA: rota }, { headers: this.getHeaders() }).pipe(
      catchError(this.handleGestaoError)
    );
  }

  atualizarMenuSZC(id: string, menu: string, descricao: string, rota: string): Observable<any> {
    const url = this.configService.getRestEndpoint('/patentes/menus/editar');
    return this.http.post<any>(url, { ID: id, MENU: menu, DESC: descricao, ROTA: rota }, { headers: this.getHeaders() }).pipe(
      catchError(this.handleGestaoError)
    );
  }

  excluirMenuSZC(id: string): Observable<any> {
    const url = this.configService.getRestEndpoint('/patentes/menus/excluir');
    return this.http.post<any>(url, { ID: id }, { headers: this.getHeaders() }).pipe(
      catchError(this.handleGestaoError)
    );
  }

  private handleGestaoError(error: HttpErrorResponse): Observable<never> {
    const msg = error.error?.message || (error.status === 0 ? 'Erro de conexão.' : 'Erro interno do servidor.');
    return throwError(() => new Error(msg));
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
