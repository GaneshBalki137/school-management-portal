import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Subject } from "../models/subject.model";
import { AuthService } from "./auth.service";

@Injectable({
    providedIn: 'root'
})
export class SubjectService {
    constructor(private http:HttpClient, private authService: AuthService){}

    // X
    // get notice
    getSubjectName(subject_id:number):Observable<Subject>{
        let headers = this.authService.getTokenForHeader();
        return this.http.get<Subject>(`http://127.0.0.1:3000/get_subject_name/${subject_id}`,{headers});
    }

    // X
    getSubjectByClassId(class_id:number):Observable<any[]>{
        let headers = this.authService.getTokenForHeader();
        return this.http.get<any[]>(`http://127.0.0.1:3000/get_subjects_by_class_id/${class_id}`,{headers});
    }

    getSubjectDetails():Observable<Subject[]>{
        let headers = this.authService.getTokenForHeader();
        return this.http.get<Subject[]>(`http://127.0.0.1:3000/get_subject_details`,{headers});
    }

    // to show updated details on subject allocation table
    addSubjectDetails(subject: Subject):Observable<Subject[]>{
        let headers = this.authService.getTokenForHeader();
        return this.http.post<Subject[]>(`http://127.0.0.1:3000/add_subject_details`,subject,{headers})
    }
}