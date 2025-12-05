import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {

  private baseUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  // Obtener cookie CSRF
  getCSRF(): Observable<any> {
    return this.http.get(`${this.baseUrl}/sanctum/csrf-cookie`, { withCredentials: true });
  }

  // Login
  login(email: string, password: string): Observable<any> {
    return this.getCSRF().pipe(
      switchMap(() => this.http.post(
        `${this.baseUrl}/login`,
        { email, password },
        { withCredentials: true }
      ))
    );
  }

  // Registro
  register(name: string, email: string, password: string, password_confirmation: string): Observable<any> {
    return this.getCSRF().pipe(
      switchMap(() => this.http.post(
        `${this.baseUrl}/register`,
        { name, email, password, password_confirmation },
        { withCredentials: true }
      ))
    );
  }

  //Desloguearse
  logout(): Observable<any> {
    return this.getCSRF().pipe(
      switchMap(() => this.http.post(
        `${this.baseUrl}/logout`,
        {},
        { withCredentials: true }
      ))
    );
  }

  // Obtener usuario autenticado
  user(): Observable<any> {
    return this.getCSRF().pipe(
      switchMap(() => this.http.get(`${this.baseUrl}/api/user`, { withCredentials: true }))
    );
  }
}
