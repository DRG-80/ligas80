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
  misEquiposEstado = false; //Variable para controlar la vista que se muestra
  public cargando: boolean = true;

// Se captura la instancia del DataTable del HTML para poder reiniciarla/destruirla
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

    this.http.get<any[]>('https://ligas80api.drg80dev.com/api/equipos', {
      withCredentials: true,
      headers: { 'Accept': 'application/json' }
    })
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

  //Obtener los equipos del usuario
  getMisEquipos() {
    const usuario = this.auth.usuarioActual();

    if (usuario && usuario.id) {
      this.cargando = true;

      this.http.get<any[]>(`https://ligas80api.drg80dev.com/api/equipos/misEquipos/${usuario.id}`, {
        withCredentials: true,
        headers: { 'Accept': 'application/json' }
      })
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

  // Alternar vista
  alternarVista() {

    // Se verifica si la directiva de la tabla está cargada y tiene una instancia activa de jQuery
    if (this.dtElement && this.dtElement.dtInstance) {

      // Se extrae la instancia mediante una promesa
      this.dtElement.dtInstance.then((dtInstance: any) => {

        // Se destruye la capa visual interactiva (paginación, buscador) devolviendo la tabla a HTML básico
        dtInstance.destroy();

        // Una vez destruida de forma segura, se dispara la lógica de cambio de variables
        this.ejecutarCambioVista();

      }).catch(() => {

        this.ejecutarCambioVista();
      });

    } else {
      // Si no había ninguna tabla renderizada aún, se cambia la vista directamente
      this.ejecutarCambioVista();
    }
  }

  private ejecutarCambioVista() {

    // Alterna el estado (true/false). Esto disparará automáticamente los *ngIf del HTML
    this.misEquiposEstado = !this.misEquiposEstado;

    // Se desconecta los canales antiguos para evitar fugas de memoria
    if (this.dtTriggerEquiposComunidad) this.dtTriggerEquiposComunidad.unsubscribe();
    if (this.dtTriggerEquiposPropios) this.dtTriggerEquiposPropios.unsubscribe();

    // Se crean canales nuevos
    this.dtTriggerEquiposComunidad = new Subject<any>();
    this.dtTriggerEquiposPropios = new Subject<any>();

    this.cargando = true;

    // Lógica de enrutamiento interno a la API
    if (this.misEquiposEstado) {
      this.getMisEquipos(); // Petición a Laravel: Trae solo los míos
    } else {
      this.cargarEquipos(); // Petición a Laravel: Trae todos
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

    this.http.post('https://ligas80api.drg80dev.com/api/equipos', this.nuevoEquipo, {
      withCredentials: true,
      headers: { 'Accept': 'application/json' }
    })
      .subscribe({
        next: (res) => {
          Swal.fire({
            icon: 'success',
            title: '¡Equipo creado!',
            text: 'El equipo se ha añadido correctamente.',
            confirmButtonColor: '#d33',
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

    this.http.put(`https://ligas80api.drg80dev.com/api/equipos/${this.equipoEditado.id}`, this.equipoEditado, {
      withCredentials: true,
      headers: { 'Accept': 'application/json' }
    })
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: '¡Editado!',
            text: 'Equipo actualizado correctamente.',
            confirmButtonColor: '#d33'
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

  /*eliminarEquipo(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esta acción",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#000',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {

        this.http.delete(`https://ligas80api.drg80dev.com/api/equipos/${id}`, {
          withCredentials: true,
          headers: {
            'Accept': 'application/json'
          }
        })
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
  }*/

  //Cerrar la suscripción para ambas DataTable
  ngOnDestroy(): void {
    if (this.dtTriggerEquiposComunidad) {
      this.dtTriggerEquiposComunidad.unsubscribe();
    }
    if (this.dtTriggerEquiposPropios) {
      this.dtTriggerEquiposPropios.unsubscribe();
    }
  }
}
