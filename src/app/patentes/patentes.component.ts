

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatentesApiService, Patente, Colaborador } from '../shared/services/patentes-api.service';
import { PoButtonModule, PoModalModule, PoLoadingModule } from '@po-ui/ng-components';

@Component({
  selector: 'app-patentes',
  standalone: true,
  imports: [CommonModule, FormsModule, PoButtonModule, PoModalModule, PoLoadingModule],
  templateUrl: './patentes.component.html',
  styleUrls: ['./patentes.component.css']
})
export class PatentesComponent {
  patentes: Patente[] = [];
  loading = false;
  erro = '';

  // Modal de colaboradores
  showColabModal = false;
  colaboradores: Colaborador[] = [];
  patenteSelecionada: Patente | null = null;
  loadingColab = false;
  erroColab = '';
  novoColaboradorId = '';

  constructor(private patentesApi: PatentesApiService) {
    this.carregarPatentes();
  }

  carregarPatentes() {
    this.loading = true;
    this.erro = '';
    // Chamada ao webservice que retorna as patentes:
    // (O método getPatentes() faz a requisição HTTP para o backend)
    this.patentesApi.getPatentes().subscribe({
      next: (patentes) => {
        this.patentes = patentes;
        this.loading = false;
      },
      error: (err) => {
        this.erro = 'Erro ao carregar patentes';
        this.loading = false;
      }
    });
  }

  abrirColaboradores(patente: Patente) {
    this.patenteSelecionada = patente;
    this.showColabModal = true;
    this.carregarColaboradores(patente.id);
  }

  fecharColaboradores() {
    this.showColabModal = false;
    this.patenteSelecionada = null;
    this.colaboradores = [];
    this.novoColaboradorId = '';
    this.erroColab = '';
  }

  carregarColaboradores(patenteId: string) {
    this.loadingColab = true;
    this.erroColab = '';
    this.patentesApi.getColaboradoresDaPatente(patenteId).subscribe({
      next: (colabs) => {
        this.colaboradores = colabs;
        this.loadingColab = false;
      },
      error: () => {
        this.erroColab = 'Erro ao carregar colaboradores';
        this.loadingColab = false;
      }
    });
  }

  adicionarColaborador() {
    if (!this.patenteSelecionada || !this.novoColaboradorId) return;
    this.patentesApi.adicionarColaborador(this.patenteSelecionada.id, this.novoColaboradorId).subscribe({
      next: () => {
        this.novoColaboradorId = '';
        this.carregarColaboradores(this.patenteSelecionada!.id);
      },
      error: () => {
        this.erroColab = 'Erro ao adicionar colaborador';
      }
    });
  }

  removerColaborador(colab: Colaborador) {
    if (!this.patenteSelecionada) return;
    this.patentesApi.removerColaborador(this.patenteSelecionada.id, colab.id).subscribe({
      next: () => {
        this.carregarColaboradores(this.patenteSelecionada!.id);
      },
      error: () => {
        this.erroColab = 'Erro ao remover colaborador';
      }
    });
  }
}
