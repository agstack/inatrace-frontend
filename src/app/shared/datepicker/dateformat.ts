import { NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { Injectable } from '@angular/core';
import { formatDate } from '@angular/common';

@Injectable()
export class NgbDateCustomParserFormatter extends NgbDateParserFormatter {
    parse(value: string): NgbDateStruct {
        if (value) {
            const dateParts = value.trim().split('.');
            if (dateParts.length === 1) {
                return { day: parseInt(dateParts[0]), month: null, year: null };
            } else if (dateParts.length === 2) {
                return { day: parseInt(dateParts[0]), month: parseInt(dateParts[1]), year: null };
            } else if (dateParts.length === 3) {
                return { day: parseInt(dateParts[0]), month: parseInt(dateParts[1]), year: parseInt(dateParts[2]) };
            }
        }
        return null;
    }

    format(date: NgbDateStruct): string {
        if (!date) return ''
        // POMEMBNO: če delaš na ta način, moraš vedno najprej nastavit leto. Če ne je problem z dnevi kot je 31.5.2000, ki jih pretvori v 1.5.2000
        const dateDate = new Date();
        dateDate.setHours(12, 0, 0, 0);   // 12h so that it doesn't change on UTC
        dateDate.setDate(15);
        dateDate.setFullYear(date['year']);
        dateDate.setMonth(date['month']-1);
        dateDate.setDate(date['day']);
        dateDate.setHours(12, 0, 0, 0);   // 12h so that it doesn't change on UTC
        return dateDate ?
            // formatDate(dateDate, 'd. M. yyyy', 'sl-SI') :
            formatDate(dateDate, 'd. M. yyyy', 'en-US') :
            '';
    }
}
