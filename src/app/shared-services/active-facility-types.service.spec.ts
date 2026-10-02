import { of } from 'rxjs';
import { ApiFacilityType } from '../../api/model/apiFacilityType';
import { FacilityTypeControllerService } from '../../api/api/facilityTypeController.service';
import { ActiveFacilityTypeService } from './active-facility-types.service';
import { CodebookTranslations } from './codebook-translations';

describe('ActiveFacilityTypeService', () => {
  let codebookService: any;
  let service: ActiveFacilityTypeService;

  const facilityTypes: ApiFacilityType[] = [
    { id: 1, code: 'DRY', label: 'Drying bed' },
    { id: 2, code: 'STORE', label: 'Storage' }
  ];

  beforeEach(() => {
    codebookService = jasmine.createSpyObj('FacilityTypeControllerService', ['getFacilityTypeListByMap']);
    codebookService.getFacilityTypeListByMap.and.returnValue(of({
      data: { items: facilityTypes, count: facilityTypes.length }
    }));
    service = new ActiveFacilityTypeService(
      codebookService as FacilityTypeControllerService,
      new CodebookTranslations()
    );
  });

  it('filters facility types by the displayed label, ignoring case', () => {
    service.makeQuery('DRY').subscribe(result => {
      expect(result.results).toEqual([facilityTypes[0]]);
      expect(result.totalCount).toBe(1);
    });

    expect(codebookService.getFacilityTypeListByMap).toHaveBeenCalledWith({ limit: 1000, offset: 0 });
  });

  it('returns all facility types when the search is empty', () => {
    service.makeQuery('').subscribe(result => {
      expect(result.results).toEqual(facilityTypes);
      expect(result.totalCount).toBe(2);
    });
  });
});
