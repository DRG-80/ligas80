import { Component, OnInit,OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { FormsModule } from '@angular/forms';
import { Header } from '../../componentes/header/header';
import { Footer } from '../../componentes/footer/footer';
import { Config } from 'datatables.net';
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import Swal from 'sweetalert2';
import { DataTableDirective } from 'angular-datatables';
@Component({
  selector: 'app-equipos-cliente',
  imports: [CommonModule, DataTablesModule, FormsModule, Header, Footer],
  templateUrl: './equipos-cliente.html',
  styleUrl: './equipos-cliente.scss',
  standalone: true
})
export class EquiposCliente implements OnInit {

  equipos: any[] = [];
  misEquipos: any[] = [];
  misEquiposEstado = false;
  public cargando: boolean = true;
  @ViewChild(DataTableDirective, {static: false})
  dtElement!: DataTableDirective;

  nuevoEquipo = {
    id_creador: null,
    nombre: '',
  };

  equipoEditado = {
    id: null,
    id_creador: null,
    nombre: ''
  };

  dtOptions: Config = {};


  dtTriggerEquiposComunidad: Subject<any> = new Subject<any>();
  dtTriggerEquiposPropios: Subject<any> = new Subject<any>();

  constructor(
    private http: HttpClient,
    private router: Router,
    public auth: Auth
  ) {}

  ngOnInit(): void {
    this.dtOptions = {
      destroy: true,
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
    this.cargando = true;

    this.http.get<any[]>('http://localhost:8000/api/equipos', { withCredentials: true })
      .subscribe({
        next: (res) => {
          this.equipos = res;
          this.cargando = false;


          setTimeout(() => {
            if (!this.dtTriggerEquiposComunidad.closed) {
              this.dtTriggerEquiposComunidad.next(null);
            }
          }, 0);
        },
        error: (err) => {
          console.error('Error cargando equipos:', err);
          this.cargando = false;
        }
      });
  }

  getMisEquipos() {
    const usuario = this.auth.usuarioActual();

    if (usuario && usuario.id) {
      this.cargando = true;

      this.http.get<any[]>(`http://localhost:8000/api/equipos/misEquipos/${usuario.id}`, { withCredentials: true })
        .subscribe({
          next: (res) => {
            this.misEquipos = res;
            this.cargando = false;


            setTimeout(() => {
              if (!this.dtTriggerEquiposPropios.closed) {
                this.dtTriggerEquiposPropios.next(null);
              }
            }, 0);
          },
          error: (err) => {
            console.error('Error cargando equipos del usuario:', err);
            this.cargando = false;
          }
        });
    } else {
      console.error('No hay usuario logueado');
      this.cargando = false;
    }
  }

  alternarVista() {

    if (this.dtElement && this.dtElement.dtInstance) {


      this.dtElement.dtInstance.then((dtInstance: any) => {



        dtInstance.destroy();


        this.ejecutarCambioVista();

      }).catch(() => {

        this.ejecutarCambioVista();
      });

    }
  }

  private ejecutarCambioVista() {
    this.misEquiposEstado = !this.misEquiposEstado;


    if (this.dtTriggerEquiposComunidad) this.dtTriggerEquiposComunidad.unsubscribe();
    if (this.dtTriggerEquiposPropios) this.dtTriggerEquiposPropios.unsubscribe();

    this.dtTriggerEquiposComunidad = new Subject<any>();
    this.dtTriggerEquiposPropios = new Subject<any>();

    this.cargando = true;


    if (this.misEquiposEstado) {
      this.getMisEquipos();
    } else {
      this.cargarEquipos();
    }
  }

  cargarDatos(equipo: any) {
    this.equipoEditado = { ...equipo };
  }

  guardarEquipo() {
    const nombreEquipo = this.nuevoEquipo.nombre;

    if (!nombreEquipo || nombreEquipo.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Faltan datos',
        text: 'Por favor, introduce un nombre para tu equipo.',
        confirmButtonColor: '#d33'
      });
      return;
    }

    if (nombreEquipo.toString().trim().length > 255) {
      Swal.fire({
        icon: 'warning',
        title: 'Texto demasiado largo',
        text: 'El nombre del equipo no puede superar los 255 caracteres.',
        confirmButtonColor: '#d33'
      });
      return;
    }

    const usuario = this.auth.usuarioActual();

    if (usuario && usuario.id) {
      this.nuevoEquipo.id_creador = usuario.id;
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se ha podido identificar al usuario. Inicia sesión de nuevo.',
        confirmButtonColor: '#d33'
      });
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
            text: 'No se pudo guardar el equipo. Inténtalo de nuevo más tarde.',
            confirmButtonColor: '#d33'
          });
        }
      });
  }

  actualizarEquipo() {
    const nombreEquipo = this.equipoEditado.nombre;

    if (!nombreEquipo || nombreEquipo.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Faltan datos',
        text: 'Por favor, introduce un nombre para el equipo.',
        confirmButtonColor: '#d33'
      });
      return;
    }

    if (nombreEquipo.toString().trim().length > 255) {
      Swal.fire({
        icon: 'warning',
        title: 'Texto demasiado largo',
        text: 'El nombre del equipo no puede superar los 255 caracteres.',
        confirmButtonColor: '#d33'
      });
      return;
    }

    this.http.put(`http://localhost:8000/api/equipos/${this.equipoEditado.id}`, this.equipoEditado, { withCredentials: true })
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: '¡Editado!',
            text: 'Equipo actualizado correctamente.',
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
            text: 'No se pudo editar el equipo.',
            confirmButtonColor: '#d33'
          });
        }
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
    if (this.dtTriggerEquiposComunidad) {
      this.dtTriggerEquiposComunidad.unsubscribe();
    }
    if (this.dtTriggerEquiposPropios) {
      this.dtTriggerEquiposPropios.unsubscribe();
    }
  }
}
