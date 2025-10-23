import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Patente {
  id: string;
  nome: string;
}

export interface Colaborador {
  id: string;
  nome: string;
}

@Injectable({ providedIn: 'root' })
export class PatentesApiService {
  constructor(private http: HttpClient) {}

  getPatentes(): Observable<Patente[]> {
    return this.http.get<Patente[]>('/rest/patentes');
  }

  getColaboradoresDaPatente(patenteId: string): Observable<Colaborador[]> {
    return this.http.get<Colaborador[]>(`/rest/patentes/${patenteId}/colaboradores`);
  }

  adicionarColaborador(patenteId: string, colaboradorId: string): Observable<any> {
    return this.http.post(`/rest/patentes/${patenteId}/colaboradores`, { colaboradorId });
  }

  removerColaborador(patenteId: string, colaboradorId: string): Observable<any> {
    return this.http.delete(`/rest/patentes/${patenteId}/colaboradores/${colaboradorId}`);
  }
}
