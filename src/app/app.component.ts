import { Component, HostListener, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Highcharts from 'highcharts';

import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  Highcharts = Highcharts;
  isFixedHeader = false;
  show: boolean = false;
  chart: any;
  @HostListener('window:scroll', ['$event'])
  onScroll(event: any) {
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.isFixedHeader = scrollPosition >= 100; // adjust this value as needed
  }


  array: string[] = [];
  title = 'logAnalyzer';
  selectedFile!: File;
  fileContents: any;
  lines!: string[];
  logLevelCountPercentage: any;


  displayedColumns = ['name', 'count'];
  dataSource!: MatTableDataSource<any>;

  logLevelCount:any;
  showChartAndTable :boolean = false;
  
  constructor(private http: HttpClient) { }

  chartOptions:any;

  logsArrayLines:any;
  fromTime: string = "";
  toTime: string = "";
  filteredLogs: string[] = [];

  ngOnInit() {
  
  }
  
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
    this.onUpload();

    // console.log(this.selectedFile)

  }

  onUpload(): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (reader.result) {
        this.fileContents = reader.result.toString();
        this.lines = this.fileContents.split('\n');
      }
    };
    reader.readAsText(this.selectedFile);
    this.show = true;
  }

  //Main method
  analyzeLogs() {

    const lines = this.fileContents.split("\n");
    const result = [];

    for (const line of lines) {
      const [date, time, logLevel, thread, ...messageParts] = line.split(" ");
      const message = messageParts.join(" ");
      const json = {
        date,
        time,
        logLevel,
        thread,
        message
      };
      result.push(json);
    }
 //console.log(lines)
 this.logsArrayLines=lines;
    this.logLevelCountPercentage=this.calculateEachLogs(result);
    this.initializeLogPercentageChart();
    this.initializeLogContTable(this.logLevelCount);
    this.showChartAndTable=true;
 //   this.chartOptions.series.data=Object.entries(this.logLevelCountPercentage).map(([key, value]) => [key, value]);
  //  console.log("chartOptions",this.chartOptions.series.data)
     

  }
  initializeLogPercentageChart() {
 // Initialize the chart options
 this.chartOptions = {
  chart: {
    type: 'pie',
    options3d: {
      enabled: true,
      alpha: 45,
      beta: 0
    }
  },
  title: {
    text: 'Percentage of every element'
  },
  plotOptions: {
    pie: {
      allowPointSelect: true,
      cursor: 'pointer',
      depth: 35,
      dataLabels: {
        enabled: true,
        format: '{point.name}: {point.percentage:.1f} %'
      }
    }
  },
  series: [{
    type: 'pie',
    name: 'Percentage',
    data: Object.entries(this.logLevelCountPercentage).map(([key, value]) => [key, value])
  }]
};
}
  calculateEachLogs(param: any) {
    const result = param.reduce((acc: any, obj: any) => {
      const key = obj.logLevel;
      if (acc.hasOwnProperty(key)) {
        acc[key] += 1;
      } else {
        acc[key] = 1;
      }
      return acc;
    }, {});

    const logLev: any = {
      "FINE": 0,
      "FINER": 0,
      "ERROR": 0,
      "DEBUG": 0,
      "WARN": 0,
      "INFO": 0,
      "TRACE": 0,
      "FATAL": 0
    };

    for (const key in result) {
      if (result.hasOwnProperty(key) && logLev.hasOwnProperty(key)) {
        logLev[key] = result[key];
      }
    }
    // console.log(logLev);
     this.logLevelCount=logLev;
    return this.calculatLogPrecentage(logLev);
  }
  initializeLogContTable(logLev:any) {
    const arr = Object.entries(logLev).map(([name, count]) => ({ name, count }));
    this.dataSource = new MatTableDataSource(arr);
    }

  //To calculate log level percentage
  calculatLogPrecentage(logLev: any) {
    const totalCount: any = Object.values(logLev).reduce((acc: any, count) => acc + count, 0);

    const percentages = Object.entries(logLev).reduce((acc: any, [key, count]) => {
      if (typeof count === "number") {
        acc[key] = Math.round(count / totalCount * 100);
        return acc;
      }
    }, {});

   // console.log(percentages);
    return percentages
  }



  //to display searched content

    searchLogsBetweenTimeRange() {
      this.filteredLogs = this.logsArrayLines.filter((log: string) => {
        if ((log==null && log=="" && log==undefined)) {
          return false;
        }
        const logTime = log.split(' ')[0] + ' ' + log.split(' ')[1].split(',')[0];
        return logTime >= this.fromTime && logTime <= this.toTime;
      
      });
//console.log(" this.filteredLogs ",this.filteredLogs )
    }
  

}
