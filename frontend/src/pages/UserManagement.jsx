import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, KeyRound, Pencil, Plus } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Select from '../components/Select';
import StatusPill from '../components/StatusPill';
import { usersAPI } from '../api/users';
import { orgAPI } from '../api/organization';
import styles from './UserManagement.module.css';

const ROLES = ['EMPLOYEE', 'DEPARTMENT_HEAD', 'ASSET_MANAGER', 'ADMIN'];
const STATUSES = ['ACTIVE', 'INACTIVE'];
const MODULE_LABELS = {
  auth: 'Account',
  organization: 'Organization Setup',
  assets: 'Assets',
  allocation: 'Allocation & Transfer',
  booking: 'Resource Booking',
  maintenance: 'Maintenance',
  audit: 'Audit',
  notifications: 'Notifications',
  dashboard: 'Dashboard',
  reports: 'Reports',
  platform: 'Platform',
};
const MODULE_ORDER = [
  'dashboard',
  'organization',
  'assets',
  'allocation',
  'booking',
  'maintenance',
  'audit',
  'reports',
  'notifications',
  'auth',
  'platform',
];

function roleLabel(role) {
  return role.replace(/_/g, ' ');
}

function getModuleKey(action) {
  const prefix = action.split(':')[0];
  if (prefix === 'employees' || prefix === 'users') return 'organization';
  if (prefix === 'transfer') return 'allocation';
  return prefix;
}

