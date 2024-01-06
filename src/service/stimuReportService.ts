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
      this.stiReportParams.style.dynamix.header.find(
        (styleItem: any) => styleItem.reportProperty === 'word-wrap' && styleItem.value !== 'break-word'
      )
        ? (item.wordWrap = false)
        : (item.wordWrap = true);
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
        cell.canGrow = true;
        cell.horAlignment = item.align
          ? Stimulsoft.Base.Drawing.StiTextHorAlignment[
              (item.align.charAt(0).toUpperCase() +
                item.align.slice(1)) as keyof typeof Stimulsoft.Base.Drawing.StiTextHorAlignment
            ]
          : Stimulsoft.Base.Drawing.StiTextHorAlignment.Left;
        dataType && (cell.textFormat = dataType.format);
        this.stiReportParams.style.dynamix.body.find(
          (styleItem: any) => styleItem.reportProperty === 'word-wrap' && styleItem.value !== 'break-word'
        )
          ? (cell.wordWrap = false)
          : (cell.wordWrap = true);
      }
      cell.growToHeight = true;
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
      styleComponent.border = new Stimulsoft.Base.Drawing.StiBorder();
      styleComponent.border.size = 1;
      styleComponent.border.side = Stimulsoft.Base.Drawing.StiBorderSides.All;
      styleComponent.border.color = Stimulsoft.System.Drawing.Color.black;
      styleComponent.border.style = Stimulsoft.Base.Drawing.StiPenStyle.Solid;

      style[item].forEach((element: any) => {
        switch (element.reportProperty) {
          case 'Border':
            this.getBorder(element, styleComponent.border);
            break;
          case 'BorderStyle':
            this.getBorderStyle(element, styleComponent);
            break;
          case 'BorderLeft':
          case 'BorderRight':
          case 'BorderTop':
          case 'BorderBottom':
            this.getBorderSide(element, styleComponent, element.reportProperty.replace('Border', ''));
            break;
        }
      });
      this.report.styles.add(styleComponent);
    });
  }

  getBorder(element: any, styleComponent: Stimulsoft.Base.Drawing.StiBorder | Stimulsoft.Base.Drawing.StiBorderSide) {
    const value = element.value.split(' ');
    value[0] && (styleComponent.size = value[0].replace('px', ''));
    if (value[1]) {
      const key = (value[1].charAt(0).toUpperCase() + value[1].slice(1)).replace('ed', '');
      styleComponent.style =
        Stimulsoft.Base.Drawing.StiPenStyle[key as keyof typeof Stimulsoft.Base.Drawing.StiPenStyle];
    }

    if (value[2] && value[2].includes('#')) {
      const color = value[2].replace('#', '');
      const red = +`0x${color.slice(0, 2)}`;
      const green = +`0x${color.slice(2, 4)}`;
      const blue = +`0x${color.slice(4, 6)}`;
      const alpha = +`0x${color.slice(6, 8)}`;
      alpha
        ? (styleComponent.color = Stimulsoft.System.Drawing.Color.fromArgb(alpha, red, green, blue))
        : (styleComponent.color = Stimulsoft.System.Drawing.Color.fromArgb2(red, green, blue));
    } else if (value[2] && value[2].includes('rgb')) {
      let color: any[] = [];
      const regexPattern = /\brgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/;
      const match = value[2].match(regexPattern);

      if (match) {
        const [, red, green, blue, alpha] = match.map(Number);
        color = alpha !== undefined && !isNaN(alpha) ? [red, green, blue, alpha] : [red, green, blue];

        color.length === 4
          ? (styleComponent.color = Stimulsoft.System.Drawing.Color.fromArgb(
              +color[3],
              +color[0],
              +color[1],
              +color[2]
            ))
          : (styleComponent.color = Stimulsoft.System.Drawing.Color.fromArgb2(+color[0], +color[1], +color[2]));
      }
    } else if (value[2]) {
      const color = Stimulsoft.System.Drawing.Color[value[2] as keyof typeof Stimulsoft.System.Drawing.Color];
      styleComponent.color = color as Stimulsoft.System.Drawing.Color;
    }
  }

  getBorderStyle(element: any, styleComponent: Stimulsoft.Report.Styles.StiStyle) {
    const style = element.value.split(' ');
    if (!style.length) {
      return;
    }

    const penStyle = style.map((styleItem: string) => {
      if (styleItem.includes('ed')) {
        return styleItem.replace('ed', '');
      }
      return styleItem;
    });

    let top, right, bottom, left;
    penStyle[0] &&
      (top =
        right =
        bottom =
        left =
          Stimulsoft.Base.Drawing.StiPenStyle[
            (penStyle[0].charAt(0).toUpperCase() +
              penStyle[0].slice(1)) as keyof typeof Stimulsoft.Base.Drawing.StiPenStyle
          ]);
    penStyle[1] &&
      (left = right =
        Stimulsoft.Base.Drawing.StiPenStyle[
          (penStyle[1].charAt(0).toUpperCase() +
            penStyle[1].slice(1)) as keyof typeof Stimulsoft.Base.Drawing.StiPenStyle
        ]);
    penStyle[2] &&
      (bottom =
        Stimulsoft.Base.Drawing.StiPenStyle[
          (penStyle[2].charAt(0).toUpperCase() +
            penStyle[2].slice(1)) as keyof typeof Stimulsoft.Base.Drawing.StiPenStyle
        ]);
    penStyle[3] &&
      (left =
        Stimulsoft.Base.Drawing.StiPenStyle[
          (penStyle[3].charAt(0).toUpperCase() +
            penStyle[3].slice(1)) as keyof typeof Stimulsoft.Base.Drawing.StiPenStyle
        ]);

    const leftSide = new Stimulsoft.Base.Drawing.StiBorderSide(
      styleComponent.border.color,
      styleComponent.border.size,
      left
    );
    const rightSide = new Stimulsoft.Base.Drawing.StiBorderSide(
      styleComponent.border.color,
      styleComponent.border.size,
      right
    );
    const topSide = new Stimulsoft.Base.Drawing.StiBorderSide(
      styleComponent.border.color,
      styleComponent.border.size,
      top
    );
    const bottomSide = new Stimulsoft.Base.Drawing.StiBorderSide(
      styleComponent.border.color,
      styleComponent.border.size,
      bottom
    );
    styleComponent.border = new Stimulsoft.Base.Drawing.StiAdvancedBorder(topSide, bottomSide, leftSide, rightSide);
  }

  getBorderSide(element: any, styleComponent: Stimulsoft.Report.Styles.StiStyle, side: string) {
    if (!(styleComponent.border instanceof Stimulsoft.Base.Drawing.StiAdvancedBorder)) {
      styleComponent.border = new Stimulsoft.Base.Drawing.StiAdvancedBorder();
    }

    if (styleComponent.border instanceof Stimulsoft.Base.Drawing.StiAdvancedBorder) {
      const switchObj = [
        {
          side: 'Top',
          border: styleComponent.border.topSide,
        },
        {
          side: 'Left',
          border: styleComponent.border.leftSide,
        },
        {
          side: 'Bottom',
          border: styleComponent.border.bottomSide,
        },
        {
          side: 'Right',
          border: styleComponent.border.rightSide,
        },
      ];

      const borderSide = switchObj.find(item => item.side === side);
      if (borderSide) {
        this.getBorder(element, borderSide.border);
      }
    }
  }

  createFotter() {
    const fotter = new Stimulsoft.Report.Components.StiFooterBand();
    fotter.height = this.defaultHeight;
    this.report.pages.getByIndex(0).components.add(fotter);
    const fotterRow = this.createAggregateRow(this.stiReportParams.style.common.fotterText);
    fotterRow.forEach((item: Stimulsoft.Report.Components.StiText) => {
      fotter.components.add(item);
      this.stiReportParams.style.dynamix.fotter.find(
        (styleItem: any) => styleItem.reportProperty === 'word-wrap' && styleItem.value !== 'break-word'
      )
        ? (item.wordWrap = false)
        : (item.wordWrap = true);
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
        this.stiReportParams.style.dynamix.group.find(
          (styleItem: any) => styleItem.reportProperty === 'word-wrap' && styleItem.value !== 'break-word'
        )
          ? (element.wordWrap = false)
          : (element.wordWrap = true);
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
        text.canGrow = true;
        text.growToHeight = true;
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
        text.canGrow = true;
        text.growToHeight = true;
        text.horAlignment = current.align
          ? Stimulsoft.Base.Drawing.StiTextHorAlignment[
              (current.align.charAt(0).toUpperCase() +
                current.align.slice(1)) as keyof typeof Stimulsoft.Base.Drawing.StiTextHorAlignment
            ]
          : Stimulsoft.Base.Drawing.StiTextHorAlignment.Left;
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
      const cells = rowItem.reduce((storage: any[], current: any) => {
        console.log(current.width - 10 || 100);
        const cell = {
          value: current.header || current.binding,
          width: this.pxToCm(current.width - 10 || 100),
          height: this.defaultHeight,
          level: current.level,
          group: current.group || null,
          align: current.align || 'left',
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
      textbox.canGrow = true;
      textbox.growToHeight = true;
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
