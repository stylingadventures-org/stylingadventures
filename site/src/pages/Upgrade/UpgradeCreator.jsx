import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { redirectToStripeCheckout } from '../../api/payment';
import '../../styles/upgrade.css';

export default function UpgradeCreator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState('monthly');

  const monthlyPrice = 24.99;
  const annualPrice = 249.99;
  const annualSavings = ((monthlyPrice * 12) - annualPrice).toFixed(2);
  const priceToShow = selectedBillingCycle === 'monthly' ? monthlyPrice : annualPrice;
  const billingText = selectedBillingCycle === 'monthly' ? '/month' : '/year';

  const features = [
    { icon: '💰', title: 'Monetization', desc: 'Earn from collaborations' },
    { icon: '📦', title: 'Unlimited Looks', desc: 'No storage limits' },
    { icon: '🎬', title: 'Creator Studio', desc: 'Advanced tools & assets' },
    { icon: '👥', title: 'Team Tools', desc: 'Manage collaborators' },
    { icon: '📊', title: 'Revenue Dashboard', desc: 'Track earnings & stats' },
    { icon: '🚀', title: 'Growth Tools', desc: 'Marketing & promotion suite' },
    { icon: '🤝', title: 'Brand Deals', desc: 'Connect with sponsors' },
    { icon: '⭐', title: 'Creator Badge', desc: 'Verified status' },
  ];

  const comparisons = [
    { feature: 'Looks/Outfits', fan: '100', bestie: '500+', creator: '∞ Unlimited' },
    { feature: 'Monetization', fan: '❌', bestie: '❌', creator: '✅ Full' },
    { feature: 'Collaborations', fan: 'View Only', bestie: '✅', creator: '✅ +Earnings' },
    { feature: 'Studio Tools', fan: '❌', bestie: '❌', creator: '✅ Pro' },
    { feature: 'Collab Analytics', fan: '❌', bestie: 'Basic', creator: '✅ Advanced' },
    { feature: 'Revenue Sharing', fan: '$0', bestie: '$0', creator: '✅ Variable' },
    { feature: 'Brand Dashboard', fan: '❌', bestie: '❌', creator: '✅' },
    { feature: 'API Access', fan: '❌', bestie: '❌', creator: '✅ Beta' },
  ];

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setIsProcessing(true);
    setError(null);
    
    try {
      console.log('[UpgradeCreator] Initiating checkout for:', {
        email: user.email,
        billingCycle: selectedBillingCycle,
        tier: 'CREATOR',
      });

      // Redirect to Stripe Checkout
      await redirectToStripeCheckout('CREATOR', selectedBillingCycle, user);
    } catch (err) {
      console.error('[UpgradeCreator] Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="upgrade-container">
      {/* Hero Section */}
      <div className="upgrade-hero">
        <h1>Join the Creator Tier</h1>
        <p className="hero-subtitle">
          Monetize your influence, unlock pro tools, and build your fashion empire
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

        <div className="pricing-card creator-card featured">
          <div className="featured-badge">Most Popular</div>
          <div className="card-header">
            <h2>Creator</h2>
            <p className="tier-subtitle">For fashion influencers & professionals</p>
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
            className="cta-button creator-cta"
            onClick={handleSubscribe}
            disabled={isProcessing}
          >
            {isProcessing ? 'Redirecting to Payment...' : 'Subscribe to Creator'}
          </button>

          {error && (
            <p className="error-message">
              ⚠️ {error}
            </p>
          )}

          <p className="payment-note">
            Start monetizing immediately. Cancel anytime.
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

          <div className="perks-section">
            <h3>Creator Perks</h3>
            <ul className="perks-list">
              <li>🎁 Welcome bonus: $25 store credit</li>
              <li>📈 Free monthly strategy consultation</li>
              <li>🎯 Priority onboarding (1-on-1 setup call)</li>
              <li>🌟 Featured in Creator Spotlight (30 days/month)</li>
              <li>💳 0% commission on first 100 collaboration earnings</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Monetization Overview */}
      <div className="monetization-section">
        <h2>How Creators Earn</h2>
        <div className="earning-cards">
          <div className="earning-card">
            <div className="earning-icon">👥</div>
            <h3>Collaborations</h3>
            <p className="earning-percent">Earn 30-50% per collab</p>
            <p>Connect with other creators. Each collaboration generates revenue based on engagement.</p>
          </div>
          <div className="earning-card">
            <div className="earning-icon">🤝</div>
            <h3>Brand Partnerships</h3>
            <p className="earning-percent">$100-$5000+ per deal</p>
            <p>Get featured with fashion brands. We connect you with sponsorship opportunities.</p>
          </div>
          <div className="earning-card">
            <div className="earning-icon">📦</div>
            <h3>Creator Shop</h3>
            <p className="earning-percent">70% of revenue</p>
            <p>Sell your own designs, lookbooks, and fashion guides directly to fans.</p>
          </div>
          <div className="earning-card">
            <div className="earning-icon">🎓</div>
            <h3>Masterclasses</h3>
            <p className="earning-percent">80% of tuition</p>
            <p>Teach styling, fashion design, or personal shopping to other creators.</p>
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
            <div className="tier-col">Bestie</div>
            <div className="tier-col highlight">Creator</div>
          </div>
          {comparisons.map((row, idx) => (
            <div key={idx} className="table-row">
              <div className="feature-col">{row.feature}</div>
              <div className="tier-col">{row.fan}</div>
              <div className="tier-col">{row.bestie}</div>
              <div className="tier-col highlight">{row.creator}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="upgrade-faq">
        <h2>Creator FAQ</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h3>When do I get paid?</h3>
            <p>Earnings are paid monthly via direct deposit, PayPal, or check. Minimum payout is $10. We process payouts on the 15th of each month for the previous month's earnings.</p>
          </div>
          <div className="faq-item">
            <h3>How much can I earn?</h3>
            <p>Top creators earn $500-$5000+ per month. Earnings depend on your follower count, engagement rate, and collaboration frequency. We provide detailed analytics to help you optimize.</p>
          </div>
          <div className="faq-item">
            <h3>Do I need 10k followers?</h3>
            <p>No! We accept all creators. Growth tools help smaller creators reach monetization faster. Most creators start earning within 2-3 months.</p>
          </div>
          <div className="faq-item">
            <h3>What are creator guidelines?</h3>
            <p>Be authentic, provide value, and follow community standards. No hate speech, harassment, or inappropriate content. We're built on respect and creativity.</p>
          </div>
          <div className="faq-item">
            <h3>Can I go back to Bestie?</h3>
            <p>Yes! Downgrade anytime. You'll keep earned revenue and any store credit, but lose access to Creator Studio features.</p>
          </div>
          <div className="faq-item">
            <h3>Is there support?</h3>
            <p>Absolutely. Creators get priority support, exclusive Discord channel, monthly group Q&A calls, and a dedicated onboarding specialist.</p>
          </div>
        </div>
      </div>

      {/* Creator Testimonials */}
      <div className="testimonials-section">
        <h2>Creator Success Stories</h2>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="stars">⭐⭐⭐⭐⭐</div>
            <p>"I've earned $8,200 in my first 6 months. The tools are intuitive and the community is incredibly supportive."</p>
            <p className="testimonial-author">— Maria, Fashion Designer</p>
          </div>
          <div className="testimonial-card">
            <div className="stars">⭐⭐⭐⭐⭐</div>
            <p>"From hobby to income stream. This platform took my styling passion and turned it into a real business."</p>
            <p className="testimonial-author">— Alex, Style Consultant</p>
          </div>
          <div className="testimonial-card">
            <div className="stars">⭐⭐⭐⭐⭐</div>
            <p>"The brand partnership opportunities alone make this worth it. I've landed 5 sponsorships in 4 months."</p>
            <p className="testimonial-author">— Jordan, Fashion Influencer</p>
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="upgrade-footer">
        <button
          className="cta-button creator-cta large"
          onClick={handleSubscribe}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Start Creator Journey - $' + priceToShow + billingText}
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
