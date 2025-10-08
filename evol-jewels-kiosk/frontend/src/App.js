import React, { useState } from 'react';
import axios from 'axios';
import Survey from './components/Survey';
import Recommendations from './components/Recommendations';
import TryOn from './components/TryOn';
import Home from './components/Home';
import './App.css';

const API_URL = 'http://localhost:8000';

function App() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('en');
  const [showTryOn, setShowTryOn] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showHome, setShowHome] = useState(true);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/recommend`, {
        occasion: formData.occasion,
        style: formData.style,
        budget: formData.budget,
        language: formData.language,
        category: formData.category || null,
        vibe: formData.vibe || null
      });
      
      setRecommendations(response.data);
      setLanguage(formData.language);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to fetch recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setRecommendations([]);
    setError(null);
    setShowHome(true);
  };

  const handleTryOn = (item) => {
    setSelectedItem(item || null);
    setShowTryOn(true);
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
  };

  const handleStartTryOn = () => {
    setSelectedItem(null);
    setShowTryOn(true);
  };

  const handleStartQuiz = () => {
    setShowHome(false);
  };

  const handleBrowse = () => {
    // Placeholder: in future, navigate to a browse/catalog page
    setShowHome(false);
  };

  const handleOpenFavorites = () => {
    // Placeholder toast or future page
    alert('Favorites coming soon');
  };

  // Removed appointment handler

  // Set document title and direction based on language
  React.useEffect(() => {
    document.title = language === 'hi' 
      ? 'एवोल ज्वेल्स स्टाइलिस्ट' 
      : 'Evol Jewels Stylist';
    
    document.documentElement.dir = language === 'hi' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-amber-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {showTryOn ? (
          <TryOn 
            onBack={() => setShowTryOn(false)} 
            item={selectedItem}
          />
        ) : loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-pink-600 border-opacity-50"></div>
          </div>
        ) : recommendations.length > 0 ? (
          <Recommendations 
            recommendations={recommendations} 
            onBack={handleBack} 
            language={language}
            onTryOn={handleTryOn}
          />
        ) : showHome ? (
          <Home 
            onStartTryOn={handleStartTryOn}
            onStartQuiz={handleStartQuiz}
            onBrowse={handleBrowse}
            onOpenFavorites={handleOpenFavorites}
          />
        ) : (
          <Survey 
            onSubmit={handleSubmit} 
            onLanguageChange={handleLanguageChange} 
          />
        )}
        
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 max-w-sm rounded shadow-lg">
            <p>{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-red-700 hover:text-red-900 font-bold"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
