import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building,
  Clock,
  Download,
  Package,
  ShieldAlert,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import useAuthStore from '../context/authStore';
import { reportsAPI } from '../api/reports';
import Button from '../components/Button';
import styles from './Reports.module.css';

function EmptyPanel({ text }) {
  return <div className={styles.emptyPanel}>{text}</div>;
}

function DeptBarChart({ data }) {
  if (!data.length) {
    return <EmptyPanel text="No departmental asset data available yet." />;
  }

  return (
    <div className={styles.barChartContainer}>
      <div className={styles.chartYAxis}>
        <span>100%</span>
        <span>75%</span>
        <span>50%</span>
        <span>25%</span>
        <span>0%</span>
      </div>
      <div className={styles.chartPlot}>
        {data.map((item, index) => (
          <div key={item.name} className={styles.chartBarCol}>
            <div className={styles.barTrack}>
              <motion.div
                className={styles.barFill}
                initial={{ height: 0 }}
                animate={{ height: `${item.rate}%` }}
                transition={{ duration: 0.8, delay: index * 0.08, ease: 'easeOut' }}
              >
                <span className={styles.barTooltip}>
                  {item.rate}%
                </span>
              </motion.div>
            </div>
            <span className={styles.barLabel}>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MaintenanceLineChart({ data }) {
  if (!data.length) {
    return <EmptyPanel text="No maintenance activity recorded yet." />;
  }

  const width = 500;
  const height = 180;
  const padding = 30;
  const maxCount = Math.max(...data.map((item) => item.count), 1);
  const divisor = Math.max(data.length - 1, 1);

  const points = data.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / divisor;
    const y = height - padding - (item.count * (height - padding * 2)) / maxCount;
    return { x, y, ...item };
  });

  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : '';

  return (
    <div className={styles.lineChartWrapper}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.svgChart}>
        {Array.from({ length: 4 }).map((_, index) => {
          const y = padding + (index * (height - padding * 2)) / 3;
          const value = Math.round(maxCount - (index * maxCount) / 3);
          return (
            <g key={value}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} className={styles.gridLine} />
              <text x={padding - 8} y={y + 4} className={styles.axisText} textAnchor="end">
                {value}
              </text>
            </g>
          );
        })}

        <motion.path
          d={areaPath}
          fill="url(#maint-gradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={{ duration: 0.8 }}
        />

        <motion.path
          d={linePath}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="3.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />

        {points.map((point) => (
          <g key={point.month} className={styles.chartPointGroup}>
            <circle cx={point.x} cy={point.y} r="5" className={styles.chartPoint} />
            <circle cx={point.x} cy={point.y} r="9" className={styles.chartPointHover} />
            <text x={point.x} y={height - 8} className={styles.axisText} textAnchor="middle">
              {point.month}
            </text>
            <text x={point.x} y={point.y - 12} className={styles.pointValue} textAnchor="middle">
              {point.count}
            </text>
          </g>
        ))}

        <defs>
          <linearGradient id="maint-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="var(--color-primary-light)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function ReportList({ items, badgeClassName, badgeFormatter, emptyText }) {
  if (!items.length) {
    return <EmptyPanel text={emptyText} />;
  }

  return (
    <div className={styles.listContainer}>
      {items.map((item) => (
        <div key={item.id} className={styles.listItem}>
          <div className={styles.itemMain}>
            <span className={styles.itemTag}>{item.tag}</span>
            <span className={styles.itemName}>{item.name}</span>
          </div>
          <span className={badgeClassName}>{badgeFormatter(item)}</span>
        </div>
      ))}
    </div>
  );
}

const EMPTY_REPORT = {
  deptUtil: [],
  maintFreq: [],
  mostUsed: [],
  idleAssets: [],
  dueMaint: [],
};

export default function Reports() {
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role || 'EMPLOYEE';
  const hasAccess = ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'].includes(userRole);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(EMPTY_REPORT);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await reportsAPI.summary();
      setData({
        deptUtil: res.data?.data?.deptUtil || [],
        maintFreq: res.data?.data?.maintFreq || [],
        mostUsed: res.data?.data?.mostUsed || [],
        idleAssets: res.data?.data?.idleAssets || [],
        dueMaint: res.data?.data?.dueMaint || [],
      });
    } catch (err) {
      setData(EMPTY_REPORT);
      setError(err.response?.data?.message || 'Unable to load live reports right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasAccess) {
      loadReports();
    }
  }, [hasAccess, loadReports]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await reportsAPI.exportCsv();
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const disposition = res.headers['content-disposition'] || '';
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
      const filename = filenameMatch?.[1] || `assetflow-report-${new Date().toISOString().split('T')[0]}.csv`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to export report right now.');
    } finally {
      setExporting(false);
    }
  };

  if (!hasAccess) {
    return (
      <div className={styles.restrictedPage}>
        <motion.div
          className={styles.restrictedCard}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className={styles.restrictedIcon}>
            <ShieldAlert size={36} />
          </div>
          <h2 className={styles.restrictedTitle}>Access Restricted</h2>
          <p className={styles.restrictedText}>
            You do not have permission to access the Reports &amp; Analytics workspace.
            Only organization admins, department heads, and asset managers can view report summaries.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className={styles.title}>Reports &amp; Analytics</h2>
          <p className={styles.subtitle}>
            Live organization insights from assets, allocations, bookings, and maintenance activity.
          </p>
        </div>

        <Button onClick={handleExport} loading={exporting} disabled={loading}>
          <Download size={15} />
          Export Report
        </Button>
      </motion.div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {loading ? (
        <div className={styles.loadingCard}>Loading live reports...</div>
      ) : (
        <>
          <div className={styles.chartsGrid}>
            <motion.div
              className={styles.card}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <h3 className={styles.cardTitle}>
                <Building size={16} />
                Utilization by Department
              </h3>
              <p className={styles.cardSubtitle}>
                Allocated asset ratio across departments in your organization.
              </p>
              <DeptBarChart data={data.deptUtil} />
            </motion.div>

            <motion.div
              className={styles.card}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className={styles.cardTitle}>
                <TrendingUp size={16} />
                Maintenance Frequency
              </h3>
              <p className={styles.cardSubtitle}>
                Maintenance requests logged over the last 6 months.
              </p>
              <MaintenanceLineChart data={data.maintFreq} />
            </motion.div>
          </div>

          <div className={styles.listsGrid}>
            <motion.div
              className={styles.card}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h3 className={styles.listTitle}>
                <Package size={16} />
                Most Used Assets
              </h3>
              <ReportList
                items={data.mostUsed}
                badgeClassName={styles.itemBadgeBlue}
                badgeFormatter={(item) => `${item.usageCount} uses`}
                emptyText="No asset usage has been recorded yet."
              />
            </motion.div>

            <motion.div
              className={styles.card}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className={styles.listTitle}>
                <Clock size={16} />
                Idle Assets
              </h3>
              <ReportList
                items={data.idleAssets}
                badgeClassName={styles.itemBadgeAmber}
                badgeFormatter={(item) => `${item.idleDays} days idle`}
                emptyText="No idle assets detected yet."
              />
            </motion.div>

            <motion.div
              className={styles.card}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <h3 className={styles.listTitle}>
                <Wrench size={16} />
                Maintenance &amp; Retirement
              </h3>
              <ReportList
                items={data.dueMaint}
                badgeClassName={styles.itemBadgeRed}
                badgeFormatter={(item) => item.status}
                emptyText="No pending maintenance items right now."
              />
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
