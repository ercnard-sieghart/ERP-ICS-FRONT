import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { PatentesService } from './shared/services/patentes.service';
import { AuthService } from './shared/services/auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

const validatedMenuIds = new Set<string>();

const originalLogout = AuthService.prototype.logout;
AuthService.prototype.logout = function(...args: any[]) {
  validatedMenuIds.clear();
  return originalLogout.call(this);
};

// Guard de permissão de menu
export const patenteGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const patentesService = inject(PatentesService);
  const authService = inject(AuthService);

  const rota = state.url.split('?')[0];
  if (rota === '/home' || rota === '/dashboard') {
    return true;
  }
  const token = authService.getToken ? authService.getToken() : localStorage.getItem('authToken');
  if (!token || token.length < 10) {
    sessionStorage.setItem('redirectUrl', state.url);
    router.navigate(['/login']);
    return false;
  }

  const menus = patentesService.getMenus();
  const menu = menus.find(m => m.rota === rota);
  const idMenu = menu?.id;
  if (!idMenu) {
    router.navigate(['/error'], { queryParams: { message: 'Acesso negado' } });
    return false;
  }

  // Se já validou esse menu nesta sessão, libera sem nova requisição
  if (validatedMenuIds.has(idMenu)) {
    return true;
  }

  return patentesService.validarAcessoMenu(idMenu).pipe(
    map(resp => {
      if (resp.acess) {
        validatedMenuIds.add(idMenu);
        return true;
      } else {
        router.navigate(['/error'], { queryParams: { message: resp.message || 'Acesso negado' } });
        return false;
      }
    }),
    catchError(() => {
      router.navigate(['/error'], { queryParams: { message: 'Erro ao validar acesso ao menu.' } });
      return of(false);
    })
  );
};
