import { Routes } from '@angular/router';
import {Home} from './home/home';
import {Login} from './pages/login/login';
import {Register} from './pages/register/register';
import {Jugadores} from './pages/jugadores/jugadores';
import {Equipos} from './pages/equipos/equipos';
import {Ligas} from './pages/ligas/ligas';
import {adminGuard} from './guards/admin-guard';
import {EquiposCliente} from './pages/equipos-cliente/equipos-cliente';


export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'equiposCliente', component: EquiposCliente },



  {
    path: 'jugadores',
    component: Jugadores,
    canActivate: [adminGuard]
  },
  {
    path: 'equipos',
    component: Equipos,
    canActivate: [adminGuard]
  },
  {
    path: 'ligas',
    component: Ligas,
    canActivate: [adminGuard]
  },

  { path: '**', component: Home },
];
