
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
