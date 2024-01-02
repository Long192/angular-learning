import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Core } from '@grapecity/activereports';
import { Stimulsoft } from 'stimulsoft-reports-js/Scripts/stimulsoft.reports';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  report!: Core.Rdl.Report;
  stiReport!: Stimulsoft.Report.StiReport

  constructor() {}

  getReport() {
    return this.report
  }

  getStiReport(){
    return this.stiReport
  }

  setReport(report: Core.Rdl.Report) {
    this.report = report
  }

  setStiReport(report: Stimulsoft.Report.StiReport){
    this.stiReport = report
  }
}
