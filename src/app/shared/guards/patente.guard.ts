import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

export const patenteGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  const requestedRoute = (state.url || '').split('?')[0].toLowerCase();
  const routeDataId = route && route.data && (route.data as any).patenteId ? (route.data as any).patenteId : null;

  const validate = (id: any) => {
    return auth.validarAcessoPatente(id).pipe(
      map((allowed: boolean) => { if (!allowed) { try { router.navigate(['/home']); } catch {} } return allowed; }),
      catchError(() => { try { router.navigate(['/home']); } catch {} return of(false); })
    );
  };

  try {
    const raw = localStorage.getItem('menusUsuario');
    const menus = raw ? JSON.parse(raw) : [];
    const parts = requestedRoute.split('/').filter(Boolean);
    const prefix = parts.length > 0 ? '/' + parts[0] : requestedRoute;
    const found = (menus || []).find((m: any) => ((m.rota || '').toLowerCase() === prefix) || ((m.rota || '').toLowerCase() === requestedRoute) || requestedRoute.startsWith(((m.rota || '').toLowerCase())));
    const resolvedId = routeDataId || (found && found.id ? found.id : null);

    if (resolvedId) return validate(resolvedId);

    return auth.carregarMenusLiberadosUsuario().pipe(
      switchMap((menusFromServer: any[]) => {
        try { try { localStorage.setItem('menusUsuario', JSON.stringify(menusFromServer)); } catch {} } catch {}
        const f = (menusFromServer || []).find((m: any) => ((m.rota || '').toLowerCase() === prefix) || ((m.rota || '').toLowerCase() === requestedRoute) || requestedRoute.startsWith(((m.rota || '').toLowerCase())));
        const newId = f && f.id ? f.id : null;
        if (newId) return validate(newId);
        return validate('');
      }),
      catchError(() => validate(''))
    );
  } catch (e) {
    try { router.navigate(['/home']); } catch {}
    return of(false);
  }
};
