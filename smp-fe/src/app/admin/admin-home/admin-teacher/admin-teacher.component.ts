import { Component, OnInit } from '@angular/core';
import { Teacher } from '../../../models/teacher.model';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-teacher',
  templateUrl: './admin-teacher.component.html',
  styleUrl: './admin-teacher.component.css'
})
export class AdminTeacherComponent implements OnInit {
  teachers: Teacher[] = [];
  toggleAddTeacher:boolean =false; //
  //toggleUpdateStudent:boolean =false;

  // for add
  firstName: string;
  lastName: string;
  date_of_birth: string;
  gender:string;
  address: string;
  phone_number: string;
  email: string;
  hire_date: string;
  qualification: string;
  subject_name: string;

  // for update
  showUpdateForm: boolean = false;
  teacherId: number;
  updateFirstName: string;
  updateLastName: string;
  updateDob: string;
  updateGender: string;
  updateAddress: string;
  updatePhoneNumber: string;
  updateEmail: string;
  updateHireDate: string;
  updateQualification: string;
  updateSubjectName: string;

  constructor(private http:HttpClient, private authService: AuthService){}

  teacher: Teacher;
  ngOnInit() {
    let headers = this.authService.getTokenForHeader();
    this.http.get<Teacher[]>(`http://127.0.0.1:3000/get_all_teachers`,{headers})
      .subscribe(data => {
        this.teachers = data;
      })
  }

  getSubject(subjectName: string){
    this.subject_name = subjectName;
  }
  
  // add teacher
  addTeacher(){

    this.toggleAddTeacher=!this.toggleAddTeacher;
    console.log("Inide Add Teacher");
      this.teacher= {
      teacher_id: 1,
      first_name: this.firstName,
      last_name: this.lastName,
      date_of_birth: this.date_of_birth,
      gender: this.gender,
      address: this.address,
      phone_number: this.phone_number,
      email: this.email,
      hire_date: this.hire_date,
      qualification: this.qualification,
      subject_name: this.subject_name
    }
    
    let headers = this.authService.getTokenForHeader();
    this.http.post<Teacher[]>('http://127.0.0.1:3000/add_teacher',this.teacher,{headers})
     .subscribe({
      next: (resp : any) => {
        console.log("resp:"+resp);
        this.teachers= resp
      }
      ,
      error: (err: any) => {
        console.log(err);
      }
    }
     )
  }

  onAddTeacherClick(): void {
   this.toggleAddTeacher=!this.toggleAddTeacher;
  }
  onCancelClick(){
    this.toggleAddTeacher=!this.toggleAddTeacher;
  }

 // update teacher
 updateTeacher(teacher:Teacher){
  console.log("inside updateTeacher:" + teacher.teacher_id);
  this.showUpdateForm = !this.showUpdateForm;

  this.teacherId = teacher.teacher_id;
  this.updateFirstName = teacher.first_name;
  this.updateLastName = teacher.last_name;
  this.updateDob = teacher.date_of_birth;
  this.updateGender = teacher.gender;
  this.updateAddress = teacher.address;
  this.updatePhoneNumber = teacher.phone_number;
  this.updateEmail = teacher.email;
  this.updateHireDate = teacher.hire_date;
  this.updateQualification = teacher.qualification;
  this.updateSubjectName = teacher.subject_name;
 }

 updateTeacherForm(){
   console.log("inside update form")
   this.showUpdateForm = !this.showUpdateForm;
   const updateTeacher: Teacher = {
     teacher_id: this.teacherId,
     first_name: this.updateFirstName,
     last_name: this.updateLastName,
     date_of_birth: this.updateDob,
     gender: this.updateGender,
     address: this.updateAddress,
     phone_number: this.updatePhoneNumber,
     email: this.updateEmail,
     hire_date: this.updateHireDate,
     qualification: this.updateQualification,
     subject_name: this.updateSubjectName
   };
   console.log("teacher_id: "+ updateTeacher.teacher_id)
   let headers = this.authService.getTokenForHeader();
   this.http.put<Teacher[]>(`http://127.0.0.1:3000/update_teacher/${updateTeacher.teacher_id}`,updateTeacher,{headers})
   .subscribe({
    next: (resp : any) => {
      console.log(resp);
      this.teachers= resp
    }
    ,
    error: (err: any) => {
      console.log(err);
    }
  }
   )
 }

  // delete teacher
  confirmDelete(teacher_id: number ){
    if(window.confirm('Are you sure you want to delete this student?')){
      this.deleteTeacher(teacher_id)
    }
  }
  deleteTeacher(teacher_id: number){
    console.log("delete_called: "+teacher_id);
    let headers = this.authService.getTokenForHeader();
    this.http.delete<Teacher[]>(`http://127.0.0.1:3000/delete_teacher/${teacher_id}`,{headers})
      .subscribe({
        next: (resp : any) => {
          console.log(resp);
          this.teachers= resp
        }
        ,
        error: (err: any) => {
          console.log(err);
        }
      })
  }
}
