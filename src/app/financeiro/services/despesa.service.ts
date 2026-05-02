import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../shared/services/auth.service';
import { ConfigService } from '../../shared/services/config.service';

export interface FLGResult {
  codigo: string;
  descricao: string;
  custo:  string;
  itectb: string;
  clvl:   string;
}

export interface ContaContabilResult { codigo: string; descricao: string; }
export interface GrupoResult        { codigo: string; descricao: string; }
export interface DestinacaoResult   { codigo: string; descricao: string; }
export interface TipoRecursoResult  { codigo: string; descricao: string; }
export interface TipoExecucaoResult { codigo: string; descricao: string; }

export interface DespesaRow {
  item:        number;
  data:        string;
  local:       string;
  despes:      string;
  descri:      string;
  quant:       number;
  total:       number;
  conta:       string;
  cc:          string;
  itemCtb:     string;
  clvl:        string;
  obs:         string;
  grupo:       string;
  destinacao:  string;
  tipoRecurso: string;
  tipoExecucao: string;
  qtdAnexos:   number;
}

export interface DespesaPayload {
  FLE_PRESTA:  string;
  FLE_DATA:    string;
  FLE_LOCAL:   string;
  FLE_DESPES:  string;
  FLE_DESCRI:  string;
  FLE_QUANT:   number;
  FLE_TOTAL:   number;
  FLE_CONTA:   string;
  FLE_CC:      string;
  FLE_ITEMCTA: string;
  FLE_CLVL:    string;
  FLE_OBS:     string;
  FLE_GRUPO:   string;
  FLE_EC05DB:      string;
  FLE_EC06DB:      string;
  FLE_EC07DB:      string;
}

export interface AnexoPayload {
  presta:  string;
  item:    number;
  nome:    string;
  tipo:    string;
  arquivo: string; // base64
}

export interface AnexoRow {
  chave:     string;
  nome:      string;
  descricao: string;
  caminho:   string;
  tipo:      string;
  data:      string;
  binId:     string;
  codObj:    string;
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

