import { Component, OnInit } from '@angular/core';
import { SubjectService } from '../../../services/subject.service';
import { ScheduleService } from '../../../services/schedule.service';
import { Timetable } from '../../../models/timetable.model';
import { Subject } from '../../../models/subject.model';
import { HttpClient } from '@angular/common/http';
import { Teacher } from '../../../models/teacher.model';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css']
})
export class ScheduleComponent implements OnInit {

  subjects: any[] = []; // Array to store subjects
  selectedClassId: string = '1'; // Selected class ID
  selectedSubjectId: number ; // Selected subject ID
  selectedSubjectName: string ;
  selectedDayOfWeek: string = ''; // Selected day of week
  selectedTimeSlot: string = ''; // Selected time slot
  classes: string[] = ["1","2","3","4","5","6","7","8","9","10"];
  teachers:any;
  selectedTeacherId: number;
  constructor(private subjectService: SubjectService, private scheduleService: ScheduleService, 
              private http: HttpClient, private authService: AuthService) { }

  ngOnInit(): void {
    // Fetch classes on component initialization
  }

  // Fetch subjects based on selected class
  fetchSubjects() {
    console.log('Fetch subjects: '+ this.selectedClassId)
    this.subjectService.getSubjectByClassId(parseInt(this.selectedClassId)).subscribe((response: any) => {
      this.subjects = response;
    }, (error) => {
      console.error('Error fetching subjects:', error);
    });
  }

  selectedSubjectData(combinedValue: string){
    const values = combinedValue.split('|'); 
    const subjectId = values[0];
    const otherValue = values[1];
    this.selectedSubjectId = parseInt(subjectId);
    this.selectedSubjectName = otherValue; 
    this.getTeacherBySubId(this.selectedSubjectId)
  }

  getTeacherBySubId(subject_id: number){
    let headers = this.authService.getTokenForHeader();
    this.http.get<any[]>(`http://127.0.0.1:3000/get_teacher_by_sub_id/${subject_id}`,{headers})
    .subscribe((response: any) => {
      console.log("Teacher data: "+response);
      this.teachers=response;
      this.selectedTeacherId=this.teachers.teacher_id;
    }, (error) => {
      console.error('Error fetching subjects:', error);
    });;
  }
  // Add selected schedule to the backend
  addToSchedule() {
    const scheduleData :Timetable= {
      timetable_id:1,
      day_of_week: this.selectedDayOfWeek,
      start_time: this.selectedTimeSlot,
      end_time: (parseInt( this.selectedTimeSlot)+1).toString(),
      subject_name: this.selectedSubjectName,
      class_id: parseInt(this.selectedClassId),
      subject_id: parseInt(this.selectedSubjectId.toString()),
      teacher_id: this. selectedTeacherId
    };
    console.log("selectedSubject :"+scheduleData.subject_id)

    this.scheduleService.addToSchedule(scheduleData).subscribe((response: any) => {
      console.log('Schedule added successfully:', response);
      // Optionally, reset form fields after successful addition
      this.selectedClassId = '';
      this.selectedSubjectId = 0;
      this.selectedDayOfWeek = '';
      this.selectedTimeSlot = '';
    }, (error) => {
      console.error('Error adding schedule:', error);
    });
  }

  selectedTeacher(teacher_id:number){

  }
}