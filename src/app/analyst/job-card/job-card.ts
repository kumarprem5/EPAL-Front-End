import { Component, OnDestroy, OnInit } from '@angular/core';
import { catchError, forkJoin, of, Subject, switchMap, takeUntil } from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  JobCardSevice,
  JobCardModel,
  // GroupedJobCard,   // ← imported from service, NOT redeclared locally
  JobCardStatus,
  getJobCardStatus,
} from '../../services/job-card-sevice';
import { Router } from '@angular/router';

interface GroupedJobCard {
  reportNo:          string;
  sampleNumber:      string;
  sampleDescription: string;
  projectName:       string;
  labName:           string;
  status:            JobCardStatus;
  parameters:        JobCardModel[];
  analystName:       string;
  createdAt:         string;
}

@Component({
  selector: 'app-job-card',
  imports: [FormsModule, CommonModule,ReactiveFormsModule],
  templateUrl: './job-card.html',
  styleUrl: './job-card.css',
})
export class JobCard implements OnInit, OnDestroy{


 // ── Job Card State ──────────────────────────────────────────────────────────
  isLoading       = false;
  errorMessage    = '';
  jobCards:        JobCardModel[]   = [];
  grouped:         GroupedJobCard[] = [];
  filtered:        GroupedJobCard[] = [];
  activeFilter:    JobCardStatus | 'all' = 'all';
  searchQuery      = '';
  expandedReportNo = '';
  counts = { all: 0, active: 0, inactive: 0, completed: 0 };

  // ── Drawer State ────────────────────────────────────────────────────────────
  drawerOpen  = false;
  activeRoute = '/analyst/job-card';
  currentUser: any;
  searchType  = 'reportNumber';

  private destroy$ = new Subject<void>();

