
import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { patenteGuard } from './patente.guard';

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
		canActivate: [authGuard, patenteGuard],
		data: { idMenu: 'consultas' }
	},
	{
		path: 'consultas/extrato-bancario',
		loadComponent: () => import('./consultas/consulta-extrato.component').then(m => m.ConsultaExtratoComponent),
		canActivate: [authGuard, patenteGuard],
		data: { idMenu: 'extrato-bancario' }
	},
	{
		path: 'orcamentos',
		loadComponent: () => import('./orcamentos/orcamentos.component').then(m => m.OrcamentosComponent),
		canActivate: [authGuard, patenteGuard],
		data: { idMenu: 'orcamentos' }
	},
	{
		path: 'compras/solicitacao',
		loadComponent: () => import('./compras/solicitacao-compras/solicitacao-compras.component').then(m => m.SolicitacaoComprasComponent),
		canActivate: [authGuard, patenteGuard],
		data: { idMenu: 'compras-solicitacao' }
	},
	{ path: '', redirectTo: 'login', pathMatch: 'full' },
	{ path: 'detalhe-item', loadComponent: () => import('./orcamentos/detalhe-item-modal.component').then(m => m.DetalheItemModalComponent), canActivate: [authGuard, patenteGuard], data: { idMenu: 'detalhe-item' } },
	{ path: 'error', component: ErrorPageComponent },
	{
		path: 'admin/patentes',
		loadComponent: () => import('./patentes/patentes.component').then(m => m.PatentesComponent),
		canActivate: [authGuard, patenteGuard],
		data: { idMenu: 'admin-patentes' }
	},
	{ path: '**', redirectTo: 'error' }
];
