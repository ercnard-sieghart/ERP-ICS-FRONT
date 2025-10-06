import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ConfigService } from '../../shared/services/config.service';
import { AuthService } from '../../shared/services/auth.service';

// Interfaces baseadas na documentação FK5
export interface FiltrosExtrato {
  filial: string;
  banco: string;
  conta: string;
  dataInicio: string; // YYYYMMDD
  dataFim: string;    // YYYYMMDD
  agencia?: string;
  natureza?: string;
  tipoDoc?: string;
}

export interface MovimentoBancario {
  filial: string;
  banco: string;
  agencia: string;
  conta: string;
  nomeBanco: string;
  beneficiario: string;
  tipoDoc: string;
  historico: string;
  dataMov: string;
  natureza: string;
  documento: string;
  recPag: string; // R=Recebimento, P=Pagamento
  valor: number;
  entrada: number;
  saida: number;
}

export interface RespostaExtrato {
  success: boolean;
  message: string;
  total: number;
  totalEntrada: number;
  totalSaida: number;
  saldo: number;
  filtros: FiltrosExtrato;
  movimentos: MovimentoBancario[];
}

export interface Banco {
  filial: string;
  codigo: string;
  agencia: string;
  conta: string;
  nome: string;
  nomeReduzido: string;
}

export interface RespostaBancos {
  success: boolean;
  message: string;
  total: number;
  bancos: Banco[];
}

@Injectable({
  providedIn: 'root'
})
export class ExtratoBancarioService {

  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private authService: AuthService
  ) {}

  private getHttpOptions() {
    const token = this.authService.getToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return { headers };
  }

  private checkAuthentication(): boolean {
    if (!this.authService.isAuthenticated()) {
      throw new Error('Usuário não autenticado');
    }
    return true;
  }

  consultarExtrato(filtros: FiltrosExtrato): Observable<RespostaExtrato> {
    this.checkAuthentication();
    
    const url = `${this.configService.apiUrl}/EXTRATOBANCARIO`;
    
    console.log('Consultando extrato bancário:', url);

    return this.http.post<RespostaExtrato>(url, filtros, this.getHttpOptions())
      .pipe(
        catchError(error => {
          return this.handleError(error);
        })
      );
  }

  listarBancos(): Observable<RespostaBancos> {
    this.checkAuthentication();
    
    const url = `${this.configService.apiUrl}/EXTRATOBANCARIO/bancos`;
    
    console.log('Listando bancos:', url);

    return this.http.get<RespostaBancos>(url, this.getHttpOptions())
      .pipe(
        catchError(error => {
          return this.handleError(error);
        })
      );
  }

  formatarDataParaAPI(data: string): string {
    if (!data) return '';
    
    // Se já estiver no formato YYYYMMDD, retorna como está
    if (/^\d{8}$/.test(data)) {
      return data;
    }
    
    // Converter de YYYY-MM-DD para YYYYMMDD
    return data.replace(/-/g, '');
  }

  formatarDataParaExibicao(data: string): string {
    if (!data || data.length !== 8) return data;
    
    const ano = data.substring(0, 4);
    const mes = data.substring(4, 6);
    const dia = data.substring(6, 8);
    
    return `${dia}/${mes}/${ano}`;
  }

  formatarValor(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  }

  getTipoDocumentoDescricao(tipo: string): string {
    const tipos: { [key: string]: string } = {
      'CH': 'Cheque',
      'TB': 'Transferência',
      'DOC': 'DOC',
      'TED': 'TED',
      'PIX': 'PIX',
      'CC': 'Cartão de Crédito',
      'CD': 'Cartão de Débito',
      'DE': 'Depósito',
      'SA': 'Saque'
    };
    
    return tipos[tipo] || tipo;
  }

  getClasseOperacao(recPag: string): string {
    return recPag === 'R' ? 'receita' : 'pagamento';
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'Erro desconhecido';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.status) {
      switch (error.status) {
        case 401:
          errorMessage = 'Não autorizado. Faça login novamente.';
          break;
        case 403:
          errorMessage = 'Acesso negado. Verifique suas permissões.';
          break;
        case 404:
          errorMessage = 'Serviço de extrato bancário não encontrado.';
          break;
        case 500:
          errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
          break;
        default:
          errorMessage = `Erro HTTP ${error.status}: ${error.statusText}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}