import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './shared/services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  
  // Verificação direta do token
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    sessionStorage.setItem('redirectUrl', state.url);
    router.navigate(['/login']);
    return false;
  }
  
  if (token.length < 10) {
    authService.logout();
    sessionStorage.setItem('redirectUrl', state.url);
    router.navigate(['/login']);
    return false;
  }
  
  if (token.trim() === '') {
    authService.logout();
    sessionStorage.setItem('redirectUrl', state.url);
    router.navigate(['/login']);
    return false;
  }
  
  return true;
};