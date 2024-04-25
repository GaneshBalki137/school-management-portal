import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Timetable } from '../../../models/timetable.model';
import { TeacherService } from '../../teacher.service';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-teacher-schedule',
  templateUrl: './teacher-schedule.component.html',
  styleUrls: ['./teacher-schedule.component.css']
})
export class TeacherScheduleComponent implements OnInit {
  timetable: Timetable[]=[];

  constructor(private teacherService: TeacherService, private cookieService: CookieService) { }

  ngOnInit(): void {
    const userIdString = this.cookieService.get('user_id');
    const teacher_id = parseInt(userIdString);

    this.teacherService.getTeacherSchedule(teacher_id).subscribe(timetable => {
      this.timetable = timetable;
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
