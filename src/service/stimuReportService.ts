import { Component } from '@angular/core';
import { stiReportServiceParams } from 'src/types/stimulsoftReportParameter';
import { Stimulsoft } from 'stimulsoft-reports-js/Scripts/stimulsoft.reports';

export class StimuReportService {
  report: Stimulsoft.Report.StiReport;
  stiReportParams: stiReportServiceParams;
  private top = 0;
  private pageWidth = 29.7;
  defaultHeight = 0.6;
  // designer: Stimulsoft.Designer.StiDesigner

  constructor(stiReportParams: stiReportServiceParams) {
    // this.designer = designer
    this.stiReportParams = stiReportParams;
    this.report = new Stimulsoft.Report.StiReport();
    this.createTable();
  }

  createTable() {
    this.report.pages.getByIndex(0).orientation = Stimulsoft.Report.Components.StiPageOrientation.Landscape;
    this.createDataSource();
    this.createStyle();
    this.createHeader();
    this.createGroup();
    this.createBody();
    this.createFotter();

    this.pageWidth = this.pageWidth + 2;
    this.report.pages.getByIndex(0).pageWidth = this.pageWidth;
    this.report.pages.getByIndex(0).pageHeight = this.pageWidth / 1.4142;
  }

  private createHeader() {
    const headerBand = new Stimulsoft.Report.Components.StiHeaderBand();
    this.report.pages.getByIndex(0).components.add(headerBand);
    const levelList = this.stiReportParams.column.filter((item: any) => item.level).map((item: any) => item.level);
    const rows: Stimulsoft.Report.Components.StiText[] = [];
    const maxLevel = Math.max(...(levelList.length ? levelList : [0]));

    rows.push(...this.getHeaderByLevelList(maxLevel));
    headerBand.height = this.top;
    rows.forEach(item => {
      headerBand.components.add(item);
      item.setComponentStyle('header');
    });
  }

  private createDataSource() {
    const dataSource = new Stimulsoft.System.Data.DataSet('DataSource');
    dataSource.readJson(this.stiReportParams.dataSource);
    this.report.regData('DataSource', 'DataSource', dataSource);
    this.report.dictionary.synchronize();
  }

  private createBody() {
    let left = 0;
    const dataBand = new Stimulsoft.Report.Components.StiDataBand();
    this.report.pages.getByIndex(0).components.add(dataBand);
    dataBand.height = 0.6;
    dataBand.dataSourceName = 'root';
    const bodyCells = this.getBindingList().map(item => {
      let cell;
      const dataType = this.getDataType(item.dataType, item.format);
      if (dataType?.value === 'boolean' || item.type === 'checkbox') {
        cell = new Stimulsoft.Report.Components.StiCheckBox();
        cell.checked = `{root.${item.binding}}`;
      } else {
        cell = new Stimulsoft.Report.Components.StiText();
        cell.text = `{root.${item.binding}}`;
        dataType && (cell.textFormat = dataType.format);
      }
      cell.height = this.defaultHeight;
      cell.width = this.pxToCm(item.width - 10 || 100);
      cell.left = left;
      left += cell.width;
      return cell;
    });

    bodyCells.forEach(item => {
      dataBand.components.add(item);
      item.setComponentStyle('body');
    });
  }

  createStyle() {
    const style = this.stiReportParams.style.dynamix;
    Object.keys(style).forEach(item => {
      const styleComponent = new Stimulsoft.Report.Styles.StiStyle();
      styleComponent.name = item;
      styleComponent.border = new Stimulsoft.Base.Drawing.StiBorder(
        Stimulsoft.Base.Drawing.StiBorderSides.All,
        Stimulsoft.System.Drawing.Color.black,
        1,
        Stimulsoft.Base.Drawing.StiPenStyle.Solid,
        false,
        4,
        new Stimulsoft.Base.Drawing.StiSolidBrush(Stimulsoft.System.Drawing.Color.black),
        false
      );
      style[item].forEach((element: any) => {
        switch (element.reportProperty) {
          case 'Border':
        }
      });
      this.report.styles.add(styleComponent);
    });
  }

  createFotter() {
    const fotter = new Stimulsoft.Report.Components.StiFooterBand();
    fotter.height = this.defaultHeight;
    this.report.pages.getByIndex(0).components.add(fotter);
    const fotterRow = this.createAggregateRow(this.stiReportParams.style.common.fotterText);
    fotterRow.forEach((item: Stimulsoft.Report.Components.StiText) => {
      fotter.components.add(item);
      item.setComponentStyle('fotter');
    });
  }

  private createGroup() {
    if (!this.stiReportParams.group || !this.stiReportParams.group.length) {
      return;
    }

    this.stiReportParams.group.forEach(item => {
      const aggregateRow = this.createAggregateRow(`{root.${item}}`);
      const headerBand = new Stimulsoft.Report.Components.StiGroupHeaderBand();
      headerBand.condition = `{root.${item}}`;
      headerBand.height = this.defaultHeight;
      this.report.pages.getByIndex(0).components.add(headerBand);

      aggregateRow.forEach((element: Stimulsoft.Report.Components.StiText) => {
        headerBand.components.add(element);
        element.setComponentStyle('group');
      });
    });
  }

