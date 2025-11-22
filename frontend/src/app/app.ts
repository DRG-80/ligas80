import { Component, signal } from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import { Header } from './componentes/header/header';
import {Hero} from './hero/hero';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet,Header,Hero],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  constructor(public router: Router) {}


}
