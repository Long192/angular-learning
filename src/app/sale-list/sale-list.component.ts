import { Component, ElementRef, OnDestroy, OnInit, Signal, ViewChild } from '@angular/core';
import { signal } from '@angular/core';
import * as wjGrid from '@grapecity/wijmo.grid';
import * as wjInput from '@grapecity/wijmo.input';
import * as wjCore from '@grapecity/wijmo';
import { Store } from '@ngrx/store';
import { setReport } from 'src/slices/ReportSlice';
import { ReportService } from 'src/service/ReportService';
import { Router } from '@angular/router';
import { MergeManagerService } from 'src/service/MergeManagerService';
import { comparator } from 'src/utils/constantVar';

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

  constructor(
    private router: Router,
    private store: Store<{ report: any }>
  ) {}

  async initGrid() {
    const collectionView = new wjCore.CollectionView(this.dataSource, {
      groupDescriptions: this.column.columnGroup,
      pageSize: 100,
    });

    this.gridNavigate.cv = collectionView;
    this.gridNavigate.headerFormat = 'Page {currentPage:n0} of {pageCount:n0}';
    this.gridNavigate.byPage = true;
    this.reportGrid.headersVisibility = wjGrid.HeadersVisibility.Column;
    this.reportGrid.initialize({
      itemsSource: collectionView,
      autoGenerateColumns: false,
      columns: this.column.columns,
    });

    this.reportGrid.columnFooters.rows.push(new wjGrid.GroupRow());
    this.reportGrid.columnFooters.setCellData(0, 0, this.column.style.common.fotterText);
    // this.reportGrid.columnFooters.rows[0].allowDragging = false
    // this.reportGrid.columnFooters.rows[0].allowMerging = true
    this.reportGrid.alternatingRowStep = this.column.style.common.alternateStep || 0;
    this.reportGrid.autoRowHeights = true;
    this.reportGrid.mergeManager = new MergeManagerService(
      0,
      this.reportGrid.columnFooters.columns.findIndex(item => item.aggregate) - 1
    );

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

  async getData() {
    this.dataSource = await fetch('../../assets/saleReportData.json')
      .then(res => res.json())
      .then(data =>
        data.map((item: any) => ({
          ...item,
          Quantity: item.Quantity * 1000,
          Date: new Date(item.Date),
        }))
      );
  }

  async getColumn() {
    const columnResponse = await fetch('../../assets/saleReportColumn.json').then(res => res.json());

    this.rawColumn = JSON.parse(JSON.stringify(columnResponse.columns));

    let maxLevel = Math.max(...columnResponse.columns.filter((item: any) => item.level).map((item: any) => item.level));

    let newColumnList: any[] = [];

    for (maxLevel; maxLevel > 0; maxLevel--) {
      const listItemLevel = columnResponse.columns.filter((item: any) => item.level && item.level == maxLevel);

      newColumnList = columnResponse.columns.map((columnItem: any) => {
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

    this.gridHeight = columnResponse.style.common.gridHeight;

    this.column = {
      columnGroup: columnResponse.collumnGroup,
      columns: newColumnList.filter(item => !item.level),
      rules: columnResponse.rules,
      style: columnResponse.style,
    };
  }

  async toReportPage() {
    this.reportGrid.scrollIntoView(0, 0);
    this.reportGrid.isDisabled = true;

    await this.createReport(false);

    this.store.dispatch(setReport({ report: this.report.report }));

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

  generrateStyle() {
    const styleList = this.column.rules.filter((item: any) => item.property.includes('style'));

    Object.keys(this.column.style.dynamix).forEach((item: any) => {
      const style = document.createElement('style');
      let styleClass = `.grid-dnx-class-${this.column.style.common.key}-${item} { `;
      style.type = 'text/css';
      this.column.style.dynamix[item].forEach((styleItem: any) => {
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
    await this.getData();
    await this.getColumn();
    this.generrateStyle();
    this.initGrid();
    this.reportGrid.endUpdate();
    this.reportGrid.autoSizeRows();
    this.hiddenButton = false;
  }

  ngOnDestroy(): void {
    this.reportGrid.dispose();
  }
}
