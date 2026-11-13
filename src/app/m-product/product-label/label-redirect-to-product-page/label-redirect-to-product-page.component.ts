import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-label-redirect-to-product-page',
    templateUrl: './label-redirect-to-product-page.component.html',
    styleUrls: ['./label-redirect-to-product-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class LabelRedirectToProductPageComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    let labelId = +this.route.snapshot.paramMap.get('labelId');
    let productId = this.route.snapshot.paramMap.get('id');
    this.router.navigate(['/product-labels', productId], { state: { labelId: labelId } });
  }

}
