import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { AuthService } from './auth.service';

export interface MenuItem {
  id: string;
  nome: string;
  rota: string;
  icone?: string;
  ordem?: number;
}

export interface RespostaPatentes {
  success: boolean;
  message: string;
  total: number;
  menus: MenuItem[];
}

@Injectable({
  providedIn: 'root'
})
export class PatentesService {

  private menusUsuario = new BehaviorSubject<MenuItem[]>([]);
  public menusUsuario$ = this.menusUsuario.asObservable();

  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private authService: AuthService
  ) {}

  private getHttpOptions() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    };
  }

  carregarMenusUsuario(userId: string): Observable<MenuItem[]> {
    const url = this.configService.getRestEndpoint('/patentes/rotas');
    const body = { usuario: userId };

    return this.http.post<RespostaPatentes>(url, body, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.success && response.menus) {
            this.menusUsuario.next(response.menus);
            return response.menus;
          }
          return [];
        }),
        catchError(error => {
          console.error('Erro ao carregar menus do usuário:', error);
          return throwError(() => new Error('Erro ao carregar permissões do usuário'));
        })
      );
  }

  temPermissao(rota: string): boolean {
    const menus = this.menusUsuario.value;
    return menus.some(menu => menu.rota === rota);
  }

  getMenus(): MenuItem[] {
    return this.menusUsuario.value;
  }

  limparMenus(): void {
    this.menusUsuario.next([]);
  }
}