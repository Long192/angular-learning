export const dataSource = {
  Name: 'DataSource',
  ConnectionProperties: { DataProvider: 'JSON', ConnectString: 'endpoint=http://localhost:4200' },
};

export const employeeDataset = {
  Name: 'Employees',
  Query: { DataSourceName: 'DataSource', CommandText: 'uri=/assets/employee.json;jpath=$.[*]' },
  Fields: [
    { Name: 'Id', DataField: 'Id' },
    { Name: 'Code', DataField: 'Code' },
    { Name: 'ParentId', DataField: 'ParentId' },
    { Name: 'IsGroup', DataField: 'IsGroup' },
    { Name: 'Name', DataField: 'Name' },
    { Name: 'BirthDate', DataField: 'BirthDate' },
    { Name: 'FileNo', DataField: 'FileNo' },
    { Name: 'GenderName', DataField: 'GenderName' },
    { Name: 'Mobile', DataField: 'Mobile' },
    { Name: 'Tel', DataField: 'Tel' },
    { Name: 'Email', DataField: 'Email' },
    { Name: 'Domicile', DataField: 'Domicile' },
    { Name: 'Address', DataField: 'Address' },
    { Name: 'DeptName0', DataField: 'DeptName0' },
    { Name: 'FirstWorkingDate', DataField: 'FirstWorkingDate' },
    { Name: 'ResignDate', DataField: 'ResignDate' },
    { Name: 'BranchCode', DataField: 'BranchCode' },
    { Name: 'IsActive', DataField: 'IsActive' },
    { Name: 'CreatedBy', DataField: 'CreatedBy' },
    { Name: 'CreatedAt', DataField: 'CreatedAt' },
    { Name: 'ModifiedBy', DataField: 'ModifiedBy' },
    { Name: 'ModifiedAt', DataField: 'ModifiedAt' },
    { Name: '_SelectKey__lde9wl', DataField: '_SelectKey__lde9wl' },
    { Name: '_RowNumber__b8dqzh', DataField: '_RowNumber__b8dqzh' },
  ],
};

export const dataSources = [
  {
    id: 'DataSource',
    title: 'DataSource',
    template: dataSource,
    canEdit: false,
    datasets: [{ id: 'Employees', title: 'employee', template: employeeDataset, canEdit: false }],
  },
];
