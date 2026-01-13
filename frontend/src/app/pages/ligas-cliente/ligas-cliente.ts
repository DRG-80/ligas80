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
  equiposDisponibles: any[] = [];
  equiposSeleccionados: any[] = [];


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
      },
      error: () => {

        this.router.navigate(['/login']);
      }
    });
  }

  cargarLigas() {

    const usuario = this.auth.usuarioActual();


    this.http.get<any[]>(`http://localhost:8000/api/ligas/misLigas/${usuario.id}`, { withCredentials: true })
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

    if (!this.nuevaLiga.nombre) {
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
      this.nuevaLiga.id_creador = usuario.id;
    } else {
      Swal.fire('Error', 'No se ha podido identificar al usuario', 'error');
      return;
    }

    this.http.post('http://localhost:8000/api/ligas', this.nuevaLiga, { withCredentials: true })
      .subscribe({
        next: (res) => {
          Swal.fire({
            icon: 'success',
            title: '¡Liga creada!',
            text: 'La liga se ha añadido correctamente.',
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
            text: 'No se pudo guardar la liga.',
          });
        }
      });
  }

  actualizarLiga() {
    this.http.put(`http://localhost:8000/api/ligas/${this.ligaEditada.id}`, this.ligaEditada, { withCredentials: true })
      .subscribe({
        next: () => Swal.fire('Editado', 'Liga actualizada', 'success').then(() => window.location.reload()),
        error: () => Swal.fire('Error', 'No se pudo editar', 'error')
      });
  }

  eliminarLiga(id: number) {
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
        this.http.delete(`http://localhost:8000/api/ligas/${id}`, { withCredentials: true })
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
    this.equiposSeleccionados = [];

    const usuario = this.auth.usuarioActual();

    if (usuario) {

      this.http.get<any[]>(`http://localhost:8000/api/equipos`, { withCredentials: true })
        .subscribe({
          next: (equiposTotal) => {

            this.http.get<any[]>(`http://localhost:8000/api/ligasEquipo/${liga.id}`, { withCredentials: true })
              .subscribe({
                next: (equiposInscritos) => {


                  this.equiposDisponibles = equiposTotal.filter(miEquipo => {


                    const yaEstaInscrito = equiposInscritos.some((inscrito: any) =>
                      inscrito.id_equipo === miEquipo.id || inscrito.id === miEquipo.id
                    );

                    return !yaEstaInscrito;
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
    if (this.equiposSeleccionados.length === 0) {
      Swal.fire('Atención', 'Debes seleccionar al menos un equipo', 'warning');
      return;
    }

    const payload = {
      id_liga: this.ligaSeleccionada.id,
      equipos_ids: this.equiposSeleccionados
    };

    this.http.post('http://localhost:8000/api/ligasEquipo', payload, { withCredentials: true })
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
