/// <reference lib="webworker" />

// import { PdfExport } from '@grapecity/activereports';
// import { Worksheet } from 'exceljs';
import { ExceljsService } from 'src/service/ExceljsService';
import { excelParameter } from 'src/types/exceljsServiceParameter';

addEventListener('message', ({ data }) => {
  createExcel(data)
    .xlsx.writeBuffer()
    .then((buffer: any) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      postMessage(url);
    });
});

const createExcel = (params: excelParameter) => {
  const excel = new ExceljsService(params);
  excel.createSheet();
  return excel.workbook;
};
