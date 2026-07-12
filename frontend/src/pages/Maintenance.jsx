import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Info, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { maintenanceAPI } from '../api/maintenance';
import useAuthStore from '../context/authStore';
import Button from '../components/Button';
import styles from './Maintenance.module.css';

// ─── Columns Definition ──────────────────────────────────────────────────────

const COLUMNS = [
  { id: 'PENDING', label: 'Pending' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'TECHNICIAN_ASSIGNED', label: 'Technician Assigned' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'RESOLVED', label: 'Resolved' },
];

const PRIORITY_LABELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function MaintenancePage() {
  const user = useAuthStore((s) => s.user);
  const isAdminOrManager = ['ADMIN', 'ASSET_MANAGER'].includes(user?.role);
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showForm, setShowForm] = useState(false);
  const [actionModal, setActionModal] = useState(null); // { req: Object, type: 'APPROVE' | 'ASSIGN' | 'START' | 'RESOLVE' }
  const [techName, setTechName] = useState('');
  
  // Create Form State
  const [form, setForm] = useState({
    assetId: '',
    issueDescription: '',
    priority: 'MEDIUM',
    photoUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await maintenanceAPI.list();
      setRequests(res.data.data || []);
    } catch (err) {
      // Fallback for UI demonstration if DB isn't running
      setRequests([
        {
          id: 'req-1',
          assetId: 'asset-1',
          asset: { assetTag: 'RM-B2', name: 'Room B2' },
          issueDescription: 'Projector mount is loose',
          priority: 'HIGH',
          status: 'PENDING',
        },
        {
          id: 'req-2',
          assetId: 'asset-2',
          asset: { assetTag: 'VEH-01', name: 'Delivery Van' },
          issueDescription: 'Check engine light on',
          priority: 'CRITICAL',
          status: 'IN_PROGRESS',
          technicianName: 'Mike Mechanic'
        },
        {
          id: 'req-3',
          assetId: 'asset-3',
          asset: { assetTag: 'LAP-05', name: 'ThinkPad' },
          issueDescription: 'Battery dies quickly',
          priority: 'LOW',
          status: 'RESOLVED',
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const onCreateSubmit = async (e) => {
    e.preventDefault();
    if (!form.assetId.trim() || !form.issueDescription.trim()) {
      setError('Asset ID and Issue Description are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await maintenanceAPI.create(form);
      setShowForm(false);
      setForm({ assetId: '', issueDescription: '', priority: 'MEDIUM', photoUrl: '' });
      loadRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async () => {
    if (!actionModal) return;
    const { req, type } = actionModal;
    setSubmitting(true);
    setError('');
    
    try {
      if (type === 'APPROVE') {
        await maintenanceAPI.approve(req.id);
      } else if (type === 'ASSIGN') {
        if (!techName.trim()) { setError('Technician name is required'); setSubmitting(false); return; }
        await maintenanceAPI.assignTechnician(req.id, { technicianName: techName });
      } else if (type === 'START') {
        await maintenanceAPI.start(req.id);
      } else if (type === 'RESOLVE') {
        await maintenanceAPI.resolve(req.id);
      }
      setActionModal(null);
      setTechName('');
      
      // Update local state smoothly for animation, then refetch
      setRequests((prev) => 
        prev.map(r => {
          if (r.id !== req.id) return r;
          let newStatus = r.status;
          if (type === 'APPROVE') newStatus = 'APPROVED';
          if (type === 'ASSIGN') newStatus = 'TECHNICIAN_ASSIGNED';
          if (type === 'START') newStatus = 'IN_PROGRESS';
          if (type === 'RESOLVE') newStatus = 'RESOLVED';
          return { ...r, status: newStatus, technicianName: type === 'ASSIGN' ? techName : r.technicianName };
        })
      );
      // Background reload
      maintenanceAPI.list().then(res => setRequests(res.data.data)).catch(()=>{});
      
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${type.toLowerCase()}`);
    } finally {
      setSubmitting(false);
    }
  };

  const onCardClick = (req) => {
    // Only admins/managers can transition statuses (except maybe resolve, but let's restrict to managers for prototype simplicity)
    if (!isAdminOrManager) return;
    
    if (req.status === 'PENDING') setActionModal({ req, type: 'APPROVE' });
    else if (req.status === 'APPROVED') {
      setTechName('');
      setActionModal({ req, type: 'ASSIGN' });
    }
    else if (req.status === 'TECHNICIAN_ASSIGNED') setActionModal({ req, type: 'START' });
    else if (req.status === 'IN_PROGRESS') setActionModal({ req, type: 'RESOLVE' });
  };

  // ─── Renderers ─────────────────────────────────────────────────────────────

  const renderCard = (req) => {
    const isResolved = req.status === 'RESOLVED';
    return (
      <motion.div
        layout
        key={req.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`${styles.card} ${isResolved ? styles.cardResolved : ''}`}
        onClick={() => onCardClick(req)}
        title={isAdminOrManager && !isResolved ? 'Click to advance workflow' : ''}
      >
        <div className={styles.cardHeader}>
          <span className={styles.assetTag}>{req.asset?.assetTag || req.assetId}</span>
          <span className={`${styles.priorityBadge} ${styles[`priority-${req.priority}`]}`}>
            {PRIORITY_LABELS[req.priority]}
          </span>
        </div>
        
        <p className={styles.issueDesc}>{req.issueDescription}</p>
        
        {req.technicianName && (
          <div className={styles.cardMeta}>
            <span>Tech: {req.technicianName}</span>
            {isResolved && <CheckCircle2 size={14} />}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Maintenance Workflow</h2>
        <p className={styles.subtitle}>Track and manage asset maintenance lifecycles across your organization.</p>
      </div>

      <div className={styles.controls}>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={16} /> Raise Request
        </Button>
      </div>

      <div className={styles.persistentFooter}>
        <Info size={16} />
        <span>
          <strong>Workflow rule:</strong> Approving a card moves the asset to <em>Under Maintenance</em>; resolving returns it to <em>Available</em>.
        </span>
      </div>

      <div className={styles.kanbanBoard}>
        {COLUMNS.map((col) => {
          const columnReqs = requests.filter(r => r.status === col.id);
          return (
            <div key={col.id} className={styles.column}>
              <div className={styles.columnHeader}>
                <span className={styles.columnTitle}>{col.label}</span>
                <span className={styles.columnCount}>{columnReqs.length}</span>
              </div>
              <div className={styles.columnBody}>
                <AnimatePresence>
                  {columnReqs.map(renderCard)}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Create Form Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className={styles.modalContent} initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className={styles.modalTitle}>Raise Maintenance Request</h3>
              </div>
              
              <form onSubmit={onCreateSubmit} className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label}>Asset ID</label>
                  <input className={styles.input} value={form.assetId} onChange={e => setForm({...form, assetId: e.target.value})} placeholder="e.g. room-b2-uuid" />
                </div>
                
                <div className={styles.formField}>
                  <label className={styles.label}>Priority</label>
                  <select className={styles.select} value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                    {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Issue Description</label>
                  <textarea className={styles.textarea} value={form.issueDescription} onChange={e => setForm({...form, issueDescription: e.target.value})} placeholder="Describe the issue in detail" />
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Photo URL (Optional)</label>
                  <input className={styles.input} value={form.photoUrl} onChange={e => setForm({...form, photoUrl: e.target.value})} placeholder="https://..." />
                </div>

                {error && <div className={styles.errorBanner}>{error}</div>}

                <div className={styles.modalActions}>
                  <Button variant="secondary" onClick={() => setShowForm(false)} type="button">Cancel</Button>
                  <Button type="submit" loading={submitting}>Submit Request</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Action Modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {actionModal && (
          <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className={styles.modalContent} initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}>
              <h3 className={styles.modalTitle}>
                {actionModal.type === 'APPROVE' && 'Approve Request'}
                {actionModal.type === 'ASSIGN' && 'Assign Technician'}
                {actionModal.type === 'START' && 'Start Maintenance'}
                {actionModal.type === 'RESOLVE' && 'Resolve Maintenance'}
              </h3>
              
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>
                <p>Asset: <strong>{actionModal.req.asset?.assetTag || actionModal.req.assetId}</strong></p>
                <p>Issue: {actionModal.req.issueDescription}</p>
              </div>

              {actionModal.type === 'APPROVE' && (
                <p className={styles.errorBanner} style={{ background: 'var(--color-info-bg)', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                  <AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Approving this will change the asset status to <strong>UNDER_MAINTENANCE</strong>.
                </p>
              )}

              {actionModal.type === 'ASSIGN' && (
                <div className={styles.formField} style={{ marginTop: '8px' }}>
                  <label className={styles.label}>Technician Name</label>
                  <input className={styles.input} value={techName} onChange={e => setTechName(e.target.value)} placeholder="e.g. Bob Smith" autoFocus />
                </div>
              )}

              {actionModal.type === 'RESOLVE' && (
                <p className={styles.errorBanner} style={{ background: 'var(--color-success-bg)', color: '#065f46', border: '1px solid #a7f3d0' }}>
                  <CheckCircle2 size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Resolving this will return the asset status to <strong>AVAILABLE</strong>.
                </p>
              )}

              {error && <div className={styles.errorBanner}>{error}</div>}

              <div className={styles.modalActions}>
                <Button variant="secondary" onClick={() => { setActionModal(null); setError(''); }}>Cancel</Button>
                <Button onClick={handleAction} loading={submitting}>
                  Confirm <ArrowRight size={14} />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
