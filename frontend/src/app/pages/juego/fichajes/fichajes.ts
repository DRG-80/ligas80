import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';
import {DataTablesModule} from 'angular-datatables';
import {FormsModule} from '@angular/forms';
import {Header} from '../../../componentes/header/header';
import {Footer} from '../../../componentes/footer/footer';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {Config} from 'datatables.net';
import {Subject} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {Auth} from '../../../services/auth';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-fichajes',
  imports: [CommonModule, DataTablesModule, FormsModule, Header, Footer, RouterLink],
  templateUrl: './fichajes.html',
  styleUrl: './fichajes.scss',
  standalone: true
})
export class Fichajes {

  jugadores: any[] = [];


  dtOptions: Config = {};
  dtTrigger: Subject<any> = new Subject<any>();

  public idLiga: number | null = null;
  public idEquipo: number | null = null;

  public pertenencia: boolean = false;
  public presupuesto: number = 0;


  nuevoFichaje: any = {
    id_liga: null,
    id_jugador:null,
    id_equipo:null

  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
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

    const idLigaParam = this.route.snapshot.paramMap.get('idLiga');
    const idEquipoParam = this.route.snapshot.paramMap.get('idEquipo');


    if (idLigaParam && idEquipoParam) {
      this.idLiga = +idLigaParam;
      this.idEquipo= +idEquipoParam;

      this.verificarSesionYPermisos();

    } else {
      console.error('No se ha recibido ningún ID de liga o de equipo');
      this.router.navigate(['/ligas']);
    }
  }

  verificarSesionYPermisos() {

    this.auth.user().subscribe({
      next: (user) => {

        if (user && user.id) {
          this.comprobarPertenencia(this.idLiga!, user.id);
        }
      },
      error: () => {

        this.router.navigate(['/ligas']);
      }
    });
  }

  comprobarPertenencia(idLiga: number, idUsuario: number) {
    this.http.get(`http://localhost:8000/api/ligasEquipo/perteneceLigaAlUsuario/${idLiga}/${idUsuario}`, { withCredentials: true })
      .subscribe({
        next: (res) => {

          if (!res) {
            console.error('⛔ Esta liga no te pertenece o no existe');
            this.router.navigate(['/ligas']);
          } else {
            console.log('✅ Acceso permitido');
            this.pertenencia=true;
            this.cargarJugadores(idLiga);
            this.obtenerPresupuesto();

          }
        },
        error: (err) => {
          console.error('❌ Error verificando permisos:', err);
          this.router.navigate(['/ligas']);
        }
      });
  }

  cargarJugadores(idLiga: number) {

    this.http.get<any[]>(`http://localhost:8000/api/jugadoresEquipo/${idLiga}`, { withCredentials: true })
      .subscribe({
        next: (res) => {
          this.jugadores = res;

          if (!this.dtTrigger.closed) {
            this.dtTrigger.next(null);
          }
        },
        error: (err) => console.error('Error cargando ligas:', err)
      });
  }

  obtenerPresupuesto() {
    // Cambiamos <any[]> por <any> porque devuelve un solo objeto
    this.http.get<any>(`http://localhost:8000/api/ligasEquipo/obtenerPresupuesto/${this.idLiga}/${this.idEquipo}`, { withCredentials: true })
      .subscribe({
        next: (res) => {

          this.presupuesto = res.presupuesto;


        },
        error: (err) => console.error('Error al obtener presupuesto:', err)
      });
  }

  ficharJugador(idJugador: number) {

    const usuario = this.auth.usuarioActual();

    if (usuario && usuario.id) {
      this.nuevoFichaje.id_liga = this.idLiga;
      this.nuevoFichaje.id_jugador = idJugador;
      this.nuevoFichaje.id_equipo = this.idEquipo;
    } else {
      Swal.fire('Error', 'No se ha podido identificar al usuario', 'error');
      return;
    }

    // 1. Primero mostramos la advertencia
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Vas a fichar a este jugador y se descontará de tu presupuesto.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, fichar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {

      // 2. Solo si el usuario confirma, hacemos la petición
      if (result.isConfirmed) {

        this.http.post('http://localhost:8000/api/jugadoresEquipo', this.nuevoFichaje, { withCredentials: true })
          .subscribe({
            next: (res) => {
              Swal.fire({
                icon: 'success',
                title: '¡Fichaje Realizado!',
                text: 'El fichaje se ha realizado correctamente.',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Continuar'
              }).then((finalResult) => {
                if (finalResult.isConfirmed) {
                  window.location.reload();
                }
              });
            },
            error: (err) => {
              console.error('Error al fichar:', err);
              // Capturamos el mensaje de error del backend (ej: "No tienes suficiente presupuesto")
              const mensaje = err.error?.message || 'No se pudo fichar al jugador.';

              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: mensaje,
              });
            }
          });
      }
    });
  }

  protected readonly console = console;
}
