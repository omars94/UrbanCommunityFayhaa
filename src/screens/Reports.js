import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import database from '@react-native-firebase/database';
import { generatePDF } from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import HeaderSection from '../components/headerSection';
import {
  BORDER_RADIUS,
  COLORS,
  COMPLAINT_STATUS_AR,
  SPACING,
} from '../constants';

function safeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function normalizeDateRange(fromDate, toDate) {
  const from = fromDate ? startOfDay(fromDate) : null;
  const to = toDate ? endOfDay(toDate) : null;
  if (from && to && from > to) return { from: to, to: from };
  return { from, to };
}

function filterComplaintsByCreatedAt(complaints, from, to) {
  if (!from && !to) return complaints;
  return complaints.filter(c => {
    const createdAt = safeDate(c?.created_at);
    if (!createdAt) return false;
    if (from && createdAt < from) return false;
    if (to && createdAt > to) return false;
    return true;
  });
}

function formatDateAr(d) {
  try {
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function computeComplaintStats(complaints) {
  const byStatus = {};
  let newestUpdatedAt = null;
  let oldestCreatedAt = null;
  let newestCreatedAt = null;

  for (const c of complaints) {
    const status = c?.status || 'غير محدد';
    byStatus[status] = (byStatus[status] || 0) + 1;

    const updatedAt =
      safeDate(c?.updated_at) ||
      safeDate(c?.completed_at) ||
      safeDate(c?.resolved_at) ||
      safeDate(c?.rejected_at) ||
      safeDate(c?.denied_at) ||
      safeDate(c?.created_at);
    if (updatedAt && (!newestUpdatedAt || updatedAt > newestUpdatedAt)) {
      newestUpdatedAt = updatedAt;
    }

    const createdAt = safeDate(c?.created_at);
    if (createdAt && (!oldestCreatedAt || createdAt < oldestCreatedAt)) {
      oldestCreatedAt = createdAt;
    }
    if (createdAt && (!newestCreatedAt || createdAt > newestCreatedAt)) {
      newestCreatedAt = createdAt;
    }
  }

  const total = complaints.length;
  const rows = Object.keys(byStatus)
    .sort((a, b) => (byStatus[b] || 0) - (byStatus[a] || 0))
    .map(status => ({
      status,
      statusLabel: COMPLAINT_STATUS_AR?.[String(status).toUpperCase()]
        ? COMPLAINT_STATUS_AR[String(status).toUpperCase()]
        : COMPLAINT_STATUS_AR?.[status] || status,
      count: byStatus[status] || 0,
      pct: total > 0 ? Math.round(((byStatus[status] || 0) / total) * 100) : 0,
    }));

  return {
    total,
    rows,
    newestUpdatedAt,
    oldestCreatedAt,
    newestCreatedAt,
  };
}

function buildReportHtml(stats, { fromDate, toDate } = {}) {
  const generatedAt = new Date();
  const period = fromDate || toDate
    ? `من ${fromDate ? formatDateAr(fromDate) : 'بداية'} إلى ${
        toDate ? formatDateAr(toDate) : 'الآن'
      }`
    : stats.oldestCreatedAt && stats.newestCreatedAt
      ? `${formatDateAr(stats.oldestCreatedAt)} - ${formatDateAr(
          stats.newestCreatedAt,
        )}`
      : 'غير متوفر';
  const lastUpdate = stats.newestUpdatedAt
    ? formatDateAr(stats.newestUpdatedAt)
    : 'غير متوفر';

  const tableRows = stats.rows
    .map(
      r => `
      <tr>
        <td>${escapeHtml(r.statusLabel)}</td>
        <td style="text-align:center;">${r.count}</td>
        <td style="text-align:center;">${r.pct}%</td>
      </tr>
    `,
    )
    .join('');

  return `
  <!doctype html>
  <html lang="ar" dir="rtl">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        body { font-family: Arial, sans-serif; padding: 18px; color: #111; }
        h1 { margin: 0 0 8px 0; font-size: 22px; }
        .meta { color: #555; font-size: 12px; margin-bottom: 14px; }
        .card { border: 1px solid #e6e6e6; border-radius: 10px; padding: 14px; margin-bottom: 14px; }
        .kpis { display: flex; gap: 10px; flex-wrap: wrap; }
        .kpi { flex: 1; min-width: 140px; border: 1px solid #eee; border-radius: 10px; padding: 12px; }
        .kpi .label { color: #555; font-size: 12px; margin-bottom: 6px; }
        .kpi .value { font-size: 20px; font-weight: 700; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #eee; padding: 10px; font-size: 13px; }
        th { background: #f7f7f7; font-weight: 700; }
        .footer { margin-top: 16px; color: #777; font-size: 11px; }
      </style>
    </head>
    <body>
      <h1>تقرير إحصاءات الشكاوى</h1>
      <div class="meta">تاريخ إنشاء التقرير: ${escapeHtml(
        formatDateAr(generatedAt),
      )}</div>

      <div class="card">
        <div class="kpis">
          <div class="kpi">
            <div class="label">إجمالي الشكاوى</div>
            <div class="value">${stats.total}</div>
          </div>
          <div class="kpi">
            <div class="label">الفترة (حسب تاريخ الإنشاء)</div>
            <div class="value" style="font-size: 14px; font-weight: 600;">${escapeHtml(
              period,
            )}</div>
          </div>
          <div class="kpi">
            <div class="label">آخر تحديث متوفر</div>
            <div class="value" style="font-size: 14px; font-weight: 600;">${escapeHtml(
              lastUpdate,
            )}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>الحالة</th>
              <th style="text-align:center;">العدد</th>
              <th style="text-align:center;">النسبة</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="3">لا توجد بيانات</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="footer">Urban Community Fayhaa</div>
    </body>
  </html>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export default function ReportsScreen() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [pdfLink, setPdfLink] = useState('');

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [pickerTarget, setPickerTarget] = useState(null); // 'from' | 'to' | null

  const { from, to } = useMemo(
    () => normalizeDateRange(fromDate, toDate),
    [fromDate, toDate],
  );

  const filteredComplaints = useMemo(
    () => filterComplaintsByCreatedAt(complaints, from, to),
    [complaints, from, to],
  );

  const stats = useMemo(
    () => computeComplaintStats(filteredComplaints),
    [filteredComplaints],
  );

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const snapshot = await database().ref('/complaints').once('value');
      const complaintsData = snapshot.val();
      const arr = complaintsData
        ? Object.keys(complaintsData).map(key => ({
            id: key,
            ...complaintsData[key],
          }))
        : [];
      setComplaints(arr);
    } catch (e) {
      console.error('Error loading complaints:', e);
      setError('حدث خطأ أثناء جلب الشكاوى');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const onChangePicker = useCallback(
    (event, selectedDate) => {
      if (Platform.OS === 'android') {
        setPickerTarget(null);
        if (event?.type === 'dismissed') return;
      }

      const d = selectedDate || new Date();
      if (pickerTarget === 'from') setFromDate(d);
      if (pickerTarget === 'to') setToDate(d);
    },
    [pickerTarget],
  );

  const onClearDates = useCallback(() => {
    setFromDate(null);
    setToDate(null);
    setPickerTarget(null);
  }, []);

  const onExportPdf = useCallback(async () => {
    setExporting(true);
    setError('');
    try {
      // Refresh just before exporting to keep stats accurate
      const snapshot = await database().ref('/complaints').once('value');
      const complaintsData = snapshot.val();
      const arr = complaintsData
        ? Object.keys(complaintsData).map(key => ({
            id: key,
            ...complaintsData[key],
          }))
        : [];
      const filteredArr = filterComplaintsByCreatedAt(arr, from, to);
      const currentStats = computeComplaintStats(filteredArr);
      const html = buildReportHtml(currentStats, { fromDate: from, toDate: to });

      const fileName = `complaints-report-${Date.now()}.pdf`;
      const result = await generatePDF({
        html,
        fileName: fileName.replace(/\.pdf$/i, ''),
        directory: 'Documents',
        base64: false,
      });

      console.log({ result });
      const rawPath = result?.filePath || '';
      if (!rawPath) {
        throw new Error('PDF file path missing');
      }
      console.log({ rawPath });
      const srcPath = rawPath.replace(/^file:\/\//, '');
      const downloadsPath =
        Platform.OS === 'android'
          ? RNFS.DownloadDirectoryPath
          : RNFS.DocumentDirectoryPath;
      const destPath = `${downloadsPath}/${fileName}`;
      console.log({ destPath });
      await RNFS.copyFile(srcPath, destPath);
      console.log({ destPath });

      const url =
        Platform.OS === 'android' && !destPath.startsWith('file://')
          ? `${destPath}`
          : destPath;
      console.log({ url });
      setPdfLink(url);

      console.log({opennn:FileViewer?.open});
      
      FileViewer?.open && FileViewer?.open(destPath, 'application/pdf').catch(() => {});

      // Alert.alert('تم التصدير بنجاح', 'تم حفظ ملف الـ PDF على جهازك.', [
      //   { text: 'حسناً' },
      // ]);
    } catch (e) {
      console.error('Error exporting pdf:', e);
      setError('حدث خطأ أثناء تصدير ملف PDF');
    } finally {
      setExporting(false);
    }
  }, [from, to]);

  return (
    <View style={styles.container}>
      <HeaderSection title="التقارير" subtitle="ملخص إحصاءات الشكاوى" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.helperText}>جارِ تحميل البيانات...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {!!error && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={loadComplaints}
              >
                <Text style={styles.secondaryBtnText}>إعادة المحاولة</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>فلترة حسب التاريخ (تاريخ الإنشاء)</Text>

            <View style={styles.filtersRow}>
              <TouchableOpacity
                style={styles.filterBtn}
                onPress={() => setPickerTarget('from')}
              >
                <Text style={styles.filterBtnLabel}>من</Text>
                <Text style={styles.filterBtnValue}>
                  {fromDate ? formatDateAr(fromDate) : 'اختر تاريخ'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterBtn}
                onPress={() => setPickerTarget('to')}
              >
                <Text style={styles.filterBtnLabel}>إلى</Text>
                <Text style={styles.filterBtnValue}>
                  {toDate ? formatDateAr(toDate) : 'اختر تاريخ'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filtersMeta}>
              <Text style={styles.helperText}>
                النتائج: {filteredComplaints.length} / {complaints.length}
              </Text>

              <TouchableOpacity style={styles.clearBtn} onPress={onClearDates}>
                <Text style={styles.clearBtnText}>مسح</Text>
              </TouchableOpacity>
            </View>

            {!!pickerTarget && Platform.OS === 'android' && (
              <DateTimePicker
                value={
                  (pickerTarget === 'from' ? fromDate : toDate) || new Date()
                }
                mode="date"
                display="default"
                onChange={onChangePicker}
              />
            )}

            {!!pickerTarget && Platform.OS === 'ios' && (
              <View style={styles.pickerInline}>
                <DateTimePicker
                  value={
                    (pickerTarget === 'from' ? fromDate : toDate) || new Date()
                  }
                  mode="date"
                  display="spinner"
                  onChange={onChangePicker}
                />
                <TouchableOpacity
                  style={[styles.secondaryBtn, styles.pickerDoneBtn]}
                  onPress={() => setPickerTarget(null)}
                >
                  <Text style={styles.secondaryBtnText}>تم</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>إجمالي الشكاوى</Text>
            <Text style={styles.bigNumber}>{stats.total}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>تفصيل الحالات</Text>
            {stats.rows.length === 0 ? (
              <Text style={styles.helperText}>لا توجد بيانات</Text>
            ) : (
              stats.rows.map((row, idx) => (
                <View
                  key={row.status}
                  style={[
                    styles.row,
                    idx === stats.rows.length - 1 && styles.rowLast,
                  ]}
                >
                  <Text style={styles.rowLabel}>{row.statusLabel}</Text>
                  <Text style={styles.rowValue}>
                    {row.count} ({row.pct}%)
                  </Text>
                </View>
              ))
            )}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, exporting && styles.primaryBtnDisabled]}
            onPress={onExportPdf}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.primaryBtnText}>تصدير PDF</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  helperText: {
    marginTop: SPACING.md,
    color: COLORS.text.secondary,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  filtersRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  filterBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.gray[50],
  },
  filterBtnLabel: {
    color: COLORS.text.secondary,
    marginBottom: 6,
    fontSize: 12,
  },
  filterBtnValue: {
    color: COLORS.text.primary,
    fontWeight: '700',
  },
  filtersMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  clearBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
  },
  clearBtnText: {
    color: COLORS.text.secondary,
    fontWeight: '700',
  },
  pickerInline: {
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
  },
  pickerDoneBtn: {
    margin: SPACING.md,
  },
  cardTitle: {
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  bigNumber: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    color: COLORS.text.primary,
    flex: 1,
  },
  rowValue: {
    color: COLORS.text.secondary,
  },
  primaryBtn: {
    height: 52,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
  errorCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  errorText: {
    color: COLORS.danger,
    marginBottom: SPACING.md,
  },
  secondaryBtn: {
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
