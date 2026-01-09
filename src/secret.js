const goodConfig = {
  apiKey: process.env.API_KEY,        // ✅ Đọc từ env
  secretKey: process.env.SECRET_KEY,  // ✅ Không hardcode
  dbPassword: process.env.DB_PASSWORD // ✅ An toàn
};

module.exports = {
  goodConfig
};
