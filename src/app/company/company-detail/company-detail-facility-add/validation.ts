import { SimpleValidationScheme } from '../../../../interfaces/Validation';
import { ApiFacility } from '../../../../api/model/apiFacility';
import { UntypedFormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ApiFacilityType } from '../../../../api/model/apiFacilityType';
import { ApiFacilityLocation } from '../../../../api/model/apiFacilityLocation';
import { ApiAddress } from '../../../../api/model/apiAddress';
import { multiFieldValidator } from '../../../../shared/validation';

export const ApiFacilityTypeValidationScheme = {
    validators: [],
    fields: {
        code: {
            validators: []
        },
        id: {
            validators: []
        },
        label: {
            validators: []
        }
    }
} as SimpleValidationScheme<ApiFacilityType>;

export const ApiAddressValidationScheme = {
    forceExpand: true,
    validators: [],
    fields: {
        address: {
            validators: []
        },
        city: {
            validators: []
        },
        country: {
            validators: [Validators.required]
        },
        state: {
            validators: []
        },
        zip: {
            validators: []
        }
    }
} as SimpleValidationScheme<ApiAddress>;

export const ApiFacilityLocationValidationScheme = {
    forceExpand: true,
    validators: [],
    fields: {
        address: ApiAddressValidationScheme,
        latitude: {
            validators: []
        },
        longitude: {
            validators: []
        },
        publiclyVisible: {
            validators: [Validators.required]
        }
    }
} as SimpleValidationScheme<ApiFacilityLocation>;

export const ApiFacilityValidationScheme = {
    forceExpand: true,
    validators: [
        multiFieldValidator(['translations'], (group: UntypedFormGroup) => requiredTranslationsFacility(group), ['required'])
    ],
    fields: {
        name: {
            validators: []
        },
        facilityType: {
            validators: [Validators.required]
        },
        facilityLocation: ApiFacilityLocationValidationScheme,
        isCollectionFacility: {
            validators: [Validators.required]
        },
        translations: {
            validators: [Validators.required]
        },
        isPublic: {
            validators: [Validators.required]
        }
    }
} as SimpleValidationScheme<ApiFacility>;

export function requiredTranslationsFacility(control: UntypedFormGroup): ValidationErrors | null {
    if (!control || !control.value || !control.contains('translations')) {
        return null;
    }
    const translations = control.value['translations'];
    if (translations.length === 0) {
        return {required: true};
    }
    // English translation is required, other are optional
    const englishTranslation = translations.find(t => t.language === 'EN');
    if (!englishTranslation || !englishTranslation.name) {
        return {required: true};
    }
    return null;
}
