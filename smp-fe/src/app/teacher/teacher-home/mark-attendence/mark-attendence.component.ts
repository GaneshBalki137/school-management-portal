

// import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
// import { CookieService } from 'ngx-cookie-service';
// import { TeacherService } from '../../teacher.service';
// import { Subject } from '../../../models/subject.model';
// import { Observable } from 'rxjs';
// import { Student } from '../../../models/student.model';
// import { Attendance } from '../../../models/attendance.model';
// import { map, tap } from 'rxjs/operators';
// import { Timetable } from '../../../models/timetable.model';
// import { CommonService } from '../../../services/common.service';

// @Component({
//   selector: 'app-mark-attendence',
//   templateUrl: './mark-attendence.component.html',
//   styleUrls: ['./mark-attendence.component.css']
// })
// export class MarkAttendenceComponent implements OnInit {

//   classDropdownOptions: number[] = [];
//   teacher_id: number;
//   selectedClassId: number;
//   selectedSubject: SubjectInfo;
//   selected_class_students: Observable<Student[]>;
//   attendanceRecords: Attendance[] = [];
//   new_subject_id: number;
//   currentDate = new Date();
//   year = this.currentDate.getFullYear();
//   month = (this.currentDate.getMonth() + 1).toString().padStart(2, '0');
//   day = this.currentDate.getDate().toString().padStart(2, '0');
//   formattedDate = `${this.year}-${this.month}-${this.day}`;
//   showSuccessMessage: boolean = false;
//   todays_timetable: Map<number, SubjectInfo[]> = new Map<number, SubjectInfo[]>();

//   constructor(private cookieService: CookieService, private teacherService: TeacherService, private changeDetectorRef: ChangeDetectorRef, private commonServices: CommonService) { }

//   ngOnInit(): void {
//     const userIdString = this.cookieService.get('user_id');
//     const teacher_id = parseInt(userIdString, 10);
//     const day_of_week = this.commonServices.todaysDay();

//     // Fetch subjects for the teacher
//     this.teacherService.getTimetable(teacher_id, day_of_week).pipe(
//       map((timetable: Timetable[]) => {
//         const groupedTimetable = new Map<number, SubjectInfo[]>();

//         timetable.forEach((entry: Timetable) => {
//           const subjectInfo: SubjectInfo = {
//             subject_id: entry.subject_id,
//             subject_name: entry.subject_name,
//             start_time: entry.start_time
//           };

//           if (groupedTimetable.has(entry.class_id)) {
//             groupedTimetable.get(entry.class_id)?.push(subjectInfo);
//           } else {
//             groupedTimetable.set(entry.class_id, [subjectInfo]);
//           }
//         });

//         // Extract class ids and assign them to classDropdownOptions
//         this.classDropdownOptions = Array.from(groupedTimetable.keys());
//         this.todays_timetable = groupedTimetable;
//         return groupedTimetable;
//       })
//     ).subscribe(() => {
//       // Subscription to ensure classDropdownOptions is populated after fetching the timetable
//     });
//   }

//   getSubjectsAndStudents(selectedClassId: number) {
//     this.selected_class_students = this.teacherService.getStudentsByClass(selectedClassId).pipe(
//       tap(students => {
//         const subjects = this.getSubjects(selectedClassId);
//         this.attendanceRecords = students.map(student => ({
//           attendance_id: 0,
//           date: this.formattedDate,
//           status: 'P',
//           class_id: selectedClassId,
//           subject_id: subjects.length > 0 ? subjects[0].subject_id : 0,
//           student_id: student.student_id
//         }));
//       })
//     );
//   }

//   getSubjects(key: number): SubjectInfo[] | undefined {
//     // const currentHour=this.commonServices.currentHour();
//     // return this.todays_timetable.get(key);
//     const currentHour = this.commonServices.currentHour();
//     const subjects = this.todays_timetable.get(key);
//     if (subjects) {
//         return subjects.filter(subject => subject.start_time === currentHour);
//     } else {
//         return undefined;
//     }

//   }

//   onSubjectChange(event: any) {
//     const selectedSubjectId = event.target.value;
//     this.new_subject_id = selectedSubjectId;
//   }

//   getStudentsFromClass() {
//     this.selected_class_students = this.teacherService.getStudentsByClass(this.selectedClassId).pipe(
//       tap(students => {
//         this.attendanceRecords = students.map(student => ({
//           attendance_id: 0,
//           date: this.formattedDate,
//           status: 'P',
//           class_id: this.selectedClassId,
//           subject_id: this.selectedSubject?.subject_id || 0,
//           student_id: student.student_id
//         }));
//       })
//     );
//   }

