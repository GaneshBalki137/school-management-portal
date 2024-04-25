import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Timetable } from "../models/timetable.model";
import { Student } from "../models/student.model";
import { CommonService } from "../services/common.service";
import { AuthService } from "../services/auth.service";


@Injectable({
    providedIn: 'root'
})
export class StudentService{
    private baseUrl: string ="http://127.0.0.1:3000";
    constructor(private http:HttpClient,private commonService:CommonService,private authService:AuthService){}

    class_id:number;
    student:Student;
    
    getClassId(student_id: number): Promise<void> {
        let headers = this.authService.getTokenForHeader();
        return new Promise<void>((resolve, reject) => {
            this.http.get<Student>(`${this.baseUrl}/get_class_id/${student_id}`,{headers}).subscribe(data => {
                this.student = data;
                resolve();
            }, error => {
                reject(error);
            });
        });
    }

    getTimetable(student_id:number){
        let headers = this.authService.getTokenForHeader();
        return this.http.get<Timetable[]>(`${this.baseUrl}/get_timetable_for_student/${student_id}`,{headers});
    }
    getTodaysLecture(student_id:number){
        let headers = this.authService.getTokenForHeader();
        const day_of_week=this.commonService.todaysDay();
        return this.http.get<any[]>(`${this.baseUrl}/get_todays_lectures/${parseInt(student_id.toString())}/${day_of_week}`,{headers});

    }
}