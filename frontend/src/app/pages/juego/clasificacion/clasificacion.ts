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

  cargarClasificacion() {

    if (!this.idLiga) {
      console.error('No hay ID de liga definido');
      return;
    }

    let datosProcesados = this.posiciones;

    if (typeof datosProcesados === 'string') {
      try {
        datosProcesados = JSON.parse(datosProcesados);
      } catch (e) {
        console.error('Error al parsear el JSON de resultados:', e);
        return;
      }
    }



    this.tabla = [];

    Object.keys(datosProcesados).forEach(posiciones => {

      let objetoPosicion = posiciones;
      const fila: any[] = [];

      if (typeof objetoPosicion === 'string') {
        try { objetoPosicion = JSON.parse(objetoPosicion); } catch(e) {}
      }

      if (!objetoPosicion) return;

      const idString = objetoPosicion;
      const id = +idString;
      const equipo = this.equipos?.find(e => e.id === id);


      const datos = datosProcesados[id];
      const dat = datos.split(';');

      const puntos = +dat[0];
      const victorias = +dat[1];
      const empates = +dat[2];
      const derrotas = +dat[3];
      const golesFavor = +dat[4];
      const golesContra = +dat[5];
      const diferenciaGoles = +dat[6];
      console.log(diferenciaGoles)

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



    this.tabla.sort((a, b) => {
      const datosA = a.posicion[0];
      const datosB = b.posicion[0];


      if (datosB.puntos !== datosA.puntos) {
        return datosB.puntos - datosA.puntos;
      }

      if (datosB.diferenciaGoles !== datosA.diferenciaGoles) {
        return datosB.diferenciaGoles - datosA.diferenciaGoles;
      }

      return datosB.golesFavor - datosA.golesFavor;
    });

    console.log('Tabla cargada y ordenada:', this.tabla);
  }

}
