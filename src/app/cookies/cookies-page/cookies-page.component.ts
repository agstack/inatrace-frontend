import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { NgbModalImproved } from '../../core/ngb-modal-improved/ngb-modal-improved.service';
import { CookieManagementModalComponent } from '../cookie-management-modal/cookie-management-modal.component';
import { Router } from '@angular/router';

@Component({
    selector: 'app-cookies-page',
    templateUrl: './cookies-page.component.html',
    styleUrls: ['./cookies-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CookiesPageComponent implements OnInit {

  constructor(
    private modalService: NgbModalImproved,
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  openCookiesSetting() {
    CookieManagementModalComponent.openCookieManagement(this.modalService);
  }

  clearAllCookies() {
    this.router.navigate(['/s/clear-cookies/ALL/null']);
  }
}
