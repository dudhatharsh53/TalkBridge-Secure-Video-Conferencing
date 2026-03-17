import { Injectable, signal } from '@angular/core';

export interface Toast {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    id: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    toasts = signal<Toast[]>([]);
    private counter = 0;

    show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
        const id = this.counter++;
        this.toasts.update(current => [...current, { message, type, id }]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            this.remove(id);
        }, 5000);
    }

    success(message: string) {
        this.show(message, 'success');
    }

    error(message: string) {
        this.show(message, 'error');
    }

    warning(message: string) {
        this.show(message, 'warning');
    }

    info(message: string) {
        this.show(message, 'info');
    }

    remove(id: number) {
        this.toasts.update(current => current.filter(t => t.id !== id));
    }
}
