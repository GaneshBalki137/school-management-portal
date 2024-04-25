import { Component, OnInit } from '@angular/core';
import { Notice } from '../../../models/notice.model';
import { NoticeService } from '../../../services/notice.service';
import { StudentService } from '../../student.service';
import { CookieService } from 'ngx-cookie-service';
import { CommonService } from '../../../services/common.service';
import { HttpClient } from '@angular/common/http';
import { Chart, registerables } from 'chart.js/auto';
import { AuthService } from '../../../services/auth.service';
@Component({
  selector: 'app-student-dashboard',
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.css'
})
export class StudentDashboardComponent implements OnInit{
  notices: Notice[];
  todaysScedule: any[]=[];
  current_hour: string;
  selectedSemester:number=1;
  student_id:number = 1;
  pieChart: Chart<"doughnut", number[], string> | null = null;

  constructor(private noticeService: NoticeService,private studentService:StudentService,private cookieService:CookieService,private commonService:CommonService,private http: HttpClient,private authService:AuthService){}
  ngOnInit(): void {
    const userIdString = this.cookieService.get('user_id');
    const student_id = parseInt(userIdString, 10);
    this.student_id = student_id;
    this.current_hour=this.commonService.currentHour()

      this.noticeService.getAllNotices().subscribe(notices => this.notices =notices);
      console.log("Before student")
      this.studentService.getTodaysLecture(student_id).subscribe(schedule => this.todaysScedule = schedule);
      console.log("Todays Schedule"+this.todaysScedule)

      this.fetchData(this.selectedSemester);
  }
  isNoticeExpired(expiry_date:string):boolean {
    if(!expiry_date){
      return false;
    }
    const today=new Date();
    const expiry=new Date(expiry_date);
    return today>expiry;
  }

  renderChart(data: any[]) {
    const labels = data.map(grade => grade.subject_name);
    const averageGrades = data.map(grade => this.calculateAverageGrade(grade));

    const canvas = document.getElementById('chart-options-example1') as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (this.pieChart) {
          // Destroy existing chart if it exists
          this.pieChart.destroy();
        }
        Chart.register(...registerables);
       this.pieChart= new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{
              label: 'Average Grade',
              data: averageGrades,
              backgroundColor: [
                'rgba(255, 99, 132, 0.9)',
                'rgba(54, 162, 235, 0.9)',
                'rgba(255, 206, 86, 0.9)',
                'rgba(75, 192, 192, 0.9)',
                'rgba(153, 102, 255, 0.9)',
                'rgba(255, 159, 64, 0.9)'
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
              ],
              borderWidth: 2,
              hoverOffset: 3
            }]
          }
          // options: {
          //   scales: {
          //     y: {
          //       display: false // Hide y-axis scale
          //     }
          //   }
          // }
        });
      } else {
        console.error('Canvas context is null.');
      }
    } else {
      console.error('Canvas element not found.');
    }
  }
 
  calculateAverageGrade(grade: any): number {
    const totalGrades = grade.quiz_grade + grade.homework_grade + grade.test_grade + grade.project_grade;
    const averageGrade = totalGrades / 4;
    return averageGrade;
  }

  fetchData(sem:number){
    let headers= this.authService.getTokenForHeader();
    let url : string ='';
    if (sem == 1){
      url = `http://127.0.0.1:3000/get_grades_of_sem/${this.student_id}/1`;
      this.selectedSemester=1;

    }
    else if (sem == 2){
      url = `http://127.0.0.1:3000/get_grades_of_sem/${this.student_id}/2`;
      this.selectedSemester=2;
    }

    this.http.get<any[]>(url,{headers})
      .subscribe(
        data => {
          this.renderChart(data);
        },
        error => {
          console.error('Error fetching grades:', error);
        }
      );

  }
}
