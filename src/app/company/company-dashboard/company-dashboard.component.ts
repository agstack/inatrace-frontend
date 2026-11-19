import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { FacilityControllerService } from '../../../api/api/facilityController.service';
import { ApiFacility } from '../../../api/model/apiFacility';
import { EChartsOption } from 'echarts';
import { dateISOString } from '../../../shared/utils';
import { CompanyUserCustomersByRoleService } from '../../shared-services/company-user-customers-by-role.service';
import { CompanyControllerService } from '../../../api/api/companyController.service';
import { ApiSemiProduct } from '../../../api/model/apiSemiProduct';
import { ProcessingActionControllerService } from '../../../api/api/processingActionController.service';
import { ValueChainControllerService } from '../../../api/api/valueChainController.service';
import {
  ApiProcessingPerformanceRequestEvidenceField
} from '../../../api/model/apiProcessingPerformanceRequestEvidenceField';
import { DashboardControllerService } from '../../../api/api/dashboardController.service';
import { FileSaverService } from 'ngx-filesaver';
import { CompanyCollectingFacilitiesService } from '../../shared-services/company-collecting-facilities.service';
import { GeneralSifrantService } from '../../shared-services/general-sifrant.service';
import { ApiProcessingAction } from '../../../api/model/apiProcessingAction';
import {CompanyFacilitiesService} from '../../shared-services/company-facilities.service';
import {
  CompanyProcessingActionsByStatusService
} from '../../shared-services/company-processing-actions-by-status.service';

