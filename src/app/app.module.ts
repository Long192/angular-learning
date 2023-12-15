import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MatNativeDateModule, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CustomValidationService } from '../service/CustomValidationService';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ListEmployeeComponent } from './list-employee/list-employee.component';
import { EmployeeFormComponent } from './employee-form/employee-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { dateFormat } from 'src/constant/data';
import { EmployeeReducer } from 'src/slices/EmployeeSlice';
import { DialogComponent } from './components/dialog/dialog.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { WjGridModule } from '@grapecity/wijmo.angular2.grid';
import { WjGridFilterModule } from '@grapecity/wijmo.angular2.grid.filter';
import { WjInputModule } from '@grapecity/wijmo.angular2.input';
import { WjGridGrouppanelModule } from '@grapecity/wijmo.angular2.grid.grouppanel';
import { EffectsModule } from '@ngrx/effects';
// import { EmployeeEffect } from 'src/effect/employeeEffect';
import { EmployeeService } from 'src/service/EmployeeService';
import { ReportTestingComponent } from './report-testing/report-testing.component';
import { AR_EXPORTS, ActiveReportsModule, HtmlExportService, PdfExportService, TabularDataExportService } from '@grapecity/activereports-angular';
import { SaleListComponent } from './sale-list/sale-list.component';
import { SaleReportComponent } from './sale-report/sale-report.component';
import { ReportService } from 'src/service/ReportService';
import { MergeManagerService } from 'src/service/MergeManagerService';
import { SaleService } from 'src/service/SaleService';

@NgModule({
  declarations: [
    AppComponent,
    ListEmployeeComponent,
    EmployeeFormComponent,
    ReportTestingComponent,
    SaleListComponent,
    SaleReportComponent,
  ],
  imports: [
    DialogComponent,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    MatCardModule,
    HttpClientModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatGridListModule,
    WjGridModule,
    WjGridFilterModule,
    WjInputModule,
    WjGridGrouppanelModule,
    ActiveReportsModule,
    StoreModule.forRoot({ employee: EmployeeReducer }),
    // EffectsModule.forRoot([EmployeeEffect])
  ],
  providers: [
    {
      provide: AR_EXPORTS,
      useClass: PdfExportService,
      multi: true,
    },
    {
      provide: AR_EXPORTS,
      useClass: HtmlExportService,
      multi: true,
    },
    {
      provide: AR_EXPORTS,
      useClass: TabularDataExportService,
      multi: true,
    },
    { provide: MAT_DATE_LOCALE, useValue: 'vi-VN' },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
    { provide: MAT_DATE_FORMATS, useValue: dateFormat },
    CustomValidationService,
    EmployeeService,
    SaleService,
    ReportService,
    MergeManagerService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
