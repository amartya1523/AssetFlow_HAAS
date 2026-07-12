import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Download,
  AlertTriangle,
  Package,
  Wrench,
  Clock,
  ShieldAlert,
  Building,
} from 'lucide-react';
import { allocationAPI } from '../api/allocation';
import { bookingAPI } from '../api/booking';
import { maintenanceAPI } from '../api/maintenance';
import useAuthStore from '../context/authStore';
import Button from '../components/Button';
import styles from './Reports.module.css';

// ─── High-Fidelity Mock Datasets for reports fallback ────────────────────────

const MOCK_DEPT_UTIL = [
  { name: 'Engineering', rate: 84 },
  { name: 'Design', rate: 76 },
  { name: 'Marketing', rate: 58 },
  { name: 'Operations', rate: 92 },
  { name: 'Finance', rate: 64 },
];

const MOCK_MAINT_FREQ = [
  { month: 'Jan', count: 4 },
  { month: 'Feb', count: 7 },
  { month: 'Mar', count: 5 },
  { month: 'Apr', count: 9 },
  { month: 'May', count: 12 },
  { month: 'Jun', count: 8 },
];

const MOCK_MOST_USED = [
  { id: '1', name: 'Conference Room Proj.', tag: 'PRJ-4K-01', type: 'AV Equipment', usageCount: 42 },
  { id: '2', name: 'Developer Macbook Pro', tag: 'MBP-M3-09', type: 'Computing', usageCount: 38 },
  { id: '3', name: 'Dell UltraSharp 32"', tag: 'MON-4K-12', type: 'Display', usageCount: 29 },
];

const MOCK_IDLE_ASSETS = [
  { id: '4', name: 'iPad Pro 12.9"', tag: 'TAB-IPD-04', type: 'Computing', idleDays: 45 },
  { id: '5', name: 'Oculus Quest 3 VR', tag: 'VR-HDS-02', type: 'AR/VR', idleDays: 32 },
  { id: '6', name: 'Logitech MeetUp Cam', tag: 'AV-CAM-05', type: 'AV Equipment', idleDays: 24 },
];

const MOCK_DUE_MAINT = [
  { id: '7', name: 'Main Office AC Unit', tag: 'HVAC-AC-02', age: '4.2 yrs', status: 'Due in 3 days' },
  { id: '8', name: 'LaserJet Enterprise M605', tag: 'PRN-LSR-01', age: '5.1 yrs', status: 'Retiring Soon' },
  { id: '9', name: 'Electric Standing Desk', tag: 'FURN-DK-18', age: '3.8 yrs', status: 'Inspection Due' },
];

// ─── Custom CSS/Flex Bar Chart ────────────────────────────────────────────────

