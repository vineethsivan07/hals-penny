#!/bin/bash

# HAL's Penny - Grafana Golden Signals Dashboard Setup
# This script sets up the Golden Signals dashboard in Grafana

echo "🚀 Setting up HAL's Penny Golden Signals Dashboard in Grafana..."

# Wait for Grafana to be ready
echo "⏳ Waiting for Grafana to be ready..."
until curl -s http://localhost:3001/api/health > /dev/null; do
    echo "   Waiting for Grafana..."
    sleep 2
done

echo "✅ Grafana is ready!"

# Wait for Prometheus to be ready
echo "⏳ Waiting for Prometheus to be ready..."
until curl -s http://localhost:9090/api/v1/query?query=up > /dev/null; do
    echo "   Waiting for Prometheus..."
    sleep 2
done

echo "✅ Prometheus is ready!"

# Add Prometheus as data source
echo "📊 Adding Prometheus data source..."
curl -X POST http://admin:admin@localhost:3001/api/datasources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Prometheus",
    "type": "prometheus",
    "url": "http://prometheus:9090",
    "access": "proxy",
    "isDefault": true
  }' 2>/dev/null || echo "   Data source might already exist"

echo "✅ Prometheus data source configured!"

# Import the Golden Signals dashboard
echo "📈 Importing Golden Signals dashboard..."
curl -X POST http://admin:admin@localhost:3001/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d @grafana-dashboard-golden-signals.json 2>/dev/null || echo "   Dashboard might already exist"

echo "✅ Golden Signals dashboard imported!"

echo ""
echo "🎉 Setup complete! Access your dashboards:"
echo "   📊 Grafana: http://localhost:3001 (admin/admin)"
echo "   🔍 Prometheus: http://localhost:9090"
echo "   💰 HAL's Penny: http://localhost:3002"
echo ""
echo "📈 Golden Signals Dashboard includes:"
echo "   🚦 Traffic - Requests per second"
echo "   ⏱️  Latency - Response time (95th percentile)"
echo "   ❌ Errors - Error rate percentage"
echo "   📊 Saturation - Active users and system resources"
echo "   💼 Business metrics - Expense tracking"
echo "   🤖 AI service health monitoring"
echo ""
echo "🔗 Direct dashboard link: http://localhost:3001/d/hals-penny-golden-signals"
