import { Component } from '@angular/core';
import { Notice } from '../../../models/notice.model';
import { NoticeService } from '../../../services/notice.service';
import { CommonService } from '../../../services/common.service';
import { Timetable } from '../../../models/timetable.model';
import { TeacherService } from '../../teacher.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-teacher-dashboard',
  templateUrl: './teacher-dashboard.component.html',
  styleUrl: './teacher-dashboard.component.css'
})
export class TeacherDashboardComponent {

  notices: Notice[];
  day_of_week:string;
  todays_timetable:Observable<Timetable[]>;

  constructor(private noticeService: NoticeService,private commonService: CommonService,private teacherService: TeacherService) {
    this.noticeService.getAllNotices().subscribe(notices => this.notices = notices);
    this.day_of_week=commonService.todaysDay();
    this.todays_timetable=teacherService.getTimetable(1,this.day_of_week);
   
  }
  isNoticeExpired(expiry_date:string):boolean {
    if(!expiry_date){
      return false;
    }
    const today=new Date();
    const expiry=new Date(expiry_date);
    return today>expiry;
  }

}
