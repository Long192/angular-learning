import { createAction, createReducer, on, props } from '@ngrx/store';
import data from '../assets/employee.json';

export const initState = {
  employeeList: data.map(item => ({...item, Price: Math.floor(Math.random() * 2000000000)})) as any[],
  // employeeList: fetch("../assets/employee.json").then(res => res.json()).then(data => data) as any,
};

export const createEmployee = createAction('createEmployee', props<{ data: any }>());
export const getEmployee = createAction('getEmployee');
export const getEmployeeSuccess = createAction('getEmployeeSuccess', props<{ data: any }>());

export const selectorEmployee = (state: any) => state.employee;

export const EmployeeReducer = createReducer(
  initState,
  on(createEmployee, (state, action) => {
    const newListEmployee = Object.assign([], state.employeeList);
    newListEmployee.unshift(action);
    return {
      ...state,
      employeeList: newListEmployee,
    };
  }),
  on(getEmployeeSuccess, (state, { data }) => {
    console.log(data);
    return {
      ...state,
      employeeList: data,
    };
  })
);