  constructor(
    private jobCardService: JobCardSevice,
    private router: Router,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    try {
      const userStr = localStorage.getItem('userProfile') || localStorage.getItem('analystUser');
      if (userStr) this.currentUser = JSON.parse(userStr);
    } catch {}
    this.loadJobCards();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DRAWER
  // ─────────────────────────────────────────────────────────────────────────

  toggleDrawer(): void { this.drawerOpen = !this.drawerOpen; }
  closeDrawer():  void { this.drawerOpen = false; }

  navigateTo(route: string): void {
    this.activeRoute = route;
    this.closeDrawer();
    this.router.navigate([route]);
  }

  onSearchTypeChange(type: string): void { this.searchType = type; }

  logout(): void {
    ['analystToken', 'analystUser', 'token', 'userProfile'].forEach(k => localStorage.removeItem(k));
    this.router.navigate(['/analyst/login']);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LOAD & ENRICH
  // ─────────────────────────────────────────────────────────────────────────

  loadJobCards(): void {
    const analystName = this.getAnalystName();
    console.log('[JobCard] analystName:', analystName);

    if (!analystName) {
      this.errorMessage = 'No analyst session found.';
      return;
    }

    this.isLoading    = true;
    this.errorMessage = '';

    this.jobCardService.getJobCards(analystName)
      .pipe(
        takeUntil(this.destroy$),
        switchMap((res) => {
          if (res.status !== 'SUCCESS' || !Array.isArray(res.data)) {
            this.errorMessage = res.message || 'No job cards found.';
            return of(null);
          }

          this.jobCards = res.data;
          console.log('[JobCard] Raw job cards:', this.jobCards);

          const uniqueReportNos = [
            ...new Set(this.jobCards.map(jc => jc.reportNo).filter(Boolean))
          ];
          console.log('[JobCard] Fetching samples for:', uniqueReportNos);

          if (!uniqueReportNos.length) return of([]);

          const sampleRequests = uniqueReportNos.map(rn =>
            this.jobCardService.getSampleByReportNumber(rn).pipe(
              catchError(err => {
                console.warn('[JobCard] Sample fetch failed for', rn, err);
                return of(null);
              })
            )
          );

          return forkJoin(sampleRequests);
        })
      )
      .subscribe({
        next: (sampleResponses) => {
          this.isLoading = false;
          if (!sampleResponses) return;

          // Build reportNo → sample map
          const sampleMap = new Map<string, any>();
          (sampleResponses as any[]).forEach((res) => {
            if (!res) return;
            const raw = res.data;
            const samples: any[] = Array.isArray(raw)
              ? raw
              : raw?.content
                ? raw.content
                : raw
                  ? [raw]
                  : [];
            samples.forEach(s => {
              if (s?.reportNumber) {
                sampleMap.set(s.reportNumber, s);
                console.log('[JobCard] Mapped sample:', s.reportNumber, s);
              }
            });
          });

          // Enrich job cards with sample fields
          this.jobCards = this.jobCards.map(jc => {
            const sample = sampleMap.get(jc.reportNo);
            if (sample) {
              return {
                ...jc,
                sampleNumber:      sample.sampleNumber      || '—',
                sampleDescription: jc.sampleDescription     || sample.sampleDescription || sample.description || '—',
                projectName:       jc.projectName           || sample.projectName       || '—',
                labName:           jc.labName               || sample.labName           || 'EPA Labs Private Limited',
              };
            }
            return jc;
          });

          console.log('[JobCard] Enriched job cards:', this.jobCards);

          this.buildGrouped();

          // Patch sampleNumber onto each group from the enriched job cards
          this.grouped = this.grouped.map(g => ({
            ...g,
            sampleNumber: (this.jobCards.find(jc => jc.reportNo === g.reportNo) as any)?.sampleNumber || '—',
          }));

          this.applyFilter();
        },
        error: (err) => {
          this.isLoading    = false;
          this.errorMessage = err?.error?.message ?? 'Failed to load job cards.';
          console.error('[JobCard] Error:', err);
        },
      });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP BY REPORT NO
  // ─────────────────────────────────────────────────────────────────────────

  private buildGrouped(): void {
    const map = new Map<string, GroupedJobCard>();

    for (const jc of this.jobCards) {
      const key = jc.reportNo || 'UNKNOWN';
      if (!map.has(key)) {
        map.set(key, {
          reportNo:          key,
          sampleNumber:      '',
          sampleDescription: jc.sampleDescription || jc.paremeterType || '—',
          projectName:       jc.projectName        || '—',
          labName:           jc.labName             || 'EPA Labs Private Limited ',
          status:            getJobCardStatus(jc),
          analystName:       jc.analystName,
          createdAt:         jc.createdAt,
          parameters:        [],
        });
      }
      map.get(key)!.parameters.push(jc);
    }

    this.grouped = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    this.counts.all       = this.grouped.length;
    this.counts.active    = this.grouped.filter(g => g.status === 'active').length;
    this.counts.inactive  = this.grouped.filter(g => g.status === 'inactive').length;
    this.counts.completed = this.grouped.filter(g => g.status === 'completed').length;

    console.log('[JobCard] Grouped:', this.grouped);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FILTER & SEARCH
  // ─────────────────────────────────────────────────────────────────────────

  applyFilter(): void {
    let list = this.grouped;

    if (this.activeFilter !== 'all') {
      list = list.filter(g => g.status === this.activeFilter);
    }

    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(g =>
        g.reportNo.toLowerCase().includes(q)          ||
        g.sampleNumber.toLowerCase().includes(q)      ||
        g.sampleDescription.toLowerCase().includes(q) ||
        g.projectName.toLowerCase().includes(q)       ||
        g.labName.toLowerCase().includes(q)
      );
    }

    this.filtered = list;
  }

  setFilter(f: JobCardStatus | 'all'): void { this.activeFilter = f; this.applyFilter(); }
  onSearch(): void { this.applyFilter(); }

  // ─────────────────────────────────────────────────────────────────────────
  // EXPAND / COLLAPSE
  // ─────────────────────────────────────────────────────────────────────────

  toggleExpand(reportNo: string): void {
    this.expandedReportNo = this.expandedReportNo === reportNo ? '' : reportNo;
  }

  isExpanded(reportNo: string): boolean {
    return this.expandedReportNo === reportNo;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  getAnalystName(): string {
    try {
      const sources = ['userProfile', 'analystUser', 'user'];
      for (const key of sources) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const u = JSON.parse(raw);
          const name = u.analystName || u.name || u.username || '';
          if (name) return name;
        }
      }
      return '';
    } catch { return ''; }
  }

  statusLabel(s: JobCardStatus): string {
    return ({ active: 'Active', completed: 'Completed', inactive: 'Inactive' } as Record<JobCardStatus, string>)[s];
  }

  statusIcon(s: JobCardStatus): string {
    return ({ active: '🔬', completed: '✅', inactive: '⏸️' } as Record<JobCardStatus, string>)[s];
  }

  trackByReport(_: number, g: GroupedJobCard): string { return g.reportNo; }
  trackById(_: number, jc: JobCardModel): number      { return jc.id; }

  goBack(): void { this.router.navigate(['/analyst/dashboard']); }

  // ─────────────────────────────────────────────────────────────────────────
  // PRINT
  // ─────────────────────────────────────────────────────────────────────────

  printJobCard(g: GroupedJobCard): void {
    const printWindow = window.open('', '_blank', 'width=800,height=1000');
    if (!printWindow) { alert('Please allow popups to print.'); return; }

    const rows = g.parameters.map((p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${p.parameterName || '—'}</td>
        <td>${p.unit || '—'}</td>
        <td class="${p.resultValue ? '' : ''}">${p.resultValue || ''}</td>
        <td>${p.protocolUsed || '—'}</td>
        <td>${p.remarks || '—'}</td>
      </tr>`).join('');

    const first    = g.parameters[0];
    const logoUrl  = `${window.location.origin}/logo.png`;
    const printDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const printTime = new Date().toLocaleString('en-IN');
    const createdDate = new Date(g.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Job Card — ${g.sampleNumber || g.reportNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --teal:    #215E61;
      --teal-lt: #e8f4f4;
      --ink:     #1a2e30;
      --muted:   #6b7280;
      --border:  #d1d5db;
      --yes:     #065f46;
      --yes-bg:  #d1fae5;
      --no:      #991b1b;
      --no-bg:   #fee2e2;
      --warn:    #92400e;
    }

    body { font-family: 'DM Sans', sans-serif; color: var(--ink); background: #fff; }

    /* ── Letterhead ─────────────────────────────────────────────── */
    .letterhead {
      background: var(--teal);
      color: #fff;
      padding: 20px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .lh-left    { display: flex; align-items: center; gap: 14px; }
    .lh-logo    { width: 54px; height: 54px; object-fit: contain; background: #fff; border-radius: 10px; padding: 4px; flex-shrink: 0; }
    .lh-brand   { font-size: 20px; font-weight: 700; letter-spacing: -0.3px; }
    .lh-sub     { font-size: 10px; opacity: .7; margin-top: 3px; letter-spacing: .8px; text-transform: uppercase; }
    .lh-right   { text-align: right; font-size: 11px; opacity: .85; line-height: 1.9; }
    .lh-sample  { font-family: 'DM Mono', monospace; font-size: 16px; font-weight: 600; letter-spacing: 1px; }

    /* ── Title Strip ─────────────────────────────────────────────── */
    .title-strip {
      background: var(--teal-lt);
      border-bottom: 2px solid var(--teal);
      padding: 10px 32px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .title-strip h1 { font-size: 15px; font-weight: 700; color: var(--teal); }

    .badge { padding: 2px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
    .badge-active    { background: #d1fae5; color: #065f46; }
    .badge-inactive  { background: #fef3c7; color: #92400e; }
    .badge-completed { background: #dbeafe; color: #1e40af; }

    /* ── Meta Grid ───────────────────────────────────────────────── */
    .meta-section { padding: 18px 32px 12px; }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .meta-item label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: .8px;
      color: var(--muted);
      font-weight: 700;
      display: block;
      margin-bottom: 3px;
    }
    .meta-item span { font-size: 12px; font-weight: 600; color: var(--ink); }

    /* ── Checks Ribbon ───────────────────────────────────────────── */
    .checks-ribbon {
      margin: 0 32px 16px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .check {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      border: 1.5px solid transparent;
    }
    .check-yes { background: var(--yes-bg); color: var(--yes); border-color: #6ee7b7; }
    .check-no  { background: var(--no-bg);  color: var(--no);  border-color: #fca5a5; }

    /* ── Parameters Table ────────────────────────────────────────── */
    .table-section { padding: 0 32px 24px; }
    .table-section h2 {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .8px;
      color: var(--teal);
      margin-bottom: 10px;
      padding-bottom: 7px;
      border-bottom: 2px solid var(--teal-lt);
    }
    table               { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead tr            { background: var(--teal); color: #fff; }
    thead th            { padding: 8px; text-align: left; font-weight: 600; font-size: 10px; white-space: nowrap; }
    tbody tr            { border-bottom: 1px solid var(--border); }
    tbody tr:nth-child(even) { background: #f9fafb; }
    td                  { padding: 7px 8px; vertical-align: middle; }
    td.pending          { color: var(--warn); font-style: italic; }

    /* ── Footer ──────────────────────────────────────────────────── */
    .print-footer {
      margin: 0 32px;
      padding: 14px 0;
      border-top: 1.5px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 9px;
      color: var(--muted);
    }
    .sig-block { text-align: right; }
    .sig-line  { border-top: 1px solid var(--ink); width: 140px; margin-left: auto; margin-bottom: 4px; }
    .sig-label { font-size: 9px; color: var(--muted); }

    /* ── Print Media ─────────────────────────────────────────────── */
    @media print {
      @page { size: A4 portrait; margin: 8mm 10mm; }
      body  { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>

  <!-- ── Letterhead ── -->
  <div class="letterhead">
    <div class="lh-left">
      <img class="lh-logo" src="${logoUrl}" alt="Lab Logo" onerror="this.style.display='none'" />
      <div>
        <div class="lh-brand">EPA Labs Private Limited</div>
        <div class="lh-sub">Analytical Testing &amp; Quality Assurance</div>
      </div>
    </div>
    <div class="lh-right">
      <div class="lh-sample">${g.sampleNumber || '—'}</div>
      <div>Job Card</div>
      <div>Printed: ${printDate}</div>
    </div>
  </div>

  <!-- ── Title Strip ── -->
  <div class="title-strip">
    <h1>Analysis Job Card</h1>
    <span class="badge badge-${g.status}">${this.statusLabel(g.status)}</span>
  </div>

  <!-- ── Meta Grid ── -->
  <div class="meta-section">
    <div class="meta-grid">
      <div class="meta-item"><label>Sample No.</label><span>${g.sampleNumber || '—'}</span></div>
      <div class="meta-item"><label>Sample Description</label><span>${g.sampleDescription}</span></div>
      <div class="meta-item"><label>Project</label><span>${g.projectName}</span></div>
      <div class="meta-item"><label>Lab</label><span>${g.labName}</span></div>
      <div class="meta-item"><label>Analyst</label><span>${g.analystName}</span></div>
      <div class="meta-item"><label>Parameters</label><span>${g.parameters.length}</span></div>
      <div class="meta-item"><label>Created</label><span>${createdDate}</span></div>
    </div>
  </div>

  <!-- ── Checks Ribbon ── 
 <!--   <div class="checks-ribbon">
    <span class="check ${first?.isApproved ? 'check-yes' : 'check-no'}">
    //   ${first?.isApproved ? '✓' : '✗'} Approved
   </span>
    <span class="check ${first?.isTechanicianChecked ? 'check-yes' : 'check-no'}">
      ${first?.isTechanicianChecked ? '✓' : '✗'} Technician Checked
    </span>
    <span class="check ${first?.isQualityChecked ? 'check-yes' : 'check-no'}">
      ${first?.isQualityChecked ? '✓' : '✗'} Quality Checked
    </span>
  </div> -->

  <!-- ── Parameters Table ── -->
  <div class="table-section">
    <h2>Test Parameters</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Parameter</th>
          <th>Unit</th>
          <th>Result Value</th>
          <th>Protocol</th>
          <th>Remarks</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <!-- ── Footer ── -->
  <div class="print-footer">
    <div>
      <div>Sample No: <strong>${g.sampleNumber || '—'}</strong></div>
      <div>Generated by EPAL Lab Portal · ${printTime}</div>
    </div>
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-label">Authorized Signature</div>
    </div>
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  }
}