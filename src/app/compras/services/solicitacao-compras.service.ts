import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../shared/services/auth.service';

export interface SolicitacaoCompraResponse {
  success: boolean;
  message: string;
  total: number;
  items: SolicitacaoCompraAPI[];
}

export interface SolicitacaoCompraAPI {
  C7_NUM: string;
  C7_ITEM: string;
  C7_PRODUTO: string;
  C7_DESCRI: string;
  C7_QUANT: number;
  C7_PRECO: number;
  C7_TOTAL: number;
  C7_CONTATO?: string;
  C7_OBS?: string;
  C7_CC?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SolicitacaoComprasService {
  private readonly baseUrl = '/rest';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHttpOptions() {
    const token = this.authService.getToken();
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return {
      headers: new HttpHeaders(headers)
    };
  }

  private checkAuthentication(): boolean {
    if (!this.authService.isAuthenticated()) {
      console.warn('[SOLICITACAO-SERVICE] Usuário não autenticado');
      return false;
    }
    return true;
  }

  getSolicitacoes(): Observable<SolicitacaoCompraAPI[]> {
    if (!this.checkAuthentication()) {
      return throwError(() => new Error('Usuário não autenticado. Faça login novamente.'));
    }

    const url = `${this.baseUrl}/pedidos-compra`;
    
    console.log('[SOLICITACAO-SERVICE] Fazendo requisição GET para:', url);
    console.log('[SOLICITACAO-SERVICE] Token presente:', !!this.authService.getToken());
    
    return this.http.get<any>(url, this.getHttpOptions()).pipe(
      map(response => {
        console.log('Resposta da API /pedidos-compra:', response);
        
        if (response && response.success && response.items && Array.isArray(response.items)) {
          console.log(`Encontrados ${response.items.length} pedidos de compra`);
          console.log(`Total: ${response.total}, Mensagem: ${response.message}`);
          return response.items;
        }
        
        console.warn('Estrutura de resposta não reconhecida, retornando array vazio');
        return [];
      }),
      catchError(this.handleError)
    );
  }

  criarSolicitacao(solicitacao: any): Observable<any> {
    if (!this.checkAuthentication()) {
      return throwError(() => new Error('Usuário não autenticado. Faça login novamente.'));
    }

    const url = `${this.baseUrl}/pedidos-compra`;
    
    console.log('[SOLICITACAO-SERVICE] Fazendo requisição POST para:', url);
    console.log('[SOLICITACAO-SERVICE] Dados da solicitação:', solicitacao);
    console.log('[SOLICITACAO-SERVICE] Token presente:', !!this.authService.getToken());
    
    return this.http.post<any>(url, solicitacao, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  atualizarSolicitacao(id: string, solicitacao: any): Observable<any> {
    if (!this.checkAuthentication()) {
      return throwError(() => new Error('Usuário não autenticado. Faça login novamente.'));
    }

    const url = `${this.baseUrl}/pedidos-compra/${id}`;
    
    console.log('[SOLICITACAO-SERVICE] Fazendo requisição PUT para:', url);
    console.log('[SOLICITACAO-SERVICE] ID da solicitação:', id);
    console.log('[SOLICITACAO-SERVICE] Dados da atualização:', solicitacao);
    console.log('[SOLICITACAO-SERVICE] Token presente:', !!this.authService.getToken());
    
    return this.http.put<any>(url, solicitacao, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  mapearDadosAPI(dadosAPI: SolicitacaoCompraAPI[]): any[] {
    return dadosAPI.map(item => {
      const produtoCompleto = item.C7_PRODUTO || '';
      const produtoUltimos4 = produtoCompleto.length >= 4 ? produtoCompleto.slice(-4) : produtoCompleto;
      
      return {
        id: item.C7_NUM + item.C7_ITEM || Math.random().toString(),
        numeroSolicitacao: item.C7_NUM || 'SC-' + new Date().getTime(),
        dataSolicitacao: new Date().toISOString().split('T')[0],
        produto: produtoUltimos4,
        cc: item.C7_CC || '',
        contato: item.C7_CONTATO || '',
        status: 'pendente',
        valorTotal: item.C7_TOTAL || 0,
        obs: item.C7_OBS || '',
        descricao: item.C7_DESCRI || '',
        quantidade: item.C7_QUANT || 0,
        preco: item.C7_PRECO || 0,
        item: item.C7_ITEM || '',
        dadosOriginais: item
      };
    });
  }

  private mapearStatus(statusAPI: string): string {
    const statusMap: { [key: string]: string } = {
      '1': 'pendente',
      '2': 'aprovado',
      '3': 'rejeitado',
      '4': 'processando',
      'P': 'pendente',
      'A': 'aprovado',
      'R': 'rejeitado',
      'E': 'processando'
    };
    
    return statusMap[statusAPI] || 'pendente';
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Erro desconhecido';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      errorMessage = `Código: ${error.status}\nMensagem: ${error.message}`;
      
      if (error.status === 0) {
        errorMessage = 'Erro de conexão. Verifique se o servidor está acessível.';
      } else if (error.status === 401) {
        errorMessage = 'Acesso não autorizado. Token inválido ou expirado. Faça login novamente.';
      } else if (error.status === 403) {
        errorMessage = 'Acesso negado. Você não tem permissão para esta operação.';
      } else if (error.status === 404) {
        errorMessage = 'Endpoint não encontrado. Verifique a URL da API.';
      } else if (error.status === 500) {
        errorMessage = 'Erro interno do servidor.';
      }
    }
    
    console.error('[SOLICITACAO-SERVICE] Erro na API:', error);
    console.error('[SOLICITACAO-SERVICE] Status do erro:', error.status);
    console.error('[SOLICITACAO-SERVICE] Mensagem de erro:', errorMessage);
    
    return throwError(() => new Error(errorMessage));
  }
}