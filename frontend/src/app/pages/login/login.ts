import { Component } from '@angular/core';
import { Auth } from '../../services/auth';
import {Router, RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {Header} from '../../componentes/header/header';
import {Footer} from '../../componentes/footer/footer';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, Header, Footer, RouterLink]
})
export class Login {


  email = '';
  password = '';
  error = '';

  constructor(private auth: Auth, private router: Router) {}

  submit() {
    this.auth.login({ email: this.email, password: this.password })
      .subscribe({
        next: () => this.router.navigate(['/']),
        error: () => this.error = 'Usuario o contraseña incorrecta'
      });
  }

}