//   markAttendence(index: number, status: string) {
//     this.attendanceRecords[index].status = status;
//   }

//   resetAttendence(index: number) {
//     this.attendanceRecords[index].status = 'P';
//   }

//   hasStudents(): boolean {
//     return this.selected_class_students !== undefined && this.selected_class_students !== null;
//   }

//   submitAttendance() {
//     this.attendanceRecords.forEach(record => {
//       this.teacherService.submitAttendance(record, this.new_subject_id).subscribe(
//         response => {
//           console.log('Attendance submitted successfully:', response);
//           this.showSuccessMessage = true;
//         },
//         error => {
//           console.error('Error submitting attendance:', error);
//         }
//       );
//     });
//   }
// }

// export interface SubjectInfo {
//   subject_id: number;
//   subject_name: string;
//   start_time: string;
// }


import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { TeacherService } from '../../teacher.service';
import { Timetable } from '../../../models/timetable.model';
import { Observable } from 'rxjs';
import { Student } from '../../../models/student.model';
import { Attendance } from '../../../models/attendance.model';
import { tap } from 'rxjs/operators';
import { CommonService } from '../../../services/common.service';

@Component({
  selector: 'app-mark-attendence',
  templateUrl: './mark-attendence.component.html',
  styleUrls: ['./mark-attendence.component.css']
})
export class MarkAttendenceComponent implements OnInit {

  teacher_id: number;
  selectedClassId: number;
  selected_class_students: Observable<Student[]>;
  attendanceRecords: Attendance[] = [];
  new_subject_id: number;
  
  currentDate = new Date();
  formattedDate: string;
  showSuccessMessage: boolean = false;
  
  current_hour_timetable: Timetable;

  isClass: boolean = false;

  constructor(private cookieService: CookieService, private teacherService: TeacherService, private changeDetectorRef: ChangeDetectorRef, private commonServices: CommonService) { }

  ngOnInit(): void {
    const userIdString = this.cookieService.get('user_id');
    const teacher_id = parseInt(userIdString, 10);
    const day_of_week = this.commonServices.todaysDay();
    this.formattedDate = `${this.currentDate.getFullYear()}-${(this.currentDate.getMonth() + 1).toString().padStart(2, '0')}-${this.currentDate.getDate().toString().padStart(2, '0')}`;

    // Fetch timetable for the current hour
    this.teacherService.getTimeTableByDayAndHour(teacher_id, day_of_week, this.commonServices.currentHour()).subscribe(
      (data) => {
        if (data && data.length > 0) {
          console.log("there is data")
          this.current_hour_timetable = data[0];
          console.log("currentTimetable: "+this.current_hour_timetable)
          this.selectedClassId = this.current_hour_timetable.class_id;
          this.new_subject_id=this.current_hour_timetable.subject_id;
          this.isClass=true;
          this.getSubjectsAndStudents(this.selectedClassId);
        } else {
          // Handle case when no timetable is available for the current hour
          this.isClass=false;
          console.log("there is no data")
          this.selectedClassId = 0;
          this.getSubjectsAndStudents(this.selectedClassId);
        }
      },
      error => {
        this.isClass=false;
        console.error('Error fetching timetable:', error);
        // Handle error
      }
    );
  }

  getSubjectsAndStudents(selectedClassId: number) {
    console.log("this is subject id"+this.new_subject_id)
    this.selected_class_students = this.teacherService.getStudentsByClass(selectedClassId).pipe(
      tap(students => {
        this.attendanceRecords = students.map(student => ({
          attendance_id: 0,
          date: this.formattedDate,
          status: 'P',
          class_id: selectedClassId,
          subject_id: this.new_subject_id,
          student_id: student.student_id
        }));
      })
    );
  }

  markAttendence(index: number, status: string) {
    this.attendanceRecords[index].status = status;
  }

  resetAttendence(index: number) {
    this.attendanceRecords[index].status = 'P';
  }

  hasStudents(): boolean {
    return this.selected_class_students !== undefined && this.selected_class_students !== null;
  }

  submitAttendance() {
    this.attendanceRecords.forEach(record => {
      this.teacherService.submitAttendance(record,this.current_hour_timetable?.subject_id).subscribe(
        response => {
          console.log('Attendance submitted successfully:', response);
          this.showSuccessMessage = true;
        },
        error => {
          console.error('Error submitting attendance:', error);
        }
      );
    });
  }
}
