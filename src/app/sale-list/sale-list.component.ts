import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import * as wjGrid from '@grapecity/wijmo.grid';
import * as wjInput from '@grapecity/wijmo.input';
import * as wjCore from '@grapecity/wijmo';
import { Store } from '@ngrx/store';
import { SaleService } from 'src/service/SaleService';
import { ReportService } from 'src/service/ReportService';
import { MergeManagerService } from 'src/service/MergeManagerService';
import { AppService } from '../app.service';
import { comparator } from 'src/utils/constantVar';
import { ExceljsService } from 'src/service/ExceljsService';

@Component({
  selector: 'app-sale-report',
  templateUrl: './sale-list.component.html',
  styleUrls: ['./sale-list.component.scss'],
})
export class SaleListComponent implements OnInit, OnDestroy {
  @ViewChild('reportGrid', { static: true }) reportGrid!: wjGrid.FlexGrid;
  @ViewChild('pdfViewer') pdfViewer!: ElementRef;
  @ViewChild('style') styleDiv!: ElementRef;
  @ViewChild('gridNavigate') gridNavigate!: wjInput.CollectionViewNavigator;

  dataSource: any;
  column: any;
  hiddenButton = true;
  groupCellElement!: HTMLElement;
  report!: ReportService;
  gridHeight!: string;
  rawColumn!: any;
  collectionView = new wjCore.CollectionView([], {
    pageSize: 100,
    groupDescriptions: [],
  });

  constructor(
    private router: Router,
    private store: Store<{ report: any }>,
    private appService: AppService,
    private saleService: SaleService
  ) {}

  async initGrid(data: any) {
    this.reportGrid.headersVisibility = wjGrid.HeadersVisibility.Column;
    this.reportGrid.initialize({
      itemsSource: this.collectionView,
      autoGenerateColumns: false,
    });

    console.log(data.style.common.fotterText);

    this.reportGrid.alternatingRowStep = data.style.common.alternateStep || 0;
    const groupDes = data.collumnGroup.map((item: string) => new wjCore.PropertyGroupDescription(item));
    this.collectionView.groupDescriptions.push(...groupDes);

    this.reportGrid.columnFooters.rows.push(new wjGrid.GroupRow());
    this.reportGrid.autoRowHeights = true;
    this.reportGrid.mergeManager = new MergeManagerService(
      0,
      this.reportGrid.columnFooters.columns.findIndex(item => item.aggregate) - 1
    );
    this.reportGrid.columnFooters.setCellData(0, 0, data.style.common.fotterText);

    this.reportGrid.formatItem.addHandler((sender: wjGrid.FlexGrid, event: wjGrid.FormatItemEventArgs) => {
      this.formatItemByRule(sender, event);
      this.addClass(event);
    });

    this.reportGrid.groupHeaderFormat = '{value}';
  }

  addClass(event: wjGrid.FormatItemEventArgs) {
    event.cell.classList.add(`grid-dnx-class-${this.column.style.common.key}-cell`);
    switch (event.panel.cellType) {
      case wjGrid.CellType.ColumnHeader:
        event.cell.classList.add(`grid-dnx-class-${this.column.style.common.key}-header`);
        break;
      case wjGrid.CellType.Cell:
        if (event.panel.rows[event.row] instanceof wjGrid.GroupRow) {
          event.cell.classList.add(`grid-dnx-class-${this.column.style.common.key}-group`);
          break;
        }
        event.cell.classList.add(`grid-dnx-class-${this.column.style.common.key}-body`);

        if (event.cell.classList.contains('wj-alt')) {
          event.cell.classList.add(`grid-dnx-class-${this.column.style.common.key}-alt`);
        }

        break;
      case wjGrid.CellType.ColumnFooter:
        event.cell.classList.add(`grid-dnx-class-${this.column.style.common.key}-fotter`);
    }
  }

  getGridHeight() {
    return this.gridHeight || 'auto';
  }

  formatItemByRule(sender: wjGrid.FlexGrid, event: wjGrid.FormatItemEventArgs) {
    const item = this.column.rules.find((item: any) => item.key === event.getColumn().binding);
    const defaultCondition =
      item && event.panel.cellType === wjGrid.CellType.Cell && !event.cell.classList.contains('wj-group');

    if (
      defaultCondition &&
      comparator[item.operation](sender.getCellData(event.row, event.col, false), item.compareValue)
    ) {
      if (item.property.includes('style')) {
        const property = item.property.replace('style.', '');
        event.cell.classList.add(`grid-dnx-class-${property}-${item.key}`);
      } else {
        (event.cell[item.property as keyof HTMLElement] as any) = item.value;
      }
    }
  }

  getRandomDate(from: Date, to: Date) {
    return new Date(to.getTime() + Math.random() * (to.getTime() - from.getTime()));
  }

  randomBool(): Boolean {
    return Math.random() >= 0.5;
  }

  getData() {
    this.saleService.getSaleData().subscribe(data => {
      const newData = data.map((item: any) => ({
        ...item,
        Date: new Date(item.Date),
        Quantity: item.Quantity * 1000,
      }));
      this.collectionView.sourceCollection = newData;
      this.dataSource = newData;
      this.gridNavigate.cv = this.collectionView;
      this.gridNavigate.headerFormat = 'Page {currentPage:n0} of {pageCount:n0}';
      this.gridNavigate.byPage = true;
    });
  }

