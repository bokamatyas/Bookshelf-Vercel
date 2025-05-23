import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, Input, QueryList, SimpleChanges, ViewChild, ViewChildren, ViewEncapsulation } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TranslatePipe } from '@ngx-translate/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTab, MatTabChangeEvent, MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { CustomPaginatorComponent } from '../custom-paginator/custom-paginator.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatSortModule } from '@angular/material/sort';
import { animate, style, transition, trigger } from '@angular/animations';
import { UserService } from '../../../services/page/user.service';
import { BookService } from '../../../services/page/book.service';
import { ReviewService } from '../../../services/page/review.service';
import { SummaryService } from '../../../services/page/summary.service';
import { CommentService } from '../../../services/page/comment.service';
import { TranslationService } from '../../../services/global/translation.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaginatedArray } from '../../../models/PaginatedArray';
import { HttpErrorResponse } from '@angular/common/http';
import { BookModel } from '../../../models/Book';
import { ReviewModel } from '../../../models/Review';
import { SummaryModel } from '../../../models/Summary';
import { CommentModel } from '../../../models/Comment';
import { firstValueFrom } from 'rxjs';
import { SortItems } from '../sort-items';
import { UserModel } from '../../../models/User';
import { AuthService } from '../../../services/global/auth.service';
import { ExpansionItemComponent } from './expansion-item/expansion-item.component';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormService } from '../../../services/page/form.service';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
    selector: 'all-type-display',
    imports: [
        MatCardModule,
        TranslatePipe,
        CommonModule,
        FlexLayoutModule,
        MatIconModule,
        MatButtonModule,
        MatTabsModule,
        CustomPaginatorComponent,
        ExpansionItemComponent,
        MatExpansionModule,
        MatListModule,
        MatSortModule,
        TranslatePipe,
        FormlyModule,
        ReactiveFormsModule,
        FormlyMaterialModule,
        MatFormFieldModule,
        MatInputModule
    ],
    templateUrl: './all-type-display.component.html',
    styleUrl: './all-type-display.component.scss',
    encapsulation: ViewEncapsulation.None,
    animations: [
        trigger('onChange', [
            transition('* => *', [
                style({ opacity: 0, transform: 'translateY(-10px)' }),
                animate('500ms ease-in', style({ opacity: 1, transform: 'translateY(0)' }))
            ]),
        ])
    ]
})
export class AllTypeDisplayComponent {
    @Input() isAdmin: boolean = false;
    @Input() observedProfile?: { id: string | number, role: string };

    private authService = inject(AuthService);
    private userService = inject(UserService);
    private bookService = inject(BookService);
    private reviewService = inject(ReviewService);
    private summaryService = inject(SummaryService);
    private commentService = inject(CommentService);
    private translationService = inject(TranslationService);
    private snackBar = inject(MatSnackBar);

    loggedInUser: UserModel | null = null;

    fetchedArray: PaginatedArray = [];
    currentArrayInPaginator: PaginatedArray = [];
    itemType: 'user' | 'book' | 'review' | 'summary' | 'comment' = 'user';
    currentSortSettings: { field: string, mode: 'asc' | 'desc' } = { field: '', mode: 'asc' }

    currentArrayType: 'users' | 'books' | 'reviews' | 'summaries' | 'comments' = 'users';
    animate: boolean = false;

    maxPages: number = 1;
    currentPageIndex = 0;
    pageSize: number = 10;

    errorMessages: HttpErrorResponse[] = [];
    @ViewChild('errorAlert', { static: false }) errorAlert!: ElementRef;
    @ViewChild('tabGroup') tabGroup!: MatTabGroup;
    @ViewChildren(MatTab) tabs!: QueryList<MatTab>;

    formService = inject(FormService);
    searchForm: FormGroup = new FormGroup({});
    searchModel: { username: string } = {username: ''};
    searchId: number | string = '';
    searchFields: FormlyFieldConfig[] = [];

