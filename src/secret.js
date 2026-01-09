/**
 * ============================================================
 * DEMO FILE: Secret Detection Test Cases
 * ============================================================
 * File này chứa các case để test Gitleaks secret scanner.
 * 
 * ❌ BAD CASES: Sẽ bị Gitleaks phát hiện
 * ✅ GOOD CASES: Cách làm đúng (không bị detect)
 * ============================================================
 */

// ============================================================
// ❌ BAD CASE 1: Hardcoded Password
// ============================================================
const badUser = {
  username: "alice",
  password: "SuperSecret!123"  // ❌ Gitleaks sẽ detect!
};

// ============================================================
// ❌ BAD CASE 2: Hardcoded API Key
// ============================================================
const API_KEY = "sk-proj-abc123xyz789secretkey2024";  // ❌ Detect!
const OPENAI_API_KEY = "sk-1234567890abcdefghijklmnop";  // ❌ Detect!

// ============================================================
// ❌ BAD CASE 3: Database Password
// ============================================================
const dbConfig = {
  host: "localhost",
  user: "admin",
  db_password: "MyDBPassword@2024!",  // ❌ Detect!
  database: "myapp"
};

// ============================================================
// ❌ BAD CASE 4: Secret Key / Token
// ============================================================
const SECRET_KEY = "jwt-super-secret-key-12345678";  // ❌ Detect!
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo123";  // ❌ Detect!

// ============================================================
// ❌ BAD CASE 5: AWS Credentials (fake)
// ============================================================
const awsCredentials = {
  accessKeyId: "AKIAIOSFODNN7EXAMPLE",  // ❌ Detect AWS Key pattern!
  secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"  // ❌ Detect!
};

// ============================================================
// ❌ BAD CASE 6: Private Key inline
// ============================================================
const PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA0Z3VS5JJcds3xfn...demo\n-----END RSA PRIVATE KEY-----";

// ============================================================
// ✅ GOOD CASE 1: Sử dụng Environment Variables
// ============================================================
const goodConfig = {
  apiKey: process.env.API_KEY,  // ✅ Đọc từ env
  secretKey: process.env.SECRET_KEY,  // ✅ Không hardcode
  dbPassword: process.env.DB_PASSWORD  // ✅ An toàn
};

// ============================================================
// ✅ GOOD CASE 2: Placeholder/Example values (thường được allow)
// ============================================================
const exampleConfig = {
  password: "changeme",  // ✅ Thường được skip (allowlist)
  apiKey: "your-api-key-here",  // ✅ Placeholder
  secret: "example"  // ✅ Placeholder
};

// ============================================================
// ✅ GOOD CASE 3: Config từ file riêng (không commit)
// ============================================================
// const config = require('./config.local.js'); // File này trong .gitignore

// ============================================================
// Export để test
// ============================================================
module.exports = {
  badUser,
  API_KEY,
  dbConfig,
  SECRET_KEY,
  goodConfig,
  exampleConfig
};
