import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../shared/services/auth.service';
import { ConfigService } from '../../shared/services/config.service';

export interface TipoDespResult   { codigo: string; descricao: string; }
export interface NaturezaResult   { codigo: string; descricao: string; }

export interface DespesaRow {
  item: number;
  data: string;
  tipoDesp: string;
  valor: number;
  moeda: string;
  natureza: string;
  cc: string;
  itemCtb: string;
  descricao: string;
  doc: string;
  qtdAnexos: number;
}

export interface DespesaPayload {
  FLE_PRESTA: string;
  FLE_DATA:   string;
  FLE_TPDESP: string;
  FLE_VALOR:  number;
  FLE_MOEDA:  string;
  FLE_NATUREZ: string;
  FLE_CC:     string;
  FLE_ITEMCTA: string;
  FLE_DESC:   string;
  FLE_DOC:    string;
}

export interface AnexoPayload {
  presta:  string;
  item:    number;
  nome:    string;
  tipo:    string;
  arquivo: string; // base64
}

export interface AnexoRow {
  chave:    string;
  nome:     string;
  caminho:  string;
  tipo:     string;
  data:     string;
}

@Injectable({ providedIn: 'root' })
export class DespesaService {

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
      'Accept': 'application/json',
      'X-Request-Name': 'prestacao.despesa'
    };
    if (token)  h['Authorization'] = `Bearer ${token}`;
    if (userId) h['X-User-Id'] = userId;
    return new HttpHeaders(h);
  }

  listarTiposDesp(): Observable<TipoDespResult[]> {
    const url = this.configService.getRestEndpoint('/TIPOSDESP');
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => {
        const items: any[] = Array.isArray(res) ? res : (res?.items || res?.rows || []);
        return items.map((i: any) => ({ codigo: i.codigo || '', descricao: i.descricao || '' }));
      }),
      catchError(() => throwError(() => new Error('Erro ao listar tipos de despesa')))
    );
  }

  listarNaturezas(): Observable<NaturezaResult[]> {
    const url = this.configService.getRestEndpoint('/NATUREZAS');
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => {
        const items: any[] = Array.isArray(res) ? res : (res?.items || res?.rows || []);
        return items.map((i: any) => ({ codigo: i.codigo || '', descricao: i.descricao || '' }));
      }),
      catchError(() => throwError(() => new Error('Erro ao listar naturezas')))
    );
  }

  listarDespesas(presta: string): Observable<DespesaRow[]> {
    const url = this.configService.getRestEndpoint(`/DESPESAS/${encodeURIComponent(presta)}`);
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => {
        const items: any[] = Array.isArray(res) ? res : (res?.rows || []);
        return items.map((i: any) => ({
          item:      Number(i.item)      || 0,
          data:      i.data              || '',
          tipoDesp:  i.tipoDesp          || '',
          valor:     Number(i.valor)     || 0,
          moeda:     i.moeda             || '',
          natureza:  i.natureza          || '',
          cc:        i.cc                || '',
          itemCtb:   i.itemCtb           || '',
          descricao: i.descricao         || '',
          doc:       i.doc               || '',
          qtdAnexos: Number(i.qtdAnexos) || 0
        }));
      }),
      catchError(this.handleError)
    );
  }

  inserirDespesa(payload: DespesaPayload): Observable<any> {
    const url = this.configService.getRestEndpoint('/DESPESAS');
    return this.http.post<any>(url, payload, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  excluirDespesa(presta: string, item: number): Observable<any> {
    const url = this.configService.getRestEndpoint(`/DESPESAS/${encodeURIComponent(presta)}/${item}`);
    return this.http.delete<any>(url, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  uploadAnexo(payload: AnexoPayload): Observable<any> {
    const url = this.configService.getRestEndpoint('/ANEXOS');
    return this.http.post<any>(url, payload, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  listarAnexos(presta: string, item: number): Observable<AnexoRow[]> {
    const url = this.configService.getRestEndpoint(`/ANEXOS/${encodeURIComponent(presta)}/${item}`);
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => {
        const items: any[] = Array.isArray(res) ? res : (res?.rows || []);
        return items.map((i: any) => ({
          chave:   i.chave   || '',
          nome:    i.nome    || '',
          caminho: i.caminho || '',
          tipo:    i.tipo    || '',
          data:    i.data    || ''
        }));
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let msg = 'Erro desconhecido';
    if (error.status === 0)   msg = 'Erro de conexão.';
    else if (error.status === 400) msg = error.error?.message || 'Requisição inválida.';
    else if (error.status === 500) msg = 'Erro interno do servidor.';
    return throwError(() => new Error(msg));
  }
}
