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

  estaLogueado(): boolean {

    if (this.auth.usuarioActual()!=null){
      return true;
    }
    return false;

    //return this.auth.usuarioActual() !== null;
    //return true;
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => {
        // Opción A: Recargar la página para limpiar todo (más seguro)
        window.location.href = '/';

        // Opción B: Navegar con el router (más rápido/SPA)
        // this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Error al cerrar sesión', err);
        // Aun si falla en el back, borramos en el front para que no se quede pillado
        this.auth.usuarioActual.set(null);
      }
    });
  }

}
