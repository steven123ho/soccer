export function HomePage() {
  return (
    <div className="space-y-6 pb-20">
      <div className="bg-card rounded-xl p-6 border border-gray-600">
        <h2 className="text-2xl font-bold mb-2">Welcome to FIFA-Style Soccer Pickup!</h2>
        <p className="text-gray-400 mb-6">Organize your games with ultimate team cards</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-background rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">🎴</div>
            <h3 className="font-semibold mb-1">FIFA Cards</h3>
            <p className="text-sm text-gray-400">Beautiful player cards with stats</p>
          </div>
          
          <div className="bg-background rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold mb-1">Team Picker</h3>
            <p className="text-sm text-gray-400">Random or captain selection</p>
          </div>
          
          <div className="bg-background rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold mb-1">Voting System</h3>
            <p className="text-sm text-gray-400">Rate player abilities</p>
          </div>
          
          <div className="bg-background rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">🗳️</div>
            <h3 className="font-semibold mb-1">Polls</h3>
            <p className="text-sm text-gray-400">Schedule games easily</p>
          </div>
        </div>
      </div>
    </div>
  )
}
