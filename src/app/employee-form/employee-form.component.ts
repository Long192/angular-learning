import { Component, inject, OnInit } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomValidationService } from '../../service/CustomValidationService';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { createEmployee } from 'src/slices/EmployeeSlice';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../components/dialog/dialog.component';
import employeeFormJson from '../../assets/employeeForm.json';

@Component({
  selector: 'app-employee-form',
  templateUrl: './employee-form.component.html',
  styleUrls: ['./employee-form.component.scss'],
})
export class EmployeeFormComponent implements OnInit {
  routerParams = inject(ActivatedRoute);
  validationService = inject(CustomValidationService);

  formJson = employeeFormJson;

  data = new Observable({} as any);
  // employeeForm: FormGroup = new FormGroup({
  //   Code: new FormControl('', [Validators.required]),
  //   Name: new FormControl('', [Validators.required]),
  //   BirthDate: new FormControl('', [Validators.required]),
  //   GenderName: new FormControl('', [Validators.required]),
  //   Email: new FormControl('', [Validators.email]),
  //   Mobile: new FormControl('', [Validators.pattern('^[0-9]*$'), Validators.maxLength(11), Validators.minLength(10)]),
  //   Address: new FormControl('', []),
  //   FirstWorkingDate: new FormControl('', []),
  //   ResignDate: new FormControl('', [this.validationService.dateRangeValidator('FirstWorkingDate')]),
  // });

  employeeForm: FormGroup = this.employeeFormBuilder.group({});

  constructor(
    private employeeFormBuilder: FormBuilder,
    private router: Router,
    private store: Store<{ employee: { listEmployee: any } }>,
    private dialog: MatDialog
  ) {
    this.validationService.setMessage({});
  }

  createForm(controll: any[]) {
    controll.forEach(item => {
      const addValidator: any = [];
      if (item.validators && Array.isArray(item.validators) && item.validators.length) {
        item.validators.forEach((validateItem: any) => {
          switch (validateItem.rule) {
            case 'dateRangeValidator':
              addValidator.push(this.validationService.dateRangeValidator(validateItem.validateParam));
              break;
            case 'required':
              addValidator.push(Validators.required);
              break;
            case 'email':
              addValidator.push(Validators.email);
              break;
            case 'maxlength':
              addValidator.push(Validators.maxLength(validateItem.validateParam));
              break;
            case 'minlength':
              addValidator.push(Validators.minLength(validateItem.validateParam));
              break;
            case 'pattern':
              addValidator.push(Validators.pattern(validateItem.validateParam));
              break;
          }
        });
      }
      this.employeeForm.addControl(item.name, this.employeeFormBuilder.control(item.value, addValidator));
    });
  }

  getFormMessage() {
    return employeeFormJson.reduce((store, item) => {
      const validators = item.validators?.map((validatorItem: any) => ({
        [validatorItem.rule]: validatorItem.message,
      }));
      return {
        ...store,
        [item.name]: validators?.reduce(
          (store: any, current: any) => ({
            ...store,
            ...current,
          }),
          {}
        ),
      };
    }, {});
  }

  toEmployeeList() {
    this.router.navigate(['/']);
  }

  openDialog() {
    this.dialog.open(DialogComponent);
  }

  submitAndCreateEmployee() {
    if (!this.employeeForm.valid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    this.store.dispatch(createEmployee(this.employeeForm.getRawValue()));
    this.openDialog();
  }

  manualValidate() {
    const from = this.employeeForm && this.employeeForm.controls['FirstWorkingDate'].value;
    const to = this.employeeForm && this.employeeForm.controls['ResignDate'].value;
    if (from && to) {
      this.employeeForm.controls['ResignDate'].updateValueAndValidity();
    }
  }

  ngOnInit(): void {
    this.getFormMessage();
    this.validationService.setMessage(this.getFormMessage());
    this.createForm(employeeFormJson);
  }
}
