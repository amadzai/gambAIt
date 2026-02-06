import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Clock, Users, Crown, TrendingUp } from 'lucide-react';

interface Move {
  moveNumber: number;
  white: string;
  black?: string;
  evaluation: number; // Positive favors white, negative favors black
}

export function LiveMatch() {
  const { id } = useParams();
  const [currentMove, setCurrentMove] = useState(8);
  
  // Mock match data
  const match = {
    id: '1',
    white: {
      id: '1',
      name: 'Magnus AI',
      avatar: '♔',
      rating: 2850,
      color: '#8B5CF6',
    },
    black: {
      id: '3',
      name: 'AlphaGambit',
      avatar: '♕',
      rating: 2650,
      color: '#10B981',
    },
    currentTurn: 'white',
    status: 'live',
    startTime: new Date(Date.now() - 1800000), // 30 minutes ago
  };

  // Chess board state - simplified for demo
  const initialPosition = [
    ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
    ['♟', '♟', '♟', '', '♟', '♟', '♟', '♟'],
    ['', '', '', '', '', '♞', '', ''],
    ['', '', '', '', '♟', '', '', ''],
    ['', '', '', '', '♙', '', '', ''],
    ['', '', '', '', '', '♘', '', ''],
    ['♙', '♙', '♙', '♙', '', '♙', '♙', '♙'],
    ['♖', '♘', '♗', '♕', '♔', '♗', '', '♖'],
  ];

  // Move history
  const moves: Move[] = [
    { moveNumber: 1, white: 'e4', black: 'e5', evaluation: 0.3 },
    { moveNumber: 2, white: 'Nf3', black: 'Nc6', evaluation: 0.2 },
    { moveNumber: 3, white: 'Bb5', black: 'a6', evaluation: 0.4 },
    { moveNumber: 4, white: 'Ba4', black: 'Nf6', evaluation: 0.3 },
    { moveNumber: 5, white: 'O-O', black: 'Be7', evaluation: 0.5 },
    { moveNumber: 6, white: 'd3', black: 'b5', evaluation: 0.4 },
    { moveNumber: 7, white: 'Bb3', black: 'd6', evaluation: 0.6 },
    { moveNumber: 8, white: 'c3', evaluation: 0.5 },
  ];

  const lastMove = moves[moves.length - 1];
  const currentEvaluation = lastMove.evaluation;

  // Calculate time elapsed
  const [timeElapsed, setTimeElapsed] = useState('');
  
  useEffect(() => {
    const updateTime = () => {
      const elapsed = Date.now() - match.startTime.getTime();
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      setTimeElapsed(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [match.startTime]);

  // Normalize evaluation to percentage (0-100)
  const getEvaluationPercentage = (evaluation: number) => {
    // evaluation range typically -10 to +10, we'll map to 0-100
    const normalized = (evaluation + 10) / 20;
    return Math.max(0, Math.min(100, normalized * 100));
  };

  const whiteAdvantage = getEvaluationPercentage(currentEvaluation);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/marketplace" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Back to Marketplace
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-sm font-medium text-red-400">LIVE</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{timeElapsed}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="w-4 h-4" />
                <span>1,234 watching</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto px-6 py-8">
        <div className="grid grid-cols-[200px_1fr_350px] gap-6">
          {/* Left Column - Evaluation Bar */}
          <div className="space-y-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-4">Evaluation</h3>
              
              {/* Evaluation Bar */}
              <div className="relative h-[600px] bg-slate-800 rounded-lg overflow-hidden">
                {/* Black advantage (top) */}
                <div 
                  className="absolute top-0 left-0 right-0 bg-slate-950 transition-all duration-500"
                  style={{ height: `${100 - whiteAdvantage}%` }}
                ></div>
                
                {/* White advantage (bottom) */}
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-slate-100 transition-all duration-500"
                  style={{ height: `${whiteAdvantage}%` }}
                ></div>

                {/* Center line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-600 -translate-y-1/2"></div>

                {/* Evaluation number */}
                <div 
                  className="absolute left-1/2 -translate-x-1/2 transition-all duration-500"
                  style={{ 
                    top: `${100 - whiteAdvantage}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs font-bold text-white whitespace-nowrap">
                    {currentEvaluation > 0 ? '+' : ''}{currentEvaluation.toFixed(1)}
                  </div>
                </div>
              </div>

              {/* Labels */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-slate-100"></div>
                  <span className="text-xs text-slate-400">White Advantage</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-slate-950 border border-slate-700"></div>
                  <span className="text-xs text-slate-400">Black Advantage</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Column - Chess Board */}
          <div className="space-y-6">
            {/* Black Player Info */}
            <div className={`bg-slate-900/50 border rounded-xl p-4 transition-all ${
              match.currentTurn === 'black' ? 'border-green-500 shadow-lg shadow-green-500/20' : 'border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{
                      background: `${match.black.color}20`,
                      border: `2px solid ${match.black.color}`,
                    }}
                  >
                    {match.black.avatar}
                  </div>
                  <div>
                    <Link 
                      to={`/agent/${match.black.id}`}
                      className="font-bold text-white hover:text-green-400 transition-colors"
                    >
                      {match.black.name}
                    </Link>
                    <div className="text-sm text-slate-400">Rating: {match.black.rating}</div>
                  </div>
                </div>
                {match.currentTurn === 'black' && (
                  <div className="flex items-center gap-2 text-green-400 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-sm font-medium">Thinking...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Chess Board */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="aspect-square max-w-[700px] mx-auto">
                <div className="grid grid-cols-8 h-full rounded-lg overflow-hidden border-4 border-slate-700 shadow-2xl">
                  {initialPosition.map((row, rowIndex) =>
                    row.map((piece, colIndex) => {
                      const isLight = (rowIndex + colIndex) % 2 === 0;
                      const file = String.fromCharCode(97 + colIndex); // a-h
                      const rank = 8 - rowIndex; // 8-1
                      
                      return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={`relative flex items-center justify-center ${
                            isLight ? 'bg-slate-300' : 'bg-slate-600'
                          } transition-all hover:brightness-110 cursor-pointer`}
                        >
                          {/* Coordinates */}
                          {colIndex === 0 && (
                            <div className={`absolute left-1 top-1 text-xs font-bold ${
                              isLight ? 'text-slate-600' : 'text-slate-300'
                            }`}>
                              {rank}
                            </div>
                          )}
                          {rowIndex === 7 && (
                            <div className={`absolute right-1 bottom-1 text-xs font-bold ${
                              isLight ? 'text-slate-600' : 'text-slate-300'
                            }`}>
                              {file}
                            </div>
                          )}
                          
                          {/* Piece */}
                          {piece && (
                            <div className="text-5xl select-none drop-shadow-lg">
                              {piece}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* White Player Info */}
            <div className={`bg-slate-900/50 border rounded-xl p-4 transition-all ${
              match.currentTurn === 'white' ? 'border-green-500 shadow-lg shadow-green-500/20' : 'border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{
                      background: `${match.white.color}20`,
                      border: `2px solid ${match.white.color}`,
                    }}
                  >
                    {match.white.avatar}
                  </div>
                  <div>
                    <Link 
                      to={`/agent/${match.white.id}`}
                      className="font-bold text-white hover:text-violet-400 transition-colors"
                    >
                      {match.white.name}
                    </Link>
                    <div className="text-sm text-slate-400">Rating: {match.white.rating}</div>
                  </div>
                </div>
                {match.currentTurn === 'white' && (
                  <div className="flex items-center gap-2 text-green-400 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-sm font-medium">Thinking...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Move History */}
          <div className="space-y-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">Move History</h3>
                <span className="text-sm text-slate-400">Move {lastMove.moveNumber}</span>
              </div>

              <div className="space-y-1 max-h-[700px] overflow-y-auto custom-scrollbar">
                {moves.map((move) => (
                  <div
                    key={move.moveNumber}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      move.moveNumber === moves.length ? 'bg-violet-500/20 border border-violet-500/30' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="w-8 text-center text-sm font-bold text-slate-500">
                      {move.moveNumber}.
                    </div>
                    <div className="flex-1 flex gap-2">
                      <div className="flex-1 bg-slate-800/50 rounded px-3 py-2">
                        <div className="font-mono font-medium text-white">{move.white}</div>
                      </div>
                      {move.black && (
                        <div className="flex-1 bg-slate-800/50 rounded px-3 py-2">
                          <div className="font-mono font-medium text-white">{move.black}</div>
                        </div>
                      )}
                    </div>
                    <div className={`text-xs font-bold w-12 text-right ${
                      move.evaluation > 0 ? 'text-green-400' : move.evaluation < 0 ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {move.evaluation > 0 ? '+' : ''}{move.evaluation.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Match Stats */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <h3 className="font-bold text-white mb-4">Match Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Opening</span>
                  <span className="text-sm font-medium text-white">Ruy Lopez</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Time Control</span>
                  <span className="text-sm font-medium text-white">10+0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Prize Pool</span>
                  <span className="text-sm font-medium text-green-400">$1,250</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                  <span className="text-sm text-slate-400">Viewers</span>
                  <span className="text-sm font-medium text-white flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    1,234
                  </span>
                </div>
              </div>
            </div>

            {/* Trading Panel */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-400" />
                Live Trading
              </h3>
              <div className="space-y-3">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-400">{match.white.name}</span>
                    <span className="text-sm font-bold text-green-400">+2.3%</span>
                  </div>
                  <div className="text-lg font-bold text-white">$2.48</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-400">{match.black.name}</span>
                    <span className="text-sm font-bold text-red-400">-1.8%</span>
                  </div>
                  <div className="text-lg font-bold text-white">$1.21</div>
                </div>
              </div>
              <button className="w-full mt-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white py-2.5 rounded-lg font-medium hover:from-violet-700 hover:to-purple-700 transition-all">
                Trade Now
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
}
