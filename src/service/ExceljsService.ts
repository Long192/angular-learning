// import { Injectable } from '@angular/core';
// import { Workbook, Worksheet } from 'exceljs';
import { Row, Workbook, Worksheet } from 'exceljs';
import { excelParameter } from 'src/types/exceljsServiceParameter';

// Injectable();
export class ExceljsService {
  workbook = new Workbook();
  private constructParam: excelParameter;
  private headerLength = 0;
  private bodylenghth = 0;

  constructor(constructParam: excelParameter) {
    this.constructParam = constructParam;
  }

  createSheet() {
    const sheet = this.workbook.addWorksheet('');

    this.createHeader(sheet);
    this.createBody(sheet);
    this.createFotter(sheet);
    this.drawStyle(sheet);
  }

  createHeader(sheet: Worksheet) {
    const firstRow = this.constructParam.column
      .filter((item: any) => !item.level)
      .reduce((storage: any, current: any) => {
        if (current.colSpan) {
          return [...storage, current, ...new Array(current.colSpan - 1).fill('')];
        }

        return [...storage, current];
      }, []);

    const headerRow = this.getHeaderRows(firstRow);
    const bindingList = this.getBindingList();

    this.createRow(headerRow, sheet);

    bindingList.forEach((item: any, index: number) => {
      sheet.getColumn(index + 1).width = item.width / 8 || 12.5;
    });

    this.headerLength = headerRow.length;
  }

  createBody(sheet: Worksheet) {
    const bindingList = this.getBindingList();

    const numberFormatIndex: number[] = [];

    const data = this.constructParam.dataSource.map(item => {
      return bindingList.map((bindingItem: any, index: number) => {
        if (bindingItem.dataType === 2) {
          numberFormatIndex.push(index);
        }
        return item[bindingItem.binding];
      });
    });

    // sheet.addRows(data);
    data.forEach(element => {
      sheet.addRow(element);
      const lastRow = sheet.lastRow;
      if (lastRow) {
        lastRow.alignment = { wrapText: true, vertical: 'middle' };
      }
    });

    data.forEach((element, index) => {
      element.forEach((cell: any, cellIndex: any) => {
        if (numberFormatIndex.includes(cellIndex)) {
          sheet.getCell(`${this.indexToAlphabet(cellIndex)}${index + this.headerLength + 1}`).numFmt = '#,##';
        }
      });
    });

    this.bodylenghth = data.length;
  }

  createRow(rows: any[], sheet: Worksheet, skipIndex: number = 0) {
    rows.forEach(element => {
      sheet.addRow(element.map((item: any) => item.header || item.binding));
    });

    rows.forEach((element, index) => {
      element.forEach((cell: any, cellIndex: any) => {
        const col = this.indexToAlphabet(cellIndex);
        if (cell.colSpan) {
          sheet.mergeCells(
            `${col}${index + skipIndex + 1}`,
            `${this.indexToAlphabet(cellIndex + cell.colSpan - 1)}${index + skipIndex + 1}`
          );
        }
        if (cell.rowSpan) {
          const row = this.indexToAlphabet(cellIndex);
          sheet.mergeCells(`${row}${index + 1 + skipIndex}`, `${row}${index + skipIndex + cell.rowSpan}`);
        }
      });
    });
  }

  createFotter(sheet: Worksheet) {
    const bindingList = this.getBindingList();
    const aggregateRow = bindingList.map((item: any) => {
      if (item.aggregate) {
        (item.colSpan = 0), (item.rowSpan = 0);
        return item;
      }

      return {};
    });

    let prevCell: number = 0;

    aggregateRow[0] = {
      header: this.constructParam.style.common.fotterText,
    };

    aggregateRow.forEach((item: any, index: number) => {
      if (index === 0) return;

      if (item.aggregate) {
        aggregateRow[index].header = this.caculateAggregateRow(item.aggregate, item.binding);
        return;
      }

      aggregateRow[prevCell].colSpan ? aggregateRow[prevCell].colSpan++ : (aggregateRow[prevCell].colSpan = 2);
      aggregateRow[index].header = '';
    });

    this.createRow(
      [
        aggregateRow.map((item: any) => ({
          ...item,
          binding: 0,
        })),
      ],
      sheet,
      this.bodylenghth + this.headerLength
    );
  }

  private caculateAggregateRow(aggregateRow: string, binding: string) {
    switch (aggregateRow) {
      case 'Sum':
      case 'Avg':
        return this.getTotal(aggregateRow, binding);
      case 'Cnt':
        return this.constructParam.dataSource.filter((item: any) => item[binding]).length;
      default:
        return 0;
    }
  }

