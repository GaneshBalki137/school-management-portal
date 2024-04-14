import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Student } from "../models/student.model";


@Injectable({
    providedIn: 'root'
})
export class StudentService {
    constructor(private http:HttpClient){}

    getStudentsById(class_id: number):Observable<Student[]>{
        return this.http.get<Student[]>(`http://127.0.0.1:3000/get_all_students/${class_id}`);
  }
}