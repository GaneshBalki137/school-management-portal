import { Component,OnInit,ElementRef,ViewChild } from '@angular/core';
import { StudentService } from '../../../services/student.service';
import { Student } from '../../../models/student.model';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-student',
  templateUrl: './admin-student.component.html',
  styleUrl: './admin-student.component.css'
})
export class AdminStudentComponent implements OnInit {
  students: Student[] = []; 
  selectedClassId: number = 1; // defualt class 5
  toggleAddStudent:boolean =false; 

  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender:string;
  address: string;
  phoneNumber: string;
  email: string;
  className: number;
  addmissionDate: string;

  //selectedClassIdToUpdate: number = 1;
  showUpdateForm: boolean = false;
  rollNo:number;
  updateFirstName: string;
  updateLastName: string;
  updateAddress: string;
  updateDob: string;
  updateGender: string;
  updatePhoneNumber: string;
  updateEmail: string;
  updateClassId: number;

  constructor(private studentService: StudentService, private http: HttpClient,private router: Router,
              private route: ActivatedRoute, private authService: AuthService) { }

  //key : number;
  student: Student;
  ngOnInit(): void {
    // this.key = 1;
    // this.route.queryParams.subscribe(params => {
    //   this.key = params['key'];
      
    //});
    this.getStudents(this.selectedClassId);
  }

  ngAfterViewInit(): void {
    console.log("afterViewInit")
     
  }
  
  // get student details
  getStudents(class_id: number):void {
    // this.selectedClassId = class_id;
    // this.temp_class_id= parseInt(class_id.toString(), 10) + 4;
    this.className=class_id;
    this.studentService.getStudentsById(class_id)
      .subscribe (data =>{
        this.students = data;
      })
  }

  // add student
  addStudent(){

    this.toggleAddStudent=!this.toggleAddStudent;
      const newStudent:Student={
        student_id:1,
        first_name:this.firstName,
        last_name:this.lastName,
        date_of_birth:this.dateOfBirth,
        gender:this.gender,
        address: this.address,
        phone_number:this.phoneNumber,
        email:this.email,
        addmission_date:this.addmissionDate,
        class_id:this.className 
      }
      console.log("object sending: "+newStudent.addmission_date);

    let headers = this.authService.getTokenForHeader();
    this.http.post<Student[]>('http://127.0.0.1:3000/add_student',newStudent , { headers })
     .subscribe({
      next: (resp : any) => {
        console.log("RESPONSE:"+resp);
        this.students = resp
      }
      ,
      error: (err: any) => {
        console.log("ERROR:"+err);
      }
    }
     )
  }

  // extractCookieValue(cookieName: string): string | null {
  //   const cookies = document.cookie.split(';');
  //   for (let i = 0; i < cookies.length; i++) {
  //     const cookie = cookies[i].trim();
  //     if (cookie.startsWith(cookieName + '=')) {
  //       return cookie.substring(cookieName.length + 1);
  //     }
  //   }
  //   return null;
  // }

  onAddStudentClick(): void {
   this.toggleAddStudent=!this.toggleAddStudent;
  }
  onCancelClick(){
    this.toggleAddStudent=!this.toggleAddStudent;
  }

  updateStudent(student:Student){
    console.log("inside updateStudent:" + student.student_id);
    this.showUpdateForm = !this.showUpdateForm;

    this.rollNo = student.student_id;
    this.updateFirstName = student.first_name;
    this.updateLastName = student.last_name;
    this.updateDob = student.date_of_birth;
    this.updateGender = student.gender;
    this.updateAddress = student.address;
    this.updatePhoneNumber = student.phone_number;
    this.updateEmail = student.email;
    this.updateClassId = student.class_id;
  }
  updateStudentForm(): void {
    this.showUpdateForm = !this.showUpdateForm;
    const updateStudent: Student = {
      student_id: this.rollNo,
      first_name: this.updateFirstName,
      last_name: this.updateLastName,
      date_of_birth: this.updateDob,
      gender: this.updateGender,
      address: this.updateAddress,
      phone_number: this.updatePhoneNumber,
      email: this.updateEmail,
      class_id: this.updateClassId
    };
    console.log("student_id and class_id: "+ updateStudent.student_id, updateStudent.class_id)
    this.studentService.updateStudent(updateStudent.student_id, updateStudent)
      .subscribe({
        next: (resp: any) => {
          console.log("RESPONSE--"+resp);
          this.students = resp
          this.showUpdateForm = false;
        },
        error: (err: any) => {
          console.log(err);
        }
      });
  }

  toggleUpdateForm(): void {
    this.showUpdateForm = !this.showUpdateForm;
  }


  // delete student
  confirmDelete(studentId: number, classId: number) {
    if (window.confirm('Are you sure you want to delete this student?')) {
      this.deleteStudent(studentId, classId);
    }
  }

  deleteStudent(student_id: number,class_id:number){
    console.log("id:" + student_id, "class_id:" + class_id);
    this.studentService.deleteStudent(student_id,class_id)
      .subscribe(data => {  
        this.getStudents(this.selectedClassId);
      })
  }
}
