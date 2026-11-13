import { SimpleValidationScheme } from 'src/interfaces/Validation';
import { multiFieldValidator, UndesrcoreAndCapitalsValidator } from 'src/shared/validation';
import { UntypedFormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ApiFacilityType } from '../../../api/model/apiFacilityType';
import { ApiMeasureUnitType } from '../../../api/model/apiMeasureUnitType';
import { ApiProcessingEvidenceType } from '../../../api/model/apiProcessingEvidenceType';
import { ApiSemiProduct } from '../../../api/model/apiSemiProduct';
import { ApiProcessingEvidenceField } from '../../../api/model/apiProcessingEvidenceField';
import { ApiSemiProductTranslation } from '../../../api/model/apiSemiProductTranslation';
import LanguageEnum = ApiSemiProductTranslation.LanguageEnum;
import {ApiProductType} from '../../../api/model/apiProductType';

export const ApiSemiProductValidationScheme = {
  validators: [
      multiFieldValidator(['translations'], (group: UntypedFormGroup) => requiredTranslationsSemiProduct(group), ['required'])
  ],
  fields: {
    id: {
      validators: []
    },
    name: {
      validators: []
    },
    description: {
      validators: []
    },
    measurementUnitType: {
      forceFormControl: true,
      validators: [Validators.required]
    },
    sku: {
      validators: []
    },
    skuendCustomer: {
      validators: []
    },
    buyable: {
      validators: []
    },
    translations: {
      validators: [Validators.required]
    }
  }
} as SimpleValidationScheme<ApiSemiProduct>;

export const ApiProductTypeValidationScheme = {
  validators: [
    multiFieldValidator(['translations'], (group: UntypedFormGroup) => requiredTranslationsProductType(group), ['required'])
  ],
  fields: {
    id: {
      validators: []
    },
    name: {
      validators: []
    },
    code: {
      validators: [Validators.required]
    },
    description: {
      validators: []
    },
    translations: {
      validators: [Validators.required]
    }
  }
} as SimpleValidationScheme<ApiProductType>;

export const ApiFacilityTypeValidationScheme = {
  validators: [],
  fields: {
    id: {
      validators: []
    },
    code: {
      validators: [UndesrcoreAndCapitalsValidator(), Validators.required]
    },
    label: {
      validators: [Validators.required]
    },
  }
} as SimpleValidationScheme<ApiFacilityType>;

export const ApiMeasureUnitTypeValidationScheme = {
  validators: [],
  fields: {
    id: {
      validators: []
    },
    code: {
      validators: [UndesrcoreAndCapitalsValidator(), Validators.required]
    },
    label: {
      validators: [Validators.required]
    },
  }
} as SimpleValidationScheme<ApiMeasureUnitType>;

export const ApiProcessingEvidenceTypeValidationScheme = {
  validators: [
    multiFieldValidator(['translations'], (group: UntypedFormGroup) => requiredTranslationsProcessingTypeField(group), ['required'])
  ],
  fields: {
    id: {
      validators: []
    },
    code: {
      validators: [UndesrcoreAndCapitalsValidator(), Validators.required]
    },
    label: {
      validators: [Validators.required]
    },
    type: {
      validators: [Validators.required]
    },
    mandatory: {
      validators: []
    },
    requiredOnQuote: {
      validators: []
    },
    fairness: {
      validators: []
    },
    provenance: {
      validators: []
    },
    quality: {
      validators: []
    },
    translations: {
      validators: [Validators.required]
    }
  }
} as SimpleValidationScheme<ApiProcessingEvidenceType>;

export const ApiProcessingEvidenceFieldValidationScheme = {
  validators: [
    multiFieldValidator(['translations'], (group: UntypedFormGroup) => requiredTranslationsProcessingEvidenceField(group), ['required'])
  ],
  fields: {
    id: {
      validators: []
    },
    fieldName: {
      validators: [UndesrcoreAndCapitalsValidator(), Validators.required]
    },
    label: {
      validators: [Validators.required]
    },
    mandatory: {
      validators: []
    },
    requiredOnQuote: {
      validators: []
    },
    type: {
      validators: [Validators.required]
    },
    translations: {
      validators: [Validators.required]
    }
  }
} as SimpleValidationScheme<ApiProcessingEvidenceField>;

export function requiredTranslationsSemiProduct(control: UntypedFormGroup): ValidationErrors | null {
  if (!control || !control.value || !control.contains('translations')) {
    return null;
  }
  const translations = control.value['translations'];
  if (translations.length === 0) {
    return { required: true };
  }

  // English translation is required, other are optional
  const englishTranslation = translations.find(t => t.language === LanguageEnum.EN);
  if (!englishTranslation || !englishTranslation.name) {
    return {required: true};
  }
  return null;
}

export function requiredTranslationsProductType(control: UntypedFormGroup): ValidationErrors | null {
  if (!control || !control.value || !control.contains('translations')) {
    return null;
  }
  const translations = control.value['translations'];
  if (translations.length === 0) {
    return { required: true };
  }

  // English translation is required, other are optional
  const englishTranslation = translations.find(t => t.language === LanguageEnum.EN);
  if (!englishTranslation || !englishTranslation.name || !englishTranslation.description) {
    return {required: true};
  }
  return null;
}

export function requiredTranslationsProcessingEvidenceField(control: UntypedFormGroup): ValidationErrors | null {
  if (!control || !control.value || !control.contains('translations')) {
    return null;
  }
  const translations = control.value['translations'];
  if (translations.length === 0) {
    return { required: true };
  }

  // English translation is required, other are optional
  const englishTranslation = translations.find(t => t.language === LanguageEnum.EN);
  if (!englishTranslation || !englishTranslation.label) {
    return {required: true};
  }
  return null;
}

export function requiredTranslationsProcessingTypeField(control: UntypedFormGroup): ValidationErrors | null {
  if (!control || !control.value || !control.contains('translations')) {
    return null;
  }
  const translations = control.value['translations'];
  if (translations.length === 0) {
    return { required: true };
  }

  // English translation is required, other are optional
  const englishTranslation = translations.find(t => t.language === LanguageEnum.EN);
  if (!englishTranslation || !englishTranslation.label) {
    return {required: true};
  }
  return null;
}
