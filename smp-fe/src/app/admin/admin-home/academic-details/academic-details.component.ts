import { Component } from '@angular/core';
import { Student } from '../../../models/student.model';

@Component({
  selector: 'app-academic-details',
  templateUrl: './academic-details.component.html',
  styleUrl: './academic-details.component.css'
})
export class AcademicDetailsComponent {
  selectedStudent: Student;

  constructor() { }

  // Method to handle selection of student
  onStudentSelected(student: Student) {
    this.selectedStudent = student;
  }
}
