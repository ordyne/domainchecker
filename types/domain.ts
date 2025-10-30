/**
 * Domain Type Definitions
 * 
 * This file contains TypeScript type definitions for domain-related data structures.
 * These types are shared across frontend and backend to ensure type safety.
 */

// ============================================================================
// Domain Status Types
// ============================================================================

/**
 * Domain registration status
 */
export type DomainStatus = 'registered' | 'available' | 'unknown'

/**
 * Email notification status
 */
export type EmailStatus = 'sent' | 'failed'

// ============================================================================
// Core Domain Interfaces
// ============================================================================

/**
 * Domain entity from database
 */
export interface Domain {
  id: string
  user_id: string
  name: string
  status: DomainStatus
  active: boolean
  last_checked: string | null
  created_at: string
  updated_at: string
}

/**
 * Domain input for creating a new domain
 */
export interface DomainInput {
  name: string
  status?: DomainStatus
  active?: boolean
}

/**
 * Domain update input
 */
export interface DomainUpdateInput {
  name?: string
  status?: DomainStatus
  active?: boolean
  last_checked?: string | null
}

// ============================================================================
// Email Notification Interfaces
// ============================================================================

/**
 * Email notification entity from database
 */
export interface EmailNotification {
  id: string
  user_id: string
  domain_id: string
  sent_at: string
  status: EmailStatus
  error_message: string | null
  created_at: string
}

/**
 * Email notification input
 */
export interface EmailNotificationInput {
  user_id: string
  domain_id: string
  status: EmailStatus
  error_message?: string | null
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * API response wrapper for success cases
 */
export interface ApiResponse<T = unknown> {
  success: true
  data: T
  message?: string
}

/**
 * API response wrapper for error cases
 */
export interface ApiError {
  success: false
  error: string
  details?: unknown
}

/**
 * Combined API response type
 */
export type ApiResult<T = unknown> = ApiResponse<T> | ApiError

/**
 * Check domains API request body
 */
export interface CheckDomainsRequest {
  secret?: string
}

/**
 * Check domains API response data
 */
export interface CheckDomainsResponse {
  checked: number
  updated: number
  notifications_sent: number
  domains: DomainCheckResult[]
}

/**
 * Individual domain check result
 */
export interface DomainCheckResult {
  domain: string
  previous_status: DomainStatus
  current_status: DomainStatus
  status_changed: boolean
  notification_sent: boolean
}

/**
 * Add domain API request body
 */
export interface AddDomainRequest {
  name: string
}

/**
 * Add domain API response data
 */
export interface AddDomainResponse {
  domain: Domain
}

/**
 * Delete domain API request body
 */
export interface DeleteDomainRequest {
  id: string
}

/**
 * Delete domain API response data
 */
export interface DeleteDomainResponse {
  id: string
}

/**
 * Toggle domain active status API request body
 */
export interface ToggleDomainActiveRequest {
  id: string
  active: boolean
}

/**
 * Toggle domain active status API response data
 */
export interface ToggleDomainActiveResponse {
  domain: Domain
}

// ============================================================================
// Domainsduck API Types
// ============================================================================

/**
 * Domainsduck API check domain response
 */
export interface DomainsduckResponse {
  domain: string
  available: boolean
  price?: number
  currency?: string
}

/**
 * Domainsduck API error response
 */
export interface DomainsduckError {
  error: string
  message: string
}

// ============================================================================
// Resend Email Types
// ============================================================================

/**
 * Email send request
 */
export interface EmailSendRequest {
  to: string | string[]
  subject: string
  html: string
}

/**
 * Email send response
 */
export interface EmailSendResponse {
  id: string
}

/**
 * Domain available notification email data
 */
export interface DomainAvailableEmailData {
  domain: string
  checked_at: string
  dashboard_url: string
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Omit timestamps from a type
 */
export type WithoutTimestamps<T> = Omit<T, 'created_at' | 'updated_at'>

/**
 * Make specific fields optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Make specific fields required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

/**
 * Extract non-null fields
 */
export type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>
}

/**
 * Domain with required last_checked field
 */
export type DomainWithLastChecked = RequiredBy<Domain, 'last_checked'>

/**
 * Domain without system fields
 */
export type DomainFormData = Omit<Domain, 'id' | 'user_id' | 'created_at' | 'updated_at'>

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a value is a valid domain status
 */
export function isDomainStatus(value: unknown): value is DomainStatus {
  return value === 'registered' || value === 'available' || value === 'unknown'
}

/**
 * Check if a value is a valid email status
 */
export function isEmailStatus(value: unknown): value is EmailStatus {
  return value === 'sent' || value === 'failed'
}

/**
 * Check if an API result is successful
 */
export function isApiSuccess<T>(result: ApiResult<T>): result is ApiResponse<T> {
  return result.success === true
}

/**
 * Check if an API result is an error
 */
export function isApiError(result: ApiResult): result is ApiError {
  return result.success === false
}

/**
 * Check if a domain name is valid
 */
export function isValidDomainName(name: string): boolean {
  // Basic domain validation regex
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i
  return domainRegex.test(name)
}

// ============================================================================
// Constants
// ============================================================================

/**
 * All possible domain statuses
 */
export const DOMAIN_STATUSES: readonly DomainStatus[] = ['registered', 'available', 'unknown'] as const

/**
 * All possible email statuses
 */
export const EMAIL_STATUSES: readonly EmailStatus[] = ['sent', 'failed'] as const

/**
 * Domain status display labels
 */
export const DOMAIN_STATUS_LABELS: Record<DomainStatus, string> = {
  registered: '등록됨',
  available: '사용 가능',
  unknown: '알 수 없음',
}

/**
 * Domain status colors for UI
 */
export const DOMAIN_STATUS_COLORS: Record<DomainStatus, string> = {
  registered: 'text-red-400',
  available: 'text-emerald-400',
  unknown: 'text-slate-400',
}

/**
 * Email status display labels
 */
export const EMAIL_STATUS_LABELS: Record<EmailStatus, string> = {
  sent: '발송됨',
  failed: '실패',
}
