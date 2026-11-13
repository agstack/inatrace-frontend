import { Component, OnInit, Input, EventEmitter, Output, ChangeDetectionStrategy } from '@angular/core';
import { ApiProductCompany } from '../../../../api/model/apiProductCompany';

@Component({
    selector: 'app-company-card',
    templateUrl: './company-card.component.html',
    styleUrls: ['./company-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CompanyCardComponent implements OnInit {

  @Input()
  company: ApiProductCompany;

  @Input()
  owner = false;

  @Input()
  editable = false;

  @Output() onSelect = new EventEmitter<boolean>();

  constructor(
  ) { }

  ngOnInit(): void {
  }

  selectItem(item, preventEmit = false) {
    if (!preventEmit && this.editable) {
      this.onSelect.next(item);
    }
  }
}
