import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  ChevronLeft,
  Loader2,
  BarChart2,
  MapPin,
  User,
  CalendarDays,
  ShieldAlert,
  LockKeyhole,
  FileWarning,
} from 'lucide-react';
import { auditAPI } from '../api/audit';
import useAuthStore from '../context/authStore';
import Button from '../components/Button';
import styles from './Audit.module.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Result pill ──────────────────────────────────────────────────────────────

const RESULT_META = {
  VERIFIED: { label: 'Verified', cls: 'pillVerified', Icon: CheckCircle2 },
  MISSING:  { label: 'Missing',  cls: 'pillMissing',  Icon: AlertTriangle },
  DAMAGED:  { label: 'Damaged',  cls: 'pillDamaged',  Icon: Wrench },
  null:     { label: 'Pending',  cls: 'pillPending',  Icon: ClipboardList },
};

function ResultPill({ result }) {
  const meta = RESULT_META[result] ?? RESULT_META[null];
  const { Icon } = meta;
  return (
    <span className={`${styles.pill} ${styles[meta.cls]}`}>
      <Icon size={11} strokeWidth={2.5} />
      {meta.label}
    </span>
  );
}

// Cycle status pill
const CYCLE_STATUS_META = {
  OPEN:   { label: 'Open',   cls: 'cycleOpen'   },
  CLOSED: { label: 'Closed', cls: 'cycleClosed' },
};

function CycleStatusPill({ status }) {
  const meta = CYCLE_STATUS_META[status] ?? { label: status, cls: 'cycleClosed' };
  return <span className={`${styles.cycleStatusPill} ${styles[meta.cls]}`}>{meta.label}</span>;
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function Skeleton({ rows = 4 }) {
  return (
    <div className={styles.skeletonWrap}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.skeletonRow} style={{ width: `${88 - i * 9}%` }} />
      ))}
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ progress }) {
  if (!progress) return null;
  const { totalItems, verifiedCount, discrepancyCount, pendingCount, progressPercent } = progress;

  return (
    <div className={styles.progressSection}>
      <div className={styles.progressHeader}>
        <span className={styles.progressLabel}>Audit Progress</span>
        <span className={styles.progressPct}>{progressPercent}%</span>
      </div>
      <div className={styles.progressTrack}>
        <motion.div
          className={styles.progressFill}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <div className={styles.progressStats}>
        <span className={styles.statVerified}>
          <CheckCircle2 size={13} /> {verifiedCount} Verified
        </span>
        <span className={styles.statDiscrepancy}>
          <AlertTriangle size={13} /> {discrepancyCount} Discrepancies
        </span>
        <span className={styles.statPending}>
          <ClipboardList size={13} /> {pendingCount} Pending
        </span>
        <span className={styles.statTotal}>of {totalItems} assets</span>
      </div>
    </div>
  );
}

// ─── Discrepancy banner ───────────────────────────────────────────────────────

function DiscrepancyBanner({ cycle, onView }) {
  const count = cycle?.progress?.discrepancyCount ?? 0;
  const pending = cycle?.progress?.pendingCount ?? 0;
  const isClosed = cycle?.status === 'CLOSED';
  const total = count + (isClosed ? 0 : pending);

  if (total === 0) return null;

  return (
    <motion.div
      className={styles.discrepancyBanner}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <ShieldAlert size={18} className={styles.discrepancyIcon} />
      <div className={styles.discrepancyText}>
        <strong>
          {count} discrepanc{count === 1 ? 'y' : 'ies'} found
          {!isClosed && pending > 0 && ` · ${pending} item${pending > 1 ? 's' : ''} still pending`}
        </strong>
        <span>
          {isClosed
            ? 'This cycle is closed. Missing items have been recorded.'
            : 'Review and verify all items before closing the cycle.'}
        </span>
      </div>
      <button className={styles.discrepancyBtn} onClick={onView}>
        View Report
      </button>
    </motion.div>
  );
}

// ─── Create Cycle Modal ───────────────────────────────────────────────────────

