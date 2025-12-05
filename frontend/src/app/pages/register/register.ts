import { Component } from '@angular/core';
import { Auth } from '../../services/auth'; // Asegúrate que la ruta sea correcta
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Footer } from '../../componentes/footer/footer';
import { Header } from '../../componentes/header/header';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-register',
  templateUrl: './register.html', // Asumiendo que existe
  styleUrls: ['./register.scss'], // Asumiendo que existe
  standalone: true,
  imports: [CommonModule, FormsModule, Header, Footer]
})
export class Register {
  name = '';
  email = '';
  password = '';
  password_confirmation = '';
  error: string | null = null;

  constructor(private auth: Auth, private router: Router) {}

  async submit() {
    this.error = null;

    try {



      const response = await lastValueFrom(
        this.auth.register(this.name, this.email, this.password, this.password_confirmation)
      );

      console.log('Registro exitoso:', response);

      this.router.navigate(['/login']);

    } catch (err: any) {
      console.error('Error completo:', err); // Para depurar en consola

      if (err.status === 422) {
        this.error = 'Datos no válidos: ' + (err.error.message || '');
      } else {
        this.error = 'Error al registrar. Inténtalo de nuevo.';
      }
    }
  }
}
