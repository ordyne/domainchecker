// Type definitions for domain monitoring

export interface Domain {
  id: string;
  user_id: string;
  name: string;
  status: 'registered' | 'available';
  active: boolean;
  last_checked: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface DomainCheckResult {
  domain: string;
  available: boolean;
  status: 'registered' | 'available';
  checkedAt: Date;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface EmailNotification {
  id: string;
  user_id: string;
  domain_id: string;
  sent_at: Date;
  status: 'sent' | 'failed';
  error_message?: string | null;
  created_at: Date;
}
