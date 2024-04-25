import { Component } from '@angular/core';
import { Student } from '../../../../models/student.model';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-student',
  templateUrl: './add-student.component.html',
  styleUrl: './add-student.component.css'
})
export class AddStudentComponent {
  constructor(private http: HttpClient, private router: Router){}

  students: Student[] = []; 

  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender:string;
  address: string;
  phoneNumber: string;
  email: string;
  className: number;
  addmissionDate: string;

  addStudent(){

    //this.toggleAddStudent=!this.toggleAddStudent;
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
    
    this.http.post<Student[]>('http://127.0.0.1:3000/add_student',newStudent)
     .subscribe({
      next: (resp : any) => {
        console.log("RESPONSE--"+resp);
        this.router.navigate(['/students'], { queryParams: { key: resp.class_id } });
      }
      ,
      error: (err: any) => {
        console.log("ERROR--"+err);
      }
    }
     )
  }

}