function groupPermissionActions(actions) {
  const grouped = actions.reduce((acc, action) => {
    const key = getModuleKey(action);
    if (!acc[key]) acc[key] = [];
    acc[key].push(action);
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([key, moduleActions]) => ({
      key,
      label: MODULE_LABELS[key] || roleLabel(key),
      actions: moduleActions.sort(),
    }))
    .sort((a, b) => {
      const aIndex = MODULE_ORDER.indexOf(a.key);
      const bIndex = MODULE_ORDER.indexOf(b.key);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [permissionState, setPermissionState] = useState(null);
  const [modulePermissions, setModulePermissions] = useState({});

  const visibleUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      [user.name, user.email, user.role].some((value) => value?.toLowerCase().includes(term)),
    );
  }, [search, users]);

  const fetchUsers = async () => {
    const res = await usersAPI.list();
    setUsers(res.data.data);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setApiError('');

    Promise.all([usersAPI.list(), orgAPI.listDepartments()])
      .then(([userRes, deptRes]) => {
        if (cancelled) return;
        setUsers(userRes.data.data);
        setDepartments(deptRes.data.data);
      })
      .catch((err) => {
        if (!cancelled) setApiError(err.response?.data?.message || 'Failed to load users');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ role: 'EMPLOYEE', status: 'ACTIVE', departmentId: '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
      departmentId: user.departmentId || '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: undefined }));
  };

  const validateForm = () => {
    const next = {};
    if (!editingUser) {
      if (!form.name?.trim()) next.name = 'Name is required';
      if (!form.email?.trim()) next.email = 'Email is required';
      if (form.password && form.password.length < 6) next.password = 'At least 6 characters';
    } else if (!form.name?.trim()) {
      next.name = 'Name is required';
    }
    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const submitUser = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    setApiError('');

    const payload = {
      ...form,
      name: form.name?.trim(),
      email: form.email?.trim(),
      departmentId: form.departmentId || null,
    };

    try {
      if (editingUser) {
        await usersAPI.update(editingUser.id, payload);
      } else {
        await usersAPI.create(payload);
      }
      setModalOpen(false);
      await fetchUsers();
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const openPermissions = async (user) => {
    setApiError('');
    setPermissionOpen(true);
    setPermissionState(null);
    try {
      const res = await usersAPI.getPermissions(user.id);
      const data = res.data.data;
      const grouped = groupPermissionActions(data.actions);
      const next = Object.fromEntries(
        grouped.map((group) => [
          group.key,
          group.actions.every((action) => data.effective[action]),
        ]),
      );
      setEditingUser(user);
      setPermissionState({ ...data, groups: grouped });
      setModulePermissions(next);
    } catch (err) {
      setPermissionOpen(false);
      setApiError(err.response?.data?.message || 'Failed to load permissions');
    }
  };

  const savePermissions = async () => {
    setSaving(true);
    setApiError('');
    try {
      const payload = permissionState.groups.flatMap((group) =>
        group.actions.map((permissionKey) => ({
          permissionKey,
          effect: modulePermissions[group.key] ? 'GRANT' : 'REVOKE',
        })),
      );
      const res = await usersAPI.updatePermissions(editingUser.id, payload);
      const grouped = groupPermissionActions(res.data.data.actions);
      setPermissionState({ ...res.data.data, groups: grouped });
      setPermissionOpen(false);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h2>User Management</h2>
          <p className={styles.muted}>Create tenant users and tune permission overrides.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add user
        </Button>
      </div>

      {apiError && (
        <div className={styles.apiError}>
          <AlertCircle size={16} />
          <span>{apiError}</span>
        </div>
      )}

      <div className={styles.toolbar}>
        <Input
          id="search"
          name="search"
          label="Search"
          placeholder="Name, email, or role"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && visibleUsers.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.name}</strong></td>
                  <td className={styles.muted}>{user.email}</td>
                  <td>{user.department?.name || '-'}</td>
                  <td>{roleLabel(user.role)}</td>
                  <td><StatusPill status={user.status} /></td>
                  <td>
                    <div className={styles.rowActions}>
                      <button className={styles.iconBtn} type="button" onClick={() => openEdit(user)} title="Edit user">
                        <Pencil size={15} />
                      </button>
                      <button className={styles.iconBtn} type="button" onClick={() => openPermissions(user)} title="Permissions">
                        <KeyRound size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && visibleUsers.length === 0 && (
          <div className={styles.emptyState}>No users found.</div>
        )}
        {loading && <div className={styles.emptyState}>Loading users...</div>}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? 'Edit user' : 'Add user'}
      >
        <form className={styles.formGrid} onSubmit={submitUser}>
          <Input id="name" name="name" label="Name" value={form.name || ''} onChange={onChange} error={formErrors.name} />
          {!editingUser && (
            <>
              <Input id="email" name="email" label="Email" type="email" value={form.email || ''} onChange={onChange} error={formErrors.email} />
              <Input id="password" name="password" label="Temporary password" type="password" value={form.password || ''} onChange={onChange} error={formErrors.password} placeholder="Generated if blank" />
            </>
          )}
          <Input id="phone" name="phone" label="Phone" value={form.phone || ''} onChange={onChange} />
          <Select id="role" name="role" label="Role" value={form.role || 'EMPLOYEE'} onChange={onChange} options={ROLES.map((role) => ({ value: role, label: roleLabel(role) }))} />
          <Select id="status" name="status" label="Status" value={form.status || 'ACTIVE'} onChange={onChange} options={STATUSES} />
          <Select
            id="departmentId"
            name="departmentId"
            label="Department"
            value={form.departmentId || ''}
            onChange={onChange}
            options={[
              { value: '', label: 'Unassigned' },
              ...departments.map((dept) => ({ value: dept.id, label: dept.name })),
            ]}
          />
          <div className={styles.formActions}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editingUser ? 'Save user' : 'Create user'}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={permissionOpen}
        onClose={() => setPermissionOpen(false)}
        title="Permission overrides"
      >
        {!permissionState ? (
          <div className={styles.emptyState}>Loading permissions...</div>
        ) : (
          <div className={styles.formGrid}>
            <div className={styles.permissionList}>
              {permissionState.groups.map((group) => (
                <label className={styles.permissionRow} key={group.key}>
                  <div>
                    <strong>{group.label}</strong>
                    <span>{group.actions.length} permissions</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(modulePermissions[group.key])}
                    onChange={(event) =>
                      setModulePermissions((current) => ({
                        ...current,
                        [group.key]: event.target.checked,
                      }))
                    }
                  />
                </label>
              ))}
            </div>
            <div className={styles.formActions}>
              <Button variant="secondary" onClick={() => setPermissionOpen(false)}>Cancel</Button>
              <Button onClick={savePermissions} loading={saving}>Save permissions</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
