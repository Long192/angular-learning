import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import moment from 'moment';

@Injectable()
export class CustomValidationService {
  public message = {};

  public dateRangeValidator =
    (key: string): ValidatorFn =>
    (control: AbstractControl): ValidationErrors | null => {
      if (control.root.value[key]) {
        const endDate = control.value;
        const startDate = control.root.value[key];
        return moment(startDate).isAfter(moment(endDate)) ? { dateRangeValidator: { startDate, endDate } } : null;
      }
      return null;
    };

  public getMessage = (controllName: string, errorKey: string): string => {
    return this.message[controllName as keyof typeof this.message][errorKey as keyof typeof this.message];
  };

  public setMessage = (messageObj: any) => {
    this.message = messageObj;
  };

  public getErrorMessages = (controlName: string, controlForm: AbstractControl): string => {
    const control = controlForm.get(controlName);
    const errorMessages: string[] = [];

    if (control && control.errors) {
      for (const errorKey in control.errors) {
        console.log(errorKey);
        if (control.errors.hasOwnProperty(errorKey)) {
          console.log(this.getMessage(controlName, errorKey));
          errorMessages.push(this.getMessage(controlName, errorKey));
        }
      }
    }

    return errorMessages[0];
  };

  public showErrorCondition = (control: AbstractControl, formKey: string): boolean | undefined =>
    (control.get(formKey)?.invalid && control.get(formKey)?.dirty) || control.get(formKey)?.touched;
}
