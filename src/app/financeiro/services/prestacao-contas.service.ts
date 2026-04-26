import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../shared/services/auth.service';
import { ConfigService } from '../../shared/services/config.service';

export interface ParticipanteResult {
  codigo: string;
  nome: string;
}

export interface ClienteResult {
  codigo: string;
  loja: string;
  nome: string;
}

export interface ItemContabilResult {
  codigo: string;
  descricao: string;
}

export interface CentroCustoResult {
  codigo: string;
  descricao: string;
}

export interface ClasseValorResult {
  codigo: string;
  descricao: string;
}

export interface MotivoResult {
  codigo: string;
  descricao: string;
}

export interface PrestacaoContasPayload {
  FLF_TIPO: string;
  FLF_PRESTA: string;
  FLF_PARTIC: string;
  FLF_EMISSA: string;
  FLF_DTINI: string;
  FLF_DTFIM: string;
  FLF_CC: string;
  FLF_ITCTB: string;
  FLF_CLVL: string;
  FLF_MOTIVO: string;
  FLF_FATCLI: number;
  FLF_FATEMP: number;
  FLF_CLIFOR: string;
  FLF_FLOJA: string;
}

@Injectable({
  providedIn: 'root'
})
export class PrestacaoContasService {

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private configService: ConfigService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    const userId = localStorage.getItem('user_id');
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Request-Name': 'prestacao.contas'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (userId) headers['X-User-Id'] = userId;
    return new HttpHeaders(headers);
  }

  // ── Geração de código ────────────────────────────────────────────────────

  gerarCodigoPrestacao(): Observable<string> {
    const url = this.configService.getRestEndpoint('/PRESTACAOCONTA/codigo');
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => res?.codigo || res?.FLF_PRESTA || ''),
      catchError(this.handleError)
    );
  }

  // ── Lookups de participante e cliente ────────────────────────────────────

  buscarParticipante(codigo: string): Observable<ParticipanteResult> {
    const url = this.configService.getRestEndpoint(`/PARTICIPANTES/${encodeURIComponent(codigo)}`);
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => ({
        codigo: res?.codigo || res?.RD0_COD || codigo,
        nome: res?.nome || res?.RD0_NOME || ''
      })),
      catchError(this.handleError)
    );
  }

  buscarCliente(codigo: string): Observable<ClienteResult> {
    const url = this.configService.getRestEndpoint(`/CLIENTES/${encodeURIComponent(codigo)}`);
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => ({
        codigo: res?.codigo || res?.A1_COD || codigo,
        loja: res?.loja || res?.A1_LOJA || '',
        nome: res?.nome || res?.A1_NOME || ''
      })),
      catchError(this.handleError)
    );
  }

  // ── Busca por termo (autocomplete) ──────────────────────────────────────

  buscarParticipantePorTermo(termo: string): Observable<ParticipanteResult[]> {
    if (!termo?.trim()) return of([]);
    const url = this.configService.getRestEndpoint(`/PARTICIPANTES/buscar/${encodeURIComponent(termo.trim())}`);
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => {
        const items: any[] = Array.isArray(res) ? res : (res?.items || res?.rows || []);
        return items.map((i: any) => ({ codigo: i.codigo || '', nome: i.nome || '' }));
      }),
      catchError(() => of([]))
    );
  }

  buscarClientePorTermo(termo: string): Observable<ClienteResult[]> {
    if (!termo?.trim()) return of([]);
    const url = this.configService.getRestEndpoint(`/CLIENTES/buscar/${encodeURIComponent(termo.trim())}`);
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => {
        const items: any[] = Array.isArray(res) ? res : (res?.items || res?.rows || []);
        return items.map((i: any) => ({ codigo: i.codigo || '', loja: i.loja || '', nome: i.nome || '' }));
      }),
      catchError(() => of([]))
    );
  }

  // ── Listas para os selects ───────────────────────────────────────────────

  listarItensContabeis(): Observable<ItemContabilResult[]> {
    const url = this.configService.getRestEndpoint('/ITENSCONTABEIS');
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => {
        const items = Array.isArray(res) ? res : (res?.items || []);
        return items.map((i: any) => ({
          codigo: i.codigo || i.CTD_ITEM || '',
          descricao: i.descricao || i.CTD_DESC01 || ''
        }));
      }),
      catchError(this.handleError)
    );
  }

  listarCentrosCusto(): Observable<CentroCustoResult[]> {
    const url = this.configService.getRestEndpoint('/CENTROSCUSTO');
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => {
        const items = Array.isArray(res) ? res : (res?.items || []);
        return items.map((i: any) => ({
          codigo: i.codigo || i.CTT_CUSTO || '',
          descricao: i.descricao || i.CTT_DESC01 || ''
        }));
      }),
      catchError(this.handleError)
    );
  }

  listarClassesValor(): Observable<ClasseValorResult[]> {
    const url = this.configService.getRestEndpoint('/CLASSESVALOR');
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => {
        const items = Array.isArray(res) ? res : (res?.items || []);
        return items.map((i: any) => ({
          codigo: i.codigo || i.CQH_CHAVE || '',
          descricao: i.descricao || i.CQH_DESC || ''
        }));
      }),
      catchError(this.handleError)
    );
  }

  listarMotivos(): Observable<MotivoResult[]> {
    const url = this.configService.getRestEndpoint('/MOTIVOS');
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => {
        const items = Array.isArray(res) ? res : (res?.items || []);
        return items.map((i: any) => ({
          codigo: i.codigo || i.X5_CHAVE || '',
          descricao: i.descricao || i.X5_DESCRI || ''
        }));
      }),
      catchError(this.handleError)
    );
  }

  // ── Salvar ───────────────────────────────────────────────────────────────

  salvarPrestacao(payload: PrestacaoContasPayload): Observable<any> {
    const url = this.configService.getRestEndpoint('/PRESTACAOCONTA');
    return this.http.post<any>(url, payload, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  // ── Erro ─────────────────────────────────────────────────────────────────

  private handleError(error: HttpErrorResponse): Observable<never> {
    let msg = 'Erro desconhecido';
    if (error.status === 0) {
      msg = 'Erro de conexão. Verifique se o servidor está acessível.';
    } else if (error.status === 401) {
      msg = 'Acesso não autorizado. Faça login novamente.';
    } else if (error.status === 404) {
      msg = 'Endpoint não encontrado.';
    } else if (error.status === 500) {
      msg = 'Erro interno do servidor.';
    }
    return throwError(() => new Error(msg));
  }
}