  async getColumn() {
    // const data = await fetch('../../assets/saleReportColumn.json').then(res => res.json());

    this.saleService.getSaleColumn().subscribe(data => {
      this.rawColumn = JSON.parse(JSON.stringify(data.columns));

      let maxLevel = Math.max(...data.columns.filter((item: any) => item.level).map((item: any) => item.level));

      let newColumnList: any[] = [];

      for (maxLevel; maxLevel > 0; maxLevel--) {
        const listItemLevel = data.columns.filter((item: any) => item.level && item.level == maxLevel);

        newColumnList = data.columns.map((columnItem: any) => {
          delete columnItem.rowSpan;
          delete columnItem.colSpan;
          delete columnItem.checkBox;
          delete columnItem.type;
          delete columnItem.date;

          if (!columnItem.group) {
            return columnItem;
          }

          listItemLevel.forEach((item: any) => {
            if (columnItem.group === item.parent) {
              const { parent, level, group, ...newObj } = item;
              columnItem.columns ? columnItem.columns.push(newObj) : (columnItem.columns = new Array(newObj));
            }
          });

          const { group, ...newItem } = columnItem;

          return newItem;
        });
      }

      this.reportGrid.columnGroups = newColumnList.filter(item => !item.level);
      this.initGrid(data);
      this.gridHeight = data.style.common.gridHeight;

      this.generrateStyle({ rules: data.rules, style: data.style });
      this.column = {
        columnGroup: data.collumnGroup,
        columns: newColumnList.filter(item => !item.level),
        rules: data.rules,
        style: data.style,
      };
    });
  }

  async toReportPage() {
    this.reportGrid.scrollIntoView(0, 0);
    this.reportGrid.isDisabled = true;

    await this.createReport(false);

    this.appService.setReport(this.report.report);

    this.router.navigate(['/sale-report']);
  }

  async dowloadReport(exportFromJson: boolean) {
    if (!exportFromJson) {
      this.reportGrid.scrollIntoView(0, 0);
      this.reportGrid.isDisabled = true;
    }

    // if (typeof Worker !== 'undefined') {
    //   // Create a new
    //   const worker = new Worker(new URL('../../worker/sale-workder.worker.ts', import.meta.url));
    //   worker.onmessage = ({ data }) => {
    //     console.log(`page got message: ${data}`);
    //   };
    //   worker.postMessage('hello');
    // } else {
    //   // Web workers are not supported in this environment.
    //   // You should add a fallback so that your program still executes correctly.
    // }

    await this.createReport(exportFromJson);

    const pdf = await this.report.export();

    const blobFile = URL.createObjectURL(pdf);

    const iframe = this.pdfViewer.nativeElement;

    iframe.src = blobFile;

    iframe.onload = async () => {
      await iframe.contentWindow?.print();
      URL.revokeObjectURL(blobFile);
    };

    this.reportGrid.isDisabled = false;
  }

  async createReport(renderFromColumnJson: boolean) {
    if (!this.report) {
      if (!this.reportGrid.cells.getCellElement(0, 0)) {
        await this.sleep(1000);
      }
      this.reportGrid.select(-1, -1);
      this.report = new ReportService(this.reportGrid, {
        reportName: 'Sale Report',
        reportSectionName: 'Sale Report Section',
        title: 'Phân tích bán hàng',
        subTitle: 'ngày 06/11/2023',
        tableName: 'sale list',
        companyName: 'CÔNG TY THƯƠNG MẠI BRAVO',
        address: 'Tầng 7 tòa 311-313 Trường Chinh, Thanh Xuân, Hà Nội',
        Page: {
          PageHeight: '10in',
          PageWidth: '12.5in',
          LeftMargin: '0.25in',
          RightMargin: '0.25in',
        },
        dataSource: {
          dataSourceName: 'SaleData',
          data: this.dataSource,
        },
        reportSectionWidth: '12in',
        rules: this.column.rules,
        renderFromColumnJson,
        style: this.column.style,
        columnJson: this.rawColumn,
        group: this.column.columnGroup,
      });
    }
  }

  async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generrateStyle(column: any) {
    const styleList = column.rules.filter((item: any) => item.property.includes('style'));

    Object.keys(column.style.dynamix).forEach((item: any) => {
      const style = document.createElement('style');
      let styleClass = `.grid-dnx-class-${column.style.common.key}-${item} { `;
      style.type = 'text/css';
      column.style.dynamix[item].forEach((styleItem: any) => {
        if (styleItem.gridProperty) {
          styleClass = styleClass.concat(`${styleItem.gridProperty} : ${styleItem.value} !important ; `);
        }
      });
      styleClass += '}';

      style.innerHTML = styleClass;

      this.styleDiv.nativeElement.appendChild(style);
    });

    styleList.forEach((item: any) => {
      const property = item.property.replace('style.', '');
      const style = document.createElement('style');
      style.type = 'text/css';
      style.innerHTML = `.grid-dnx-class-${property}-${item.key} {${property} : ${item.value} !important}`;

      this.styleDiv.nativeElement.appendChild(style);
    });
  }

  async ngOnInit() {
    this.reportGrid.beginUpdate();
    this.getData();
    this.getColumn();
    // this.generrateStyle();
    this.reportGrid.endUpdate();
    this.reportGrid.autoSizeRows();
    this.hiddenButton = false;

    setTimeout(() => {
      const test = new ExceljsService({
        dataSource: this.dataSource,
        column: this.rawColumn
      });

      test.createSheet()

      test.workbook.xlsx.writeBuffer().then((buffer: any) => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        // const url = URL.createObjectURL(blob)
        // console.log(url)
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        a.download = "test.xlsx";
        a.style.display = 'none';
        document.body.appendChild(a);

        a.click();
      });
    }, 5000);
  }

  ngOnDestroy(): void {
    this.reportGrid.dispose();
  }
}
