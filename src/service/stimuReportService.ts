import { Injectable } from '@angular/core';
import { stiReportServiceParams } from 'src/types/stimulsoftReportParameter';
import { Stimulsoft } from 'stimulsoft-reports-js/Scripts/stimulsoft.reports';

export class StimuReportService {
  report: Stimulsoft.Report.StiReport
  stiReportParams: stiReportServiceParams
  // designer: Stimulsoft.Designer.StiDesigner

  constructor(stiReportParams: stiReportServiceParams) {
    // this.designer = designer
    this.stiReportParams = stiReportParams
    this.report = new Stimulsoft.Report.StiReport()
    this.createTable()
  }

  createTable(){
    this.createHeader()
  }

  createHeader(){
    const headerBand = new Stimulsoft.Report.Components.StiGroupHeaderBand()
    headerBand.width = 10
    headerBand.height = 2
    this.report.pages.getByIndex(0).components.add(headerBand)
  }
}
