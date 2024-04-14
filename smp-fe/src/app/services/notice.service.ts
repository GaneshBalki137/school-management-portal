import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Notice } from "../models/notice.model";


@Injectable({
    providedIn: 'root'
})
export class NoticeService {
    private baseUrl: string ="http://127.0.0.1:3000";

    constructor(private http:HttpClient){}

    getAllNotices():Observable<Notice[]>{
        return this.http.get<Notice[]>(`${this.baseUrl}/get/all/notices"`);
    }
}