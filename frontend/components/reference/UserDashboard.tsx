import { useState } from 'react';
import { Link } from 'react-router';
import { Wallet, TrendingUp, TrendingDown, Plus, Settings, BarChart3, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function UserDashboard() {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'agents'>('portfolio');

  // Mock user portfolio data
  const portfolio = {
    totalValue: 145.67,
    totalChange: 12.5,
    totalPnL: 18.23,
    positions: [
      {
        agentId: '1',
        agentName: 'Magnus AI',
        avatar: '♔',
        shares: 12.5,
        avgPrice: 2.10,
        currentPrice: 2.45,
        value: 30.63,
        pnl: 4.38,
        pnlPercent: 16.7,
        color: '#8B5CF6',
      },
      {
        agentId: '2',
        agentName: 'Stockfish Sentinel',
        avatar: '♖',
        shares: 8.3,
        avgPrice: 6.20,
        currentPrice: 5.82,
        value: 48.31,
        pnl: -3.15,
        pnlPercent: -6.1,
        color: '#EC4899',
      },
      {
        agentId: '3',
        agentName: 'AlphaGambit',
        avatar: '♕',
        shares: 25.0,
        avgPrice: 0.85,
        currentPrice: 1.23,
        value: 30.75,
        pnl: 9.50,
        pnlPercent: 44.7,
        color: '#10B981',
      },
      {
        agentId: '6',
        agentName: 'Queen\'s Gambit AI',
        avatar: '♛',
        shares: 5.1,
        currentPrice: 7.12,
        avgPrice: 5.80,
        value: 36.31,
        pnl: 6.73,
        pnlPercent: 22.7,
        color: '#EF4444',
      },
    ],
  };

  // Mock user's created agents
  const myAgents = [
    {
      id: 'my1',
      name: 'DeepMind Warrior',
      avatar: '♚',
      rating: 2720,
      wins: 89,
      losses: 34,
      draws: 12,
      price: 3.45,
      priceChange: 8.3,
      marketCap: 172500,
      holders: 523,
      color: '#3B82F6',
      status: 'active',
      created: '2026-01-15',
    },
    {
      id: 'my2',
      name: 'Tactical Titan',
      avatar: '♗',
      rating: 2580,
      wins: 45,
      losses: 23,
      draws: 8,
      price: 1.89,
      priceChange: -2.1,
      marketCap: 94500,
      holders: 287,
      color: '#F59E0B',
      status: 'active',
      created: '2026-02-01',
    },
  ];

  const portfolioHistory = [
    { date: 'Jan 1', value: 120 },
    { date: 'Jan 8', value: 125 },
    { date: 'Jan 15', value: 122 },
    { date: 'Jan 22', value: 135 },
    { date: 'Jan 29', value: 140 },
    { date: 'Feb 5', value: 145.67 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="text-3xl">♔</div>
              <div>
                <h1 className="text-2xl font-bold text-white">Gambit</h1>
                <p className="text-sm text-slate-400">AI Chess Agent Launchpad</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                to="/marketplace"
                className="text-slate-300 hover:text-white transition-colors"
              >
                Marketplace
              </Link>
              <Link
                to="/dashboard"
                className="text-violet-400 font-medium"
              >
                Dashboard
              </Link>
              <button className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-violet-700 hover:to-purple-700 transition-all">
                0x7a9f...3b2c
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Portfolio Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">My Dashboard</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Wallet className="w-5 h-5 text-slate-400" />
                <span className={`text-sm ${portfolio.totalChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {portfolio.totalChange >= 0 ? '+' : ''}{portfolio.totalChange.toFixed(2)}%
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">${portfolio.totalValue.toFixed(2)}</div>
              <div className="text-sm text-slate-400">Total Portfolio Value</div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-5 h-5 text-slate-400" />
                <span className={`text-sm ${portfolio.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {portfolio.totalPnL >= 0 ? '+' : ''}${portfolio.totalPnL.toFixed(2)}
                </span>
              </div>
              <div className="text-3xl font-bold text-green-400">${portfolio.totalPnL.toFixed(2)}</div>
              <div className="text-sm text-slate-400">Total P&L</div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{portfolio.positions.length}</div>
              <div className="text-sm text-slate-400">Active Positions</div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Settings className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{myAgents.length}</div>
              <div className="text-sm text-slate-400">Created Agents</div>
            </div>
          </div>

          {/* Portfolio Chart */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-6">Portfolio Performance</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={portfolioHistory}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'portfolio'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
            }`}
          >
            Token Positions
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'agents'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
            }`}
          >
            My Agents
          </button>
        </div>

        {/* Content */}
        {activeTab === 'portfolio' ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Agent</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">Shares</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">Avg Price</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">Current Price</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">Value</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">P&L</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.positions.map((position) => (
                    <tr
                      key={position.agentId}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <Link to={`/agent/${position.agentId}`} className="flex items-center gap-3 hover:text-violet-400 transition-colors">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                            style={{
                              background: `${position.color}20`,
                              border: `2px solid ${position.color}`,
                            }}
                          >
                            {position.avatar}
                          </div>
                          <span className="font-medium text-white">{position.agentName}</span>
                        </Link>
                      </td>
                      <td className="py-4 px-6 text-right text-white font-medium">
                        {position.shares.toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-right text-slate-300">
                        ${position.avgPrice.toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-right text-white font-medium">
                        ${position.currentPrice.toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-right text-white font-bold">
                        ${position.value.toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className={position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                          <div className="font-bold flex items-center justify-end gap-1">
                            {position.pnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            ${Math.abs(position.pnl).toFixed(2)}
                          </div>
                          <div className="text-sm">
                            {position.pnl >= 0 ? '+' : ''}{position.pnlPercent.toFixed(1)}%
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          to={`/agent/${position.agentId}`}
                          className="inline-block bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
                        >
                          Trade
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-violet-700 hover:to-purple-700 transition-all"
              >
                <Plus className="w-5 h-5" />
                Create New Agent
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myAgents.map((agent) => {
                const winRate = ((agent.wins / (agent.wins + agent.losses + agent.draws)) * 100).toFixed(1);
                const totalMatches = agent.wins + agent.losses + agent.draws;

                return (
                  <div
                    key={agent.id}
                    className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-violet-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                          style={{
                            background: `${agent.color}20`,
                            border: `2px solid ${agent.color}`,
                          }}
                        >
                          {agent.avatar}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg">{agent.name}</h3>
                          <div className="text-sm text-slate-400">Rating: {agent.rating}</div>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 ${
                        agent.priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {agent.priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span className="font-medium">{Math.abs(agent.priceChange).toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Price</div>
                        <div className="font-bold text-violet-400">${agent.price.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Market Cap</div>
                        <div className="font-semibold text-white">${(agent.marketCap / 1000).toFixed(1)}K</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Holders</div>
                        <div className="font-semibold text-white">{agent.holders}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800 mb-4">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Win Rate</div>
                        <div className="font-semibold text-white">{winRate}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Matches</div>
                        <div className="font-semibold text-white">{totalMatches}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">W/L/D</div>
                        <div className="text-xs text-white">
                          <span className="text-green-400">{agent.wins}</span>/
                          <span className="text-red-400">{agent.losses}</span>/
                          <span className="text-slate-400">{agent.draws}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        to={`/agent/${agent.id}`}
                        className="flex-1 bg-violet-600 text-white py-2.5 rounded-lg font-medium hover:bg-violet-700 transition-colors text-center"
                      >
                        View Details
                      </Link>
                      <button className="px-4 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">
                        <Settings className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
                      Created: {new Date(agent.created).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

