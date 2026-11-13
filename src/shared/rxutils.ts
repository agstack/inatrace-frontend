import { Observable, OperatorFunction, of, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

/**
 * Like switchMap(), but automatically lifts non-observable values to observable.
 * (Like then in promises.)
 */
export function autoSwitchMap<T, R>(func: (value: T) => Observable<R> | Promise<R> | R): OperatorFunction<T, R> {
    return switchMap((value: T) => {
        const result = func(value);
        if (result instanceof Observable || result instanceof Promise) {
            return result;
        } else {
            return of(result);
        }
    });
}

/**
 * Manage a list of subscriptions. May be used by Angular component to delete all subscriptions in ngOnDestroy.
 */
export class UnsubscribeList {
    private static totalSubscriptions = 0;

    private list: Subscription[] = [];

    public add(subscription: Subscription): void {
        // console.log('Adding subscription');
        this.list.push(subscription);
        ++UnsubscribeList.totalSubscriptions;
        // console.log('Live subcriptions: ' + UnsubscribeList.totalSubscriptions);
    }

    public addAll(subscriptions: Subscription[]): void {
        // console.log('Adding ', subscriptions.length, ' subscriptions');
        this.list.splice(0, 0, ...subscriptions);
        UnsubscribeList.totalSubscriptions += subscriptions.length;
        // console.log('Live subcriptions: ' + UnsubscribeList.totalSubscriptions);
    }

    public cleanup(): void {
        // console.log('Unsubscribing ' + this.list.length + ' subscriptions');
        while (this.list.length > 0) {
            const subscription = this.list.pop();
            subscription.unsubscribe();
            --UnsubscribeList.totalSubscriptions;
        }
        // console.log('Live subcriptions: ' + UnsubscribeList.totalSubscriptions);
    }
}
