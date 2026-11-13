import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ProductControllerService } from 'src/api/api/productController.service';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs/operators';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';

@Component({
    selector: 'app-knowledge-blog-front',
    templateUrl: './knowledge-blog-front.component.html',
    styleUrls: ['./knowledge-blog-front.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class KnowledgeBlogFrontComponent implements OnInit {

  knowledgeBlogId = this.route.snapshot.params.knowledgeBlogId;
  type = this.route.snapshot.params.type;
  productId = this.route.snapshot.params.id;
  knowledgeBlogData = null;
  youtubeUrl: string = null;

  constructor(
    private productController: ProductControllerService,
    private route: ActivatedRoute,
    private globalEventsManager: GlobalEventManagerService,
  ) { }

  ngOnInit() {
    this.initializeData();

  }


  async initializeData() {


    if (this.knowledgeBlogId) {
      let resp = await this.productController.getProductKnowledgeBlog(this.knowledgeBlogId).pipe(take(1)).toPromise();
      this.knowledgeBlogData = resp.data;
      if (this.knowledgeBlogData.youtubeUrl) this.youtubeUrl = this.checkExternalLink(this.knowledgeBlogData.youtubeUrl)
    }

  }

  checkExternalLink(link: string): string {
    if (!link) return '#';
    if (!link.startsWith('https://') && !link.startsWith('http://')) {
      return 'http://' + link;
    }
    return link;
  }

}
