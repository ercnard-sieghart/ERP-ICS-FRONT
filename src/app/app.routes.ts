import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { patenteGuard } from './shared/guards/patente.guard';



import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ErrorPageComponent } from './error-page.component';



export const routes: Routes = [
	{ path: 'login', component: LoginComponent },
	{
		path: 'change-password',
		loadComponent: () => import('./change-password/change-password.component').then(m => m.ChangePasswordComponent)
	},
		{ path: 'home', component: HomeComponent, canActivate: [authGuard] },
		{ path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
		{
			path: 'consultas',
			loadComponent: () => import('./consultas/consultas.component').then(m => m.ConsultasComponent),
			canActivate: [authGuard]
		},
		{
			path: 'consultas/extrato-bancario',
			loadComponent: () => import('./consultas/consulta-extrato.component').then(m => m.ConsultaExtratoComponent),
			canActivate: [authGuard]
		},
		{
			path: 'orcamentos',
			loadComponent: () => import('./orcamentos/orcamentos.component').then(m => m.OrcamentosComponent),
			canActivate: [authGuard]
		},
		{
			path: 'financeiro',
			loadComponent: () => import('./financeiro/viagens.component').then(m => m.ViagensComponent),
			canActivate: [authGuard]
		},
		{
			path: 'financeiro/viagens',
			loadComponent: () => import('./financeiro/viagens.component').then(m => m.ViagensComponent),
			canActivate: [authGuard]
		},
		{
			path: 'financeiro/prestacao-contas',
			loadComponent: () => import('./financeiro/prestacao-contas.component').then(m => m.PrestacaoContasComponent),
			canActivate: [authGuard]
		},
		{
			path: 'financeiro/minhas-prestacoes',
			loadComponent: () => import('./financeiro/consulta-prestacoes.component').then(m => m.ConsultaPrestacoesComponent),
			canActivate: [authGuard]
		},
		{
			path: 'financeiro/minhas-prestacoes/:codigo',
			loadComponent: () => import('./financeiro/detalhe-prestacao.component').then(m => m.DetalhePrestacaoComponent),
			canActivate: [authGuard]
		},
		{
			path: 'compras/solicitacao',
			loadComponent: () => import('./compras/solicitacao-compras/solicitacao-compras.component').then(m => m.SolicitacaoComprasComponent),
			canActivate: [authGuard, patenteGuard]
		},
		{
			path: 'patentes/coordenacao',
			loadComponent: () => import('./admin/patentes/coordenacao.component').then(m => m.CoordenacaoComponent),
			canActivate: [authGuard, patenteGuard]
		},
		{
			path: 'patentes/gestao',
			loadComponent: () => import('./admin/patentes/gestao-patentes.component').then(m => m.GestaoPatentesComponent),
			canActivate: [authGuard, patenteGuard]
		},
	{ path: '', redirectTo: 'login', pathMatch: 'full' },
    // Rota detalhe-item removida
	{ path: 'error', component: ErrorPageComponent },
	{ path: '**', redirectTo: 'error' }
];
