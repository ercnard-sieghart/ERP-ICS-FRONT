import { Injectable, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; 

//Serviço que detecta idioma
@Injectable({
  providedIn: 'root',
})
export class LanguageGuardService {
  isBlocked(): boolean {
    const browserLang = navigator.language || navigator.languages[0];
    return !browserLang.toLowerCase().startsWith('pt-br');
  }
}

//Componente que exibe o bloqueio
@Component({
  selector: 'app-language-block',
  templateUrl: './language-block.component.html',
  standalone: true,         
  imports: [CommonModule]     
})
export class LanguageBlockComponent {
  @Input() blocked = false;
}
