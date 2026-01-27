import {Component, OnInit} from '@angular/core';
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
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-plantilla',
  imports: [CommonModule, DataTablesModule, FormsModule, Header, Footer, RouterLink,DragDropModule],
  templateUrl: './plantilla.html',
  styleUrl: './plantilla.scss',
  standalone: true
})
export class Plantilla implements OnInit{

  portero: any[] = [];    // Máx 1
  defensas: any[] = [];   // Máx 4
  medios: any[] = [];     // Máx 3
  delanteros: any[] = []; // Máx 3
  banquillo: any[] = [];


  dtOptions: Config = {};
  dtTrigger: Subject<any> = new Subject<any>();

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
            this.cargarMisJugadores(idLiga,this.idEquipo);


          }
        },
        error: (err) => {
          console.error('❌ Error verificando permisos:', err);
          this.router.navigate(['/ligas']);
        }
      });
  }

  cargarMisJugadores(idLiga: number, idEquipo: number) {
    // Llamamos al endpoint inteligente que ya nos da la alineación + banquillo actualizado
    this.http.get<any>(`http://localhost:8000/api/ligasEquipo/obtenerAlineacion/${idLiga}/${idEquipo}`, { withCredentials: true })
      .subscribe({
        next: (alineacion) => {
          // Asignamos directamente.
          // El backend asegura devolver siempre la estructura, pero usamos '|| []' por seguridad.
          this.portero = alineacion.portero || [];
          this.defensas = alineacion.defensas || [];
          this.medios = alineacion.medios || [];
          this.delanteros = alineacion.delanteros || [];
          this.banquillo = alineacion.banquillo || [];
          console.log(alineacion);

          console.log('✅ Alineación y plantilla sincronizadas');
        },
        error: (err) => {
          console.error('Error al cargar la plantilla:', err);
        }
      });
  }

  drop(event: CdkDragDrop<any[]>) {


    const jugador = event.item.data;
    const arrayOrigen = event.previousContainer.data;
    const arrayDestino = event.container.data;


    if (event.previousContainer === event.container) {
      moveItemInArray(arrayDestino, event.previousIndex, event.currentIndex);
      return;
    }

    const indiceReal = arrayOrigen.indexOf(jugador);


    const indexAUsar = indiceReal > -1 ? indiceReal : event.previousIndex;

    const idDestino = event.container.id;
    const cantidadActual = arrayDestino.length;


    if (idDestino === 'lista-banquillo') {
      transferArrayItem(
        arrayOrigen,
        arrayDestino,
        indexAUsar,
        event.currentIndex,
      );
      return;
    }


    let posicionCorrecta = false;
    if (idDestino === 'lista-portero' && jugador.posicion === 'POR') posicionCorrecta = true;
    if (idDestino === 'lista-defensas' && jugador.posicion === 'DEF') posicionCorrecta = true;
    if (idDestino === 'lista-medios' && (jugador.posicion === 'MED' || jugador.posicion === 'MC')) posicionCorrecta = true;
    if (idDestino === 'lista-delanteros' && (jugador.posicion === 'DEL' || jugador.posicion === 'DC')) posicionCorrecta = true;

    if (!posicionCorrecta) {
      Swal.fire({
        icon: 'error',
        title: 'Posición Incorrecta',
        text: `Este jugador es ${jugador.posicion}, no va ahí.`,
        timer: 1500, showConfirmButton: false
      });
      return;
    }


    let lineaLlena = false;
    if (idDestino === 'lista-portero' && cantidadActual >= 1) lineaLlena = true;
    if (idDestino === 'lista-defensas' && cantidadActual >= 4) lineaLlena = true;
    if (idDestino === 'lista-medios' && cantidadActual >= 3) lineaLlena = true;
    if (idDestino === 'lista-delanteros' && cantidadActual >= 3) lineaLlena = true;

    if (lineaLlena) {
      Swal.fire({
        icon: 'warning',
        title: 'Línea Completa',
        text: 'No caben más jugadores en esta línea.',
        timer: 1500, showConfirmButton: false
      });
      return;
    }


    transferArrayItem(
      arrayOrigen,
      arrayDestino,
      indexAUsar,
      event.currentIndex,
    );
  }

  guardarAlineacion() {
    // Validar (opcional)
    if (this.portero.length < 1 || this.defensas.length < 4 || this.medios.length < 3 || this.delanteros.length < 3) {
      Swal.fire('Alineación incompleta', 'Debes rellenar el 1-4-3-3 para guardar.', 'warning');
      return;
    }

    const alineacion = {
      id_liga: this.idLiga,
      id_equipo: this.idEquipo,

      // CAMBIO AQUÍ: Ahora guardamos objetos { id, media }
      portero: this.portero.map(j => ({ id: j.id, media: j.media })),
      defensas: this.defensas.map(j => ({ id: j.id, media: j.media })),
      medios: this.medios.map(j => ({ id: j.id, media: j.media })),
      delanteros: this.delanteros.map(j => ({ id: j.id, media: j.media })),


    };

    console.log('Enviando alineación detallada:', alineacion);

    this.http.put('http://localhost:8000/api/ligasEquipo/guardarAlineacion', alineacion, { withCredentials: true })
      .subscribe({
        next: () => Swal.fire('Guardado', 'Alineación confirmada', 'success'),
        error: () => Swal.fire('Error', 'No se pudo guardar la alineación', 'error')
      });
  }




}
