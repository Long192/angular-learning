import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Stimulsoft } from 'stimulsoft-reports-js/Scripts/stimulsoft.designer';

// declare var Stimulsoft: any;

@Component({
  selector: 'app-stimu-sale-report',
  templateUrl: './stimu-sale-report.component.html',
  styleUrls: ['./stimu-sale-report.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StimuSaleReportComponent implements OnInit {
  options: any;
	designer: any;

	ngOnInit() {
		console.log('Loading Designer view');

		console.log('Set full screen mode for the designer');
		this.options = new Stimulsoft.Designer.StiDesignerOptions();
		this.options.appearance.fullScreenMode = true;

		console.log('Create the report designer with specified options');
		this.designer = new Stimulsoft.Designer.StiDesigner(this.options, 'StiDesigner', false);

		console.log('Edit report template in the designer');
		this.designer.report = new Stimulsoft.Report.StiReport();

		console.log('Load report from url');
		// this.designer.report.loadFile('/reports/SimpleList.mrt');

		console.log('Rendering the designer to selected element');
		this.designer.renderHtml('designContent');
  }
}
