import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';
import {Header} from '../../componentes/header/header';
import {Footer} from '../../componentes/footer/footer';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-manual',
  imports: [CommonModule, Header, Footer, RouterLink],
  templateUrl: './manual.html',
  styleUrl: './manual.scss',
  standalone: true
})
export class Manual {

}
