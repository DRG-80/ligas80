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

  constructor(private auth: Auth) {}

  ngOnInit(): void {

    console.log('🔄 Verificando sesión con el servidor...');

    this.auth.user().subscribe({
      next: (userData) => {
        console.log('✅ ÉXITO TOTAL - USUARIO LOGUEADO:', userData);
        console.log('Nombre:', userData.name);
        console.log('Email:', userData.email);
      },
      error: (err) => {
        console.error('❌ ERROR - NO HAY SESIÓN:', err);
      }
    });
  }

}
