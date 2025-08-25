import { Component } from '@angular/core';
import { MenuComponent } from '../shared/menu/menu.component';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  imports: [MenuComponent, CommonModule, FormsModule, NgFor, NgIf]
})
export class ConsultasComponent {
  modulos = [
    { value: 'modulo1', label: 'Módulo 1' },
    { value: 'modulo2', label: 'Módulo 2' },
    { value: 'modulo3', label: 'Módulo 3' }
  ];

  consultas: Consulta[] = [
    { nome: 'Consulta Fictícia 1', descricao: 'Descrição breve da consulta', modulo: 'modulo1' },
    { nome: 'Consulta Fictícia 2', descricao: 'Descrição breve da consulta', modulo: 'modulo1' },
    { nome: 'Consulta Fictícia 3', descricao: 'Descrição breve da consulta', modulo: 'modulo2' },
    { nome: 'Consulta Fictícia 4', descricao: 'Descrição breve da consulta', modulo: 'modulo2' },
    { nome: 'Consulta Fictícia 5', descricao: 'Descrição breve da consulta', modulo: 'modulo3' },
    { nome: 'Consulta Fictícia 6', descricao: 'Descrição breve da consulta', modulo: 'modulo3' }
  ];

  moduloSelecionado = this.modulos[0].value;

  get consultasFiltradas() {
    return this.consultas.filter(c => c.modulo === this.moduloSelecionado);
  }
}
