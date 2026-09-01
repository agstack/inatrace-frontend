import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { GoogleMap } from '@angular/google-maps';
import { GlobalEventManagerService } from '../../../core/global-event-manager.service';
// import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';
import {Subject, Subscription} from 'rxjs';

@Component({
    selector: 'app-pathline-map',
    templateUrl: './pathline-map.component.html',
    styleUrls: ['./pathline-map.component.scss']
})
export class PathlineMapComponent implements OnInit, OnChanges, OnDestroy {
    
    private destroy$ = new Subject<boolean>();
    
    isGoogleMapsLoaded = false;

    defaultCenter = {
        lat: 5.274054,
        lng: 21.514503
    };
    defaultZoom = 3;

    gMap: GoogleMap = null;
    bounds: google.maps.LatLngBounds;
    mapMarkerOption: any;
    initialBounds: google.maps.LatLngLiteral[] = [];

    journeyVertices: google.maps.LatLngLiteral[] = [];
    lineSymbol = {
        path: 'M 0,-1 0,1',
        strokeOpacity: 1,
        scale: 2,
        strokeColor: '#25265E'
    };

    polylineOptions: google.maps.PolylineOptions = {
        icons: [
            {
                icon: this.lineSymbol,
                offset: '0',
                repeat: '20px'
            },
        ],
        strokeOpacity: 0,
    };

    private markersFormValueChangeSubs: Subscription;

    @Input()
    public markersForm: FormArray;
    
    constructor(public globalEventManager: GlobalEventManagerService) {
    }
    
    @ViewChild(GoogleMap)
    set map(gMap: GoogleMap) {
        if (gMap) {
            this.gMap = gMap;
            this.mapMarkerOption = {
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 4,
                    fillColor: '#25265E',
                    fillOpacity: 1,
                    strokeColor: '#25265E',
                }
            };
            setTimeout(() => this.googleMapsIsLoaded(gMap));
        }
    }

    ngOnInit(): void {
        this.globalEventManager.loadedGoogleMapsEmitter.pipe(takeUntil(this.destroy$)).subscribe({
            next: loaded => {
                if (loaded) {
                    this.isGoogleMapsLoaded = true;
                }
            }
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.markersForm) {

            // Form instance is changed, we need to register new subscription (also update the journey points)
            this.updateJourneyVertices();

            this.markersFormValueChangeSubs = this.markersForm?.valueChanges.subscribe(() => {
                this.updateJourneyVertices();
            });
        }
    }

    ngOnDestroy() {
        if (this.markersFormValueChangeSubs) {
            this.markersFormValueChangeSubs.unsubscribe();
        }
        this.destroy$.next(true);
    }
    
    googleMapsIsLoaded(map) {
        this.isGoogleMapsLoaded = true;
    
        this.markersForm.controls.forEach(ctrl => {
            this.initialBounds.push({
                lat: ctrl.get('latitude').value,
                lng: ctrl.get('longitude').value,
            });
        });

        this.updateJourneyVertices();
        
        this.bounds = new google.maps.LatLngBounds();
        for (const bound of this.initialBounds) {
            this.bounds.extend(bound);
        }
        if (this.bounds.isEmpty()) {
            map.googleMap.setCenter(this.defaultCenter);
            map.googleMap.setZoom(this.defaultZoom);
            return;
        }
        const center = this.bounds.getCenter();
        const offset = 0.02;
        const northEast = new google.maps.LatLng(
            center.lat() + offset,
            center.lng() + offset
        );
        const southWest = new google.maps.LatLng(
            center.lat() - offset,
            center.lng() - offset
        );
        const minBounds = new google.maps.LatLngBounds(southWest, northEast);
        map.fitBounds(this.bounds.union(minBounds));
    }
    
    addJourneyMarker(event: google.maps.MouseEvent) {
        this.markersForm.push(new FormGroup({
            latitude: new FormControl(event.latLng.lat()),
            longitude: new FormControl(event.latLng.lng()),
        }));
        this.markersForm.markAsDirty();
    }
    
    removeJourneyMarker(i: number) {
        this.markersForm.removeAt(i);
        this.markersForm.markAsDirty();
    }

    private updateJourneyVertices(): void {
        this.journeyVertices = this.markersForm.controls.map(ctrl => {
            return {
                lat: ctrl.get('latitude').value,
                lng: ctrl.get('longitude').value,
            };
        });
    }

}
