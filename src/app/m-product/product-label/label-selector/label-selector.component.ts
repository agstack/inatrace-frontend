import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { faChevronLeft, faChevronRight, faPlus, faPlusSquare } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { ApiProductLabelGet } from 'src/api/model/apiProductLabelGet';
import { ThemeService } from 'src/app/shared-services/theme.service';
import { environment } from 'src/environments/environment';
import { UntypedFormControl } from '@angular/forms';

@Component({
    selector: 'app-label-selector',
    templateUrl: './label-selector.component.html',
    styleUrls: ['./label-selector.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class LabelSelectorComponent implements OnInit, OnDestroy {

  appName: string = environment.appName;
  qrCodeSize = 110;
  firstSelect = true;
  currentLabel = null;

  _labels: ApiProductLabelGet[] = null
  @Input() set labels(value: ApiProductLabelGet[]) {
    this._labels = value;
    if(this.firstSelect && value && value.length > 0) {
      this.selectItem({label: value[0], preventEmit: false})
      this.firstSelect = false;
    }
  }

  get labels(): ApiProductLabelGet[] {
    return this._labels;
  }

  @Input()
  productId: number = null

  @Input()
  toSelect: Observable<number> = null;

  @Input()
  currentLabelForm: UntypedFormControl;

  @Input()
  changed: boolean;

  @Input()
  editable = false;

  faPlus = faPlus
  faPlusSquare = faPlusSquare
  faChevronLeft = faChevronLeft
  faChevronRight = faChevronRight

  selected = null;

  @Output() onSelect = new EventEmitter<any>();

  @Output() onCreate = new EventEmitter<any>();

  @Output() onDelete = new EventEmitter<any>();

  @Output() onTitleChange = new EventEmitter<any>();

  hasLeft = new BehaviorSubject(false)
  hasRight = new BehaviorSubject(false)

  createNew() {
    this.onCreate.next(true)
  }

  isSelected(item) {
    if (this.selected && this.selected.selected === false) return false
    return this.selected && this.selected.label && item && this.selected.label.id === item.id
  }

  selectItem(event) {
    if (!event) return;
    let label = event.label
    const preventEmit = event.preventEmit
    if (!label) label = this.currentLabel;
    this.currentLabel = label;
    this.selected = {label: label, selected: event.selected };
    if (!preventEmit) {
      this.onSelect.next(label)
    }
  }

  constructor(
    public theme: ThemeService
  ) { }

  showInView(event) {

    if (!event?.path) {
      return;
    }

    let target = null;
    let parent = null;

    for (const el of event.path) {
      if (!target && [...(el as any).classList].indexOf('label-card') >= 0) {
        target = el;
      }
      if (!parent && [...(el as any).classList].indexOf('outer-wrapper') >= 0) {
        parent = el;
      }
    }
    const card = target.getBoundingClientRect();
    const container = parent.getBoundingClientRect();
    if (card.x < container.x || card.x + card.width > container.x + container.width) {
        window.setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
    }
  }

  @ViewChild('scroll', { static: false })
  scrollBox: ElementRef;

  nudgeRight() {
    if (this.scrollBox) {
      this.scrollBox.nativeElement.scrollBy({behavior: 'smooth', left: 180})
    }
  }

  nudgeLeft() {
    if (this.scrollBox) {
      this.scrollBox.nativeElement.scrollBy({behavior: 'smooth', left: -180})
    }
  }

  delete(label) {
    if(!label) return;
    const position = this.labels.findIndex(x => x.id === label.id)
    this.onDelete.next({label, position})
  }

  titleChange(label) {
    if(!label) return;
    const position = this.labels.findIndex(x => x.id === label.id);
    this.onTitleChange.next({ label, position });
  }

  selectSub: Subscription = null
  ngOnInit(): void {
    if(this.toSelect) {
      this.selectSub = this.toSelect.subscribe((val: any) => {
        if (val == null) return;
        if(val.position != null) { // negative values mean -(index + 1) of deleted position
          let prev = val.position - 1;
          prev = prev < 0 ? 0 : prev;
          if(prev < this.labels.length) { // valid index
            this.selectItem({ label: this.labels[prev], preventEmit: false})
          } else {
            this.selectItem(null)
          }
          return;
        }
        const item = this.labels.find(x => x.id = val.id)
        if(item) {
          if (val.selected != null) this.selectItem({ label: item, preventEmit: val.preventEmit, selected: val.selected })
          else this.selectItem({ label: item, preventEmit: val.preventEmit })
        }
      })
    }
  }

  ngOnDestroy() {
    if(this.selectSub) this.selectSub.unsubscribe()
  }
}
