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
  constructor(public router: Router) {}

  private auth = inject(Auth);

  ngOnInit() {

    this.auth.user().subscribe({
      next: (user) => console.log('✅ Sesión recuperada:', user.name),
      error: () => console.log('ℹ️ Usuario no logueado')
    });
  }
}