    private fetchMapping = {
        users: {
            fn: () => this.userService.getAllUser(this.pageSize, this.currentPageIndex, this.searchModel?.username !== '' ? this.searchModel?.username : undefined) as any,
            type: 'user' as const
        },
        books: {
            fn: () => this.bookService.getAllBooks(this.pageSize, this.currentPageIndex, this.isAdmin ? this.searchId : (this.observedProfile?.id ?? this.loggedInUser?._id)) as any,
            type: 'book' as const
        },
        reviews: {
            fn: () => this.reviewService.getAllReviews(this.pageSize, this.currentPageIndex, this.isAdmin ? this.searchId : (this.observedProfile?.id ?? this.loggedInUser?._id)) as any,
            type: 'review' as const
        },
        summaries: {
            fn: () => this.summaryService.getAllSummaries(this.pageSize, this.currentPageIndex, this.isAdmin ? this.searchId : (this.observedProfile?.id ?? this.loggedInUser?._id)) as any,
            type: 'summary' as const
        },
        comments: {
            fn: () => this.commentService.getAllcomments(this.pageSize, this.currentPageIndex, this.isAdmin ? this.searchId : (this.observedProfile?.id ?? this.loggedInUser?._id)) as any,
            type: 'comment' as const
        }
    };

    private deleteMapping = {
        user: {
            fn: (id: string) => this.userService.deleteUser(id),
            paginatorKey: 'users' as const
        },
        book: {
            fn: (id: string) => this.bookService.deleteBook(id),
            paginatorKey: 'books' as const
        },
        review: {
            fn: (id: string) => this.reviewService.deleteReview(id),
            paginatorKey: 'reviews' as const
        },
        summary: {
            fn: (id: string) => this.summaryService.deleteSummary(id),
            paginatorKey: 'summaries' as const
        },
        comment: {
            fn: (id: string) => this.commentService.deleteComment(id),
            paginatorKey: 'comments' as const
        }
    };

    private updateMapping = {
        user: {
            fn: (id: number | string, item: UserModel) => this.userService.updateUser(id, item),
            paginatorKey: 'users' as const
        },
        book: {
            fn: (id: number | string, item: BookModel) => this.bookService.updateBook(id, item),
            paginatorKey: 'books' as const
        },
        review: {
            fn: (id: number | string, item: ReviewModel) => this.reviewService.updateReview(id, item),
            paginatorKey: 'reviews' as const
        },
        summary: {
            fn: (id: number | string, item: SummaryModel) => this.summaryService.updateSummary(id, item),
            paginatorKey: 'summaries' as const
        },
        comment: {
            fn: (id: number | string, item: CommentModel) => this.commentService.updateComment(id, item),
            paginatorKey: 'comments' as const
        }
    };

    constructor() {
        this.authService.loggedInUser$.subscribe(user => {
            this.loggedInUser = user;
        });
    }

    ngAfterViewInit() {
        if (!this.isAdmin) {
            if (this.observedProfile !== undefined)
                if (this.observedProfile.role !== 'user')
                    this.changeTabByAriaLabel('books');
                else
                    this.changeTabByAriaLabel('comments');
            else if (this.loggedInUser)
                if (this.loggedInUser.role !== 'user')
                    this.changeTabByAriaLabel('books');
                else
                    this.changeTabByAriaLabel('comments');
        } else {
            this.formService.getAdminSearchForm().then((value) => this.searchFields = value);
            this.changeTabByAriaLabel('users');
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['observedProfile'] && !changes['observedProfile'].firstChange) {
            this.ngAfterViewInit();
        }
    }

    changePaginatedArray(arrayKey: 'users' | 'books' | 'reviews' | 'summaries' | 'comments'): void {
        this.errorMessages = [];
        this.currentArrayInPaginator = [];
        if (this.currentArrayType !== arrayKey) {
            this.currentPageIndex = 0;
            this.maxPages = 1;
            this.currentSortSettings = { field: '', mode: 'asc' };
        }
        this.currentArrayType = arrayKey;
        this.fetchItems(arrayKey);
        this.animate = !this.animate;
    }

    private fetchItems(arrayKey: 'users' | 'books' | 'reviews' | 'summaries' | 'comments'): void {
        this.fetchMapping[arrayKey].fn().subscribe({
            next: (data: any) => {
                console.log(data);
                
                this.fetchedArray = data.data;
                this.itemType = this.fetchMapping[arrayKey].type;
                this.sortItems(this.currentSortSettings)
                this.maxPages = data.pages;
            },
            error: (err: HttpErrorResponse) => {
                if (err.status === 404) {
                    this.currentArrayInPaginator = [];
                    this.maxPages = 1;
                    this.currentPageIndex = 0;
                    return;
                }
                this.onError(err);
            }
        });
    }

    onError(error: HttpErrorResponse): void {
        this.errorMessages.push(error);
        setTimeout(() => {
            this.errorAlert.nativeElement.scrollIntoView({ behavior: 'smooth' });
        });
    }

