import {
  LayoutDashboard,
  Building2,
  ShieldCheck,
  Users,
  Package,
  ArrowLeftRight,
  CalendarClock,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Bell,
} from 'lucide-react';

/**
 * Sidebar navigation — exact 9 items in required order.
 * roles: undefined = visible to all authenticated users.
 * Used by the sidebar for role-based visibility.
 */
export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Organization Setup', path: '/app/organization', icon: Building2, roles: ['ADMIN'] },
  { label: 'User Management', path: '/app/users', icon: Users, roles: ['ADMIN'] },
  { label: 'Super Admin', path: '/super-admin', icon: ShieldCheck, roles: ['SUPER_ADMIN'] },
  { label: 'Assets', path: '/app/assets', icon: Package },
  { label: 'Allocation & Transfer', path: '/app/allocation', icon: ArrowLeftRight },
  { label: 'Resource Booking', path: '/app/booking', icon: CalendarClock },
  { label: 'Maintenance', path: '/app/maintenance', icon: Wrench },
  { label: 'Audit', path: '/app/audit', icon: ClipboardCheck, roles: ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'] },
  { label: 'Reports', path: '/app/reports', icon: BarChart3, roles: ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'] },
  { label: 'Notifications', path: '/app/notifications', icon: Bell },
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Organization Setup', path: '/organization', icon: Building2, roles: ['ADMIN'] },
  { label: 'Assets', path: '/assets', icon: Package },
  { label: 'Allocation & Transfer', path: '/allocation', icon: ArrowLeftRight },
  { label: 'Resource Booking', path: '/booking', icon: CalendarClock },
  { label: 'Maintenance', path: '/maintenance', icon: Wrench },
  { label: 'Audit', path: '/audit', icon: ClipboardCheck, roles: ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'] },
  { label: 'Reports', path: '/reports', icon: BarChart3, roles: ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'] },
  { label: 'Notifications', path: '/notifications', icon: Bell },
];