  private createAggregateRow(aggregateText: string) {
    let meetAggregate = false,
      left = 0;
    const bindingList = this.getBindingList();
    return bindingList.reduce((storage, current) => {
      if (!storage.length) {
        const text = new Stimulsoft.Report.Components.StiText();
        text.height = this.defaultHeight;
        text.width = this.pxToCm(current.width - 10 || 100);
        text.left = left;
        text.text = aggregateText;
        left += text.width;
        return [text];
      }

      if (current.aggregate) {
        meetAggregate = true;
      }

      if (meetAggregate) {
        meetAggregate = false;
        const text = new Stimulsoft.Report.Components.StiText();
        text.height = this.defaultHeight;
        text.width = this.pxToCm(current.width - 10 || 100);
        text.left = left;
        text.text = `{${current.aggregate.charAt(0).toUpperCase()}${current.aggregate.slice(1)}(root.${
          current.binding
        })}`;
        left += text.width;
        return [...storage, text];
      }

      storage[storage.length - 1].width += this.pxToCm(current.width - 10 || 100);
      left += this.pxToCm(current.width - 10 || 100);

      return storage;
    }, []);
  }

  private getBindingList(): any[] {
    let bindingList: any = this.stiReportParams.column.filter((item: any) => !item.level);

    const levelList = this.stiReportParams.column.filter((item: any) => item.level);

    let maxLevel = Math.max(...(levelList.map((item: any) => item.level) || 0));

    for (maxLevel; maxLevel > 0; maxLevel--) {
      bindingList.forEach((item: any, index: number) => {
        if (item.group) {
          const itemList = levelList.filter(
            (levelItem: any) => levelItem.level === maxLevel && item.group === levelItem.parent
          );
          bindingList.splice(index, 1, ...itemList);
        }
      });
    }

    return bindingList;
  }

  private getHeaderByLevelList(maxLevel: number) {
    const rows: Stimulsoft.Report.Components.StiText[] = [];
    let rowLength = 0;
    this.top = (maxLevel + 1) * this.defaultHeight;
    let pageWidth = 0;
    let prevCell: any[] = [];

    for (let index = 0; index <= maxLevel; index++) {
      let left = 0;
      const rowItem = this.stiReportParams.column.filter((item: any) =>
        index === 0 ? !item.level : item.level === index
      );
      const cells = rowItem.reduce((storage: any[], current: any, cellIndex) => {
        console.log(current.width - 10);
        const cell = {
          value: current.header || current.binding,
          width: this.pxToCm(current.width - 10 || 100),
          height: this.defaultHeight,
          level: current.level,
          group: current.group || null,
          left,
        };

        if (current.colSpan) {
          if (current.group) {
            const childCells = this.stiReportParams.column.filter((item: any) => item.parent === current.group);
            cell.width = childCells.reduce(
              (cellWidth: any, currentChildCell: any) => cellWidth + this.pxToCm(currentChildCell.width || 100),
              0
            );

            if (current.colSpan > childCells.length) {
              cell.width += (current.colSpan - childCells.length) * this.pxToCm(100);
            }
          } else {
            cell.width = cell.width * current.colSpan;
          }
        }

        if (current.rowSpan) {
          cell.height = cell.height * current.rowSpan;
        }

        if (index === 0) {
          pageWidth += cell.width;
          left += cell.width;
        } else {
          const childList = this.stiReportParams.column.filter(item => item.parent === current.parent);
          const childIndex = childList.findIndex(
            item => (item.header && item.header === current.header) || (item.binding && item.binding == current.binding)
          );

          cell.left = prevCell.find(item => item.group === current.parent).left;

          childList.forEach((element, index) => {
            if (index >= childIndex) {
              return;
            }

            cell.left += this.pxToCm(element.width || 100 * (element.colSpan || 1));
          });
        }

        return [...storage, cell];
      }, []);

      prevCell = cells;

      rows.push(...this.createRow(cells, this.defaultHeight * index));

      index === 0 ? (rowLength = cells.length) : null;
    }

    this.pageWidth < pageWidth && (this.pageWidth = pageWidth + 2);

    return rows;
  }

  private createRow(cells: any[], top: number) {
    return cells.map(element => {
      const textbox = new Stimulsoft.Report.Components.StiText();
      textbox.text = element.value;
      textbox.width = element.width;
      textbox.height = element.height;
      textbox.left = element.left;
      textbox.top = top;
      return textbox;
    });
  }

  private pxToCm(px: number) {
    return px * 0.0264583333;
  }

  private getDataType(key: number | string, formatReg: any) {
    const dataType = [
      { key: 1, value: 'string', format: new Stimulsoft.Report.Components.TextFormats.StiGeneralFormatService() },
      {
        key: 2,
        value: 'number',
        format: new Stimulsoft.Report.Components.TextFormats.StiCustomFormatService(formatReg),
      },
      {
        key: 3,
        value: 'boolean',
        format: new Stimulsoft.Report.Components.TextFormats.StiBooleanFormatService(formatReg),
      },
      {
        key: 4,
        value: 'date',
        format: new Stimulsoft.Report.Components.TextFormats.StiDateFormatService(formatReg || 'DD/MM/YYYY'),
      },
    ];

    return dataType.find(item => item.key === key || item.value === key);
  }
}
