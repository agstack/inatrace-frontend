import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl, AbstractControl } from '@angular/forms';

@Component({
    selector: 'tinymce-textarea',
    templateUrl: './tinymce-textarea.component.html',
    styleUrls: ['./tinymce-textarea.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class TinymceTextareaComponent implements OnInit {
    @Input()
    formControlInput: UntypedFormControl = null;

    @Input()
    label = null;

    @Input()
    invalid = null;

    @Input()
    maxLength = null;

    @Input()
    minLength = null;

    @Input()
    counter = false;

    @Input()
    hideRequired = false;

    @Input()
    disabled = false;

    constructor() { }

    init = {
        base_url: '/tinymce', // Root for resources
        suffix: '.min',       // Suffix to use when loading resources
        license_key: 'gpl',   // Self-hosted community build
        plugins: 'lists advlist link',
        // selector: 'tinymce-textarea',  // change this value according to your HTML
        content_style: '@import url("https://fonts.googleapis.com/css?family=Signika");.mce-content-body {font-size:1rem;font-family:Signika,Helvetica Neue,sans-serif;color:#495057}',
        // content_css: "assets/skins/ui/oxide/content.min.css",
        // skin_url: 'assets/skins/ui/oxide',
        menubar: false,
        toolbar: 'undo redo | bold italic | bullist numlist outdent indent | link'
    };
    
    ngOnInit() {
    }

    isRequired() {
        if (!this.formControlInput) {
            return false;
        }
        if (!this.formControlInput.validator) {
            return false;
        }
        const validator = this.formControlInput.validator({} as AbstractControl);
        return (validator && validator.required);
    }

    getValue() {
        return this.formControlInput
            ? this.formControlInput.value
            : '';
    }

    getSteviloZnakov() {
        const val = this.getValue();
        if (val) {
            const strippedVal = val.replace( /(<([^>]+)>)/ig, '').replace(/&nbsp;/g, '');
            return strippedVal.length;
        }
        return 0;
    }

    getMaxLength() {
        return this.maxLength;
    }

    getMinLength() {
        return this.minLength;
    }

    tooManyCharacters() {
        return (this.getMaxLength() && this.getSteviloZnakov() > this.getMaxLength()) || (this.getMinLength() && this.getSteviloZnakov() < this.getMinLength());
    }

}
