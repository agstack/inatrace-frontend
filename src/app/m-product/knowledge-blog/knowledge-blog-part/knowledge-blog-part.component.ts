import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormGroup, UntypedFormArray, UntypedFormControl } from '@angular/forms';
import { ApiDocument } from 'src/api/model/apiDocument';
import { defaultEmptyObject, generateFormFromMetadata } from 'src/shared/utils';
import { ProductControllerService } from 'src/api/api/productController.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiKnowledgeBlog } from 'src/api/model/apiKnowledgeBlog';
import { ApiKnowledgeBlogPart } from 'src/api/model/apiKnowledgeBlogPart';
import { take } from 'rxjs/operators';
import { Location } from '@angular/common';
import { ComponentCanDeactivate } from 'src/app/shared-services/component-can-deactivate';
import { ListEditorManager } from 'src/app/shared/list-editor/list-editor-manager';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';

@Component({
    selector: 'app-knowledge-blog-part',
    templateUrl: './knowledge-blog-part.component.html',
    styleUrls: ['./knowledge-blog-part.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class KnowledgeBlogPartComponent extends ComponentCanDeactivate implements OnInit {

  public canDeactivate(): boolean {
    return !this.form || !(this.changed)
  }

  @Input()
  form: UntypedFormGroup;
  listManager = null;
  title = "";
  currentType = "";

  tempLink = this.router.url.substr(0, this.router.url.lastIndexOf("/"));
  goToLink: string = this.tempLink.substr(0, this.tempLink.lastIndexOf("/"));

  submitted = false;
  knowledgeBlogId = this.route.snapshot.params.knowledgeBlogId;
  type = this.route.snapshot.params.type;
  productId = this.route.snapshot.params.id;
  showPage = false;

  constructor(
    private productController: ProductControllerService,
    private route: ActivatedRoute,
    private globalEventsManager: GlobalEventManagerService,
    private location: Location,
    private router: Router
  ) {
    super()
  }

  ngOnInit(): void {
    this.initializeData()
  }


  get changed(): boolean {
    return this.form.dirty
  }

  get invalid() {
    return this.form.invalid
  }

  async initializeData() {
    this.titleName(this.type);

    if (this.type === 'fairness') { this.currentType = "FAIRNESS"; }
    if (this.type === 'quality') { this.currentType = "QUALITY"; }
    if (this.type === 'provenance') { this.currentType = "PROVENANCE"; }

    if (this.knowledgeBlogId) {
      this.showPage = true;
      const resp = await this.productController.getProductKnowledgeBlog(this.knowledgeBlogId).pipe(take(1)).toPromise();
      const knowledgeBlogData = resp.data;
      this.form = generateFormFromMetadata(ApiKnowledgeBlogPart.formMetadata(), knowledgeBlogData);
    } else {
      this.form = generateFormFromMetadata(ApiKnowledgeBlogPart.formMetadata(), {});
    }
    this.initializeListManagers();
  }

  titleName(type: string) {
    if (this.knowledgeBlogId) this.title += $localize`:@@knowledgeBlogPart.title.edit:Edit `;
    else this.title += $localize`:@@knowledgeBlogPart.title.edit:Add `;

    if (this.type === 'fairness') this.title += $localize`:@@knowledgeBlogPart.title.fairness:Fairness`;
    if (this.type === 'quality') this.title += $localize`:@@knowledgeBlogPart.title.quality:Quality`;
    if (this.type === 'provenance') this.title += $localize`:@@knowledgeBlogPart.title.provenance:Provenance`;
  }

  initializeListManagers() {
    this.listManager = new ListEditorManager<ApiDocument>(
      this.form.get('documents') as UntypedFormArray,
      KnowledgeBlogPartComponent.EmptyObjectFormFactory(), null
    )
  }

  static CreateEmptyObject(): ApiDocument {
    const obj = ApiDocument.formMetadata();
    return defaultEmptyObject(obj) as ApiDocument
  }

  static EmptyObjectFormFactory(): () => UntypedFormControl {
    return () => {
      const f = new UntypedFormControl(KnowledgeBlogPartComponent.CreateEmptyObject())
      return f
    }
  }

  async save() {
    this.submitted = true;
    if (!this.changed) return // nothing to save
    if (this.invalid) {
      this.globalEventsManager.push({
        action: 'error',
        notificationType: 'error',
        title: $localize`:@@knowledgeBlogPart.save.error.title:Error`,
        message: $localize`:@@knowledgeBlogPart.save.error.message:Errors on page. Please check!`
      })
      return false;
    }

    let result = false;

    if (this.knowledgeBlogId) {
      try {
        this.globalEventsManager.showLoading(true);
        let data = this.form.value
        data = { type: this.currentType as ApiKnowledgeBlog.TypeEnum, ...data, id: this.knowledgeBlogId };
        const res = await this.productController.updateProductKnowledgeBlog(data).pipe(take(1)).toPromise()
        if (res && res.status === 'OK') {
          this.form.markAsPristine();
          this.goBack();
          result = true;
        }
      } catch (e) {

      } finally {
        this.globalEventsManager.showLoading(false);
      }
    } else {
      try {
        this.globalEventsManager.showLoading(true);
        let data = this.form.value
        data = { type: this.currentType as ApiKnowledgeBlog.TypeEnum, ...data };
        const res = await this.productController.addProductKnowledgeBlog(this.productId, data).pipe(take(1)).toPromise()
        if (res && res.status === 'OK') {
          this.form.markAsPristine();
          this.goBack();
          result = true;
        }
      } catch (e) {

      } finally {
        this.globalEventsManager.showLoading(false);
      }
    }

    return result;
  }

  goBack() {
    this.location.back();
  }

  viewPage() {
    this.router.navigate(['/', 'blog', this.productId, this.type, this.knowledgeBlogId])
  }

}
