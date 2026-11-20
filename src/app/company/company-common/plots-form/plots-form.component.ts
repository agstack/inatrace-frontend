import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import {UntypedFormArray, UntypedFormControl, UntypedFormGroup} from '@angular/forms';
import {ApiProductType} from '../../../../api/model/apiProductType';
import {CompanyProductTypesService} from '../../../shared-services/company-product-types.service';
import {ApiPlotCoordinate} from '../../../../api/model/apiPlotCoordinate';
import {PlotCoordinatesManagerService} from '../../../shared-services/plot-coordinates-manager.service';
import {ApiPlot} from '../../../../api/model/apiPlot';
import {ListEditorManager} from '../../../shared/list-editor/list-editor-manager';
import {defaultEmptyObject} from '../../../../shared/utils';
import {Subject} from 'rxjs/internal/Subject';
import {ApiPlotValidationScheme} from './validation';
import {NgbModalImproved} from '../../../core/ngb-modal-improved/ngb-modal-improved.service';
import {
  OpenPlotDetailsExternallyModalComponent
} from '../../company-farmers/open-plot-details-externally-modal/open-plot-details-externally-modal.component';

@Component({
    selector: 'app-plots-form',
    templateUrl: './plots-form.component.html',
    styleUrls: ['./plots-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PlotsFormComponent implements OnInit {

  plotCoordinates: ApiPlotCoordinate[] = [];

  plots: ApiPlot[] = [];
  productTypes: ApiProductType[] = [];
  plotCoordinatesManager: PlotCoordinatesManagerService = new PlotCoordinatesManagerService();

  pin: ApiPlotCoordinate;
  plotsListManager: any;

  drawPlotSubject = new Subject<boolean>();

  initialLat: number;
  initialLng: number;

  @Input()
  productTypesCodebook: CompanyProductTypesService;

  @Input()
  form: UntypedFormGroup; // contains the plots control

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

  static ApiPlotCreateEmptyObject(): ApiPlot {
    const obj = ApiPlot.formMetadata();
    return defaultEmptyObject(obj) as ApiPlot;
  }

  static ApiPlotEmptyObjectFormFactory(): () => UntypedFormControl {
    return () => {
      return new UntypedFormControl(PlotsFormComponent.ApiPlotCreateEmptyObject(), ApiPlotValidationScheme.validators);
    };
  }
  
  constructor(private modalService: NgbModalImproved) {
  }

  ngOnInit(): void {

    this.plots = this.form.get('plots').value;

    const location = this.form.get('location')?.value;
    const country = location?.address?.country;
    const hasLocationCoordinates = location?.latitude != null && location?.longitude != null;
    const hasCountryCoordinates = country?.latitude != null && country?.longitude != null;

    this.pin = hasLocationCoordinates
      ? { latitude: location.latitude, longitude: location.longitude }
      : undefined;

    if (hasLocationCoordinates) {
      this.initialLat = location.latitude;
      this.initialLng = location.longitude;
    } else if (hasCountryCoordinates) {
      this.initialLat = country.latitude;
      this.initialLng = country.longitude;
    } else {
      this.initialLat = undefined;
      this.initialLng = undefined;
    }

    this.initializeListManager();
  }

  initializeListManager() {
    this.plotsListManager = new ListEditorManager<ApiPlot>(
      this.form.get('plots') as UntypedFormArray,
      PlotsFormComponent.ApiPlotEmptyObjectFormFactory(),
      ApiPlotValidationScheme
    );
  }

  drawPlot() {
    this.drawPlotSubject.next(true);
  }

  updateFormGeoId(apiPlot: ApiPlot) {
    const currentPlotsValue = this.form.get('plots').value as ApiPlot[];
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
