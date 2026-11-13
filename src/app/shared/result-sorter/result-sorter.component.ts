import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { faCaretDown, faCaretUp } from '@fortawesome/free-solid-svg-icons';
import { SortOption, SortOrder, SortKeyAndOrder } from './result-sorter-types';
import { UntypedFormControl } from '@angular/forms';

@Component({
    selector: 'tr[result-sorter]',
    templateUrl: './result-sorter.component.html',
    styleUrls: ['./result-sorter.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ResultSorterComponent implements OnInit {

    @Input()
    sortOptions: SortOption[] = []

    @Input()
    defaultSortingIndex: number = 0;

    @Input()
    defaultSortOrder: SortOrder = 'ASC';

    @Input()
    cbChecked: UntypedFormControl;

    @Output()
    sortByKey = new EventEmitter<SortKeyAndOrder>();

    oznacen: number = null;
    sortOrder: SortOrder = null;

    ASC: SortOrder = 'ASC'
    DESC: SortOrder = 'DESC'

    faCaretDown = faCaretDown
    faCaretUp = faCaretUp



    constructor() {
    }

  toggleSortOrder() {
        if (this.sortOrder == this.ASC) {
            this.sortOrder = this.DESC
        } else {
            this.sortOrder = this.ASC
        }
        this.emitState()
    }

    emitState() {
        let state = {
            key: this.sortOptions[this.oznacen].key,
            sortOrder: this.sortOrder,
            checked: this.cbChecked ? this.cbChecked.value : null
        }
        this.sortByKey.next(state)
    }

    ngOnInit() {
        this.sortOrder = this.defaultSortOrder
        if (this.defaultSortingIndex != null) {
            this.oznacen = this.defaultSortingIndex;
            this.sortOrder = this.sortOptions[this.oznacen].defaultSortOrder || this.defaultSortOrder
            // this.emitState()
        }
    }

    onClick(item: SortOption, i: number) {
        if(item.inactive) return;
        if (item.selectAllCheckbox) this.cbChecked.setValue(!this.cbChecked.value);
        if(this.oznacen === i) {
          this.toggleSortOrder();
          return;
        }
        if (i != this.oznacen) {
            this.sortOrder = item.defaultSortOrder || this.ASC
        }
        this.oznacen = i;
        this.emitState()
    }

}
