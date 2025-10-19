# HAL's Penny - Prometheus Monitoring Setup

## 🎯 Overview

This guide sets up comprehensive monitoring for HAL's Penny using Prometheus, Grafana, and custom metrics collection.

## 📊 Metrics Collected

### Business Metrics
- **Total Expenses**: `hals_penny_expenses_total`
- **Expense Amount**: `hals_penny_expense_amount_total`
- **Average Expense**: `hals_penny_expense_amount_average`
- **Expenses by Category**: `hals_penny_expenses_by_category_total`

### AI Service Metrics
- **AI Service Calls**: `hals_penny_ai_service_calls_total`
- **AI Response Time**: `hals_penny_ai_service_response_time_seconds`
- **AI Service Errors**: `hals_penny_ai_service_errors_total`
- **AI Fallback Usage**: `hals_penny_ai_fallback_usage_total`

### User Interaction Metrics
- **User Connections**: `hals_penny_user_connections_total`
- **Active Users**: `hals_penny_active_users`
- **Chat Messages**: `hals_penny_chat_messages_total`

### Performance Metrics
- **API Requests**: `hals_penny_api_requests_total`
- **API Response Time**: `hals_penny_api_response_time_seconds`
- **Database Operations**: `hals_penny_database_operations_total`
- **Database Response Time**: `hals_penny_database_response_time_seconds`

### System Metrics
- **Memory Usage**: `hals_penny_memory_usage_bytes`
- **CPU Usage**: `hals_penny_cpu_usage_percent`

### Business Intelligence Metrics
- **Daily Spending**: `hals_penny_daily_spending_amount`
- **Monthly Spending**: `hals_penny_monthly_spending_amount`
- **Budget Utilization**: `hals_penny_budget_utilization_percent`

## 🚀 Quick Start

### 1. Start Monitoring Stack

```bash
# Start Prometheus, Grafana, and Node Exporter
docker-compose -f docker-compose.monitoring.yml up -d

# Check services
docker-compose -f docker-compose.monitoring.yml ps
```

### 2. Access Dashboards

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **HAL's Penny Metrics**: http://localhost:3000/metrics

### 3. Start HAL's Penny Application

```bash
# Backend
cd backend && node server.js

# Frontend (in another terminal)
cd frontend && PORT=3001 npm start
```

## 📈 Grafana Dashboard Setup

### 1. Import Prometheus Data Source

1. Go to http://localhost:3001
2. Login with admin/admin
3. Go to Configuration > Data Sources
4. Add Prometheus data source:
   - URL: http://prometheus:9090
   - Access: Server (default)

### 2. Create Dashboard

#### Business Metrics Panel
```promql
# Total Expenses
sum(rate(hals_penny_expenses_total[5m]))

# Expenses by Category
sum by (category) (hals_penny_expenses_by_category_total)

# Total Spending
sum(hals_penny_expense_amount_total)
```

#### Performance Metrics Panel
```promql
# API Response Time
histogram_quantile(0.95, rate(hals_penny_api_response_time_seconds_bucket[5m]))

# AI Service Response Time
histogram_quantile(0.95, rate(hals_penny_ai_service_response_time_seconds_bucket[5m]))

# Database Response Time
histogram_quantile(0.95, rate(hals_penny_database_response_time_seconds_bucket[5m]))
```

#### System Metrics Panel
```promql
# Memory Usage
hals_penny_memory_usage_bytes{type="rss"}

# CPU Usage
hals_penny_cpu_usage_percent

# Active Users
hals_penny_active_users
```

## 🔧 Advanced Configuration

### Custom Alerts

Create `alerts.yml`:

```yaml
groups:
  - name: hals-penny-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(hals_penny_ai_service_errors_total[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High AI service error rate"
          
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(hals_penny_api_response_time_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High API response time"
          
      - alert: DatabaseErrors
        expr: rate(hals_penny_database_operations_total{status="error"}[5m]) > 0.05
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database operation errors detected"
```

### Custom Queries

#### Business Intelligence
```promql
# Daily spending trend
sum by (date) (hals_penny_daily_spending_amount)

# Top spending categories
topk(5, sum by (category) (hals_penny_expenses_by_category_total))

# User activity
sum(rate(hals_penny_user_connections_total[5m]))
```

#### Performance Analysis
```promql
# AI service success rate
sum(rate(hals_penny_ai_service_calls_total{status="success"}[5m])) / 
sum(rate(hals_penny_ai_service_calls_total[5m]))

# Fallback usage rate
sum(rate(hals_penny_ai_fallback_usage_total[5m])) / 
sum(rate(hals_penny_ai_service_calls_total[5m]))
```

## 📊 Sample Dashboards

### 1. Business Overview Dashboard
- Total expenses over time
- Spending by category (pie chart)
- Average expense amount
- User activity metrics

### 2. Performance Dashboard
- API response times
- Database performance
- AI service metrics
- Error rates

### 3. System Health Dashboard
- Memory usage
- CPU usage
- Active connections
- Service availability

## 🛠️ Troubleshooting

### Common Issues

1. **Metrics not appearing**
   ```bash
   # Check if metrics endpoint is working
   curl http://localhost:3000/metrics
   
   # Check Prometheus targets
   # Go to http://localhost:9090/targets
   ```

2. **Grafana connection issues**
   ```bash
   # Check Prometheus is accessible from Grafana
   docker exec hals-penny-grafana curl http://prometheus:9090/api/v1/query?query=up
   ```

3. **High memory usage**
   ```bash
   # Check container resource usage
   docker stats
   
   # Adjust scrape intervals in prometheus.yml
   ```

### Useful Commands

```bash
# View all metrics
curl -s http://localhost:3000/metrics | grep hals_penny_

# Check specific metric
curl -s "http://localhost:9090/api/v1/query?query=hals_penny_expenses_total"

# Restart monitoring stack
docker-compose -f docker-compose.monitoring.yml restart

# View logs
docker-compose -f docker-compose.monitoring.yml logs -f
```

## 📈 Monitoring Best Practices

1. **Set up alerts** for critical metrics
2. **Monitor business KPIs** regularly
3. **Track performance trends** over time
4. **Set up dashboards** for different stakeholders
5. **Regular cleanup** of old metrics data

## 🔗 Useful Links

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Node.js Metrics](https://github.com/siimon/prom-client)
- [PromQL Tutorial](https://prometheus.io/docs/prometheus/latest/querying/basics/)
