import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Chart } from 'chart.js/auto';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-admissions-graph',
  templateUrl: './admissions-graph.component.html',
  styleUrls: ['./admissions-graph.component.css']
})
export class AdmissionsGraphComponent implements OnInit {
  constructor(private http: HttpClient,private authService: AuthService) {}

  ngOnInit(): void {
    this.fetchAdmissionsData();
  }


  
// admission report chart
  fetchAdmissionsData() {
    let headers = this.authService.getTokenForHeader();
    this.http.get<any[]>("http://127.0.0.1:3000/total_admissions_report_for_each_year",{headers})
      .subscribe(
        data => {
          this.renderChart(data);
        },
        error => {
          console.error('Error fetching admissions data:', error);
        }
      );
  }

  renderChart(data: any[]) {
    const years = data.map(entry => entry.year);
    const totalAdmissions = data.map(entry => entry.total_admissions);

    const canvas = document.getElementById('admissions-chart') as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: years,
            datasets: [{
              label: 'Total Admissions',
              data: totalAdmissions,
              fill: false, // Disable fill for line chart
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 2
            }]
          },
          options: {
            scales: {
              y: {
                display: false
              }
            }
          }
        });
      } else {
        console.error('Canvas context is null.');
      }
    } else {
      console.error('Canvas element not found.');
    }
  }
}