    changePage(changes: { pageIndex: number; pageSize: number }): void {
        this.currentPageIndex = changes.pageIndex;
        this.pageSize = changes.pageSize;
        this.changePaginatedArray(this.currentArrayType);
    }

    async handleDialogRequest(requestParams: { dialogType: 'delete' | 'edit' | 'roleEdit'; item: { type: 'user' | 'book' | 'review' | 'summary' | 'comment'; _id: string }, modifiedItem?: any }): Promise<void> {
        if (requestParams.dialogType === 'delete') {
            if (!requestParams.item?.type)
                return;
            const mapping = this.deleteMapping[requestParams.item.type];
            if (!mapping) {
                return;
            }
            mapping.fn(requestParams.item._id as any).subscribe({
                next: async (response: { message: string }) => {
                    await this.showDialogSnackbar('STANDALONECOMPONENTS.EXPANSIONITEM.SNACKBAR.DELETED');
                    setTimeout(() => {
                        this.changePaginatedArray(mapping.paginatorKey);
                    }, 1000);
                },
                error: (err: HttpErrorResponse) => this.onError(err)
            });
        }
        if (requestParams.dialogType === 'edit' && requestParams.modifiedItem && requestParams.item?.type !== 'user') {
            const mapping = this.updateMapping[requestParams.item.type];
            if (!mapping) {
                return;
            }
            mapping.fn(requestParams.item._id, (requestParams.modifiedItem as any)).subscribe({
                next: async (response) => {
                    await this.showDialogSnackbar('STANDALONECOMPONENTS.EXPANSIONITEM.SNACKBAR.UPDATED');
                    setTimeout(() => {
                        this.changePaginatedArray(mapping.paginatorKey);
                    }, 1000);
                },
                error: (err: HttpErrorResponse) => this.onError(err)
            });
        }
        if (requestParams.dialogType === 'roleEdit') {
            this.updateMapping['user'].fn(requestParams.item._id, (requestParams.modifiedItem as any)).subscribe({
                next: async (response) => {
                    await this.showDialogSnackbar('STANDALONECOMPONENTS.EXPANSIONITEM.SNACKBAR.UPDATED');
                    setTimeout(() => {
                        this.changePaginatedArray('users');
                    }, 1000);
                },
                error: (err: HttpErrorResponse) => this.onError(err)
            })
        }
    }

    async showDialogSnackbar(snackbarLabel: string): Promise<void> {
        const message = await firstValueFrom(this.translationService.service.get(snackbarLabel));
        const action = await firstValueFrom(this.translationService.service.get('STANDALONECOMPONENTS.EXPANSIONITEM.SNACKBAR.CLOSE'));
        this.snackBar.open(`${message}`, action, {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            duration: 3000
        });
    }

    sortItems(_settings: { field: string, mode: 'asc' | 'desc' }): void {
        if (_settings.field === '') {
            this.currentArrayInPaginator = structuredClone(this.fetchedArray);
            return;
        }
        this.currentSortSettings = _settings;
        this.currentArrayInPaginator = structuredClone(this.fetchedArray);
        this.currentArrayInPaginator = SortItems.generalizedSort(this.currentArrayInPaginator as any[], _settings.field, _settings.mode);
    }

    onTabChange(event: MatTabChangeEvent) {
        this.searchModel!.username = '';
        this.searchId = '';
        this.searchForm.reset();
        this.changePaginatedArray(event.tab.ariaLabel as 'users' | 'books' | 'reviews' | 'summaries' | 'comments');
    }

    changeTabByAriaLabel(label: 'users' | 'books' | 'reviews' | 'summaries' | 'comments'): void {
        const index = this.tabs.toArray().findIndex(tab => tab.ariaLabel === label);
        if (index !== -1) {
            this.tabGroup.selectedIndex = index;
            this.changePaginatedArray(label)
        }
    }

    searchByUsername(): void {
        this.errorMessages = [];        
        this.userService.getUserByName(this.searchModel!.username).subscribe({
            next: (users: any) => {                 
                console.log(users);
                           
                if(this.searchModel.username !== '')                    
                    this.searchId = users.data[0]._id;
                else
                    this.searchId = '';
                this.fetchItems(this.currentArrayType);
            },
            error: (err: HttpErrorResponse) => {
                this.onError(err);
            }
        });
    }
}
