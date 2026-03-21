import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private apiUrl = `${environment.apiUrl}/admin`;

    constructor(private http: HttpClient) { }

    getStats(): Observable<any> {
        return this.http.get(`${this.apiUrl}/stats`);
    }

    getUsers(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/users`);
    }

    deleteUser(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/users/${id}`);
    }

    updateUser(id: string, data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/users/${id}`, data);
    }

    getMeetings(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/meetings`);
    }

    deleteMeeting(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/meetings/${id}`);
    }

    getInvitationStats(): Observable<any> {
        return this.http.get(`${this.apiUrl}/invitation-stats`);
    }
}

