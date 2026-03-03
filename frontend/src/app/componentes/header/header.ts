import {Component, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-header',
  imports: [RouterModule, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  standalone: true
})
export class Header {

  public auth = inject(Auth);
  private router = inject(Router);
  menuAbierto = false;

  estaLogueado(): boolean {

    if (this.auth.usuarioActual()!=null){
      return true;
    }
    return false;


  }

  logout() {
    this.auth.logout().subscribe({
      next: () => {

        window.location.href = '/';


      },
      error: (err) => {
        console.error('Error al cerrar sesión', err);

        this.auth.usuarioActual.set(null);
      }
    });
  }

}
