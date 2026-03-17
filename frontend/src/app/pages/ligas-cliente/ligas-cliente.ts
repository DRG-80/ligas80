import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';
import {DataTablesModule} from 'angular-datatables';
import {FormsModule} from '@angular/forms';
import {Header} from '../../componentes/header/header';
import {Footer} from '../../componentes/footer/footer';
import {Config} from 'datatables.net';
import {Subject} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {Router, RouterLink} from '@angular/router';
import {Auth} from '../../services/auth';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-ligas-cliente',
  imports: [CommonModule, DataTablesModule, FormsModule, Header, Footer, RouterLink],
  templateUrl: './ligas-cliente.html',
  styleUrl: './ligas-cliente.scss',
  standalone: true
})
export class LigasCliente {
  ligas: any[] = [];
  ligaSeleccionada: any = null;
  equiposDisponibles: any[] = []; //Todos los equipos
  equiposSeleccionados: any[] = []; // Variable para todos los equipos seleccionados
  cargando: boolean=true;



  nuevaLiga = {
    id_creador:null,
    nombre: '',

  };

  ligaEditada = {
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

        this.cargarLigas();
        this.cargando = false;

      },
      error: () => {

        this.router.navigate(['/login']);
      }
    });
  }


  cargarLigas() {
    const usuario = this.auth.usuarioActual();
    this.http.get<any[]>(`https://ligas80api.drg80dev.com/api/ligas/misLigas/${usuario.id}`, {
      withCredentials: true,
      headers: { 'Accept': 'application/json' }
    })
      .subscribe({
        next: (res) => {
          this.ligas = res;
          if (!this.dtTrigger.closed) {
            this.dtTrigger.next(null);
          }
        },
        error: (err) => console.error('Error cargando ligas:', err)
      });
  }

  cargarDatos(liga: any) {

    this.ligaEditada = { ...liga };
  }

  guardarLiga() {
    const nombreLiga = this.nuevaLiga.nombre;

    //Comprobaciones

    if (!nombreLiga || typeof nombreLiga !== 'string' || nombreLiga.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Faltan datos',
        text: 'Por favor, introduce un nombre válido para la liga.',
        confirmButtonColor: '#d33'
      });
      return;
    }
    if (nombreLiga.trim().length > 255) {
      Swal.fire({
        icon: 'warning',
        title: 'Texto demasiado largo',
        text: 'El nombre de la liga no puede superar los 255 caracteres.',
        confirmButtonColor: '#d33'
      });
      return;
    }
    const usuario = this.auth.usuarioActual();
    if (usuario && usuario.id) {
      this.nuevaLiga.id_creador = usuario.id;
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error de sesión',
        text: 'No se ha podido identificar al usuario. Inicia sesión de nuevo.',
        confirmButtonColor: '#d33'
      });
      return;
    }
    this.http.post('https://ligas80api.drg80dev.com/api/ligas', this.nuevaLiga, {
      withCredentials: true,
      headers: { 'Accept': 'application/json' }
    })
      .subscribe({
        next: (res) => {
          Swal.fire({
            icon: 'success',
            title: '¡Liga creada!',
            text: 'La liga se ha añadido correctamente.',
            confirmButtonColor: '#FF383C',
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
            text: 'No se pudo guardar la liga.',
            confirmButtonColor: '#d33'
          });
        }
      });
  }

  actualizarLiga() {
    const nombreLiga = this.ligaEditada.nombre;
    if (!nombreLiga || typeof nombreLiga !== 'string' || nombreLiga.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Faltan datos',
        text: 'Por favor, introduce un nombre válido para la liga.',
        confirmButtonColor: '#d33'
      });
      return;
    }
    if (nombreLiga.trim().length > 255) {
      Swal.fire({
        icon: 'warning',
        title: 'Texto demasiado largo',
        text: 'El nombre de la liga no puede superar los 255 caracteres.',
        confirmButtonColor: '#d33'
      });
      return;
    }
    this.http.put(`https://ligas80api.drg80dev.com/api/ligas/${this.ligaEditada.id}`, this.ligaEditada, {
      withCredentials: true,
      headers: { 'Accept': 'application/json' }
    })
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: '¡Editado!',
            text: 'Liga actualizada correctamente.',
            confirmButtonColor: '#FF383C'
          }).then(() => {
            window.location.reload();
          });
        },
        error: (err) => {
          console.error('Error al editar:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo editar la liga.',
            confirmButtonColor: '#d33'
          });
        }
      });
  }

  eliminarLiga(id: number) {
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
        this.http.delete(`https://ligas80api.drg80dev.com/api/ligas/${id}`, {
          withCredentials: true,
          headers: { 'Accept': 'application/json' }
        })
          .subscribe({
            next: () => {
              Swal.fire('¡Eliminado!', 'La liga ha sido borrada.', 'success')
                .then(() => window.location.reload());
            },
            error: (e) => {
              console.error(e);
              Swal.fire('Error', 'No se pudo eliminar la liga.', 'error');
            }
          });
      }
    });
  }

  abrirModalEquipos(liga: any) {

    this.ligaSeleccionada = liga;
    this.equiposSeleccionados = []; // Vaciamos el array de selecciones previas

    const usuario = this.auth.usuarioActual();

    if (usuario) {
      //Obtenemos el "Conjunto Total" de equipos disponibles
      this.http.get<any[]>(`https://ligas80api.drg80dev.com/api/equipos`, {
        withCredentials: true, // Crucial para la sesión de Laravel Sanctum
        headers: { 'Accept': 'application/json' }
      })
        .subscribe({
          next: (equiposTotal) => {

            //Obtenemos el "Conjunto de Inscritos" en esta liga
            this.http.get<any[]>(`https://ligas80api.drg80dev.com/api/ligasEquipo/${liga.id}`, {
              withCredentials: true,
              headers: { 'Accept': 'application/json' }
            })
              .subscribe({
                next: (equiposInscritos) => {


                  // Recorremos todos los equipos. Solo nos quedamos con aquellos que NO (!yaEstaInscrito)
                  // coincidan con ninguna ID del array de equipos que ya están participando.
                  this.equiposDisponibles = equiposTotal.filter(miEquipo => {
                    const yaEstaInscrito = equiposInscritos.some((inscrito: any) =>
                      inscrito.id_equipo === miEquipo.id || inscrito.id === miEquipo.id
                    );
                    return !yaEstaInscrito; // Si devuelve true, el equipo sobrevive al filtro y se muestra en el modal
                  });
                },
                error: (err) => console.error('Error al comprobar equipos de la liga', err)
              });
          },
          error: (err) => Swal.fire('Error', 'No se pudieron cargar tus equipos', 'error')
        });
    }
  }

  guardarEquiposEnLiga() {


    // Comprueba que se haya seleccionado un equipo
    if (this.equiposSeleccionados.length === 0) {
      Swal.fire('Atención', 'Debes seleccionar al menos un equipo', 'warning');
      return;
    }


    // Agrupamos la información para que Laravel haga una inserción múltiple en base de datos
    const payload = {
      id_liga: this.ligaSeleccionada.id,
      equipos_ids: this.equiposSeleccionados
    };


    this.http.post('https://ligas80api.drg80dev.com/api/ligasEquipo', payload, {
      withCredentials: true,
      headers: { 'Accept': 'application/json' }
    })
      .subscribe({
        next: () => {

          Swal.fire('Éxito', 'Equipos inscritos correctamente', 'success')
            .then(() => window.location.reload());
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'Hubo un problema al inscribir los equipos', 'error');
        }
      });
  }

  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  }
}
