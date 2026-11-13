import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { ProductControllerService } from 'src/api/api/productController.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GoogleMap } from '@angular/google-maps';
import { UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { take } from 'rxjs/operators';

@Component({
    selector: 'app-product-label-statistics-page',
    templateUrl: './product-label-statistics-page.component.html',
    styleUrls: ['./product-label-statistics-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ProductLabelStatisticsPageComponent implements OnInit, OnDestroy {

  @ViewChild(GoogleMap) set map(map: GoogleMap) {
    if (map) {
      this.gMap = map;
      this.fitBounds();
    }
  };

  gMap = null;
  markers: any = [];
  defaultCenter = {
    lat: 37.0769238,
    lng: 24.2160421
  };
  defaultZoom = 2;
  zoomForOnePin = 10;
  bounds: any;
  isGoogleMapsLoaded = false;

  initialBoundsAuth: any = [];
  initialBoundsOrig: any = [];
  initialBoundsVisit: any = [];

  authMarkers: any = [];
  origMarkers: any = [];
  visitMarkers: any = [];

  subs: Subscription[] = [];
  statistics = {};

  goToLink: string = this.router.url.substr(0, this.router.url.lastIndexOf("/"));

  showAuth = true;
  showOrig = true;

  locationsForm = new UntypedFormGroup({
    visitLoc: new UntypedFormControl(true),
    authLoc: new UntypedFormControl(false),
    origLoc: new UntypedFormControl(false)
    });

  constructor(
    private globalEventsManager: GlobalEventManagerService,
    private productController: ProductControllerService,
    private route: ActivatedRoute,
    private router: Router
  ) { }


  id = +this.route.snapshot.paramMap.get('labelId');

  ngOnInit(): void {
    this.getStatistics();

    const sub2 = this.globalEventsManager.loadedGoogleMapsEmitter.subscribe(
      loaded => {
        if (loaded) this.isGoogleMapsLoaded = true;
      },
      error => { }
    )
    this.subs.push(sub2);
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe());
  }

  getStatistics() {
    this.globalEventsManager.showLoading(true);

    const sub = this.productController.getProductLabel(this.id).
    subscribe(lab => {
      if(lab.status == "OK") {
        this.getStatistcsData(lab.data.uuid);
      }
    }, err => this.globalEventsManager.showLoading(true)
    )
    this.subs.push(sub);
  }

  getStatistcsData(uuid: string) {
    const sub = this.productController.getProductLabelAnalytics(uuid)
    .subscribe(stat => {
      if (stat.status == "OK") {
        this.statistics = stat.data;
        this.initializeMarkers(this.statistics);
      }
      this.globalEventsManager.showLoading(false);
    },
    err => this.globalEventsManager.showLoading(true)
    )
    this.subs.push(sub);
  }


  initializeMarkers(data): void {
    this.authMarkers = [];
    this.origMarkers = [];
    this.visitMarkers = [];
    if(data) {
      Object.entries(data.authLocations).forEach(
        ([key, value]) => {
          if(key != 'unknown') {
            const num = value;
            const pos = key.split(':');
            const tmp = {
              position: {
                lat: parseFloat(pos[0]),
                lng: parseFloat(pos[1])
              },
              // label: {
              //   text: String(num)
              // }
            }
            this.authMarkers.push(tmp);
            this.initialBoundsAuth.push(tmp.position)
          }
        }
      )
      Object.entries(data.originLocations).forEach(
        ([key, value]) => {
          if (key != 'unknown') {
            const num = value;
            const pos = key.split(':');
            const tmp = {
              position: {
                lat: parseFloat(pos[0]),
                lng: parseFloat(pos[1])
              },
              // label: {
              //   text: String(num)
              // }
            }
            this.origMarkers.push(tmp);
            this.initialBoundsOrig.push(tmp.position)
          }
        }
      )
      Object.entries(data.visitsLocations).forEach(
        ([key, value]) => {
          if (key != 'unknown') {
            const num = value;
            const pos = key.split(':');
            const tmp = {
              position: {
                lat: parseFloat(pos[0]),
                lng: parseFloat(pos[1])
              },
              // label: {
              //   text: String(num)
              // }
            }
            this.visitMarkers.push(tmp);
            this.initialBoundsVisit.push(tmp.position)
          }
        }
      )
    }
    this.fitBounds();
  }


  fitBounds() {
    if (!this.gMap) return;
    this.bounds = new google.maps.LatLngBounds()
    if(this.locationsForm.get('visitLoc').value) {
      for (const bound of this.initialBoundsVisit) {
        this.bounds.extend(bound);
      }
    }
    if (this.locationsForm.get('authLoc').value) {
      for (const bound of this.initialBoundsAuth) {
        this.bounds.extend(bound);
      }
    }
    if (this.locationsForm.get('origLoc').value) {
      for (const bound of this.initialBoundsOrig) {
        this.bounds.extend(bound);
      }
    }
    if (this.bounds.isEmpty()) {
      this.gMap.googleMap.setCenter(this.defaultCenter)
      this.gMap.googleMap.setZoom(this.defaultZoom);
      return;
    }
    const center = this.bounds.getCenter()
    const offset = 0.02
    const northEast = new google.maps.LatLng(
      center.lat() + offset,
      center.lng() + offset
    )
    const southWest = new google.maps.LatLng(
      center.lat() - offset,
      center.lng() - offset
    )
    const minBounds = new google.maps.LatLngBounds(southWest, northEast)
    this.gMap.fitBounds(this.bounds.union(minBounds))

  }

}
