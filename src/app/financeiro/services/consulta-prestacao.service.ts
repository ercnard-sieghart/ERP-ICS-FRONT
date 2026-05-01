import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../shared/services/auth.service';
import { ConfigService } from '../../shared/services/config.service';

export interface PrestacaoRow {
  codigo:     string;
  emissao:    string;
  status:     string;
  statusDesc: string;
  dtBaixa:    string;
  nomecf:     string;
  dtConf:     string;
  valorTotal: number;
}

export interface PrestacaoListResult {
  rows:     PrestacaoRow[];
  total:    number;
  page:     number;
  pageSize: number;
}

export interface DespesaDetalheRow {
  item:      number;
  data:      string;
  local:     string;
  despes:    string;
  descricao: string;
  quant:     number;
  total:     number;
  cc:        string;
  obs:       string;
  partic:    string;
  moeda:     string;
  conta:     string;
  itectb:    string;
  clvl:      string;
  grupo:     string;
  ec05db:    string;
  ec06db:    string;
  ec07db:    string;
  qtdAnexos: number;
}

@Injectable({ providedIn: 'root' })
export class ConsultaPrestacaoService {

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private configService: ConfigService
  ) {}

  private getHeaders(): HttpHeaders {
    const token  = this.authService.getToken();
    const userId = localStorage.getItem('user_id');
    const h: { [k: string]: string } = {
      'Content-Type': 'application/json',
      'Accept':       'application/json',
      'X-Request-Name': 'consulta.prestacao'
    };
    if (token)  h['Authorization'] = `Bearer ${token}`;
    if (userId) h['X-User-Id']     = userId;
    return new HttpHeaders(h);
  }

  listarPrestacoes(params: {
    status?:   string;
    busca?:    string;
    page?:     number;
    pageSize?: number;
  } = {}): Observable<PrestacaoListResult> {
    const parts: string[] = [];
    if (params.status)               parts.push(`status=${encodeURIComponent(params.status)}`);
    if (params.busca?.trim())        parts.push(`busca=${encodeURIComponent(params.busca!.trim())}`);
    if (params.page && params.page > 1) parts.push(`page=${params.page}`);
    if (params.pageSize)             parts.push(`pageSize=${params.pageSize}`);
    const qs = parts.length ? '?' + parts.join('&') : '';

    const url = this.configService.getRestEndpoint(`/CONSULTA/PRESTACOES${qs}`);
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => ({
        rows: (res?.rows || []).map((r: any): PrestacaoRow => ({
          codigo:     r.codigo     || '',
          emissao:    r.emissao    || '',
          status:     r.status     || '',
          statusDesc: r.statusDesc || '',
          dtBaixa:    r.dtBaixa    || '',
          nomecf:     r.nomecf     || '',
          dtConf:     r.dtConf     || '',
          valorTotal: Number(r.valorTotal) || 0
        })),
        total:    Number(res?.total)    || 0,
        page:     Number(res?.page)     || 1,
        pageSize: Number(res?.pageSize) || 20
      })),
      catchError(this.handleError)
    );
  }

  listarDespesas(codigo: string): Observable<DespesaDetalheRow[]> {
    const url = this.configService.getRestEndpoint(
      `/CONSULTA/PRESTACOES/${encodeURIComponent(codigo)}/DESPESAS`
    );
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => {
        const items: any[] = Array.isArray(res) ? res : (res?.rows || []);
        return items.map((r: any): DespesaDetalheRow => ({
          item:      Number(r.item)      || 0,
          data:      r.data              || '',
          local:     r.local             || '',
          despes:    r.despes            || '',
          descricao: r.descricao         || '',
          quant:     Number(r.quant)     || 0,
          total:     Number(r.total)     || 0,
          cc:        r.cc                || '',
          obs:       r.obs               || '',
          partic:    r.partic            || '',
          moeda:     r.moeda             || '',
          conta:     r.conta             || '',
          itectb:    r.itectb            || '',
          clvl:      r.clvl              || '',
          grupo:     r.grupo             || '',
          ec05db:    r.ec05db            || '',
          ec06db:    r.ec06db            || '',
          ec07db:    r.ec07db            || '',
          qtdAnexos: Number(r.qtdAnexos) || 0
        }));
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let msg = 'Erro desconhecido';
    if (error.status === 0)        msg = 'Erro de conexão com o servidor.';
    else if (error.status === 400) msg = error.error?.message || 'Requisição inválida.';
    else if (error.status === 500) msg = error.error?.message || 'Erro interno do servidor.';
    return throwError(() => new Error(msg));
  }
}
