import { Core } from '@grapecity/activereports';

export type constructorReportService = {
  reportName: string;
  reportSectionName: string;
  companyName?: string;
  address?: string;
  title: string;
  subTitle: string;
  tableName: string;
  layers?: Core.Rdl.Layer[];
  Page?: Core.Rdl.Page;
  dataSource: {
    dataSourceName: string;
    data: any;
  };
  reportSectionWidth: string;
  rules: any;
  renderFromColumnJson: boolean;
  style: any;
  columnJson: any;
};

export type columnJson = {
  header?: string;
  binding?: string;
  width?: number;
  aggregate?: string;
  align?: 'left' | 'right' | 'center';
  haveChild?: boolean;
  parrent?: string;
  level?: number;
  colSpan?: number;
  group?: string;
  rowSpan?: number;
  format?: string;
};
