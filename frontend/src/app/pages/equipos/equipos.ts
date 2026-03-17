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
  cargando: boolean=true;


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

    // Opciones de la tabla
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

  // Comprueba de que haya un usuario iniciado
  verificarSesionYCargar() {
    this.auth.user().subscribe({
      next: (user) => {

        this.cargarEquipos();
        this.cargando = false;

      },
      error: () => {

        this.router.navigate(['/login']);
      }
    });
  }

  //Carga los equipos
  cargarEquipos() {
    this.http.get<any[]>('https://ligas80api.drg80dev.com/api/equipos', {
      withCredentials: true,
      headers: {
        'Accept': 'application/json'
      }
    })
      .subscribe({
        next: (res) => {
          this.equipos = res;


          // Notifica a DataTables que ya puede renderizar la tabla  asegurándose primero de que el usuario no haya cambiado de vista
          if (!this.dtTrigger.closed) {
            this.dtTrigger.next(null);
          }
        },
        error: (err) => console.error('Error cargando equipos:', err)
      });
  }

  //Carga los datos del equipo que se va a editar
  cargarDatos(equipo: any) {

    this.equipoEditado = { ...equipo };
  }

  guardarEquipo() {

    const nombreEquipo = this.nuevoEquipo.nombre;

    //Comprobaciones

    //Si alguno de los campos está vacío
    if (!nombreEquipo || nombreEquipo.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Faltan datos',
        text: 'Por favor, introduce un nombre para el equipo.',
        confirmButtonColor: '#d33'
      });
      return;
    }

    //Si supera los 255 caracteres
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

    //Si hay un usuario y su id, se le asigna ese id de creador al equipo
    if (usuario && usuario.id) {
      this.nuevoEquipo.id_creador = usuario.id;
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error de sesión',
        text: 'No se ha podido identificar al usuario. Por favor, inicia sesión de nuevo.',
        confirmButtonColor: '#d33'
      });
      return;
    }

    //Petición al servidor
    this.http.post('https://ligas80api.drg80dev.com/api/equipos', this.nuevoEquipo, {
      withCredentials: true,
      headers: {
        'Accept': 'application/json'
      }
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
            text: 'No se pudo guardar el equipo.',
            confirmButtonColor: '#d33'
          });
        }
      });
  }

  //Actualizar equipo
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
      headers: {
        'Accept': 'application/json'
      }
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


  //Eliminar equipo
  eliminarEquipo(id: number) {
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
  }

// se cierra la suscripción de DataTables para evitar fugas de memoria
  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  }

}
