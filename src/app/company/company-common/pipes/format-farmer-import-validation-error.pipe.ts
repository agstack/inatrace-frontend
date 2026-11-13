import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'formatFarmerImportValidationError',
    standalone: false
})
export class FormatFarmerImportValidationErrorPipe implements PipeTransform {

  transform(value: string): any {
    switch (value) {
      case 'INCORRECT_TYPE':
        return $localize`:@@companyDetail.farmers.import.validationErrors.cellError.type.INCORRECT_TYPE:The value in the cell is of wrong type`;
      case 'REQUIRED':
        return $localize`:@@companyDetail.farmers.import.validationErrors.cellError.type.REQUIRED:The cell cannot be empty`;
      case 'INVALID_VALUE':
        return $localize`:@@companyDetail.farmers.import.validationErrors.cellError.type.INVALID_VALUE:The provided value in the cell is invalid`;
      case 'INVALID_GEODATA':
        return $localize`:@@companyDetail.farmers.import.validationErrors.cellError.type.INVALID_GEODATA:The plot geometry is invalid or the GeoID could not be resolved`;
      default:
        return '/';
    }
  }
}
