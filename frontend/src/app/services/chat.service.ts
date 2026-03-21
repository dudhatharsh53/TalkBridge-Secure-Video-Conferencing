import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private readonly apiUrl = `${environment.apiUrl}/chat`;
    private socket: Socket;

    constructor(private http: HttpClient, private authService: AuthService) {
        this.socket = io(environment.socketUrl);

        // Automatically register if user exists
        if (this.authService.isLoggedIn()) {
            this.registerUser(this.authService.user().id);
        }
    }

    private getHeaders() {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    getMeetingMessages(meetingId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/messages/${meetingId}`, { headers: this.getHeaders() });
    }

    getPrivateMessages(otherUserId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/private/${otherUserId}`, { headers: this.getHeaders() });
    }

    getChattedUsers(): Observable<any> {
        return this.http.get(`${this.apiUrl}/chatted-users`, { headers: this.getHeaders() });
    }

    markMessagesAsSeen(otherUserId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/mark-seen`, { otherUserId }, { headers: this.getHeaders() });
    }

    searchUsersForChat(query: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/search-users?query=${query}`, { headers: this.getHeaders() });
    }

    sendPrivateMessage(receiverId: string, message: string) {
        const user = this.authService.user();
        this.socket.emit('send-private-message', {
            senderId: user.id,
            senderName: user.name,
            receiverId,
            message
        });
    }

    onNewPrivateMessage(callback: (data: any) => void) {
        this.socket.on('new-private-message', callback);
    }

    onOnlineUsers(callback: (users: string[]) => void) {
        this.socket.on('online-users', callback);
    }

    registerUser(userId: string) {
        this.socket.emit('register-user', userId);
    }
}
