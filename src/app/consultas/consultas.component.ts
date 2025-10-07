import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConsultaExtratoComponent } from './consulta-extrato.component';
import { PoIconModule } from '@po-ui/ng-components';

interface Consulta {
  nome: string;
  descricao: string;
  modulo: string;
}

@Component({
  selector: 'app-consultas',
  standalone: true,
  templateUrl: './consultas.component.html',
  styleUrls: ['./consultas.component.css'],
  imports: [CommonModule, FormsModule, RouterModule, ConsultaExtratoComponent, PoIconModule]
})
export class ConsultasComponent {
  modulos = [
    { value: 'modulo1', label: 'Financeiro' },

  ];

  consultas: Consulta[] = [
    { nome: 'Consulta Extrato', descricao: 'Extrato Bancário por período', modulo: 'modulo1' }];

  moduloSelecionado = this.modulos[0].value;
  mostrarRelatorio = false;

  get consultasFiltradas() {
    return this.consultas.filter(c => c.modulo === this.moduloSelecionado);
  }

  abrirRelatorio() {
    this.mostrarRelatorio = true;
  }

  fecharRelatorio() {
    this.mostrarRelatorio = false;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscKey(event: KeyboardEvent) {
    if (this.mostrarRelatorio) {
      this.fecharRelatorio();
    }
  }
}
