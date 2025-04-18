import { Injectable, inject } from '@angular/core';
import { UserModel, UserLoginModel, UserRegistrationModel } from '../../models/User';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { jwtDecode } from "jwt-decode";
import { NavigationEnd, Router } from '@angular/router';
import { createAvatar } from '@dicebear/core';
import { bottts } from '@dicebear/collection';
import { CrudService } from './crud.service';
import * as CryptoJS from "crypto-js";

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private crudService = inject(CrudService);
    private router = inject(Router);

    constructor() {
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                if(event.url !== '/exit'){
                    if(this.loggedInUserSubject.value !== null && this.decodeToJWT() !== undefined)
                        this.refreshToken();
                }
            }            
        });
    }

    private loggedInUserSubject = new BehaviorSubject<UserModel | null>(null);
    loggedInUser$ = this.loggedInUserSubject.asObservable();

    private remainingTimeSubject = new BehaviorSubject<number>(0);
    remainingTime$ = this.remainingTimeSubject.asObservable();

    lastLoggedInUser: string | null = null;

    logIn(_user: UserLoginModel): Observable<boolean> {
        return this.crudService.create<UserLoginModel>('login', _user).pipe(
            map((result: { token: string }) => {
                localStorage.setItem('authToken', this.encodeToken(result.token));
                this.setLoggedInUser();
                this.scheduleAutoLogout();
                return true;
            })
        );
    }

    refreshToken(): void {
        if (this.loggedInUserSubject.value !== null) {
            this.crudService.create<string>('refreshToken', this.decodeToJWT()!).subscribe({
                next: (result: { token: string })=>{
                    localStorage.setItem('authToken', this.encodeToken(result.token));
                    this.scheduleAutoLogout();
                },
                error: ()=>{
                    this.logOut();
                }
            })
        }
    }

    scheduleAutoLogout(): void {
        const decodedToken = this.decodeToken();
        if (!decodedToken || !decodedToken.exp) return;

        const expiresIn = (decodedToken.exp * 1000) - Date.now();

        setInterval(() => {
            const remainingTime = this.getRemainingTime();
            this.remainingTimeSubject.next(remainingTime);
        }, 1000);

        setTimeout(() => this.logOut(), expiresIn);
    }

    getRemainingTime(): number {
        const decodedToken = this.decodeToken();
        if (!decodedToken || !decodedToken.exp) return 0;

        const expiresIn = (decodedToken.exp * 1000) - Date.now();
        return expiresIn;
    }

    getTokenId(): string | undefined {
        const decodedToken: any = this.decodeToken();
        if (decodedToken)
            this.remainingTimeSubject.next((decodedToken.exp * 1000) - Date.now());
        return decodedToken ? decodedToken.id : undefined;
    }

    encodeToken(_token: string): string {
        return CryptoJS.AES.encrypt(_token, 'secret-key').toString();
    }

    decodeToJWT() {
        const token = localStorage.getItem('authToken');
        if (token) {
            return CryptoJS.AES.decrypt(token, 'secret-key').toString(CryptoJS.enc.Utf8);
        }
        return undefined;
    }

    decodeToken(): any {
        const token = localStorage.getItem('authToken');
        if (token) {
            const semiDecoded = CryptoJS.AES.decrypt(token, 'secret-key').toString(CryptoJS.enc.Utf8);
            return semiDecoded ? jwtDecode(semiDecoded) : undefined;
        }
        return undefined;
    }

    setLoggedInUser(): void {
        const tokenId = this.getTokenId();
        if (!tokenId) {
            this.loggedInUserSubject.next(null);
            localStorage.removeItem('authToken');
            return;
        }

        this.getUserFromToken(tokenId).subscribe({
            next: (result: any) => {
                result.profile_image = createAvatar(bottts, { seed: result.username }).toDataUri();
                this.loggedInUserSubject.next(result);
                this.scheduleAutoLogout();
            },
            error: () => {
                console.error('Invalid token');
                localStorage.removeItem('authToken');
                this.loggedInUserSubject.next(null);
            }
        });
    }

    shouldGreetUser(): string | null {
        const username = this.decodeToken()?.username;
        this.lastLoggedInUser = sessionStorage.getItem('lastLoggedInUser');

        if (this.lastLoggedInUser === username) {
            return null;
        } else if (username) {
            sessionStorage.setItem('lastLoggedInUser', username);
            return username;
        }
        return null;
    }

    getUserFromToken(_id: string): Observable<Object> {
        return this.crudService.getById<Object>('users', _id);
    }

    logOut() {
        this.loggedInUserSubject.next(null);
        this.remainingTimeSubject.next(0);
        localStorage.removeItem('authToken');
        this.router.navigate(['home']);
    }

    register(_user: UserRegistrationModel): Observable<Object> {
        return this.crudService.create('users', _user);
    }
}