@Component({
    selector: 'app-company-dashboard',
    templateUrl: './company-dashboard.component.html',
    styleUrls: ['./company-dashboard.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CompanyDashboardComponent implements OnInit {

  facilityCodebook: GeneralSifrantService<any>;
  companyFacilityCodebook: GeneralSifrantService<any>;
  farmersCodebook: CompanyUserCustomersByRoleService;
  collectorsCodebook: CompanyUserCustomersByRoleService;
  procActionsCodebook: CompanyProcessingActionsByStatusService;

  constructor(
    private fb: UntypedFormBuilder,
    private facilityController: FacilityControllerService,
    private companyControllerService: CompanyControllerService,
    public valueChainController: ValueChainControllerService,
    private procActionController: ProcessingActionControllerService,
    private dashboardControllerService: DashboardControllerService,
    private fileSaverService: FileSaverService
  ) { }

  faTimes = faTimes;

  readonly maxShownOnDeliveriesGraphs = 24;
  readonly maxShownOnProcPerformanceGraph = 12;

  deliveriesGraphTrunked = false;
  procPerformanceGraphTrunked = false;

  companyId = Number(localStorage.getItem('selectedUserCompany'));

  semiProductModelChoice = null;

  graphTranslations = {
    quantity: $localize `:@@companyDashboardComponent.graph.labels.quantity:Quantity`,
    in:  $localize `:@@companyDashboardComponent.graph.labels.in:in`,
    input: $localize `:@@companyDashboardComponent.graph.labels.input:Input`,
    output: $localize `:@@companyDashboardComponent.graph.labels.output:Output`,
    ratioInPercent:  $localize `:@@companyDashboardComponent.graph.labels.ratioInPercent:Input-Output ratio in %`
  };

  companyValueChains = [];

  evidenceFields = [];

  measureUnitTypes = [];

  processingActions: ApiProcessingAction[] = [];

  facilities: ApiFacility[] = [];

  semiProductOptions: ApiSemiProduct[] = [];

  deliveriesOptions: EChartsOption = {
    legend: {
      show: true
    },
    tooltip: {},
    xAxis: {
      type: 'category',
      axisTick: {
        alignWithLabel: true,
      },
      axisLabel: {
        rotate: 45
      },
      data: []
    },
    yAxis: {},
    series: [{
      name: `${this.graphTranslations.quantity} (${this.graphTranslations.in} kg)`,
      type: 'bar',
      label: {
        show: true,
        position: 'top'
      },
      itemStyle: {
        color: 'rgb(200,119,17)',
      },
      data: []
    }],
  };

  deliveriesMergeOptions: EChartsOption = {};

  // search fields form control
  deliveriesForm: UntypedFormGroup = this.fb.group({
    from: this.fb.control(new Date(new Date().getFullYear() - 2, new Date().getMonth(), new Date().getDay(), 12)),
    to: this.fb.control(new Date()),
    timeUnitGraphType: this.fb.control(undefined),
    facility: this.fb.control(null),
    semiProduct: this.fb.control(undefined),
    farmer: this.fb.control(undefined),
    collector: this.fb.control(undefined),
    organic: this.fb.control(undefined),
    womenOnly: this.fb.control(undefined),
    productInDeposit: this.fb.control(undefined),
    exportType: this.fb.control('EXCEL')
  });

  processingPerformanceOption: EChartsOption = {
    legend: {
      show: true
    },
    tooltip: {},
    xAxis: {
      type: 'category',
      axisTick: {
        alignWithLabel: true
      },
      axisLabel: {
        rotate: 45
      },
      data: []
    },
    yAxis: [{
      type: 'value',
      name: '',
      position: 'left'
    }, {
      type: 'value',
      name: '',
      position: 'right',
      axisLabel: {
        formatter: `{value} %`
      }
    }],
    series: [{
      name: 'Input',
      type: 'bar',
      label: {
        show: true,
        position: 'top'
      },
      itemStyle: {
        color: 'rgb(157,160,66)'
      },
      yAxisIndex: 0,
      data: []
    }, {
      name: 'Output',
      type: 'bar',
      label: {
        show: true,
        position: 'top'
      },
      itemStyle: {
        color: 'rgb(200,119,17)'
      },
      yAxisIndex: 0,
      data: []
    }, {
      name: 'Input-Output ratio in %',
      type: 'line',
      label: {
        show: true,
        position: 'top'
      },
      color: '#a9a9a9',
      yAxisIndex: 1,
      data: []
    }]
  };

  processingPerformanceMergeOptions: EChartsOption = {};

  processingPerformanceForm: UntypedFormGroup = this.fb.group({
    from: this.fb.control(new Date(new Date().getFullYear() - 2, new Date().getMonth(), new Date().getDay(), 12)),
    to: this.fb.control(new Date()),
    timeUnitGraphType: this.fb.control(undefined),
    facility: this.fb.control(null),
    process: this.fb.control(null),
    exportType: this.fb.control('EXCEL')
  });

  get facilityFormControl(): UntypedFormControl{
    return (this.deliveriesForm.get('facility') as UntypedFormControl);
  }

  get farmerFormControl(): UntypedFormControl{
    return (this.deliveriesForm.get('farmer') as UntypedFormControl);
  }

  get collectorFormControl(): UntypedFormControl{
    return (this.deliveriesForm.get('collector') as UntypedFormControl);
  }

  get organicFormControl(): UntypedFormControl{
    return (this.deliveriesForm.get('organic') as UntypedFormControl);
  }

  get womensOnlyFormControl(): UntypedFormControl{
    return (this.deliveriesForm.get('womenOnly') as UntypedFormControl);
  }

  get productInDepositFormControl(): UntypedFormControl{
    return (this.deliveriesForm.get('productInDeposit') as UntypedFormControl);
  }

  get processingFacilityFormControl(): UntypedFormControl{
    return (this.processingPerformanceForm.get('facility') as UntypedFormControl);
  }

  get processingActionFormControl(): UntypedFormControl{
    return (this.processingPerformanceForm.get('process') as UntypedFormControl);
  }

  processingEvidenceInputField(name: string) {
    return (this.processingPerformanceForm.get(name) as UntypedFormControl);
  }

  ngOnInit(): void {
    this.companyId = Number(localStorage.getItem('selectedUserCompany'));
    this.facilityCodebook = new CompanyCollectingFacilitiesService(this.facilityController, this.companyId);
    this.companyFacilityCodebook = new CompanyFacilitiesService(this.facilityController, this.companyId);

    this.companyControllerService.getCompany(this.companyId).subscribe(
      next => {
        this.companyValueChains = next.data.valueChains;

        this.companyValueChains.forEach(valueChain => {
          this.valueChainController.getValueChain(valueChain.id).subscribe(
            vchain => {
              if (vchain?.data?.measureUnitTypes) {
                vchain.data.measureUnitTypes.forEach(unitType => {
                  if (!this.measureUnitTypes.some(ut => ut?.id === unitType?.id)) {
                    this.measureUnitTypes.push(unitType);
                  }
                });
              }
            }
          );
        });
      }
    );

    this.farmersCodebook = new CompanyUserCustomersByRoleService(this.companyControllerService, this.companyId, 'FARMER');
    this.collectorsCodebook = new CompanyUserCustomersByRoleService(this.companyControllerService, this.companyId, 'COLLECTOR');

    this.procActionsCodebook =
      new CompanyProcessingActionsByStatusService(this.procActionController, this.companyId, ['PROCESSING', 'FINAL_PROCESSING']);

    this.procActionController.listProcessingActionsByCompanyByMap({
      limit: 1000,
      offset: 0,
      id: this.companyId
    }).subscribe(next => {
      if (next?.data) {
        setTimeout(() => {
          this.processingActions = next.data.items.filter(pa => ['PROCESSING', 'FINAL_PROCESSING'].some(type => type === pa.type));
          this.processingPerformanceForm.get('process')?.setValue(this.processingActions[0]);
          this.reloadProcessingFields(this.processingActions[0]);
        });
      }
    });

    this.facilityController.listCollectingFacilitiesByCompanyByMap({
      limit: 1000,
      offset: 0,
      id: this.companyId
    }).subscribe(next => {
      if (next?.data?.items[0]) {
        this.facilities.push(next.data.items[0]);
        this.refreshSemiProducts();
        this.semiProductModelChoice = next.data.items[0].facilitySemiProductList[0]?.id;
        setTimeout(() => {
          this.semiProductSelected(next.data.items[0].facilitySemiProductList[0]?.id?.toString());
        });
      }
    });

    // Init interval for delivery graph
    let diff = Math.abs(this.deliveriesForm.get('from')?.value?.getTime() - this.deliveriesForm.get('to')?.value?.getTime());
    let diffDays = Math.ceil(diff / (1000 * 3600 * 24));
    if (diffDays < 7) {
      this.deliveriesForm.get('timeUnitGraphType').setValue('DAY');
    } else if (diffDays < 30) {
      this.deliveriesForm.get('timeUnitGraphType').setValue('WEEK');
    } else if (diffDays < 905) {
      this.deliveriesForm.get('timeUnitGraphType').setValue('MONTH');
    } else {
      this.deliveriesForm.get('timeUnitGraphType').setValue('YEAR');
    }
    
    // Init interval for processing performance
    diff = Math.abs(this.processingPerformanceForm.get('from')?.value?.getTime() - this.processingPerformanceForm.get('to')?.value?.getTime());
    diffDays = Math.ceil(diff / (1000 * 3600 * 24));
    if (diffDays < 7) {
      this.processingPerformanceForm.get('timeUnitGraphType').setValue('DAY');
    } else if (diffDays < 30) {
      this.processingPerformanceForm.get('timeUnitGraphType').setValue('WEEK');
    } else if (diffDays < 900) {
      this.processingPerformanceForm.get('timeUnitGraphType').setValue('MONTH');
    } else {
      this.processingPerformanceForm.get('timeUnitGraphType').setValue('YEAR');
    }
  }

  refreshDeliveriesData() {

    // True when checked, otherwise no filter (null)
    const womenOnlyFilter = this.deliveriesForm.get('womenOnly')?.value ? true : null;
    const organicFilter = this.deliveriesForm.get('organic')?.value ? true : null;
    const productInDepositFilter = this.deliveriesForm.get('productInDeposit')?.value ? true : null;
    const facilityIds = this.facilities.map(facility => facility.id);

    this.dashboardControllerService.getDeliveriesAggregatedDataByMap({
          companyId: this.companyId,
          farmerId: this.deliveriesForm.get('farmer')?.value?.id,
          facilityIds,
          collectorId: this.deliveriesForm.get('collector')?.value?.id,
          semiProductId: this.deliveriesForm.get('semiProduct')?.value?.id,
          isWomenShare: womenOnlyFilter,
          organicOnly: organicFilter,
          priceDeterminedLater: productInDepositFilter,
          productionDateStart: dateISOString(this.deliveriesForm.get('from')?.value),
          productionDateEnd: dateISOString(this.deliveriesForm.get('to')?.value),
          aggregationType: this.deliveriesForm.get('timeUnitGraphType')?.value
        }).subscribe(next => {
          if (next?.data) {
            const labelData = [];
            const graphData = [];

            this.deliveriesGraphTrunked = next.data.totals?.length > this.maxShownOnDeliveriesGraphs;

            // Only first n results are shown in the graph
            next.data.totals?.slice(0, this.maxShownOnDeliveriesGraphs).forEach(total => {
                const timeUnit = this.calculateTimeUnit(total.unit, total.year, this.deliveriesForm.get('timeUnitGraphType').value);
                labelData.push(timeUnit);
                graphData.push(total.totalQuantity);
            });

            setTimeout(() => {
              this.deliveriesMergeOptions = {
                xAxis: {
                  data: labelData
                },
                series: [{
                  name: `${this.graphTranslations.quantity} (${this.graphTranslations.in} kg)`,
                  data: graphData
                }]
              };
            });
          }
    });
  }

  refreshProcessingPerformanceData() {

    const efs: ApiProcessingPerformanceRequestEvidenceField[] = [];

    // Check given evidenceFields
    this.evidenceFields.forEach(evidenceField => {
      const value = this.processingPerformanceForm.get(evidenceField.fieldName)?.value;
      if (value) {
        if (evidenceField.fieldName === 'WASHING_DATE') {
          efs.push({
            evidenceField: {
              fieldName: evidenceField.fieldName
            },
            instantValue: value
          });

        } else if (evidenceField.fieldName === 'SIZE') {
          efs.push({
            evidenceField: {
              fieldName: evidenceField.fieldName
            },
            numericValue: value
          });
        } else {
          // string
          efs.push({
            evidenceField: {
              fieldName: evidenceField.fieldName
            },
            stringValue: value
          });
        }
      }
    });

    this.dashboardControllerService.calculateProcessingPerformanceData({
      companyId: this.companyId,
      facilityId: this.processingPerformanceForm.get('facility')?.value?.id,
      processActionId: this.processingPerformanceForm.get('process')?.value?.id,
      dateStart: dateISOString(this.processingPerformanceForm.get('from')?.value),
      dateEnd: dateISOString(this.processingPerformanceForm.get('to')?.value),
      aggregationType: this.processingPerformanceForm.get('timeUnitGraphType')?.value,
      evidenceFields: efs
      }).subscribe(next => {
      if (next?.data) {

        const labelData = [];
        const inputQuantityData = [];
        const outputQuantityData = [];
        const ratioData = [];

        this.procPerformanceGraphTrunked = next.data.totals?.length > this.maxShownOnProcPerformanceGraph;

        // Only first n results are shown in the graph
        next.data.totals?.slice(0, this.maxShownOnProcPerformanceGraph).forEach(
          total => {
            const timeUnit = this.calculateTimeUnit(total.unit, total.year, this.processingPerformanceForm.get('timeUnitGraphType').value);
            labelData.push(timeUnit);
            inputQuantityData.push(total.inputQuantity);
            outputQuantityData.push(total.outputQuantity);
            ratioData.push(total.ratio);
          });

        // If larger label use only value
        const yAxisLabel = (next.data.measureUnitType.label.length < 5) ? next.data.measureUnitType.label : '';

        setTimeout(() => {
        this.processingPerformanceMergeOptions = {
          xAxis: {
            data: labelData
          },
          yAxis: [{
            axisLabel: {
              formatter: `{value} ${yAxisLabel}`
            }
          }],
          series: [{
              name: `${this.graphTranslations.input} (${this.graphTranslations.in} ${next.data.measureUnitType.label})`,
              data: inputQuantityData
            }, {
              name: `${this.graphTranslations.output} (${this.graphTranslations.in} ${next.data.measureUnitType.label})`,
              data: outputQuantityData
            }, {
              name: `${this.graphTranslations.ratioInPercent}`,
              data: ratioData
            }]
        };
        });
      }
    });
  }

  private calculateTimeUnit(stringUnit: string, year: number, aggregationType: string) {
    let timeUnit = stringUnit;
    if (aggregationType === 'WEEK') {
      timeUnit = this.translateGraphWeek(stringUnit, year);
    } else if (aggregationType === 'MONTH') {
      timeUnit = this.translateGraphMonth(stringUnit, year);
    }
    return timeUnit;
  }

  private translateGraphWeek(weekNum: string, year: number) {
    return $localize `:@@companyDashboardComponent.graph.timeUnit.week:Week` + '-' + weekNum + ' ' + year;
  }

  private translateGraphMonth(monthNum: string, year: number) {
    let translated;
    if (monthNum === '1') {
      translated = $localize `:@@companyDashboardComponent.graph.timeUnit.month.Jan:Jan`;
    } else if (monthNum === '2') {
      translated = $localize `:@@companyDashboardComponent.graph.timeUnit.month.Feb:Feb`;
    } else if (monthNum === '3') {
      translated = $localize `:@@companyDashboardComponent.graph.timeUnit.month.Mar:Mar`;
    } else if (monthNum === '4') {
      translated = $localize `:@@companyDashboardComponent.graph.timeUnit.month.Apr:Apr`;
    } else if (monthNum === '5') {
      translated = $localize `:@@companyDashboardComponent.graph.timeUnit.month.May:May`;
    } else if (monthNum === '6') {
      translated = $localize `:@@companyDashboardComponent.graph.timeUnit.month.Jun:Jun`;
    } else if (monthNum === '7') {
      translated = $localize `:@@companyDashboardComponent.graph.timeUnit.month.Jul:Jul`;
    } else if (monthNum === '8') {
      translated = $localize `:@@companyDashboardComponent.graph.timeUnit.month.Aug:Aug`;
    } else if (monthNum === '9') {
      translated = $localize `:@@companyDashboardComponent.graph.timeUnit.month.Sep:Sep`;
    } else if (monthNum === '10') {
      translated = $localize `:@@companyDashboardComponent.graph.timeUnit.month.Oct:Oct`;
    } else if (monthNum === '11') {
      translated = $localize `:@@companyDashboardComponent.graph.timeUnit.month.Nov:Nov`;
    } else if (monthNum === '12') {
      translated = $localize `:@@companyDashboardComponent.graph.timeUnit.month.Dec:Dec`;
    }

    return translated + ' ' + year;
  }

  onFilterDateRangeChange() {
    setTimeout(() => this.refreshDeliveriesData());
  }

  onFilterProcessingDateRangeChange() {
    setTimeout(() => this.refreshProcessingPerformanceData());
  }

  semiProductSelected(id: string) {
    if (id) {
      this.deliveriesForm.get('semiProduct')?.setValue({ id });
    } else {
      this.deliveriesForm.get('semiProduct')?.setValue(null);
    }

    this.deliveriesForm.get('semiProduct')?.markAsDirty();
    this.deliveriesForm.get('semiProduct')?.updateValueAndValidity();

    setTimeout(() => this.refreshDeliveriesData());
  }

  setDeliveryInterval(interval: string) {

    const previousVal = this.deliveriesForm.get('timeUnitGraphType')?.value;
    let newVal;

    if (interval === 'day') {
      newVal = 'DAY';
    } else if (interval === 'week') {
      newVal = 'WEEK';
    } else if (interval === 'month') {
      newVal = 'MONTH';
    } else if (interval === 'year') {
      newVal = 'YEAR';
    }

    if (previousVal !== newVal) {
      this.deliveriesForm.get('timeUnitGraphType')?.setValue(newVal);
      this.refreshDeliveriesData();
    }
  }

  setProcessingPerformanceInterval(interval: string) {

    const previousVal = this.processingPerformanceForm.get('timeUnitGraphType')?.value;
    let newVal;

    if (interval === 'day') {
      newVal = 'DAY';
    } else if (interval === 'week') {
      newVal = 'WEEK';
    } else if (interval === 'month') {
      newVal = 'MONTH';
    } else if (interval === 'year') {
      newVal = 'YEAR';
    }

    if (previousVal !== newVal) {
      this.processingPerformanceForm.get('timeUnitGraphType')?.setValue(newVal);
      this.refreshProcessingPerformanceData();
    }
  }

  async addSelectedFacility(facility: ApiFacility) {
    if (!facility) {
      // no element is selected, only user input
      return;
    }
    if (this.facilities.some(s => s.id === facility.id)) {
      // same element selected. refresh the input element, but do not update the list
      setTimeout(() => this.deliveriesForm.get('facility')?.setValue(null));
      return;
    }
    this.facilities.push(facility);
    this.refreshSemiProducts();
    this.refreshDeliveriesData();
    setTimeout(() => this.deliveriesForm.get('facility')?.setValue(null));
  }

  deleteFacility(facility: ApiFacility, idx: number) {
    this.facilities.splice(idx, 1);
    this.refreshSemiProducts();
    this.refreshDeliveriesData();
  }

  refreshSemiProducts() {
    this.semiProductOptions = [];

    this.facilities.forEach(f => {
      if (f?.facilitySemiProductList) {
        f.facilitySemiProductList.forEach((sp => {
          if (!this.semiProductOptions.some(el => el.id === sp.id)) {
            this.semiProductOptions.push(sp);
          }
        }));
      }
    });
  }

  exportDeliveries() {

    const womenOnlyFilter = this.deliveriesForm.get('womenOnly')?.value ? true : null;
    const organicFilter = this.deliveriesForm.get('organic')?.value ? true : null;
    const productInDepositFilter = this.deliveriesForm.get('productInDeposit')?.value ? true : null;
    const facilityIds = this.facilities.map(facility => facility.id);
    const exportType = this.deliveriesForm.get('exportType')?.value;

    this.dashboardControllerService.exportDeliveriesDataByMap({
      companyId: this.companyId,
      farmerId: this.deliveriesForm.get('farmer')?.value?.id,
      facilityIds,
      collectorId: this.deliveriesForm.get('collector')?.value?.id,
      semiProductId: this.deliveriesForm.get('semiProduct')?.value?.id,
      isWomenShare: womenOnlyFilter,
      organicOnly: organicFilter,
      priceDeterminedLater: productInDepositFilter,
      productionDateStart: dateISOString(this.deliveriesForm.get('from')?.value),
      productionDateEnd: dateISOString(this.deliveriesForm.get('to')?.value),
      aggregationType: this.deliveriesForm.get('timeUnitGraphType')?.value,
      exportType
    }).subscribe(next => {
      if (exportType === 'CSV') {
        this.fileSaverService.save(next, 'deliveries.csv');
      } else if (exportType === 'EXCEL') {
        this.fileSaverService.save(next, 'deliveries.xlsx');
      } else if (exportType === 'PDF') {
        this.fileSaverService.save(next, 'deliveries.pdf');
      }
    });
  }

  exportProcessingPerformance() {

    const efs: ApiProcessingPerformanceRequestEvidenceField[] = [];

    // check given evidenceFields
    this.evidenceFields.forEach(evidenceField => {
      const value = this.processingPerformanceForm.get(evidenceField.fieldName)?.value;
      if (value) {
        if (evidenceField.fieldName === 'WASHING_DATE') {
          efs.push({
            evidenceField: {
              fieldName: evidenceField.fieldName
            },
            instantValue: value
          });

        } else if (evidenceField.fieldName === 'SIZE') {
          efs.push({
            evidenceField: {
              fieldName: evidenceField.fieldName
            },
            numericValue: value
          });
        } else {
          // string
          efs.push({
            evidenceField: {
              fieldName: evidenceField.fieldName
            },
            stringValue: value
          });
        }
      }
    });

    const exportType = this.processingPerformanceForm.get('exportType')?.value;

    this.dashboardControllerService
      .exportProcessingPerformanceData({
          companyId: this.companyId,
          facilityId: this.processingPerformanceForm.get('facility')?.value?.id,
          processActionId: this.processingPerformanceForm.get('process')?.value?.id,
          dateStart: dateISOString(this.processingPerformanceForm.get('from')?.value),
          dateEnd: dateISOString(this.processingPerformanceForm.get('to')?.value),
          aggregationType: this.processingPerformanceForm.get('timeUnitGraphType')?.value,
          evidenceFields: efs,
          exportType
        }).subscribe(next => {
          if (exportType === 'CSV') {
            this.fileSaverService.save(next, 'processing.csv');
          } else if (exportType === 'EXCEL') {
            this.fileSaverService.save(next, 'processing.xlsx');
          } else if (exportType === 'PDF') {
            this.fileSaverService.save(next, 'processing.pdf');
          }
        });
  }

  reloadProcessingFields(procAction: ApiProcessingAction) {
    if (procAction) {

      // reset previous evidence fields
      this.evidenceFields.forEach(ef => {
        if (this.processingPerformanceForm.contains(ef.fieldName)) {
          this.processingPerformanceForm.removeControl(ef.fieldName);
        }
      });
      this.evidenceFields = [];

      const foundProcAction = this.processingActions.find(pa => pa.id === procAction.id);
      if (foundProcAction) {
        foundProcAction.requiredEvidenceFields?.forEach(evidenceField => {
          if (!this.evidenceFields.some(ef => ef.fieldName === evidenceField.fieldName)) {
            this.evidenceFields.push(evidenceField);
            this.processingPerformanceForm.addControl(evidenceField.fieldName, this.fb.control(undefined));
          }
        });
      }

      this.refreshProcessingPerformanceData();
    }
  }
}
