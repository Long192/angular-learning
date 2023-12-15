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
    const headerRow = [];
    const firstRow = this.contructParam.column
      .filter((item: any) => !item.level)
      .reduce((storage: any, current: any) => {
        if (current.colSpan) {
          return [...storage, current, ...new Array(current.colSpan - 1).fill('')];
        }

        return [...storage, current];
      }, []);
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
          console.log(`${row}${index + 1}`, `${row}${index + cell.rowSpan}`);
          sheet.mergeCells(`${row}${index + 1}`, `${row}${index + cell.rowSpan}`);
        }
      });
    });
  }

  indexToAlphabet(index: number) {
    if (index >= 0 && index <= 25) {
      return String.fromCharCode('A'.charCodeAt(0) + index);
    } else {
      // Handle out-of-range indices or other errors
      return null;
    }
  }
}
