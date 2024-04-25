import { Component,Output,EventEmitter } from '@angular/core';
import { Student } from '../../../../models/student.model';
import { StudentService } from '../../../../services/student.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from '../../../../models/subject.model';
import { SubjectService } from '../../../../services/subject.service';

@Component({
  selector: 'app-student-list',
  templateUrl: './student-list.component.html',
  styleUrl: './student-list.component.css'
})
export class StudentListComponent {
  @Output() studentSelected = new EventEmitter<Student>();
  students: Student[] = []; 
  selectedStudent: Student;
  subjectsForSelectedClass: Subject[];
  showTable : boolean = false;

  constructor(private studentService: StudentService, private router: Router , private route :ActivatedRoute,
              private subjectService: SubjectService){}

  getStudents(class_id: number){
    // this.subjectService.getSubjectByClassId(class_id)
    //   .subscribe(data => {
    //      this.subjectsForSelectedClass = data;
    //      console.log(this.subjectsForSelectedClass);
    //   })
    this.studentService. getStudentsById(class_id)
      .subscribe(data => {
        this.students = data;
      })
  }

  selectStudent(student: Student) {
    this.studentSelected.emit(student);
  }
}

