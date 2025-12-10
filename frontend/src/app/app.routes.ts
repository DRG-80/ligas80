import { Routes } from '@angular/router';
import {Home} from './home/home';
import {Login} from './pages/login/login';
import {Register} from './pages/register/register';
import {Jugadores} from './pages/jugadores/jugadores';


export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'jugadores', component: Jugadores },
  { path: '**', component: Home },

];
