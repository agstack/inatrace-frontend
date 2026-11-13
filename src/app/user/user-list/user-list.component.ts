import { Component, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { UserControllerService } from 'src/api/api/userController.service';
import { UserDetailComponent } from '../user-detail/user-detail.component';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { UntypedFormControl } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { startWith, debounceTime, tap, switchMap, map, shareReplay, take } from 'rxjs/operators';
import { EnumSifrant } from '../../shared-services/enum-sifrant';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { SortOption } from '../../shared/result-sorter/result-sorter-types';
import { ApiPaginatedResponseApiUserBase } from '../../../api/model/apiPaginatedResponseApiUserBase';

@Component({
    selector: 'app-user-list',
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class UserListComponent implements OnInit, OnDestroy {

  faTimes = faTimes;

  users = [];
  @ViewChild(UserDetailComponent) userDetails;
  listErrorStatus$: BehaviorSubject<string>;

  searchQuery = new UntypedFormControl(null);
  searchStatus = new UntypedFormControl('');
  searchRole = new UntypedFormControl('');
  reloadPing$ = new BehaviorSubject<boolean>(false);
  pagingParams$ = new BehaviorSubject({});
  sortingParams$ = new BehaviorSubject({ sortBy: 'name', sort: 'ASC' });
  paging$ = new BehaviorSubject<number>(1);

  allUsers = 0;
  showedUsers = 0;

  page = 0;
  pageSize = 10;

  myUsers = new UntypedFormControl(true);

  searchParams$ = combineLatest(
      this.searchQuery.valueChanges.pipe(
          startWith(null),
          debounceTime(200)
      ),
      this.searchStatus.valueChanges.pipe(
          startWith(null)
      ),
      this.searchRole.valueChanges.pipe(
          startWith(null)
      ),
      this.myUsers.valueChanges.pipe(
          startWith(true),
      ),
      (query: string, status: string, role: string, myUsers: boolean) => {
        return { query, status, role, myUsers };
      }
  );

  users$ = combineLatest(this.reloadPing$, this.paging$, this.searchParams$, this.sortingParams$,
      (ping: boolean, page: number, search: any, sorting: any) => {
        return {
          ...search,
          ...sorting,
          offset: (page - 1) * this.pageSize,
          limit: this.pageSize
        };
      }).pipe(
      tap(() => this.globalEventsManager.showLoading(true)),
      switchMap(params => {
        const myUsers = params.myUsers;
        const newParams = { ...params };
        delete newParams.myUsers;

        if (this.isRegionalAdmin) {
          return this.userController.regionalAdminListUsersByMap(newParams);
        } else {
          if (myUsers) {
            return this.userController.listUsersByMap(newParams);
          } else {
            return this.userController.adminListUsersByMap(newParams);
          }
        }
      }),
      map((resp: ApiPaginatedResponseApiUserBase) => {
        if (resp) {
          if (resp.data && resp.data.count && (this.pageSize - resp.data.count > 0)) { this.showedUsers = resp.data.count; }
          else {
            const temp = resp.data.count - (this.pageSize * (this.page - 1));
            this.showedUsers = temp >= this.pageSize ? this.pageSize : temp;
          }
          return resp.data;
        }
      }),
      tap(() => this.globalEventsManager.showLoading(false)),
      shareReplay(1)
  );

  codebookStatus = EnumSifrant.fromObject(this.statusList);

  sortOptions: SortOption[] = [
    {
      key: 'name',
      name: $localize`:@@userList.sortOptions.name.name:Name`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'surname',
      name: $localize`:@@userList.sortOptions.surname.name:Surname`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'email',
      name: $localize`:@@userList.sortOptions.email.name:E-mail`,
    },
    {
      key: 'role',
      name: $localize`:@@userList.sortOptions.role.name:Role`,
      inactive: true
    },
    {
      key: 'status',
      name: $localize`:@@userList.sortOptions.status.name:Status`,
      inactive: true
    },
    {
      key: 'actions',
      name: $localize`:@@userList.sortOptions.actions.name:Actions`,
      inactive: true
    }
  ];

  routerSub: Subscription;

  isSystemAdmin = false;
  isRegionalAdmin = false;

  constructor(
    private userController: UserControllerService,
    protected globalEventsManager: GlobalEventManagerService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {

    this.authService.userProfile$.pipe(take(1)).subscribe(up => {
      this.isSystemAdmin = up?.role === 'SYSTEM_ADMIN';
      this.isRegionalAdmin = up?.role === 'REGIONAL_ADMIN';
      this.setAllUsers().then();
    });

    this.listErrorStatus$ = new BehaviorSubject<string>('');
    this.routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && event.url === '/users') {
        this.reloadPage();
      }
    });
  }

  ngOnDestroy() {
    if (this.routerSub) { this.routerSub.unsubscribe(); }
  }

  async setAllUsers() {

    if (this.isRegionalAdmin) {
      const res = await this.userController.regionalAdminListUsers(null, null, null, null, null, 'COUNT').pipe(take(1)).toPromise();
      if (res && res.status === 'OK' && res.data && res.data.count >= 0) {
        this.allUsers = res.data.count;
      }
    }
    else if (this.isSystemAdmin) {
      const res = await this.userController.adminListUsers(null, null, null, null, null, 'COUNT').pipe(take(1)).toPromise();
      if (res && res.status === 'OK' && res.data && res.data.count >= 0) {
        this.allUsers = res.data.count;
      }
    } else {
      const res = await this.userController.listUsers(null, null, null, null, null, 'COUNT').pipe(take(1)).toPromise();
      if (res && res.status === 'OK' && res.data && res.data.count >= 0) {
        this.allUsers = res.data.count;
      }
    }
  }

  get statusList() {
    const obj = {};
    obj[''] = $localize`:@@userList.statusList.all:All`;
    obj['UNCONFIRMED'] = $localize`:@@userList.statusList.unconfirmed:Unconfirmed`;
    obj['CONFIRMED_EMAIL'] = $localize`:@@userList.statusList.comfirmedEmail:Comfirmed email`;
    obj['ACTIVE'] = $localize`:@@userList.statusList.active:Active`;
    obj['DEACTIVATED'] = $localize`:@@userList.statusList.deactiveted:Deactiveted`;
    return obj;
  }

  changeSort(event) {
    this.sortingParams$.next({ sortBy: event.key, sort: event.sortOrder });
  }

  async activate(id) {
    try {
      this.globalEventsManager.showLoading(true);
      await this.userController.activateUser('ACTIVATE_USER', { id }).pipe(take(1)).toPromise();
      this.reloadPage();
    } catch (e) {
      this.globalEventsManager.push({
        action: 'error',
        notificationType: 'error',
        title: $localize`:@@userList.activate.error.title:Error!`,
        message: $localize`:@@userList.activate.error.message:Cannot activate the user.`
      });
    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

  async deactivate(id) {
    try {
      this.globalEventsManager.showLoading(true);
      await this.userController.activateUser('DEACTIVATE_USER', { id }).pipe(take(1)).toPromise();
      this.reloadPage();
    } catch (e) {
      this.globalEventsManager.push({
        action: 'error',
        notificationType: 'error',
        title: $localize`:@@userList.deactivate.error.title:Error!`,
        message: $localize`:@@userList.deactivate.error.message:Cannot deactivate the user.`
      });
    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

  reloadPage() {
    this.reloadPing$.next(true);
  }

  onPageChange(event) {
    this.paging$.next(event);
  }

  editUser(userId) {
    this.router.navigate(['/users', userId], {queryParams: {returnUrl: this.router.routerState.snapshot.url}}).then();
  }

  async setUserRole(id, action: 'SET_USER_SYSTEM_ADMIN' | 'UNSET_USER_SYSTEM_ADMIN' | 'SET_USER_REGIONAL_ADMIN' | 'UNSET_USER_REGIONAL_ADMIN') {
    try {
      this.globalEventsManager.showLoading(true);
      await this.userController.activateUser(action, { id })
        .pipe(take(1))
        .toPromise();
      this.reloadPage();
    } catch (e) {
      this.globalEventsManager.push({
        action: 'error',
        notificationType: 'error',
        title: $localize`:@@userList.setAdmin.error.title:Error`,
        message: $localize`:@@userList.setAdmin.error.message:Cannot change user role.`
      });
    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

  clearValue(form: UntypedFormControl, myUsers = false) {
    if (myUsers) { form.setValue(false); }
    else { form.setValue(''); }
  }

  showStatus(value: string, userRole = false) {
    if (userRole) { this.searchRole.setValue(value); }
    else { this.searchStatus.setValue(value); }
  }

  myUsersOnly(my: boolean) {
    this.myUsers.setValue(my);
  }

  showPagination() {
    return ((this.showedUsers - this.pageSize) === 0 && this.allUsers >= this.pageSize) || this.page > 1;
  }

}
