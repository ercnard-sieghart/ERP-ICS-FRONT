
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PoPageLoginModule, PoPageLogin } from '@po-ui/ng-templates';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, PoPageLoginModule]
})
export class LoginComponent {
  loading: boolean = false;

  loginSubmit(loginData: any) {
    this.loading = true;
    // loginData.login, loginData.password, loginData.rememberUser
    setTimeout(() => {
      this.loading = false;
      // Adicione aqui a lógica de autenticação
    }, 1500);
  }
}