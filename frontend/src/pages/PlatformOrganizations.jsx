import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Button from '../components/Button';
import StatusPill from '../components/StatusPill';
import { platformAPI } from '../api/platform';
import styles from './PlatformOrganizations.module.css';

export default function PlatformOrganizations() {
  const [organizations, setOrganizations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const loadOrganizations = async () => {
    const res = await platformAPI.listOrganizations();
    setOrganizations(res.data.data);
    if (!selected && res.data.data.length > 0) {
      setSelected(res.data.data[0]);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setApiError('');
    platformAPI.listOrganizations()
      .then((res) => {
        if (cancelled) return;
        setOrganizations(res.data.data);
        setSelected(res.data.data[0] || null);
      })
      .catch((err) => {
        if (!cancelled) setApiError(err.response?.data?.message || 'Failed to load organizations');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selected) {
      setDetails(null);
      setAssets([]);
      return;
    }

    let cancelled = false;
    setAssetsLoading(true);
    Promise.all([
      platformAPI.getOrganization(selected.id),
      platformAPI.listOrganizationAssets(selected.id),
    ])
      .then(([detailsRes, assetsRes]) => {
        if (cancelled) return;
        setDetails(detailsRes.data.data);
        setAssets(assetsRes.data.data);
      })
      .catch((err) => {
        if (!cancelled) setApiError(err.response?.data?.message || 'Failed to load organization details');
      })
      .finally(() => {
        if (!cancelled) setAssetsLoading(false);
      });

    return () => { cancelled = true; };
  }, [selected]);

  const toggleStatus = async () => {
    if (!selected) return;
    setApiError('');
    try {
      const nextStatus = selected.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const res = await platformAPI.updateOrganizationStatus(selected.id, nextStatus);
      setSelected(res.data.data);
      await loadOrganizations();
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to update organization');
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h2>Platform Organizations</h2>
          <p className={styles.muted}>Super Admin portal for tenant oversight.</p>
        </div>
      </div>

      {apiError && (
        <div className={styles.apiError}>
          <AlertCircle size={16} />
          <span>{apiError}</span>
        </div>
      )}

      <div className={styles.grid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <strong>Organizations</strong>
            <span className={styles.muted}>{organizations.length}</span>
          </div>
          <div className={styles.orgList}>
            {!loading && organizations.map((org) => (
              <button
                key={org.id}
                type="button"
                className={`${styles.orgButton} ${selected?.id === org.id ? styles.active : ''}`}
                onClick={() => setSelected(org)}
              >
                <strong>{org.name}</strong>
                <span className={styles.muted}>{org.slug}</span>
                <StatusPill status={org.status} />
                <div className={styles.stats}>
                  <span className={styles.stat}>{org._count?.users || 0} users</span>
                  <span className={styles.stat}>{org._count?.assets || 0} assets</span>
                  <span className={styles.stat}>{org._count?.departments || 0} departments</span>
                </div>
              </button>
            ))}
            {loading && <div className={styles.emptyState}>Loading organizations...</div>}
            {!loading && organizations.length === 0 && <div className={styles.emptyState}>No organizations found.</div>}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <strong>{selected?.name || 'Select an organization'}</strong>
              {selected && <div className={styles.muted}>{selected.slug}</div>}
            </div>
            {selected && (
              <Button variant="secondary" onClick={toggleStatus}>
                {selected.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
              </Button>
            )}
          </div>
          {details && (
            <div className={styles.detailStrip}>
              <div>
                <span>Users</span>
                <strong>{details._count?.users || 0}</strong>
              </div>
              <div>
                <span>Assets</span>
                <strong>{details._count?.assets || 0}</strong>
              </div>
              <div>
                <span>Departments</span>
                <strong>{details._count?.departments || 0}</strong>
              </div>
              <div>
                <span>Created</span>
                <strong>{new Date(details.createdAt).toLocaleDateString()}</strong>
              </div>
            </div>
          )}
          {details?.users?.length > 0 && (
            <div className={styles.usersPreview}>
              <div className={styles.sectionTitle}>Tenant users</div>
              <div className={styles.userChips}>
                {details.users.map((user) => (
                  <span key={user.id} className={styles.userChip}>
                    {user.name} · {user.role.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Tag</th>
                  <th>Category</th>
                  <th>Department</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {!assetsLoading && assets.map((asset) => (
                  <tr key={asset.id}>
                    <td><strong>{asset.name}</strong></td>
                    <td className={styles.muted}>{asset.assetTag}</td>
                    <td>{asset.category?.name || '-'}</td>
                    <td>{asset.department?.name || '-'}</td>
                    <td><StatusPill status={asset.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {assetsLoading && <div className={styles.emptyState}>Loading assets...</div>}
          {!assetsLoading && selected && assets.length === 0 && <div className={styles.emptyState}>No assets in this organization.</div>}
          {!selected && <div className={styles.emptyState}>Choose an organization to inspect assets.</div>}
        </section>
      </div>
    </div>
  );
}
