import { Component, Input, OnInit, ViewChild, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { fancyNavigate } from 'src/shared/utils';

@Component({
    selector: 'app-dropdown',
    templateUrl: './dropdown.component.html',
    styleUrls: ['./dropdown.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class DropdownComponent implements OnInit, OnDestroy {
    @Input() links = []
    @Input() top = false
    @Input() dark = false
    @Input() arrow = true
    @Input() arrowBrand = false
    @Input() choiceMode = false
    @Input() searchMenuPlacement = false

    @ViewChild('dropdownContainer', {static: false}) dropdownContainer;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
    ) {}

    open: number = null
    oldOpen = -1

    toggleDropdown(i) {
        if (this.open === i)
            this.closeDropdowns()
        else
            this.openDropdown(i)
    }

    leave(i) {
        if(this.open === i) {
            this.toAutoClose = i
            setTimeout(() => {
                if(this.toAutoClose === i) this.closeDropdowns()
            }, this.delay)
        }
    }

    selectedLink = null;

    setSelectedLink(link) {
        this.selectedLink = link
    }


    registerEnter(i) {
        this.toAutoClose = -1
    }

    toAutoClose = -1

    delay = 1000
    openDropdown(i) {
        this.toAutoClose = -1
        this.open = i
    }

    closeDropdowns() {
        this.open = null
        this.oldOpen = -1
        // this.removeListener()
    }

    closeDropdownsWithDelay(i) {
        this.toAutoClose = i
        setTimeout(() => {
            if(this.toAutoClose === i) this.closeDropdowns()
        }, this.delay)
    }

    navigateTo(link: string) {
        fancyNavigate(this.route, this.router, link)
    }

    getTitle(dropdown) {
        if (this.choiceMode && this.selectedLink) return this.selectedLink.title
        return dropdown.title
    }

    // removeListener() {
    //     window.removeEventListener('click', this.listener)
    //     // window.removeEventListener('mouseover', this.listener)
    // }

    // clickListener(e: any) {
    //     if (this.dropdownContainer && this.dropdownContainer.nativeElement === e.target.closest('ul.dropdown-container')) {
    //         // if (this.oldOpen === this.open) {
    //         //     this.closeDropdowns()
    //         // }
    //     } else {
    //         this.closeDropdowns()
    //     }
    // }

    // listener

    // addListener() {
    //     this.removeListener()
    //     this.listener = this.clickListener.bind(this)
    //     // window.addEventListener('click', this.listener);
    //     // window.addEventListener('mouseover', this.listener);
    // }

    ngOnInit() {}

    ngOnDestroy() {
        // this.removeListener()
    }
}
