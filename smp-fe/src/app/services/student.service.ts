import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Student } from "../models/student.model";
import { AuthService } from "./auth.service";

@Injectable({
    providedIn: 'root'
})
export class StudentService {
    constructor(private http:HttpClient,private authService:AuthService){}

    // get student
    getStudentsById(class_id: number):Observable<Student[]>{
        let headers = this.authService.getTokenForHeader();
        return this.http.get<Student[]>(`http://127.0.0.1:3000/get_all_students/${class_id}`,{headers});
  }

    // update student
    updateStudent(student_id: number,student:Student):Observable<Student []>{
        let headers = this.authService.getTokenForHeader();
        return this.http.put<Student[]>(`http://127.0.0.1:3000/update_student/${student_id}`,student,{headers});
    }

    // delete student
    deleteStudent(student_id:number,class_id:number):Observable<Student []>{
        let headers = this.authService.getTokenForHeader();
        return this.http.delete<Student[]>(`http://127.0.0.1:3000/delete_student/${student_id}/${class_id}`,{headers});
    }

    // getTotalStudentCount():Observable<any>{
    //     return 
    // }
}