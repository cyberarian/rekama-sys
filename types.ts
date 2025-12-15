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

export enum UserRole {
  Admin = 'Admin',
  Officer = 'Officer',
  Viewer = 'Viewer'
}

export interface UserProfile {
  id: string; 
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  lastLogin?: string;
}

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
  // ISO 16175 Integrity Fields
  checksum: string; // SHA-256 hash simulation
  version: number;
  custodian: string;
  format: string; // MIME type
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
  targetUrl?: string; // New field for Source URL
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  metadata?: string; // For storing JSON details like Disposal Certificates
}

export interface RiskAnalysisResult {
  score: number;
  classification: Classification;
  pii_detected: string[];
  reasoning: string;
  iso_controls: string[]; // ISO 27002 Control mappings
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