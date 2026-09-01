import {PlotActionWrapper, PlotCoordinateAction} from './plot-coordinate-action-enum';
import {Subject} from 'rxjs';
// import {Subject} from 'rxjs/internal/Subject';

export class PlotCoordinatesManagerService {

    private plotCoordinateActionSubject: Subject<PlotActionWrapper> = new Subject<PlotActionWrapper>();

    public plotCoordinateAction$ = this.plotCoordinateActionSubject.asObservable();

    constructor() {
    }

    registerEvent(action: PlotCoordinateAction) {
        const plotAction: PlotActionWrapper = {action, plotId: null};
        this.plotCoordinateActionSubject.next(plotAction);
    }
}
