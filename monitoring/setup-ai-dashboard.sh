#!/bin/bash

echo "🤖 Setting up HAL's Penny AI Analytics Dashboard in Grafana..."

# Wait for Grafana to be ready
echo "⏳ Waiting for Grafana to be ready..."
until curl -s http://localhost:3001/api/health > /dev/null 2>&1; do
  sleep 2
done
echo "✅ Grafana is ready!"

# Wait for Prometheus to be ready
echo "⏳ Waiting for Prometheus to be ready..."
until curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; do
  sleep 2
done
echo "✅ Prometheus is ready!"

# Add Prometheus data source if it doesn't exist
echo "📊 Adding Prometheus data source..."
curl -X POST \
  -H "Content-Type: application/json" \
  -u admin:admin \
  -d '{
    "name": "Prometheus",
    "type": "prometheus",
    "url": "http://prometheus:9090",
    "access": "proxy",
    "isDefault": true
  }' \
  http://localhost:3001/api/datasources 2>/dev/null

echo "✅ Prometheus data source configured!"

# Import AI Analytics Dashboard
echo "📈 Importing AI Analytics dashboard..."
curl -X POST \
  -H "Content-Type: application/json" \
  -u admin:admin \
  -d @grafana-dashboard-ai-analytics-fixed.json \
  http://localhost:3001/api/dashboards/db 2>/dev/null

echo "✅ AI Analytics dashboard imported!"

echo ""
echo "🎉 AI Analytics Dashboard setup complete!"
echo ""
echo "📊 Access your dashboards:"
echo "   🤖 AI Analytics: http://localhost:3001/d/hals-penny-ai-analytics"
echo "   📈 Golden Signals: http://localhost:3001/d/hals-penny-golden-signals"
echo "   🔍 Prometheus: http://localhost:9090"
echo "   💰 HAL's Penny: http://localhost:3002"
echo ""
echo "🤖 AI Analytics Dashboard includes:"
echo "   📊 AI Service Calls Rate - Real-time AI usage"
echo "   ⏱️  AI Response Times - Performance monitoring"
echo "   📈 Total AI Calls - Usage statistics"
echo "   ❌ AI Errors - Error tracking and debugging"
echo "   🔄 AI Fallback Usage - When fallbacks are triggered"
echo "   💬 Chat Messages - User interaction patterns"
echo "   💰 Expenses by Category - Business insights"
echo "   👥 Active Users - User engagement"
echo ""
echo "🔗 Direct AI Analytics link: http://localhost:3001/d/hals-penny-ai-analytics"
