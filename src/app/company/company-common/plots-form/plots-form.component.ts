import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import {FormArray, FormControl, FormGroup} from '@angular/forms';
import {ApiProductType} from '../../../../api/model/apiProductType';
import {CompanyProductTypesService} from '../../../shared-services/company-product-types.service';
import {ApiPlotCoordinate} from '../../../../api/model/apiPlotCoordinate';
import {PlotCoordinatesManagerService} from '../../../shared-services/plot-coordinates-manager.service';
import {ApiPlot} from '../../../../api/model/apiPlot';
import {ListEditorManager} from '../../../shared/list-editor/list-editor-manager';
import {defaultEmptyObject} from '../../../../shared/utils';
// import {Subject} from 'rxjs/internal/Subject';
import {ApiPlotValidationScheme} from './validation';
import {NgbModalImproved} from '../../../core/ngb-modal-improved/ngb-modal-improved.service';
import {
  OpenPlotDetailsExternallyModalComponent
} from '../../company-farmers/open-plot-details-externally-modal/open-plot-details-externally-modal.component';
import { MapComponent } from '../../../shared/map/map.component';
import {Subject} from 'rxjs';

@Component({
  selector: 'app-plots-form',
  templateUrl: './plots-form.component.html',
  styleUrls: ['./plots-form.component.scss']
})
export class PlotsFormComponent implements OnInit {

  plotCoordinates: Array<ApiPlotCoordinate> = [];

  plots: Array<ApiPlot> = [];
  productTypes: Array<ApiProductType> = [];
  plotCoordinatesManager: PlotCoordinatesManagerService = new PlotCoordinatesManagerService();

  pin: ApiPlotCoordinate;
  plotsListManager: any;

  drawPlotSubject = new Subject<boolean>();

  initialLat: number;
  initialLng: number;

  @Input()
  productTypesCodebook: CompanyProductTypesService;

  @Input()
  form: FormGroup; // contains the plots control

  @Input()
  submitted = false;

  @Input()
  updateMode: boolean;

  @Output()
  uploadGeoData = new EventEmitter<void>();

  @Output()
  exportGeoData = new EventEmitter<void>();

  @Output()
  savePlot = new EventEmitter<void>();

  @Output()
  deletePlot = new EventEmitter<void>();

  @ViewChild('map', { static: false })
  map: MapComponent;

  static ApiPlotCreateEmptyObject(): ApiPlot {
    const obj = ApiPlot.formMetadata();
    return defaultEmptyObject(obj) as ApiPlot;
  }

  static ApiPlotEmptyObjectFormFactory(): () => FormControl {
    return () => {
      return new FormControl(PlotsFormComponent.ApiPlotCreateEmptyObject(), ApiPlotValidationScheme.validators);
    };
  }
  
  constructor(private modalService: NgbModalImproved) {
  }

  ngOnInit(): void {

    this.plots = this.form.get('plots').value;

    this.pin = {
      latitude: this.form.get('location').value.latitude,
      longitude: this.form.get('location').value.latitude,
    };

    this.initialLat = this.form.get('location')?.get('address')?.get('country')?.value?.latitude;
    this.initialLng = this.form.get('location')?.get('address')?.get('country')?.value?.longitude;

    this.initializeListManager();
    this.initializeMarker();
  }

  initializeMarker() {

    if (!this.form.get('latitude') || !this.form.get('longitude')) {
      return;
    }
    const lat = this.form.get('latitude').value;
    const lng = this.form.get('longitude').value;
    if (lng == null || lat == null) {
      return;
    }

    this.pin = {
      latitude: lat,
      longitude: lng
    };
  }

  initializeListManager() {
    this.plotsListManager = new ListEditorManager<ApiPlot>(
      this.form.get('plots') as FormArray,
      PlotsFormComponent.ApiPlotEmptyObjectFormFactory(),
      ApiPlotValidationScheme
    );
  }

  public updatePlots(): void {

    this.plots = this.form.get('plots').value;
    this.map.updateMap(this.plots);
  }

  updateLonLat(coordinates: Array<ApiPlotCoordinate>) {
    if (coordinates) {
      this.form.get('location.latitude').setValue(coordinates[0].latitude);
      this.form.get('location.longitude').setValue(coordinates[0].longitude);
    } else {
      this.form.get('location.latitude').setValue(null);
      this.form.get('location.longitude').setValue(null);
    }
    this.form.get('location.latitude').markAsDirty();
    this.form.get('location.longitude').markAsDirty();
  }

  drawPlot() {
    this.drawPlotSubject.next(true);
  }

  updateFormGeoId(apiPlot: ApiPlot) {
    const currentPlotsValue = this.form.get('plots').value as Array<ApiPlot>;
    currentPlotsValue.forEach(plot => {
      if (plot.id === apiPlot.id) {
        plot.geoId = apiPlot.geoId;
      }
    });
    // update
    this.form.get('plots').setValue(currentPlotsValue);
  }

  openGeoIdWhisp($geoId: string) {
    const modalRef = this.modalService.open(OpenPlotDetailsExternallyModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'xxl',
      scrollable: true
    });
    Object.assign(modalRef.componentInstance, {
      geoId: $geoId
    });
    modalRef.result.then();
  }
}
