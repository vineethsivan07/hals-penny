import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './ExpenseChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ExpenseChart = ({ expenses }) => {
  const [chartKey, setChartKey] = useState(0);
  
  console.log('ExpenseChart rendering with expenses:', expenses.length);
  
  useEffect(() => {
    console.log('ExpenseChart useEffect triggered, expenses changed:', expenses.length);
    setChartKey(prev => prev + 1); // Force re-render
  }, [expenses]);
  
  // Calculate expenses by category
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const categories = {
    food: 'Food & Dining',
    transport: 'Transportation',
    shopping: 'Shopping',
    entertainment: 'Entertainment',
    bills: 'Bills & Utilities',
    healthcare: 'Healthcare',
    education: 'Education',
    other: 'Other'
  };

  const categoryLabels = Object.keys(categoryTotals).map(cat => categories[cat] || cat);
  const categoryValues = Object.values(categoryTotals);

  // Calculate expenses by month for the last 6 months
  const monthlyExpenses = expenses.reduce((acc, expense) => {
    const date = new Date(expense.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    acc[monthKey] = (acc[monthKey] || 0) + expense.amount;
    return acc;
  }, {});

  const last6Months = [];
  const currentDate = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    last6Months.push({ key: monthKey, name: monthName, amount: monthlyExpenses[monthKey] || 0 });
  }

  const barData = {
    labels: last6Months.map(month => month.name),
    datasets: [
      {
        label: 'Expenses ($)',
        data: last6Months.map(month => month.amount),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const doughnutData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryValues,
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF6384',
          '#C9CBCF'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Expenses (Last 6 Months)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toFixed(0);
          }
        }
      }
    }
  };


  if (expenses.length === 0) {
    return (
      <div className="expense-chart">
        <h2 className="chart-title">📊 Expense Analytics</h2>
        <div className="chart-container">
          <div className="no-data">
            <div className="no-data-icon">📈</div>
            <p>No expenses to display. Start tracking to see beautiful charts!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="expense-chart">
      <h2 className="chart-title">📊 Expense Analytics</h2>
      <div className="chart-container">
        <Bar key={chartKey} data={barData} options={barOptions} />
      </div>
      <div className="chart-legend">
        {categoryLabels.map((label, index) => (
          <div key={label} className="legend-item">
            <div 
              className="legend-color" 
              style={{ backgroundColor: doughnutData.datasets[0].backgroundColor[index] }}
            ></div>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpenseChart;
