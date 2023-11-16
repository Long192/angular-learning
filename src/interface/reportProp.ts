export type reportSection = {
  Name: string;
  Type?: 'Continuous';
  Page: Page;
};

export type Page = {
  PageWidth: string;
  PageHeight: string;
  TopMargin?: string;
  LeftMargin?: string;
  RightMargin?: string;
  BottomMargin?: string;
  Columns?: number;
  ColumnSpacing?: string;
};
