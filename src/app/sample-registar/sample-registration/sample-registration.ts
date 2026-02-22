import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, Observable, Subject, takeUntil } from 'rxjs';
import { Analyst, SampleResult, SampleService, TestParameter, TestParameterResult } from '../../services/sample-service';
import { Router } from '@angular/router';
import { SampleRequest } from '../../interfaces/sample-request';
import { CommonModule } from '@angular/common';
import { SampleHeader } from "../sample-header/sample-header";
import { ColdObservable } from 'rxjs/internal/testing/ColdObservable';
import { GeneralInformationModel, GeneralInformationService } from '../../services/general-information-service';
import { GeneralInformationservice } from '../../services/general-information';
// ── Interfaces ─────────────────────────────────────────────────────────────

interface SampleDescriptionItem {
  sampleDescription: string;
  analysisProtocol?:  string;
  formatNumber?:      string;
  [key: string]:      any;
}

interface GeneralInfoDropDown {
  id?:               number;
  parameterName:     string;
  sampleDescription?: string;
  defaultValues?:    string;
  values?:           string;
  choiceList?:       string[];
}

interface ResultDropDown {
  id?:               number;
  name:              string;
  unit:              string;
  result:            string;
  sampleDescription: string;
  protocal:          string;
  standarded:        string;
  parameterType?:    string;
  scopeYear?:        string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function parseChoices(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function pickDefaultValue(param: GeneralInfoDropDown): string {
  if (param.defaultValues && !param.defaultValues.includes(',')) return param.defaultValues.trim();
  const choices = parseChoices(param.values ?? param.defaultValues);
  return choices.length > 0 ? choices[0] : '';
}

function toInfoModel(raw: any, fallbackDesc = ''): GeneralInformationModel | null {
  if (!raw || typeof raw !== 'object') return null;
  const name = (raw.name ?? raw.parameterName ?? '').toString().trim();
  if (!name) return null;
  return {
    id:                raw.id != null ? Number(raw.id) : undefined,
    name,
    value:             raw.value != null ? raw.value.toString() : '',
    reportNumber:      (raw.reportNumber ?? '').toString(),
    sampleDescription: (raw.sampleDescription ?? fallbackDesc).toString(),
  };
}

function templateToTestResult(t: any, reportNo = ''): TestParameterResult {
  return {
    parameterName:      t.name        ?? '',
    unit:               t.unit        ?? '',
    resultValue:        '',
    detectionLimit:     '',
    specificationLimit: t.standarded  ?? '',
    protocolUsed:       t.protocal    ?? '',
    complies:           false,
    remarks:            '',
    reportNo,
    analystName:        '',   // ✅ blank until assigned
  };
}

// ── Component ──────────────────────────────────────────────────────────────


@Component({
  selector: 'app-sample-registration',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SampleHeader],
  templateUrl: './sample-registration.html',
  styleUrl: './sample-registration.css',
})
export class SampleRegistration   implements OnInit, OnDestroy {
// ── Form ──────────────────────────────────────────────────────────────────
  sampleForm!:   FormGroup;
  submitSuccess  = false;
  submitError    = false;
  errorMessage   = '';

  // ── Toast ─────────────────────────────────────────────────────────────────
  uiMessage      = '';
  uiMessageType: 'success' | 'error' | '' = '';

  // ── Step 1 ────────────────────────────────────────────────────────────────
  sampleDescriptions:     SampleDescriptionItem[] = [];
  loadingDescriptions     = false;
  registeredSampleNumber  = '';
  registeredReportNumber  = '';
  activeSampleDescription = '';

  // ── Step 2 — General Information ──────────────────────────────────────────
  informations:         GeneralInformationModel[] = [];
  generalInfoDropDowns: GeneralInfoDropDown[]     = [];
  selectedInfoParam:    GeneralInfoDropDown | null = null;
  newInfo:              GeneralInformationModel   = { name: '', value: '', reportNumber: '' };
  isLoadingInfo         = false;
  isLoadingDropDowns    = false;
  generalInfoSaved      = false;

  // ── Step 3 — Result Parameters ────────────────────────────────────────────
  resultDropDowns:         ResultDropDown[]      = [];
  selectedResultDropDown:  ResultDropDown | null = null;
  testParameterResults:    TestParameterResult[] = [];
  isLoadingResults         = false;
  isLoadingResultDropDowns = false;
  resultsSaved             = false;

  // ✅ Analyst list for job card assignment
  analysts:         Analyst[] = [];
  isLoadingAnalysts = false;

  // ── Global Save All ───────────────────────────────────────────────────────
  isSavingAll = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb:            FormBuilder,
    private sampleService: SampleService,
    private infoService:   GeneralInformationService,
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadSampleDescriptions();
    this.loadAnalysts();           // ✅ load analysts on init
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  // ── Form Init ──────────────────────────────────────────────────────────────

