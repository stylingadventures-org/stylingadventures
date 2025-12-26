/**
 * BESTIE Tier - Prime Bank Page
 * Features: Prime Coins rewards, redemption, loyalty tiers, exclusive deals
 */

import React, { useState } from 'react';
import { Card, StatCard } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { MainLayout } from '../../components/Layout';
import { ChartContainer, SimpleBarChart } from '../../components/Charts';

export function PrimeBank() {
  const [currentPage, setCurrentPage] = useState('primebank');
  const [currentUser] = useState({
    id: 'bestie_123',
    name: 'Sarah',
    tier: 'bestie' as const,
  });

  const [selectedTab, setSelectedTab] = useState('redeem');

  // Bank stats
  const bankStats = {
    coins: 4280,
    coinsThisMonth: 1240,
    redeemable: 3200,
    multiplier: 3,
  };

  // Redemption options
  const redemptionOptions = [
    {
      id: 'redeem_1',
      title: 'Shop Credit',
      description: '$50 store credit',
      cost: 5000,
      emoji: '🛍️',
      popular: true,
    },
    {
      id: 'redeem_2',
      title: 'Premium Course',
      description: 'Advanced styling masterclass',
      cost: 3500,
      emoji: '🎓',
      popular: false,
    },
    {
      id: 'redeem_3',
      title: 'Creator Feature',
      description: 'Featured on platform homepage',
      cost: 2000,
      emoji: '⭐',
      popular: false,
    },
    {
      id: 'redeem_4',
      title: 'Style Consultation',
      description: 'Personal 1-on-1 session with expert',
      cost: 4000,
      emoji: '👗',
      popular: true,
    },
    {
      id: 'redeem_5',
      title: 'VIP Event Access',
      description: 'Exclusive styling workshop',
      cost: 6000,
      emoji: '🎉',
      popular: false,
    },
    {
      id: 'redeem_6',
      title: 'Charity Donation',
      description: 'Help dress someone in need',
      cost: 1000,
      emoji: '❤️',
      popular: true,
    },
  ];

  // Reward activities
  const rewardActivities = [
    { activity: 'Post Daily Story', coins: 50, frequency: 'Daily' },
    { activity: 'Complete Challenge', coins: 100, frequency: 'Per challenge' },
    { activity: 'Receive Likes', coins: 1, frequency: 'Per like' },
    { activity: 'Receive Comments', coins: 5, frequency: 'Per comment' },
    { activity: 'Refer Friend', coins: 500, frequency: 'Per successful ref' },
    { activity: 'Join Event', coins: 150, frequency: 'Per event' },
  ];

  // Loyalty tier progression
  const loyaltyTiers = [
    {
      name: 'Fan',
      minCoins: 0,
      maxCoins: 2000,
      multiplier: '1x',
      emoji: '🌟',
      features: ['Basic access', 'Standard rewards'],
    },
    {
      name: 'Bestie',
      minCoins: 2000,
      maxCoins: 10000,
      multiplier: '3x',
      emoji: '💎',
      features: ['Extended access', '3x rewards multiplier', 'Exclusive events'],
      current: true,
    },
    {
      name: 'Creator',
      minCoins: 10000,
      maxCoins: 50000,
      multiplier: '5x',
      emoji: '👑',
      features: ['All Bestie features', '5x rewards', 'Creator tools'],
    },
    {
      name: 'Prime Studios',
      minCoins: 50000,
      maxCoins: null,
      multiplier: '10x',
      emoji: '🏰',
      features: ['All features', '10x rewards', 'Premium support'],
    },
  ];

  // Recent transactions
  const transactions = [
    {
      id: 'tx_1',
      type: 'earn',
      activity: 'Daily Story Posted',
      coins: 50,
      date: 'Today 2:30 PM',
    },
    {
      id: 'tx_2',
      type: 'earn',
      activity: 'Challenge Completed',
      coins: 100,
      date: 'Today 1:15 PM',
    },
    {
      id: 'tx_3',
      type: 'redeem',
      activity: 'Redeemed: Shop Credit',
      coins: -1000,
      date: 'Yesterday 6:45 PM',
    },
    {
      id: 'tx_4',
      type: 'earn',
      activity: 'Received 12 Likes',
      coins: 12,
      date: 'Yesterday 2:30 PM',
    },
    {
      id: 'tx_5',
      type: 'earn',
      activity: 'Event Attendance',
      coins: 150,
      date: 'Dec 19, 2:00 PM',
    },
  ];

  // Earnings breakdown
  const earningsBreakdown = [
    { name: 'Stories', value: 1200 },
    { name: 'Challenges', value: 800 },
    { name: 'Likes', value: 450 },
    { name: 'Comments', value: 620 },
    { name: 'Referrals', value: 210 },
  ];

  return (
    <MainLayout
      tier={currentUser.tier}
      username={currentUser.name}
      currentPage={currentPage}
      onNavigate={setCurrentPage}
    >
      <div className="space-y-8 pb-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg p-8 border border-cyan-500/30">
          <h1 className="text-4xl font-bold text-white mb-2">💎 Prime Bank</h1>
          <p className="text-gray-300 text-lg">
            Earn Prime Coins through activities and redeem for exclusive rewards. Enjoy 3x multiplier as a Bestie!
          </p>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Prime Coins"
            value={bankStats.coins.toLocaleString()}
            trend={{ value: 15, positive: true }}
            icon="💎"
          />
          <StatCard
            title="This Month"
            value={bankStats.coinsThisMonth}
            trend={{ value: 8, positive: true }}
            icon="📈"
          />
          <StatCard
            title="Redeemable"
            value={bankStats.redeemable}
            trend={{ value: 0, positive: false }}
            icon="✨"
          />
          <StatCard
            title="Multiplier"
            value={`${bankStats.multiplier}x`}
            trend={{ value: 0, positive: false }}
            icon="⭐"
          />
        </div>

        {/* Coin Status */}
        <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Your Coin Progress</h2>
            <Badge variant="success">Bestie Tier</Badge>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">Progress to Creator Tier</span>
                <span className="text-amber-300 font-bold">5,720 / 10,000</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-4 rounded-full"
                  style={{ width: '57.2%' }}
                />
              </div>
            </div>
            <p className="text-gray-300 text-sm">
              🎯 Earn 4,280 more coins to reach Creator tier and unlock 5x rewards multiplier!
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setSelectedTab('redeem')}
            className={`px-6 py-3 rounded-lg border transition-all font-medium ${
              selectedTab === 'redeem'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-cyan-500/50'
            }`}
          >
            🎁 Redemptions
          </button>
          <button
            onClick={() => setSelectedTab('earnings')}
            className={`px-6 py-3 rounded-lg border transition-all font-medium ${
              selectedTab === 'earnings'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-cyan-500/50'
            }`}
          >
            📊 Earnings
          </button>
          <button
            onClick={() => setSelectedTab('transactions')}
            className={`px-6 py-3 rounded-lg border transition-all font-medium ${
              selectedTab === 'transactions'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-cyan-500/50'
            }`}
          >
            📝 Transactions
          </button>
        </div>

        {/* Redemption Options */}
        {selectedTab === 'redeem' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">🎁 Redeem Your Coins</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {redemptionOptions.map((option) => (
                <Card
                  key={option.id}
                  className={`border-2 transition-all cursor-pointer ${
                    option.popular
                      ? 'bg-purple-600/20 border-purple-500'
                      : 'bg-gray-800/50 border-gray-700 hover:border-cyan-500/50'
                  }`}
                >
                  <div className="p-6">
                    {option.popular && (
                      <div className="mb-2 flex justify-end">
                        <Badge variant="success">POPULAR</Badge>
                      </div>
                    )}
                    <span className="text-4xl block mb-3">{option.emoji}</span>
                    <h3 className="text-lg font-bold text-white mb-2">{option.title}</h3>
                    <p className="text-gray-400 text-sm mb-4">{option.description}</p>
                    <div className="border-t border-gray-700 pt-4">
                      <p className="text-gray-400 text-sm mb-3">Cost: {option.cost.toLocaleString()} coins</p>
                      <Button
                        variant={bankStats.coins >= option.cost ? 'primary' : 'ghost'}
                        size="sm"
                        disabled={bankStats.coins < option.cost}
                        className="w-full"
                      >
                        {bankStats.coins >= option.cost ? 'Redeem' : 'Not Enough Coins'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Earnings */}
        {selectedTab === 'earnings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">📊 How to Earn Coins</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rewardActivities.map((activity, idx) => (
                  <Card key={idx} className="bg-gray-800/50 border-gray-700">
                    <div className="p-6 flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{activity.activity}</p>
                        <p className="text-gray-400 text-sm">{activity.frequency}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-cyan-300">
                          {activity.coins}{' '}
                          {bankStats.multiplier > 1 ? (
                            <span className="text-sm text-amber-300">
                              (×{bankStats.multiplier} = {activity.coins * bankStats.multiplier})
                            </span>
                          ) : null}
                        </p>
                        <p className="text-gray-400 text-xs">coins</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Earnings Breakdown</h3>
              <ChartContainer height={300}>
                <SimpleBarChart data={earningsBreakdown.map(e => ({ name: e.name, value: e.value }))} dataKey="value" />
              </ChartContainer>
            </div>
          </div>
        )}

        {/* Transactions */}
        {selectedTab === 'transactions' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">📝 Recent Transactions</h2>
            <Card className="bg-gray-800/50 border-gray-700 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Activity</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Type</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Amount</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                      <td className="py-3 px-4 text-white font-medium">{tx.activity}</td>
                      <td className="py-3 px-4">
                        <Badge variant={tx.type === 'earn' ? 'success' : 'default'}>
                          {tx.type === 'earn' ? '📈 Earned' : '💸 Redeemed'}
                        </Badge>
                      </td>
                      <td
                        className={`py-3 px-4 font-bold text-lg ${
                          tx.type === 'earn' ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {tx.type === 'earn' ? '+' : ''}{tx.coins}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm">{tx.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* Loyalty Tiers */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">🏆 Loyalty Tiers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {loyaltyTiers.map((tier) => (
              <Card
                key={tier.name}
                className={`border-2 transition-all ${
                  tier.current
                    ? 'bg-cyan-500/20 border-cyan-500'
                    : 'bg-gray-800/50 border-gray-700'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{tier.emoji}</span>
                    {tier.current && <Badge variant="success">CURRENT</Badge>}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{tier.name}</h3>
                  <p className="text-cyan-300 font-bold mb-4">{tier.multiplier} Rewards</p>
                  <div className="bg-gray-700/30 rounded p-3 mb-4">
                    <p className="text-gray-400 text-xs mb-1">Coin Range</p>
                    <p className="text-white font-medium text-sm">
                      {tier.minCoins.toLocaleString()} - {tier.maxCoins ? tier.maxCoins.toLocaleString() : '∞'}
                    </p>
                  </div>
                  <ul className="space-y-1 text-xs text-gray-300">
                    {tier.features.map((feature) => (
                      <li key={feature}>✓ {feature}</li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default PrimeBank;
