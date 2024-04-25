import { Component, OnInit } from '@angular/core';
import { Student } from '../../../models/student.model';
import { CookieService } from 'ngx-cookie-service';
import { TeacherService } from '../../teacher.service';
import { Grade } from '../../../models/grade.model';
import { Subject } from '../../../models/subject.model'; 

@Component({
  selector: 'app-add-grades',
  templateUrl: './add-grades.component.html',
  styleUrl: './add-grades.component.css'
})
export class AddGradesComponent implements OnInit {
  displayGradeEntryForm: boolean = false;
  selectedStudent: Student;

  classDropdownOptions: number[] = [];

  selectedClassId: number;
  selectedSemester: number;
  teacher_id: number;
  selectedSubject: SubjectInfo;

  selectedClassStudents: Student[];
  newSubjectId: number;
  classes_and_subjects: Map<number, Subject[]> = new Map<number, Subject[]>();

  gradesExist: boolean = false;
  submitGradeMessage: string = "";
  // Declared grade variables
  selectedStudent_quizGrade: number;
  selectedStudent_homeworkGrade: number;
  selectedStudent_testGrade: number;
  selectedStudent_projectGrade: number;

  selectedStudentGrades: Grade;
  constructor(private cookieService: CookieService, private teacherService: TeacherService,) { }

  ngOnInit(): void {
    const userIdString = this.cookieService.get('user_id');
    const teacher_id = parseInt(userIdString, 10);

    this.teacherService.getSubjects(teacher_id).subscribe(data => {
      this.classDropdownOptions = Array.from(data.keys());
      this.selectedClassId = this.classDropdownOptions[0];
      this.classes_and_subjects = data;
      this.getStudentsFromClass();
    });

  }
  openGradeEntryForm(student: Student) {
    this.selectedStudent = student;
    this.displayGradeEntryForm = true;
    this.gradesExist = false;
    this.submitGradeMessage = "";

    if (this.selectedSubject && this.selectedSemester && this.selectedStudent) {

      // Checking if grades exist for the selected subject semester and student
      this.teacherService.getGradesForSubjectSemesterStudent(
        this.newSubjectId,
        this.selectedStudent.student_id,
        this.selectedSemester
      ).subscribe((data) => {
        if (data) {
          this.selectedStudent_quizGrade = data.quiz_grade;
          this.selectedStudent_homeworkGrade = data.homework_grade;
          this.selectedStudent_testGrade = data.test_grade;
          this.selectedStudent_projectGrade = data.project_grade;
          this.gradesExist = true;
          //this.selectedStudentGrades=data;
        } else {
          // If grades don't exist, initialize the form fields with default values
          this.selectedStudent_quizGrade = 0;
          this.selectedStudent_homeworkGrade = 0;
          this.selectedStudent_testGrade = 0;
          this.selectedStudent_projectGrade = 0;
        }
      });
    }

  }


  getSubjects(key: number): Subject[] | undefined {
    return this.classes_and_subjects.get(key);

  }
  getStudentsFromClass() {
    this.teacherService.getStudentsByClass(this.selectedClassId).subscribe(data =>
      this.selectedClassStudents = data
    );
    console.log(this.selectedClassStudents)

  }
  onSubjectChange(event: any) {
    const selectedSubjectId = event.target.value;
    this.newSubjectId = selectedSubjectId;
  }
  submitGrades() {
    console.log("Submit grades");

    const grade: Grade = {
      grade_id: 1,
      semester: parseInt(this.selectedSemester.toString()),
      student_id: parseInt(this.selectedStudent.student_id.toString()),
      subject_id: parseInt(this.newSubjectId.toString()),
      quiz_grade: parseInt(this.selectedStudent_quizGrade.toString()),
      homework_grade: parseInt(this.selectedStudent_homeworkGrade.toString()),
      test_grade: parseInt(this.selectedStudent_testGrade.toString()),
      project_grade: parseInt(this.selectedStudent_projectGrade.toString())
    }


    if (this.gradesExist) {
      console.log("Grade")
      this.teacherService.updateGrades(grade).subscribe(
        (data) => {
          console.log(data);
          this.submitGradeMessage = "Grades updated !";
          //  this.displayGradeEntryForm=false;

        },
        (error) => {
          console.log(error);
          this.submitGradeMessage = "Failed to update grades";
          // this.displayGradeEntryForm=false;
        }
      )

    }
    else {
      console.log("The Grade Data: " + grade)
      console.log(grade.homework_grade)
      this.teacherService.submitGrades(grade).subscribe(
        (data) => {
          console.log(data);
          this.submitGradeMessage = "Grades submitted !";
          this.gradesExist = true;
          //  this.displayGradeEntryForm=false;
        },
        (error) => {
          console.log(error);
          this.submitGradeMessage = "Failed to submit grades";
          //  this.displayGradeEntryForm=false;
        }
      )

    }
  }
}
interface SubjectInfo {
  subject_id: number;
  subject_name: string;
}
