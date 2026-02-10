import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';
import {DataTablesModule} from 'angular-datatables';
import {FormsModule} from '@angular/forms';
import {Header} from '../../../componentes/header/header';
import {Footer} from '../../../componentes/footer/footer';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {Auth} from '../../../services/auth';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-jugar',
  imports: [CommonModule, DataTablesModule, FormsModule, Header, Footer, RouterLink],
  templateUrl: './jugar.html',
  styleUrl: './jugar.scss',
  standalone: true
})
export class Jugar {

  iniciada: boolean =false;
  fichajesEquipos: boolean =false;
  enfrentamientos: boolean =false;

  public idLiga: number | null = null;
  public idEquipo: number | any = null;
  public pertenencia: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    public auth: Auth
  ) {}


  ngOnInit(): void {

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
            this.cargarDatosLiga(idLiga,this.idEquipo);


          }
        },
        error: (err) => {
          console.error('❌ Error verificando permisos:', err);
          this.router.navigate(['/ligas']);
        }
      });
  }

  cargarDatosLiga(idLiga: number, idEquipo: number) {

    this.http.get<any>(`http://localhost:8000/api/ligas/obtenerDatosLiga/${idLiga}`, { withCredentials: true })
      .subscribe({
        next: (datos) => {


          this.iniciada = datos.iniciada != 0;
          this.enfrentamientos = datos.enfrentamientos != null;


          this.http.get<any>(`http://localhost:8000/api/ligasEquipo/obtenerAlineaciones/${idLiga}`, { withCredentials: true })
            .subscribe({
              next: (alineaciones: any) => {


                if (alineaciones && alineaciones.length > 0) {


                  this.fichajesEquipos = alineaciones.every((equipo: any) => equipo.alineacion !== null);
                } else {

                  this.fichajesEquipos = false;
                }

              },
              error: (error) => {
                console.error('Error cargando las alineaciones:', error);
              }
            });

          console.log('Datos de la liga recibidos correctamente');
        },
        error: (err) => {
          console.error('Error al cargar la plantilla:', err);
        }
      });
  }

  iniciarLiga() {
    // 1. Confirmación de seguridad
    Swal.fire({
      title: '¿Iniciar la Liga?',
      text: "Una vez iniciada, comenzará la competición oficial.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6', // O tu rojo #FF383C
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, ¡que empiece!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {

      if (result.isConfirmed) {

        // 2. Petición PUT al servidor
        // Enviamos { iniciada: true } en el cuerpo, aunque el backend podría ponerlo a true solo con recibir la petición.
        const payload = { iniciada: true };

        this.http.put(`http://localhost:8000/api/ligas/iniciar/${this.idLiga}`, payload, { withCredentials: true })
          .subscribe({
            next: () => {
              Swal.fire(
                '¡Liga Iniciada!',
                'La competición ha comenzado.',
                'success'
              ).then(() => {
                // 3. Recargamos para que la vista cambie (y desaparezca la pretemporada)
                window.location.reload();
              });
            },
            error: (err) => {
              console.error('Error al iniciar liga:', err);
              Swal.fire('Error', 'No se pudo iniciar la liga.', 'error');
            }
          });
      }
    });
  }

  simularFichajes() {

    if (!this.idLiga) {
      console.error('No hay ID de liga cargado');
      return;
    }


    Swal.fire({
      title: '¿Simular Mercado de Fichajes?',
      text: "Se asignarán jugadores aleatorios al resto de equipos para rellenar sus plantillas.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Simular',
      cancelButtonText: 'Cancelar'
    }).then((result) => {

      if (result.isConfirmed) {


        Swal.fire({
          title: 'Simulando...',
          text: 'Fichando jugadores para el resto de equipos',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const payload = {
          id_liga: this.idLiga
        };


        this.http.put('http://localhost:8000/api/ligasEquipo/simularFichajes', payload, { withCredentials: true })
          .subscribe({
            next: (res: any) => {

              Swal.fire({
                icon: 'success',
                title: '¡Fichajes Realizados!',
                text: 'El resto de equipos ya tienen realizados sus fichajes',
                confirmButtonColor: '#FF383C'
              });


              this.fichajesEquipos = true;
            },
            error: (err) => {
              console.error('Error en la simulación:', err);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.error?.message || 'No se pudo completar la simulación.',
              });
            }
          });
      }
    });
  }

  generarEnfrentamientos() {

    Swal.fire({
      title: '¿Generar Calendario?',
      text: "Se crearán los enfrentamientos de ida y vuelta para todos los equipos.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, generar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {

      if (result.isConfirmed) {


        Swal.fire({
          title: 'Generando cruces...',
          text: 'Por favor, espera.',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });


        this.http.put(`http://localhost:8000/api/ligas/generarCalendario/${this.idLiga}`, {}, { withCredentials: true })
          .subscribe({
            next: (res: any) => {


              Swal.fire({
                icon: 'success',
                title: '¡Calendario Listo!',
                text: 'Los enfrentamientos se han generado correctamente.',
                confirmButtonColor: '#FF383C'
              });


              this.enfrentamientos = true;
            },
            error: (err) => {
              console.error('Error generando calendario:', err);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.error?.message || 'No se pudo generar el calendario.',
              });
            }
          });
      }
    });
  }




}
