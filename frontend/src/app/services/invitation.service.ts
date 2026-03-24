import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class InvitationService {
    private readonly apiUrl = `${environment.apiUrl}/invitations`;

    constructor(private http: HttpClient) { }

    sendInvitation(meetingId: string, receiverEmail: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/send`, { meetingId, receiverEmail });
    }

    getSentInvitations(): Observable<any> {
        return this.http.get(`${this.apiUrl}/sent`);
    }

    getReceivedInvitations(): Observable<any> {
        return this.http.get(`${this.apiUrl}/received`);
    }

    updateStatus(invitationId: string, status: 'accepted' | 'rejected'): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${invitationId}`, { status });
    }
}
