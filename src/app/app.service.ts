import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Core } from '@grapecity/activereports';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  report!: Core.Rdl.Report;

  constructor() {}

  getReport() {
    return this.report
  }

  setReport(report: Core.Rdl.Report) {
    this.report = report
  }
}
