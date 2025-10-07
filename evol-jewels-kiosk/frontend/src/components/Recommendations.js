import React, { useEffect, useState } from 'react';

const translations = {
  en: {
    title: 'Recommended For You',
    price: 'Price',
    design: 'Design',
    inspiredBy: 'Inspired by',
    viewItem: 'View Item',
    back: 'Back to Survey',
    noResults: 'No jewelry found matching your criteria. Try adjusting your preferences.'
  },
  hi: {
    title: 'आपके लिए सुझाव',
    price: 'कीमत',
    design: 'डिज़ाइन',
    inspiredBy: 'से प्रेरित',
    viewItem: 'आइटम देखें',
    back: 'वापस सर्वेक्षण पर जाएं',
    noResults: 'आपकी पसंद से मेल खाने वाली कोई ज्वेलरी नहीं मिली। कृपया अपनी प्राथमिकताएं बदलकर देखें।'
  }
};

const Recommendations = ({ recommendations, onBack, language = 'en' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const t = translations[language] || translations.en;

  useEffect(() => {
    // Auto-rotate recommendations every 5 seconds
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % Math.max(1, recommendations.length));
    }, 5000);
    return () => clearInterval(timer);
  }, [recommendations.length]);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance(text);
      speech.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      window.speechSynthesis.speak(speech);
    }
  };

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-xl mb-6">{t.noResults}</p>
        <button
          onClick={onBack}
          className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
        >
          {t.back}
        </button>
      </div>
    );
  }

  const currentItem = recommendations[currentIndex];
  const safeImg = (currentItem?.image_url && String(currentItem.image_url).trim() !== '')
    ? currentItem.image_url
    : 'https://via.placeholder.com/400x400?text=Jewelry+Image';
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8 text-pink-600">{t.title}</h2>
      
      <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row">
        <div className="md:w-1/2 bg-gray-100 flex items-center justify-center p-6">
          <img 
            src={safeImg} 
            alt={currentItem.name} 
            className="max-h-96 max-w-full object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/400x400?text=Jewelry+Image';
            }}
          />
        </div>
        
        <div className="p-8 md:w-1/2 flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">{currentItem.name}</h3>
            <p className="text-gray-600 mb-4">{currentItem.category}</p>
            <p className="text-lg mb-6">{currentItem.description || 'Elegant and stylish jewelry piece.'}</p>
            {currentItem.design && (
              <div className="mb-6">
                <p className="text-sm text-gray-500">{t.design}</p>
                <p className="text-base">{currentItem.design}</p>
              </div>
            )}
            
            <div className="mb-6">
              <p className="text-sm text-gray-500">{t.price}</p>
              <p className="text-2xl font-bold text-pink-600">₹{currentItem.price.toLocaleString()}</p>
            </div>
            
            <div>
              <p className="text-lg font-medium">{currentItem.celebrity_inspiration}</p>
            </div>
          </div>
          
          <div className="mt-8 flex flex-col space-y-4">
          <button 
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
            onClick={() => speak(`${currentItem.name}. ${currentItem.category}. ${currentItem.design ? `Design: ${currentItem.design}. ` : ''}Priced at ₹${currentItem.price}. inspired by ${currentItem.celebrity_inspiration}`)}
          >
            {language === 'hi' ? 'विवरण सुनें' : 'Hear Description'}
          </button>

          {currentItem.link && (
            <a
              href={currentItem.link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center bg-white border border-pink-600 text-pink-600 hover:bg-pink-50 font-bold py-3 px-6 rounded-lg text-lg transition-colors"
            >
              {t.viewItem}
            </a>
          )}
          
          <button
            onClick={onBack}
            className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg text-lg"
          >
            {t.back}
          </button>
        </div>
      </div>
    </div>
    
    {recommendations.length > 1 && (
      <div className="flex justify-center mt-6 space-x-2">
        {recommendations.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full ${
              index === currentIndex ? 'bg-pink-600' : 'bg-gray-300'
            }`}
            aria-label={`View item ${index + 1}`}
          />
        ))}
      </div>
    )}
  </div>
);
};

export default Recommendations;
