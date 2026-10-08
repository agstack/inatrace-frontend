import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbActiveModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Angulartics2Module } from 'angulartics2';
import { ToastrModule } from 'ngx-toastr';
import { NgbModalImprovedModule } from '../app/core/ngb-modal-improved/ngb-modal-improved.module';

/**
 * What most components and services need to be created in a TestBed: routing, HTTP,
 * animations, toasts, modals, tooltips and analytics, in their testing variants. Specs add them with
 * `imports: TESTING_IMPORTS, providers: TESTING_PROVIDERS`.
 */
export const TESTING_IMPORTS = [
  RouterTestingModule,
  HttpClientTestingModule,
  NoopAnimationsModule,
  ToastrModule.forRoot(),
  NgbModalImprovedModule,
  NgbTooltipModule,
  Angulartics2Module.forRoot()
];

export const TESTING_PROVIDERS = [
  NgbActiveModal
];
