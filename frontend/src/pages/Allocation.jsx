import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowLeftRight,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  User,
  Loader2,
  XCircle,
  PackageCheck,
  SendHorizonal,
} from 'lucide-react';
import { allocationAPI } from '../api/allocation';
import useAuthStore from '../context/authStore';
import Button from '../components/Button';
import styles from './Allocation.module.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

const STATUS_META = {
  ACTIVE: { label: 'Active', cls: 'pillActive' },
  RETURNED: { label: 'Returned', cls: 'pillReturned' },
  OVERDUE: { label: 'Overdue', cls: 'pillOverdue' },
  REQUESTED: { label: 'Pending', cls: 'pillPending' },
  APPROVED: { label: 'Approved', cls: 'pillApproved' },
  REJECTED: { label: 'Rejected', cls: 'pillRejected' },
  COMPLETED: { label: 'Completed', cls: 'pillApproved' },
};

function StatusPill({ status }) {
  const meta = STATUS_META[status] || { label: status, cls: 'pillReturned' };
  return <span className={`${styles.pill} ${styles[meta.cls]}`}>{meta.label}</span>;
}

function SectionHeader({ title, children }) {
  return (
    <div className={styles.sectionHeader}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {children}
    </div>
  );
}

function FieldGroup({ label, value }) {
  return (
    <div className={styles.fieldGroup}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{value || '—'}</span>
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function Skeleton({ rows = 3 }) {
  return (
    <div className={styles.skeletonWrap}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.skeletonRow} style={{ width: `${85 - i * 8}%` }} />
      ))}
    </div>
  );
}

// ─── Allocate Form ───────────────────────────────────────────────────────────

