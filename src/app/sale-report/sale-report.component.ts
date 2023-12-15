import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { DesignerComponent, ViewerComponent } from '@grapecity/activereports-angular';
import { Core } from '@grapecity/activereports';
import { Store } from '@ngrx/store';
import { AppService } from '../app.service';

@Component({
  selector: 'app-sale-report',
  templateUrl: './sale-report.component.html',
  styleUrls: ['./sale-report.component.scss'],
})
export class SaleReportComponent implements OnInit {
  @ViewChild(DesignerComponent, { static: true }) reportDesigner!: DesignerComponent;
  @ViewChild(ViewerComponent, { static: true }) reportViewer!: ViewerComponent;

  designerHidden = true;
  firstPreview = true;
  definition!: Core.Rdl.Report;

  exportsSettings = {
    pdf: {
      title: 'ActiveReportsJS Sample',
      author: 'GrapeCity',
      subject: 'Web Reporting',
      keywords: 'reporting, sample',
      userPassword: 'pwd',
      ownerPassword: 'ownerPwd',
      printing: 'none',
      copying: true,
      modifying: true,
      annotating: true,
      contentAccessibility: true,
      documentAssembly: true,
      pdfVersion: '1.4',
      autoPrint: true,
      filename: 'ActiveReportsJS-Sample.pdf',
    },
    html: {
      title: 'ActiveReportsJS Sample',
      filename: 'ActiveReportsJS-Sample.html',
      autoPrint: true,
      multiPage: true,
      embedImages: 'external',
      outputType: 'html',
    },
  };

  availableExports = ['pdf', 'html', 'tabular-data'];

  constructor(
    private store: Store<{ report: any }>,
    private appService: AppService
  ) {}

  updateToolbar() {
    const designButton = {
      key: '$desingerButton',
      text: 'Open Designer',
      iconCssClass: 'mdi mdi-pencil',
      enable: true,
      action: () => {
        this.designerHidden = false;
        this.reportDesigner.report = {
          definition: this.definition,
          displayName: 'report',
        };
      },
    };

    this.reportViewer.toolbar.addItem(designButton);

    this.reportViewer.toolbar.updateLayout({
      default: [
        '$desingerButton',
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

  onReportPreview = (report: any) => {
    if (this.firstPreview) {
      this.updateToolbar();
      this.firstPreview = false;
    }

    this.designerHidden = true;
    this.reportViewer.open(report.definition);

    return Promise.resolve();
  };

  onSaveReport = (info: any) => {
    console.log(JSON.stringify(info.definition));
    return Promise.resolve({ displayName: 'report' });
  };

  onSaveAsReport = (info: any) => {
    console.log(JSON.stringify(info.definition));
    return Promise.resolve({ id: 'report', displayName: 'report' });
  };

  onInitViewer() {
    this.updateToolbar();
    this.reportViewer.open(this.definition);
  }

  ngOnInit() {
    this.definition = this.appService.getReport();
  }
}
