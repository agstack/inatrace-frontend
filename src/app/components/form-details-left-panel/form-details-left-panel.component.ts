import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
    selector: 'app-form-details-left-panel',
    templateUrl: './form-details-left-panel.component.html',
    styleUrls: ['./form-details-left-panel.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class FormDetailsLeftPanelComponent implements OnInit {

  @Input()
  title: string = null;

  @Input()
  showIcon = false;

  @Input()
  goToLink: string = null;

  @Input()
  goToBack = false;


  constructor(
    private location: Location,
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  goBack() {
    this.location.back();
  }

  goTo(){
    if (this.goToLink) this.router.navigate([this.goToLink])
    if (this.goToBack) this.goBack();
  }
}
