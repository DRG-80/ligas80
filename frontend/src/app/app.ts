import {Component, inject, OnInit, signal} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import { Header } from './componentes/header/header';
import {Hero} from './hero/hero';
import {CardsSection} from './cards-section/cards-section';
import {Footer} from './componentes/footer/footer';
import {Auth} from './services/auth';



@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Hero, CardsSection, Footer],
  templateUrl: './app.html',
  standalone: true,
  styleUrl: './app.scss'
})
export class App  implements OnInit{

  // Necesario para poderlo usar en toda la aplicación
  constructor(public router: Router) {}
  // Inyección del servicio de autenticación
  private auth = inject(Auth);

  ngOnInit() {
    // RECUPERACIÓN DE SESIÓN:
    // Al cargar o recargar la página, se comprueba con el backend si el usuario tiene un token válido para restaurar su sesión automáticamente.
    this.auth.user().subscribe({
      next: (user) => console.log('✅ Sesión recuperada:', user.name),
      error: () => console.log('ℹ️ Usuario no logueado')
    });
  }
}
