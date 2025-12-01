import { Component } from '@angular/core';
import {Header} from '../../componentes/header/header';
import {Footer} from '../../componentes/footer/footer';
import {FormsModule} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {Auth} from '../../services/auth';

@Component({
  selector: 'app-register',
  imports: [Header,Footer,FormsModule,RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
  standalone: true
})
export class Register {


  name: string = '';
  email: string = '';
  password: string = '';
  password_confirmation: string = '';

  error: string = '';
  loading: boolean = false;
  constructor(private auth: Auth, private router: Router) {}

  submit() {
    this.error = '';
    this.loading = true;

    if (this.password !== this.password_confirmation) {
      this.error = 'Las contraseñas no coinciden';
      this.loading = false;
      return;
    }

    this.auth.register({
      name: this.name,
      email: this.email,
      password: this.password,
      password_confirmation: this.password_confirmation
    }).subscribe({
      next: (res) => {
        this.router.navigate(['/login']);
      },
      error: (err) => {

        this.loading = false;


        if (err.error && err.error.message) {

          this.error = err.error.message;

        } else {

          this.error = 'Error inesperado';
        }
      }
    });
  }

}
