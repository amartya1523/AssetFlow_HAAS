import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowLeftRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  ImageIcon,
  Pencil,
  Plus,
  Search,
  SendHorizonal,
  SlidersHorizontal,
  UploadCloud,
} from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Select from '../components/Select';
import StatusPill from '../components/StatusPill';
import { assetAPI } from '../api/assets';
import { orgAPI } from '../api/organization';
import { allocationAPI } from '../api/allocation';
import useAuthStore from '../context/authStore';
import styles from './Assets.module.css';

const ASSET_STATUSES = [
  'AVAILABLE',
  'ALLOCATED',
  'RESERVED',
  'UNDER_MAINTENANCE',
  'LOST',
  'RETIRED',
  'DISPOSED',
];

const EMPTY_FORM = {
  name: '',
  categoryId: '',
  departmentId: '',
  serialNumber: '',
  acquisitionDate: '',
  acquisitionCost: '',
  condition: '',
  location: '',
  photoUrl: '',
  isBookable: false,
};

function formatStatus(status) {
  return status ? status.replace(/_/g, ' ') : 'Unknown';
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeDynamicFields(schema) {
  if (!schema) return [];
  if (Array.isArray(schema)) return schema;
  if (Array.isArray(schema.fields)) return schema.fields;
  if (schema.properties && typeof schema.properties === 'object') {
    return Object.entries(schema.properties).map(([key, config]) => ({
      key,
      name: key,
      label: config?.label || key,
      type: config?.type || 'text',
      required: Boolean(config?.required),
    }));
  }
  if (typeof schema === 'object') {
    return Object.entries(schema).map(([key, config]) => ({
      key,
      name: key,
      label: config?.label || key,
      type: config?.type || 'text',
      required: Boolean(config?.required),
    }));
  }
  return [];
}

function getDynamicFieldId(field) {
  return field.key || field.name || field.id || field.label;
}

function getDynamicFieldLabel(field) {
  return field.label || field.name || field.key || field.id || 'Field';
}

function SkeletonRows() {
  return (
    <div className={styles.tableCard}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Tag</th>
            <th>Name</th>
            <th>Category</th>
            <th>Status</th>
            <th>Location</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }).map((_, row) => (
            <tr key={row}>
              {Array.from({ length: 6 }).map((__, col) => (
                <td key={col}>
                  <span
                    className={styles.skeleton}
                    style={{ width: col === 1 ? '72%' : '54%' }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ onRegister }) {
  return (
    <motion.div
      className={styles.emptyState}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={styles.emptyIcon}>
        <UploadCloud size={28} />
      </div>
      <h3>No assets found</h3>
      <p>Register an asset or adjust the filters to widen the directory.</p>
      <Button onClick={onRegister}>
        <Plus size={16} />
        Register Asset
      </Button>
    </motion.div>
  );
}

function AssetModal({
  open,
  mode,
  form,
  formErrors,
  categories,
  departments,
  loading,
  selectedCategory,
  dynamicValues,
  onClose,
  onChange,
  onDynamicChange,
  onSubmit,
}) {
  const dynamicFields = normalizeDynamicFields(selectedCategory?.extraFieldsSchema);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Register Asset' : 'Edit Asset'}
      contentClassName={styles.assetModalCard}
      bodyClassName={styles.assetModalBody}
    >
      <form onSubmit={onSubmit} className={styles.assetForm} noValidate>
        <div className={styles.formGrid}>
          <Input
            id="asset-name"
            name="name"
            label="Asset Name"
            placeholder="e.g. Dell Latitude 7450"
            value={form.name}
            onChange={onChange}
            error={formErrors.name}
            appearance="surface"
          />

          <Select
            id="asset-category"
            name="categoryId"
            label="Category"
            value={form.categoryId}
            onChange={onChange}
            error={formErrors.categoryId}
            appearance="surface"
            options={[
              { value: '', label: 'Select category' },
              ...categories.map((category) => ({ value: category.id, label: category.name })),
            ]}
          />

          <Select
            id="asset-department"
            name="departmentId"
            label="Department"
            value={form.departmentId}
            onChange={onChange}
            appearance="surface"
            options={[
              { value: '', label: 'Unassigned' },
              ...departments.map((department) => ({
                value: department.id,
                label: `${department.name} (${department.code})`,
              })),
            ]}
          />

          <Input
            id="asset-serial"
            name="serialNumber"
            label="Serial Number"
            placeholder="e.g. SN-44892"
            value={form.serialNumber}
            onChange={onChange}
            appearance="surface"
          />

          <Input
            id="asset-location"
            name="location"
            label="Location"
            placeholder="e.g. IT Store - Shelf A"
            value={form.location}
            onChange={onChange}
            appearance="surface"
          />

          <Input
            id="asset-condition"
            name="condition"
            label="Condition"
            placeholder="e.g. Good"
            value={form.condition}
            onChange={onChange}
            appearance="surface"
          />

          <Input
            id="asset-date"
            name="acquisitionDate"
            type="date"
            label="Acquisition Date"
            value={form.acquisitionDate}
            onChange={onChange}
            appearance="surface"
          />

          <Input
            id="asset-cost"
            name="acquisitionCost"
            type="number"
            min="0"
            step="0.01"
            label="Acquisition Cost"
            placeholder="0.00"
            value={form.acquisitionCost}
            onChange={onChange}
            appearance="surface"
          />

          <label className={styles.checkboxField} htmlFor="asset-bookable">
            <input
              id="asset-bookable"
              name="isBookable"
              type="checkbox"
              checked={form.isBookable}
              onChange={onChange}
            />
            <span>Bookable resource</span>
          </label>
        </div>

        <div className={styles.photoBlock}>
          <div className={styles.photoPreview}>
            {form.photoUrl ? (
              <img src={form.photoUrl} alt="" />
            ) : (
              <ImageIcon size={28} />
            )}
          </div>
          <Input
            id="asset-photo"
            name="photoUrl"
            label="Photo URL"
            placeholder="https://example.com/asset-photo.jpg"
            value={form.photoUrl}
            onChange={onChange}
            error={formErrors.photoUrl}
            appearance="surface"
          />
        </div>

        {dynamicFields.length > 0 && (
          <div className={styles.dynamicBlock}>
            {dynamicFields.map((field) => {
              const id = getDynamicFieldId(field);
              return (
                <Input
                  key={id}
                  id={`dynamic-${id}`}
                  label={getDynamicFieldLabel(field)}
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={dynamicValues[id] || ''}
                  onChange={(e) => onDynamicChange(id, e.target.value)}
                  appearance="surface"
                />
              );
            })}
          </div>
        )}

        <div className={styles.formActions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {mode === 'create' ? 'Register Asset' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function TimelineItem({ item }) {
  const title = item.type?.replace(/_/g, ' ') || 'Activity';
  const action = item.data?.action?.replace(/_/g, ' ') || item.data?.status || item.data?.result || '';

  return (
    <motion.li
      className={styles.timelineItem}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <span className={styles.timelineDot} />
      <div>
        <div className={styles.timelineTop}>
          <strong>{title}</strong>
          <span>{formatDateTime(item.occurredAt)}</span>
        </div>
        {action && <p>{action}</p>}
      </div>
    </motion.li>
  );
}

export default function Assets() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    status: '',
    departmentId: '',
  });
  const [loading, setLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingAsset, setEditingAsset] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [dynamicValues, setDynamicValues] = useState({});
  const [saving, setSaving] = useState(false);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === form.categoryId),
    [categories, form.categoryId],
  );

  const loadAssets = useCallback(async (nextFilters = filters) => {
    setLoading(true);
    setApiError('');
    try {
      const params = Object.fromEntries(
        Object.entries(nextFilters).filter(([, value]) => value !== ''),
      );
      const res = await assetAPI.list(params);
      setAssets(res.data.data);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadMasterData = useCallback(async () => {
    setMetaLoading(true);
    try {
      const [categoryRes, departmentRes] = await Promise.allSettled([
        orgAPI.listCategories(),
        orgAPI.listDepartments(),
      ]);
      if (categoryRes.status === 'fulfilled') {
        setCategories(categoryRes.value.data.data.filter((category) => category.status === 'ACTIVE'));
      }
      if (departmentRes.status === 'fulfilled') {
        setDepartments(departmentRes.value.data.data.filter((department) => department.status === 'ACTIVE'));
      }
    } finally {
      setMetaLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      loadAssets(filters);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [filters, loadAssets]);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingAsset(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setDynamicValues({});
    setModalOpen(true);
  };

  const openEditModal = (asset) => {
    setModalMode('edit');
    setEditingAsset(asset);
    setForm({
      name: asset.name || '',
      categoryId: asset.categoryId || '',
      departmentId: asset.departmentId || '',
      serialNumber: asset.serialNumber || '',
      acquisitionDate: asset.acquisitionDate ? asset.acquisitionDate.slice(0, 10) : '',
      acquisitionCost: asset.acquisitionCost || '',
      condition: asset.condition || '',
      location: asset.location || '',
      photoUrl: asset.photoUrl || '',
      isBookable: Boolean(asset.isBookable),
    });
    setFormErrors({});
    setDynamicValues({});
    setModalOpen(true);
  };

  const onFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const onFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setFormErrors((current) => ({ ...current, [name]: undefined }));
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Asset name is required';
    if (!form.categoryId) errors.categoryId = 'Category is required';
    if (form.photoUrl && !/^https?:\/\/\S+$/i.test(form.photoUrl)) {
      errors.photoUrl = 'Enter a valid photo URL';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const toPayload = () => ({
    name: form.name.trim(),
    categoryId: form.categoryId,
    departmentId: form.departmentId || null,
    serialNumber: form.serialNumber.trim() || null,
    acquisitionDate: form.acquisitionDate || null,
    acquisitionCost: form.acquisitionCost || null,
    condition: form.condition.trim() || null,
    location: form.location.trim() || null,
    photoUrl: form.photoUrl.trim() || null,
    isBookable: form.isBookable,
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setApiError('');
    try {
      if (modalMode === 'create') {
        await assetAPI.create(toPayload());
      } else {
        await assetAPI.update(editingAsset.id, toPayload());
      }
      setModalOpen(false);
      await loadAssets(filters);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to save asset');
    } finally {
      setSaving(false);
    }
  };

  const activeFilters = [filters.categoryId, filters.status, filters.departmentId].filter(Boolean).length;

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.pageHeader}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2>Asset Directory</h2>
          <p>Register, inspect, and maintain the source of truth for assets.</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus size={16} />
          Register Asset
        </Button>
      </motion.div>

      <AnimatePresence>
        {apiError && (
          <motion.div
            className={styles.apiError}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <AlertCircle size={16} />
            <span>{apiError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <section className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <Search size={18} />
          <input
            name="search"
            value={filters.search}
            onChange={onFilterChange}
            placeholder="Search by tag, serial, or QR code"
          />
        </div>
        <Select
          id="filter-category"
          name="categoryId"
          value={filters.categoryId}
          onChange={onFilterChange}
          options={[
            { value: '', label: 'All categories' },
            ...categories.map((category) => ({ value: category.id, label: category.name })),
          ]}
        />
        <Select
          id="filter-status"
          name="status"
          value={filters.status}
          onChange={onFilterChange}
          options={[
            { value: '', label: 'All statuses' },
            ...ASSET_STATUSES.map((status) => ({ value: status, label: formatStatus(status) })),
          ]}
        />
        <Select
          id="filter-department"
          name="departmentId"
          value={filters.departmentId}
          onChange={onFilterChange}
          options={[
            { value: '', label: 'All departments' },
            ...departments.map((department) => ({ value: department.id, label: department.name })),
          ]}
        />
        <div className={styles.filterMeta}>
          <SlidersHorizontal size={16} />
          <span>{activeFilters} filters</span>
        </div>
      </section>

      {loading || metaLoading ? (
        <SkeletonRows />
      ) : assets.length === 0 ? (
        <EmptyState onRegister={openCreateModal} />
      ) : (
        <motion.div
          className={styles.tableCard}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tag</th>
                <th>Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Location</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td><span className={styles.tag}>{asset.assetTag}</span></td>
                  <td>
                    <button
                      className={styles.assetLink}
                      type="button"
                      onClick={() => navigate(`/assets/${asset.id}`)}
                    >
                      {asset.name}
                    </button>
                    <span className={styles.subText}>{asset.serialNumber || 'No serial number'}</span>
                  </td>
                  <td>{asset.category?.name || '-'}</td>
                  <td><StatusPill status={asset.status} /></td>
                  <td>{asset.location || '-'}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        title="View details"
                        onClick={() => navigate(`/assets/${asset.id}`)}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        title="Edit asset"
                        onClick={() => openEditModal(asset)}
                      >
                        <Pencil size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      <AssetModal
        open={modalOpen}
        mode={modalMode}
        form={form}
        formErrors={formErrors}
        categories={categories}
        departments={departments}
        loading={saving}
        selectedCategory={selectedCategory}
        dynamicValues={dynamicValues}
        onClose={() => setModalOpen(false)}
        onChange={onFormChange}
        onDynamicChange={(key, value) =>
          setDynamicValues((current) => ({ ...current, [key]: value }))}
        onSubmit={onSubmit}
      />
    </div>
  );
}

export function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const [asset, setAsset] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [activeAllocation, setActiveAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  // Transfer form state
  const [transferReason, setTransferReason] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [transferError, setTransferError] = useState('');

  const loadData = useCallback(async (isCancelled) => {
    try {
      const res = await assetAPI.history(id);
      if (!isCancelled()) {
        const data = res.data.data;
        setAsset(data.asset);
        const activeAlloc = data.allocations?.find((a) => a.status === 'ACTIVE');
        setActiveAllocation(activeAlloc || null);
        setTimeline(
          [...(data.timeline || [])].sort(
            (a, b) => new Date(b.occurredAt) - new Date(a.occurredAt),
          ),
        );
      }
    } catch (err) {
      if (!isCancelled()) {
        setApiError(err.response?.data?.message || 'Failed to load asset detail');
      }
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setApiError('');
    loadData(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const onTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferReason.trim() || transferReason.trim().length < 5) {
      setTransferError('Reason must be at least 5 characters.');
      return;
    }
    setTransferLoading(true);
    setTransferError('');
    try {
      await allocationAPI.requestTransfer({
        assetId: asset.id,
        fromUserId: activeAllocation?.allocatedToUser?.id,
        toUserId: currentUser?.id,
        reason: transferReason.trim(),
      });
      setTransferSuccess(true);
      setTransferReason('');
      loadData(() => false);
    } catch (err) {
      setTransferError(err.response?.data?.message || 'Failed to submit transfer request.');
    } finally {
      setTransferLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <SkeletonRows />
      </div>
    );
  }

  if (apiError || !asset) {
    return (
      <div className={styles.page}>
        <div className={styles.apiError}>
          <AlertCircle size={16} />
          <span>{apiError || 'Asset not found'}</span>
        </div>
        <Button variant="secondary" onClick={() => navigate('/assets')}>
          <ArrowLeft size={16} />
          Back to Assets
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.detailHeader}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate('/assets')}
        >
          <ArrowLeft size={17} />
          Assets
        </button>
        <div className={styles.detailTitleRow}>
          <div>
            <span className={styles.tag}>{asset.assetTag}</span>
            <h2>{asset.name}</h2>
          </div>
          <StatusPill status={asset.status} />
        </div>
      </motion.div>

      <div className={styles.detailGrid}>
        <motion.section
          className={styles.detailPanel}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.heroPhoto}>
            {asset.photoUrl ? (
              <img src={asset.photoUrl} alt="" />
            ) : (
              <ImageIcon size={34} />
            )}
          </div>
          <div className={styles.detailFields}>
            <div>
              <span>Category</span>
              <strong>{asset.category?.name || '-'}</strong>
            </div>
            <div>
              <span>Department</span>
              <strong>{asset.department?.name || '-'}</strong>
            </div>
            <div>
              <span>Serial Number</span>
              <strong>{asset.serialNumber || '-'}</strong>
            </div>
            <div>
              <span>Location</span>
              <strong>{asset.location || '-'}</strong>
            </div>
            <div>
              <span>Condition</span>
              <strong>{asset.condition || '-'}</strong>
            </div>
            <div>
              <span>Bookable</span>
              <strong>{asset.isBookable ? 'Yes' : 'No'}</strong>
            </div>
            <div>
              <span>Acquired</span>
              <strong>{formatDate(asset.acquisitionDate)}</strong>
            </div>
            <div>
              <span>Created</span>
              <strong>{formatDate(asset.createdAt)}</strong>
            </div>
          </div>
          {asset.status === 'ALLOCATED' && activeAllocation && activeAllocation.allocatedToUser?.id !== currentUser?.id && (
            <div className={styles.transferSection}>
              {!transferSuccess ? (
                <form onSubmit={onTransferSubmit} className={styles.transferForm}>
                  <h4 className={styles.transferTitle}>
                    <ArrowLeftRight size={15} /> Request Asset Transfer
                  </h4>
                  <p className={styles.transferDesc}>
                    This asset is currently allocated to <strong>{activeAllocation.allocatedToUser.name}</strong>.
                    Submit a transfer request to the admin to acquire it.
                  </p>
                  <div className={styles.transferFormField}>
                    <label className={styles.transferLabel} htmlFor="tf-reason">Reason</label>
                    <textarea
                      id="tf-reason"
                      name="reason"
                      className={styles.transferTextarea}
                      placeholder="Explain why this transfer is needed (min 5 chars)"
                      rows={3}
                      value={transferReason}
                      onChange={(e) => {
                        setTransferReason(e.target.value);
                        setTransferError('');
                      }}
                      required
                    />
                  </div>
                  {transferError && (
                    <p className={styles.transferInlineError}>{transferError}</p>
                  )}
                  <Button type="submit" loading={transferLoading}>
                    <SendHorizonal size={15} />
                    Send Transfer Request
                  </Button>
                </form>
              ) : (
                <div className={styles.transferSuccessBanner}>
                  <CheckCircle2 size={18} />
                  <span>Transfer request submitted successfully. Awaiting approval.</span>
                </div>
              )}
            </div>
          )}
        </motion.section>

        <motion.section
          className={styles.timelinePanel}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className={styles.timelineHeader}>
            <Clock3 size={18} />
            <h3>History Timeline</h3>
          </div>
          {timeline.length === 0 ? (
            <div className={styles.timelineEmpty}>
              <CalendarDays size={22} />
              <p>No lifecycle events recorded yet.</p>
            </div>
          ) : (
            <ol className={styles.timeline}>
              {timeline.map((item, index) => (
                <TimelineItem
                  key={`${item.type}-${item.data?.id || item.occurredAt}-${index}`}
                  item={item}
                />
              ))}
            </ol>
          )}
        </motion.section>
      </div>
    </div>
  );
}