  private getTotal(aggregate: string, binding: string) {
    const total = this.constructParam.dataSource.reduce((storage: number, current: any) => {
      if (!current[binding]) {
        return storage;
      }

      if (typeof current[binding] !== 'number') {
        throw new Error(`aggregate ${aggregate} requires data to be numeric`);
      }

      return storage + current[binding];
    }, 0);

    if (aggregate === 'Avg') {
      return total / this.constructParam.dataSource.length;
    }

    return total;
  }

  private getBindingList() {
    let bindingList: any = this.constructParam.column.filter((item: any) => !item.level);

    const levelList = this.constructParam.column.filter((item: any) => item.level);

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

  getHeaderRows(firstRow: any) {
    const headerRow = [];
    const levelList = this.constructParam.column.filter((item: any) => item.level).map((item: any) => item.level);
    headerRow.push(firstRow);

    const maxLevel = Math.max(...(Array.isArray(levelList) && levelList.length ? levelList : [0]));

    let preRow = firstRow;

    if (maxLevel) {
      for (let level = 1; level <= maxLevel; level++) {
        const columnLevelList = this.constructParam.column.filter((item: any) => item.level === level);
        let newRow = new Array(firstRow.length).fill('');

        columnLevelList.forEach((item: any, index: number) => {
          const colIndex = preRow.findIndex(
            (IndexItem: any) => IndexItem && IndexItem.group && item.parent === IndexItem.group
          );

          newRow.splice(colIndex + index, 1, item);

          if (level < maxLevel) {
            newRow = newRow.map(item => {
              if (item) {
                item.rowSpan = maxLevel - level;
              }

              return item;
            });
          }
        });

        headerRow.push(newRow);

        preRow = newRow;
      }
    }

    return headerRow;
  }

  indexToAlphabet(index: number) {
    if (index >= 0 && index <= 25) {
      return String.fromCharCode('A'.charCodeAt(0) + index);
    } else {
      throw new Error('out of range');
    }
  }

  getStyle(type: 'header' | 'body' | 'fotter' | 'group' | 'alt') {
    const styleList = this.constructParam.style.dynamix[type];
    const style: any = {
      alignment: {
        vertical: 'middle',
      },
      border: {
        top: {
          style: 'medium',
        },
        left: {
          style: 'medium',
        },
        bottom: {
          style: 'medium',
        },
        right: {
          style: 'medium',
        },
      },
    };
    styleList.forEach((element: any) => {
      switch (element.gridProperty) {
        case 'text-align':
          style.alignment = {
            ...style.alignment,
            horizontal: element.value,
          };
          break;
        case 'font-weight':
          style.font = {
            ...style.font,
            bold: element.value > 400 || element.value === 'bold',
          };
          break;
        case 'color':
          style.font = {
            ...style.font,
            color: { argb: element.value.replace('#', '').toUpperCase() },
          };
          break;
        case 'background-color':
          style.fill = {
            ...style.fill,
            type: 'pattern',
            pattern: 'solid',
            bgColor: { argb: element.value.replace('#', '').toUpperCase() },
            fgColor: { argb: element.value.replace('#', '').toUpperCase() },
          };
          break;
        case 'font-size':
          style.font = {
            ...style.font,
            size: +element.value.replace('px', ''),
          };
          break;
      }
    });
    return style;
  }

  drawStyle(sheet: Worksheet) {
    const colLength = this.getBindingList().length;
    sheet.eachRow((item: Row, index: number) => {
      console.log(item)
      let style: any = {};
      if (index <= this.headerLength) {
        style = this.getStyle('header');
      } else if (index > this.headerLength && index <= this.bodylenghth) {
        if (index % (this.constructParam.style.common.alternateStep + 1) === 0) {
          const altStyle = this.getStyle('alt');
          const bodyStyle = this.getStyle('body');
          style = {
            alignment: {
              ...bodyStyle.alignment,
              ...altStyle.alignment,
            },
            font: {
              ...bodyStyle.font,
              ...altStyle.font,
            },
            border: {
              ...bodyStyle.border,
              ...altStyle.border,
            },
            fill: {
              ...bodyStyle.fill,
              ...altStyle.fill,
            },
          };
        } else {
          style = this.getStyle('body');
        }
      } else {
        style = this.getStyle('fotter');
      }
      for (let forIndex = 0; forIndex < colLength; forIndex++) {
        item.getCell(forIndex + 1).alignment = style.alignment;
        item.getCell(forIndex + 1).border = style.border;
        item.getCell(forIndex + 1).fill = style.fill;
        item.getCell(forIndex + 1).font = style.font;
      }
    });
  }
}
