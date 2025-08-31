import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  try {
    const token = localStorage.getItem('authToken');
    if (token && token.length > 0) {
      return true;
    }
    router.navigate(['/login']);
    return false;
  } catch (e) {
    router.navigate(['/error'], { state: { errorMessage: 'Erro inesperado na autenticação', errorCode: 'AUTH_GUARD' } });
    return false;
  }
};