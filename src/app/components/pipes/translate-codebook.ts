import { Pipe, PipeTransform } from '@angular/core';
import { CodebookTranslations } from 'src/app/shared-services/codebook-translations';

@Pipe({
    name: 'translateCodebook',
    standalone: false
})
export class TranslateCodebookPipe implements PipeTransform {

  constructor(
    private codebookTranslations: CodebookTranslations
  ) {
  }

  transform(obj: any, field: string): string {
    return this.codebookTranslations.translate(obj, field)
  }


}
