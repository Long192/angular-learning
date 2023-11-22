import { createAction, createReducer, on, props } from '@ngrx/store';
import { Core } from '@grapecity/activereports';

const initState = {
  report: {},
};

export const setReport = createAction('setReport', props<{ report: Core.Rdl.Report }>());

export const reportSelector = (state: typeof initState) => state.report;

export const ReportReducer = createReducer(
  initState,
  on(setReport, (state, { report }) => {
    console.log(report);

    return {
      ...state,
      report,
    };
  })
);
