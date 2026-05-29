import { pool } from '../lib/db';

const ANALYTICS_DDL = [
  `CREATE TABLE IF NOT EXISTS \`Visit\` (
    \`id\` varchar(36) NOT NULL,
    \`sessionId\` varchar(255) NOT NULL,
    \`userAgent\` text,
    \`ip\` varchar(45),
    \`referrer\` text,
    \`utmSource\` varchar(255),
    \`utmMedium\` varchar(255),
    \`utmCampaign\` varchar(255),
    \`country\` varchar(2),
    \`city\` varchar(100),
    \`device\` varchar(50),
    \`browser\` varchar(50),
    \`os\` varchar(50),
    \`isNewVisitor\` int NOT NULL DEFAULT 1,
    \`landingPage\` text,
    \`exitPage\` text,
    \`duration\` int DEFAULT 0,
    \`pageViews\` int NOT NULL DEFAULT 0,
    \`converted\` int NOT NULL DEFAULT 0,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`PageView\` (
    \`id\` varchar(36) NOT NULL,
    \`visitId\` varchar(36) NOT NULL,
    \`url\` text NOT NULL,
    \`title\` text,
    \`referrer\` text,
    \`timeOnPage\` int DEFAULT 0,
    \`scrollDepth\` int DEFAULT 0,
    \`isExit\` int NOT NULL DEFAULT 0,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    KEY \`PageView_visitId_idx\` (\`visitId\`),
    CONSTRAINT \`PageView_visitId_Visit_id_fk\` FOREIGN KEY (\`visitId\`) REFERENCES \`Visit\` (\`id\`) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS \`AnalyticsEvent\` (
    \`id\` varchar(36) NOT NULL,
    \`visitId\` varchar(36) NOT NULL,
    \`type\` enum('click','view','form_submit','purchase','add_to_cart','remove_from_cart','checkout_start','checkout_complete','error') NOT NULL,
    \`category\` varchar(100),
    \`action\` varchar(100),
    \`label\` text,
    \`value\` double,
    \`metadata\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    KEY \`AnalyticsEvent_visitId_idx\` (\`visitId\`),
    CONSTRAINT \`AnalyticsEvent_visitId_Visit_id_fk\` FOREIGN KEY (\`visitId\`) REFERENCES \`Visit\` (\`id\`) ON DELETE CASCADE
  )`,
];

export async function ensureAnalyticsTables(): Promise<void> {
  for (const statement of ANALYTICS_DDL) {
    await pool.execute(statement);
  }
  console.log('[db] Analytics tables ensured (Visit, PageView, AnalyticsEvent)');
}
