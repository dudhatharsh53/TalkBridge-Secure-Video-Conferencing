import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { VideoCallComponent } from './components/video-call/video-call.component';
import { ProfileComponent } from './components/profile/profile.component';
import { InvitationListComponent } from './components/invitation-list/invitation-list.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { PrivateChatComponent } from './components/private-chat/private-chat.component';
import { UsersListComponent } from './components/users-list/users-list.component';
import { authGuard, adminGuard } from './services/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
    { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
    { path: 'invitations', component: InvitationListComponent, canActivate: [authGuard] },
    { path: 'chat', component: PrivateChatComponent, canActivate: [authGuard] },
    { path: 'chat/:userId', component: PrivateChatComponent, canActivate: [authGuard] },
    { path: 'users-list', component: UsersListComponent, canActivate: [authGuard] },
    { path: 'meeting/:id', component: VideoCallComponent, canActivate: [authGuard] },
    { path: 'admin', component: AdminDashboardComponent, canActivate: [adminGuard] },
    { path: '**', redirectTo: 'login' }
];

