import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
    selector: 'app-search-textinput',
    templateUrl: './search-textinput.component.html',
    styleUrls: ['./search-textinput.component.scss'],
    animations: [
        trigger('expandCollapse', [
            state('closed', style({
                height: '0',
                overflow: 'hidden',
                opacity: '0',
                margin: '0',
                padding: '0'
            })),
            state('open', style({
                opacity: '1'
            })),
            transition('closed=>open', animate('150ms')),
            transition('open=>closed', animate('150ms ease-out'))
        ]),
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SearchTextinputComponent implements OnInit {

  faSearch = faSearch;

  @Input()
  form: UntypedFormControl;

  @Input()
  byCategory = false;

  @Input()
  items;

  @Output() valueChange = new EventEmitter<any>();
  @Output() categoryChange = new EventEmitter<any>();

  showSearch = false;

  @Input()
  searchCategory: string;

  constructor() { }

  ngOnInit(): void {
  }

  toggleShowSearch() {
    this.showSearch = !this.showSearch;
  }

  onInput(event) {
    this.valueChange.emit(this.form.value);
  }

  onChange(item){
    this.searchCategory = item.category;
    this.categoryChange.emit(item.category);
  }

  labelCategory(searchCategory) {
    for (const item of this.items) {
      if (item.category === searchCategory) { return item.name; }
    }
  }
}
