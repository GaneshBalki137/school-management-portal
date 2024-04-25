import { Component, OnInit } from '@angular/core';
import { Timetable } from '../../../models/timetable.model';
import { CookieService } from 'ngx-cookie-service';
import { StudentService } from '../../student.service';

@Component({
  selector: 'app-student-timetable',
  templateUrl: './student-timetable.component.html',
  styleUrl: './student-timetable.component.css'
})
export class StudentTimetableComponent implements OnInit {
  timetable: Timetable[]=[];

  constructor(private cookieService: CookieService,private studentService: StudentService) { }

  ngOnInit(): void {
    const userIdString = this.cookieService.get('user_id');
    const student_id = parseInt(userIdString, 10);
    this.studentService.getTimetable(student_id).subscribe(data => {
      this.timetable = data;
      console.log("time table data: "+this.timetable)
    });

      
  }
  getSubjectForDay(day: string, startTime: string): SubjectInfo | NotFound {
    if (!this.timetable) return null;

    const timetableForDay = this.timetable.filter(t => t.day_of_week === day);
    const timetableForTime = timetableForDay.find(t => t.start_time === startTime);
    const ob:NotFound={
      subjectName: "OFF",
      classId: null
    }
    return timetableForTime ? { subjectName: timetableForTime.subject_name, classId: "Class : "+(timetableForTime.class_id) } : ob;
  }
}
interface SubjectInfo {
  subjectName: string;
  classId: string;
}
interface NotFound{
  subjectName: string;
  classId: string;
}