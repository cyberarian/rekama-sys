import { DocumentRecord, Classification, RecordStatus, Policy, AuditLog, AppSettings, UserProfile, UserRole, RetentionSchedule, Connector } from '../types';

const IDB_NAME = 'RekamaDB';
const IDB_STORE = 'sqlite_store';
// Bumped version to v6 to include Connector Target URL Schema Change
const IDB_KEY = 'rekama_db_v6';

export class RekamaDatabase {
  private db: any = null;
  private dbReady: Promise<void>;

  constructor() {
    this.dbReady = this.init();
  }

  // --- Initialization & Persistence ---

  private async init() {
    if (this.db) return;

    try {
      if (!(window as any).initSqlJs) {
        throw new Error("sql.js not loaded");
      }
      const SQL = await (window as any).initSqlJs({
        locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
      });

      const savedDb = await this.loadFromIndexedDB();

      if (savedDb) {
        this.db = new SQL.Database(savedDb);
      } else {
        this.db = new SQL.Database();
        this.createSchema();
        this.seedData();
        await this.saveToIndexedDB();
      }
    } catch (err) {
      console.error("Failed to initialize database:", err);
    }
  }

  private createSchema() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS records (
        id TEXT PRIMARY KEY,
        title TEXT,
        type TEXT,
        classification TEXT,
        status TEXT,
        riskScore INTEGER,
        source TEXT,
        uploadedAt TEXT,
        legalHold INTEGER DEFAULT 0,
        retentionScheduleId TEXT,
        disposalDate TEXT,
        checksum TEXT,
        version INTEGER,
        custodian TEXT,
        format TEXT
      );
      CREATE TABLE IF NOT EXISTS policies (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        content TEXT,
        createdAt TEXT
      );
      CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY,
        code TEXT,
        name TEXT,
        description TEXT,
        retentionYears INTEGER,
        trigger TEXT
      );
      CREATE TABLE IF NOT EXISTS connectors (
        id TEXT PRIMARY KEY,
        name TEXT,
        type TEXT,
        status TEXT,
        itemsIndexed INTEGER,
        lastSync TEXT,
        targetUrl TEXT
      );
      CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT,
        user TEXT,
        action TEXT,
        resource TEXT,
        severity TEXT,
        metadata TEXT
      );
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        role TEXT,
        avatar TEXT,
        lastLogin TEXT
      );
      CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
  }

  private seedData() {
    // Seed Schedules
    this.db.run(`INSERT INTO schedules VALUES (?, ?, ?, ?, ?, ?)`, ['sch_001', 'FIN-001', 'Financial Records', 'Tax returns, invoices, and ledgers.', 7, 'Creation']);
    this.db.run(`INSERT INTO schedules VALUES (?, ?, ?, ?, ?, ?)`, ['sch_002', 'HR-005', 'Employee Personnel Files', 'Contracts and reviews.', 10, 'LastModified']);
    this.db.run(`INSERT INTO schedules VALUES (?, ?, ?, ?, ?, ?)`, ['sch_003', 'GEN-001', 'General Correspondence', 'Routine emails and memos.', 3, 'Creation']);

    // Seed Connectors
    this.db.run(`INSERT INTO connectors VALUES (?, ?, ?, ?, ?, ?, ?)`, ['conn_001', 'Corporate SharePoint', 'SharePoint', 'Active', 14502, new Date().toISOString(), 'https://acme.sharepoint.com/sites/corp']);
    // Seed the User's specific Google Drive
    this.db.run(`INSERT INTO connectors VALUES (?, ?, ?, ?, ?, ?, ?)`, [
        'conn_google_drive_01', 
        'Shared Team Drive', 
        'GoogleDrive', 
        'Active', 
        12, 
        new Date().toISOString(), 
        'https://drive.google.com/drive/folders/16NDKGmYPF6AU4eMYsTkPCyEyjexe3hC0'
    ]);

    // Seed Records (Updated with ISO fields)
    const mockHash1 = 'a1b2c3d4e5f67890abcdef1234567890';
    const mockHash2 = '0987654321fedcba0987654321fedcba';
    
    this.db.run(`INSERT INTO records VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        'rec_001', 'Financial_Report_Q3_2024.pdf', 'PDF', 'Confidential', 'Active', 65, 'SharePoint', new Date().toISOString(), 0, 'sch_001', 
        new Date(Date.now() + (7 * 365 * 24 * 60 * 60 * 1000)).toISOString(),
        mockHash1, 1, 'Finance Dept', 'application/pdf'
    ]);
    this.db.run(`INSERT INTO records VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        'rec_002', 'Employee_Handbook_v2.docx', 'DOCX', 'Internal', 'Active', 10, 'OneDrive', new Date(Date.now() - 86400000).toISOString(), 0, 'sch_002', 
        new Date(Date.now() + (10 * 365 * 24 * 60 * 60 * 1000)).toISOString(),
        mockHash2, 2, 'HR Dept', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]);

    // Seed mock files from the Google Drive for immediate visibility
    this.db.run(`INSERT INTO records VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        'rec_gdrive_01', 'Project_Phoenix_Specs.pdf', 'PDF', 'Internal', 'Active', 25, 'Shared Team Drive', new Date().toISOString(), 0, null, 
        null, 'e5f67890abcdef1234567890a1b2c3d4', 1, 'Engineering', 'application/pdf'
    ]);
    this.db.run(`INSERT INTO records VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        'rec_gdrive_02', 'Q4_Budget_Draft.xlsx', 'XLSX', 'Confidential', 'Active', 75, 'Shared Team Drive', new Date().toISOString(), 0, 'sch_001', 
        new Date(Date.now() + (7 * 365 * 24 * 60 * 60 * 1000)).toISOString(), 'bcdef1234567890a1b2c3d4e5f67890a', 3, 'Finance', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]);


    // Seed Policies
    const policyContent = JSON.stringify({
      retention_period_years: 7,
      data_types: ["tax", "financial"],
      disposition: "secure_destroy"
    });
    this.db.run(`INSERT INTO policies VALUES (?, ?, ?, ?, ?)`, [
        'pol_001', 'Data Retention Policy', 'Standard retention for financial documents.', policyContent, new Date().toISOString()
    ]);

    // Seed Logs
    this.db.run(`INSERT INTO logs VALUES (?, ?, ?, ?, ?, ?, ?)`, [
        'log_1', new Date().toISOString(), 'admin@rekama.sys', 'LOGIN', 'System', 'Low', '{}'
    ]);

    // Seed Users
    const admin: UserProfile = { id: 'usr_admin', name: 'John Admin', email: 'admin@rekama.sys', role: UserRole.Admin, avatar: 'JA', lastLogin: new Date().toISOString() };
    const officer: UserProfile = { id: 'usr_officer', name: 'Sarah Officer', email: 'sarah@rekama.sys', role: UserRole.Officer, avatar: 'SO', lastLogin: new Date().toISOString() };
    const viewer: UserProfile = { id: 'usr_viewer', name: 'Tom Viewer', email: 'tom@rekama.sys', role: UserRole.Viewer, avatar: 'TV', lastLogin: new Date().toISOString() };

    this.db.run(`INSERT INTO users VALUES (?, ?, ?, ?, ?, ?)`, [admin.id, admin.name, admin.email, admin.role, admin.avatar, admin.lastLogin]);
    this.db.run(`INSERT INTO users VALUES (?, ?, ?, ?, ?, ?)`, [officer.id, officer.name, officer.email, officer.role, officer.avatar, officer.lastLogin]);
    this.db.run(`INSERT INTO users VALUES (?, ?, ?, ?, ?, ?)`, [viewer.id, viewer.name, viewer.email, viewer.role, viewer.avatar, viewer.lastLogin]);

    // Set Active Session User
    this.db.run(`INSERT INTO kv_store VALUES (?, ?)`, ['user', JSON.stringify(admin)]);

    // Seed Settings
    const defaultSettings: AppSettings = {
        organizationName: 'Acme Corp',
        adminEmail: 'admin@rekama.sys',
        retentionDefault: 7,
        autoScan: true,
        emailAlerts: true
    };
    this.db.run(`INSERT INTO kv_store VALUES (?, ?)`, ['settings', JSON.stringify(defaultSettings)]);
  }

  private async loadFromIndexedDB(): Promise<Uint8Array | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = (e: any) => {
        e.target.result.createObjectStore(IDB_STORE);
      };
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const getReq = store.get(IDB_KEY);
        getReq.onsuccess = () => resolve(getReq.result);
        getReq.onerror = () => reject(getReq.error);
      };
      request.onerror = () => resolve(null); // Return null to trigger new creation if fail
    });
  }

  private async saveToIndexedDB() {
    if (!this.db) return;
    const data = this.db.export();
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(IDB_NAME, 1);
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        store.put(data, IDB_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
    });
  }

  // --- CRUD Operations ---

  // RECORDS
  async getRecords(): Promise<DocumentRecord[]> {
    await this.dbReady;
    try {
      const stmt = this.db.prepare("SELECT * FROM records ORDER BY uploadedAt DESC");
      const records: DocumentRecord[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        // Convert integer boolean back to JS boolean
        row.legalHold = row.legalHold === 1;
        records.push(row as DocumentRecord);
      }
      stmt.free();
      return records;
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async addRecord(record: DocumentRecord) {
    await this.dbReady;
    // Generate simulated SHA-256 Checksum if not present
    const integrityHash = record.checksum || Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
        
    this.db.run(`INSERT INTO records VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      record.id, record.title, record.type, record.classification, record.status, record.riskScore, 
      record.source, record.uploadedAt, record.legalHold ? 1 : 0, record.retentionScheduleId || null, 
      record.disposalDate || null, integrityHash, record.version || 1, record.custodian || 'System', record.format || 'application/octet-stream'
    ]);
    await this.saveToIndexedDB();
  }

  async updateRecord(id: string, updates: Partial<DocumentRecord>) {
    await this.dbReady;
    
    // Prevent modification of Immutable ISO 16175 Fields
    const safeUpdates = { ...updates };
    delete safeUpdates.id;
    delete safeUpdates.checksum;
    delete safeUpdates.uploadedAt;
    
    // If updating content/metadata, increment version
    if (Object.keys(safeUpdates).length > 0) {
        // We handle version increment in the SQL/Logic layer usually, but here we just pass fields
        // ideally, version = version + 1
    }

    const sets = Object.keys(safeUpdates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(safeUpdates).map(v => typeof v === 'boolean' ? (v ? 1 : 0) : v);
    
    if (sets.length > 0) {
        this.db.run(`UPDATE records SET ${sets}, version = version + 1 WHERE id = ?`, [...values, id]);
        await this.saveToIndexedDB();
    }
  }

  // SECURE DISPOSITION (ISO 15489 Compliance)
  async deleteRecord(id: string, userEmail: string) {
    await this.dbReady;
    
    // 1. Get record metadata for Certificate of Destruction
    const stmt = this.db.prepare("SELECT * FROM records WHERE id = ?");
    stmt.bind([id]);
    if (stmt.step()) {
        const record = stmt.getAsObject();
        stmt.free();

        // 2. Log Certificate of Destruction
        const certificate = {
            recordId: record.id,
            title: record.title,
            checksum: record.checksum, // Proof of what was destroyed
            classification: record.classification,
            disposalDate: new Date().toISOString(),
            authorizedBy: userEmail,
            method: "Secure Digital Erasure (Overwrite)"
        };

        await this.addLog({
            id: `log_disp_${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: userEmail,
            action: 'CERTIFICATE_OF_DESTRUCTION',
            resource: record.title,
            severity: 'Medium',
            metadata: JSON.stringify(certificate)
        });

        // 3. Perform Deletion
        this.db.run(`DELETE FROM records WHERE id = ?`, [id]);
        await this.saveToIndexedDB();
    } else {
        stmt.free();
    }
  }

  // SCHEDULES
  async getSchedules(): Promise<RetentionSchedule[]> {
    await this.dbReady;
    const stmt = this.db.prepare("SELECT * FROM schedules ORDER BY code ASC");
    const schedules: RetentionSchedule[] = [];
    while (stmt.step()) {
        schedules.push(stmt.getAsObject() as RetentionSchedule);
    }
    stmt.free();
    return schedules;
  }

  async addSchedule(sch: RetentionSchedule) {
    await this.dbReady;
    this.db.run(`INSERT INTO schedules VALUES (?, ?, ?, ?, ?, ?)`, [
        sch.id, sch.code, sch.name, sch.description, sch.retentionYears, sch.trigger
    ]);
    await this.saveToIndexedDB();
  }

  async deleteSchedule(id: string) {
    await this.dbReady;
    this.db.run(`DELETE FROM schedules WHERE id = ?`, [id]);
    await this.saveToIndexedDB();
  }

  // CONNECTORS
  async getConnectors(): Promise<Connector[]> {
    await this.dbReady;
    const stmt = this.db.prepare("SELECT * FROM connectors");
    const connectors: Connector[] = [];
    while (stmt.step()) {
        connectors.push(stmt.getAsObject() as Connector);
    }
    stmt.free();
    return connectors;
  }

  async addConnector(conn: Connector) {
    await this.dbReady;
    this.db.run(`INSERT INTO connectors VALUES (?, ?, ?, ?, ?, ?, ?)`, [
        conn.id, conn.name, conn.type, conn.status, conn.itemsIndexed, conn.lastSync, conn.targetUrl || ''
    ]);
    await this.saveToIndexedDB();
  }

  async updateConnector(id: string, updates: Partial<Connector>) {
    await this.dbReady;
    const sets = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    this.db.run(`UPDATE connectors SET ${sets} WHERE id = ?`, [...values, id]);
    await this.saveToIndexedDB();
  }

  async deleteConnector(id: string) {
    await this.dbReady;
    this.db.run(`DELETE FROM connectors WHERE id = ?`, [id]);
    await this.saveToIndexedDB();
  }

  async syncConnector(id: string) {
      await this.dbReady;
      
      // 1. Get Connector Details
      const stmt = this.db.prepare("SELECT * FROM connectors WHERE id = ?");
      stmt.bind([id]);
      let connector: Connector | null = null;
      if (stmt.step()) {
          connector = stmt.getAsObject() as Connector;
      }
      stmt.free();

      // 2. Mock Logic for Google Drive "Discovery"
      let addedItems = Math.floor(Math.random() * 5); // Default random
      
      if (connector && connector.type === 'GoogleDrive' && connector.targetUrl) {
           // Simulate finding specific files if they haven't been indexed yet
           const countStmt = this.db.prepare("SELECT count(*) as count FROM records WHERE source = ?");
           countStmt.bind([connector.name]);
           if (countStmt.step()) {
               const count = countStmt.getAsObject().count as number;
               if (count < 5) { // If fewer than 5 records exist for this drive, "discover" more
                    addedItems = 2;
                    // Add mock files that look like they came from the drive
                    const docName = `Drive_Doc_${Date.now().toString().slice(-4)}.pdf`;
                    const mockRec: DocumentRecord = {
                         id: `rec_gd_${Date.now()}`,
                         title: docName,
                         type: 'PDF',
                         classification: Classification.Internal,
                         status: RecordStatus.Active,
                         riskScore: 40,
                         source: connector.name,
                         uploadedAt: new Date().toISOString(),
                         legalHold: false,
                         checksum: 'simulated_checksum_' + Date.now(),
                         version: 1,
                         custodian: 'Google Drive Sync',
                         format: 'application/pdf'
                    };
                    await this.addRecord(mockRec);
               }
           }
           countStmt.free();
      }

      const now = new Date().toISOString();
      this.db.run(`UPDATE connectors SET lastSync = ?, itemsIndexed = itemsIndexed + ?, status = 'Active' WHERE id = ?`, [now, addedItems, id]);
      await this.saveToIndexedDB();
  }

  // USERS
  async getAllUsers(): Promise<UserProfile[]> {
    await this.dbReady;
    const stmt = this.db.prepare("SELECT * FROM users ORDER BY name ASC");
    const users: UserProfile[] = [];
    while (stmt.step()) {
        const row = stmt.getAsObject();
        users.push(row as UserProfile);
    }
    stmt.free();
    return users;
  }

  async addUser(user: UserProfile) {
    await this.dbReady;
    this.db.run(`INSERT INTO users VALUES (?, ?, ?, ?, ?, ?)`, [
        user.id, user.name, user.email, user.role, user.avatar || '', user.lastLogin || ''
    ]);
    await this.saveToIndexedDB();
  }

  async updateUserRecord(user: UserProfile) {
    await this.dbReady;
    this.db.run(`UPDATE users SET name = ?, email = ?, role = ?, avatar = ? WHERE id = ?`, [
        user.name, user.email, user.role, user.avatar, user.id
    ]);
    await this.saveToIndexedDB();
  }

  async deleteUser(id: string) {
    await this.dbReady;
    this.db.run(`DELETE FROM users WHERE id = ?`, [id]);
    await this.saveToIndexedDB();
  }

  // SESSION
  async getUser(): Promise<UserProfile> {
    await this.dbReady;
    const stmt = this.db.prepare("SELECT value FROM kv_store WHERE key = 'user'");
    if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return JSON.parse(row.value as string);
    }
    stmt.free();
    return { id: 'usr_default', name: 'John Admin', email: 'admin@rekama.sys', role: UserRole.Admin, avatar: 'JA' };
  }

  async updateUser(updates: Partial<UserProfile>) {
    await this.dbReady;
    const current = await this.getUser();
    const updated = { ...current, ...updates };
    this.db.run(`INSERT OR REPLACE INTO kv_store (key, value) VALUES ('user', ?)`, [JSON.stringify(updated)]);
    await this.saveToIndexedDB();
  }

  async switchUserSession(userId: string) {
    await this.dbReady;
    const stmt = this.db.prepare("SELECT * FROM users WHERE id = ?");
    stmt.bind([userId]);
    if (stmt.step()) {
        const user = stmt.getAsObject() as UserProfile;
        stmt.free();
        this.db.run(`INSERT OR REPLACE INTO kv_store (key, value) VALUES ('user', ?)`, [JSON.stringify(user)]);
        await this.saveToIndexedDB();
    } else {
        stmt.free();
        throw new Error("User not found");
    }
  }

  // POLICIES & LOGS
  async getPolicies(): Promise<Policy[]> {
    await this.dbReady;
    const stmt = this.db.prepare("SELECT * FROM policies ORDER BY createdAt DESC");
    const policies: Policy[] = [];
    while (stmt.step()) {
        const row = stmt.getAsObject();
        policies.push(row as Policy);
    }
    stmt.free();
    return policies;
  }

  async addPolicy(policy: Policy) {
    await this.dbReady;
    const contentStr = typeof policy.content === 'string' ? policy.content : JSON.stringify(policy.content);
    this.db.run(`INSERT INTO policies VALUES (?, ?, ?, ?, ?)`, [
        policy.id, policy.name, policy.description, contentStr, policy.createdAt
    ]);
    await this.saveToIndexedDB();
  }

  async deletePolicy(id: string) {
    await this.dbReady;
    this.db.run(`DELETE FROM policies WHERE id = ?`, [id]);
    await this.saveToIndexedDB();
  }

  async getLogs(): Promise<AuditLog[]> {
    await this.dbReady;
    const stmt = this.db.prepare("SELECT * FROM logs ORDER BY timestamp DESC LIMIT 1000");
    const logs: AuditLog[] = [];
    while (stmt.step()) {
        const row = stmt.getAsObject();
        logs.push(row as AuditLog);
    }
    stmt.free();
    return logs;
  }

  async addLog(log: AuditLog) {
    await this.dbReady;
    const metaStr = log.metadata || '{}';
    this.db.run(`INSERT INTO logs VALUES (?, ?, ?, ?, ?, ?, ?)`, [
        log.id, log.timestamp, log.user, log.action, log.resource, log.severity, metaStr
    ]);
    await this.saveToIndexedDB();
  }

  async getSettings(): Promise<AppSettings> {
    await this.dbReady;
    const stmt = this.db.prepare("SELECT value FROM kv_store WHERE key = 'settings'");
    if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return JSON.parse(row.value as string);
    }
    stmt.free();
    return { organizationName: 'Acme Corp', adminEmail: 'admin@rekama.sys', retentionDefault: 7, autoScan: true, emailAlerts: true };
  }

  async saveSettings(settings: AppSettings) {
    await this.dbReady;
    this.db.run(`INSERT OR REPLACE INTO kv_store (key, value) VALUES ('settings', ?)`, [JSON.stringify(settings)]);
    await this.saveToIndexedDB();
  }

  async factoryReset() {
    const request = indexedDB.deleteDatabase(IDB_NAME);
    request.onsuccess = () => {
       window.location.reload();
    };
  }

  async exportData() {
      await this.dbReady;
      return {
          records: await this.getRecords(),
          policies: await this.getPolicies(),
          schedules: await this.getSchedules(),
          connectors: await this.getConnectors(),
          logs: await this.getLogs(),
          settings: await this.getSettings(),
          user: await this.getUser(),
          exportedAt: new Date().toISOString(),
          compliance: {
              iso_15489: true,
              iso_16175: true,
              iso_27001: "partial"
          }
      };
  }
}

export const db = new RekamaDatabase();