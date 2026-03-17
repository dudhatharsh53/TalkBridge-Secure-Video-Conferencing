import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class MeetingService {
    private readonly apiUrl = 'https://video-conference-api.onrender.com/api/meet';

    constructor(private http: HttpClient, private authService: AuthService) { }

    private getHeaders() {
        return new HttpHeaders({
            'Authorization': `Bearer ${this.authService.getToken()}`
        });
    }

    createMeeting(options: { title: string, duration: number }): Observable<any> {
        return this.http.post(`${this.apiUrl}/create`, options, { headers: this.getHeaders() });
    }

    joinMeeting(meetingId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/join`, { meetingId }, { headers: this.getHeaders() });
    }

    getHistory(): Observable<any> {
        return this.http.get(`${this.apiUrl}/history`, { headers: this.getHeaders() });
    }

    endMeeting(meetingId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/end/${meetingId}`, {}, { headers: this.getHeaders() });
    }

    getDetails(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/details/${id}`, { headers: this.getHeaders() });
    }
}

