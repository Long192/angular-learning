import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as wjGrid from '@grapecity/wijmo.grid';
import * as wjCore from '@grapecity/wijmo';

@Component({
  selector: 'app-sale-report',
  templateUrl: './sale-report.component.html',
  styleUrls: ['./sale-report.component.scss'],
})
export class SaleReportComponent implements OnInit, OnDestroy {
  @ViewChild('reportGrid', { static: true }) reportGrid!: wjGrid.FlexGrid;

  async initGrid() {
    this.reportGrid.headersVisibility = wjGrid.HeadersVisibility.Column;

    const data = await fetch('../../assets/saleReportData.json')
      .then(res => res.json())
      .then(data =>
        data.Table1.map((item: any) => ({
          ...item,
          Quantity: item.Quantity * 1000,
          date: this.getRandomDate(new Date(2023, 0, 1), new Date()),
          checkBox: this.randomBool(),
        }))
      );

    const column = await fetch('../../assets/saleReportColumn.json').then(res => res.json());

    this.reportGrid.initialize({
      itemsSource: new wjCore.CollectionView(data, {
        groupDescriptions: column.collumnGroup,
      }),
      autoGenerateColumns: false,
      columns: column.columns,
    });

    this.reportGrid.autoSizeRows();
  }

  formatItem() {
    this.reportGrid.formatItem.addHandler((sender: wjGrid.FlexGrid, event: wjGrid.FormatItemEventArgs) => {
      if (event.cell.innerText == '0' && !event.cell.classList.contains('wj-group')) {
        event.cell.innerText = '';
      }
    });
  }

  addGridEvent() {
    this.reportGrid.copied.addHandler((sender: wjCore.Control, event: wjCore.EventArgs) => {
      console.log('controll', sender), console.log('event', event);
    });
  }

  getRandomDate(from: Date, to: Date) {
    return new Date(to.getTime() + Math.random() * (to.getTime() - from.getTime()));
  }

  randomBool(): Boolean {
    return Math.random() >= 0.5;
  }

  ngOnInit(): void {
    this.initGrid();
    this.formatItem();
    this.addGridEvent();
  }

  ngOnDestroy(): void {
    this.reportGrid.dispose();
  }
}
