import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private readonly apiUrl = 'https://video-conference-api.onrender.com/api/notifications';

    constructor(private http: HttpClient, private authService: AuthService) { }

    private getHeaders() {
        return new HttpHeaders({
            'Authorization': `Bearer ${this.authService.getToken()}`
        });
    }

    getNotifications(): Observable<any> {
        return this.http.get(this.apiUrl, { headers: this.getHeaders() });
    }

    markAsRead(id: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/read`, {}, { headers: this.getHeaders() });
    }

    markAllAsRead(): Observable<any> {
        return this.http.patch(`${this.apiUrl}/read-all`, {}, { headers: this.getHeaders() });
    }
}
