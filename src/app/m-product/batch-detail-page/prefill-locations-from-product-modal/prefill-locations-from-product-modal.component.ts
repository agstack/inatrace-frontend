import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-prefill-locations-from-product-modal',
    templateUrl: './prefill-locations-from-product-modal.component.html',
    styleUrls: ['./prefill-locations-from-product-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PrefillLocationsFromProductModalComponent implements OnInit {

  @Input()
  dismissable = true;

  @Input()
  title: string = null;

  @Input()
  instructionsHtml: string = null;


  constructor(
    public activeModal: NgbActiveModal
  ) { }

  ngOnInit(): void {
  }

  cancel() {
    this.activeModal.close()
  }

  onConfirm() {
    this.activeModal.close(true)
  }
}
