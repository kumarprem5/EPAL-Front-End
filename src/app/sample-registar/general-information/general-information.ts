import { Component, Input, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { SampleHeader } from "../sample-header/sample-header";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { Subject, takeUntil } from 'rxjs';
import { GeneralInformationModel, GeneralInformationService } from '../../services/general-information-service';
import { SampleService, TestParameter } from '../../services/sample-service';
import { GeneralInformationservice } from '../../services/general-information';

// / ── Local Interfaces ──────────────────────────────────────────────────────────

interface MasterCategory  { id: number; name: string; description?: string; active: boolean; }
interface SubCategory     { id: number; name: string; description?: string; active: boolean; masterCategory?: MasterCategory; }
interface ParameterGroup  { id: number; name: string; description?: string; active: boolean; subCategory?: SubCategory; }
interface ResultParameter {
  id: number; parameterName: string; unit?: string; minValue?: string;
  maxValue?: string; description?: string; active: boolean; isNBL: boolean; sampleDescription?: string;
}
interface SampleResult {
  id?: number; name: string; unit: string; result: string;
  sampleDescription: string; protocal: string; standarded: string; isNABL?: boolean;
}

// ── Helper ────────────────────────────────────────────────────────────────────

function toInfoModel(raw: any, fallbackReport = ''): GeneralInformationModel | null {
  if (!raw || typeof raw !== 'object') return null;
  const name = (raw.name ?? raw.parameterName ?? '').toString().trim();
  if (!name) return null;
  return {
    id:                raw.id != null ? Number(raw.id) : undefined,
    name,
    value:             raw.value != null ? raw.value.toString().trim() : '',
    reportNumber:      (raw.reportNumber ?? fallbackReport).toString(),
    sampleDescription: (raw.sampleDescription ?? '').toString(),
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

// 

@Component({
  selector: 'app-general-information',
  imports: [SampleHeader,CommonModule,FormsModule],
  templateUrl: './general-information.html',
  styleUrl: './general-information.css',
})
export class GeneralInformation implements OnInit, OnDestroy {

  // ── Route / Sample ─────────────────────────────────────────────────────────
  reportNumber = '';
  sample: any  = null;

  // ── General Information ────────────────────────────────────────────────────
  informations:     GeneralInformationModel[] = [];
  isLoadingInfo     = false;
  isAutoFillingInfo = false;
  newInfo: GeneralInformationModel = { name: '', value: '', reportNumber: '' };

  // ── Test Parameters (dropdown templates for manual add) ───────────────────
  testParameters:    TestParameter[] = [];
  selectedParameter: TestParameter | null = null;
  isLoadingParams    = false;

  // ── Cascading Dropdowns ────────────────────────────────────────────────────
  masterCategories:  MasterCategory[]  = [];
  subCategories:     SubCategory[]     = [];
  parameterGroups:   ParameterGroup[]  = [];
  resultParameters:  ResultParameter[] = [];

  selectedMasterCategory: MasterCategory | null = null;
  selectedSubCategory:    SubCategory    | null = null;
  selectedParameterGroup: ParameterGroup | null = null;

  isLoadingMasterCategories = false;
  isLoadingSubCategories    = false;
  isLoadingParameterGroups  = false;
  isLoadingResultParameters = false;

  // ── Selected Sample Results ────────────────────────────────────────────────
  selectedSampleResults: SampleResult[] = [];
  isLoadingSampleResults = false;

  // ── UI ─────────────────────────────────────────────────────────────────────
  uiMessage     = '';
  uiMessageType: 'success' | 'error' | '' = '';

  private destroy$ = new Subject<void>();

  constructor(
    private infoService:   GeneralInformationService,
    private sampleService: SampleService,
    private route:         ActivatedRoute,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.reportNumber         = params.get('reportNumber') ?? '';
        this.newInfo.reportNumber = this.reportNumber;

        if (!this.reportNumber) {
          this.showMessage('Report number missing from route', 'error');
          return;
        }

        this.loadSample(this.reportNumber);
        this.loadMasterCategories();
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  // ── Sample ────────────────────────────────────────────────────────────────

  loadSample(reportNumber: string): void {
    this.sampleService.getByReportNumber(reportNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 'SUCCESS' && res.data) {
            this.sample = res.data;
            console.log('[loadSample] loaded sample, description:', this.sample.sampleDescription);
            // Load everything that depends on the sample
            this.loadGeneralInfoByReport(reportNumber);
            this.loadTestParameters(this.sample.sampleDescription);
            this.loadSelectedSampleResults();
          } else {
            this.showMessage('Sample not found', 'error');
          }
        },
        error: (err) => {
          console.error('[loadSample]', err);
          this.showMessage('Failed to load sample', 'error');
        },
      });
  }

  // ── General Information ───────────────────────────────────────────────────

  /**
   * Fetch saved general info rows by REPORT NUMBER.
   * General info is per-report — never fetch by sampleDescription alone.
   */
  loadGeneralInfoByReport(reportNumber: string): void {
    if (!reportNumber) return;
    this.isLoadingInfo = true;
    this.informations  = [];

    this.infoService.getByReportNumber(reportNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isLoadingInfo = false;
          console.log('[loadGeneralInfoByReport] response:', res);

          if (res.status === 'SUCCESS' && Array.isArray(res.data)) {
            this.informations = res.data
              .map((raw: any) => toInfoModel(raw, reportNumber))
              .filter((m): m is GeneralInformationModel => m !== null && typeof m.id === 'number');

            console.log('[loadGeneralInfoByReport] rows with ids:', this.informations.length);
          }
        },
        error: (err) => {
          this.isLoadingInfo = false;
          console.error('[loadGeneralInfoByReport]', err);
        },
      });
  }

  /**
   * Load test parameter templates for the selected sample description.
   * These are used for the manual "Add" dropdown AND auto-fill.
   * ✅ FIXED: calls getTestParametersBySampleDescription (proper method, not a property).
   */
  loadTestParameters(sampleDescription: string): void {
    if (!sampleDescription) return;
    this.isLoadingParams = true;

    this.sampleService.getTestParametersBySampleDescription(sampleDescription)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isLoadingParams = false;
          console.log('[loadTestParameters] response:', res);

          if (res.status === 'SUCCESS' && Array.isArray(res.data)) {
            this.testParameters = res.data;
            console.log('[loadTestParameters] loaded:', this.testParameters.length, 'templates');

            // Auto-fill only when there are no saved rows yet
            // Delay slightly to let loadGeneralInfoByReport() settle
            setTimeout(() => {
              if (this.informations.length === 0 && this.testParameters.length > 0) {
                console.log('[loadTestParameters] no saved rows → triggering auto-fill');
                this.autoFillFromTestParameters();
              } else {
                console.log('[loadTestParameters] rows already exist, skipping auto-fill');
              }
            }, 500);
          }
        },
        error: (err) => {
          this.isLoadingParams = false;
          console.error('[loadTestParameters]', err);
        },
      });
  }

  /**
   * Saves all test parameter templates as general info rows for this report,
   * then reloads from the DB so every row has a real numeric id.
   * ✅ FIXED: uses reloadGeneralInfoFromDB() instead of push(res.data) inline.
   */
  autoFillFromTestParameters(): void {
    if (!this.testParameters.length) return;

    this.isAutoFillingInfo = true;
    let completed = 0;
    const total   = this.testParameters.length;

    console.log('[autoFillFromTestParameters] saving', total, 'rows for report:', this.reportNumber);

    this.testParameters.forEach(param => {
      const entry: GeneralInformationModel = {
        name:              param.parameterName,
        value:             param.values ?? param.defaultValues ?? '',
        reportNumber:      this.reportNumber,
        sampleDescription: this.sample?.sampleDescription ?? '',
      };

      this.infoService.addInformation(entry)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            console.log('[autoFillFromTestParameters] saved:', param.parameterName, '| id:', res?.data?.id);
            if (++completed === total) this.reloadGeneralInfoFromDB();
          },
          error: (err) => {
            console.error('[autoFillFromTestParameters] error:', param.parameterName, err);
            if (++completed === total) { this.isAutoFillingInfo = false; this.reloadGeneralInfoFromDB(); }
          },
        });
    });
  }

  /** Reloads from DB to guarantee every row has its real numeric id. */
  private reloadGeneralInfoFromDB(): void {
    console.log('[reloadGeneralInfoFromDB] fetching for report:', this.reportNumber);

    this.infoService.getByReportNumber(this.reportNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isAutoFillingInfo = false;
          if (res.status === 'SUCCESS' && Array.isArray(res.data)) {
            this.informations = res.data
              .map((raw: any) => toInfoModel(raw, this.reportNumber))
              .filter((m): m is GeneralInformationModel => m !== null && typeof m.id === 'number');
            this.informations = [...this.informations];
            console.log('[reloadGeneralInfoFromDB] final rows:', this.informations.length, '| ids:', this.informations.map(i => i.id));
            this.showMessage('General information auto-filled ✓');
          }
        },
        error: (err) => {
          this.isAutoFillingInfo = false;
          console.error('[reloadGeneralInfoFromDB]', err);
          this.showMessage('Auto-fill saved but reload failed — please refresh', 'error');
        },
      });
  }

  addInformation(): void {
    if (!this.newInfo.name.trim() || !this.newInfo.value.trim()) {
      this.showMessage('Please fill all fields', 'error');
      return;
    }

    const payload: GeneralInformationModel = {
      name:              this.newInfo.name,
      value:             this.newInfo.value,
      reportNumber:      this.reportNumber,
      sampleDescription: this.sample?.sampleDescription ?? '',
    };

    this.infoService.addInformation(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 'SUCCESS') {
            const saved = toInfoModel(res.data, this.reportNumber);
            if (saved) {
              if (!saved.value) saved.value = payload.value;
              this.informations = [...this.informations, saved];
            }
            this.newInfo           = { name: '', value: '', reportNumber: this.reportNumber };
            this.selectedParameter = null;
            this.showMessage('Information added ✓');
          } else {
            this.showMessage(res.message ?? 'Failed to add', 'error');
          }
        },
        error: () => this.showMessage('Failed to add information', 'error'),
      });
  }

  updateInformation(info: GeneralInformationModel, index: number): void {
    if (!info.name.trim() || !info.value.trim()) {
      this.showMessage('Name & Value cannot be empty', 'error');
      return;
    }
    if (typeof info.id !== 'number') {
      this.showMessage('Cannot update: row has no database id', 'error');
      console.error('[updateInformation] id missing:', info);
      return;
    }

    this.infoService.updateInformation(info)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 'SUCCESS') {
            const updated = toInfoModel(res.data, this.reportNumber);
            if (updated) {
              if (!updated.value) updated.value = info.value;
              this.informations[index] = updated;
              this.informations = [...this.informations];
            }
            this.showMessage('Updated ✓');
          } else {
            this.showMessage(res.message ?? 'Update failed', 'error');
          }
        },
        error: () => this.showMessage('Update failed', 'error'),
      });
  }

  removeInformation(info: GeneralInformationModel, index: number): void {
    if (typeof info.id !== 'number') {
      this.informations.splice(index, 1);
      this.informations = [...this.informations];
      return;
    }
    if (!confirm(`Remove "${info.name}"?`)) return;

    this.infoService.deleteInformation(info.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const ok = res == null || (res as any).status === 'SUCCESS'
            || (typeof res === 'string' && res);
          if (ok) {
            this.informations.splice(index, 1);
            this.informations = [...this.informations];
            this.showMessage('Deleted ✓');
          } else {
            this.showMessage((res as any)?.message ?? 'Delete failed', 'error');
          }
        },
        error: () => this.showMessage('Delete failed', 'error'),
      });
  }

  onParameterSelect(param: TestParameter | null): void {
    this.selectedParameter = param;
    this.newInfo.name      = param?.parameterName ?? '';
    this.newInfo.value     = param?.values ?? param?.defaultValues ?? '';
    this.newInfo.reportNumber = this.reportNumber;
  }

  // ── Cascading Dropdowns ───────────────────────────────────────────────────

  loadMasterCategories(): void {
    this.isLoadingMasterCategories = true;
    this.sampleService.getMasterCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.isLoadingMasterCategories = false;
          this.masterCategories = Array.isArray(res) ? res : (res?.data ?? []);
        },
        error: (err) => {
          this.isLoadingMasterCategories = false;
          console.error('[loadMasterCategories]', err);
          this.showMessage('Failed to load master categories', 'error');
        },
      });
  }

  onMasterCategoryChange(mc: MasterCategory | null): void {
    this.selectedMasterCategory = mc;
    this.selectedSubCategory = null; this.selectedParameterGroup = null;
    this.subCategories = []; this.parameterGroups = []; this.resultParameters = [];
    if (mc) this.loadSubCategories(mc.id);
  }

  loadSubCategories(masterCategoryId: number): void {
    this.isLoadingSubCategories = true;
    this.sampleService.getSubCategoriesByMasterCategory(masterCategoryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.isLoadingSubCategories = false;
          this.subCategories = Array.isArray(res) ? res : (res?.data ?? []);
        },
        error: (err) => {
          this.isLoadingSubCategories = false;
          console.error('[loadSubCategories]', err);
          this.showMessage('Failed to load subcategories', 'error');
        },
      });
  }

  onSubCategoryChange(sc: SubCategory | null): void {
    this.selectedSubCategory = sc;
    this.selectedParameterGroup = null;
    this.parameterGroups = []; this.resultParameters = [];
    if (sc) this.loadParameterGroups(sc.id);
  }

  loadParameterGroups(subCategoryId: number): void {
    this.isLoadingParameterGroups = true;
    this.sampleService.getParameterGroupsBySubCategory(subCategoryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.isLoadingParameterGroups = false;
          this.parameterGroups = Array.isArray(res) ? res : (res?.data ?? []);
        },
        error: (err) => {
          this.isLoadingParameterGroups = false;
          console.error('[loadParameterGroups]', err);
          this.showMessage('Failed to load parameter groups', 'error');
        },
      });
  }

  onParameterGroupChange(pg: ParameterGroup | null): void {
    this.selectedParameterGroup = pg;
    this.resultParameters = [];
    if (pg) this.loadResultParameters(pg.id);
  }

  loadResultParameters(parameterGroupId: number): void {
    this.isLoadingResultParameters = true;
    this.sampleService.getResultParametersByGroup(parameterGroupId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.isLoadingResultParameters = false;
          this.resultParameters = Array.isArray(res) ? res : (res?.data ?? []);
        },
        error: (err) => {
          this.isLoadingResultParameters = false;
          console.error('[loadResultParameters]', err);
        },
      });
  }

  compareById(a: any, b: any): boolean { return a && b ? a.id === b.id : a === b; }

  // ── Sample Results ────────────────────────────────────────────────────────

  loadSelectedSampleResults(): void {
    if (!this.sample?.sampleDescription) return;
    this.isLoadingSampleResults = true;

    this.sampleService.findSampleResultsByDescription(this.sample.sampleDescription)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
  if (res.status === 'SUCCESS') {
    this.selectedSampleResults = res.data ?? [];
  }
  this.isLoadingSampleResults = false;
},
        error: (err) => {
          this.isLoadingSampleResults = false;
          console.error('[loadSelectedSampleResults]', err);
          this.showMessage('Failed to load selected parameters', 'error');
        },
      });
  }

  selectResultParameter(parameter: ResultParameter): void {
    if (!this.sample?.sampleDescription) { this.showMessage('Sample description not found', 'error'); return; }

    const row: SampleResult = {
      name: parameter.parameterName, unit: parameter.unit ?? '',
      result: parameter.minValue ?? '', protocal: parameter.description ?? '',
      standarded: parameter.maxValue ?? '', isNABL: parameter.isNBL,
      sampleDescription: this.sample.sampleDescription,
    };

    this.sampleService.createSampleResult(row)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.showMessage(`${parameter.parameterName} selected ✓`); this.loadSelectedSampleResults(); },
        error: (err) => { console.error('[selectResultParameter]', err); this.showMessage('Failed to select parameter', 'error'); },
      });
  }

  updateSampleResult(sampleResult: SampleResult, index: number): void {
    if (!sampleResult.name?.trim()) { this.showMessage('Name cannot be empty', 'error'); return; }
    if (typeof sampleResult.id !== 'number') { this.showMessage('Cannot update: record has no id', 'error'); return; }

    this.sampleService.updateSampleResult(sampleResult)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const updated = res?.data ?? res;
          if (updated?.name !== undefined) {
            this.selectedSampleResults[index] = updated;
            this.selectedSampleResults = [...this.selectedSampleResults];
          }
          this.showMessage('Updated ✓');
        },
        error: (err) => { console.error('[updateSampleResult]', err); this.showMessage('Update failed', 'error'); },
      });
  }

  deleteSampleResult(sampleResult: SampleResult, index: number): void {
    if (typeof sampleResult.id !== 'number') { this.showMessage('Invalid id', 'error'); return; }
    if (!confirm(`Remove "${sampleResult.name}"?`)) return;

    this.sampleService.deleteSampleResult(sampleResult.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.selectedSampleResults.splice(index, 1);
          this.selectedSampleResults = [...this.selectedSampleResults];
          this.showMessage('Removed ✓');
        },
        error: (err) => { console.error('[deleteSampleResult]', err); this.showMessage('Delete failed', 'error'); },
      });
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  showMessage(message: string, type: 'success' | 'error' = 'success'): void {
    this.uiMessage = message; this.uiMessageType = type;
    setTimeout(() => { this.uiMessage = ''; this.uiMessageType = ''; }, 3000);
  }
}