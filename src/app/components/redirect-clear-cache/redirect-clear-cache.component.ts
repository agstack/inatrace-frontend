import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-redirect-clear-cache',
    templateUrl: './redirect-clear-cache.component.html',
    styleUrls: ['./redirect-clear-cache.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class RedirectClearCacheComponent implements OnInit {

  constructor(
    private router: Router
  ) { }

  ngOnInit(): void {
    const stockUrlTempl = 'product-labels/([0-9]+)/stock';
    const stakeholdersUrlTempl = 'product-labels/([0-9]+)/stakeholders';
    if ((Array.isArray(this.router.url.match(stockUrlTempl)) && "/" + this.router.url.match(stockUrlTempl)[0] == this.router.url)) {
      localStorage.setItem('token', 'clear-cache');
      const urlArray = this.router.url.split("/");
      urlArray[0] = "/";
      urlArray.push("purchases");
      this.router.navigate(urlArray);
    } else if ((Array.isArray(this.router.url.match(stakeholdersUrlTempl)) && "/" + this.router.url.match(stakeholdersUrlTempl)[0] == this.router.url)) {
      localStorage.setItem('token', 'clear-cache');
      const urlArray = this.router.url.split("/");
      urlArray[0] = "/";
      urlArray.push("value-chain");
      this.router.navigate(urlArray);
    }
  }

}