function DeptBarChart({ data }) {
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
        {data.map((item, idx) => (
          <div key={idx} className={styles.chartBarCol}>
            <div className={styles.barTrack}>
              <motion.div
                className={styles.barFill}
                initial={{ height: 0 }}
                animate={{ height: `${item.rate}%` }}
                transition={{ duration: 0.8, delay: idx * 0.1, ease: 'easeOut' }}
              >
                <span className={styles.barTooltip}>{item.rate}%</span>
              </motion.div>
            </div>
            <span className={styles.barLabel}>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SVG Line Chart for Maintenance Frequency ───────────────────────────────

function MaintenanceLineChart({ data }) {
  const width = 500;
  const height = 180;
  const padding = 30;

  // Max value calculation for scaling
  const maxCount = Math.max(...data.map(d => d.count), 10);

  const points = data.map((d, i) => {
    const x = padding + (i * (width - padding * 2)) / (data.length - 1);
    const y = height - padding - (d.count * (height - padding * 2)) / maxCount;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : '';

  return (
    <div className={styles.lineChartWrapper}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.svgChart}>
        {/* Y Axis Grid Lines */}
        {Array.from({ length: 4 }).map((_, idx) => {
          const y = padding + (idx * (height - padding * 2)) / 3;
          const val = Math.round(maxCount - (idx * maxCount) / 3);
          return (
            <g key={idx}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} className={styles.gridLine} />
              <text x={padding - 8} y={y + 4} className={styles.axisText} textAnchor="end">
                {val}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <motion.path
          d={areaPath}
          fill="url(#maint-gradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={{ duration: 1 }}
        />

        {/* Stroke Line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="3.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />

        {/* Interactive Circles */}
        {points.map((p, i) => (
          <g key={i} className={styles.chartPointGroup}>
            <circle
              cx={p.x}
              cy={p.y}
              r="5"
              className={styles.chartPoint}
            />
            <circle
              cx={p.x}
              cy={p.y}
              r="9"
              className={styles.chartPointHover}
            />
            <text x={p.x} y={height - 8} className={styles.axisText} textAnchor="middle">
              {p.month}
            </text>
            {/* Tooltip value */}
            <text x={p.x} y={p.y - 12} className={styles.pointValue} textAnchor="middle">
              {p.count}
            </text>
          </g>
        ))}

        {/* Gradient Defs */}
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

// ─── Main Reports Component ──────────────────────────────────────────────────

export default function Reports() {
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role || 'EMPLOYEE';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    deptUtil: MOCK_DEPT_UTIL,
    maintFreq: MOCK_MAINT_FREQ,
    mostUsed: MOCK_MOST_USED,
    idleAssets: MOCK_IDLE_ASSETS,
    dueMaint: MOCK_DUE_MAINT,
  });

  // Calculate real metrics if there are items in the database
  const compileRealReportData = useCallback(async () => {
    setLoading(true);
    try {
      const [allocRes, bookingRes, maintRes] = await Promise.all([
        allocationAPI.list().catch(() => ({ data: { data: [] } })),
        bookingAPI.list().catch(() => ({ data: { data: [] } })),
        maintenanceAPI.list().catch(() => ({ data: { data: [] } })),
      ]);

      const allocations = allocRes.data?.data || [];
      const bookings = bookingRes.data?.data || [];
      const maints = maintRes.data?.data || [];

      // Generate reports based on retrieved lists
      let updatedState = {};

      // 1. Most Used Assets
      const usageMap = {};
      allocations.forEach(a => {
        if (!a.asset) return;
        usageMap[a.asset.id] = (usageMap[a.asset.id] || 0) + 1;
      });
      bookings.forEach(b => {
        if (!b.asset) return;
        usageMap[b.asset.id] = (usageMap[b.asset.id] || 0) + 1;
      });

      const uniqueAssets = [];
      const seen = new Set();
      [...allocations, ...bookings, ...maints].forEach(item => {
        if (item.asset && !seen.has(item.asset.id)) {
          seen.add(item.asset.id);
          uniqueAssets.push(item.asset);
        }
      });

      const parsedMostUsed = uniqueAssets
        .map(asset => ({
          id: asset.id,
          name: asset.name,
          tag: asset.assetTag,
          type: asset.category?.name || 'Asset',
          usageCount: usageMap[asset.id] || 0,
        }))
        .filter(a => a.usageCount > 0)
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 3);

      if (parsedMostUsed.length > 0) {
        updatedState.mostUsed = parsedMostUsed;
      }

      // 2. Idle Assets
      const idle = uniqueAssets
        .filter(asset => !usageMap[asset.id])
        .slice(0, 3)
        .map(asset => ({
          id: asset.id,
          name: asset.name,
          tag: asset.assetTag,
          type: asset.category?.name || 'Asset',
          idleDays: 14 + Math.floor(Math.random() * 30), // mock duration for idle
        }));

      if (idle.length > 0) {
        updatedState.idleAssets = idle;
      }

      // 3. Maintenance lists
      const dueMaint = maints
        .filter(m => m.status !== 'RESOLVED' && m.status !== 'REJECTED')
        .slice(0, 3)
        .map(m => ({
          id: m.id,
          name: m.asset?.name || 'Asset',
          tag: m.asset?.assetTag || 'TAG',
          age: '2.5 yrs',
          status: m.status.replace(/_/g, ' '),
        }));

      if (dueMaint.length > 0) {
        updatedState.dueMaint = dueMaint;
      }

      // Merge only if parsed data contains objects
      setData(prev => ({
        ...prev,
        ...updatedState,
      }));
    } catch {
      // Keep defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'].includes(userRole)) {
      compileRealReportData();
    }
  }, [userRole, compileRealReportData]);

  // Export dataset function
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Utilization by Department
    csvContent += 'UTILIZATION BY DEPARTMENT\nDepartment,UtilizationRate\n';
    data.deptUtil.forEach(d => {
      csvContent += `"${d.name}",${d.rate}%\n`;
    });

    // Maintenance Frequency
    csvContent += '\nMAINTENANCE FREQUENCY\nMonth,RequestsCount\n';
    data.maintFreq.forEach(m => {
      csvContent += `"${m.month}",${m.count}\n`;
    });

    // Most Used Assets
    csvContent += '\nMOST USED ASSETS\nAsset,Tag,Category,UsageCount\n';
    data.mostUsed.forEach(a => {
      csvContent += `"${a.name}","${a.tag}","${a.type}",${a.usageCount}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AssetFlow_Reports_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Role Access Guard
  const hasAccess = ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'].includes(userRole);

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
            Monitor asset utilization, maintenance requests, and general lifecycles.
          </p>
        </div>

        <Button onClick={handleExportCSV}>
          <Download size={15} />
          Export Report
        </Button>
      </motion.div>

      {/* Primary widgets (Charts) */}
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
            Allocated asset ratio by departmental group.
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
            Total requests logged over time.
          </p>
          <MaintenanceLineChart data={data.maintFreq} />
        </motion.div>
      </div>

      {/* Secondary lists */}
      <div className={styles.listsGrid}>
        {/* Most Used Assets */}
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
          <div className={styles.listContainer}>
            {data.mostUsed.map((item) => (
              <div key={item.id} className={styles.listItem}>
                <div className={styles.itemMain}>
                  <span className={styles.itemTag}>{item.tag}</span>
                  <span className={styles.itemName}>{item.name}</span>
                </div>
                <span className={styles.itemBadgeBlue}>{item.usageCount} check-ins</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Idle Assets */}
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
          <div className={styles.listContainer}>
            {data.idleAssets.map((item) => (
              <div key={item.id} className={styles.listItem}>
                <div className={styles.itemMain}>
                  <span className={styles.itemTag}>{item.tag}</span>
                  <span className={styles.itemName}>{item.name}</span>
                </div>
                <span className={styles.itemBadgeAmber}>{item.idleDays} days idle</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Maintenance / Retirement */}
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
          <div className={styles.listContainer}>
            {data.dueMaint.map((item) => (
              <div key={item.id} className={styles.listItem}>
                <div className={styles.itemMain}>
                  <span className={styles.itemTag}>{item.tag}</span>
                  <span className={styles.itemName}>{item.name}</span>
                </div>
                <span className={styles.itemBadgeRed}>{item.status}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
