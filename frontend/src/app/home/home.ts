import { Component } from '@angular/core';
import {Hero} from '../hero/hero';
import {CardsSection} from '../cards-section/cards-section';
import {EmpezarSection} from '../empezar-section/empezar-section';

@Component({
  selector: 'app-home',
  imports: [Hero,CardsSection,EmpezarSection],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

}
