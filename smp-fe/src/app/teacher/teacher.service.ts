import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Timetable } from "../models/timetable.model";
import { Observable,} from "rxjs";
import { Subject } from "../models/subject.model";
import { map } from 'rxjs/operators';
import { Student } from "../models/student.model";
import { Attendance } from "../models/attendance.model";
import { Grade } from "../models/grade.model";
import { AuthService } from "../services/auth.service";


@Injectable({
    providedIn: 'root'
})
export class TeacherService{
    private baseUrl: string ="http://127.0.0.1:3000";
    constructor(private http:HttpClient,private authService:AuthService){}

    getTimetable(teacher_id:number,day_of_week:String):Observable<Timetable[]>{
      let headers = this.authService.getTokenForHeader();
        return this.http.get<Timetable[]>(`${this.baseUrl}/get_timetable/${teacher_id}/${day_of_week}`,{headers});
    }
    getSubjects(teacher_id: number): Observable<Map<number, Subject[]>> {
      let headers= this.authService.getTokenForHeader();
        return this.http.get<Subject[]>(`${this.baseUrl}/get_subjects/${teacher_id}`,{headers}).pipe(
          map(subjects => {
            // Group subjects by class_i
            const groupedSubjects = new Map<number, Subject[]>();
            subjects.forEach(subject => {
              const classId = subject.class_id;
              if (!groupedSubjects.has(classId)) {
                groupedSubjects.set(classId, []);
              }
              groupedSubjects.get(classId).push(subject);
            });
            return groupedSubjects;
          })
        );
      }
      getStudentsByClass(class_id:number){
        let headers = this.authService.getTokenForHeader();
          return this.http.get<Student[]>(`${this.baseUrl}/students/${class_id}`,{headers})
      }

      submitAttendance(attendance: Attendance,subject_id:number){
        let headers = this.authService.getTokenForHeader();
        console.log("SubmitAttendance function called")
        console.log(attendance)
           return this.http.post<any>(`${this.baseUrl}/submit/attendance/${subject_id}`,attendance,{headers});
      }
      getTeacherSchedule(teacher_id:number){
        let headers = this.authService.getTokenForHeader();
        return this.http.get<Timetable[]>(`${this.baseUrl}/get_teacher_schedule/${teacher_id}`,{headers})
      }
      getTimeTableByDayAndHour(teacher_id:number,day_of_week:string,current_hour:string){
        let headers = this.authService.getTokenForHeader();
        return this.http.get<Timetable[]>(`${this.baseUrl}/get_timetable_by_day_hour/${teacher_id}/${day_of_week}/${current_hour}`,{headers})
      }
      getGradesForSubjectSemesterStudent(subject_id:number,student_id:number,semester:number){
        let headers = this.authService.getTokenForHeader();
        return this.http.get<Grade>(`${this.baseUrl}/get_grades_for_subject_semester_student/${subject_id}/${student_id}/${semester}`,{headers})
            
      }
      submitGrades(grades:Grade){
        let headers = this.authService.getTokenForHeader();
        console.log(grades)
        return this.http.post<Grade>(`${this.baseUrl}/add/grade`,grades,{headers});
      }
      updateGrades(grades:Grade){
        console.log(grades)
        let headers = this.authService.getTokenForHeader();
        return this.http.put<Grade>(`${this.baseUrl}/update/grade`,grades,{headers});
      }
      getTotalClasses(teacher_id:number){
        let headers = this.authService.getTokenForHeader();
        return this.http.get<any>(`http://localhost:3000/get_total_classes_for_teacher/${teacher_id}`,{headers})
      }

}