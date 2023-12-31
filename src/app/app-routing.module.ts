import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListEmployeeComponent } from './list-employee/list-employee.component';
import { EmployeeFormComponent } from './employee-form/employee-form.component';
import { ReportTestingComponent } from './report-testing/report-testing.component';
import { SaleListComponent } from './sale-list/sale-list.component';
import { SaleReportComponent } from './sale-report/sale-report.component';
import { StimuSaleReportComponent } from './stimu-sale-report/stimu-sale-report.component';

const routes: Routes = [
  { path: '', component: ListEmployeeComponent },
  { path: 'create', component: EmployeeFormComponent },
  { path: 'edit/:id', component: EmployeeFormComponent },
  { path: 'report', component: ReportTestingComponent },
  { path: 'sale', component: SaleListComponent },
  { path: 'sale-report', component: SaleReportComponent },
  { path: 'stimu-sale-report', component: StimuSaleReportComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
