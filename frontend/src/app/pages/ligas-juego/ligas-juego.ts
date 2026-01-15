import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { FormsModule } from '@angular/forms';
import { Header } from '../../componentes/header/header';
import { Footer } from '../../componentes/footer/footer';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Config } from 'datatables.net';
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Auth } from '../../services/auth';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-ligas-juego',
  imports: [CommonModule, DataTablesModule, FormsModule, Header, Footer, RouterLink],
  templateUrl: './ligas-juego.html',
  styleUrl: './ligas-juego.scss',
  standalone: true
})
export class LigasJuego implements OnInit {

  dtOptions: Config = {};
  dtTrigger: Subject<any> = new Subject<any>();

  public idLiga: number | null = null;
  public pertenencia: boolean = false;
  public elegido: boolean = false;
  equiposDisponibles: any[] = [];
  miEquipo: any = null;



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

    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.idLiga = +idParam;


      this.verificarSesionYPermisos();

    } else {
      console.error('No se ha recibido ningún ID de liga');
      this.router.navigate(['/ligas']);
    }
  }

  // Lógica unificada para evitar condiciones de carrera
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
            this.comprobarEquipoElegido(idLiga);

          }
        },
        error: (err) => {
          console.error('❌ Error verificando permisos:', err);
          this.router.navigate(['/ligas']);
        }
      });
  }

  comprobarEquipoElegido(idLiga: number) {
    this.http.get(`http://localhost:8000/api/ligasEquipo/hayEquipoElegido/${idLiga}`, { withCredentials: true })
      .subscribe({
        next: (res) => {

          if (res) {

            this.elegido=true;
            this.obtenerEquipoElegido(idLiga);


          } else {
            this.elegido=false;
            this.cargarEquipos(idLiga);

          }
        },
        error: (err) => {
          console.error('❌ Error comprobando el equipo elegido', err);
          this.router.navigate(['/ligas']);
        }
      });
  }

  cargarEquipos(idLiga: number) {

    this.http.get<any[]>(`http://localhost:8000/api/ligasEquipo/${idLiga}`, { withCredentials: true })
      .subscribe({
        next: (res) => {
          this.equiposDisponibles = res;

          if (!this.dtTrigger.closed) {
            this.dtTrigger.next(null);
          }
        },
        error: (err) => console.error('Error cargando equipos:', err)
      });
  }

  elegirEquipo(idEquipo: number) {


    if (!this.idLiga) {
      console.error('No hay ID de liga cargado');
      return;
    }

    const payload = {
      id_equipo: idEquipo
    };

    this.http.post(`http://localhost:8000/api/ligasEquipo/elegir/${this.idLiga}`, payload, { withCredentials: true })
      .subscribe({
        next: (res) => {
          Swal.fire({
            icon: 'success',
            title: '¡Equipo Elegido!',
            text: 'Has tomado el control del equipo correctamente.',
            confirmButtonColor: '#FF383C',
            confirmButtonText: 'Continuar'
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.reload();
            }
          });
        },
        error: (err) => {
          console.error('Error al elegir:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error?.message || 'No se pudo elegir el equipo. Quizás ya está ocupado.',
          });
        }
      });
  }

  obtenerEquipoElegido(idLiga: number) {

    this.http.get<any[]>(`http://localhost:8000/api/ligasEquipo/obtenerEquipoElegido/${idLiga}`, { withCredentials: true })
      .subscribe({
        next: (res) => {
          this.miEquipo = res;

          if (!this.dtTrigger.closed) {
            this.dtTrigger.next(null);
          }
        },
        error: (err) => console.error('Error al obtener equipo:', err)
      });

  }

}
