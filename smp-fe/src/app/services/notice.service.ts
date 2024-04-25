import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Notice } from "../models/notice.model";
import { AuthService } from "./auth.service";

@Injectable({
    providedIn: 'root'
})
export class NoticeService {
    constructor(private http:HttpClient,private authService:AuthService){}

    // get notice
    getAllNotices():Observable<Notice[]>{
        let headers = this.authService.getTokenForHeader();
        return this.http.get<Notice[]>(`http://127.0.0.1:3000/get_all_notices`,{headers});
    }

    // add notice
    addNotice(notice:Notice){
        let headers = this.authService.getTokenForHeader();
        return this.http.post<any>(`http://127.0.0.1:3000/add_notice`,notice,{headers});
    }

    deleteNotice(notice_id: number){
        let headers = this.authService.getTokenForHeader();
        return this.http.delete<any>(`http://127.0.0.1:3000/delete_notice/${notice_id}`,{headers});
    }

    // // delete student
    // deleteStudent(student_id:number,class_id:number):Observable<Student []>{
    //     return this.http.delete<Student[]>(`http://127.0.0.1:3000/delete_student/${student_id}/${class_id}`);
    // }

    getNotices():Observable<Notice[]>{
        let headers = this.authService.getTokenForHeader();
        return this.http.get<Notice[]>(`http://127.0.0.1:3000/delete_notice/get/all/notices`,{headers});
    }
}