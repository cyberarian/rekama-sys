
export enum RecordStatus {
  Active = 'Active',
  Archived = 'Archived',
  Destroyed = 'Destroyed',
  Review = 'Review'
}

export enum Classification {
  Public = 'Public',
  Internal = 'Internal',
  Confidential = 'Confidential',
  Restricted = 'Restricted'
}

// Corporate Roles
export enum UserRole {
  SysAdmin = 'System Administrator',       // IT/DevOps: System config, user mgmt
  ComplianceManager = 'Compliance Manager', // Business Owner: Full record control, destruction
  RecordsOfficer = 'Records Officer',       // Operational: Add/Edit records, no destruction
  LegalAnalyst = 'Legal Analyst',           // Legal: Legal Holds, Discovery, View only
  Auditor = 'Internal Auditor'              // Audit: Read-only logs and reporting
}

export interface UserProfile {
  id: string; 
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  lastLogin?: string;
  password?: string; 
}

// --- PERMISSION SYSTEM ---

export type Permission = 
  | 'SYSTEM_MANAGE'      // Configure settings, manage users
  | 'RECORD_CREATE'      // Upload/Register documents
  | 'RECORD_EDIT'        // Edit metadata
  | 'RECORD_DELETE'      // Secure destruction
  | 'LEGAL_HOLD_MANAGE'  // Apply/Remove Legal Holds
  | 'POLICY_MANAGE'      // Create/Edit Policies
  | 'LOG_VIEW'           // View Security Audit Logs
  | 'CONNECTOR_MANAGE';  // Add/Remove Data Sources

const PERMISSION_MATRIX: Record<UserRole, Permission[]> = {
  [UserRole.SysAdmin]: [
    'SYSTEM_MANAGE', 'LOG_VIEW', 'CONNECTOR_MANAGE', 'RECORD_CREATE', 'RECORD_EDIT', 'POLICY_MANAGE'
  ],
  [UserRole.ComplianceManager]: [
    'RECORD_CREATE', 'RECORD_EDIT', 'RECORD_DELETE', 'LEGAL_HOLD_MANAGE', 
    'POLICY_MANAGE', 'LOG_VIEW', 'CONNECTOR_MANAGE'
  ],
  [UserRole.RecordsOfficer]: [
    'RECORD_CREATE', 'RECORD_EDIT'
  ],
  [UserRole.LegalAnalyst]: [
    'LEGAL_HOLD_MANAGE', 'LOG_VIEW'
  ],
  [UserRole.Auditor]: [
    'LOG_VIEW'
  ]
};

export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  return PERMISSION_MATRIX[role]?.includes(permission) || false;
};

export interface DocumentRecord {
  id: string;
  title: string;
  type: 'PDF' | 'DOCX' | 'XLSX' | 'TXT';
  classification: Classification;
  status: RecordStatus;
  riskScore: number;
  source: string;
  uploadedAt: string;
  legalHold: boolean; 
  retentionScheduleId?: string; 
  disposalDate?: string;
  checksum: string; 
  version: number;
  custodian: string;
  format: string; 
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  content: string; 
  createdAt: string;
}

export interface RetentionSchedule {
  id: string;
  code: string;
  name: string;
  description: string;
  retentionYears: number;
  trigger: 'Creation' | 'LastModified' | 'Event';
}

export interface Connector {
  id: string;
  name: string;
  type: 'SharePoint' | 'OneDrive' | 'Exchange' | 'S3' | 'GoogleDrive' | 'Slack';
  status: 'Active' | 'Error' | 'Syncing' | 'Paused';
  itemsIndexed: number;
  lastSync: string;
  targetUrl?: string; 
  lastErrorMessage?: string; // Enterprise error reporting
  syncProgress?: number;     // Sync visibility
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  metadata?: string; 
}

export interface RiskAnalysisResult {
  score: number;
  classification: Classification;
  pii_detected: string[];
  reasoning: string;
  iso_controls: string[]; 
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isThinking?: boolean;
}

export interface GraphNode {
  id: string;
  group: number; 
  val: number; 
  name: string;
}

export interface GraphLink {
  source: string;
  target: string;
  value: number; 
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface AppSettings {
  organizationName: string;
  adminEmail: string;
  retentionDefault: number;
  autoScan: boolean;
  emailAlerts: boolean;
}
