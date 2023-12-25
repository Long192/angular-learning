// import { Injectable } from '@angular/core';
// import { Workbook, Worksheet } from 'exceljs';
import { CellModel, Row, Workbook, Worksheet } from 'exceljs';
import { excelParameter } from 'src/types/exceljsServiceParameter';
import { comparator } from 'src/utils/constantVar';

// Injectable();
export class ExceljsService {
  workbook = new Workbook();
  private constructParam: excelParameter;
  private headerLength = 0;
  private bodylenghth = 0;
  private level = 0;
  private aggragateList: any[] = [];

  constructor(constructParam: excelParameter) {
    this.constructParam = constructParam;
  }

  createSheet() {
    const sheet = this.workbook.addWorksheet('');
    this.createHeader(sheet);
    this.createBody(sheet);
    this.createFotter(sheet);
    this.drawStyle(sheet);
    // sheet.getRow(3).outlineLevel = 1
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
      sheet.getColumn(index + 1).width = item.width / 6.5 || 100 / 6.5;
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

    const convertData = this.convertToExcelData();
    const aggragateData = this.createAggragateRow(convertData);

    // sheet.addRows(data);
    aggragateData.forEach((element: any) => {
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

  createAggragateRow(data: any) {
    const aggragateCells = this.getBindingList()
      .map((item: any, index: number) => {
        if (item.aggregate) {
          return {
            type: item.aggregate,
            field: item.binding,
            cellIndex: index,
          };
        }

        return null;
      })
      .filter((item: any) => item);

    this.aggragateList.forEach(item => {
      const conditionString = item.condition.reduce((storage: string, current: any) => {
        if (storage) {
          storage += ' && ';
        }
        storage += `item.${current.binding}.toString() === "${current.value}"`;
        return storage;
      }, '');

      const groupItem = this.constructParam.dataSource.filter(item => eval(conditionString));

      aggragateCells.forEach((element: any) => {
        data[item.rowIndex][element.cellIndex] = this.caculateAggragate(element.type, groupItem, element.field);
      });
    });

    return data;
  }

  caculateAggragate(type: string, data: any[], field: string) {
    switch (type) {
      case 'Sum':
        return data.reduce((storage: number, current) => {
          storage += current[field];
          return storage;
        }, 0);
      case 'Avg':
        return data.reduce((storage: number, current) => (storage += current[field]), 0) / data.length;
      default:
        return 0;
    }
  }

  convertToExcelData() {
    let conditionArray: any[] = [];
    const bindingList = this.getBindingList();

    const excelData = this.mergeGroup(
      this.groupByFields(this.constructParam.dataSource, this.constructParam.group || [])
    ).map((item, index) => {
      if (item.level) {
        conditionArray[item.level - 1] = {
          binding: item.binding,
          value: item.header,
        };

        const row = new Array(bindingList.length).fill('');
        row[1] = item.header;

        this.aggragateList.push({
          rowIndex: index,
          condition: conditionArray,
        });

        conditionArray = conditionArray.slice(0, item.level - 1 || 1);
        return row;
      }

      return bindingList.map((bindingItem: any) => {
        return item[bindingItem.binding];
      });
    });

    return excelData;
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
    let excelIndex = '';
    while (index >= 0) {
      excelIndex = String.fromCharCode((index % 26) + 65) + excelIndex;
      index = Math.floor(index / 26) - 1;
    }
    return excelIndex;
  }

  getStyle(type: 'header' | 'body' | 'fotter' | 'group' | 'alt', arrayStyle?: any) {
    const styleList = arrayStyle || this.constructParam.style.dynamix[type];
    const style: any = {
      alignment: {
        vertical: 'middle',
        wrapText: true,
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
      font: {
        name: 'Arial',
        size: 11,
        family: 2,
      },
    };
    styleList.forEach((element: any) => {
      switch (element.gridProperty || element.property) {
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
    const bindingList = this.getBindingList();
    const headerStyle = this.getStyle('header');
    const fotterStyle = this.getStyle('fotter');
    const valueFormat = this.constructParam.rule.filter((item: any) => item.property === 'innerText');
    const valueFormatIndex = bindingList
      .map((bindingItem: any, bindingIndex: number) => {
        if (valueFormat.find((ruleItem: any) => ruleItem.key === bindingItem.binding)) {
          return bindingIndex;
        }
        return null;
      })
      .filter((item: any) => item);

    let flagMode = '',
      ruleIndexList: any = [],
      bodyStyle: any = [];
    sheet.eachRow((item: Row, index: number) => {
      let rowHeight = 0;
      let style: any = {};
      if (index <= this.headerLength) {
        flagMode = 'header';
        style = headerStyle;
      } else if (index > this.headerLength && index <= this.bodylenghth) {
        flagMode = 'body';
        bodyStyle = this.getBodyStyle(index);
        style = bodyStyle.style;
        ruleIndexList = bindingList
          .map((bindingItem: any, bindingIndex: number) => {
            if (bodyStyle.ruleStyle.find((ruleItem: any) => ruleItem.key === bindingItem.binding)) {
              return bindingIndex;
            }
            return null;
          })
          .filter((ruleIndex: number) => ruleIndex);
      } else {
        flagMode = 'fotter';
        style = fotterStyle;
      }

      if (!item.model || !item.model.cells) {
        return;
      }

      item.model.cells.forEach((cell: CellModel, cellIndex: number) => {
        const column = sheet.getColumn(this.indexToAlphabet(cellIndex));
        if (cell.text && column && column.width) {
          const height = cell.text.length / column.width;
          rowHeight < height && (rowHeight = height + 0.5);
        }
        const bindingIndex = ruleIndexList.findIndex((indexItem: number) => indexItem === cellIndex);
        const valueFormatBindingIndex = valueFormatIndex.findIndex((indexItem: number) => indexItem === cellIndex);
        let ruleStyle;

        if (
          this.checkBindingIndexCondition(valueFormatBindingIndex) &&
          comparator[valueFormat[valueFormatBindingIndex].operation](
            cell.value,
            valueFormat[valueFormatBindingIndex].compareValue
          )
        ) {
          item.getCell(cellIndex + 1).value = valueFormat[valueFormatBindingIndex].value;
        }

        if (this.checkBindingIndexCondition(bindingIndex)) {
          ruleStyle = bodyStyle.ruleStyle[bindingIndex];
        }

        if (flagMode === 'body' && ruleStyle && comparator[ruleStyle.operation](cell.value, ruleStyle.compareValue)) {
          const mergeStyle = {
            alignment: {
              ...style.alignment,
              ...ruleStyle.property.alignment,
            },
            border: {
              ...style.border,
              ...ruleStyle.property.border,
            },
            fill: {
              ...style.fill,
              ...ruleStyle.property.fill,
            },
            font: {
              ...style.font,
              ...ruleStyle.property.font,
            },
          };
          this.addStyle(item, cellIndex, mergeStyle);
          return;
        }
        this.addStyle(item, cellIndex, style);
      });
    });
  }

  addStyle(row: Row, index: number, style: any) {
    style.alignment && Object.keys(style.alignment).length ? (row.getCell(index + 1).alignment = style.alignment) : {};
    style.border && Object.keys(style.border).length ? (row.getCell(index + 1).border = style.border) : {};
    style.fill && Object.keys(style.fill).length ? (row.getCell(index + 1).fill = style.fill) : {};
    style.font && Object.keys(style.font).length ? (row.getCell(index + 1).font = style.font) : {};
    // row.getCell(index + 1).alignment = style.alignment;
    // row.getCell(index + 1).border = style.border;
    // row.getCell(index + 1).fill = style.fill;
    // row.getCell(index + 1).font = style.font;
  }

  getBodyStyle(index: number) {
    let style;

    if (this.aggragateList.find(item => item.rowIndex === index - (this.headerLength + 1))) {
      return { style: this.getStyle('group'), ruleStyle: [] };
    }

    const ruleStyleList = this.constructParam.rule
      .filter((item: any) => item.property.includes('style'))
      .map((item: any) => {
        const property = item.property.replace('style.', '');
        return {
          key: item.key,
          compareValue: item.compareValue,
          operation: item.operation,
          property: this.getStyle('body', [{ property, value: item.value }]),
        };
      });

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

    return {
      style,
      ruleStyle: ruleStyleList,
    };
  }

  checkBindingIndexCondition(bindingIndex: number | null | undefined) {
    return bindingIndex !== undefined && bindingIndex !== null && bindingIndex >= 0;
  }
  groupByFields(data: any[], fields: string[]) {
    let result: any[] = [],
      temp = { data: result };

    data.forEach((item: any) => {
      fields
        .reduce((storage: any, current: any) => {
          if (!storage[item[current]]) {
            storage[item[current]] = { data: [] };
            storage.data.push({ [current]: item[current], [current + 'list']: storage[item[current]].data });
          }
          return storage[item[current]];
        }, temp)
        .data.push(item);
    });

    return result;
  }

  mergeGroup(data: any[]) {
    let rowData: any[] = [];
    data.forEach(item => {
      const keys = Object.keys(item);
      const findKey = this.constructParam.group?.find(item => keys.includes(item));
      if (findKey && keys.length === 2) {
        rowData.push({ header: item[findKey], level: ++this.level, binding: findKey });
        rowData = rowData.concat(this.mergeGroup(item[findKey + 'list']));
      } else {
        rowData.push(item);
      }
    });
    this.level--;
    return rowData;
  }
}
