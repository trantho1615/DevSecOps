// Hardcoded Password
const badUser = {
    username: "alice",
    password: "SuperSecret!123"
};

// Hardcoded API Key
const API_KEY = "sk-proj-abc123xyz789secretkey2024";
const OPENAI_API_KEY = "sk-1234567890abcdefghijklmnop";

// Database Password
const dbConfig = {
    host: "localhost",
    user: "admin",
    db_password: "MyDBPassword@2024!",
    database: "myapp"
};

// Secret Key / Token
const SECRET_KEY = "jwt-super-secret-key-12345678";
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo123";

// AWS Credentials
const awsCredentials = {
    accessKeyId: "AKIAIOSFODNN7EXAMPLE",  
    secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
};

// Private Key inline
const PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA0Z3VS5JJcds3xfn...demo\n-----END RSA PRIVATE KEY-----";

module.exports = { badUser, API_KEY, dbConfig, SECRET_KEY, awsCredentials };