function CreateCycleModal({ onClose, onCreated }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    name: '',
    startDate: today,
    endDate: '',
    scopeDepartmentId: '',
    scopeLocation: '',
    auditorIds: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Cycle name is required.'); return; }
    if (!form.startDate)   { setError('Start date is required.'); return; }
    if (!form.endDate)     { setError('End date is required.'); return; }
    if (form.endDate <= form.startDate) { setError('End date must be after start date.'); return; }

    // Parse comma-separated auditor IDs
    const auditorIds = form.auditorIds
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      const res = await auditAPI.createCycle({
        name: form.name.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        scopeDepartmentId: form.scopeDepartmentId.trim() || undefined,
        scopeLocation: form.scopeLocation.trim() || undefined,
        auditorIds: auditorIds.length > 0 ? auditorIds : undefined,
      });
      onCreated(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create audit cycle.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className={styles.modalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <ClipboardList size={18} /> Create Audit Cycle
          </h3>
          <button className={styles.modalClose} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className={styles.modalBody} noValidate>
          <div className={styles.formField}>
            <label className={styles.label} htmlFor="audit-name">
              Cycle Name <span className={styles.required}>*</span>
            </label>
            <input
              id="audit-name"
              name="name"
              className={styles.input}
              placeholder="e.g. Q3 2026 Asset Audit"
              value={form.name}
              onChange={onChange}
              autoFocus
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.label} htmlFor="audit-start">
                Start Date <span className={styles.required}>*</span>
              </label>
              <input
                id="audit-start"
                name="startDate"
                type="date"
                className={styles.input}
                value={form.startDate}
                onChange={onChange}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.label} htmlFor="audit-end">
                End Date <span className={styles.required}>*</span>
              </label>
              <input
                id="audit-end"
                name="endDate"
                type="date"
                className={styles.input}
                value={form.endDate}
                onChange={onChange}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.label} htmlFor="audit-dept">
                Scope: Department ID
                <span className={styles.optional}> (optional)</span>
              </label>
              <input
                id="audit-dept"
                name="scopeDepartmentId"
                className={styles.input}
                placeholder="Leave blank for all departments"
                value={form.scopeDepartmentId}
                onChange={onChange}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.label} htmlFor="audit-loc">
                Scope: Location
                <span className={styles.optional}> (optional)</span>
              </label>
              <input
                id="audit-loc"
                name="scopeLocation"
                className={styles.input}
                placeholder="e.g. Floor 3, Warehouse A"
                value={form.scopeLocation}
                onChange={onChange}
              />
            </div>
          </div>

          <div className={styles.formField}>
            <label className={styles.label} htmlFor="audit-auditors">
              Auditor User IDs
              <span className={styles.optional}> (optional, comma-separated)</span>
            </label>
            <input
              id="audit-auditors"
              name="auditorIds"
              className={styles.input}
              placeholder="uuid-1, uuid-2, ..."
              value={form.auditorIds}
              onChange={onChange}
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                className={styles.inlineError}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <AlertTriangle size={14} /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className={styles.modalFooter}>
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              <Plus size={15} /> Create Cycle
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Close Cycle Confirmation Modal ──────────────────────────────────────────

