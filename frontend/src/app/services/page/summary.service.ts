import { inject, Injectable } from '@angular/core';
import { CrudService } from '../global/crud.service';
import { SummaryModel, SummaryRoot } from '../../models/Summary';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SummaryService {
    private crudService = inject(CrudService);

    constructor() { }

    getAllSummaries(pageSize: number, pageIndex: number, userId?: number | string): Observable<SummaryRoot> {
        return this.crudService.getAll<SummaryRoot>(`summaries?limit=${pageSize}&page=${pageIndex}${userId ? `&user_id=${userId}` : ''}`);
    }

    deleteSummary(_id: number | string): Observable<any> {
        return this.crudService.delete('summaries', _id)
    }

    updateSummary(_id: number | string, data: SummaryModel): Observable<any> {
        return this.crudService.update('summaries', _id, data);
    }

}
