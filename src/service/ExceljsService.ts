// import { Injectable } from '@angular/core';
// import { Workbook, Worksheet } from 'exceljs';
import { Workbook, Worksheet } from 'exceljs';
import { excelParameter } from 'src/types/exceljsServiceParameter';

// Injectable();
export class ExceljsService {
  workbook = new Workbook();
  contructParam: excelParameter;

  constructor(contructParam: excelParameter) {
    this.contructParam = contructParam;
  }

  createSheet() {
    const sheet = this.workbook.addWorksheet('');

    this.createHeader(sheet);
  }

  createHeader(sheet: Worksheet) {
    const firstRow = this.contructParam.column
      .filter((item: any) => !item.level)
      .reduce((storage: any, current: any) => {
        if (current.colSpan) {
          return [...storage, current, ...new Array(current.colSpan - 1).fill('')];
        }

        return [...storage, current];
      }, []);

    const headerRow = this.getHeaderRows(firstRow);

    headerRow.forEach(element => {
      sheet.addRow(element.map((item: any) => item.header || item.binding));
    });

    headerRow.forEach((element, index) => {
      element.forEach((cell: any, cellIndex: any) => {
        const col = this.indexToAlphabet(cellIndex);
        if (cell.colSpan) {
          sheet.mergeCells(`${col}${index}`, `${this.indexToAlphabet(cellIndex + cell.colSpan - 1)}${index}`);
        }
        if (cell.rowSpan) {
          const row = this.indexToAlphabet(cellIndex);
          sheet.mergeCells(`${row}${index + 1}`, `${row}${index + cell.rowSpan}`);
        }
        const style = this.getStyle('header');
        sheet.getCell(`${this.indexToAlphabet(cellIndex)}${index + 1}`).fill = style.fill;
        sheet.getCell(`${this.indexToAlphabet(cellIndex)}${index + 1}`).font = style.font;
        sheet.getCell(`${this.indexToAlphabet(cellIndex)}${index + 1}`).alignment = style.alignment;
        sheet.getCell(`${this.indexToAlphabet(cellIndex)}${index + 1}`).border = style.border;
      });
    });
  }

  getHeaderRows(firstRow: any) {
    const headerRow = [];
    const levelList = this.contructParam.column.filter((item: any) => item.level).map((item: any) => item.level);
    headerRow.push(firstRow);

    const maxLevel = Math.max(...(Array.isArray(levelList) && levelList.length ? levelList : [0]));

    let preRow = firstRow;

    if (maxLevel) {
      for (let level = 1; level <= maxLevel; level++) {
        const columnLevelList = this.contructParam.column.filter((item: any) => item.level === level);
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

  getStyle(type: 'header' | 'body' | 'cell' | 'fotter' | 'group' | 'alt') {
    const styleList = this.contructParam.style.dynamix[type];
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
            color: { argb: element.value },
          };
          break;
        case 'background-color':
          style.fill = {
            ...style.fill,
            type: 'pattern',
            pattern: 'solid',
            bgColor: { argb: 'FFF8DC' },
            fgColor: { argb: 'FFF8DC' },
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
}
