import { Component,OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Student } from '../../../models/student.model';
import { StudentService } from '../../../services/student.service';

@Component({
  selector: 'app-admin-student',
  templateUrl: './admin-student.component.html',
  styleUrl: './admin-student.component.css'
})
export class AdminStudentComponent implements OnInit {
  students: any[] = []; 

  constructor(private studentService: StudentService) { }

  ngOnInit(): void {
    this.getStudents(1);
  }

  getStudents(class_id: number):void {
    this.studentService.getStudentsById(class_id)
      .subscribe (data =>{
        this.students = data;
      })
  }
}
