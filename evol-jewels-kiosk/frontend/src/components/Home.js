import React from 'react';

const Home = ({ onStartTryOn, onStartQuiz, onBrowse, onOpenFavorites }) => {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-indigo-800 to-indigo-900 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-8 md:p-12 border border-white/60">
          {/* Logo / Badge */}
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-300 to-pink-400 flex items-center justify-center shadow-md">
            <span className="text-2xl">✨</span>
          </div>

          <h1 className="text-center text-2xl md:text-3xl font-semibold mt-4 text-gray-800">Smart AI Jewelry Kiosk</h1>
          <p className="text-center text-gray-500 max-w-2xl mx-auto mt-3">
            Experience the future of jewelry shopping with AI-powered recommendations. Discover
            exquisite pieces that perfectly complement your unique style.
          </p>

          {/* Primary CTA */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={onStartTryOn}
              className="w-full md:w-auto px-6 md:px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-[0_8px_20px_rgba(79,70,229,0.35)] transition flex items-center justify-center gap-2"
            >
              <span>📷</span>
              <span>Start Virtual Try-On</span>
            </button>
          </div>

          {/* Feature tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
            <button onClick={onBrowse} className="group text-left bg-gradient-to-br from-white to-indigo-50 rounded-2xl p-6 border border-indigo-100 hover:shadow-lg transition">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">🔲</div>
              <div className="font-semibold text-gray-800 mb-1">Browse</div>
              <div className="text-sm text-gray-500">Explore Collection</div>
            </button>

            <button onClick={onStartQuiz} className="group text-left bg-gradient-to-br from-white to-amber-50 rounded-2xl p-6 border border-amber-100 hover:shadow-lg transition">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">📖</div>
              <div className="font-semibold text-gray-800 mb-1">Style Quiz</div>
              <div className="text-sm text-gray-500">Find Your Match</div>
            </button>

            <button onClick={onOpenFavorites} className="group text-left bg-gradient-to-br from-white to-rose-50 rounded-2xl p-6 border border-rose-100 hover:shadow-lg transition">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">❤️</div>
              <div className="font-semibold text-gray-800 mb-1">Favorites</div>
              <div className="text-sm text-gray-500">Saved Items</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
