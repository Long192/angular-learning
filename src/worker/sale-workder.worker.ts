/// <reference lib="webworker" />

// import { PdfExport } from '@grapecity/activereports';
// import { Worksheet } from 'exceljs';
import * as ExcelJs from "exceljs"
import * as Converter from "libreoffice-convert"


addEventListener('message', ({ data }) => {
  // const response = printReport(data);
  const response = `worker response to ${data}`;
  postMessage(response);
});

const printReport = async (report: any) => await report.export();
