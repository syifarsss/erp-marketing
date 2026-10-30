-- 1. Users/Operators
CREATE TABLE IF NOT EXISTS User (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(191) NOT NULL UNIQUE,
  name VARCHAR(191) DEFAULT NULL,
  email VARCHAR(191) DEFAULT NULL UNIQUE,
  password VARCHAR(191) NOT NULL,
  roleId INT NOT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  is_approved TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Clients/Leads (CRM)
CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255) NULL,
  industry VARCHAR(100) NULL,
  source VARCHAR(100) NULL,
  last_contact DATETIME NULL,
  lead_score INT DEFAULT 0,
  status ENUM('Lead', 'Proposal', 'Hold', 'Loss', 'Won', 'Done') NOT NULL DEFAULT 'Lead',
  value DECIMAL(15, 2) DEFAULT 0.00,
  owner_id INT NULL,
  verified BOOLEAN DEFAULT FALSE,
  phone VARCHAR(50) NULL,
  logo_url MEDIUMTEXT NULL,
  location VARCHAR(255) NULL DEFAULT 'Jakarta',
  company_size VARCHAR(50) NULL DEFAULT '50-200',
  deadline DATE NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES User(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Client Contacts (CRM details panel)
CREATE TABLE IF NOT EXISTS client_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NULL,
  email VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Lead Interactions/Notes
CREATE TABLE IF NOT EXISTS lead_interactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'Call', 'Meeting', 'Email', 'Note'
  notes TEXT NOT NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES User(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Campaigns (Marketing Digital)
CREATE TABLE IF NOT EXISTS campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  channel VARCHAR(100) NOT NULL, -- 'Facebook Ads', 'Google Ads', 'TikTok Ads', 'Instagram Ads', etc.
  budget DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  spend DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  conversion INT NOT NULL DEFAULT 0,
  revenue DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  status ENUM('Active', 'Completed', 'Paused', 'Planned') NOT NULL DEFAULT 'Planned',
  start_date DATE NULL,
  end_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Asset Library (Marketing Digital assets)
CREATE TABLE IF NOT EXISTS assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  file_type ENUM('PDF', 'Image', 'Template', 'Video') NOT NULL DEFAULT 'Image',
  tags VARCHAR(255) NULL, -- comma separated tags, e.g. "promo, facebook, summer"
  file_url LONGTEXT NULL,
  download_count INT DEFAULT 0,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  version_history LONGTEXT NULL,
  FOREIGN KEY (created_by) REFERENCES User(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Social Media Content (Content Calendar)
CREATE TABLE IF NOT EXISTS social_media_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  platform VARCHAR(100) NOT NULL, -- 'Instagram', 'LinkedIn', 'Facebook', 'TikTok'
  content TEXT NOT NULL,
  media_url VARCHAR(255) NULL,
  schedule_time DATETIME NOT NULL,
  status ENUM('Draft', 'Scheduled', 'Published') NOT NULL DEFAULT 'Draft',
  engagement_likes INT DEFAULT 0,
  engagement_comments INT DEFAULT 0,
  leads_generated INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Prospect Subtasks (Follow Up detail view)
CREATE TABLE IF NOT EXISTS prospect_subtasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  resource_link VARCHAR(255) NULL,
  deadline DATE NULL,
  assigned_to INT NULL,
  status ENUM('MT', 'IFR', 'EX', 'IFC', 'DONE') NOT NULL DEFAULT 'MT',
  progress INT DEFAULT 0,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES User(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES User(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Projects
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  budget DECIMAL(15, 2) DEFAULT 0.00,
  status ENUM('Planning', 'In Progress', 'On Hold', 'Completed') NOT NULL DEFAULT 'Planning',
  progress INT DEFAULT 0,
  deadline DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. SEO Configs (Marketing SEO Optimization)
CREATE TABLE IF NOT EXISTS seo_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content_type VARCHAR(100) DEFAULT 'Landing Page',
  meta_title VARCHAR(255) NOT NULL,
  meta_description TEXT NOT NULL,
  focus_keyword VARCHAR(255) NOT NULL,
  search_intent VARCHAR(100) DEFAULT 'Informational',
  schema_type VARCHAR(100) DEFAULT 'Organization',
  schema_json TEXT NULL,
  og_title VARCHAR(255) NULL,
  og_description TEXT NULL,
  og_image TEXT NULL,
  og_type VARCHAR(50) DEFAULT 'website',
  meta_robots VARCHAR(100) DEFAULT 'index, follow',
  canonical_url VARCHAR(255) NULL,
  score INT DEFAULT 85,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES User(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. User Activity Logs (Real-time tracking & frequency analytics)
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  username VARCHAR(191) NOT NULL,
  name VARCHAR(191) NULL,
  role VARCHAR(50) DEFAULT 'Operator',
  action VARCHAR(255) NOT NULL,
  module VARCHAR(100) NOT NULL DEFAULT 'marketing',
  page_url VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 12. Performance Targets (target revenue and project count per year per project type)
CREATE TABLE IF NOT EXISTS performance_targets (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  tahun           INT NOT NULL,
  jenis_project   VARCHAR(100) NOT NULL,
  target_revenue  DECIMAL(15, 4) NOT NULL DEFAULT 0,
  target_project  INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tahun_jenis (tahun, jenis_project)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Performance Realizations (individual realization records from kanban or manual entry)
CREATE TABLE IF NOT EXISTS performance_realizations (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  tahun           INT NOT NULL,
  jenis_project   VARCHAR(100) NOT NULL,
  nama_project    VARCHAR(255) NOT NULL,
  nilai_revenue   DECIMAL(20, 2) NOT NULL DEFAULT 0,
  tanggal_selesai DATE NOT NULL,
  sumber          ENUM('manual', 'kanban') NOT NULL DEFAULT 'manual',
  kanban_card_id  VARCHAR(100) NULL,
  dibuat_oleh     INT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tahun_jenis (tahun, jenis_project),
  INDEX idx_kanban_card (kanban_card_id),
  FOREIGN KEY (dibuat_oleh) REFERENCES User(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
