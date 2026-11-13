import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output, Host, Optional, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, AbstractControl } from '@angular/forms';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faFile, faFileImage, faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { faExclamationTriangle, faEye, faFileUpload, faPlusCircle, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import { FileItem, FileUploader, ParsedResponseHeaders, FileUploaderOptions } from 'ng2-file-upload';
import { FileSaverService } from 'ngx-filesaver';
import { merge, Observable, Subject, Subscription } from 'rxjs';
import { distinctUntilChanged, map, shareReplay, tap, take } from 'rxjs/operators';
import { ImageViewerComponent } from 'src/app/shared/image-viewer/image-viewer.component';
import { NgbModalImproved } from 'src/app/core/ngb-modal-improved/ngb-modal-improved.service';
import { environment } from 'src/environments/environment';
import { formatBytes } from 'src/shared/utils';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { CommonControllerService } from 'src/api/api/commonController.service';
import { ClosableComponent } from '../closable/closable.component';

class UploadResponse {
    // public data: { name: string, originalName: string, contentType: string };
  public data;
    constructor(
        public file: FileItem,
        public status: number,
        public body: string,
        public headers: ParsedResponseHeaders) {
        // this.data = this.successful() && this.body ? JSON.parse(body) : {};
        // this.data = this.successful() && this.body ? (JSON.parse(body) as ApiResponseApiDocument).data : null;
        this.extractData(body)
    }

    public extractData(body) {
        this.data = this.successful() && this.body ? (JSON.parse(body)).data : null;
    }

    public successful(): boolean {
        return this.status && this.status >= 200 && this.status < 400;
    }

    public status500(): boolean {
      return this.status && this.status == 500;
    }
}

class AttachmentFileUploader extends FileUploader {
    uploadResponse: EventEmitter<UploadResponse> = new EventEmitter<UploadResponse>();

    onCompleteItem(item: FileItem, response: string, status: number, headers: ParsedResponseHeaders): any {
        this.uploadResponse.emit(new UploadResponse(item, status, response, headers));
    }
}

@Component({
    selector: 'attachment-uploader',
    templateUrl: './attachment-uploader.component.html',
    styleUrls: ['./attachment-uploader.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AttachmentUploaderComponent implements OnInit {

    ////////////////////////////////////
    ///// Fileinfo type specific fields
    ///////////////////////////////////

    private _fileInfo = null;

    get fileInfo() {
        return this._fileInfo;
    }

    set fileInfo(value) {
        let changed = false;
        let prevId = this.form && this.form.value && this.form.value.storageKey
        let newId = value && value.storageKey
        this._fileInfo = value
        if (this.form && prevId != newId) {
            this.form.setValue(value)
            this.form.markAsDirty()
            this.form.updateValueAndValidity()
        }
    }

    get uploadName(): string {
        if (this.form) {
            return this.form.value && (this.form.value).name
        }
        return this.fileInfo && this.fileInfo.name
    }

    get contentType(): string {
        return this.fileInfo && this.fileInfo.contentType
    }

    uploader: AttachmentFileUploader;

    downloadLink() {
      if (this.fileInfo && this.downloadUrl) {
        return this.downloadUrl + '/' + this.fileInfo.storageKey
      } else if (this.fileInfo) {
        return this.rootUrl + '/' + this.fileInfo.storageKey
      }
    }

    identifier() {
        return this.fileInfo && this.fileInfo.storageKey
        // return this.form && this.form.value && this.form.value.storageKey
    }

    inFocus = false;

    onAddFocus() {
        this.inFocus = true
    }

    onAddBlur() {
        this.inFocus = false
    }
    ////////////////////////////////////
    ////////////////////////////////////

    faSyncAlt = faSyncAlt;

    @Input()
    rootImageUrl: string = null;

    @Input('url')
    rootUrl: string = environment.relativeFileUploadUrl//"/api/uploads";

    @Input()
    downloadUrl: string = null;

    @Input()
    useAttachmentUploaderStyle = true

    rootUrlManualType: string = environment.relativeFileUploadUrlManualType//"/api/uploads";

    // @Input()
    // downloadLinkGenerator: (x: number | string) => string = (x: number | string) => {
    //     if (x != null) {
    //         return this.rootUrl + '/' + x + '/download'
    //     }
    //     return ""
    // }

    @Input()
    deleteRouteGenerator: (x: number | string) => string = null

    _form: UntypedFormControl | UntypedFormGroup = null

    @Input() set form(value: UntypedFormControl | UntypedFormGroup) {
        this._form = value;
        let contentValue = value.value
        if (contentValue && contentValue.storageKey) {
            this.fileInfo = contentValue
            this.uploadState = this.arrayMode ? "start" : "ok"
        }
        // this.resubscribe()
    }

    get form(): UntypedFormControl | UntypedFormGroup {
        return this._form;
    }

    @Input()
    flexCol = false;

    @Input() disabled = false

    get isDisabled(): boolean {
        return ((this.form && this.form.disabled) || this.disabled)
    }

    // @Input()
    // metadataLinkGenerator: (x: number | string) => string = (x: number | string) => {
    //     return this.rootUrl + '/' + x
    // }

    @Input()
    mode: string = 'drop'

    @Input()
    uploadAndForget: boolean = false;

    @Input()
    attachmentUploaderId: string = "file";

    @Input()
    label = null

    @Input()
    htmlLabel = null

    @Input()
    invalid = false

    @Input()
    readOnly: boolean = false

    @Input()
    allowedMimeType = ['application/pdf', 'image/png', 'image/jpeg']

    @Input()
    allowedMimeTypeErrorMessage: string = $localize`:@@ui.attachmentUploader.allowedMimeTypeErrorMessageDefault:Upload only file types: PDF, PNG and JPG.`

    @Input()
    maxFileSize = 36 * 1024 * 1024; // 36MB

    @Input()
    type: string = null

    @Input()
    arrayMode: boolean = false

    @Input()
    hideBody = false;

    @Input()
    chainFile = false;

    @Input() showShowIcon = true

    @Input() comment = null

    @Output() onFileInfoLoad = new EventEmitter<any>();

    @Output() onUpload = new EventEmitter<any>();

    @Output() uploadingStatus = new EventEmitter<string>();

    @Output() onDelete = new EventEmitter<any>();

    faPlusCircle = faPlusCircle

    draggingFileOver: boolean = false;

    icon: IconDefinition = faFileUpload;

    uploadUrl?: string;

    lastResponse = null;

    uploadState: 'start' | 'ok' | 'error' = 'start';

    deleteIcon = faTrashAlt;
    showIcon = faEye;

    constructor(
        public httpClient: HttpClient,
        public fileService: CommonControllerService,
        private fileSaverService: FileSaverService,
        private modalService: NgbModalImproved,
        private globalEventsManager: GlobalEventManagerService,
        @Optional() @Host() public closable: ClosableComponent
    ) { }

    metadataPOST$: Subject<any> = new Subject<any>()
    metadataGET$: Observable<any> = null;
    metadata$: Observable<any> = null

    metadataErrorGET$ = new Subject<any>();
    metadataErrorPOST$ = new Subject<any>();
    metadataError$ = merge(this.metadataErrorGET$, this.metadataErrorPOST$);

    metadataSuccessGET$: Subject<boolean> = new Subject<boolean>();
    metadataSuccessPUT$: Subject<boolean> = new Subject<boolean>();
    metadataSuccess$ = merge(this.metadataSuccessGET$, this.metadataSuccessPUT$)

    onLoadPing = new Subject<any>();

    uploaderSubscription: Subscription = null;
    finalSubscription: Subscription = null;

    nalozeno = $localize`:@@ui.attachmentUploader.nalozeno:Uploaded &nbsp;`

    resubscribe() {
        // if(this.form) {
        // this.metadataGET$ = merge(this.form.valueChanges, this.onLoadPing).pipe(
        this.metadataGET$ = this.onLoadPing.pipe(
            distinctUntilChanged(),
            map(val => {
                if (this.form && this.form.value) return this.form.value
                return null
            }),
            // switchMap(fileId => {
            //     if (fileId != null) return (this.fileService.getFileInfo(fileId).pipe(
            //         catchError(val => {
            //             this.metadataErrorGET$.next(val);
            //             return of(null)
            //         })
            //     )
            //     )
            //     return of(null)
            // }),
            tap((val) => {
                this.metadataSuccessGET$.next(!!val)
                // this.onLoad.next(val)
                if (val) {
                    // this.uploadName = val.name
                    // this.uploadUrl = val.url
                    this.uploadState = this.arrayMode ? "start" : "ok"
                    // this.icon = this.getIcon(val ? val.contentType : null);
                }
            })
        )  // metadataGET$
        this.metadata$ = merge(this.metadataGET$, this.metadataPOST$)
            .pipe(
                shareReplay()
            )

        if (this.finalSubscription) {
            this.finalSubscription.unsubscribe()
        }
        this.finalSubscription = this.metadata$.subscribe((val) => {   // ta subscription je obvezen, če ne se nič ne sproži
            this.onFileInfoLoad.next(val)
            this.fileInfo = val;
            this.uploadUrl = this.downloadLink()
        })
        // }
    }


    isRequired() {
      if (!this.form.validator) {
          return false;
      }
      const validator = this.form.validator({} as AbstractControl);
      return (validator && validator.required);
    }

    labelClosedIndicator = this.hideBody
    closableSub: Subscription
    closableSub2: Subscription

    ngOnInit() {
        if (this.closable && this.closable.mode === 'intelligent') {
            this.closable.form = this.form
            this.hideBody = this.closable.controlledHideField$.value
            this.labelClosedIndicator = this.closable.hideField$.value
            this.closableSub = this.closable.controlledHideField$.subscribe(val => {
              this.hideBody = val
            })
            this.closableSub2 = this.closable.hideField$.subscribe(val => {
              this.labelClosedIndicator = val
            })
        }

        let config = {
          url: this.rootImageUrl ? this.rootImageUrl : (this.type ? this.rootUrlManualType + this.type : this.rootUrl),
          autoUpload: true,
          removeAfterUpload: true,
          // authTokenHeader: 'X-AUTH-TOKEN',
          // authToken: this.loginService.getToken(),
          allowedMimeType: this.allowedMimeType,
          maxFileSize: this.maxFileSize
        } as FileUploaderOptions;
        // if(this.allowedFileType) {
        //     config.allowedFileType = this.allowedFileType
        // }
        this.uploader = new AttachmentFileUploader(config);
        this.uploaderSubscription = this.uploader.uploadResponse.subscribe((ev: UploadResponse) => {
          if (ev.successful()) {
            if (!this.uploadAndForget) {
              this.uploadState = this.arrayMode ? "start" : "ok"
              this.icon = this.getIcon(ev.data);
            }
            this.uploadingStatus.next(this.uploadState)
            this.onUpload.next(ev.data)
            this.metadataPOST$.next(ev.data)
          } else {
            this.icon = faExclamationTriangle;
            this.onUpload.next(null)
            this.metadataPOST$.next(null)
          }
          if (this.rootImageUrl && ev.status500()) {
            this.globalEventsManager.push(
              {
                action: 'error',
                notificationType: 'error',
                title: $localize`:@@ui.attachmentUploader.uploader.uploadResponse.error.title:Error`,
                message: $localize`:@@ui.attachmentUploader.uploader.uploadResponse.error.message:Something went wrong on the server side. Please try again.`
              }
            )
          }
        });

        this.resubscribe()
        if (this.form) {
            this.onLoadPing.next(1)
        }

        this.uploader.onWhenAddingFileFailed = (item, filter) => {
            switch (filter.name) {
                case 'fileSize':
                    this.globalEventsManager.push(
                        {
                            action: 'error',
                            notificationType: 'error',
                            title: $localize`:@@ui.attachmentUploader.uploader.onWhenAddingFileFailed.fileSize.error.title:File is too large!`,
                            message: $localize`:@@ui.attachmentUploader.uploader.onWhenAddingFileFailed.fileSize.error.message:Uploaded file size ${formatBytes(item.size)} is larger that the limit ${formatBytes(this.maxFileSize)}.`
                        }
                    )
                    break;
                case 'mimeType':
                    this.globalEventsManager.push(
                        {
                            action: 'error',
                            notificationType: 'error',
                            title: $localize`:@@ui.attachmentUploader.uploader.onWhenAddingFileFailed.mimeType.error.title:Wrong file format!`,
                            message: this.allowedMimeTypeErrorMessage
                        }
                    )
                    break;
                default:
                    break;
            }
        };
        // lahko se zgodi da je form null (če potem parent pohendla med procesom)
        // if(this.isFileInfoForm && !this.form) throw Error("[form] mora biti različna od null, če se uporablja isFileInfoForm")
    }

    isImage() {
        return this.contentType === 'image/jpeg' || this.contentType === 'image/png'
    }

    getIcon(data) {
        if (this.isImage()) return faFileImage;
        return faFile;
    }

    fileOver(e: any) {
        this.draggingFileOver = e;
    }

    deleteCurrent() {
        if (this.form) {
            this.icon = faFileUpload;
            // this.uploadName = null;
            // this.uploadUrl = null;
            this.metadataPOST$.next(null)
            this.uploadState = 'start';
            this.uploadingStatus.next(this.uploadState)
        }
        this.onDelete.next(null);
        if (!this.deleteRouteGenerator || !this.identifier()) return;
        // if (!this.uploadUrl) return;
        this.httpClient.delete(this.deleteRouteGenerator(this.identifier()), { observe: 'response', responseType: 'text' })
            .subscribe((resp) => {
                if (resp.ok) {
                    this.uploadState = 'start';
                    this.uploadingStatus.next(this.uploadState)
                    this.icon = faFileUpload;
                    // this.uploadName = null;
                    // this.uploadUrl = null;
                }
            });
    }

    async showContentModal() {
        // console.log("CM:", this.isImage(), this.fileInfo)
        if (this.isImage()) {
            const modalRef = this.modalService.open(ImageViewerComponent, { centered: true });
            Object.assign(modalRef.componentInstance, {
                modal: false,
                fileInfo: this.fileInfo,
                chainApi: this.downloadUrl ? true : false
            })
        } else {
            if (this.mode === 'simpleAsTextField' && this.fileInfo) {
                let res = await this.fileService.getDocument(this.fileInfo.storageKey).pipe(take(1)).toPromise();
                if (res) {
                    this.fileSaverService.save(res, this.fileInfo.name);
                }
            }
        }
    }

    truncateFilename(n: string, len = 30) {
        return AttachmentUploaderComponent.truncateFilenameGeneric(n, len)
    }

    static truncateFilenameGeneric(n: string, len = 30) {
        if (!n) return n
        let ext = null
        if (n.indexOf('.') < 0) ext = ''
        else ext = n.substring(n.lastIndexOf(".") + 1, n.length)
        let filename = n.replace(/(.*)\.[^\.]*$/, '$1');
        if (filename.length <= len) {
            return n;
        }
        filename = filename.substr(0, len) + (n.length > len ? '[...]' : '');
        return filename + '.' + ext;
    };

    onDownload() {
        if (!this.fileInfo) return
        if (this.rootImageUrl) {
          let subImg = this.fileService.getImage(this.fileInfo.storageKey).subscribe(res => {
            this.fileSaverService.save(res, this.fileInfo.name);
            subImg.unsubscribe();
          })
        } else{
          let sub = this.fileService.getDocument(this.fileInfo.storageKey).subscribe(res => {
            this.fileSaverService.save(res, this.fileInfo.name);
            sub.unsubscribe()
          })

        }

    }

    ngOnDestroy() {
        if (this.finalSubscription) {
            this.finalSubscription.unsubscribe()
        }
        if (this.uploaderSubscription) {
            this.uploaderSubscription.unsubscribe();
        }
        if (this.closableSub) this.closableSub.unsubscribe()
        if (this.closableSub2) this.closableSub2.unsubscribe()
    }

    deleteCurrentReadOnly() {}

}
