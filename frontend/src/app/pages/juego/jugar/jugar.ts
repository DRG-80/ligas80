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

  iniciada: boolean =false; //Necesario para saber que vista enseñar
  fichajesEquipos: boolean =false; // Variable para saber si se han echo los fichajes
  enfrentamientos: boolean =false; // Variable para saber si se han generado los encuentros

  public cargando: boolean = true;


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
    this.http.get(`https://ligas80api.drg80dev.com/api/ligasEquipo/perteneceLigaAlUsuario/${idLiga}/${idUsuario}`, {
      withCredentials: true,
      headers: { 'Accept': 'application/json' }
    })
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

  // Función para cargar los datos de la liga
  cargarDatosLiga(idLiga: number, idEquipo: number) {
    this.http.get<any>(`https://ligas80api.drg80dev.com/api/ligas/obtenerDatosLiga/${idLiga}`, {
      withCredentials: true,
      headers: { 'Accept': 'application/json' }
    })
      .subscribe({
        next: (datos) => {
          this.iniciada = datos.iniciada != 0;
          this.enfrentamientos = datos.enfrentamientos !== null ? datos.enfrentamientos : false;
          // Si la liga está iniciada
          if (this.iniciada){
            this.equipos=datos.equipos;
            this.jornada = datos.jornada || 0;

            // Si está terminada
            if (this.jornada==39){
              this.router.navigate([`/clasificacion/${idLiga}`]);
            }

            let resultados= datos.resultados;

            // Parsea los datos
            if (typeof resultados === 'string') {
              try {
                resultados = JSON.parse(resultados);
              } catch (e) {
                resultados = null;
              }
            }

            // Si se ha jugado la jornada, pero no se ha avanzado a la siguiente
            if (resultados && resultados[this.jornada]){
              this.mostrarResultados();

            }else {
              // Carga los encuentros
              this.cargarEncuentros(datos.enfrentamientos);
            }
          }

          if (this.jornada !== null) {
            this.vs = this.jornada - 1;
          }

          //Obtener las alineaciones, necesario para saber que todos los equipos tienen jugadores
          this.http.get<any>(`https://ligas80api.drg80dev.com/api/ligasEquipo/obtenerAlineaciones/${idLiga}`, {
            withCredentials: true,
            headers: { 'Accept': 'application/json' }
          })
            .subscribe({
              next: (alineaciones: any) => {
                if (alineaciones && alineaciones.length > 0) {
                  this.fichajesEquipos = alineaciones.every((equipo: any) => equipo.alineacion !== null);
                } else {
                  this.fichajesEquipos = false;
                }
                setTimeout(() => {
                  this.cargando = false;
                }, 800);
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

  // Función para iniciar la liga
  iniciarLiga() {
    Swal.fire({
      title: '¿Iniciar la Liga?',
      text: "Una vez iniciada, comenzará la competición oficial.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#FF383C',
      cancelButtonColor: '#000',
      confirmButtonText: 'Sí, ¡que empiece!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const payload = { iniciada: true };
        this.http.put(`https://ligas80api.drg80dev.com/api/ligas/iniciar/${this.idLiga}`, payload, {
          withCredentials: true,
          headers: { 'Accept': 'application/json' }
        })
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

  // Función para simular los fichajes
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
      confirmButtonColor: '#FF383C',
      cancelButtonColor: '#000',
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

        this.http.put('https://ligas80api.drg80dev.com/api/ligasEquipo/simularFichajes', payload, {
          withCredentials: true,
          headers: { 'Accept': 'application/json' }
        })
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

  // Función para generar los enfrentamientos
  generarEnfrentamientos() {
    Swal.fire({
      title: '¿Generar Calendario?',
      text: "Se crearán los enfrentamientos de ida y vuelta para todos los equipos.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#FF383C',
      cancelButtonColor: '#000',
      confirmButtonText: 'Sí, generar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Generando cruces...',
          text: 'Por favor, espera.',
          allowOutsideClick: false,
          // Spinner de carga
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this.http.put(`https://ligas80api.drg80dev.com/api/ligas/generarCalendario/${this.idLiga}`, {}, {
          withCredentials: true,
          headers: { 'Accept': 'application/json' }
        })
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


  // Función para cargar los encuentros
  cargarEncuentros(enfrentamientos: any) {
    this.encuentros = []; // Vaciamos el estado previo para evitar duplicados


    if (!enfrentamientos) return;

    let datosProcesados = enfrentamientos;


    // Evaluamos si el payload nos ha llegado serializado como texto.
    if (typeof datosProcesados === 'string') {
      try {
        datosProcesados = JSON.parse(datosProcesados);
      } catch (e) {
        console.error('Error al parsear el JSON de enfrentamientos:', e);
        return;
      }
    }

    // Iteración por jornadas
    Object.keys(datosProcesados).forEach(jornada => {

      const numeroJornada = parseInt(jornada);
      let partidosStrings = datosProcesados[jornada];

      // Doble validación: a veces los arrays anidados en BD también se serializan como string
      if (typeof partidosStrings === 'string') {
        try { partidosStrings = JSON.parse(partidosStrings); } catch(e) {}
      }

      // Aseguramos que es un array iterable antes de continuar
      if (!Array.isArray(partidosStrings)) return;

      const partidosDeLaJornada: any[] = [];


      // Recorremos el array de encuentros
      partidosStrings.forEach((cruce: string) => {

        const ids = cruce.split('-');
        const idLocal = +ids[0];
        const idVisitante = +ids[1];


        // Buscamos el objeto de equipo completo para obtener el nombre real a partir de la ID
        const equipoLocal = this.equipos?.find(e => e.id === idLocal);
        const equipoVisitante = this.equipos?.find(e => e.id === idVisitante);

        // Construimos el encuentro para el html
        partidosDeLaJornada.push({
          idLocal: idLocal,
          idVisitante: idVisitante,
          local: equipoLocal ? equipoLocal.nombre : `Equipo ${idLocal}`,
          visitante: equipoVisitante ? equipoVisitante.nombre : `Equipo ${idVisitante}`,
        });
      });

      // Guardamos la jornada completa en la estructura principal
      this.encuentros.push({
        jornada: numeroJornada,
        partidos: partidosDeLaJornada
      });
    });


    // Ordena las jornadas
    this.encuentros.sort((a, b) => a.jornada - b.jornada);


  }

  // Función para simular la jornada
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
      confirmButtonColor: '#FF383C',
      cancelButtonColor: '#000',
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

        this.http.put(`https://ligas80api.drg80dev.com/api/ligas/simularJornada/${this.idLiga}`, {}, {
          withCredentials: true,
          headers: { 'Accept': 'application/json' }
        })
          .subscribe({
            next: (res: any) => {
              Swal.fire({
                icon: 'success',
                title: '¡Jornada Finalizada!',
                text: 'Los resultados se han guardado correctamente.',
                confirmButtonColor: '#FF383C'
              }).then(() => {
                this.mostrarResultados();
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

  // Función para los resultados
  mostrarResultados() {


    if (!this.idLiga) {
      console.error('No hay ID de liga definido');
      return;
    }


    this.http.get<any>(`https://ligas80api.drg80dev.com/api/ligas/obtenerResultados/${this.idLiga}`, {
      withCredentials: true,
      headers: { 'Accept': 'application/json' }
    })
      .subscribe({
        next: (res) => {
          console.log(res);
          // Cambiamos el estado de la vista para mostrar las tarjetas de resultados en el HTML
          this.jornadaJugada = true;
          this.resultados = []; // Vaciamos la memoria previa

          if (!res) return;

          let datosProcesados = res;


          // Por si el servidor devuelve el JSON serializado como un string doble
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

            // Por seguridad, aseguramos que la clave sea manipulable
            if (typeof objetoPartido === 'string') {
              try { objetoPartido = JSON.parse(objetoPartido); } catch(e) {}
            }

            if (!objetoPartido) return;

            // Extraemos las IDs de los contrincantes
            const ids = objetoPartido.split('-');
            const idLocal = +ids[0]; // El '+' castea el string a Number
            const idVisitante = +ids[1];

            const partidosDeLaJornada: any[] = [];

            // Extraemos los Goles del marcador
            const resultado = datosProcesados[objetoPartido];
            const goles = resultado.split('-');
            const golesLocal = +goles[0];
            const golesVisitante = +goles[1];


            // Buscamos los objetos completos en memoria para pintar los nombres en pantalla
            const equipoLocal = this.equipos?.find(e => e.id === idLocal);
            const equipoVisitante = this.equipos?.find(e => e.id === idVisitante);

            // Montamos el objeto final para el html
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

          console.log('Resultados cargados y mapeados:', this.resultados);
        },
        error: (err) => {

          console.error('Error al obtener los resultados:', err);
        }
      });
  }

  // Función para terminar la jornada
  terminarJornada() {
    if (!this.idLiga) return;

    Swal.fire({
      title: '¿Finalizar Jornada?',
      text: "Se cerrará el acta de esta jornada y pasaremos a la siguiente.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#FF383C',
      cancelButtonColor: '#000',
      confirmButtonText: 'Sí, siguiente jornada',
      cancelButtonText: 'Esperar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.put(`https://ligas80api.drg80dev.com/api/ligas/terminarJornada/${this.idLiga}`, {}, {
          withCredentials: true,
          headers: { 'Accept': 'application/json' }
        })
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
