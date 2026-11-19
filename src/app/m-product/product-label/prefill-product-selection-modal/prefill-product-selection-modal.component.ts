import { Component, OnInit, Input, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ActiveProductsService } from 'src/app/shared-services/active-products.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-prefill-product-selection-modal',
    templateUrl: './prefill-product-selection-modal.component.html',
    styleUrls: ['./prefill-product-selection-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PrefillProductSelectionModalComponent implements OnInit, OnDestroy {

  @Input()
  dismissable = true;

  @Input()
  title:string = null;

  @Input()
  instructionsHtmlProduct:string = null;

  @Input()
  skipItemId: number = null;

  @Input()
  onSelectedProduct: (product: any) => {};

  productForm = new UntypedFormControl(null);
  subs: Subscription[] = [];
  dataFields = [];

  constructor(
    public activeModal: NgbActiveModal,
    public sifrantProduct: ActiveProductsService,
  ) { }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe());
  }

  ngOnInit(): void {
    // console.log(this.sifrantProduct)
  }

  cancel() {
    this.activeModal.close()
  }

  onConfirm() {
    if (this.productForm.value) {
      this.activeModal.close(this.productForm.value)
    }
  }



}
