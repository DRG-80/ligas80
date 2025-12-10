import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';

import { DataTablesModule } from 'angular-datatables';
import { Config } from 'datatables.net';

import { Header } from '../../componentes/header/header';
import { Footer } from '../../componentes/footer/footer';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-jugadores',
  standalone: true,
  imports: [CommonModule, DataTablesModule, FormsModule, Header, Footer],
  templateUrl: './jugadores.html',
  styleUrl: './jugadores.scss'
})
export class Jugadores implements OnInit, OnDestroy {

  jugadores: any[] = [];


  nuevoJugador = {
    nombre: '',
    apellidos: '',
    posicion: 'POR',
    media: 50,
    precio: 0
  };

  dtOptions: Config = {};
  dtTrigger: Subject<any> = new Subject<any>();

  constructor(
    private http: HttpClient,
    private router: Router,
    public auth: Auth
  ) {}

  ngOnInit(): void {
    // 1. Configuración de la tabla
    this.dtOptions = {
      paging: true,
      searching: true,
      ordering: true,
      info: true,
      lengthChange: true,
      pagingType: 'full_numbers',
      pageLength: 10,
      language: {
        search: "Buscar:",
        lengthMenu: "Mostrar _MENU_ registros",
        info: "Mostrando de _START_ a _END_ de _TOTAL_ registros",
        infoEmpty: "Mostrando 0 a 0 de 0 registros",
        infoFiltered: "(filtrado de _MAX_ registros totales)",
        zeroRecords: "No se encontraron resultados",
        emptyTable: "Ningún dato disponible en esta tabla",
        paginate: { first: "Primero", last: "Último", next: "Siguiente", previous: "Anterior" }
      }
    };


    this.verificarSesionYCargar();
  }

  verificarSesionYCargar() {
    this.auth.user().subscribe({
      next: (user) => {

        if (this.auth.tieneIdNegativo()) {
          this.cargarJugadores();
        } else {
          // Está logueado pero no tiene permisos (ID Positivo) -> Al Home
          this.router.navigate(['/']);
        }
      },
      error: () => {
        // B. Si da error 401, no hay sesión -> Al Login
        this.router.navigate(['/login']);
      }
    });
  }

  cargarJugadores() {

    this.http.get<any[]>('http://localhost:8000/api/jugadores', { withCredentials: true })
      .subscribe({
        next: (res) => {
          this.jugadores = res;

          this.dtTrigger.next(null);
        },
        error: (err) => console.error('Error cargando jugadores:', err)
      });
  }

  guardarJugador() {
    if (!this.nuevoJugador.nombre || !this.nuevoJugador.apellidos) {
      alert('Por favor rellena nombre y apellidos');
      return;
    }

    this.http.post('http://localhost:8000/api/jugadores', this.nuevoJugador, { withCredentials: true })
      .subscribe({
        next: (res) => {
          alert('Jugador creado correctamente');
          window.location.reload();
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          alert('Error al guardar el jugador');
        }
      });
  }

  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  }
}
