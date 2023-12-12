/// <reference lib="webworker" />

// import { PdfExport } from '@grapecity/activereports';

addEventListener('message', ({ data }) => {
  // const response = printReport(data);
  const response = `worker response to ${data}`;
  postMessage(response);
});

const printReport = async (report: any) => await report.export();