  private initializeForm(): void {
    this.sampleForm = this.fb.group({
      projectName:                 ['', [Validators.required, Validators.minLength(3)]],
      address:                     ['', [Validators.required, Validators.minLength(5)]],
      sampleDescription:           ['', Validators.required],
      samplingAndAnalysisProtocol: [''],
      formatNumber:                [''],
      partyReferenceNumber:        [''],
      periodOfAnalysis:            [''],
      dateOfReceiving:             ['', Validators.required],
    });
  }

  // ── Load Analysts ─────────────────────────────────────────────────────────

  loadAnalysts(): void {
    this.isLoadingAnalysts = true;
    this.sampleService.getAllAnalysts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isLoadingAnalysts = false;
          if (res.status === 'SUCCESS' && Array.isArray(res.data)) {
            this.analysts = res.data;
          }
        },
        error: (err) => {
          this.isLoadingAnalysts = false;
          console.error('[loadAnalysts]', err);
        },
      });
  }

  // ── Step 1: Load Sample Descriptions ──────────────────────────────────────

  loadSampleDescriptions(): void {
    this.loadingDescriptions = true;
    this.sampleForm.get('sampleDescription')?.disable();

    this.sampleService.getAllSampleDescriptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loadingDescriptions = false;
          if (res.status === 'SUCCESS' && Array.isArray(res.data)) {
            this.sampleDescriptions = res.data as SampleDescriptionItem[];
          }
          this.sampleForm.get('sampleDescription')?.enable();
        },
        error: () => {
          this.loadingDescriptions = false;
          this.sampleForm.get('sampleDescription')?.enable();
          this.setError('Failed to load sample descriptions');
        },
      });
  }

  onSampleDescriptionChange(event: Event): void {
    const selected = (event.target as HTMLSelectElement).value;
    const selectedItem = this.sampleDescriptions.find(item => item.sampleDescription === selected);
    if (!selectedItem) return;

    this.activeSampleDescription = selectedItem.sampleDescription;
    this.sampleForm.patchValue({
      samplingAndAnalysisProtocol: selectedItem.analysisProtocol ?? '',
      formatNumber:                selectedItem.formatNumber      ?? '',
    });

    this.informations           = [];
    this.testParameterResults   = [];
    this.generalInfoSaved       = false;
    this.resultsSaved           = false;
    this.generalInfoDropDowns   = [];
    this.resultDropDowns        = [];
    this.selectedInfoParam      = null;
    this.selectedResultDropDown = null;
    this.newInfo = { name: '', value: '', reportNumber: '' };

    this.loadGeneralInfoDropDowns(this.activeSampleDescription);
    this.loadResultDropDowns(this.activeSampleDescription);
  }

  // ── SAVE ALL ───────────────────────────────────────────────────────────────

  saveAll(): void {
    if (this.sampleForm.invalid) {
      this.markFormGroupTouched(this.sampleForm);
      this.showMessage('Please fill all required fields in Sample Details', 'error');
      return;
    }

    this.isSavingAll      = true;
    this.submitSuccess    = false;
    this.generalInfoSaved = false;
    this.resultsSaved     = false;

    this.sampleService.addSample(this.sampleForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.submitSuccess          = true;
          this.registeredSampleNumber = res.data?.sampleNumber ?? '';
          this.registeredReportNumber = res.data?.reportNumber  ?? '';
          this.newInfo.reportNumber   = this.registeredReportNumber;

          this.informations = this.informations.map(info => ({
            ...info,
            id:                undefined,
            reportNumber:      this.registeredReportNumber,
            sampleDescription: this.activeSampleDescription,
          }));

          this.testParameterResults = this.testParameterResults.map(r => ({
            ...r,
            id:       undefined,
            reportNo: this.registeredReportNumber,
          }));

          this.persistInfoAndResults(() => {
            this.isSavingAll = false;
            this.showMessage(
              `Saved! Sample: ${this.registeredSampleNumber} · Report: ${this.registeredReportNumber}`,
              'success'
            );
          });
        },
        error: (err) => {
          this.isSavingAll   = false;
          this.submitSuccess = false;
          this.setError(err?.error?.message ?? 'Failed to register sample.');
        },
      });
  }

  private persistInfoAndResults(onDone: () => void): void {
    const infoRequests$:   Observable<any>[] = [];
    const resultRequests$: Observable<any>[] = [];

    this.informations.forEach((info, idx) => {
      info.reportNumber      = this.registeredReportNumber;
      info.sampleDescription = this.activeSampleDescription;

      infoRequests$.push(new Observable(observer => {
        this.infoService.addInformation(info).pipe(takeUntil(this.destroy$)).subscribe({
          next: (res) => {
            if (res?.status === 'SUCCESS' && res.data) {
              const saved = toInfoModel(res.data, this.activeSampleDescription);
              if (saved) {
                if (!saved.value) saved.value = info.value;
                this.informations[idx] = saved;
                this.informations = [...this.informations];
              }
            }
            observer.next(res); observer.complete();
          },
          error: (e) => observer.error(e),
        });
      }));
    });

    this.testParameterResults.forEach((result, idx) => {
      result.reportNo = this.registeredReportNumber;

      resultRequests$.push(new Observable(observer => {
        this.sampleService.createTestParameterResult(result).pipe(takeUntil(this.destroy$)).subscribe({
          next: (res: any) => {
            const savedData = res?.data ?? res;
            if (savedData?.id != null) {
              this.testParameterResults[idx] = { ...result, id: Number(savedData.id) };
              this.testParameterResults = [...this.testParameterResults];
            }
            observer.next(res); observer.complete();
          },
          error: (e) => observer.error(e),
        });
      }));
    });

    const infoObs$   = infoRequests$.length   > 0 ? forkJoin(infoRequests$)   : null;
    const resultObs$ = resultRequests$.length > 0 ? forkJoin(resultRequests$) : null;

    if (!infoObs$ && !resultObs$) {
      this.generalInfoSaved = true;
      this.resultsSaved     = true;
      onDone();
      return;
    }

    const saveInfo$ = new Observable(observer => {
      if (!infoObs$) { this.generalInfoSaved = true; observer.next(null); observer.complete(); return; }
      infoObs$.pipe(takeUntil(this.destroy$)).subscribe({
        next:  () => { this.generalInfoSaved = true; observer.next(null); observer.complete(); },
        error: (e) => observer.error(e),
      });
    });

    const saveResults$ = new Observable(observer => {
      if (!resultObs$) { this.resultsSaved = true; observer.next(null); observer.complete(); return; }
      resultObs$.pipe(takeUntil(this.destroy$)).subscribe({
        next:  () => { this.resultsSaved = true; observer.next(null); observer.complete(); },
        error: (e) => observer.error(e),
      });
    });

    forkJoin([saveInfo$, saveResults$])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => onDone(),
        error: (err) => {
          this.isSavingAll = false;
          this.showMessage(err?.error?.message ?? 'Some rows failed to save. Please try again.', 'error');
        },
      });
  }

  onReset(): void {
    this.sampleForm.reset();
    this.submitSuccess           = false;
    this.submitError             = false;
    this.errorMessage            = '';
    this.informations            = [];
    this.testParameterResults    = [];
    this.generalInfoSaved        = false;
    this.resultsSaved            = false;
    this.activeSampleDescription = '';
    this.registeredSampleNumber  = '';
    this.registeredReportNumber  = '';
    this.generalInfoDropDowns    = [];
    this.resultDropDowns         = [];
    this.selectedInfoParam       = null;
    this.selectedResultDropDown  = null;
    this.newInfo                 = { name: '', value: '', reportNumber: '' };
    this.uiMessage               = '';
    this.isSavingAll             = false;
  }

  // ── Step 2: General Information ────────────────────────────────────────────

  loadGeneralInfoDropDowns(sampleDescription: string): void {
    if (!sampleDescription) return;
    this.isLoadingDropDowns = true;
    this.sampleService.getGeneralInfoDropDownsBySampleDescription(sampleDescription)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isLoadingDropDowns = false;
          if (res.status === 'SUCCESS' && Array.isArray(res.data)) {
            this.generalInfoDropDowns = res.data.map((item: any) => ({
              ...item,
              choiceList: parseChoices(item.values ?? item.defaultValues),
            }));
            if (this.informations.length === 0) {
              this.informations = this.generalInfoDropDowns.map(param => ({
                name:              param.parameterName,
                value:             pickDefaultValue(param),
                reportNumber:      '',
                sampleDescription: this.activeSampleDescription,
              }));
            }
          }
        },
        error: (err) => { this.isLoadingDropDowns = false; console.error('[loadGeneralInfoDropDowns]', err); },
      });
  }

  loadSavedGeneralInfo(reportNumber: string): void {
    if (!reportNumber) return;
    this.isLoadingInfo = true;
    this.infoService.getByReportNumber(reportNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isLoadingInfo = false;
          if (res.status === 'SUCCESS' && Array.isArray(res.data) && res.data.length > 0) {
            this.informations = res.data
              .map((raw: any) => toInfoModel(raw, this.activeSampleDescription))
              .filter((m): m is GeneralInformationModel => m !== null);
            this.generalInfoSaved = this.informations.some(i => typeof i.id === 'number');
          }
        },
        error: (err) => { this.isLoadingInfo = false; console.error('[loadSavedGeneralInfo]', err); },
      });
  }

  onInfoParamSelect(param: GeneralInfoDropDown | null): void {
    this.selectedInfoParam = param;
    if (param) { this.newInfo.name = param.parameterName; this.newInfo.value = pickDefaultValue(param); }
  }

  addInformationRow(): void {
    if (!this.newInfo.name?.trim()) { this.showMessage('Please select a parameter', 'error'); return; }
    if (this.informations.some(i => i.name === this.newInfo.name)) {
      this.showMessage('This parameter is already in the list', 'error'); return;
    }
    this.informations = [...this.informations, {
      name: this.newInfo.name, value: this.newInfo.value,
      reportNumber: '', sampleDescription: this.activeSampleDescription,
    }];
    this.selectedInfoParam = null;
    this.newInfo = { name: '', value: '', reportNumber: '' };
  }

  removeInformation(info: GeneralInformationModel, index: number): void {
    this.informations.splice(index, 1);
    this.informations     = [...this.informations];
    this.generalInfoSaved = this.informations.some(i => typeof i.id === 'number');
  }

  // ── Step 3: Result Parameters ──────────────────────────────────────────────

  loadResultDropDowns(sampleDescription: string): void {
    if (!sampleDescription) return;
    this.isLoadingResultDropDowns = true;
    this.sampleService.getResultDropDownsBySampleDescription(sampleDescription)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isLoadingResultDropDowns = false;
          if (res.status === 'SUCCESS' && Array.isArray(res.data) && res.data.length > 0) {
            this.resultDropDowns = res.data.map((t: any) => ({
              id: t.id, name: t.name ?? '', unit: t.unit ?? '', result: t.result ?? '',
              protocal: t.protocal ?? '', standarded: t.standarded ?? '',
              sampleDescription: t.sampleDescription ?? sampleDescription,
              parameterType: t.parameterType ?? null, scopeYear: t.scopeYear ?? null,
            }));
            if (this.testParameterResults.length === 0) {
              this.testParameterResults = res.data.map((t: any) => templateToTestResult(t, ''));
            }
          }
        },
        error: (err) => {
          this.isLoadingResultDropDowns = false;
          console.error('[loadResultDropDowns]', err);
          this.showMessage('Failed to load result parameters', 'error');
        },
      });
  }

  loadSavedTestResults(reportNo: string): void {
    if (!reportNo) return;
    this.isLoadingResults = true;
    this.sampleService.getTestParameterResultsByReportNo(reportNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isLoadingResults = false;
          if (res.status === 'SUCCESS' && Array.isArray(res.data) && res.data.length > 0) {
            this.testParameterResults = res.data;
          }
        },
        error: (err) => { this.isLoadingResults = false; console.error('[loadSavedTestResults]', err); },
      });
  }

  onResultDropDownSelect(selected: ResultDropDown | null): void {
    this.selectedResultDropDown = selected;
  }

  addResultFromDropDown(): void {
    if (!this.selectedResultDropDown) return;
    this.testParameterResults = [
      ...this.testParameterResults,
      templateToTestResult(this.selectedResultDropDown, ''),
    ];
    this.selectedResultDropDown = null;
  }

  addBlankResult(): void {
    this.testParameterResults = [...this.testParameterResults, {
      parameterName: '', unit: '', resultValue: '', detectionLimit: '',
      specificationLimit: '', protocolUsed: '', complies: false,
      remarks: '', reportNo: '', analystName: '',
    }];
  }

  deleteTestResult(result: TestParameterResult, index: number): void {
    this.testParameterResults.splice(index, 1);
    this.testParameterResults = [...this.testParameterResults];
  }

  // ── Utilities ──────────────────────────────────────────────────────────────

  isFieldInvalid(fieldName: string): boolean {
    const f = this.sampleForm.get(fieldName);
    return !!(f?.invalid && (f.dirty || f.touched));
  }

  isInfoRowUnsaved(info: GeneralInformationModel): boolean { return typeof info.id !== 'number'; }
  isTestResultRowUnsaved(r: TestParameterResult):  boolean { return typeof r.id    !== 'number'; }

  private setError(msg: string): void {
    this.submitError  = true;
    this.errorMessage = msg;
    this.showMessage(msg, 'error');
    setTimeout(() => { this.submitError = false; this.errorMessage = ''; }, 5000);
  }

  showMessage(message: string, type: 'success' | 'error' = 'success'): void {
    this.uiMessage     = message;
    this.uiMessageType = type;
    setTimeout(() => { this.uiMessage = ''; this.uiMessageType = ''; }, 4000);
  }

  private markFormGroupTouched(fg: FormGroup): void {
    Object.keys(fg.controls).forEach(k => {
      const c = fg.get(k);
      c?.markAsTouched();
      if (c instanceof FormGroup) this.markFormGroupTouched(c);
    });
  }
}