function CloseCycleModal({ cycle, onClose, onClosed }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pendingCount = cycle?.progress?.pendingCount ?? 0;

  const onConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await auditAPI.closeCycle(cycle.id);
      onClosed(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close cycle.');
      setLoading(false);
    }
  };

  return (
    <motion.div
      className={styles.modalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`${styles.modal} ${styles.modalSm}`}
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.closeCycleHeader}>
          <div className={styles.closeCycleIcon}>
            <LockKeyhole size={24} />
          </div>
          <h3 className={styles.closeCycleTitle}>Close Audit Cycle</h3>
          <p className={styles.closeCycleSubtitle}>
            This action is <strong>irreversible</strong>. Once closed, no further changes can be made to audit items.
          </p>
          {pendingCount > 0 && (
            <div className={styles.closeCycleWarning}>
              <AlertTriangle size={14} />
              <span>
                {pendingCount} unchecked item{pendingCount > 1 ? 's' : ''} will be automatically marked as <strong>Missing</strong>.
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className={styles.inlineError} style={{ margin: '0 var(--space-lg)' }}>
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        <div className={styles.closeCycleFooter}>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            loading={loading}
            style={{ background: '#ef4444', borderColor: '#ef4444' }}
          >
            <LockKeyhole size={15} /> Yes, Close Cycle
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Discrepancy Report Modal ─────────────────────────────────────────────────

function DiscrepancyModal({ cycleId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await auditAPI.getDiscrepancyReport(cycleId);
        setData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load discrepancy report.');
      } finally {
        setLoading(false);
      }
    })();
  }, [cycleId]);

  return (
    <motion.div
      className={styles.modalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`${styles.modal} ${styles.modalLg}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <FileWarning size={18} /> Discrepancy Report
          </h3>
          <button className={styles.modalClose} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.discrepancyModalBody}>
          {loading ? (
            <Skeleton rows={5} />
          ) : error ? (
            <div className={styles.inlineError}><AlertTriangle size={14} /> {error}</div>
          ) : !data ? null : (
            <>
              <div className={styles.discrepancyReportMeta}>
                <span><CalendarDays size={14} /> {fmtDate(data.cycle?.startDate)} – {fmtDate(data.cycle?.endDate)}</span>
                <span className={styles.discrepancyCount}>
                  {data.discrepancyCount} non-verified item{data.discrepancyCount !== 1 ? 's' : ''}
                </span>
              </div>

              {data.discrepancies.length === 0 ? (
                <div className={styles.emptyState}>
                  <CheckCircle2 size={36} />
                  <p>No discrepancies — all items verified!</p>
                </div>
              ) : (
                <div className={styles.discrepancyTable}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Asset</th>
                        <th>Expected Location</th>
                        <th>Status</th>
                        <th>Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.discrepancies.map((item) => (
                        <tr key={item.id} className={styles.tableRow}>
                          <td>
                            <span className={styles.assetTag}>{item.asset?.assetTag}</span>
                            <span className={styles.assetName}>{item.asset?.name}</span>
                          </td>
                          <td className={styles.locationCell}>
                            <MapPin size={12} />
                            {item.expectedLocation || '—'}
                          </td>
                          <td><ResultPill result={item.result} /></td>
                          <td>{item.asset?.department?.name || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Audit Item Row ───────────────────────────────────────────────────────────

function AuditItemRow({ item, isClosed, onUpdated }) {
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState(item.notes || '');
  const [showNotes, setShowNotes] = useState(false);

  const setResult = async (result) => {
    if (isClosed) return;
    setSaving(true);
    try {
      const res = await auditAPI.updateItem(item.id, { result, notes: notes.trim() || undefined });
      onUpdated(res.data.data);
    } catch {
      // silent — the row stays as-is
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (isClosed || !notes.trim()) return;
    setSaving(true);
    try {
      const res = await auditAPI.updateItem(item.id, { result: item.result ?? undefined, notes: notes.trim() });
      onUpdated(res.data.data);
      setShowNotes(false);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className={`${styles.tableRow} ${isClosed ? styles.rowClosed : ''}`}>
      <td>
        <div className={styles.assetCell}>
          <span className={styles.assetTag}>{item.asset?.assetTag}</span>
          <span className={styles.assetName}>{item.asset?.name}</span>
        </div>
      </td>
      <td>
        <div className={styles.locationCell}>
          <MapPin size={12} />
          {item.expectedLocation || '—'}
        </div>
      </td>
      <td>
        {/* Verification pill buttons */}
        <div className={styles.resultGroup}>
          {['VERIFIED', 'MISSING', 'DAMAGED'].map((r) => {
            const meta = RESULT_META[r];
            const { Icon } = meta;
            const isActive = item.result === r;
            return (
              <button
                key={r}
                className={`${styles.resultBtn} ${styles[`resultBtn_${r}`]} ${isActive ? styles.resultBtnActive : ''}`}
                onClick={() => setResult(r)}
                disabled={isClosed || saving}
                title={meta.label}
              >
                <Icon size={13} strokeWidth={2.5} />
                {meta.label}
              </button>
            );
          })}
          {saving && <Loader2 size={14} className={styles.savingSpinner} />}
        </div>
      </td>
      <td>
        {!isClosed ? (
          showNotes ? (
            <div className={styles.notesEdit}>
              <input
                className={styles.notesInput}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes..."
                onKeyDown={(e) => { if (e.key === 'Enter') saveNotes(); if (e.key === 'Escape') setShowNotes(false); }}
                autoFocus
              />
              <button className={styles.notesSave} onClick={saveNotes} disabled={saving}>✓</button>
              <button className={styles.notesCancel} onClick={() => { setShowNotes(false); setNotes(item.notes || ''); }}>✕</button>
            </div>
          ) : (
            <button className={styles.notesBtn} onClick={() => setShowNotes(true)}>
              {item.notes ? <span className={styles.notesText}>{item.notes}</span> : <span className={styles.notesPlaceholder}>+ Add note</span>}
            </button>
          )
        ) : (
          <span className={styles.notesText}>{item.notes || '—'}</span>
        )}
      </td>
    </tr>
  );
}

// ─── Cycle Detail View ────────────────────────────────────────────────────────

function CycleDetail({ cycleId, userRole, onBack }) {
  const [cycle, setCycle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showClose, setShowClose] = useState(false);
  const [showDiscrepancy, setShowDiscrepancy] = useState(false);

  const canClose = ['ADMIN', 'ASSET_MANAGER'].includes(userRole);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditAPI.getCycle(cycleId);
      setCycle(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load audit cycle.');
    } finally {
      setLoading(false);
    }
  }, [cycleId]);

  useEffect(() => { load(); }, [load]);

  const handleItemUpdated = (updatedItem) => {
    // Optimistically update the item in state and refresh progress
    setCycle((prev) => {
      if (!prev) return prev;
      const items = prev.items.map((it) => it.id === updatedItem.id ? updatedItem : it);
      // Recompute progress
      const total = items.length;
      const verified = items.filter((i) => i.result === 'VERIFIED').length;
      const discrepancy = items.filter((i) => i.result === 'MISSING' || i.result === 'DAMAGED').length;
      const pending = items.filter((i) => i.result === null).length;
      return {
        ...prev,
        items,
        progress: {
          totalItems: total,
          verifiedCount: verified,
          discrepancyCount: discrepancy,
          pendingCount: pending,
          progressPercent: total > 0 ? Math.round(((verified + discrepancy) / total) * 100) : 0,
        },
      };
    });
  };

  const handleClosed = (closedCycle) => {
    setCycle(closedCycle);
    setShowClose(false);
  };

  if (loading) {
    return (
      <div className={styles.detailWrap}>
        <button className={styles.backBtn} onClick={onBack}>
          <ChevronLeft size={16} /> Back to Cycles
        </button>
        <div className={styles.card}><Skeleton rows={6} /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.detailWrap}>
        <button className={styles.backBtn} onClick={onBack}>
          <ChevronLeft size={16} /> Back to Cycles
        </button>
        <div className={styles.inlineError}><AlertTriangle size={14} /> {error}</div>
      </div>
    );
  }

  const isClosed = cycle?.status === 'CLOSED';

  return (
    <div className={styles.detailWrap}>
      {/* Back nav */}
      <button className={styles.backBtn} onClick={onBack}>
        <ChevronLeft size={16} /> Back to Cycles
      </button>

      {/* Detail header */}
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.detailHeader}>
          <div className={styles.detailMeta}>
            <h2 className={styles.detailTitle}>{cycle?.name}</h2>
            <div className={styles.detailInfo}>
              <span>
                <CalendarDays size={14} />
                {fmtDate(cycle?.startDate)} – {fmtDate(cycle?.endDate)}
              </span>
              {cycle?.scopeDepartment && (
                <span>
                  <BarChart2 size={14} />
                  Dept: {cycle.scopeDepartment.name}
                </span>
              )}
              {cycle?.scopeLocation && (
                <span>
                  <MapPin size={14} />
                  {cycle.scopeLocation}
                </span>
              )}
              <span>
                <User size={14} />
                Created by {cycle?.createdBy?.name}
              </span>
            </div>

            {/* Auditors */}
            {cycle?.auditors?.length > 0 && (
              <div className={styles.auditorRow}>
                <span className={styles.auditorLabel}>Auditors:</span>
                <div className={styles.auditorPills}>
                  {cycle.auditors.map((a) => (
                    <span key={a.id} className={styles.auditorPill}>
                      <User size={11} /> {a.auditor?.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.detailActions}>
            <CycleStatusPill status={cycle?.status} />
            {canClose && !isClosed && (
              <Button
                onClick={() => setShowClose(true)}
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
              >
                <LockKeyhole size={15} /> Close Cycle
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <ProgressBar progress={cycle?.progress} />

        {/* Discrepancy banner */}
        <DiscrepancyBanner cycle={cycle} onView={() => setShowDiscrepancy(true)} />
      </motion.div>

      {/* Checklist table */}
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <ClipboardList size={16} /> Asset Checklist
          </h3>
          <span className={styles.itemCount}>
            {cycle?.items?.length ?? 0} assets
          </span>
        </div>

        {cycle?.items?.length === 0 ? (
          <div className={styles.emptyState}>
            <ClipboardList size={36} />
            <p>No assets found for this cycle's scope.</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Expected Location</th>
                  <th>Verification</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {cycle?.items?.map((item) => (
                  <AuditItemRow
                    key={item.id}
                    item={item}
                    isClosed={isClosed}
                    onUpdated={handleItemUpdated}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isClosed && (
          <div className={styles.closedNote}>
            <LockKeyhole size={14} />
            This audit cycle is closed. No further edits are permitted.
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showClose && (
          <CloseCycleModal
            cycle={cycle}
            onClose={() => setShowClose(false)}
            onClosed={handleClosed}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDiscrepancy && (
          <DiscrepancyModal
            cycleId={cycleId}
            onClose={() => setShowDiscrepancy(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Cycle List ───────────────────────────────────────────────────────────────

function CycleList({ onSelect, refreshKey }) {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditAPI.listCycles();
      setCycles(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load audit cycles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  if (loading) return <div className={styles.card}><Skeleton rows={5} /></div>;

  if (error) {
    return (
      <div className={styles.card}>
        <div className={styles.inlineError}><AlertTriangle size={14} /> {error}</div>
      </div>
    );
  }

  if (cycles.length === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.emptyState}>
          <ClipboardList size={40} />
          <p>No audit cycles yet.</p>
          <span>Create your first cycle using the button above.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.cycleGrid}>
      {cycles.map((c, i) => {
        const total = c._count?.items ?? 0;
        return (
          <motion.div
            key={c.id}
            className={styles.cycleCard}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onSelect(c.id)}
            whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
          >
            <div className={styles.cycleCardTop}>
              <div className={styles.cycleIcon}>
                <ClipboardList size={20} />
              </div>
              <CycleStatusPill status={c.status} />
            </div>

            <h4 className={styles.cycleName}>{c.name}</h4>

            <div className={styles.cycleMeta}>
              <span>
                <CalendarDays size={12} />
                {fmtDate(c.startDate)} – {fmtDate(c.endDate)}
              </span>
              {c.scopeDepartment && (
                <span>
                  <BarChart2 size={12} /> {c.scopeDepartment.name}
                </span>
              )}
              <span>
                <ClipboardList size={12} /> {total} asset{total !== 1 ? 's' : ''}
              </span>
              {c.auditors?.length > 0 && (
                <span>
                  <User size={12} /> {c.auditors.length} auditor{c.auditors.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className={styles.cycleFooter}>
              <span className={styles.cycleCreatedBy}>
                by {c.createdBy?.name ?? '—'}
              </span>
              <span className={styles.cycleDate}>{fmtDate(c.createdAt)}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Page Root ────────────────────────────────────────────────────────────────

export default function Audit() {
  const user = useAuthStore((s) => s.user);
  const canCreate = ['ADMIN', 'ASSET_MANAGER'].includes(user?.role);

  const [view, setView] = useState('list');   // 'list' | 'detail'
  const [activeCycleId, setActiveCycleId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const openDetail = (id) => {
    setActiveCycleId(id);
    setView('detail');
  };

  const backToList = () => {
    setActiveCycleId(null);
    setView('list');
    setRefreshKey((k) => k + 1);
  };

  const handleCreated = (cycle) => {
    setShowCreate(false);
    setRefreshKey((k) => k + 1);
    openDetail(cycle.id);
  };

  return (
    <div className={styles.page}>
      {/* Page header — only in list view */}
      <AnimatePresence mode="wait">
        {view === 'list' && (
          <motion.div
            key="header"
            className={styles.pageHeader}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div>
              <h2 className={styles.pageTitle}>Asset Audit</h2>
              <p className={styles.pageSubtitle}>
                Create structured audit cycles, verify assets, and track discrepancies.
              </p>
            </div>
            {canCreate && (
              <Button onClick={() => setShowCreate(true)}>
                <Plus size={16} /> New Audit Cycle
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Body */}
      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <CycleList onSelect={openDetail} refreshKey={refreshKey} />
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <CycleDetail
              cycleId={activeCycleId}
              userRole={user?.role}
              onBack={backToList}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateCycleModal
            onClose={() => setShowCreate(false)}
            onCreated={handleCreated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
