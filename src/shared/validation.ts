import { AbstractControl, UntypedFormArray, UntypedFormControl, UntypedFormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { cloneDeep } from 'lodash';


// reusable validation function

export function notIsNaNValidator(control: UntypedFormControl): ValidationErrors | null {
    return isNaN(control.value) ? {'NaN': true} : null;
}

export function isNonNegative(control: UntypedFormControl): ValidationErrors | null {
    return !isNaN(control.value) && control.value >= 0 ? null : {negative: true} ;
}

export function percentValidator(control: UntypedFormControl): ValidationErrors | null {
    const val = control.value
    if(!val) return
    if(isNaN(val)) return null
    if(val < 0 || val > 100) return {wrongPercent: true}
    return null
}

export function javaLongOverflow(control: UntypedFormControl): ValidationErrors | null {
    return control.value < -2147483648 || control.value > 2147483647 ? {'longIntOverflow': true} : null;
}


export function validateEmail(email) {
    if(!email) return true
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

export function EmailValidator(): ValidatorFn {
    return (control: AbstractControl): Record<string, any> => {
        return validateEmail(control.value) ? null : {'wrongEmail': true};
    }
}

const urlRegExp = /^(?:(?:https?|ftp):\/\/){1}(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/i;

function validateUrl(url, httpsRequired = true) {
        if(!url) return true
        return urlRegExp.test(url) || (!httpsRequired && urlRegExp.test('https://'+url))
}

export function URLValidator(httpsRequired = true): ValidatorFn {
    return (control: AbstractControl): Record<string, any> => {
        return validateUrl(control.value, httpsRequired) ? null : { 'urlNiValid': true }
    }
}

export function MinLengthArrayValidator(min: number): ValidatorFn {
    return (c: AbstractControl): Record<string, any> => {
        if (c.value.length >= min)
            return null;
        return {'minLengthArray': {length: min}};
    }
}

export function minLengthArrayValidatorForField(field: string, min: number): ValidatorFn {
    return (c: UntypedFormGroup): Record<string, any> => {
        if (!c.get(field)) return null  // silent fail
        const value = c.get(field).value
        if (value.length >= min)
            return null;
        return {'minLengthArray': {length: min}};
    }
}

export function MinLengthArrayValidatorForField(field: string, min: number): ValidatorFn {
    return multiFieldValidator([field], minLengthArrayValidatorForField(field, min), ['minLengthArray'])
}

export function minLengthArrayValidatorForFieldIfField2IsChecked(field: string, field2: string, min: number): ValidatorFn {
    return (c: UntypedFormGroup): Record<string, any> => {
        if (!c.get(field2)) return null // silent fail
        if (!c.get(field2).value) return null
        if (!c.get(field)) return null  // silent fail
        const value = c.get(field).value
        if (value.length >= min)
            return null;
        return {'minLengthArray': {length: min}};
    }
}

export function MinLengthArrayValidatorForFieldIfField2IsChecked(field: string, field2: string, min: number): ValidatorFn {
    return multiFieldValidator([field], minLengthArrayValidatorForFieldIfField2IsChecked(field, field2, min), ['minLengthArray'])
}


export function MaxLengthArrayValidator(max: number): ValidatorFn {
    return (c: AbstractControl): Record<string, any> => {
        if (c.value.length < max)
            return null;
        return {'maxLengthArray': {lenght: max}};
    }
}

export function maxActiveArrayControls(max: number): ValidatorFn {
    return (control: UntypedFormArray): ValidationErrors | null => {
        const active = control.controls.filter((value: UntypedFormGroup) => value.get('active').value).length;
        return active <= max ? null : {
            maxActive: {
                expected: max,
                actual: active
            }
        };
    };
}

function validateUndesrcoreAndCapitals(input) {
  if (!input) return true
  const re = /^[A-Z_0-9]+$/;
  return re.test(String(input));
}

export function UndesrcoreAndCapitalsValidator(): ValidatorFn {
  return (control: AbstractControl): Record<string, any> => {
    return validateUndesrcoreAndCapitals(control.value) ? null : { 'wrongInput': true };
  }
}

export function isEmptyObject(obj) {
    if (!obj) return false;
    for (const key in obj) {
        return false;
    }
    return true;
}

function mergeErrors(control: AbstractControl, parentErrors: any, allParentErrorKeys: string[]) {
    let change = false;

    let mergedErrors = null
    if (control.errors) {
        mergedErrors = cloneDeep(control.errors)
    } else {
        mergedErrors = {}
    }
    for (const key of allParentErrorKeys) {
        if (parentErrors && parentErrors[key]) {
            mergedErrors[key] = parentErrors[key]
            change = true
        } else {
            if (control.errors && control.errors[key]) {
                delete mergedErrors[key]
                change = true;
            }
        }
    }
    if (change) {
        if (isEmptyObject(mergedErrors)) {
            control.setErrors(null)
        } else {
            control.setErrors(mergedErrors)
        }
    }
}


/**
 * Must be attached to the form group, but sets errors on the control(s).
 */

export type FormGroupValidator = (fg: UntypedFormGroup) => ValidationErrors | null;

export function performMultiFieldValidation(fg: UntypedFormGroup, controlNames: string[], validator: FormGroupValidator, allValidatorErrorKeys: string[]): null {
    if (fg == null) return null;
    const errors = validator(fg);
    for (const cn of controlNames) {
        const control = fg.get(cn);
        if (control) {
            mergeErrors(control, errors, allValidatorErrorKeys)
        }
    }
    return null;    // errors not set on group
}

export function multiFieldValidator(controlNames: string[], validator: FormGroupValidator, allValidatorErrorKeys: string[]): ValidatorFn {
    return (control: AbstractControl) => {
        return performMultiFieldValidation(control as UntypedFormGroup, controlNames, validator, allValidatorErrorKeys);
    }
}

function getAge(dateString) {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

export function DateOfBirthForMinimalAge(age: number): ValidatorFn {
    return (control: AbstractControl): Record<string, any> => {
        const date = control.value
        if (!date) return null
        const calcAge = getAge(date)
        if (calcAge < age) return {tooYoung: {age: calcAge, minAge: age}}
        return null
    }
}

export function YearNotInFuture(): ValidatorFn {
    return (control: AbstractControl): Record<string, any> => {
        const year = control.value
        if (!year) return null
        const today = new Date();
        const age = today.getFullYear() - year;
        if (age < 0) return {yearInFuture: true}
        return null
    }
}

export function DateNotInFuture(): ValidatorFn {
    return (control: AbstractControl): Record<string, any> => {
        const dateString = control.value
        if (!dateString) return null
        const date = new Date(dateString)
        const today = new Date()
        const diff = today.getTime() - date.getTime()
        if (diff < 0) {
            return {dateInFuture: true}
        }
        return null
    }
}

export function DateNotInPast(): ValidatorFn {
    return (control: AbstractControl): Record<string, any> => {
        const dateString = control.value
        if (!dateString) return null
        const date = new Date(dateString)
        date.setHours(12)
        const dateStr = date.toISOString().slice(0, 10)
        const today = (new Date())
        today.setHours(12)
        const todayStr = today.toISOString().slice(0, 10)
        if (dateStr < todayStr) {
            return {dateInPast: true}
        }
        return null
    }
}

function functionDatesInOrder(group: UntypedFormGroup, startControlName, endControlName) {
    const start = group.get(startControlName) && group.get(startControlName).value as string
    const end = group.get(endControlName) && group.get(endControlName).value as string
    if (!start || !end) {
        return null
    }
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = endDate.getTime() - startDate.getTime()
    if (diff < 0) {
        return {startLaterThanEnd: true}
    }
    return null
}

export function ListNotEmptyValidator(): ValidatorFn {
    return (control: UntypedFormControl): ValidationErrors | null => {
        return (control.value && control.value.length > 0) ? null : {'required': true};
    }
}

export function DatesInOrder(startControlName, endControlName): ValidatorFn {
    return multiFieldValidator([startControlName, endControlName], (group: UntypedFormGroup) => functionDatesInOrder(group, startControlName, endControlName), ['startLaterThanEnd'])
}

export function mustBeChecked(control: AbstractControl): ValidationErrors | null {
    const checked = control.value
    return checked === true ? null : {notChecked: true}
}

const tagRegex = /(<([^>]+)>)/ig

export function MinLengthHTMLStripped(minLen: number): ValidatorFn {
    return (control: AbstractControl): Record<string, any> => {
        const text = control.value
        if(!text) return null
        const stripped = text.replace(tagRegex, "");
        return stripped.length >= minLen ? null : {minlength: {requiredLength: minLen}}
    }
}

export function requiredFieldIfOtherFieldHasValue(control: UntypedFormGroup, field: string, otherField: string, otherFieldValue: any): ValidationErrors | null {
  if(!control || !control.value) return null;
  const tip = control.value[otherField]
  if(!tip || tip !== otherFieldValue) return null;
  if(!control.value[field]) return {required: true}
  return null;
}



