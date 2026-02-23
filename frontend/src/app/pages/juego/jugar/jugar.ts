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
  public jornada: number = 0;
  public encuentros: any[] =[];
  public resultados: any[] = [];
  public equipos: any[] = [];
  public vs: number = 0;
  public jornadaJugada: boolean = false;


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

          if (this.iniciada){
            this.equipos=datos.equipos;
            this.jornada = datos.jornada || 0;

            if (this.jornada==39){

              this.router.navigate([`/clasificacion/${idLiga}`]);
            }

            let resultados= datos.resultados;

            if (typeof resultados === 'string') {
              try {
                resultados = JSON.parse(resultados);
              } catch (e) {
                resultados = null;
              }
            }

            if (resultados && resultados[this.jornada]){
              //console.log('Jornada Datos ' + datos.resultados[this.jornada])
              this.mostrarResultados();
            }else {
              this.cargarEncuentros(datos.enfrentamientos);
            }


          }


          if (this.jornada !== null) {
            this.vs = this.jornada - 1;
          }

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


        const payload = { iniciada: true };

        this.http.put(`http://localhost:8000/api/ligas/iniciar/${this.idLiga}`, payload, { withCredentials: true })
          .subscribe({
            next: () => {
              Swal.fire(
                '¡Liga Iniciada!',
                'La competición ha comenzado.',
                'success'
              ).then(() => {

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

  cargarEncuentros(enfrentamientos: any) {
    this.encuentros = [];


    if (!enfrentamientos) return;


    let datosProcesados = enfrentamientos;

    if (typeof datosProcesados === 'string') {
      try {
        datosProcesados = JSON.parse(datosProcesados);
      } catch (e) {
        console.error('Error al parsear el JSON de enfrentamientos:', e);
        return;
      }
    }


    Object.keys(datosProcesados).forEach(jornada => {

      const numeroJornada = parseInt(jornada);
      let partidosStrings = datosProcesados[jornada];


      if (typeof partidosStrings === 'string') {
        try { partidosStrings = JSON.parse(partidosStrings); } catch(e) {}
      }


      if (!Array.isArray(partidosStrings)) return;

      const partidosDeLaJornada: any[] = [];

      partidosStrings.forEach((cruce: string) => {

        const ids = cruce.split('-');
        const idLocal = +ids[0];
        const idVisitante = +ids[1];

        // Buscamos los nombres de los equipos con find
        const equipoLocal = this.equipos?.find(e => e.id === idLocal);
        const equipoVisitante = this.equipos?.find(e => e.id === idVisitante);


        partidosDeLaJornada.push({
          idLocal: idLocal,
          idVisitante: idVisitante,
          local: equipoLocal ? equipoLocal.nombre : `Equipo ${idLocal}`,
          visitante: equipoVisitante ? equipoVisitante.nombre : `Equipo ${idVisitante}`,

        });
      });

      this.encuentros.push({
        jornada: numeroJornada,
        partidos: partidosDeLaJornada
      });
    });


    this.encuentros.sort((a, b) => a.jornada - b.jornada);

    console.log('Calendario cargado:', this.encuentros);
  }

  simularJornada() {

    if (!this.idLiga) {
      console.error('No hay liga seleccionada');
      return;
    }


    Swal.fire({
      title: `¿Simular Jornada ${this.jornada}?`,
      text: "Se calcularán los resultados y se actualizará la clasificación.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, jugar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {

      if (result.isConfirmed) {


        Swal.fire({
          title: 'Jugando partidos...',
          text: 'Calculando resultados...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });


        this.http.put(`http://localhost:8000/api/ligas/simularJornada/${this.idLiga}`, {}, { withCredentials: true })
          .subscribe({
            next: (res: any) => {

              // 4. Éxito
              Swal.fire({
                icon: 'success',
                title: '¡Jornada Finalizada!',
                text: 'Los resultados se han guardado correctamente.',
                confirmButtonColor: '#FF383C'
              }).then(() => {

                this.mostrarResultados();
                //window.location.reload();

              });

            },
            error: (err) => {
              console.error('Error al simular:', err);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.error?.message || 'Hubo un problema al simular la jornada.',
              });
            }
          });
      }
    });
  }

  mostrarResultados() {


    if (!this.idLiga) {
      console.error('No hay ID de liga definido');
      return;
    }


    this.http.get<any>(`http://localhost:8000/api/ligas/obtenerResultados/${this.idLiga}`, { withCredentials: true })
      .subscribe({
        next: (res) => {
          console.log(res)
          this.jornadaJugada=true;

          this.resultados = [];

          if (!res) return;

          let datosProcesados = res;


          if (typeof datosProcesados === 'string') {
            try {
              datosProcesados = JSON.parse(datosProcesados);
            } catch (e) {
              console.error('Error al parsear el JSON de resultados:', e);
              return;
            }
          }


          Object.keys(datosProcesados).forEach(partidoKey => {


            let objetoPartido = partidoKey;


            if (typeof objetoPartido === 'string') {
              try { objetoPartido = JSON.parse(objetoPartido); } catch(e) {}
            }

            if (!objetoPartido) return;

            const ids = objetoPartido.split('-');
            const idLocal = +ids[0];
            const idVisitante = +ids[1];
            const partidosDeLaJornada: any[] = [];

            const resultado = datosProcesados[objetoPartido];

            const goles = resultado.split('-');
            const golesLocal = +goles[0];
            const golesVisitante = +goles[1];

            //Buscar Nombres
            const equipoLocal = this.equipos?.find(e => e.id === idLocal);
            const equipoVisitante = this.equipos?.find(e => e.id === idVisitante);




            partidosDeLaJornada.push({
              idLocal: idLocal,
              idVisitante: idVisitante,
              local: equipoLocal ? equipoLocal : `Equipo ${idLocal}`,
              visitante: equipoVisitante ? equipoVisitante : `Equipo ${idVisitante}`,
              golesLocal: golesLocal,
              golesVisitante: golesVisitante

            });


            this.resultados.push({
              partido: partidosDeLaJornada
            });
          });


          this.resultados.sort((a, b) => a.jornada - b.jornada);

          console.log('Resultados cargados:', this.resultados);
        },
        error: (err) => {
          console.error('Error al obtener los resultados:', err);
        }
      });
  }

  terminarJornada() {

    if (!this.idLiga) return;


    Swal.fire({
      title: '¿Finalizar Jornada?',
      text: "Se cerrará el acta de esta jornada y pasaremos a la siguiente.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, siguiente jornada',
      cancelButtonText: 'Esperar'
    }).then((result) => {

      if (result.isConfirmed) {


        this.http.put(`http://localhost:8000/api/ligas/terminarJornada/${this.idLiga}`, {}, { withCredentials: true })
          .subscribe({
            next: (res: any) => {

              Swal.fire({
                icon: 'success',
                title: '¡Jornada Finalizada!',
                text: 'Avanzando a la siguiente fecha del calendario...',
                timer: 1500,
                showConfirmButton: false
              }).then(() => {

                window.location.reload();
              });

            },
            error: (err) => {
              console.error('Error al terminar la jornada:', err);
              Swal.fire('Error', 'No se pudo avanzar de jornada.', 'error');
            }
          });
      }
    });
  }




}
