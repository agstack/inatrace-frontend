import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonControllerService } from 'src/api/api/commonController.service';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { NgbModalImproved } from 'src/app/core/ngb-modal-improved/ngb-modal-improved.service';
import { SettingsComponent } from '../settings.component';
import { AuthService } from '../../core/auth.service';

@Component({
    selector: 'app-settings-types',
    templateUrl: './settings-types.component.html',
    styleUrls: ['../settings.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SettingsTypesComponent extends SettingsComponent {

  rootTab = 1;

  constructor(
    protected globalEventsManager: GlobalEventManagerService,
    protected commonController: CommonControllerService,
    protected modalService: NgbModalImproved,
    protected router: Router,
    protected authService: AuthService
  ) {
    super(
        globalEventsManager, commonController, modalService, router, authService);
  }

}
