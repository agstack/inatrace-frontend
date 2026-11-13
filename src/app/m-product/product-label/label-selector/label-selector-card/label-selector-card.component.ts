import { Component, OnInit, EventEmitter, Output, Input, ChangeDetectionStrategy } from '@angular/core';
import { ThemeService } from 'src/app/shared-services/theme.service';
import { BehaviorSubject } from 'rxjs';
import { faTimes, faPen } from '@fortawesome/free-solid-svg-icons';
import { environment } from 'src/environments/environment';
import { ProductControllerService } from 'src/api/api/productController.service';
import { take } from 'rxjs/operators';

@Component({
    selector: 'app-label-selector-card',
    templateUrl: './label-selector-card.component.html',
    styleUrls: ['./label-selector-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class LabelSelectorCardComponent implements OnInit {

  appName: string = environment.appName;
  qrCodeLink = '';

  @Input()
  label = null;

  @Input()
  isSelected = false;

  @Input()
  qrCodeSize = 110;

  @Input()
  currentLabelForm;

  @Input()
  changed: boolean;

  @Input()
  editable = false;

  @Output() onSelect = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();
  @Output() onMouseOver = new EventEmitter<any>();
  @Output() onTitleChange = new EventEmitter<any>();

  faTimes = faTimes;
  faPen = faPen;

  showDeleteButton$ = new BehaviorSubject<boolean>(false);

  constructor(
    public theme: ThemeService,
    private productController: ProductControllerService
  ) { }

  ngOnInit(): void {
    this.setQRCode();
  }

  async setQRCode() {
    if (this.label) {
      const res = await this.productController.getProductLabelContent(this.label.id).pipe(take(1)).toPromise();
      if (res && res.status === 'OK' && res.data) {
        this.qrCodeLink = `${environment.appBaseUrl}/${res.data.settings.language.toLowerCase()}/${environment.qrCodeBasePath}/${this.label.uuid}`;
      }
    }
  }

  enter(e) {
    this.showDeleteButton$.next(true);
  }

  leave(e) {
    this.showDeleteButton$.next(false);
  }

  delete(event) {
    event.stopPropagation();
    this.onDelete.next(this.label);
  }

  toogleEditTitle(event){
    if (!this.editable) {
      return;
    }
    if (this.isSelected) {
      event.stopPropagation();
      this.onTitleChange.emit(this.label);
    }
  }

  select(label) {
    if (!this.changed) { this.onSelect.next({ label, preventEmit: false }); }
    else { this.onSelect.next({ label: null, preventEmit: true}); }
  }

}
