import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { exhaustMap, map } from 'rxjs';
import { EmployeeService } from 'src/service/EmployeeService';
import { getEmployee, getEmployeeSuccess } from 'src/slices/EmployeeSlice';

@Injectable()
export class EmployeeEffect {
  constructor(
    private action$: Actions,
    private employeeService: EmployeeService
  ) {}

  getEmployeeEffect$ = createEffect(() =>
    this.action$.pipe(
      ofType(getEmployee),
      exhaustMap(() => this.employeeService.getListEmployee().pipe(map(emp => getEmployeeSuccess({ data: emp }))))
    )
  );
}
