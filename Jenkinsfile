pipeline {
  agent any
  options {
    timestamps()
    disableConcurrentBuilds()
  }
  environment {
    APP_NAME = "devsecops-jenkins"
    DOCKER_IMAGE = "trantho16/devsecops-jenkins"
    REPORTS_DIR = "reports"
  }
  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install & Unit Test') {
      steps {
        sh '''
          mkdir -p "${REPORTS_DIR}"
          docker run --rm \
            -v "$PWD:/app" -w /app \
            node:20-alpine \
            sh -lc "npm ci && npm test"
        '''
      }
    }

    // ========== SAST: Semgrep (với report export) ==========
    stage('SAST (Semgrep)') {
      steps {
        sh '''
          mkdir -p "${REPORTS_DIR}"
          
          set +e
          # Chạy Semgrep lần 1: xuất JSON
          docker run --rm -v "$PWD:/src" -w /src semgrep/semgrep:latest \
            semgrep scan \
              --config p/nodejs \
              --config p/expressjs \
              --metrics=off \
              --json --output /src/${REPORTS_DIR}/semgrep.json \
              .
          RC=$?
          
          # Chạy Semgrep lần 2: xuất SARIF (nếu cần)
          docker run --rm -v "$PWD:/src" -w /src semgrep/semgrep:latest \
            semgrep scan \
              --config p/nodejs \
              --config p/expressjs \
              --metrics=off \
              --sarif --output /src/${REPORTS_DIR}/semgrep.sarif \
              . || true
          set -e
          
          # Parse và hiển thị kết quả Semgrep
          docker run --rm -v "$PWD:/work" -w /work python:3.12-alpine \
            python - <<'PY'
import json, os
p = "reports/semgrep.json"
if os.path.exists(p) and os.path.getsize(p) > 0:
    try:
        data = json.load(open(p, encoding="utf-8"))
        results = data.get("results", [])
        errors = data.get("errors", [])
        severity_counts = {}
        for r in results:
            sev = r.get("extra", {}).get("severity", "INFO")
            severity_counts[sev] = severity_counts.get(sev, 0) + 1
        total = len(results)
        status = "❌" if severity_counts.get("ERROR", 0) > 0 else "⚠️" if severity_counts.get("WARNING", 0) > 0 else "✅"
        print(f"[Semgrep] {status} SAST findings: {severity_counts} (Total: {total})")
        if total > 0:
            print("[Semgrep] Top issues:")
            for r in results[:10]:
                rule = r.get("check_id", "")
                path = r.get("path", "")
                line = r.get("start", {}).get("line", 0)
                msg = r.get("extra", {}).get("message", "")[:80]
                print(f"  - [{r.get('extra', {}).get('severity', 'INFO')}] {path}:{line} - {rule}")
    except Exception as e:
        print(f"[Semgrep] Parse error: {e}")
else:
    print("[Semgrep] ✅ No issues found or report not generated.")
PY
          
          echo "[Semgrep] Scan completed with exit code: $RC"
          
          # === UNCOMMENT BELOW TO FAIL PIPELINE ON SAST FINDINGS ===
          # if [ "$RC" -ne 0 ]; then
          #   echo "[Semgrep] SAST vulnerabilities detected! Failing pipeline."
          #   exit 1
          # fi
          
          exit 0
        '''
      }
    }

    // ========== Secret Scan với Gitleaks ==========
    stage('Secret Scan (Gitleaks)') {
      steps {
        sh '''
          mkdir -p "${REPORTS_DIR}"

          set +e
          docker run --rm \
            -v "$PWD:/repo" -w /repo \
            zricethezav/gitleaks:latest \
            detect --source=/repo \
              --no-git \
              --report-format json \
              --report-path "${REPORTS_DIR}/gitleaks.json" \
              --redact
          RC=$?
          set -e

          if [ "$RC" -ne 0 ]; then
            echo "[Gitleaks] ❌ Secrets detected! Printing locations (redacted):"
            docker run --rm -v "$PWD:/work" -w /work python:3.12-alpine \
              python - <<'PY'
import json, os
p="reports/gitleaks.json"
data = json.load(open(p, encoding="utf-8")) if os.path.exists(p) else []
print(f"[Gitleaks] Total leaks found: {len(data)}")
for leak in data[:50]:
    rule = leak.get("RuleID")
    f = leak.get("File")
    line = leak.get("StartLine")
    desc = leak.get("Description","")
    print(f"  - [{rule}] {f}:{line} - {desc}")
PY
          else
            echo "[Gitleaks] ✅ No secrets detected."
          fi

          # NCOMMENT BELOW TO FAIL PIPELINE ON SECRET LEAKS
          if [ "$RC" -ne 0 ]; then
          echo "[Gitleaks] Secrets found! Failing pipeline."
          exit 1
          fi
          
          exit 0
        '''
      }
    }

    // ========== Dependency Scan với npm audit ==========
    stage('Dependency Scan (npm audit)') {
      steps {
        sh '''
          mkdir -p "${REPORTS_DIR}"
          
          set +e
          docker run --rm \
            -v "$PWD:/app" -w /app \
            node:20-alpine \
            sh -c "npm audit --json > ${REPORTS_DIR}/npm-audit.json 2>&1 || true"
          set -e
          
          # Parse và hiển thị kết quả
          docker run --rm -v "$PWD:/work" -w /work python:3.12-alpine \
            python - <<'PY'
import json, os, sys
p = "reports/npm-audit.json"
if os.path.exists(p) and os.path.getsize(p) > 0:
    try:
        data = json.load(open(p, encoding="utf-8"))
        vuln = data.get("metadata", {}).get("vulnerabilities", {})
        total = vuln.get("total", 0)
        critical = vuln.get("critical", 0)
        high = vuln.get("high", 0)
        moderate = vuln.get("moderate", 0)
        low = vuln.get("low", 0)
        status = "❌" if (critical > 0 or high > 0) else "✅"
        print(f"[npm audit] {status} Vulnerabilities: CRITICAL={critical}, HIGH={high}, MODERATE={moderate}, LOW={low}, TOTAL={total}")
        if critical > 0 or high > 0:
            print("[npm audit] ⚠️  WARNING: Critical/High vulnerabilities found!")
    except Exception as e:
        print(f"[npm audit] Parse error: {e}")
else:
    print("[npm audit] No audit data found.")
PY

          # === UNCOMMENT BELOW TO FAIL PIPELINE ON CRITICAL/HIGH VULNERABILITIES ===
          # docker run --rm -v "$PWD:/work" -w /work python:3.12-alpine \
          #   python -c "
          # import json, sys
          # data = json.load(open('reports/npm-audit.json'))
          # vuln = data.get('metadata', {}).get('vulnerabilities', {})
          # critical = vuln.get('critical', 0)
          # high = vuln.get('high', 0)
          # if critical > 0 or high > 0:
          #     print(f'[npm audit] Found {critical} CRITICAL and {high} HIGH vulnerabilities! Failing pipeline.')
          #     sys.exit(1)
          # "
          
          exit 0
        '''
      }
    }

    stage('Build Docker image') {
      steps {
        sh '''
          docker build -t devsecops-jenkins:local .
        '''
      }
    }

    // ========== Container Image Scan với Trivy ==========
    stage('Container Scan (Trivy)') {
      steps {
        sh '''
          mkdir -p "${REPORTS_DIR}"
          
          set +e
          docker run --rm \
            -v /var/run/docker.sock:/var/run/docker.sock \
            -v "$PWD/${REPORTS_DIR}:/output" \
            aquasec/trivy:latest image \
              --format json \
              --output /output/trivy.json \
              --severity CRITICAL,HIGH,MEDIUM \
              devsecops-jenkins:local
          RC=$?
          set -e
          
          # Tạo human-readable summary và đếm vulnerabilities
          docker run --rm -v "$PWD:/work" -w /work python:3.12-alpine \
            python - <<'PY'
import json, os
p = "reports/trivy.json"
if os.path.exists(p) and os.path.getsize(p) > 0:
    try:
        data = json.load(open(p, encoding="utf-8"))
        counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
        for result in data.get("Results", []):
            for vuln in result.get("Vulnerabilities", []):
                sev = vuln.get("Severity", "UNKNOWN")
                if sev in counts:
                    counts[sev] += 1
        status = "❌" if counts["CRITICAL"] > 0 else "⚠️" if counts["HIGH"] > 0 else "✅"
        print(f"[Trivy] {status} Container vulnerabilities: CRITICAL={counts['CRITICAL']}, HIGH={counts['HIGH']}, MEDIUM={counts['MEDIUM']}, LOW={counts['LOW']}")
        if counts["CRITICAL"] > 0:
            print("[Trivy] ⚠️  WARNING: Critical container vulnerabilities found!")
    except Exception as e:
        print(f"[Trivy] Parse error: {e}")
else:
    print("[Trivy] No scan data found.")
PY
          
          echo "[Trivy] Scan completed with exit code: $RC"
          
          # === UNCOMMENT BELOW TO FAIL PIPELINE ON CRITICAL CONTAINER VULNERABILITIES ===
          # docker run --rm -v "$PWD:/work" -w /work python:3.12-alpine \
          #   python -c "
          # import json, sys
          # data = json.load(open('reports/trivy.json'))
          # critical = sum(1 for r in data.get('Results', []) for v in r.get('Vulnerabilities', []) if v.get('Severity') == 'CRITICAL')
          # if critical > 0:
          #     print(f'[Trivy] Found {critical} CRITICAL container vulnerabilities! Failing pipeline.')
          #     sys.exit(1)
          # "
          
          exit 0
        '''
      }
    }

    stage('Push to DockerHub') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'dockerhub',
          usernameVariable: 'DOCKERHUB_CREDENTIALS_USR',
          passwordVariable: 'DOCKERHUB_CREDENTIALS_PSW'
        )]) {
          sh '''
            set -e

            IMAGE="$(echo "${DOCKERHUB_CREDENTIALS_USR}/devsecops-jenkins" | tr '[:upper:]' '[:lower:]')"

            echo "$DOCKERHUB_CREDENTIALS_PSW" | docker login -u "$DOCKERHUB_CREDENTIALS_USR" --password-stdin

            docker tag devsecops-jenkins:local "${IMAGE}:${GIT_COMMIT}"
            docker tag devsecops-jenkins:local "${IMAGE}:latest"

            docker push "${IMAGE}:${GIT_COMMIT}"
            docker push "${IMAGE}:latest"
          '''
        }
      }
    }

    stage('Deploy Staging (Docker Compose)') {
      steps {
        sh '''
          docker compose -f docker-compose.staging.yml up -d --build

          CID="$(docker compose -f docker-compose.staging.yml ps -q app)"
          for i in $(seq 1 30); do
            STATUS="$(docker inspect --format='{{.State.Health.Status}}' "$CID" 2>/dev/null || true)"
            echo "Health: $STATUS"
            if [ "$STATUS" = "healthy" ]; then
              echo "Staging is up"
              exit 0
            fi
            sleep 2
          done

          echo "Staging did not become healthy in time"
          docker compose -f docker-compose.staging.yml ps
          docker compose -f docker-compose.staging.yml logs --no-color --tail=200 app || true
          exit 1
        '''
      }
    }

    // ========== DAST với OWASP ZAP ==========
    stage('DAST (OWASP ZAP baseline)') {
      steps {
        sh '''
          mkdir -p "${REPORTS_DIR}"
          
          set +e
          docker run --rm \
            --network devsecopsnet \
            -v "$PWD/${REPORTS_DIR}:/zap/wrk/:rw" \
            -v "$PWD/security/zap.conf:/zap/wrk/zap.conf:ro" \
            zaproxy/zap-stable \
            zap-baseline.py \
              -t http://app:3000 \
              -r zap.html \
              -J zap.json \
              -w zap.md \
              -I
          RC=$?
          set -e
          
          # Parse và hiển thị kết quả ZAP
          docker run --rm -v "$PWD:/work" -w /work python:3.12-alpine \
            python - <<'PY'
import json, os
p = "reports/zap.json"
if os.path.exists(p) and os.path.getsize(p) > 0:
    try:
        data = json.load(open(p, encoding="utf-8"))
        alerts = data.get("site", [{}])[0].get("alerts", []) if data.get("site") else []
        high = sum(1 for a in alerts if a.get("riskcode") == "3")
        medium = sum(1 for a in alerts if a.get("riskcode") == "2")
        low = sum(1 for a in alerts if a.get("riskcode") == "1")
        info = sum(1 for a in alerts if a.get("riskcode") == "0")
        status = "❌" if high > 0 else "⚠️" if medium > 0 else "✅"
        print(f"[OWASP ZAP] {status} DAST findings: HIGH={high}, MEDIUM={medium}, LOW={low}, INFO={info}")
        if high > 0:
            print("[OWASP ZAP] ⚠️  WARNING: High risk vulnerabilities found!")
            for a in alerts:
                if a.get("riskcode") == "3":
                    print(f"  - [HIGH] {a.get('alert')}: {a.get('desc', '')[:100]}...")
    except Exception as e:
        print(f"[OWASP ZAP] Parse error: {e}")
else:
    print("[OWASP ZAP] No scan data found.")
PY
          
          echo "[OWASP ZAP] DAST scan completed with exit code: $RC"
          
          # === UNCOMMENT BELOW TO FAIL PIPELINE ON ZAP FINDINGS ===
          # if [ "$RC" -gt 0 ]; then
          #   echo "[OWASP ZAP] DAST vulnerabilities detected! Failing pipeline."
          #   exit 1
          # fi
          
          exit 0
        '''
      }
    }
  }

  post {
    always {
      sh '''
        # Best-effort cleanup
        docker compose -f docker-compose.staging.yml down -v || true
      '''
      junit allowEmptyResults: true, testResults: 'reports/junit.xml'
      archiveArtifacts artifacts: 'reports/*', allowEmptyArchive: true
    }
    // === UNCOMMENT BELOW FOR NOTIFICATIONS ===
    // success {
    //   echo "Pipeline completed successfully!"
    // }
    // failure {
    //   echo "Pipeline failed! Check reports for details."
    // }
  }
}
