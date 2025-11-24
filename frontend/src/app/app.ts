import { Component, signal } from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import { Header } from './componentes/header/header';
import {Hero} from './hero/hero';
import {CardsSection} from './cards-section/cards-section';
import {Footer} from './componentes/footer/footer';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet,Header,Hero,CardsSection,Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  constructor(public router: Router) {}


}
