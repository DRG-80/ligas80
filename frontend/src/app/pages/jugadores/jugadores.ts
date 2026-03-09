import { Component, OnInit, OnDestroy,ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { DataTablesModule,DataTableDirective} from 'angular-datatables';
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
  cargando: boolean=true;


  nuevoJugador = {
    nombre: '',
    apellidos: '',
    posicion: 'POR',
    media: 50,
    precio: 0
  };

  jugadorEditado: any = {
    id: null,
    nombre: '',
    apellidos: '',
    posicion: '',
    media: 0,
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
          this.cargando = false;
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

  obtenerClasePosicion(posicion: string): string {
    switch (posicion) {
      case 'POR':
        return 'bg-warning text-dark';
      case 'DEF':
        return 'bg-info text-dark';
      case 'MC':
        return 'bg-success';
      case 'DEL':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  cargarJugadores() {

    this.http.get<any[]>('http://localhost:8000/api/jugadores', { withCredentials: true })
      .subscribe({
        next: (res) => {
          this.jugadores = res;

          if (!this.dtTrigger.closed) {
            this.dtTrigger.next(null);
          }
        },
        error: (err) => console.error('Error cargando jugadores:', err)
      });
  }
  cargarDatos(jugador: any) {

    this.jugadorEditado = { ...jugador };
  }

  guardarJugador() {
    const { nombre, apellidos, posicion, media, precio } = this.nuevoJugador;


    if (!nombre || !apellidos || !posicion || media === null || media === undefined || precio === null || precio === undefined) {
      Swal.fire({
        icon: 'warning',
        title: 'Faltan datos',
        text: 'Por favor, rellena todos los campos del formulario.',
        confirmButtonColor: '#d33'
      });
      return;
    }


    if (nombre.toString().trim().length > 255 || apellidos.toString().trim().length > 255) {
      Swal.fire({
        icon: 'warning',
        title: 'Texto demasiado largo',
        text: 'El nombre y los apellidos no pueden superar los 255 caracteres.',
        confirmButtonColor: '#d33'
      });
      return;
    }

    if (isNaN(Number(media)) || isNaN(Number(precio))) {
      Swal.fire({
        icon: 'warning',
        title: 'Formato incorrecto',
        text: 'La media y el precio deben ser valores numéricos.',
        confirmButtonColor: '#d33'
      });
      return;
    }


    if (media < 0 || media > 99) {
      Swal.fire({
        icon: 'warning',
        title: 'Media inválida',
        text: 'La media del jugador debe estar entre 0 y 99.',
        confirmButtonColor: '#d33'
      });
      return;
    }


    if (precio < 0 || precio > 300000000) {
      Swal.fire({
        icon: 'warning',
        title: 'Precio inválido',
        text: 'El precio no puede ser negativo ni superior a 300.000.000 €.',
        confirmButtonColor: '#d33'
      });
      return;
    }


    this.http.post('http://localhost:8000/api/jugadores', this.nuevoJugador, { withCredentials: true })
      .subscribe({
        next: (res) => {
          Swal.fire({
            icon: 'success',
            title: '¡Jugador creado!',
            text: 'El jugador se ha añadido correctamente.',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Continuar'
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.reload();
            }
          });
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo guardar el jugador.',
            confirmButtonColor: '#d33'
          });
        }
      });
  }

  actualizarJugador() {

    const { nombre, apellidos, posicion, media, precio } = this.jugadorEditado;

    if (!nombre || !apellidos || !posicion || media === null || media === undefined || precio === null || precio === undefined) {
      Swal.fire({
        icon: 'warning',
        title: 'Faltan datos',
        text: 'Por favor, rellena todos los campos del formulario.',
        confirmButtonColor: '#d33'
      });
      return;
    }

    if (nombre.toString().trim().length > 255 || apellidos.toString().trim().length > 255) {
      Swal.fire({
        icon: 'warning',
        title: 'Texto demasiado largo',
        text: 'El nombre y los apellidos no pueden superar los 255 caracteres.',
        confirmButtonColor: '#d33'
      });
      return;
    }

    if (isNaN(Number(media)) || isNaN(Number(precio))) {
      Swal.fire({
        icon: 'warning',
        title: 'Formato incorrecto',
        text: 'La media y el precio deben ser valores numéricos.',
        confirmButtonColor: '#d33'
      });
      return;
    }

    if (media < 0 || media > 99) {
      Swal.fire({
        icon: 'warning',
        title: 'Media inválida',
        text: 'La media del jugador debe estar entre 0 y 99.',
        confirmButtonColor: '#d33'
      });
      return;
    }

    if (precio < 0 || precio > 300000000) {
      Swal.fire({
        icon: 'warning',
        title: 'Precio inválido',
        text: 'El precio no puede ser negativo ni superior a 300.000.000 €.',
        confirmButtonColor: '#d33'
      });
      return;
    }


    this.http.put(`http://localhost:8000/api/jugadores/${this.jugadorEditado.id}`, this.jugadorEditado, { withCredentials: true })
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: '¡Editado!',
            text: 'Jugador actualizado correctamente.',
            confirmButtonColor: '#3085d6'
          }).then(() => {
            window.location.reload();
          });
        },
        error: (err) => {
          console.error('Error al editar:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo editar el jugador.',
            confirmButtonColor: '#d33'
          });
        }
      });
  }

  eliminarJugador(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esta acción",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#000000',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`http://localhost:8000/api/jugadores/${id}`, { withCredentials: true })
          .subscribe({
            next: () => {
              Swal.fire('¡Eliminado!', 'El jugador ha sido borrado.', 'success')
                .then(() => window.location.reload());
            },
            error: (e) => {
              console.error(e);
              Swal.fire('Error', 'No se pudo eliminar el jugador.', 'error');
            }
          });
      }
    });
  }

  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  }
}
