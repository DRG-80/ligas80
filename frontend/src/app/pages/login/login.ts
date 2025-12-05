import { Component } from '@angular/core';
import { Auth } from '../../services/auth';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Header } from '../../componentes/header/header';
import { Footer } from '../../componentes/footer/footer';

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

  submit() { // Ya no necesita ser async
    this.error = '';


    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        // Login exitoso
        this.router.navigate(['/']); // O '/home'
      },
      error: (err) => {
        console.error(err);
        if (err.status === 401 || err.status === 422) {
          this.error = "Credenciales incorrectas";
        } else {
          this.error = "Error al iniciar sesión";
        }
      }
    });
  }

}
