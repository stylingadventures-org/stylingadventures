import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { redirectToStripeCheckout } from '../../api/payment';
import '../../styles/upgrade.css';

export default function UpgradeBestie() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState('monthly');

  const monthlyPrice = 9.99;
  const annualPrice = 99.99;
  const annualSavings = ((monthlyPrice * 12) - annualPrice).toFixed(2);
  const priceToShow = selectedBillingCycle === 'monthly' ? monthlyPrice : annualPrice;
  const billingText = selectedBillingCycle === 'monthly' ? '/month' : '/year';

  const features = [
    { icon: '✨', title: 'Expanded Closet', desc: '500+ looks vs 100' },
    { icon: '👥', title: 'Style Collab', desc: 'Create with friends' },
    { icon: '🏆', title: 'Challenges', desc: 'Compete for rewards' },
    { icon: '📊', title: 'Analytics', desc: 'Track your style stats' },
    { icon: '🎨', title: 'Advanced Themes', desc: 'Customize your profile' },
    { icon: '⭐', title: 'Priority Support', desc: 'Get help faster' },
    { icon: '🎁', title: 'Monthly Bonuses', desc: 'Exclusive rewards' },
    { icon: '🌟', title: 'Featured Creator', desc: 'Show in spotlight' },
  ];

  const comparisons = [
    { feature: 'Looks/Outfits', fan: '100', bestie: '500+', creator: '∞' },
    { feature: 'Challenges', fan: 'Limited', bestie: 'Full Access', creator: 'Full Access' },
    { feature: 'Collab', fan: '❌', bestie: '✅', creator: '✅ +Monetize' },
    { feature: 'Analytics', fan: '❌', bestie: '✅', creator: '✅ Advanced' },
    { feature: 'Styling Service', fan: '❌', bestie: '❌', creator: '✅' },
    { feature: 'Monthly Income', fan: '$0', bestie: '$0', creator: '✅ Variable' },
  ];

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setIsProcessing(true);
    setError(null);
    
    try {
      console.log('[UpgradeBestie] Initiating checkout for:', {
        email: user.email,
        billingCycle: selectedBillingCycle,
        tier: 'BESTIE',
      });

      // Redirect to Stripe Checkout
      await redirectToStripeCheckout('BESTIE', selectedBillingCycle, user);
    } catch (err) {
      console.error('[UpgradeBestie] Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="upgrade-container">
      {/* Hero Section */}
      <div className="upgrade-hero">
        <h1>Unlock Bestie Tier</h1>
        <p className="hero-subtitle">
          Expand your style, collaborate with friends, and track your fashion journey
        </p>
      </div>

      {/* Pricing Section */}
      <div className="upgrade-pricing-section">
        <div className="billing-toggle">
          <button
            className={`toggle-btn ${selectedBillingCycle === 'monthly' ? 'active' : ''}`}
            onClick={() => setSelectedBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button
            className={`toggle-btn ${selectedBillingCycle === 'annual' ? 'active' : ''}`}
            onClick={() => setSelectedBillingCycle('annual')}
          >
            Annual
            <span className="savings-badge">Save ${annualSavings}</span>
          </button>
        </div>

        <div className="pricing-card bestie-card">
          <div className="card-header">
            <h2>Bestie</h2>
            <p className="tier-subtitle">Perfect for fashion enthusiasts</p>
          </div>

          <div className="price-display">
            <span className="currency">$</span>
            <span className="amount">{priceToShow}</span>
            <span className="billing-period">{billingText}</span>
          </div>

          {selectedBillingCycle === 'annual' && (
            <p className="annual-savings">
              💰 Save ${annualSavings} per year!
            </p>
          )}

          <button
            className="cta-button bestie-cta"
            onClick={handleSubscribe}
            disabled={isProcessing}
          >
            {isProcessing ? 'Redirecting to Payment...' : 'Subscribe to Bestie'}
          </button>

          {error && (
            <p className="error-message">
              ⚠️ {error}
            </p>
          )}

          <p className="payment-note">
            Cancel anytime. No long-term commitment.
          </p>

          <div className="features-grid">
            {features.map((feat, idx) => (
              <div key={idx} className="feature-item">
                <span className="feature-icon">{feat.icon}</span>
                <div className="feature-text">
                  <div className="feature-title">{feat.title}</div>
                  <div className="feature-desc">{feat.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="upgrade-comparison">
        <h2>Feature Comparison</h2>
        <div className="comparison-table">
          <div className="table-header">
            <div className="feature-col">Feature</div>
            <div className="tier-col">Fan</div>
            <div className="tier-col highlight">Bestie</div>
            <div className="tier-col">Creator</div>
          </div>
          {comparisons.map((row, idx) => (
            <div key={idx} className="table-row">
              <div className="feature-col">{row.feature}</div>
              <div className="tier-col">{row.fan}</div>
              <div className="tier-col highlight">{row.bestie}</div>
              <div className="tier-col">{row.creator}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="upgrade-faq">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h3>Can I cancel anytime?</h3>
            <p>Yes! Cancel your subscription at any time from your account settings. You'll keep access through the end of your billing cycle.</p>
          </div>
          <div className="faq-item">
            <h3>What if I want to upgrade to Creator?</h3>
            <p>You can upgrade to Creator tier at any time. We'll prorate your Bestie subscription cost toward the Creator tier.</p>
          </div>
          <div className="faq-item">
            <h3>Do you offer refunds?</h3>
            <p>We offer 7-day refunds if you're not satisfied. Contact our support team within a week of purchase.</p>
          </div>
          <div className="faq-item">
            <h3>What payment methods do you accept?</h3>
            <p>We accept all major credit cards, debit cards, and digital wallets like Apple Pay and Google Pay.</p>
          </div>
          <div className="faq-item">
            <h3>Is my payment secure?</h3>
            <p>Yes! We use industry-standard encryption (SSL/TLS) and PCI-DSS compliance. Your payment data is never stored on our servers.</p>
          </div>
          <div className="faq-item">
            <h3>Can I share my account?</h3>
            <p>Your subscription is for personal use only. Each user needs their own account with their own subscription.</p>
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="upgrade-footer">
        <button
          className="cta-button bestie-cta large"
          onClick={handleSubscribe}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Subscribe to Bestie - $' + priceToShow + billingText}
        </button>
        <button
          className="secondary-btn"
          onClick={() => navigate('/choose-your-path')}
        >
          View All Plans
        </button>
      </div>
    </div>
  );
}
