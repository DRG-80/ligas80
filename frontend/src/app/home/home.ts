import { Component } from '@angular/core';
import {Hero} from '../hero/hero';
import {CardsSection} from '../cards-section/cards-section';
import {EmpezarSection} from '../empezar-section/empezar-section';
import {Header} from '../componentes/header/header';
import {Footer} from '../componentes/footer/footer';

@Component({
  selector: 'app-home',
  imports: [Hero,CardsSection,EmpezarSection,Header,Footer],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

}
