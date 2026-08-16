export interface StatItem {
  id: string;
  title: string;
  value: string | number;
  subtitle: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  progress?: number;
  color?: 'green' | 'red' | 'blue' | 'amber' | 'indigo';
}

export interface DashboardNote {
  id: string;
  title: string;
  content: string;
  date: string;
  createdAt: string;
}

export interface DashboardMessage {
  id: string;
  sender: string;
  subject: string;
  content: string;
  date: string;
  read: boolean;
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'system' | 'general' | 'maintenance';
}

export interface PropertyStatus {
  total: number;
  occupied: number;
  empty: number;
  debtor: number;
  creditor: number;
}
