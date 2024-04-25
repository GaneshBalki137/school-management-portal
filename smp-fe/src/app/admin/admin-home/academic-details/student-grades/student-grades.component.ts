import { Component,Input, OnInit } from '@angular/core';
import { Student } from '../../../../models/student.model';
import { Grade } from '../../../../models/grade.model';
import { HttpClient } from '@angular/common/http';
import { SubjectService } from '../../../../services/subject.service';
import { Subject } from '../../../../models/subject.model';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-student-grades',
  templateUrl: './student-grades.component.html',
  styleUrl: './student-grades.component.css'
})
export class StudentGradesComponent {
  @Input() selectedStudent: Student;
  //student: Student;
  grades: Grade[] = [];
  //subject: Subject;
  subjectNames: { [key: number]: string } = {};
  subjects: Subject[] = [];
  //semester : number;
 
  constructor(private http: HttpClient, private subjectService: SubjectService,
                             private authService: AuthService){
  }

  ngOnInit(): void {
    this.getSudentGrades(this.selectedStudent.student_id)
    //this.loadSubjectNames();
    this.getSubjects(this.selectedStudent.class_id).subscribe(subjects=>{
      this.subjects = subjects;
    });
  }
  
  getSudentGrades(student_id: number){
    let headers = this.authService.getTokenForHeader();
    this.http.get<Grade[]>(`http://127.0.0.1:3000/get_student_grades/${student_id}`,{headers})
      .subscribe(data => {
         this.grades = data;
         //this.semester = data.semester;
      })
  }
  getSubjectName(subject_id: number){
    const subject = this.subjects.find(subject => subject.subject_id === subject_id);
    return subject ? subject.subject_name : 'Subject not found';
  }
  getSubjects(class_id:number){
    let headers = this.authService.getTokenForHeader();
   return this.http.get<Subject[]>(`http://127.0.0.1:3000/get_subjects_by_class_id/${class_id}`,{headers})
  }




  // getSubjectName(subject_id: number) {
  //   this.subjectService.getSubjectName(subject_id)
  //    .subscribe(data => {
  //          console.log(data.subject_name)
  //          return data.subject_name;
  //    })
  // }

  // loadSubjectNames(): void {
  //   this.grades.forEach(grade => {
  //     if (!this.subjectNames[grade.subject_id]) {
  //       this.subjectService.getSubjectName(grade.subject_id)
  //         .subscribe(data => {
  //           this.subjectNames[grade.subject_id] = data.subject_name;
  //         });
  //     }
  //   });
  // }

  // getSubjectName(subject_id: number): string {
  //   return this.subjectNames[subject_id] || 'Loading...';
  // }

  // getSubjectName(subject_id: number): Observable<string> {
  //   return this.subjectService.getSubjectName(subject_id).pipe(
  //     tap(data => console.log('Received subject data:', data)),
  //     map(data => data.subject_name)
  //   );
  // }
  
}

