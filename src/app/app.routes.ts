import { Routes } from '@angular/router';



import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';



export const routes: Routes = [
	{ path: 'login', component: LoginComponent },
	{ path: 'home', component: HomeComponent },
	{ path: 'dashboard', component: DashboardComponent },
	{
		path: 'consultas',
		loadComponent: () => import('./consultas/consultas.component').then(m => m.ConsultasComponent)
	},
	{
		path: 'consultas/consulta1',
		loadComponent: () => import('./consultas/consulta-extrato.component').then(m => m.ConsultaExtratoComponent)
	},
	{
		path: 'orcamentos',
		loadComponent: () => import('./orcamentos/orcamentos.component').then(m => m.OrcamentosComponent)
	},
	{ path: '', redirectTo: 'login', pathMatch: 'full' },
	{ path: 'detalhe-item', loadComponent: () => import('./orcamentos/detalhe-item-modal.component').then(m => m.DetalheItemModalComponent) },
];
