import { SimpleValidationScheme } from 'src/interfaces/Validation';
import { UntypedFormControl, UntypedFormArray, AbstractControl } from '@angular/forms';

export class ListEditorManager<T> {
    constructor(
        public formArray: UntypedFormArray,
        private emptyObjectFactory: (valScheme?: SimpleValidationScheme<T>) => UntypedFormControl,
        private validationScheme: SimpleValidationScheme<T>,
        private activationCallback = (value: boolean) => null
    ) {
        if (this.activationCallback) {
            this.setIsActiveCallback(this.activationCallback)
        }
    }

    open = -1;   // kateri element lista je odprt

    lastNew = null;   // vodi evidenco, če je zadnji odprt v editingu
    public delete(i: number) {
        if (this.formArray) {
            this.formArray.removeAt(i)
            this.formArray.markAsDirty()
            this.formArray.markAsTouched()  // nujno zaradi testa pri updateArray
        }
    }

    get arrayLength() {
        return this.formArray.length
    }

    isActiveCallback: (value: boolean) => void;

    public setIsActiveCallback(callback: (value: boolean) => null) {
        if (!callback) throw Error("activationCallback ne sme biti null")
        this.isActiveCallback = callback;
    }

    public addNew(returnFocusElement) {
        if (this.formArray) {
            const form: UntypedFormControl = this.emptyObjectFactory(this.validationScheme)
            const oldLength = this.formArray.controls.length
            this.lastNew = oldLength
            this.formArray.push(form)
            this.toggle(oldLength, returnFocusElement)
        }
    }

    returnFocusElement = null

    public toggle(i, returnFocusElement) {
        const doFocus = this.open === i
        this.open = this.open == i ? -1 : i
        if (this.isActiveCallback) {
            this.isActiveCallback(this.open >= 0)
        }
        if (doFocus && this.returnFocusElement) {
            const tmpReturn = this.returnFocusElement
            setTimeout(() => {
                tmpReturn.focus()
            }, 500)
        }
        this.returnFocusElement = returnFocusElement
    }

    public isOpen(i: number): boolean {
        return this.open == i
    }

    public onDrop(event) {
        const ctrl: AbstractControl = this.formArray.controls[event.previousIndex];
        this.formArray.removeAt(event.previousIndex)
        this.formArray.insert(event.currentIndex, ctrl);
        this.formArray.markAsDirty()
        this.formArray.updateValueAndValidity()
    }

    public cancel(i: number) {
        // preveri, da trenutni skenslani ni slučajno prazen
        if (i == this.lastNew) {
            this.formArray.removeAt(i)
            //this.formArray.markAsDirty()
            this.formArray.updateValueAndValidity()
            this.lastNew = null
        }
        this.toggle(i, null)
    }

    public save(i: number) {
        if (this.formArray) {
            this.formArray.markAsDirty()
            const form = this.formArray.at(i)
            if (form) {
                form.markAsDirty()
            }
        }
        this.lastNew = null
        this.toggle(i, null)
    }

    public isDisabled() {
        return this.formArray && this.formArray.enabled === false
    }

}


// avtor
// vodi evidenco če je submitted
// naredi kopijo sebe, submita sebe
// ima svoje gumbke za submitanje in canclanje, preko tag komponente
// ima tri mode:
// - edit module
// - list mode
// Dodatno ima tag mode še pravice iz taga
// ima delete callback


// tag je svoja komponenta in ima dva moda
// - edit mode
// - readonly mode
// Imamo tudi list pravic editable, deletable
