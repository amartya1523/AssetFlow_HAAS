import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import StatusPill from '../components/StatusPill';
import { orgAPI } from '../api/organization';
import styles from './Organization.module.css';

const TABS = ['Departments', 'Categories', 'Employee'];
const ROLES = ['EMPLOYEE', 'DEPARTMENT_HEAD', 'ASSET_MANAGER', 'ADMIN'];

// ─── Skeleton rows for loading state ───────────────────────────────────────

function SkeletonTable({ rows = 4, cols = 4 }) {
  return (
    <div className={styles.tableCard}>
      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              {Array.from({ length: cols }, (_, i) => (
                <th key={i} style={{ width: `${100 / cols}%` }}>
                  <div className={styles.skeleton} style={{ width: '60px' }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, ri) => (
              <tr key={ri} className={styles.skeletonRow}>
                {Array.from({ length: cols }, (_, ci) => (
                  <td key={ci}>
                    <div className={styles.skeleton} style={{ width: ci === 0 ? '40%' : '60%' }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────

export default function Organization() {
  const [activeTab, setActiveTab] = useState('Departments');
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  // Data stores per tab
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingItem, setEditingItem] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form fields
  const [form, setForm] = useState({});
  const [formErrors, setFormErrors] = useState({});

  const tabContentRef = useRef(null);

  // ─── Data fetching ────────────────────────────────────────────────────

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await orgAPI.listDepartments();
      setDepartments(res.data.data);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to load departments');
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await orgAPI.listCategories();
      setCategories(res.data.data);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to load categories');
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await orgAPI.listEmployees();
      setEmployees(res.data.data);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to load employees');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setApiError('');

    (async () => {
      try {
        if (activeTab === 'Departments') await fetchDepartments();
        else if (activeTab === 'Categories') await fetchCategories();
        else await fetchEmployees();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [activeTab, fetchDepartments, fetchCategories, fetchEmployees]);

  // ─── Modal open helpers ────────────────────────────────────────────────

  const ensureDepartmentPickerData = async () => {
    const requests = [];
    if (employees.length === 0) requests.push(fetchEmployees());
    if (departments.length === 0) requests.push(fetchDepartments());
    if (requests.length > 0) await Promise.all(requests);
  };

  const openCreateModal = async () => {
    setModalMode('create');
    setEditingItem(null);
    setForm({});
    setFormErrors({});
    if (activeTab === 'Departments') await ensureDepartmentPickerData();
    setModalOpen(true);
  };

  const openEditModal = async (item, tabKey) => {
    setModalMode('edit');
    setEditingItem(item);
    if (tabKey === 'department') {
      setForm({ name: item.name, code: item.code, status: item.status, headId: item.headId || '', parentDepartmentId: item.parentDepartmentId || '' });
      await ensureDepartmentPickerData();
    } else {
      setForm({ name: item.name, status: item.status });
    }
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormErrors({});
  };

  // ─── Form change handler ─────────────────────────────────────────────

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setFormErrors((fe) => ({ ...fe, [name]: undefined }));
  };

  // ─── Validate ─────────────────────────────────────────────────────────

  const validateDepartmentForm = () => {
    const errors = {};
    if (!form.name?.trim()) errors.name = 'Name is required';
    if (!form.code?.trim()) errors.code = 'Code is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateCategoryForm = () => {
    const errors = {};
    if (!form.name?.trim()) errors.name = 'Name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ─── Submit handlers ─────────────────────────────────────────────────

  const handleDepartmentSubmit = async (e) => {
    e.preventDefault();
    if (!validateDepartmentForm()) return;
    setModalLoading(true);
    setApiError('');
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        status: form.status || 'ACTIVE',
        ...(form.headId ? { headId: form.headId } : {}),
        ...(form.parentDepartmentId ? { parentDepartmentId: form.parentDepartmentId } : {}),
      };

      if (modalMode === 'create') {
        await orgAPI.createDepartment(payload);
      } else {
        await orgAPI.updateDepartment(editingItem.id, payload);
      }
      closeModal();
      await fetchDepartments();
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to save department');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!validateCategoryForm()) return;
    setModalLoading(true);
    setApiError('');
    try {
      const payload = { name: form.name.trim(), status: form.status || 'ACTIVE' };

      if (modalMode === 'create') {
        await orgAPI.createCategory(payload);
      } else {
        await orgAPI.updateCategory(editingItem.id, payload);
      }
      closeModal();
      await fetchCategories();
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setModalLoading(false);
    }
  };

  // ─── Delete handler ───────────────────────────────────────────────────

  const handleDelete = async (item, tabKey) => {
    if (!window.confirm(`Deactivate this ${tabKey}? This can be reactivated later.`)) return;
    setApiError('');
    try {
      if (tabKey === 'department') {
        await orgAPI.deleteDepartment(item.id);
        await fetchDepartments();
      } else {
        await orgAPI.deleteCategory(item.id);
        await fetchCategories();
      }
    } catch (err) {
      setApiError(err.response?.data?.message || `Failed to deactivate ${tabKey}`);
    }
  };

  // ─── Inline role update ─────────────────────────────────────────────

  const handleRoleChange = async (userId, newRole) => {
    setApiError('');
    try {
      await orgAPI.updateEmployeeRole(userId, newRole);
      // Update UI immediately (acceptance criterion)
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === userId ? { ...emp, role: newRole } : emp)),
      );
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to update role');
    }
  };

  // ─── Tab content rendering ───────────────────────────────────────────

  const renderDepartmentsTab = () => {
    if (departments.length === 0) {
      return (
        <div className={styles.emptyState}>
          <p>No departments yet. Create your first department to get started.</p>
        </div>
      );
    }

    return (
      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Head</th>
                <th>Parent Dept</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id}>
                  <td>
                    <strong>{dept.name}</strong>
                    <span style={{ color: 'var(--color-text-muted)', marginLeft: 8, fontSize: '0.8rem' }}>
                      {dept.code}
                    </span>
                  </td>
                  <td>{dept.head ? dept.head.name : '—'}</td>
                  <td>{dept.parentDepartment ? dept.parentDepartment.name : '—'}</td>
                  <td><StatusPill status={dept.status} /></td>
                  <td>
                    <div className={styles.rowActions}>
                      <button
                        className={styles.iconBtn}
                        onClick={() => openEditModal(dept, 'department')}
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.danger}`}
                        onClick={() => handleDelete(dept, 'department')}
                        title="Deactivate"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCategoriesTab = () => {
    if (categories.length === 0) {
      return (
        <div className={styles.emptyState}>
          <p>No categories yet. Create your first category to start organizing assets.</p>
        </div>
      );
    }

    return (
      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td><strong>{cat.name}</strong></td>
                  <td><StatusPill status={cat.status} /></td>
                  <td>
                    <div className={styles.rowActions}>
                      <button
                        className={styles.iconBtn}
                        onClick={() => openEditModal(cat, 'category')}
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.danger}`}
                        onClick={() => handleDelete(cat, 'category')}
                        title="Deactivate"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderEmployeeTab = () => {
    if (employees.length === 0) {
      return (
        <div className={styles.emptyState}>
          <p>No employees registered yet. Users will appear here after signing up.</p>
        </div>
      );
    }

    return (
      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td><strong>{emp.name}</strong></td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{emp.email}</td>
                  <td>{emp.department ? emp.department.name : '—'}</td>
                  <td>
                    <select
                      className={styles.roleSelect}
                      value={emp.role}
                      onChange={(e) => handleRoleChange(emp.id, e.target.value)}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </td>
                  <td><StatusPill status={emp.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ─── Modal content ────────────────────────────────────────────────────

  const renderModalContent = () => {
    const isDepartment = activeTab === 'Departments';

    return (
      <form onSubmit={isDepartment ? handleDepartmentSubmit : handleCategorySubmit} className={styles.formGrid} noValidate>
        <Input
          id="modal-name"
          name="name"
          label={isDepartment ? 'Department Name' : 'Category Name'}
          placeholder={isDepartment ? 'e.g. Engineering' : 'e.g. Laptops'}
          value={form.name || ''}
          onChange={onChange}
          error={formErrors.name}
          appearance="surface"
        />

        {isDepartment && (
          <Input
            id="modal-code"
            name="code"
            label="Department Code"
            placeholder="e.g. ENG"
            value={form.code || ''}
            onChange={onChange}
            error={formErrors.code}
            appearance="surface"
          />
        )}

        <Select
          id="modal-status"
          name="status"
          label="Status"
          value={form.status || 'ACTIVE'}
          onChange={onChange}
          appearance="surface"
          options={[
            { value: 'ACTIVE', label: 'Active' },
            { value: 'INACTIVE', label: 'Inactive' },
          ]}
        />

        {isDepartment && (
          <>
            <Select
              id="modal-head"
              name="headId"
              label="Department Head"
              value={form.headId || ''}
              onChange={onChange}
              appearance="surface"
              options={[
                { value: '', label: 'No head assigned' },
                ...employees.map((emp) => ({
                  value: emp.id,
                  label: `${emp.name} (${emp.role.replace(/_/g, ' ')})`,
                })),
              ]}
            />

            <Select
              id="modal-parent"
              name="parentDepartmentId"
              label="Parent Department"
              value={form.parentDepartmentId || ''}
              onChange={onChange}
              appearance="surface"
              options={[
                { value: '', label: 'No parent department' },
                ...departments
                  .filter((dept) => dept.id !== editingItem?.id)
                  .map((dept) => ({ value: dept.id, label: `${dept.name} (${dept.code})` })),
              ]}
            />
          </>
        )}

        <div className={styles.formActions}>
          <Button type="button" variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button type="submit" loading={modalLoading}>
            {modalMode === 'create' ? 'Create' : 'Save'}
          </Button>
        </div>
      </form>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div>
      {/* Page header */}
      <motion.div
        className={styles.pageHeader}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>Organization Setup</h2>
        {activeTab !== 'Employee' && (
          <Button onClick={openCreateModal}>
            <Plus size={16} />
            Add {activeTab.slice(0, -1)}
          </Button>
        )}
      </motion.div>

      {/* API error banner */}
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
            <button
              type="button"
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 4 }}
              onClick={() => setApiError('')}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab bar with animated indicator */}
      <div className={styles.tabBar} ref={tabContentRef}>
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {activeTab === tab && (
              <motion.span
                className={styles.tabIndicator}
                layoutId="org-tab-indicator"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {loading ? (
        <SkeletonTable rows={5} cols={activeTab === 'Departments' ? 5 : 3} />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'Departments' && renderDepartmentsTab()}
            {activeTab === 'Categories' && renderCategoriesTab()}
            {activeTab === 'Employee' && renderEmployeeTab()}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Create/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={modalMode === 'create'
          ? `Add ${activeTab === 'Departments' ? 'Department' : 'Category'}`
          : `Edit ${activeTab === 'Departments' ? 'Department' : 'Category'}`}
        contentClassName={styles.orgModalCard}
        bodyClassName={styles.orgModalBody}
      >
        {renderModalContent()}
      </Modal>
    </div>
  );
}
