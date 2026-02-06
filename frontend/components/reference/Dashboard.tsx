import { useState } from 'react';
import { Link } from 'react-router';
import { AgentCard } from './AgentCard';
import { LiveMatches } from './LiveMatches';
import { Leaderboard } from './Leaderboard';
import { CreateAgentModal } from './CreateAgentModal';
import { Bot, Trophy, Zap, TrendingUp } from 'lucide-react';

const mockAgents = [
  {
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
    performance: [2.1, 2.15, 2.3, 2.25, 2.4, 2.45],
    color: '#8B5CF6'
  },
  {
    id: '2',
    name: 'Stockfish Sentinel',
    avatar: '♖',
    price: 5.82,
    priceChange: -3.2,
    marketCap: 582000,
    rating: 3200,
    wins: 456,
    losses: 12,
    draws: 32,
    performance: [6.5, 6.2, 5.9, 5.8, 5.85, 5.82],
    color: '#EC4899'
  },
  {
    id: '3',
    name: 'AlphaGambit',
    avatar: '♕',
    price: 1.23,
    priceChange: 45.8,
    marketCap: 61500,
    rating: 2650,
    wins: 145,
    losses: 78,
    draws: 15,
    performance: [0.8, 0.85, 0.95, 1.05, 1.15, 1.23],
    color: '#10B981'
  },
  {
    id: '4',
    name: 'Neural Knight',
    avatar: '♘',
    price: 0.95,
    priceChange: 8.4,
    marketCap: 47500,
    rating: 2580,
    wins: 98,
    losses: 45,
    draws: 12,
    performance: [0.82, 0.85, 0.88, 0.90, 0.92, 0.95],
    color: '#F59E0B'
  },
  {
    id: '5',
    name: 'Rook Reaper',
    avatar: '♜',
    price: 3.67,
    priceChange: -1.5,
    marketCap: 183500,
    rating: 2920,
    wins: 312,
    losses: 67,
    draws: 45,
    performance: [3.9, 3.8, 3.75, 3.7, 3.68, 3.67],
    color: '#06B6D4'
  },
  {
    id: '6',
    name: 'Queen\'s Gambit AI',
    avatar: '♛',
    price: 7.12,
    priceChange: 23.7,
    marketCap: 712000,
    rating: 3100,
    wins: 523,
    losses: 34,
    draws: 67,
    performance: [5.5, 5.8, 6.2, 6.5, 6.9, 7.12],
    color: '#EF4444'
  },
];

export function Dashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'trending' | 'new'>('all');

  const stats = [
    { label: 'Total Agents', value: '1,234', icon: Bot, change: '+12%' },
    { label: 'Total Volume', value: '$2.4M', icon: TrendingUp, change: '+34%' },
    { label: 'Matches Today', value: '456', icon: Zap, change: '+8%' },
    { label: 'Prize Pool', value: '$89K', icon: Trophy, change: '+23%' },
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
                className="text-violet-400 font-medium"
              >
                Marketplace
              </Link>
              <Link
                to="/dashboard"
                className="text-slate-300 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/25"
              >
                Create Agent
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-green-400">{stat.change}</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Live Matches Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Live Matches
          </h2>
          <LiveMatches />
        </div>

        {/* Marketplace */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Agent Marketplace</h2>
          <div className="flex gap-2">
            {(['all', 'trending', 'new'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                  filterTab === tab
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {mockAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>

        {/* Leaderboard */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Top Performers
          </h2>
          <Leaderboard agents={mockAgents} />
        </div>
      </div>

      {isCreateModalOpen && (
        <CreateAgentModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </div>
  );
}
