# HAL's Penny - Monitoring Stack

This directory contains all monitoring-related files for the HAL's Penny application.

## 📁 Files Overview

### 🐳 Docker Configuration
- **`docker-compose.monitoring.yml`** - Docker Compose file for the monitoring stack
  - Prometheus (Port 9090)
  - Grafana (Port 3001) 
  - Node Exporter (Port 9100)

### 📊 Prometheus Configuration
- **`prometheus.yml`** - Prometheus configuration file
  - Scraping targets for HAL's Penny backend
  - Metrics collection intervals
  - Data retention policies

### 📈 Grafana Dashboards
- **`grafana-dashboard-golden-signals.json`** - Golden Signals dashboard
  - Traffic, Latency, Errors, Saturation metrics
  - Business metrics and AI service health
  - System performance monitoring

- **`grafana-dashboard-ai-analytics-fixed.json`** - AI Analytics dashboard
  - AI service usage patterns
  - Response times and error rates
  - Fallback system metrics

### 🚀 Setup Scripts
- **`setup-grafana-dashboard.sh`** - Automated Grafana dashboard setup
  - Prometheus data source configuration
  - Golden Signals dashboard import
  - Service health verification

- **`setup-ai-dashboard.sh`** - AI Analytics dashboard setup
  - AI-specific metrics dashboard
  - Service monitoring configuration

### 📚 Documentation
- **`MONITORING_SETUP.md`** - Comprehensive monitoring setup guide
  - Step-by-step installation
  - Configuration details
  - Troubleshooting guide

## 🚀 Quick Start

### 1. Start Monitoring Stack
```bash
cd monitoring/
docker-compose -f docker-compose.monitoring.yml up -d
```

### 2. Setup Grafana Dashboards
```bash
# Setup Golden Signals Dashboard
./setup-grafana-dashboard.sh

# Setup AI Analytics Dashboard  
./setup-ai-dashboard.sh
```

### 3. Access Services
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Node Exporter**: http://localhost:9100

## 📊 Key Metrics Tracked

### Business Metrics
- Total expenses created
- Expense amounts by category
- User engagement patterns
- AI service usage

### Technical Metrics
- API response times
- Database operation performance
- AI service response times
- Error rates and fallback usage
- System resource utilization

### AI Service Metrics
- Anthropic API calls and response times
- OpenAI API calls and response times
- Fallback system usage
- AI service error rates

## 🔧 Configuration

### Prometheus Targets
- **HAL's Penny Backend**: `host.docker.internal:3000`
- **Node Exporter**: `node-exporter:9100`

### Grafana Data Sources
- **Prometheus**: `http://prometheus:9090`
- **Auto-configured** during dashboard setup

## 🛠️ Maintenance

### Viewing Logs
```bash
# Monitoring stack logs
docker-compose -f docker-compose.monitoring.yml logs

# Specific service logs
docker-compose -f docker-compose.monitoring.yml logs prometheus
docker-compose -f docker-compose.monitoring.yml logs grafana
```

### Restarting Services
```bash
# Restart all monitoring services
docker-compose -f docker-compose.monitoring.yml restart

# Restart specific service
docker-compose -f docker-compose.monitoring.yml restart grafana
```

### Backup Dashboards
```bash
# Export dashboard configurations
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3001/api/dashboards/uid/golden-signals > golden-signals-backup.json
```

## 🚨 Troubleshooting

### Common Issues
1. **Prometheus can't scrape metrics**: Check if HAL's Penny backend is running on port 3000
2. **Grafana dashboards empty**: Verify Prometheus data source is configured
3. **Docker network issues**: Ensure `host.docker.internal` resolves correctly

### Health Checks
```bash
# Check Prometheus health
curl http://localhost:9090/-/healthy

# Check Grafana health  
curl http://localhost:3001/api/health

# Check HAL's Penny metrics
curl http://localhost:3000/metrics
```

## 📈 Dashboard Features

### Golden Signals Dashboard
- **Traffic**: Request rates and patterns
- **Latency**: Response time distributions
- **Errors**: Error rates and types
- **Saturation**: Resource utilization

### AI Analytics Dashboard
- **AI Service Health**: API availability and performance
- **Fallback Usage**: When and why fallbacks occur
- **Response Quality**: AI response times and accuracy
- **Cost Tracking**: API usage and costs

This monitoring stack provides comprehensive observability for the HAL's Penny application! 🎯
