pipeline {
  agent any
  options {
    timestamps()
    disableConcurrentBuilds()
  }
  environment {
    APP_NAME = "devsecops-node-demo"
    DOCKER_IMAGE = "YOUR_DOCKERHUB_USERNAME/devsecops-node-demo"
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
          npm ci
          npm test
        '''
      }
    }

    stage('SAST (Semgrep)') {
      steps {
        sh '''
          mkdir -p "${REPORTS_DIR}"
          # Semgrep: use docker image to avoid installing on agent
          docker run --rm             -v "$PWD:/src" -w /src             semgrep/semgrep:latest             semgrep scan --config auto --error --metrics=off               --sarif --sarif-output "${REPORTS_DIR}/semgrep.sarif"               --json --output "${REPORTS_DIR}/semgrep.json"               .
        '''
      }
    }

    stage('Build Docker image') {
      steps {
        sh '''
          docker build -t "${DOCKER_IMAGE}:${GIT_COMMIT}" -t "${DOCKER_IMAGE}:latest" .
        '''
      }
    }

    stage('Push to DockerHub') {
      steps {
        withCredentials([
          string(credentialsId: 'dockerhub-user', variable: 'DOCKERHUB_USER'),
          string(credentialsId: 'dockerhub-token', variable: 'DOCKERHUB_TOKEN')
        ]) {
          sh '''
            echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USER" --password-stdin
            docker push "${DOCKER_IMAGE}:${GIT_COMMIT}"
            docker push "${DOCKER_IMAGE}:latest"
          '''
        }
      }
    }

    stage('Deploy Staging (Docker Compose)') {
      steps {
        sh '''
          docker compose -f docker-compose.staging.yml up -d --build
          # Wait until app is healthy (simple poll)
          for i in $(seq 1 30); do
            if curl -fsS http://localhost:3000/health >/dev/null 2>&1; then
              echo "Staging is up"
              exit 0
            fi
            sleep 2
          done
          echo "Staging did not become healthy in time"
          docker compose -f docker-compose.staging.yml ps
          exit 1
        '''
      }
    }

    stage('DAST (OWASP ZAP baseline)') {
      steps {
        sh '''
          mkdir -p "${REPORTS_DIR}"
          # Run ZAP baseline scan from official ZAP docker image against the staging service
          docker run --rm             --network devsecopsnet             -v "$PWD/${REPORTS_DIR}:/zap/wrk"             owasp/zap2docker-stable             zap-baseline.py               -t http://app:3000               -r zap.html               -J zap.json               -w zap.md
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
