import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PatentesService as SharedPatentesService } from '../../shared/services/patentes.service';
import type { Patente, Usuario } from '../../shared/models/patentes.models';

/**
 * Serviço legado no namespace `admin/patentes` que delega
 * para a única implementação em `shared/services/patentes.service.ts`.
 */
@Injectable({ providedIn: 'root' })
export class AdminPatentesService {
  constructor(private shared: SharedPatentesService) {}

  listarPatentes(): Observable<Patente[]> {
    return this.shared.listarPatentes();
  }

  listarUsuariosPorPatente(patenteId: string): Observable<Usuario[]> {
    return this.shared.listarUsuariosPorPatente(patenteId);
  }

  listarUsuariosPorPatentePertence(patenteId: string): Observable<Usuario[]> {
    return this.shared.listarUsuariosPorPatentePertence(patenteId);
  }

  atribuirUsuarioPatente(patenteId: string, usuarioId: string): Observable<any> {
    return this.shared.atribuirUsuarioPatente(patenteId, usuarioId);
  }

  removerUsuarioPatente(patenteId: string, usuarioId: string): Observable<any> {
    return this.shared.removerUsuarioPatente(patenteId, usuarioId);
  }
}

