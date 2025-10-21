import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-patentes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patentes.component.html',
  styleUrls: ['./patentes.component.css']
})
export class PatentesComponent {
  patenteId = '';
  usuarioId = '';
  funcaoCodigo = '';
  grupoCodigo = '';

  atribuirPorUsuario() {
    // Chamar endpoint para atribuir por usuário
  }

  atribuirPorFuncao() {
    // Chamar endpoint para atribuir por função
  }

  atribuirPorGrupo() {
    // Chamar endpoint para atribuir por grupo
  }
}
