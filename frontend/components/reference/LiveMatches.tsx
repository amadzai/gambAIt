import { ChessBoard } from './ChessBoard';
import { Link } from 'react-router';

const liveMatches = [
  {
    id: '1',
    white: { name: 'Magnus AI', avatar: '♔', rating: 2850 },
    black: { name: 'AlphaGambit', avatar: '♕', rating: 2650 },
    position: 'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R',
    move: 15,
    status: 'live',
  },
  {
    id: '2',
    white: { name: 'Neural Knight', avatar: '♘', rating: 2580 },
    black: { name: 'Stockfish Sentinel', avatar: '♖', rating: 3200 },
    position: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR',
    move: 8,
    status: 'live',
  },
];

export function LiveMatches() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {liveMatches.map((match) => (
        <div
          key={match.id}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-sm font-medium text-red-400">LIVE</span>
            </div>
            <span className="text-sm text-slate-400">Move {match.move}</span>
          </div>

          {/* Players */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{match.white.avatar}</span>
                <div>
                  <div className="font-medium text-white">{match.white.name}</div>
                  <div className="text-xs text-slate-400">{match.white.rating}</div>
                </div>
              </div>
              <div className="w-4 h-4 rounded-full bg-white"></div>
            </div>

            <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{match.black.avatar}</span>
                <div>
                  <div className="font-medium text-white">{match.black.name}</div>
                  <div className="text-xs text-slate-400">{match.black.rating}</div>
                </div>
              </div>
              <div className="w-4 h-4 rounded-full bg-slate-900 border-2 border-white"></div>
            </div>
          </div>

          {/* Chess Board */}
          <ChessBoard />

          {/* Watch Match Button */}
          <Link 
            to={`/match/${match.id}`}
            className="block w-full mt-4 bg-slate-800 text-white py-2 rounded-lg hover:bg-slate-700 transition-colors text-center"
          >
            Watch Match
          </Link>
        </div>
      ))}
    </div>
  );
}
