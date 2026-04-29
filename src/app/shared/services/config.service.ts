import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  
  get apiUrl(): string {
    return environment.apiUrl;
  }

  get apiBaseUrl(): string {
    return environment.apiBaseUrl;
  }

  get isProduction(): boolean {
    return environment.production;
  }

  get appName(): string {
    return environment.appName;
  }

  get version(): string {
    return environment.version;
  }

  /**
   * Constrói a URL completa para endpoints da API
   * @param endpoint - O endpoint específico (ex: '/api/oauth2/v1/token')
   * @returns URL completa
   */
  getApiEndpoint(endpoint: string): string {
    if (this.isProduction) {
      return `${this.apiUrl}${endpoint}`;
    }
    return endpoint; // Em desenvolvimento usa o proxy
  }

  /**
   * Constrói URLs para o base da API REST
   * @param path - Caminho específico (ex: '/login')
   * @returns URL completa
   */
  getRestEndpoint(path: string): string {
    if (this.isProduction) {
      return `${this.apiUrl}${this.apiBaseUrl}${path}`;
    }
    return `${this.apiBaseUrl}${path}`; // Em desenvolvimento usa o proxy
  }

  /**
   * Retorna a URL completa do endpoint externo da API (sempre usando apiUrl)
   * Use para chamar endpoints que não devem passar pelo proxy em dev.
   */
  getExternalEndpoint(path: string): string {
    return `${this.apiUrl}${path}`;
  }
}