function AllocateForm({ onSuccess }) {
  const [form, setForm] = useState({
    assetId: '',
    allocatedToUserId: '',
    expectedReturnDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(null);

  // Transfer sub-form (shown on 409 conflict)
  const [transfer, setTransfer] = useState({ fromUserId: '', toUserId: '', reason: '' });
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
    setConflict(null);
    setTransferSuccess(false);
  };

  const onTransferChange = (e) =>
    setTransfer((t) => ({ ...t, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.assetId.trim()) { setError('Asset ID is required.'); return; }
    setLoading(true);
    setConflict(null);
    setError('');
    try {
      const res = await allocationAPI.create({
        assetId: form.assetId.trim(),
        allocatedToUserId: form.allocatedToUserId.trim() || undefined,
        expectedReturnDate: form.expectedReturnDate || undefined,
      });
      onSuccess(res.data.data);
      setForm({ assetId: '', allocatedToUserId: '', expectedReturnDate: '' });
    } catch (err) {
      const status = err.response?.status;
      const body = err.response?.data;
      if (status === 409) {
        const conflictData = body?.errors?.[0]?.conflict;
        setConflict(conflictData || {});
        // Pre-fill the transfer form
        if (conflictData?.allocatedTo?.id) {
          setTransfer((t) => ({
            ...t,
            fromUserId: conflictData.allocatedTo.id,
          }));
        }
      } else {
        setError(body?.message || 'Failed to create allocation.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transfer.reason.trim() || transfer.reason.trim().length < 5) {
      setError('Reason must be at least 5 characters.');
      return;
    }
    setTransferLoading(true);
    setError('');
    try {
      await allocationAPI.requestTransfer({
        assetId: form.assetId.trim(),
        fromUserId: transfer.fromUserId,
        toUserId: transfer.toUserId.trim(),
        reason: transfer.reason.trim(),
      });
      setTransferSuccess(true);
      setConflict(null);
      setTransfer({ fromUserId: '', toUserId: '', reason: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit transfer request.');
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <SectionHeader title="Allocate Asset" />

      <form onSubmit={onSubmit} className={styles.formGrid} noValidate>
        <div className={styles.formField}>
          <label className={styles.label} htmlFor="alloc-assetId">Asset ID</label>
          <input
            id="alloc-assetId"
            name="assetId"
            className={styles.input}
            placeholder="e.g. asset-uuid"
            value={form.assetId}
            onChange={onChange}
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.label} htmlFor="alloc-userId">Allocate To (User ID)</label>
          <input
            id="alloc-userId"
            name="allocatedToUserId"
            className={styles.input}
            placeholder="User ID (optional)"
            value={form.allocatedToUserId}
            onChange={onChange}
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.label} htmlFor="alloc-dueDate">Expected Return Date</label>
          <input
            id="alloc-dueDate"
            name="expectedReturnDate"
            type="date"
            className={styles.input}
            value={form.expectedReturnDate}
            onChange={onChange}
          />
        </div>

        <div className={styles.formActions}>
          <Button type="submit" loading={loading}>
            <PackageCheck size={16} />
            Allocate Asset
          </Button>
        </div>
      </form>

      {/* Generic error */}
      <AnimatePresence>
        {error && !conflict && (
          <motion.div
            className={styles.errorBanner}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <XCircle size={16} />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 409 Conflict Banner + Transfer sub-form */}
      <AnimatePresence>
        {conflict && (
          <motion.div
            className={styles.conflictBlock}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          >
            <div className={styles.conflictBanner}>
              <AlertTriangle size={18} className={styles.conflictIcon} />
              <div>
                <p className={styles.conflictMsg}>
                  Already allocated to{' '}
                  <strong>{conflict.allocatedTo?.name || 'Unknown'}</strong>
                  {conflict.allocatedTo?.department?.name
                    ? ` (${conflict.allocatedTo.department.name})`
                    : conflict.allocatedToDepartment?.name
                    ? ` (${conflict.allocatedToDepartment.name})`
                    : ''}.{' '}
                  Direct re-allocation is blocked — submit a transfer request below.
                </p>
                <div className={styles.conflictMeta}>
                  <Clock size={13} />
                  <span>Allocated since {fmtDateTime(conflict.since)}</span>
                  {conflict.expectedReturnDate && (
                    <>
                      <span className={styles.dot}>·</span>
                      <span>Due {fmtDate(conflict.expectedReturnDate)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Transfer sub-form */}
            {!transferSuccess ? (
              <form onSubmit={onTransferSubmit} className={styles.transferSubForm}>
                <h4 className={styles.transferTitle}>
                  <ArrowLeftRight size={15} /> Submit Transfer Request
                </h4>
                <div className={styles.transferGrid}>
                  <div className={styles.formField}>
                    <label className={styles.label} htmlFor="tf-from">From (User ID)</label>
                    <input
                      id="tf-from"
                      name="fromUserId"
                      className={styles.input}
                      placeholder="Current holder's user ID"
                      value={transfer.fromUserId}
                      onChange={onTransferChange}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.label} htmlFor="tf-to">To (User ID)</label>
                    <input
                      id="tf-to"
                      name="toUserId"
                      className={styles.input}
                      placeholder="New holder's user ID"
                      value={transfer.toUserId}
                      onChange={onTransferChange}
                    />
                  </div>
                  <div className={`${styles.formField} ${styles.fullSpan}`}>
                    <label className={styles.label} htmlFor="tf-reason">Reason</label>
                    <textarea
                      id="tf-reason"
                      name="reason"
                      className={`${styles.input} ${styles.textarea}`}
                      placeholder="Explain why this transfer is needed (min 5 chars)"
                      rows={3}
                      value={transfer.reason}
                      onChange={onTransferChange}
                    />
                  </div>
                </div>
                {error && (
                  <p className={styles.inlineError}>{error}</p>
                )}
                <Button type="submit" loading={transferLoading}>
                  <SendHorizonal size={15} />
                  Send Transfer Request
                </Button>
              </form>
            ) : (
              <motion.div
                className={styles.transferSuccessBanner}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <CheckCircle2 size={18} />
                <span>Transfer request submitted successfully. Awaiting approval.</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Allocation History Table ─────────────────────────────────────────────────

function AllocationHistory({ refresh }) {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [returnId, setReturnId] = useState(null);
  const [returnNote, setReturnNote] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnError, setReturnError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await allocationAPI.list();
      setAllocations(res.data.data || []);
    } catch {
      setAllocations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refresh]);

  const toggleRow = (id) =>
    setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const onReturn = async (id) => {
    setReturnLoading(true);
    setReturnError('');
    try {
      await allocationAPI.returnAsset(id, { conditionNoteOnReturn: returnNote.trim() || undefined });
      setReturnId(null);
      setReturnNote('');
      load();
    } catch (err) {
      setReturnError(err.response?.data?.message || 'Return failed.');
    } finally {
      setReturnLoading(false);
    }
  };

  if (loading) return <div className={styles.card}><SectionHeader title="Allocation History" /><Skeleton rows={4} /></div>;
  if (allocations.length === 0)
    return (
      <div className={styles.card}>
        <SectionHeader title="Allocation History" />
        <div className={styles.emptyState}>
          <User size={32} />
          <p>No allocations yet. Create one above.</p>
        </div>
      </div>
    );

  return (
    <div className={styles.card}>
      <SectionHeader title="Allocation History" />
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Allocated To</th>
              <th>Since</th>
              <th>Due</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {allocations.map((a) => (
              <>
                <tr key={a.id} className={styles.tableRow} onClick={() => toggleRow(a.id)}>
                  <td>
                    <span className={styles.assetTag}>{a.asset?.assetTag}</span>
                    <span className={styles.assetName}>{a.asset?.name}</span>
                  </td>
                  <td>{a.allocatedToUser?.name || a.allocatedToDepartment?.name || '—'}</td>
                  <td>{fmtDate(a.allocatedAt)}</td>
                  <td className={a.isOverdue ? styles.overdueText : ''}>
                    {fmtDate(a.expectedReturnDate)}
                    {a.isOverdue && <span className={styles.overdueChip}>Overdue</span>}
                  </td>
                  <td><StatusPill status={a.isOverdue ? 'OVERDUE' : a.status} /></td>
                  <td className={styles.expandCell}>
                    {expanded[a.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </td>
                </tr>

                <AnimatePresence>
                  {expanded[a.id] && (
                    <tr key={`${a.id}-expand`}>
                      <td colSpan={6} style={{ padding: 0 }}>
                        <motion.div
                          className={styles.expandPanel}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className={styles.expandGrid}>
                            <FieldGroup label="Allocation ID" value={a.id} />
                            <FieldGroup label="Email" value={a.allocatedToUser?.email} />
                            <FieldGroup label="Returned At" value={fmtDateTime(a.actualReturnDate)} />
                            <FieldGroup label="Condition Note" value={a.conditionNoteOnReturn} />
                          </div>

                          {a.status === 'ACTIVE' && (
                            <div className={styles.returnSection}>
                              {returnId === a.id ? (
                                <div className={styles.returnForm}>
                                  <textarea
                                    className={`${styles.input} ${styles.textarea}`}
                                    placeholder="Condition notes on return (optional)"
                                    value={returnNote}
                                    onChange={(e) => setReturnNote(e.target.value)}
                                    rows={2}
                                  />
                                  {returnError && <p className={styles.inlineError}>{returnError}</p>}
                                  <div className={styles.returnActions}>
                                    <Button
                                      variant="secondary"
                                      onClick={() => { setReturnId(null); setReturnNote(''); setReturnError(''); }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      loading={returnLoading}
                                      onClick={() => onReturn(a.id)}
                                    >
                                      <RotateCcw size={15} /> Confirm Return
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  variant="secondary"
                                  onClick={(e) => { e.stopPropagation(); setReturnId(a.id); }}
                                >
                                  <RotateCcw size={15} /> Return Asset
                                </Button>
                              )}
                            </div>
                          )}
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Transfer Approval Panel ─────────────────────────────────────────────────

function TransferPanel({ userRole, refresh }) {
  const canApprove = ['ASSET_MANAGER', 'ADMIN', 'DEPARTMENT_HEAD'].includes(userRole);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null); // id being approved/rejected
  const [actionType, setActionType] = useState(''); // 'approve' | 'reject'
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await allocationAPI.listTransfers();
      setTransfers(res.data.data || []);
    } catch {
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refresh]);

  const onAction = async (id, type) => {
    setActionId(id);
    setActionType(type);
    setError('');
    try {
      if (type === 'approve') await allocationAPI.approve(id);
      else await allocationAPI.reject(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${type} transfer.`);
    } finally {
      setActionId(null);
      setActionType('');
    }
  };

  if (loading) return <div className={styles.card}><SectionHeader title="Transfer Requests" /><Skeleton rows={3} /></div>;
  if (transfers.length === 0)
    return (
      <div className={styles.card}>
        <SectionHeader title="Transfer Requests" />
        <div className={styles.emptyState}>
          <ArrowLeftRight size={32} />
          <p>No transfer requests found.</p>
        </div>
      </div>
    );

  return (
    <div className={styles.card}>
      <SectionHeader title="Transfer Requests" />
      {error && (
        <div className={styles.errorBanner} style={{ marginBottom: 'var(--space-md)' }}>
          <XCircle size={16} /> <span>{error}</span>
        </div>
      )}
      <div className={styles.transferList}>
        {transfers.map((t) => (
          <motion.div
            key={t.id}
            className={styles.transferCard}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={styles.transferCardHeader}>
              <div className={styles.transferAsset}>
                <span className={styles.assetTag}>{t.asset?.assetTag}</span>
                <span className={styles.assetName}>{t.asset?.name}</span>
              </div>
              <StatusPill status={t.status} />
            </div>

            <div className={styles.transferMeta}>
              <div className={styles.transferFlow}>
                <span className={styles.transferUser}>
                  <User size={13} /> {t.fromUser?.name || '—'}
                </span>
                <ArrowLeftRight size={14} className={styles.transferArrow} />
                <span className={styles.transferUser}>
                  <User size={13} /> {t.toUser?.name || '—'}
                </span>
              </div>
              <span className={styles.transferDate}>{fmtDateTime(t.requestedAt)}</span>
            </div>

            <p className={styles.transferReason}>
              <strong>Reason:</strong> {t.reason}
            </p>

            {canApprove && t.status === 'REQUESTED' && (
              <div className={styles.transferActions}>
                <Button
                  variant="secondary"
                  loading={actionId === t.id && actionType === 'reject'}
                  disabled={!!actionId}
                  onClick={() => onAction(t.id, 'reject')}
                >
                  Reject
                </Button>
                <Button
                  loading={actionId === t.id && actionType === 'approve'}
                  disabled={!!actionId}
                  onClick={() => onAction(t.id, 'approve')}
                >
                  <CheckCircle2 size={15} /> Approve
                </Button>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Page root ────────────────────────────────────────────────────────────────

export default function Allocation() {
  const user = useAuthStore((s) => s.user);
  const [refreshKey, setRefreshKey] = useState(0);

  const onAllocateSuccess = () => setRefreshKey((k) => k + 1);

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.pageHeader}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className={styles.pageTitle}>Allocation &amp; Transfer</h2>
          <p className={styles.pageSubtitle}>
            Allocate assets to employees, manage transfers, and track returns.
          </p>
        </div>
      </motion.div>

      <div className={styles.layout}>
        <div className={styles.leftCol}>
          <AllocateForm onSuccess={onAllocateSuccess} />
          <AllocationHistory refresh={refreshKey} />
        </div>
        <div className={styles.rightCol}>
          <TransferPanel userRole={user?.role} refresh={refreshKey} />
        </div>
      </div>
    </div>
  );
}
