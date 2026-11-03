'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import {
  formatDate,
  formatMoney,
  getTodayDate,
} from '@/lib/utils';
import {
  TrendingUp,
  Users,
  FileCheck2,
  Clock,
  Receipt,
  AlertCircle,
  PiggyBank,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

type PeriodOption = 'today' | 'week' | 'month' | 'custom';

export default function DashboardTab() {
  const { state, getPatient } = useClinic();

  const [period, setPeriod] = useState<PeriodOption>('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Calculate timestamp range
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayMs = 86400000;
  let rangeStart = todayStart;
  let rangeEnd = todayStart + dayMs;

  if (period === 'week') {
    const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
    rangeStart = todayStart - dayOfWeek * dayMs;
  } else if (period === 'month') {
    rangeStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  } else if (period === 'custom') {
    rangeStart = fromDate ? new Date(fromDate + 'T00:00:00').getTime() : todayStart;
    rangeEnd = toDate ? new Date(toDate + 'T23:59:59').getTime() : todayStart + dayMs;
  }

  const isInRange = (t: number) => t >= rangeStart && t < rangeEnd;

  // Filtered dataset
  const filteredVisits = state.vis.filter((v) => isInRange(v.t) && !v.cancelled);
  const filteredRx = state.rx.filter((r) => isInRange(r.t));
  const filteredInvoices = state.invs.filter((i) => isInRange(i.t) && !i.void);
  const filteredPayments = state.pays.filter((p) => isInRange(p.t));

  // Metrics
  const totalRevenue = filteredPayments.reduce((acc, p) => acc + p.amt, 0);
  const totalInvoicesCount = filteredInvoices.length;
  const pendingQueueCount = state.vis.filter((v) => v.st !== 'done' && !v.cancelled).length;
  const outstandingInvoices = state.invs.filter((i) => !i.void && i.paid < i.total);
  const pendingCollections = outstandingInvoices.reduce((acc, i) => acc + (i.total - i.paid), 0);

  // Estimated gross profit: Total invoice amount - taxes - cost of goods sold
  const estimatedGrossProfit = filteredInvoices.reduce((acc, inv) => {
    const cost = inv.items.reduce((sum, item) => sum + (item.cost || 0), 0);
    const tax = inv.tax || 0;
    return acc + (inv.total - tax - cost);
  }, 0);

  // Days range array for trend charts
  const daysList: number[] = [];
  for (let t = rangeStart; t < rangeEnd && daysList.length < 60; t += dayMs) {
    daysList.push(t);
  }
  const displayDays = (
    daysList.length < 7
      ? Array.from({ length: 7 }, (_, i) => rangeEnd - (7 - i) * dayMs)
      : daysList
  ).slice(-14);

  // Medicine vs Treatment revenue split
  const medicineRevenue = filteredInvoices
    .flatMap((i) => i.items)
    .filter((x) => x.type === 'medicine')
    .reduce((acc, x) => acc + x.qty * x.price, 0);

  const treatmentRevenue = filteredInvoices
    .flatMap((i) => i.items)
    .filter((x) => x.type === 'treatment')
    .reduce((acc, x) => acc + x.qty * x.price, 0);

  const totalCatRevenue = medicineRevenue + treatmentRevenue;

  // Most prescribed medications
  const aggregateCounts: Record<string, number> = {};
  filteredRx.forEach((r) =>
    r.items.forEach((x) => {
      aggregateCounts[x.name] = (aggregateCounts[x.name] || 0) + x.qty;
    })
  );
  const topPrescribed = Object.entries(aggregateCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Best sellers (by revenue)
  const salesCounts: Record<string, number> = {};
  filteredInvoices.forEach((i) =>
    i.items.forEach((x) => {
      salesCounts[x.name] = (salesCounts[x.name] || 0) + x.qty * x.price;
    })
  );
  const topSellers = Object.entries(salesCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Expiring batches in next 60 days
  const sixtyDaysAhead = new Date(Date.now() + 60 * dayMs).toLocaleDateString('en-CA');
  const todayStr = getTodayDate();
  const expiringBatches = state.inv
    .flatMap((item) =>
      (item.batches || [])
        .filter((b) => b.qty > 0 && b.exp && b.exp <= sixtyDaysAhead)
        .map((b) => ({ item, batch: b }))
    )
    .sort((a, b) => a.batch.exp.localeCompare(b.batch.exp));

  // Low stock inventory items
  const lowStockItems = state.inv.filter((i) => i.stock !== null && i.stock <= i.low);

  return (
    <div className=\"space-y-6\">
      {/* Time Range Filter Bar */}
      <div className=\"p-4 rounded-2xl bg-[var(--sf-card)] border border-[var(--hl)] shadow-[var(--lift)] flex flex-wrap items-center justify-between gap-3\">
        <div className=\"flex items-center gap-1.5 bg-[var(--sf)] p-1 rounded-xl border border-[var(--hl)]\">
          {(['today', 'week', 'month', 'custom'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setPeriod(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                period === opt
                  ? 'bg-white text-[var(--ac)] shadow-xs'
                  : 'text-[var(--s2)] hover:text-[var(--ink)]'
              }`}
            >
              {opt === 'today' ? 'Today' : opt === 'week' ? 'This Week' : opt === 'month' ? 'This Month' : 'Custom'}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className=\"flex items-center gap-2 text-xs\">
            <span className=\"text-[var(--s2)] font-medium\">From:</span>
            <input
              type=\"date\"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className=\"px-2.5 py-1 rounded-lg border border-[var(--hl)] bg-white text-[var(--ink)]\"
            />
            <span className=\"text-[var(--s2)] font-medium\">To:</span>
            <input
              type=\"date\"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className=\"px-2.5 py-1 rounded-lg border border-[var(--hl)] bg-white text-[var(--ink)]\"
            />
          </div>
        )}
      </div>

      {/* KPI Stat Cards Grid */}
      <div className=\"grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4\">
        {/* Total Revenue */}
        <div className=\"p-4 sm:p-5 rounded-2xl bg-[var(--sf)] border border-[var(--hl)] shadow-[var(--lift)] flex flex-col justify-between\">
          <div className=\"flex items-center justify-between text-xs font-semibold text-[var(--s2)] uppercase tracking-wider\">
            <span>Total Revenue</span>
            <TrendingUp className=\"w-4 h-4 text-[var(--ac)]\" />
          </div>
          <div className=\"text-2xl sm:text-3xl font-bold font-serif text-[var(--ink)] mt-2\">
            {formatMoney(totalRevenue)}
          </div>
          <div className=\"text-[11px] text-[var(--s2)] mt-1\">Cash, UPI & Card collections</div>
        </div>

        {/* Patient Visits */}
        <div className=\"p-4 sm:p-5 rounded-2xl bg-[var(--sf)] border border-[var(--hl)] shadow-[var(--lift)] flex flex-col justify-between\">
          <div className=\"flex items-center justify-between text-xs font-semibold text-[var(--s2)] uppercase tracking-wider\">
            <span>Patient Visits</span>
            <Users className=\"w-4 h-4 text-[var(--ac)]\" />
          </div>
          <div className=\"text-2xl sm:text-3xl font-bold font-serif text-[var(--ink)] mt-2\">
            {filteredVisits.length}
          </div>
          <div className=\"text-[11px] text-[var(--s2)] mt-1\">Total visits in selected period</div>
        </div>

        {/* Consultations */}
        <div className=\"p-4 sm:p-5 rounded-2xl bg-[var(--sf)] border border-[var(--hl)] shadow-[var(--lift)] flex flex-col justify-between\">
          <div className=\"flex items-center justify-between text-xs font-semibold text-[var(--s2)] uppercase tracking-wider\">
            <span>Consultations</span>
            <FileCheck2 className=\"w-4 h-4 text-[var(--ac)]\" />
          </div>
          <div className=\"text-2xl sm:text-3xl font-bold font-serif text-[var(--ink)] mt-2\">
            {filteredRx.length}
          </div>
          <div className=\"text-[11px] text-[var(--s2)] mt-1\">Prescriptions completed</div>
        </div>

        {/* Queue Count */}
        <div className=\"p-4 sm:p-5 rounded-2xl bg-[var(--sf)] border border-[var(--hl)] shadow-[var(--lift)] flex flex-col justify-between\">
          <div className=\"flex items-center justify-between text-xs font-semibold text-[var(--s2)] uppercase tracking-wider\">
            <span>Waiting Patients</span>
            <Clock className=\"w-4 h-4 text-[var(--brass)]\" />
          </div>
          <div className=\"text-2xl sm:text-3xl font-bold font-serif text-[var(--ink)] mt-2\">
            {pendingQueueCount}
          </div>
          <div className=\"text-[11px] text-[var(--s2)] mt-1\">Currently in clinic queue</div>
        </div>

        {/* Total Invoices */}
        <div className=\"p-4 sm:p-5 rounded-2xl bg-[var(--sf)] border border-[var(--hl)] shadow-[var(--lift)] flex flex-col justify-between\">
          <div className=\"flex items-center justify-between text-xs font-semibold text-[var(--s2)] uppercase tracking-wider\">
            <span>Invoices Finalized</span>
            <Receipt className=\"w-4 h-4 text-[var(--ac)]\" />
          </div>
          <div className=\"text-2xl sm:text-3xl font-bold font-serif text-[var(--ink)] mt-2\">
            {totalInvoicesCount}
          </div>
          <div className=\"text-[11px] text-[var(--s2)] mt-1\">Issued billing records</div>
        </div>

        {/* Pending Unpaid Balances */}
        <div className=\"p-4 sm:p-5 rounded-2xl bg-[var(--sf)] border border-[var(--hl)] shadow-[var(--lift)] flex flex-col justify-between\">
          <div className=\"flex items-center justify-between text-xs font-semibold text-[var(--s2)] uppercase tracking-wider\">
            <span>Unpaid Balances Due</span>
            <AlertCircle className=\"w-4 h-4 text-[var(--err)]\" />
          </div>
          <div className=\"text-2xl sm:text-3xl font-bold font-serif text-[var(--err)] mt-2\">
            {formatMoney(pendingCollections)}
          </div>
          <div className=\"text-[11px] text-[var(--s2)] mt-1\">Pending payments from patients</div>
        </div>

        {/* Estimated Profit */}
        <div className=\"p-4 sm:p-5 rounded-2xl bg-[var(--sf)] border border-[var(--hl)] shadow-[var(--lift)] flex flex-col justify-between col-span-2 sm:col-span-1 lg:col-span-2\">
          <div className=\"flex items-center justify-between text-xs font-semibold text-[var(--s2)] uppercase tracking-wider\">
            <span>Estimated Profit</span>
            <PiggyBank className=\"w-4 h-4 text-[var(--ac)]\" />
          </div>
          <div className=\"text-2xl sm:text-3xl font-bold font-serif text-[var(--ac)] mt-2\">
            {formatMoney(estimatedGrossProfit)}
          </div>
          <div className=\"text-[11px] text-[var(--s2)] mt-1\">Income minus wholesale medicine purchase cost & tax</div>
        </div>
      </div>

      {/* SVG Charts Grid */}
      <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
        {/* Revenue Line Chart */}
        <div className=\"p-5 sm:p-6 rounded-2xl bg-[var(--sf-card)] border border-[var(--hl)] shadow-[var(--lift)]\">
          <h3 className=\"text-base font-semibold font-serif text-[var(--ink)] mb-4\">
            Daily Revenue Trend
          </h3>
          {displayDays.length > 0 ? (
            (() => {
              const dataPoints = displayDays.map((t) => {
                const dayTotal = state.pays
                  .filter((p) => p.t >= t && p.t < t + dayMs)
                  .reduce((sum, p) => sum + p.amt, 0);
                return { label: formatDate(t), value: dayTotal };
              });
              const maxVal = Math.max(1, ...dataPoints.map((d) => d.value));
              const W = 500;
              const H = 160;
              const pt = 20;
              const pb = 25;
              const chartH = H - pt - pb;

              const getX = (i: number) =>
                dataPoints.length > 1
                  ? 20 + (i * (W - 40)) / (dataPoints.length - 1)
                  : W / 2;
              const getY = (val: number) => pt + chartH * (1 - val / maxVal);

              const pointsStr = dataPoints
                .map((d, i) => `${getX(i)},${getY(d.value)}`)
                .join(' L ');
              const areaStr =
                dataPoints.length > 1
                  ? `M ${getX(0)},${pt + chartH} L ${pointsStr} L ${getX(
                      dataPoints.length - 1
                    )},${pt + chartH} Z`
                  : '';

              return (
                <svg
                  viewBox={`0 0 ${W} ${H}`}
                  className=\"w-full h-auto text-[var(--ink)] font-sans\"
                >
                  {/* Grid Lines */}
                  {[0, 0.5, 1].map((pct) => (
                    <line
                      key={pct}
                      x1=\"15\"
                      x2={W - 15}
                      y1={pt + chartH * pct}
                      y2={pt + chartH * pct}
                      stroke=\"var(--hl)\"
                      strokeDasharray=\"4 4\"
                    />
                  ))}
                  {/* Area fill */}
                  {areaStr && (
                    <path d={areaStr} fill=\"var(--sage)\" fillOpacity=\"0.6\" />
                  )}
                  {/* Line */}
                  {pointsStr && (
                    <path
                      d={`M ${pointsStr}`}
                      fill=\"none\"
                      stroke=\"var(--ac)\"
                      strokeWidth=\"2.5\"
                      strokeLinecap=\"round\"
                    />
                  )}
                  {/* Circles & Labels */}
                  {dataPoints.map((d, i) => (
                    <g key={i}>
                      <circle
                        cx={getX(i)}
                        cy={getY(d.value)}
                        r={i === dataPoints.length - 1 ? 4.5 : 3}
                        fill=\"var(--ac)\"
                        stroke=\"#fff\"
                        strokeWidth=\"1.5\"
                      />
                      {i % Math.ceil(dataPoints.length / 7) === 0 && (
                        <text
                          x={getX(i)}
                          y={H - 6}
                          fontSize=\"10\"
                          textAnchor=\"middle\"
                          fill=\"var(--s2)\"
                        >
                          {d.label}
                        </text>
                      )}
                    </g>
                  ))}
                </svg>
              );
            })()
          ) : (
            <div className=\"p-8 text-center text-xs text-[var(--s2)]\">No data in this period</div>
          )}
        </div>

        {/* Daily Patient Visits Column Chart */}
        <div className=\"p-5 sm:p-6 rounded-2xl bg-[var(--sf-card)] border border-[var(--hl)] shadow-[var(--lift)]\">
          <h3 className=\"text-base font-semibold font-serif text-[var(--ink)] mb-4\">
            Daily Patient Visits
          </h3>
          {displayDays.length > 0 ? (
            (() => {
              const dataPoints = displayDays.map((t) => {
                const count = state.vis.filter((v) => v.t >= t && v.t < t + dayMs).length;
                return { label: formatDate(t), value: count };
              });
              const maxVal = Math.max(1, ...dataPoints.map((d) => d.value));
              const W = 500;
              const H = 160;
              const pt = 20;
              const pb = 25;
              const chartH = H - pt - pb;
              const n = dataPoints.length;
              const bw = (W - 30) / n;
              const barW = Math.min(22, bw * 0.6);

              return (
                <svg
                  viewBox={`0 0 ${W} ${H}`}
                  className=\"w-full h-auto text-[var(--ink)] font-sans\"
                >
                  {[0, 0.5, 1].map((pct) => (
                    <line
                      key={pct}
                      x1=\"15\"
                      x2={W - 15}
                      y1={pt + chartH * pct}
                      y2={pt + chartH * pct}
                      stroke=\"var(--hl)\"
                      strokeDasharray=\"4 4\"
                    />
                  ))}
                  {dataPoints.map((d, i) => {
                    const barH = (d.value / maxVal) * chartH;
                    const cx = 15 + bw * i + bw / 2;
                    return (
                      <g key={i}>
                        <rect
                          x={cx - barW / 2}
                          y={pt + chartH - barH}
                          width={barW}
                          height={Math.max(2, barH)}
                          rx=\"3\"
                          fill=\"var(--ac)\"
                        />
                        {d.value > 0 && (
                          <text
                            x={cx}
                            y={pt + chartH - barH - 4}
                            fontSize=\"9\"
                            fontWeight=\"bold\"
                            textAnchor=\"middle\"
                            fill=\"var(--ink)\"
                          >
                            {d.value}
                          </text>
                        )}
                        {i % Math.ceil(n / 7) === 0 && (
                          <text
                            x={cx}
                            y={H - 6}
                            fontSize=\"10\"
                            textAnchor=\"middle\"
                            fill=\"var(--s2)\"
                          >
                            {d.label}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              );
            })()
          ) : (
            <div className=\"p-8 text-center text-xs text-[var(--s2)]\">No data in this period</div>
          )}
        </div>
      </div>

      {/* Category Split & Top Medicines Grid */}
      <div className=\"grid grid-cols-1 md:grid-cols-3 gap-6\">
        {/* Category Split Donut */}
        <div className=\"p-5 sm:p-6 rounded-2xl bg-[var(--sf-card)] border border-[var(--hl)] shadow-[var(--lift)] flex flex-col justify-between\">
          <h3 className=\"text-base font-semibold font-serif text-[var(--ink)] mb-3\">
            Category Breakdown
          </h3>
          {totalCatRevenue > 0 ? (
            <div className=\"flex flex-col items-center justify-center my-auto py-2\">
              <svg viewBox=\"0 0 120 120\" className=\"w-32 h-32\">
                {(() => {
                  const C = 2 * Math.PI * 45;
                  const medPct = medicineRevenue / totalCatRevenue;
                  const medStroke = medPct * C;
                  const treatStroke = (1 - medPct) * C;

                  return (
                    <g transform=\"rotate(-90 60 60)\">
                      <circle
                        cx=\"60\"
                        cy=\"60\"
                        r=\"45\"
                        fill=\"none\"
                        stroke=\"var(--ac)\"
                        strokeWidth=\"16\"
                        strokeDasharray={`${medStroke} ${C}`}
                      />
                      <circle
                        cx=\"60\"
                        cy=\"60\"
                        r=\"45\"
                        fill=\"none\"
                        stroke=\"var(--mid)\"
                        strokeWidth=\"16\"
                        strokeDasharray={`${treatStroke} ${C}`}
                        strokeDashoffset={-medStroke}
                      />
                    </g>
                  );
                })()}
                <text
                  x=\"60\"
                  y=\"65\"
                  textAnchor=\"middle\"
                  fontSize=\"12\"
                  fontWeight=\"bold\"
                  fill=\"var(--ink)\"
                >
                  {formatMoney(totalCatRevenue)}
                </text>
              </svg>

              <div className=\"mt-4 w-full space-y-1.5 text-xs\">
                <div className=\"flex items-center justify-between\">
                  <div className=\"flex items-center gap-2\">
                    <span className=\"w-3 h-3 rounded-full bg-[var(--ac)]\" />
                    <span>Medicines</span>
                  </div>
                  <span className=\"font-semibold\">
                    {formatMoney(medicineRevenue)} ({Math.round((medicineRevenue / totalCatRevenue) * 100)}%)
                  </span>
                </div>
                <div className=\"flex items-center justify-between\">
                  <div className=\"flex items-center gap-2\">
                    <span className=\"w-3 h-3 rounded-full bg-[var(--mid)]\" />
                    <span>Treatments</span>
                  </div>
                  <span className=\"font-semibold\">
                    {formatMoney(treatmentRevenue)} ({Math.round((treatmentRevenue / totalCatRevenue) * 100)}%)
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className=\"p-8 text-center text-xs text-[var(--s2)]\">
              No sales recorded in this period.
            </div>
          )}
        </div>

        {/* Most Prescribed Medications */}
        <div className=\"p-5 sm:p-6 rounded-2xl bg-[var(--sf-card)] border border-[var(--hl)] shadow-[var(--lift)]\">
          <h3 className=\"text-base font-semibold font-serif text-[var(--ink)] mb-3\">
            Top Prescribed
          </h3>
          {topPrescribed.length === 0 ? (
            <div className=\"p-6 text-center text-xs text-[var(--s2)]\">No prescriptions yet</div>
          ) : (
            <div className=\"space-y-3 mt-2\">
              {topPrescribed.map(([name, count], i) => {
                const max = topPrescribed[0][1] || 1;
                return (
                  <div key={i} className=\"text-xs\">
                    <div className=\"flex justify-between font-medium text-[var(--ink)] mb-1\">
                      <span className=\"truncate pr-2\">{name}</span>
                      <span className=\"shrink-0\">{count} units</span>
                    </div>
                    <div className=\"w-full h-2 rounded-full bg-[var(--sage)] overflow-hidden\">
                      <div
                        className=\"h-full bg-[var(--ac)] rounded-full\"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Best Selling Revenue Earners */}
        <div className=\"p-5 sm:p-6 rounded-2xl bg-[var(--sf-card)] border border-[var(--hl)] shadow-[var(--lift)]\">
          <h3 className=\"text-base font-semibold font-serif text-[var(--ink)] mb-3\">
            Top Revenue Earners
          </h3>
          {topSellers.length === 0 ? (
            <div className=\"p-6 text-center text-xs text-[var(--s2)]\">No sales yet</div>
          ) : (
            <div className=\"space-y-3 mt-2\">
              {topSellers.map(([name, rev], i) => {
                const max = topSellers[0][1] || 1;
                return (
                  <div key={i} className=\"text-xs\">
                    <div className=\"flex justify-between font-medium text-[var(--ink)] mb-1\">
                      <span className=\"truncate pr-2\">{name}</span>
                      <span className=\"shrink-0 font-semibold\">{formatMoney(rev)}</span>
                    </div>
                    <div className=\"w-full h-2 rounded-full bg-[var(--sage)] overflow-hidden\">
                      <div
                        className=\"h-full bg-[var(--brass)] rounded-full\"
                        style={{ width: `${(rev / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Expiry & Low Stock Alerts Grid */}
      <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
        {/* Expiring Soon Alert */}
        <div className=\"p-5 sm:p-6 rounded-2xl bg-[var(--sf-card)] border border-[var(--hl)] shadow-[var(--lift)]\">
          <div className=\"flex items-center gap-2 pb-3 border-b border-[var(--hl)]\">
            <AlertTriangle className=\"w-5 h-5 text-[var(--err)]\" />
            <h3 className=\"text-base font-semibold font-serif text-[var(--ink)]\">
              Batches Expiring Within 60 Days
            </h3>
          </div>
          <div className=\"mt-3 divide-y divide-[var(--hl)]/50 max-h-56 overflow-y-auto\">
            {expiringBatches.length === 0 ? (
              <div className=\"p-4 text-center text-xs text-[var(--s2)]\">
                No pharmacy batches are close to expiry.
              </div>
            ) : (
              expiringBatches.map(({ item, batch }, idx) => {
                const isAlreadyExpired = batch.exp < todayStr;
                return (
                  <div key={idx} className=\"py-2.5 flex items-center justify-between text-xs\">
                    <div>
                      <span className=\"font-semibold text-[var(--ink)]\">{item.name}</span>
                      <div className=\"text-[11px] text-[var(--s2)]\">
                        Batch {batch.no} · {batch.qty} units left
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        isAlreadyExpired
                          ? 'bg-[var(--err)] text-white'
                          : 'bg-[var(--err-bg)] text-[var(--err)]'
                      }`}
                    >
                      {isAlreadyExpired ? 'Expired' : `Exp: ${formatDate(batch.exp)}`}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className=\"p-5 sm:p-6 rounded-2xl bg-[var(--sf-card)] border border-[var(--hl)] shadow-[var(--lift)]\">
          <div className=\"flex items-center gap-2 pb-3 border-b border-[var(--hl)]\">
            <AlertCircle className=\"w-5 h-5 text-[var(--brass)]\" />
            <h3 className=\"text-base font-semibold font-serif text-[var(--ink)]\">
              Low Stock Warnings (&le; Threshold)
            </h3>
          </div>
          <div className=\"mt-3 divide-y divide-[var(--hl)]/50 max-h-56 overflow-y-auto\">
            {lowStockItems.length === 0 ? (
              <div className=\"p-4 text-center text-xs text-[var(--s2)]\">
                All inventory levels are healthy.
              </div>
            ) : (
              lowStockItems.map((item) => (
                <div key={item.id} className=\"py-2.5 flex items-center justify-between text-xs\">
                  <div>
                    <span className=\"font-semibold text-[var(--ink)]\">{item.name}</span>
                    <div className=\"text-[11px] text-[var(--s2)]\">
                      Threshold: &le; {item.low} units
                    </div>
                  </div>
                  <span className=\"px-2 py-0.5 rounded bg-[var(--err-bg)] text-[var(--err)] font-bold text-[11px]\">
                    {item.stock} left
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
