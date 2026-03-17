import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly apiUrl = 'http://localhost:5000/api/auth';

    private userSignal = signal<any>(null);
    user = computed(() => this.userSignal());

    constructor(private http: HttpClient, private router: Router) {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                this.userSignal.set(JSON.parse(savedUser));
            } catch (e) {
                console.error("Error parsing saved user", e);
                this.logout();
            }
        }
    }

    register(userData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, userData).pipe(
            tap((res: any) => this.setSession(res))
        );
    }

    login(credentials: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
            tap((res: any) => this.setSession(res))
        );
    }

    private setSession(authResult: any) {
        localStorage.setItem('token', authResult.token);
        localStorage.setItem('user', JSON.stringify(authResult.user));
        this.userSignal.set(authResult.user);
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.userSignal.set(null);
        this.router.navigate(['/login']);
    }

    getProfile(): Observable<any> {
        return this.http.get(`${this.apiUrl}/profile`);
    }

    updateProfile(data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/update-profile`, data).pipe(
            tap((res: any) => {
                const currentUser = this.user();
                const newUser = { ...currentUser, ...res.user };
                localStorage.setItem('user', JSON.stringify(newUser));
                this.userSignal.set(newUser);
            })
        );
    }

    changePassword(data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/change-password`, data);
    }

    searchUsers(email: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/search`, { params: { email } });
    }

    getAllUsers(): Observable<any> {
        return this.http.get(`${this.apiUrl}/users`);
    }

    getToken() {
        return localStorage.getItem('token');
    }

    isLoggedIn() {
        return !!this.user();
    }
}

