import { Routes } from '@angular/router';
import {Home} from './home/home';
import {Login} from './pages/login/login';
import {Register} from './pages/register/register';
import {Jugadores} from './pages/jugadores/jugadores';
import {Equipos} from './pages/equipos/equipos';
import {Ligas} from './pages/ligas/ligas';
import {adminGuard} from './guards/admin-guard';
import {EquiposCliente} from './pages/equipos-cliente/equipos-cliente';
import {LigasCliente} from './pages/ligas-cliente/ligas-cliente';
import {LigasJuego} from './pages/ligas-juego/ligas-juego';
import {Fichajes} from './pages/juego/fichajes/fichajes';
import {Plantilla} from './pages/juego/plantilla/plantilla';
import {Jugar} from './pages/juego/jugar/jugar';
import {Clasificacion} from './pages/juego/clasificacion/clasificacion';


export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'equiposCliente', component: EquiposCliente },
  { path: 'ligasCliente', component: LigasCliente },
  { path: 'ligasJuego/:id', component: LigasJuego },
  { path: 'fichajes/:idLiga/:idEquipo', component: Fichajes },
  { path: 'plantilla/:idLiga/:idEquipo', component: Plantilla },
  { path: 'jugar/:idLiga/:idEquipo', component: Jugar },
  { path: 'clasificacion/:idLiga', component: Clasificacion },






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
