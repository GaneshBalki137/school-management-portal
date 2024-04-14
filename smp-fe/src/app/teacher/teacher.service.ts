import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Timetable } from "../models/timetable.model";
import { Observable } from "rxjs";



@Injectable({
    providedIn: 'root'
})
export class TeacherService{
    private baseUrl: string ="http://127.0.0.1:3000";
    constructor(private http:HttpClient){}

    getTimetable(teacher_id:number,day_of_week:String):Observable<Timetable[]>{
        return this.http.get<Timetable[]>(`${this.baseUrl}/get/timetable/${teacher_id}/${day_of_week}`);
    }


}