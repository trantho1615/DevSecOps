# DevSecOps Node.js demo (GitHub + Jenkins + DockerHub) — SAST (Semgrep) + DAST (OWASP ZAP)
Hello
Repo này là một ứng dụng Node.js (Express) rất đơn giản + pipeline Jenkins chạy:
- Unit tests (Jest)
- **SAST**: Semgrep (chạy bằng Docker)
- Build & push Docker image lên **Docker Hub**
- Deploy staging bằng Docker Compose (local trên Jenkins agent)
- **DAST**: OWASP ZAP baseline scan (chạy bằng Docker)
- Archive reports trong Jenkins

## 1) Chạy local nhanh
```bash
npm ci
npm test
npm start
# mở http://localhost:3000
```

## 2) Build & run bằng Docker
```bash
docker build -t devsecops-node-demo:local .
docker run --rm -p 3000:3000 devsecops-node-demo:local
```

## 3) Staging bằng Docker Compose
```bash
docker compose -f docker-compose.staging.yml up -d --build
curl -fsS http://localhost:3000/health
docker compose -f docker-compose.staging.yml down -v
```

## 4) Jenkins setup (tóm tắt)
### Yêu cầu trên Jenkins agent
- Docker + Docker Compose v2
- Node.js (>= 18) hoặc bạn có thể chạy tests trong container (tuỳ chỉnh Jenkinsfile)

### Jenkins credentials
Tạo 2 secret text hoặc username/password:
- `dockerhub-user` (username DockerHub)
- `dockerhub-token` (DockerHub access token)

### Jenkins job
Khuyên dùng **Multibranch Pipeline** trỏ tới GitHub repo chứa `Jenkinsfile`.
Sau đó cấu hình webhook GitHub để trigger build khi push/PR.

## 5) Reports
Pipeline tạo thư mục `reports/`:
- `reports/semgrep.sarif`, `reports/semgrep.json`
- `reports/zap.html`, `reports/zap.json`, `reports/zap.md`

> Lưu ý: Đây là demo. Đừng dùng nguyên xi cho production; hãy tinh chỉnh rules, gating và deploy strategy.
