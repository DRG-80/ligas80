import {Component, OnInit} from '@angular/core';
import {Hero} from '../hero/hero';
import {CardsSection} from '../cards-section/cards-section';
import {EmpezarSection} from '../empezar-section/empezar-section';
import {Header} from '../componentes/header/header';
import {Footer} from '../componentes/footer/footer';
import {Auth} from '../services/auth';

@Component({
  selector: 'app-home',
  imports: [Hero, CardsSection, EmpezarSection, Header, Footer],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  standalone: true
})
export class Home  implements OnInit{

  // Servicio de autenticación
  constructor(private auth: Auth) {}

  ngOnInit(): void {

    // Se consume el método user() de Auth, esto lanza una petición a Laravel para comprobar si la cookie de sesión sigue viva.
    this.auth.user().subscribe({
      next: (userData) => {

      },
      error: (err) => {

      }
    });
  }

}
