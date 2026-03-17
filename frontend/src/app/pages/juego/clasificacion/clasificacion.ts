import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';
import {DataTablesModule} from 'angular-datatables';
import {FormsModule} from '@angular/forms';
import {Header} from '../../../componentes/header/header';
import {Footer} from '../../../componentes/footer/footer';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import Swal from 'sweetalert2';
import {HttpClient} from '@angular/common/http';
import {Auth} from '../../../services/auth';

@Component({
  selector: 'app-clasificacion',
  imports: [CommonModule, DataTablesModule, FormsModule, Header, Footer, RouterLink],
  templateUrl: './clasificacion.html',
  styleUrl: './clasificacion.scss',
  standalone: true
})
export class Clasificacion {

  iniciada: boolean =false;
  public idLiga: number | null = null;
  public idEquipo: number | any = null;
  public pertenencia: boolean = false;
  public jornada: number = 0;
  public posiciones: any[] = [];
  public tabla: any[] = [];
  public equipos: any[] = [];

  public cargando: boolean = true;


  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    public auth: Auth
  ) {}

  ngOnInit(): void {

    const idLigaParam = this.route.snapshot.paramMap.get('idLiga');
    const idEquipoParam = this.route.snapshot.paramMap.get('idEquipo');

    if (idLigaParam) {
      this.idLiga = +idLigaParam;


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


  cargarDatosLiga(idLiga: number, idEquipo: number) {
    this.http.get<any>(`https://ligas80api.drg80dev.com/api/ligas/obtenerDatosLiga/${idLiga}`, {
      withCredentials: true,
      headers: { 'Accept': 'application/json' }
    })
      .subscribe({
        next: (datos) => {
          this.iniciada = datos.iniciada != 0;
          if (this.iniciada){
            this.equipos=datos.equipos;
            this.jornada = datos.jornada || 0;
            this.posiciones= datos.posiciones;
            this.cargarClasificacion();
          }
          console.log('Datos de la liga recibidos correctamente');
        },
        error: (err) => {
          console.error('Error al cargar la plantilla:', err);
        }
      });
  }

  // Función para cargar la clasificación
  cargarClasificacion() {


    if (!this.idLiga) {
      console.error('No hay ID de liga definido');
      return;
    }


    let datosProcesados = this.posiciones;


    // Previene errores si el payload viene serializado dos veces desde el backend
    if (typeof datosProcesados === 'string') {
      try {
        datosProcesados = JSON.parse(datosProcesados);
      } catch (e) {
        console.error('Error al parsear el JSON de resultados:', e);
        return;
      }
    }

    this.tabla = []; // Reiniciamos la tabla para evitar datos duplicados


    // Iteramos sobre los IDs de los equipos (
    Object.keys(datosProcesados).forEach(posiciones => {

      let objetoPosicion = posiciones;
      const fila: any[] = [];

      if (typeof objetoPosicion === 'string') {
        try { objetoPosicion = JSON.parse(objetoPosicion); } catch(e) {}
      }

      if (!objetoPosicion) return;

      // Identificamos el equipo
      const idString = objetoPosicion;
      const id = +idString; // Casteo a número
      const equipo = this.equipos?.find(e => e.id === id);



      const datos = datosProcesados[id];
      const dat = datos.split(';');

      // Extraemos
      const puntos = +dat[0];
      const victorias = +dat[1];
      const empates = +dat[2];
      const derrotas = +dat[3];
      const golesFavor = +dat[4];
      const golesContra = +dat[5];
      const diferenciaGoles = +dat[6];

      // Montamos la fila enriquecida para la vista HTML
      fila.push({
        equipo: equipo ? equipo : `Equipo ${id}`,
        puntos: puntos,
        victorias: victorias,
        empates: empates,
        derrotas: derrotas,
        golesFavor: golesFavor,
        golesContra: golesContra,
        diferenciaGoles: diferenciaGoles
      });

      this.tabla.push({
        posicion: fila
      });
    });

    // Ordenación
    this.tabla.sort((a, b) => {
      // Extraemos los datos de las filas a comparar
      const datosA = a.posicion[0];
      const datosB = b.posicion[0];

      // Criterio 1: Mayor número de Puntos
      if (datosB.puntos !== datosA.puntos) {
        return datosB.puntos - datosA.puntos;
      }

      // Criterio 2: Si hay empate a puntos,el que tenga mejor diferencia de goles
      if (datosB.diferenciaGoles !== datosA.diferenciaGoles) {
        return datosB.diferenciaGoles - datosA.diferenciaGoles;
      }

      // Criterio 3: Si siguen empatados, mayor cantidad de Goles a Favor
      return datosB.golesFavor - datosA.golesFavor;
    });


    setTimeout(() => {
      this.cargando = false;
    }, 800);

    console.log('Tabla cargada y ordenada:', this.tabla);
  }

}
