import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { PatentesService } from '../services/patentes.service';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class PatenteGuard implements CanActivate {

  constructor(
    private patentesService: PatentesService,
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    const rotaAtual = state.url;
    
    if (!this.patentesService.temPermissao(rotaAtual)) {
      console.warn(`Acesso negado para rota: ${rotaAtual}`);
      this.router.navigate(['/home']);
      return false;
    }
    
    return true;
  }
}