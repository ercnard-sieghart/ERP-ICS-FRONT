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

export interface RespostaMenusServer {
  success?: boolean;
  all_menus?: boolean;
  menus?: Array<any>;
}

@Injectable({
  providedIn: 'root'
})
export class PatentesService {

  private menusUsuario = new BehaviorSubject<MenuItem[]>([]);
  public menusUsuario$ = this.menusUsuario.asObservable();

  private readonly STORAGE_KEY = 'app_menus_v1';

  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private authService: AuthService
  ) {}

  /**
   * Tenta restaurar menus do localStorage durante a inicialização do serviço.
   * Isso evita chamadas repetidas no reload da página enquanto o usuário estiver logado.
   */
  initializeFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MenuItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.menusUsuario.next(parsed);
        }
      }
    } catch (e) {
      console.warn('Não foi possível restaurar menus do localStorage:', e);
    }
  }

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
            try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(response.menus)); } catch(e) { /* ignore */ }
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

  getMenusServer(): Observable<MenuItem[]> {
    const url = this.configService.getRestEndpoint('/patentes/menus');

    return this.http.get<RespostaMenusServer>(url, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response && response.menus && Array.isArray(response.menus)) {
              const mapped: MenuItem[] = response.menus.map(item => this.mapServerMenuToMenuItem(item));
              this.menusUsuario.next(mapped);
              try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mapped)); } catch(e) { /* ignore */ }
              return mapped;
          }
          return [];
        }),
        catchError(error => {
          console.error('Erro ao obter menus do servidor (/patentes/menus):', error);
          return throwError(() => new Error('Erro ao obter menus do servidor'));
        })
      );
  }

  private mapServerMenuToMenuItem(item: any): MenuItem {
    const rota = (item.rota || item.path || '').toString();
    const serverMenu = (item.menu || item.nome || item.descricao || '').toString();

    const localName = this.getLocalNameForRoute(rota, serverMenu);

    return {
      id: (item.id || item.codigo || rota || Math.random().toString(36).substring(2, 9)).toString(),
      nome: localName,
      rota: rota,
      icone: item.icone || item.icon || undefined,
      ordem: typeof item.ordem === 'number' ? item.ordem : undefined
    } as MenuItem;
  }

  /**
   * Retorna o nome local (limpo) para a rota fornecida.
   * Usa a rota como fonte de verdade para garantir rótulos consistentes com o front-end.
   */
  private getLocalNameForRoute(rota: string, serverMenuName: string): string {
    if (!rota) return serverMenuName || '';

    // Mapeamento explícito por rota (cobrir os casos conhecidos)
    if (rota === '/home') return 'Home';
    if (rota === '/dashboard') return 'Dashboard';
    if (rota.startsWith('/compras/solicitacao')) return 'SC de Compras';
    if (rota === '/consultas') return 'Consultas';
    if (rota === '/consultas/extrato-bancario') return 'Extrato Bancário';
    if (rota === '/consultas/consulta-relatorio') return 'Relatórios';
    if (rota === '/orcamentos') return 'Orçamentos';
    if (rota === '/detalhe-item') return 'Detalhe Item';
    if (rota === '/admin/patentes') return 'Patentes';

    // Para rotas que não mapeamos explicitamente, usar o nome enviado pelo servidor
    // tentando fazer uma limpeza simples de caracteres mojibake comuns
    const cleaned = serverMenuName
      .replace(/�/g, 'ã')
      .replace(/Ã¡/g, 'á')
      .replace(/Ã©/g, 'é')
      .replace(/Ãª/g, 'ê')
      .replace(/Ã£/g, 'ã')
      .replace(/Ã§/g, 'ç')
      .replace(/\u00A0/g, ' ')
      .trim();

    return cleaned || serverMenuName || rota;
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