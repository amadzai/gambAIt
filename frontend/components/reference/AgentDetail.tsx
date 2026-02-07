import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, TrendingUp, TrendingDown, Users, Trophy } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export function AgentDetail() {
  const { id } = useParams();
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');

  // Mock data - in real app, fetch based on id
  const agent = {
    id: '1',
    name: 'Magnus AI',
    avatar: '♔',
    price: 2.45,
    priceChange: 12.5,
    marketCap: 124500,
    rating: 2850,
    wins: 234,
    losses: 45,
    draws: 21,
    color: '#8B5CF6',
    description: 'An aggressive chess AI trained on millions of grandmaster games. Specializes in tactical combinations and sharp openings.',
    holders: 523,
    volume24h: 45600,
  };

  const priceHistory = [
    { time: '00:00', price: 2.1, volume: 5000 },
    { time: '04:00', price: 2.15, volume: 6200 },
    { time: '08:00', price: 2.3, volume: 8900 },
    { time: '12:00', price: 2.25, volume: 7100 },
    { time: '16:00', price: 2.4, volume: 9800 },
    { time: '20:00', price: 2.45, volume: 11200 },
  ];

  const recentMatches = [
    { opponent: 'Neural Knight', result: 'win', moves: 45, rating: 2580 },
    { opponent: 'Rook Reaper', result: 'loss', moves: 67, rating: 2920 },
    { opponent: 'AlphaGambit', result: 'win', moves: 38, rating: 2650 },
    { opponent: 'Queen\'s Gambit AI', result: 'draw', moves: 89, rating: 3100 },
    { opponent: 'Stockfish Sentinel', result: 'win', moves: 52, rating: 3200 },
  ];

  const winRate = ((agent.wins / (agent.wins + agent.losses + agent.draws)) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/marketplace" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Back to Marketplace
            </Link>
            <Link to="/dashboard" className="text-slate-300 hover:text-white transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Agent Header */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl flex-shrink-0"
              style={{ background: `${agent.color}20`, border: `3px solid ${agent.color}` }}
            >
              {agent.avatar}
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{agent.name}</h1>
              <p className="text-slate-400 mb-4">{agent.description}</p>
              
              <div className="flex flex-wrap gap-6">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Current Price</div>
                  <div className="text-2xl font-bold text-white">${agent.price.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">24h Change</div>
                  <div className={`text-2xl font-bold flex items-center gap-1 ${
                    agent.priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {agent.priceChange >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    {Math.abs(agent.priceChange).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Market Cap</div>
                  <div className="text-2xl font-bold text-white">${(agent.marketCap / 1000).toFixed(1)}K</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Rating</div>
                  <div className="text-2xl font-bold text-violet-400">{agent.rating}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Charts & Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Chart */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Price History</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={priceHistory}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={agent.color} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={agent.color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
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
                    dataKey="price"
                    stroke={agent.color}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="text-sm text-slate-400 mb-1">Win Rate</div>
                <div className="text-2xl font-bold text-green-400">{winRate}%</div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="text-sm text-slate-400 mb-1">Total Matches</div>
                <div className="text-2xl font-bold text-white">{agent.wins + agent.losses + agent.draws}</div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="text-sm text-slate-400 mb-1">Holders</div>
                <div className="text-2xl font-bold text-white flex items-center gap-1">
                  <Users className="w-5 h-5" />
                  {agent.holders}
                </div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="text-sm text-slate-400 mb-1">24h Volume</div>
                <div className="text-2xl font-bold text-white">${(agent.volume24h / 1000).toFixed(1)}K</div>
              </div>
            </div>

            {/* Recent Matches */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Recent Matches
              </h2>
              <div className="space-y-3">
                {recentMatches.map((match, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        match.result === 'win' ? 'bg-green-400' :
                        match.result === 'loss' ? 'bg-red-400' :
                        'bg-slate-400'
                      }`}></div>
                      <div>
                        <div className="font-medium text-white">vs {match.opponent}</div>
                        <div className="text-sm text-slate-400">Rating: {match.rating}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold uppercase ${
                        match.result === 'win' ? 'text-green-400' :
                        match.result === 'loss' ? 'text-red-400' :
                        'text-slate-400'
                      }`}>
                        {match.result}
                      </div>
                      <div className="text-sm text-slate-400">{match.moves} moves</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Trading */}
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 sticky top-6">
              <h2 className="text-xl font-bold text-white mb-6">Trade Agent Shares</h2>
              
              {/* Buy/Sell Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setTradeType('buy')}
                  className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                    tradeType === 'buy'
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setTradeType('sell')}
                  className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                    tradeType === 'sell'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Sell
                </button>
              </div>

              {/* Amount Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Amount (ETH)
                </label>
                <input
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              {/* Trade Summary */}
              <div className="bg-slate-800/50 rounded-lg p-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Price per share</span>
                  <span className="text-white font-medium">${agent.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Est. shares</span>
                  <span className="text-white font-medium">
                    {tradeAmount ? (parseFloat(tradeAmount) / agent.price).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-slate-700">
                  <span className="text-slate-400">Platform fee (2%)</span>
                  <span className="text-white font-medium">
                    {tradeAmount ? (parseFloat(tradeAmount) * 0.02).toFixed(4) : '0.00'} ETH
                  </span>
                </div>
              </div>

              {/* Trade Button */}
              <button
                className={`w-full py-3.5 rounded-lg font-medium transition-all ${
                  tradeType === 'buy'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/25'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/25'
                }`}
              >
                {tradeType === 'buy' ? 'Buy Shares' : 'Sell Shares'}
              </button>

              {/* Wallet Info */}
              <div className="mt-6 pt-6 border-t border-slate-800">
                <div className="text-sm text-slate-400 mb-2">Your Holdings</div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-300">Shares</span>
                  <span className="font-bold text-white">12.5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Value</span>
                  <span className="font-bold text-violet-400">${(12.5 * agent.price).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
