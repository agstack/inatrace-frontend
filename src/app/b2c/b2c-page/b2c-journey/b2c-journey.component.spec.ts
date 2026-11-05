import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { B2cJourneyComponent } from './b2c-journey.component';
import { B2cPageComponent } from '../b2c-page.component';
import { GlobalEventManagerService } from '../../../core/global-event-manager.service';

describe('B2cJourneyComponent', () => {
  let fixture: ComponentFixture<B2cJourneyComponent>;
  let component: B2cJourneyComponent;
  let page: any;

  beforeEach(async () => {
    // The page component that resolved the label and the QR tag, as the journey sees it.
    page = {
      productName: 'Coffee',
      b2cSettings: { primaryColor: '#25265E', headingColor: '#25265E', textFont: null },
      qrTag: 'TAG-1',
      publicProductLabel: {
        fields: [
          { name: 'name', value: 'Label producer' },
          { name: 'journeyMarkers', value: [{ latitude: 1, longitude: 2 }, { latitude: 3, longitude: 4 }] }
        ]
      },
      qrProductLabel: { producerName: 'Cooperative', historyTimeline: undefined }
    };

    await TestBed.configureTestingModule({
      declarations: [B2cJourneyComponent],
      providers: [
        { provide: B2cPageComponent, useValue: page },
        { provide: GlobalEventManagerService, useValue: { loadedGoogleMapsEmitter: new Subject<boolean>() } }
      ],
      // The Google Maps elements are not under test here.
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(B2cJourneyComponent);
    component = fixture.componentInstance;
  });

  it('renders when the label has no history timeline', () => {
    expect(() => fixture.detectChanges()).not.toThrow();

    expect(component.historyItems).toEqual([]);
    expect(component.producerName).toBe('Cooperative');
    // The journey markers from the label still make it onto the map.
    expect(component.markers.length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('li.af-journey').length).toBe(1);
  });

  it('lists the history steps when the timeline is present', () => {
    page.qrProductLabel.historyTimeline = {
      items: [
        { type: 'PROCESSING', name: 'Washing', date: '2026-03-01', location: 'Mill', latitude: 5, longitude: 6 },
        { type: 'TRANSFER', name: 'Shipping', date: '2026-03-10', location: 'Port' }
      ]
    };

    fixture.detectChanges();

    expect(component.historyItems.map(item => item.iconClass))
        .toEqual(['af-journey-dot-shape--leaf', 'af-journey-dot-shape--ship']);
    // The scan, the two steps and the harvesting entry.
    expect(fixture.nativeElement.querySelectorAll('li.af-journey').length).toBe(4);
    // One label marker plus the step that has coordinates.
    expect(component.markers.length).toBe(2);
  });
});
