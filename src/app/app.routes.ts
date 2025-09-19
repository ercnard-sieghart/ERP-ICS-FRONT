import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';



import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ErrorPageComponent } from './error-page.component';



export const routes: Routes = [
	{ path: 'login', component: LoginComponent },
		{ path: 'home', component: HomeComponent, canActivate: [authGuard] },
		{ path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
		{
			path: 'consultas',
			loadComponent: () => import('./consultas/consultas.component').then(m => m.ConsultasComponent),
			canActivate: [authGuard]
		},
		{
			path: 'consultas/consulta1',
			loadComponent: () => import('./consultas/consulta-extrato.component').then(m => m.ConsultaExtratoComponent),
			canActivate: [authGuard]
		},
		{
			path: 'orcamentos',
			loadComponent: () => import('./orcamentos/orcamentos.component').then(m => m.OrcamentosComponent),
			canActivate: [authGuard]
		},
	{ path: '', redirectTo: 'login', pathMatch: 'full' },
		{ path: 'detalhe-item', loadComponent: () => import('./orcamentos/detalhe-item-modal.component').then(m => m.DetalheItemModalComponent), canActivate: [authGuard] },
	{ path: 'error', component: ErrorPageComponent },
	{ path: '**', redirectTo: 'error' }
];
