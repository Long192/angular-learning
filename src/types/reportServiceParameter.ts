import { Core } from '@grapecity/activereports';

export type constructorReportService = {
  reportName: string;
  reportSectionName: string;
  tableName: string;
  layers?: Core.Rdl.Layer[];
  Page?: Core.Rdl.Page;
  dataSource: {
    dataSourceName: string;
    data: any;
  };
};
