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

    stage('SAST (Semgrep)') {
      steps {
        sh '''
          mkdir -p "${REPORTS_DIR}"
          docker run --rm -v "$PWD:/src" -w /src semgrep/semgrep:latest \
            semgrep scan --config p/nodejs --config p/expressjs --error --metrics=off \
            .
        '''
      }
    }

    stage('Secret Scan') {
      steps {
        sh '''
          mkdir -p "${REPORTS_DIR}"
          docker run --rm \
              -v "$PWD:/repo" -w /repo \
              zricethezav/gitleaks:latest \
              detect --source=/repo \
                --report-format json \
                --report-path "reports/gitleaks.json" \
                --redact

          docker run --rm -v "$PWD:/work" -w /work python:3.12-alpine \
          python - <<'PY'
          import json
          p="reports/gitleaks.json"
          data=json.load(open(p, encoding="utf-8"))
          print(f"[Gitleaks] leaks found: {len(data)}")
          for leak in data[:50]:
              print(f"- {leak.get('RuleID')} {leak.get('File')}:{leak.get('StartLine')}")
          
          # Uncomment to fail the build on any leak
          # data=json.load(open("reports/gitleaks.json", encoding="utf-8"))
          # raise SystemExit(1 if len(data)>0 else 0)
          PY
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

    stage('DAST (OWASP ZAP baseline)') {
      steps {
        sh '''
          mkdir -p "${REPORTS_DIR}"
          docker run --rm \
            --network devsecopsnet \
            -v "$PWD/${REPORTS_DIR}:/zap/wrk" \
            owasp/zap2docker-weekly:latest \
            zap-baseline.py -t http://app:3000 -r zap.html -J zap.json -w zap.md
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
  }
}
