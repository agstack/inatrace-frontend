import { StockProcessingFacilityListComponent } from './stock-processing-facility-list.component';

describe('StockProcessingFacilityListComponent', () => {
  let component: StockProcessingFacilityListComponent;

  beforeEach(() => {
    component = new StockProcessingFacilityListComponent(null as any, null as any, null as any);
  });

  function facility(code: string | null): any {
    return { facilityType: code ? { code } : null };
  }

  function counts(): number[] {
    return [
      component.categoryOne.length,
      component.categoryTwo.length,
      component.categoryThree.length,
      component.categoryFour.length,
      component.categoryFive.length,
      component.categoryOther.length
    ];
  }

  it('keeps the existing grouping for known coffee facility types', () => {
    component.arrangeFacilities([
      facility('WASHING_STATION'),
      facility('STORAGE'),
      facility('HULLING_STATION'),
      facility('GREEN_COFFEE_STORAGE'),
      facility('ROASTED_COFFEE_STORAGE')
    ]);

    expect(counts()).toEqual([1, 1, 1, 1, 1, 0]);
  });

  it('shows facilities with custom facility types', () => {
    component.arrangeFacilities([
      facility('COCOA_COLLECTION_TEST'),
      facility('COCOA_PROCESSING_TEST')
    ]);

    expect(counts()).toEqual([0, 0, 0, 0, 0, 2]);
  });

  it('handles known and custom types in the same list', () => {
    component.arrangeFacilities([
      facility('STORAGE'),
      facility('COCOA_COLLECTION_TEST'),
      facility('DRYING_BED')
    ]);

    expect(counts()).toEqual([1, 1, 0, 0, 0, 1]);
  });

  it('includes a facility without a type in the fallback category', () => {
    component.arrangeFacilities([facility(null)]);

    expect(counts()).toEqual([0, 0, 0, 0, 0, 1]);
  });

  it('clears every category when the list is empty', () => {
    component.arrangeFacilities([facility('STORAGE'), facility('COCOA_COLLECTION_TEST')]);
    component.arrangeFacilities([]);

    expect(counts()).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('does not duplicate facilities when the list is arranged again', () => {
    const facilities = [facility('STORAGE'), facility('COCOA_COLLECTION_TEST')];
    component.arrangeFacilities(facilities);
    component.arrangeFacilities(facilities);

    expect(counts()).toEqual([0, 1, 0, 0, 0, 1]);
  });
});
