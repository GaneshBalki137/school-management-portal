import { Component,OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Teacher } from '../../../models/teacher.model';
import { Subject } from '../../../models/subject.model';
import { SubjectService } from '../../../services/subject.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-subjects-allocation',
  templateUrl: './subjects-allocation.component.html',
  styleUrl: './subjects-allocation.component.css'
})
export class SubjectsAllocationComponent implements OnInit{
  teachers: Teacher [] = [];
  selectedTeacher: string;
  subjects: Subject[] = [];
  teachersData : Teacher[] = [];

  updatedClass: number;
  updatedSubject: string;
  updatedTeacherId: number;

  constructor(private http: HttpClient, private subjectService: SubjectService, private authService:AuthService) { }

  ngOnInit(): void {
    this.getSubjectDetails();

    this.getTeachersData().subscribe( teachersData=>{
      this. teachersData =  teachersData;
    });
  }

  getClass(className: number) {
    this.updatedClass = +className;
    console.log(this.updatedClass);
  }

  getTeacherForSubject(subject_name: string){
    this.updatedSubject = subject_name;
    console.log(this.updatedSubject);
    console.log(subject_name);
    let headers = this.authService.getTokenForHeader();
    this.http.get<Teacher[]>(`http://127.0.0.1:3000/get_teacher_by_subject_name/${subject_name}`,{headers})
      .subscribe(data => {
        this.teachers = data;
        console.log("Teacher data: " + JSON.stringify(this.teachers))
      })
  }

  onTeacherSelected(teacher_id: number) {
    this.updatedTeacherId = +teacher_id;
    console.log("check check::" +this.updatedTeacherId);
  }

  // to show details after component is rendered
  getSubjectDetails(){
    this.subjectService.getSubjectDetails()
      .subscribe(data => {
        this.subjects = data;
        console.log("Subject data: " + JSON.stringify(this.subjects))
      })
  }


  getTeacherName(teacher_id: number){
    const teacher = this.teachersData.find(teacher => teacher.teacher_id === teacher_id);
    const teacherName = teacher.first_name + " " + teacher.last_name;
    return teacher ? teacherName: 'Teacher not found';
  }

  getTeachersData(){
    let headers = this.authService.getTokenForHeader();
    return this.http.get<Teacher[]>(`http://127.0.0.1:3000/get_all_teachers`,{headers})
  }

  addSubjectDetails(){
    const subject: Subject = {
      subject_id: 1,
      subject_name: this.updatedSubject,
      class_id: this.updatedClass,
      teacher_id: this.updatedTeacherId,
    }
  
    this.subjectService.addSubjectDetails(subject)
    .subscribe({
      next: (resp : any) => {
        console.log("response: "+resp);
        this.subjects.push(resp);
        this.getSubjectDetails();
      }
      ,
      error: (err: any) => {
        console.log("error: "+err);
      }
    }
     )
  }

}  