  listarFLG(): Observable<FLGResult[]> {
    const url = this.configService.getRestEndpoint('/PRESTACAOCONTA/FLG');
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => {
        const items: any[] = Array.isArray(res) ? res : (res?.items || res?.rows || []);
        return items.map((i: any) => ({
          codigo: i.codigo || '', descricao: i.descricao || '',
          custo: i.custo || '', itectb: i.itectb || '', clvl: i.clvl || ''
        }));
      }),
      catchError(() => throwError(() => new Error('Erro ao listar despesas FLG')))
    );
  }

  listarContasContabeis(): Observable<ContaContabilResult[]> {
    const url = this.configService.getRestEndpoint('/PRESTACAOCONTA/CONTASCONTABEIS');
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => {
        const items: any[] = Array.isArray(res) ? res : (res?.items || res?.rows || []);
        return items.map((i: any) => ({ codigo: i.codigo || '', descricao: i.descricao || '' }));
      }),
      catchError(() => throwError(() => new Error('Erro ao listar contas contábeis')))
    );
  }

  listarDespesas(presta: string): Observable<DespesaRow[]> {
    const url = this.configService.getRestEndpoint(`/PRESTACAOCONTA/DESPESAS/${encodeURIComponent(presta)}`);
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => {
        const items: any[] = Array.isArray(res) ? res : (res?.rows || []);
        return items.map((i: any) => ({
          item:      Number(i.item)      || 0,
          data:      i.data              || '',
          local:     i.local             || '',
          despes:    i.despes            || '',
          descri:    i.descri            || '',
          quant:     Number(i.quant)     || 0,
          total:     Number(i.total)     || 0,
          conta:     i.conta             || '',
          cc:        i.cc                || '',
          itemCtb:   i.itemCtb           || '',
          clvl:        i.clvl              || '',
          obs:         i.obs               || '',
          grupo:       i.grupo             || '',
          destinacao:  i.destinacao        || '',
          tipoRecurso: i.tipoRecurso       || '',
          tipoExecucao: i.tipoExecucao     || '',
          qtdAnexos:   Number(i.qtdAnexos) || 0
        }));
      }),
      catchError(this.handleError)
    );
  }

  inserirDespesa(payload: DespesaPayload): Observable<any> {
    const url = this.configService.getRestEndpoint('/PRESTACAOCONTA/DESPESAS');
    return this.http.post<any>(url, payload, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  excluirDespesa(presta: string, item: number): Observable<any> {
    const url = this.configService.getRestEndpoint(`/PRESTACAOCONTA/DESPESAS/${encodeURIComponent(presta)}/${item}`);
    return this.http.delete<any>(url, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  uploadAnexo(payload: AnexoPayload): Observable<any> {
    const url = this.configService.getRestEndpoint('/PRESTACAOCONTA/ANEXOS');
    return this.http.post<any>(url, payload, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  baixarAnexo(binId: string): Observable<{ base64: string; nome: string; tipo: string }> {
    const url = this.configService.getRestEndpoint(`/PRESTACAOCONTA/BINARIO/${encodeURIComponent(binId)}`);
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => ({
        base64: res.base64 || '',
        nome:   res.nome   || 'arquivo',
        tipo:   res.tipo   || 'application/octet-stream'
      })),
      catchError(this.handleError)
    );
  }

  listarAnexos(presta: string, item: number): Observable<AnexoRow[]> {
    const url = this.configService.getRestEndpoint(`/PRESTACAOCONTA/ANEXOS/${encodeURIComponent(presta)}/${item}`);
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => {
        const items: any[] = Array.isArray(res) ? res : (res?.rows || []);
        return items.map((i: any) => ({
          chave:     i.chave     || '',
          nome:      i.nome      || '',
          descricao: i.descricao || '',
          caminho:   i.caminho   || '',
          tipo:      i.tipo      || '',
          data:      i.data      || '',
          binId:     i.binId     || '',
          codObj:    i.codObj    || ''
        }));
      }),
      catchError(this.handleError)
    );
  }

  listarGrupos(): Observable<GrupoResult[]> {
    const url = this.configService.getRestEndpoint('/PRESTACAOCONTA/GRUPOS');
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => {
        const items: any[] = Array.isArray(res) ? res : (res?.items || res?.rows || []);
        return items.map((i: any) => ({ codigo: i.codigo || '', descricao: i.descricao || '' }));
      }),
      catchError(() => throwError(() => new Error('Erro ao listar grupos FLK')))
    );
  }

  listarDestinacoes(): Observable<DestinacaoResult[]> {
    const url = this.configService.getRestEndpoint('/PRESTACAOCONTA/DESTINACOES');
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => {
        const items: any[] = Array.isArray(res) ? res : (res?.items || res?.rows || []);
        return items.map((i: any) => ({ codigo: i.codigo || '', descricao: i.descricao || '' }));
      }),
      catchError(() => throwError(() => new Error('Erro ao listar destinações')))
    );
  }

  listarTiposRecurso(): Observable<TipoRecursoResult[]> {
    const url = this.configService.getRestEndpoint('/PRESTACAOCONTA/TIPOSRECURSO');
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => {
        const items: any[] = Array.isArray(res) ? res : (res?.items || res?.rows || []);
        return items.map((i: any) => ({ codigo: i.codigo || '', descricao: i.descricao || '' }));
      }),
      catchError(() => throwError(() => new Error('Erro ao listar tipos de recurso')))
    );
  }

  listarTiposExecucao(): Observable<TipoExecucaoResult[]> {
    const url = this.configService.getRestEndpoint('/PRESTACAOCONTA/TIPOSEXECUCAO');
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => {
        const items: any[] = Array.isArray(res) ? res : (res?.items || res?.rows || []);
        return items.map((i: any) => ({ codigo: i.codigo || '', descricao: i.descricao || '' }));
      }),
      catchError(() => throwError(() => new Error('Erro ao listar tipos de execução')))
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
