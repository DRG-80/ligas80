import { Component } from '@angular/core';
import {Config} from 'datatables.net';
import {Subject} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {Auth} from '../../services/auth';
import Swal from 'sweetalert2';
import {Footer} from '../../componentes/footer/footer';
import {Header} from '../../componentes/header/header';
import {FormsModule} from '@angular/forms';
import {DataTablesModule} from 'angular-datatables';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-equipos',
  imports: [CommonModule, DataTablesModule, FormsModule, Header, Footer],
  templateUrl: './equipos.html',
  styleUrl: './equipos.scss',
  standalone: true
})
export class Equipos {

  equipos: any[] = [];


  nuevoEquipo = {
    id_creador:null,
    nombre: '',

  };

  equipoEditado = {
    id: null,
    id_creador:null,
    nombre: ''

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

        this.cargarEquipos();
      },
      error: () => {

        this.router.navigate(['/login']);
      }
    });
  }

  cargarEquipos() {

    this.http.get<any[]>('http://localhost:8000/api/equipos', { withCredentials: true })
      .subscribe({
        next: (res) => {
          this.equipos = res;

          if (!this.dtTrigger.closed) {
            this.dtTrigger.next(null);
          }
        },
        error: (err) => console.error('Error cargando equipos:', err)
      });
  }

  cargarDatos(equipo: any) {

    this.equipoEditado = { ...equipo };
  }

  guardarEquipo() {

    if (!this.nuevoEquipo.nombre) {
      Swal.fire({
        icon: 'warning',
        title: 'Faltan datos',
        text: 'Por favor rellena el nombre',
        confirmButtonColor: '#d33'
      });
      return;
    }


    const usuario = this.auth.usuarioActual();

    if (usuario && usuario.id) {
      this.nuevoEquipo.id_creador = usuario.id;
    } else {
      Swal.fire('Error', 'No se ha podido identificar al usuario', 'error');
      return;
    }

    this.http.post('http://localhost:8000/api/equipos', this.nuevoEquipo, { withCredentials: true })
      .subscribe({
        next: (res) => {
          Swal.fire({
            icon: 'success',
            title: '¡Equipo creado!',
            text: 'El equipo se ha añadido correctamente.',
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
            text: 'No se pudo guardar el equipo.',
          });
        }
      });
  }

  actualizarEquipo() {
    this.http.put(`http://localhost:8000/api/equipos/${this.equipoEditado.id}`, this.equipoEditado, { withCredentials: true })
      .subscribe({
        next: () => Swal.fire('Editado', 'Equipo actualizado', 'success').then(() => window.location.reload()),
        error: () => Swal.fire('Error', 'No se pudo editar', 'error')
      });
  }


  eliminarEquipo(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esta acción",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`http://localhost:8000/api/equipos/${id}`, { withCredentials: true })
          .subscribe({
            next: () => {
              Swal.fire('¡Eliminado!', 'El equipo ha sido borrado.', 'success')
                .then(() => window.location.reload());
            },
            error: (e) => {
              console.error(e);
              Swal.fire('Error', 'No se pudo eliminar el equipo.', 'error');
            }
          });
      }
    });
  }

  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  }

}
