import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { DesignerComponent, ViewerComponent } from '@grapecity/activereports-angular';
import * as activeReportCore from '@grapecity/activereports';
import { createReportSection, createTable } from 'src/utils/commonFunc';

@Component({
  selector: 'app-sale-report',
  templateUrl: './sale-report.component.html',
  styleUrls: ['./sale-report.component.scss'],
})
export class SaleReportComponent implements OnInit {
  @ViewChild(DesignerComponent, { static: true }) reportDesigner!: DesignerComponent;
  @ViewChild(ViewerComponent, { static: true }) reportViewer!: ViewerComponent;

  designerHidden = false;
  firstPreview = true;

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  updateToolbar() {
    const designButton = {
      key: '$desingerButton',
      text: 'Open Designer',
      iconCssClass: 'mdi mdi-pencil',
      enable: true,
      action: () => {
        this.designerHidden = true;
        this.changeDetectorRef.detectChanges();
      },
    };

    this.reportViewer.toolbar.addItem(designButton);

    this.reportViewer.toolbar.updateLayout({
      default: [
        '$openDesigner',
        '$split',
        '$navigation',
        '$split',
        '$refresh',
        '$split',
        '$history',
        '$split',
        '$zoom',
        '$fullscreen',
        '$split',
        '$print',
        '$split',
        '$singlepagemode',
        '$continuousmode',
        '$galleymode',
      ],
    });
  }

  onReportPreview(report: any) {
    if ((this.firstPreview = true)) {
      this.updateToolbar();
      this.firstPreview = false;
    }
    return Promise.resolve();
  }

  onSaveReport = (info: any) => {
    console.log(JSON.stringify(info.definition));
    // const reportId = info.id || `NewReport${++this.counter}`;
    // this.reportStorage.set(reportId, info.definition);
    return Promise.resolve({ displayName: 'report' });
  };

  onSaveAsReport = (info: any) => {
    console.log(JSON.stringify(info.definition));
    // const reportId = `NewReport${++this.counter}`;
    // this.reportStorage.set(reportId, info.definition);
    return Promise.resolve({ id: 'report', displayName: 'report' });
  };

  async ngOnInit() {
    console.log('run');
    await fetch('../../assets/reportExample.json')
      .then(res => res.json())
      .then(data => {
        data.ReportSections = createReportSection({
          Name: 'sale report',
          Type: 'Continuous',
          Page: {
            PageWidth: '11in',
            PageHeight: '8.5in',
            RightMargin: '0.5in',
            LeftMargin: '0.5in',
            TopMargin: '0.5in',
            BottomMargin: '0.5in',
            Columns: 1,
            ColumnSpacing: '0.5in',
          },
        });
        data.Page.PageWidth = '11in';
        data.Page.PageHeight = '8in';

        createTable("../../assets/saleReportColumn.json")

        this.reportDesigner.report = {
          displayName: 'saleReport',
          definition: data,
        };
      });
  }
}
