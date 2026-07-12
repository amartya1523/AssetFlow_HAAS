import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CalendarClock, Plus, Trash2, X } from 'lucide-react';
import { bookingAPI } from '../api/booking';
import { assetAPI } from '../api/assets';
import { orgAPI } from '../api/organization';
import useAuthStore from '../context/authStore';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Select from '../components/Select';
import styles from './Booking.module.css';

// ─── Constants ───────────────────────────────────────────────────────────────

const START_HOUR = 8;
const END_HOUR = 18;
const HOUR_HEIGHT = 60; // 60px per hour
const EMPTY_RESOURCE_FORM = {
  name: '',
  categoryId: '',
  departmentId: '',
  location: '',
  condition: '',
  serialNumber: '',
  photoUrl: '',
};

function pad(value) {
  return String(value).padStart(2, '0');
}

function getTodayLocalDate() {
  const now = new Date();
  const timezoneAdjusted = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return timezoneAdjusted.toISOString().slice(0, 10);
}

function buildLocalDateTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;

  const [year, month, day] = dateValue.split('-').map(Number);
  const [hours, minutes] = timeValue.split(':').map(Number);

  if ([year, month, day, hours, minutes].some((value) => Number.isNaN(value))) {
    return null;
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function formatDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatTimeInputValue(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addMinutes(date, minutesToAdd) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() + minutesToAdd * 60_000);
}

function slotsMatch(startA, endA, startB, endB) {
  if (!startA || !endA || !startB || !endB) return false;
  return startA.getTime() === startB.getTime() && endA.getTime() === endB.getTime();
}

// Helper to calculate top and height in px for the grid
function getGridPosition(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const hours = date.getHours() + date.getMinutes() / 60;
  if (hours < START_HOUR || hours > END_HOUR) return null; // out of bounds
  return (hours - START_HOUR) * HOUR_HEIGHT;
}

function fmtTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(value) {
  return new Date(value).toLocaleDateString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function extractErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Booking() {
  const user = useAuthStore((s) => s.user);
  
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayLocalDate);
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [formMessage, setFormMessage] = useState('');

  // New booking form
  const [startTime, setStartTime] = useState('09:30');
  const [endTime, setEndTime] = useState('10:30');
  const [submitting, setSubmitting] = useState(false);
  
  // Modal state
  const [activeModal, setActiveModal] = useState(null); // { bookingId: string }
  const [manageStartTime, setManageStartTime] = useState('');
  const [manageEndTime, setManageEndTime] = useState('');
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [resourceForm, setResourceForm] = useState(EMPTY_RESOURCE_FORM);
  const [resourceErrors, setResourceErrors] = useState({});
  const [resourceSaving, setResourceSaving] = useState(false);
  const [resourceMessage, setResourceMessage] = useState('');

  // Load assets
  const loadAssets = async (preferredAssetId = null) => {
    try {
      setPageError('');
      const res = await assetAPI.list({ isBookable: true });
      const fetchedAssets = (res.data.data || []).filter((asset) => asset.isBookable);
      setAssets(fetchedAssets);
      if (fetchedAssets.length === 0) {
        setSelectedAsset('');
        return;
      }

      const hasCurrentSelection = fetchedAssets.some((asset) => asset.id === selectedAsset);
      const hasPreferredSelection = preferredAssetId && fetchedAssets.some((asset) => asset.id === preferredAssetId);

      if (hasPreferredSelection) {
        setSelectedAsset(preferredAssetId);
      } else if (!selectedAsset || !hasCurrentSelection) {
        setSelectedAsset(fetchedAssets[0].id);
      }
    } catch (err) {
      console.error('Failed to load assets', err);
      setAssets([]);
      setSelectedAsset('');
      setPageError(extractErrorMessage(err, 'Bookable resources could not be loaded right now.'));
    }
  };

  // Load bookings
  const loadBookings = async () => {
    if (!selectedAsset) {
      setBookings([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      setPageError('');
      const res = await bookingAPI.list({ assetId: selectedAsset });
      setBookings((res.data.data || []).filter((booking) => booking.status !== 'CANCELLED'));
    } catch (err) {
      console.error('Failed to load bookings', err);
      setBookings([]);
      setPageError(extractErrorMessage(err, 'Schedule could not be loaded right now.'));
    } finally {
      setLoading(false);
    }
  };

  const loadMasterData = async () => {
    try {
      const [categoryRes, departmentRes] = await Promise.allSettled([
        orgAPI.listCategories(),
        orgAPI.listDepartments(),
      ]);

      if (categoryRes.status === 'fulfilled') {
        setCategories((categoryRes.value.data.data || []).filter((category) => category.status === 'ACTIVE'));
      }

      if (departmentRes.status === 'fulfilled') {
        setDepartments((departmentRes.value.data.data || []).filter((department) => department.status === 'ACTIVE'));
      }
    } catch (err) {
      console.error('Failed to load booking master data', err);
    }
  };

  useEffect(() => {
    loadAssets();
    loadMasterData();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [selectedAsset, selectedDate]);

  // Derived attempted slot
  const attemptStart = useMemo(
    () => buildLocalDateTime(selectedDate, startTime),
    [selectedDate, startTime],
  );
  const attemptEnd = useMemo(
    () => buildLocalDateTime(selectedDate, endTime),
    [selectedDate, endTime],
  );

  const selectedDateBookings = useMemo(
    () => bookings.filter((booking) => formatDateKey(booking.startTime) === selectedDate),
    [bookings, selectedDate],
  );

  const previewMatchesExistingBooking = useMemo(
    () => selectedDateBookings.some((booking) => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      return slotsMatch(attemptStart, attemptEnd, bookingStart, bookingEnd);
    }),
    [selectedDateBookings, attemptStart, attemptEnd],
  );

  const historyBookings = useMemo(
    () => [...bookings].sort((left, right) => new Date(right.startTime) - new Date(left.startTime)),
    [bookings],
  );

  // Overlap logic: newStart < existingEnd && newEnd > existingStart
  const hasOverlap = useMemo(() => {
    if (!attemptStart || !attemptEnd || attemptStart >= attemptEnd) return true;
    return selectedDateBookings.some((b) => {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return attemptStart < bEnd && attemptEnd > bStart;
    });
  }, [selectedDateBookings, attemptStart, attemptEnd]);

  const activeBooking = useMemo(
    () => bookings.find((booking) => booking.id === activeModal?.bookingId) || null,
    [activeModal, bookings],
  );

  const activeBookingDate = activeBooking ? formatDateKey(activeBooking.startTime) : selectedDate;
  const manageStart = useMemo(
    () => buildLocalDateTime(activeBookingDate, manageStartTime),
    [activeBookingDate, manageStartTime],
  );
  const manageEnd = useMemo(
    () => buildLocalDateTime(activeBookingDate, manageEndTime),
    [activeBookingDate, manageEndTime],
  );

  const manageHasOverlap = useMemo(() => {
    if (!activeBooking || !manageStart || !manageEnd || manageStart >= manageEnd) return false;

    return bookings.some((booking) => {
      if (booking.id === activeBooking.id) return false;
      if (formatDateKey(booking.startTime) !== activeBookingDate) return false;

      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      return manageStart < bookingEnd && manageEnd > bookingStart;
    });
  }, [activeBooking, activeBookingDate, bookings, manageStart, manageEnd]);

  const isValidTime = Boolean(attemptStart && attemptEnd && attemptStart < attemptEnd);
  const canSubmit = Boolean(selectedAsset) && isValidTime && !hasOverlap && !loading && assets.length > 0;
  const canReschedule = Boolean(
    activeBooking &&
    manageStart &&
    manageEnd &&
    manageStart < manageEnd &&
    !manageHasOverlap,
  );

  const openManageModal = (booking) => {
    setFormMessage('');
    setManageStartTime(formatTimeInputValue(booking.startTime));
    setManageEndTime(formatTimeInputValue(booking.endTime));
    setActiveModal({ bookingId: booking.id });
  };

  const openResourceModal = () => {
    setResourceForm(EMPTY_RESOURCE_FORM);
    setResourceErrors({});
    setResourceMessage('');
    setResourceModalOpen(true);
  };

  const onResourceFormChange = (event) => {
    const { name, value } = event.target;
    setResourceForm((current) => ({ ...current, [name]: value }));
    setResourceErrors((current) => ({ ...current, [name]: undefined }));
    setResourceMessage('');
  };

  const validateResourceForm = () => {
    const nextErrors = {};

    if (!resourceForm.name.trim()) {
      nextErrors.name = 'Resource name is required';
    }

    if (!resourceForm.categoryId) {
      nextErrors.categoryId = 'Category is required';
    }

    if (resourceForm.photoUrl && !/^https?:\/\/\S+$/i.test(resourceForm.photoUrl)) {
      nextErrors.photoUrl = 'Enter a valid photo URL';
    }

    setResourceErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onCreateResource = async (event) => {
    event.preventDefault();

    if (!validateResourceForm()) return;

    setResourceSaving(true);
    try {
      const response = await assetAPI.create({
        name: resourceForm.name.trim(),
        categoryId: resourceForm.categoryId,
        departmentId: resourceForm.departmentId || null,
        serialNumber: null,
        location: resourceForm.location.trim() || null,
        condition: 'New',
        photoUrl: null,
        isBookable: true,
      });

      const createdResource = response.data.data;
      setResourceModalOpen(false);
      setFormMessage('Resource added successfully.');
      await loadAssets(createdResource?.id || null);
    } catch (err) {
      setResourceMessage(extractErrorMessage(err, 'Resource could not be added.'));
    } finally {
      setResourceSaving(false);
    }
  };

  // Handlers
  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      setFormMessage('');
      await bookingAPI.create({
        assetId: selectedAsset,
        startTime: attemptStart.toISOString(),
        endTime: attemptEnd.toISOString(),
      });
      setFormMessage('Booking created successfully.');
      await loadBookings();
      const durationMinutes = Math.max(30, Math.round((attemptEnd.getTime() - attemptStart.getTime()) / 60_000));
      const nextStart = attemptEnd;
      const nextEnd = addMinutes(nextStart, durationMinutes);

      setStartTime(formatTimeInputValue(nextStart));
      setEndTime(formatTimeInputValue(nextEnd));
    } catch (err) {
      setFormMessage(extractErrorMessage(err, 'Booking failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  const onCancel = async () => {
    if (!activeModal?.bookingId) return;
    setSubmitting(true);
    try {
      setFormMessage('');
      await bookingAPI.cancel(activeModal.bookingId);
      setFormMessage('Booking cancelled successfully.');
      await loadBookings();
    } catch (err) {
      setFormMessage(extractErrorMessage(err, 'Cancel failed.'));
    } finally {
      setSubmitting(false);
      setActiveModal(null);
    }
  };

  const onReschedule = async () => {
    if (!activeBooking || !canReschedule) return;

    setSubmitting(true);
    try {
      setFormMessage('');
      await bookingAPI.reschedule(activeBooking.id, {
        startTime: manageStart.toISOString(),
        endTime: manageEnd.toISOString(),
      });
      setFormMessage('Booking rescheduled successfully.');
      await loadBookings();
      setActiveModal(null);
    } catch (err) {
      setFormMessage(extractErrorMessage(err, 'Reschedule failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Render Time Grid Background
  const renderTimeGrid = () => {
    const lines = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      const top = (h - START_HOUR) * HOUR_HEIGHT;
      lines.push(
        <div key={h} className={styles.gridLine} style={{ top: `${top}px` }}>
          <span className={styles.timeLabel}>{h === 12 ? '12:00 PM' : h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`}</span>
        </div>
      );
      if (h !== END_HOUR) {
        lines.push(
          <div key={`${h}-half`} className={`${styles.gridLine} ${styles.halfHour}`} style={{ top: `${top + HOUR_HEIGHT / 2}px` }} />
        );
      }
    }
    return lines;
  };

  // Render existing bookings
  const renderBookings = () => {
    return selectedDateBookings.map((b) => {
      const top = getGridPosition(b.startTime);
      const bottom = getGridPosition(b.endTime);
      if (top === null || bottom === null) return null;

      const isMine = b.bookedBy?.id === user?.userId || b.bookedBy?.id === user?.id;
      const canManageBooking = isMine || ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD', 'SUPER_ADMIN'].includes(user?.role);

      return (
        <div
          key={b.id}
          className={`${styles.bookingBlock} ${isMine ? styles.myBooking : styles.booked}`}
          style={{ top: `${top}px`, height: `${bottom - top}px` }}
          onClick={() => {
            if (canManageBooking) {
              openManageModal(b);
            }
          }}
          title={canManageBooking ? 'Click to manage booking' : 'Booked'}
        >
          <span className={styles.bookingTime}>{fmtTime(b.startTime)} - {fmtTime(b.endTime)}</span>
          <span className={styles.bookingUser}>{b.bookedBy?.name || 'Unknown User'}</span>
        </div>
      );
    });
  };

  // Render attempted slot overlay
  const renderAttempt = () => {
    if (!startTime || !endTime) return null;
    const top = getGridPosition(attemptStart);
    const bottom = getGridPosition(attemptEnd);
    if (top === null || bottom === null || top >= bottom) return null;

    return (
      <div
        className={`${styles.attemptBlock} ${hasOverlap ? styles.attemptConflict : styles.attemptValid}`}
        style={{ top: `${top}px`, height: `${bottom - top}px` }}
      >
        {hasOverlap ? 'Conflict: Slot Unavailable' : 'New Booking Slot'}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Resource Booking</h2>
        <p className={styles.subtitle}>Check availability and reserve assets seamlessly.</p>
      </div>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Resource</label>
          <div className={styles.resourceSelectRow}>
            <select
              className={styles.select}
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
            >
              {assets.length === 0 && <option value="">No bookable resources available</option>}
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.assetTag})</option>
              ))}
            </select>
            <button
              type="button"
              className={styles.addResourceBtn}
              onClick={openResourceModal}
              aria-label="Add resource"
              title="Add resource"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Date</label>
          <input
            type="date"
            className={styles.dateInput}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.timelineCard}>
        <div className={styles.timelineHeader}>
          <div className={styles.timelineTitle}>Schedule</div>
          <div className={styles.timelineLegend}>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.booked}`} /> Booked
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.myBooking}`} /> My Booking
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.conflict}`} /> Conflict
            </div>
          </div>
        </div>

        {pageError && (
          <div className={styles.bannerError}>
            <AlertCircle size={16} />
            {pageError}
          </div>
        )}

        <div className={styles.timelineBody}>
          <div className={styles.timeAxis}>
            {/* Axis labels are rendered by gridLines logic, shifted left */}
          </div>
          <div className={styles.gridArea}>
            {renderTimeGrid()}
            {!loading && Boolean(selectedAsset) && !previewMatchesExistingBooking && renderAttempt()}
            {!loading && renderBookings()}
            {!loading && !selectedAsset && (
              <div className={styles.emptyTimelineState}>
                Add or mark an asset as bookable to start using Resource Booking.
              </div>
            )}
          </div>
        </div>

        <div className={styles.formSection}>
          <div className={styles.timeInputWrap}>
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Start Time</label>
              <input
                type="time"
                className={styles.timeInput}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                step="1800"
              />
            </div>
            <span style={{ marginTop: '16px', color: 'var(--color-text-muted)' }}>—</span>
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>End Time</label>
              <input
                type="time"
                className={styles.timeInput}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                step="1800"
              />
            </div>
          </div>

          <div style={{ flexGrow: 1 }} />

          {formMessage && (
            <div className={formMessage.toLowerCase().includes('successfully') ? styles.successText : styles.errorText}>
              <AlertCircle size={16} /> {formMessage}
            </div>
          )}
          
          {hasOverlap && isValidTime && !previewMatchesExistingBooking && (
            <div className={styles.errorText}>
              <AlertCircle size={16} /> Time slot overlaps with an existing booking
            </div>
          )}
          {!isValidTime && (
            <div className={styles.errorText}>
              <AlertCircle size={16} /> Start time must be before end time
            </div>
          )}

          <Button onClick={onSubmit} disabled={!canSubmit} loading={submitting}>
            <CalendarClock size={16} />
            Book a slot
          </Button>
        </div>
      </div>

      <div className={styles.historyCard}>
        <div className={styles.historyHeader}>
          <div>
            <h3 className={styles.historyTitle}>Booking History</h3>
            <p className={styles.historySubtitle}>Recent bookings for the selected resource will appear here.</p>
          </div>
        </div>

        {historyBookings.length === 0 ? (
          <div className={styles.historyEmpty}>There is no booking history for this resource yet.</div>
        ) : (
          <div className={styles.historyList}>
            {historyBookings.map((booking) => {
              const isMine = booking.bookedBy?.id === user?.userId || booking.bookedBy?.id === user?.id;
              const canDeleteBooking = isMine || ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD', 'SUPER_ADMIN'].includes(user?.role);
              return (
                <div
                  key={booking.id}
                  className={`${styles.historyItem} ${isMine ? styles.historyMine : ''}`}
                >
                  <div className={styles.historyPrimary}>
                    <span className={styles.historyDate}>{fmtDate(booking.startTime)}</span>
                    <span className={styles.historyTime}>
                      {fmtTime(booking.startTime)} - {fmtTime(booking.endTime)}
                    </span>
                  </div>
                  <div className={styles.historyMeta}>
                    <span className={styles.historyUser}>{booking.bookedBy?.name || 'Unknown User'}</span>
                    <span className={styles.historyStatus}>{booking.status}</span>
                    {canDeleteBooking && (
                      <button
                        type="button"
                        className={styles.historyDeleteBtn}
                        onClick={() => openManageModal(booking)}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={styles.modalContent}
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
            >
              <h3 className={styles.modalTitle}>Manage Booking</h3>
              <p className={styles.modalText}>
                Update the slot timings or cancel this booking. Changes apply immediately for everyone viewing the resource schedule.
              </p>
              <div className={styles.modalTimeGrid}>
                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel}>Start Time</label>
                  <input
                    type="time"
                    className={styles.timeInput}
                    value={manageStartTime}
                    onChange={(e) => setManageStartTime(e.target.value)}
                    step="1800"
                  />
                </div>
                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel}>End Time</label>
                  <input
                    type="time"
                    className={styles.timeInput}
                    value={manageEndTime}
                    onChange={(e) => setManageEndTime(e.target.value)}
                    step="1800"
                  />
                </div>
              </div>
              {manageStart && manageEnd && manageStart >= manageEnd && (
                <div className={styles.errorText}>
                  <AlertCircle size={16} /> Start time must be before end time
                </div>
              )}
              {manageHasOverlap && (
                <div className={styles.errorText}>
                  <AlertCircle size={16} /> Rescheduled slot overlaps with another booking
                </div>
              )}
              <div className={styles.modalActions}>
                <Button variant="secondary" onClick={() => setActiveModal(null)}>Keep Booking</Button>
                <Button variant="secondary" onClick={onReschedule} loading={submitting} disabled={!canReschedule}>
                  <CalendarClock size={15} /> Reschedule
                </Button>
                <Button onClick={onCancel} loading={submitting} className={styles.dangerBtn} style={{ background: 'var(--color-danger)' }}>
                  <X size={15} /> Confirm Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        open={resourceModalOpen}
        onClose={() => setResourceModalOpen(false)}
        title="Add Resource"
        contentClassName={styles.resourceModalCard}
        bodyClassName={styles.resourceModalBody}
      >
        <form className={styles.resourceForm} onSubmit={onCreateResource} noValidate>
          <div className={styles.resourceFormGrid}>
            <Input
              id="resource-name"
              name="name"
              label="Resource Name"
              placeholder="e.g. Conference Room B2"
              value={resourceForm.name}
              onChange={onResourceFormChange}
              error={resourceErrors.name}
              appearance="surface"
            />
            <Select
              id="resource-category"
              name="categoryId"
              label="Category"
              value={resourceForm.categoryId}
              onChange={onResourceFormChange}
              error={resourceErrors.categoryId}
              appearance="surface"
              options={[
                { value: '', label: categories.length ? 'Select category' : 'No active categories available' },
                ...categories.map((category) => ({ value: category.id, label: category.name })),
              ]}
            />
            <Select
              id="resource-department"
              name="departmentId"
              label="Department"
              value={resourceForm.departmentId}
              onChange={onResourceFormChange}
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
              id="resource-location"
              name="location"
              label="Location"
              placeholder="e.g. 2nd Floor"
              value={resourceForm.location}
              onChange={onResourceFormChange}
              appearance="surface"
            />
          </div>

          <p className={styles.resourceHint}>New resource will automatically be saved as a bookable resource.</p>

          {resourceMessage && (
            <div className={styles.errorText}>
              <AlertCircle size={16} /> {resourceMessage}
            </div>
          )}

          <div className={styles.resourceActions}>
            <Button type="button" variant="secondary" onClick={() => setResourceModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={resourceSaving} disabled={!categories.length}>
              <Plus size={16} />
              Add Resource
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
