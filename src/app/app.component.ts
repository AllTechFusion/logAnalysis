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
  globalSearchInput:any
  selectedLogTypeDrpdown:any;
  logTypeDrpdownOptions:any
  Highcharts = Highcharts;
  isFixedHeader = false;
  show: boolean = false;
  chart: any;
  showSearchCriteria: boolean=false;
  loading: boolean = false;

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
finalFilteredLogs:any

  displayedColumns = ['name', 'count'];
  dataSource!: MatTableDataSource<any>;

  logLevelCount:any;
  showChartAndTable :boolean = false;
  
  constructor(private http: HttpClient) { }

  chartOptions:any;

  logsArrayLines:any;
  fromTime: string = "";
  toTime: string = "";
  filteredLogs: any[] = [];

  ngOnInit() {
  //this.logTypeDrpdownOptions=['','FINE','FINER','ERROR','DEBUG','WARN','INFO','TRACE','FATAL']
  this.logTypeDrpdownOptions = [
    { name: 'FINE', checked: false },
    { name: 'FINER', checked: false },
    { name: 'ERROR', checked: false },
    { name: 'DEBUG', checked: false },
    { name: 'WARN', checked: false },
    { name: 'INFO', checked: false },
    { name: 'TRACE', checked: false },
    { name: 'FATAL', checked: false },
  ];
  }
  
  getSelectedLogTypes() {
    const selectedLogTypes = this.logTypeDrpdownOptions
      .filter((option: { checked: any; }) => option.checked)
      .map((option: { name: any; }) => option.name);
  
    this.selectedLogTypeDrpdown = selectedLogTypes.length > 0 ? selectedLogTypes : undefined;
  console.log("this.selectedLogTypeDrpdown ",this.selectedLogTypeDrpdown )
  
  

  }
  
  onFileSelected(event: any): void {
    this.loading = true;
    this.selectedFile = event.target.files[0];
    this.onUpload();

    // console.log(this.selectedFile)

  }

  onUpload(): void {
    this.filteredLogs=[];
    const reader = new FileReader();
    reader.onload = (e) => {
      if (reader.result) {
        this.fileContents = reader.result.toString();
        this.lines = this.fileContents.split('\n');
        this.analyzeLogs();
        this.loading = false; // Hide the loader once analyzeLogs is completed
        // setTimeout(() => {
        //   this.analyzeLogs();
        //   this.loading = false; // Hide the loader once analyzeLogs is completed
        // }, 1000); 
      }
    };
    reader.readAsText(this.selectedFile);
    this.show = true;
    
  }

  //Main method
  analyzeLogsOnUpload() {
    this.analyzeLogs();
  }

    analyzeLogs() {

    const lines = this.fileContents.split("\n");
    const result = [];

    // for (const line of lines) {
    //   const [date, time, logLevel, thread, ...messageParts] = line.split(" ");
    //   const message = messageParts.join(" ");
    //   const json = {
    //     date,
    //     time,
    //     logLevel,
    //     thread,
    //     message
    //   };
    //   result.push(json);
    // }
    let currentLog = '';
// console.log(lines)
    for (const line of lines) {
      // check if the line is a new log entry
      if (line.match(/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2},\d{3}/)) {
        // if there was a previous log entry, add it to the result array
        if (currentLog !== '') {
          result.push(parseLog(currentLog));
        }
        currentLog = line;
      } else {
        currentLog += '\n' + line;
      }
    }
    
    // add the last log entry to the result array
    if (currentLog !== '') {
      result.push(parseLog(currentLog));
    }
    
    function parseLog(logLine:any) {
      const [date, time, logLevel, thread, ...messageParts] = logLine.split(" ");
      const message = messageParts.join(" ");
      return {
        date,
        time,
        logLevel,
        thread,
        message
      };
    }
    
    // the result array will contain an object for each log entry
    // console.log("result",result);
 this.logsArrayLines=result;
    this.logLevelCountPercentage=this.calculateEachLogs(result);
   this.showSearchCriteria=true;
 //   this.chartOptions.series.data=Object.entries(this.logLevelCountPercentage).map(([key, value]) => [key, value]);
  //  console.log("chartOptions",this.chartOptions.series.data)
     

  }

  displayGraph_Presentation(){
    // this.loading=true;
    this.initializeLogPercentageChart();
    this.initializeLogContTable(this.logLevelCount);
    this.showChartAndTable=true;
    // this.loading=false;
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

  
searchLogs(){
  // this.loading=true;
  this.getSelectedLogTypes();
    this.filteredLogs = this.logsArrayLines;
  if(this.checkNullOrUndefined(this.fromTime) || this.checkNullOrUndefined(this.toTime)){
this.searchLogsBetweenTimeRange();
   if(this.checkNullOrUndefined(this.selectedLogTypeDrpdown)){
this.filterByFilterType();
  if(this.checkNullOrUndefined(this.globalSearchInput)){
    this.filterByInputText();
  }

  // console.log("this.filteredLogs log type and input ",this.filteredLogs)
   }
   else{
    if(this.checkNullOrUndefined(this.globalSearchInput)){
      this.filterByInputText();
    }
   }
  


  }
  else{
    if(this.checkNullOrUndefined(this.selectedLogTypeDrpdown)){
      this.filterByFilterType();
        if(this.checkNullOrUndefined(this.globalSearchInput)){
          this.filterByInputText();
        }
      
         }
         else{
          if(this.checkNullOrUndefined(this.globalSearchInput)){
            this.filterByInputText();
          }
         }
        //  console.log("this.filteredLogs log type and input ",this.filteredLogs)

  }
 
  // this.loading=false;

}


    searchLogsBetweenTimeRange() {
      // console.log("selectedrpdwn",this.selectedLogTypeDrpdown,this.globalSearchInput,this.checkNullOrUndefined(this.fromTime),this.toTime)
      if(!this.checkNullOrUndefined(this.fromTime)){

      }
      // this.filteredLogs = this.logsArrayLines.filter((log: any) => {
      //   if ((log==null && log=="" && log==undefined)) {
      //     return false;
      //   }
      //   const logTime = log.date+" "+log.time.split(",")[0];
      //   return logTime >= this.fromTime && logTime <= this.toTime;
      
      // });
      this.filteredLogs = this.logsArrayLines.filter((log: any, index: number) => {
        if ((log==null && log=="" && log==undefined)) {
            return false;
        }
        const logTime = log.date+" "+log.time.split(",")[0];
        
        if (!this.fromTime) {
            this.fromTime = logTime; // Set fromTime if it's not provided
        }
    
        if (!this.toTime && index === this.logsArrayLines.length - 1) {
            return true; // Return all data after fromDate if toTime is not provided
        }
    
        return logTime >= this.fromTime && (!this.toTime || logTime <= this.toTime);
    });
    
   


    }

filterByInputText(){
  
    this.filteredLogs = this.filteredLogs.filter(log => {
      const concatenatedValue = `${log.date} ${log.time} ${log.logLevel} ${log.thread} ${log.message}`; // Add other keys as needed
      return concatenatedValue.toLowerCase().includes(this.globalSearchInput.toLowerCase());
    });
  
}

// filterByFilterType(){
//   this.filteredLogs = this.filteredLogs.filter((log) => {
//     return log.logLevel === this.selectedLogTypeDrpdown;
// });
// }

filterByFilterType() {
  if (this.selectedLogTypeDrpdown && this.selectedLogTypeDrpdown.length > 0) {
    this.filteredLogs = this.filteredLogs.filter((log) => {
      return this.selectedLogTypeDrpdown.includes(log.logLevel);
    });
  }
}
    getFontColor(logLevelC:any){
      if(logLevelC=="ERROR"){
        return 'red'
      }
      else
      return '#212529'  
    }

    //return true if not null
    checkNullOrUndefined(myValue: any){
      if (myValue !== null && myValue !== undefined && myValue !== '' ) {
      return true
      }
      else{
        return false
      }
    }

    copyLogs() {
      const logsContainer = document.querySelector('.logs-body'); // Get the logs container element
      const selection = window.getSelection(); // Get the selection object
  
      if (selection && logsContainer) {
          const range = document.createRange(); // Create a range object
          
          range.selectNode(logsContainer); // Set the range to select the container
  
          selection.removeAllRanges(); // Clear any existing selection
          selection.addRange(range); // Add the range to the selection
          document.execCommand('copy'); // Execute the copy command
          selection.removeAllRanges(); // Clear the selection again
      }
  }
}
