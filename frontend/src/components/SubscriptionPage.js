import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './SubscriptionPage.css';

export default function SubscriptionPage({ onSubscriptionSelected }) {
  const { currentUser, saveSubscriptionPlan } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePlanSelect = async (plan) => {
    console.log('Plan selected:', plan);
    console.log('Current user:', currentUser);
    setLoading(true);
    try {
      // Use the AuthContext method to save subscription plan
      console.log('Calling saveSubscriptionPlan...');
      const success = await saveSubscriptionPlan(plan);
      console.log('saveSubscriptionPlan result:', success);
      
      if (success) {
        console.log(`User selected ${plan} plan successfully`);
        // Call the callback to proceed to next page
        if (onSubscriptionSelected) {
          console.log('Calling onSubscriptionSelected callback...');
          onSubscriptionSelected(plan);
        } else {
          console.log('No onSubscriptionSelected callback provided');
        }
      } else {
        console.error('Failed to save subscription preference');
        alert('Failed to save subscription preference. Please try again.');
      }
    } catch (error) {
      console.error('Error saving subscription preference:', error);
      alert('Error saving subscription preference. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free Mode',
      price: '$0',
      period: 'Forever',
      icon: '📱',
      description: 'Perfect for basic expense tracking',
      features: [
        'Manual expense entry',
        'Basic expense categories',
        'Simple expense history',
        'No AI integration',
        'Offline functionality'
      ],
      color: '#6b7280',
      bgColor: '#f9fafb'
    },
    {
      id: 'base',
      name: 'Base Plan',
      price: '$20',
      period: 'One-time',
      icon: '⚡',
      description: 'Optimized AI for smart expense tracking',
      features: [
        'AI-powered expense parsing',
        'Smart categorization',
        'Optimized AI usage (cost-effective)',
        'Basic expense insights',
        'Voice input support'
      ],
      color: '#2563eb',
      bgColor: '#eff6ff'
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: '$60',
      period: 'per month',
      icon: '🚀',
      description: 'Full AI experience with advanced insights',
      features: [
        'Full AI capabilities',
        'Advanced expense insights',
        'Smart spending recommendations',
        'Detailed analytics',
        'Priority support'
      ],
      color: '#7c3aed',
      bgColor: '#faf5ff'
    }
  ];

  return (
    <div className="subscription-container">
      <div className="subscription-card">
        <div className="subscription-header">
          <div className="subscription-logo">
            <div className="logo-icon">💰</div>
            <h1>Choose Your Plan</h1>
          </div>
          <p>Select the plan that best fits your expense tracking needs</p>
        </div>

        <div className="plans-grid">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''}`}
              style={{ 
                borderColor: plan.color,
                backgroundColor: selectedPlan === plan.id ? plan.bgColor : 'white'
              }}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <div className="plan-header">
                <div className="plan-icon" style={{ color: plan.color }}>
                  {plan.icon}
                </div>
                <div className="plan-title">
                  <h3>{plan.name}</h3>
                  <div className="plan-price">
                    <span className="price">{plan.price}</span>
                    <span className="period">{plan.period}</span>
                  </div>
                </div>
              </div>

              <p className="plan-description">{plan.description}</p>

              <ul className="plan-features">
                {plan.features.map((feature, index) => (
                  <li key={index}>
                    <span className="feature-icon">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`plan-button ${selectedPlan === plan.id ? 'selected' : ''}`}
                style={{
                  backgroundColor: selectedPlan === plan.id ? plan.color : 'white',
                  color: selectedPlan === plan.id ? 'white' : plan.color,
                  borderColor: plan.color
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlanSelect(plan.id);
                }}
                disabled={loading}
              >
                {loading && selectedPlan === plan.id ? 'Processing...' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>

        <div className="subscription-footer">
          <p className="footer-text">
            You can change your plan anytime in your profile settings.
          </p>
        </div>
      </div>
    </div>
  );
}
