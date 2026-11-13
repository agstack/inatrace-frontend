import { ValidatorFn } from '@angular/forms';

export interface SimpleValidationScheme<T> {
        validators: ValidatorFn[];
        forceFormControl?: boolean;
        forceExpand?: boolean;
        fields?: Record<string, SimpleValidationScheme<any>>;
        arrayElementValidators?: SimpleValidationScheme<any>;
}
