import React, { useState } from 'react';

const translations = {
  en: {
    title: 'Evol Jewels Stylist',
    subtitle: 'Find your perfect jewelry match',
    occasion: 'What is the occasion?',
    occasionOptions: {
      wedding: 'Wedding',
      party: 'Party',
      everyday: 'Everyday Wear',
      gifting: 'Gift'
    },
    style: 'Which style do you prefer?',
    styleOptions: {
      minimal: 'Minimal',
      bold: 'Bold',
      traditional: 'Traditional',
      modern: 'Modern'
    },
    category: 'Preferred category (optional)',
    categoryOptions: {
      earrings: 'Earrings',
      necklace: 'Necklace',
      ring: 'Ring'
    },
    vibe: 'Inspiration or vibe (optional)',
    vibePlaceholder: 'e.g., Deepika, classic, glam',
    budget: 'Your budget (₹)?',
    findJewelry: 'Find My Jewelry',
    language: 'Language',
    languages: {
      en: 'English',
      hi: 'हिंदी'
    }
  },
  hi: {
    title: 'एवोल ज्वेल्स स्टाइलिस्ट',
    subtitle: 'अपना परफेक्ट ज्वेलरी मैच खोजें',
    occasion: 'किस अवसर के लिए?',
    occasionOptions: {
      wedding: 'शादी',
      party: 'पार्टी',
      everyday: 'रोज़ाना पहनने के लिए',
      gifting: 'उपहार'
    },
    style: 'आपको कौन सी शैली पसंद है?',
    styleOptions: {
      minimal: 'मिनिमल',
      bold: 'बोल्ड',
      traditional: 'पारंपरिक',
      modern: 'आधुनिक'
    },
    category: 'पसंदीदा श्रेणी (वैकल्पिक)',
    categoryOptions: {
      earrings: 'ईयररिंग्स',
      necklace: 'नेकलेस',
      ring: 'रिंग'
    },
    vibe: 'प्रेरणा या वाइब (वैकल्पिक)',
    vibePlaceholder: 'जैसे, दीपिका, क्लासिक, ग्लैम',
    budget: 'आपका बजट (₹)?',
    findJewelry: 'मेरी ज्वेलरी ढूंढें',
    language: 'भाषा',
    languages: {
      en: 'English',
      hi: 'हिंदी'
    }
  }
};

const Survey = ({ onSubmit, onLanguageChange }) => {
  const [formData, setFormData] = useState({
    occasion: '',
    style: '',
    budget: 10000,
    language: 'en',
    category: '',
    vibe: ''
  });

  const t = translations[formData.language];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'budget' ? parseFloat(value) : value
    }));
    if (name === 'language' && onLanguageChange) {
      onLanguageChange(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.occasion && formData.style) {
      onSubmit(formData);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto text-center">
      <h1 className="text-4xl font-bold mb-2 text-pink-600">{t.title}</h1>
      <p className="text-xl mb-8 text-gray-600">{t.subtitle}</p>

      <div className="mb-6 text-left">
        <label className="block text-lg font-medium mb-2">{t.language}</label>
        <select
          name="language"
          value={formData.language}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg text-lg"
        >
          {Object.entries(t.languages).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-left">
          <label className="block text-lg font-medium mb-2">{t.occasion}</label>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(t.occasionOptions).map(([value, label]) => (
              <div key={value} className="flex items-center">
                <input
                  type="radio"
                  id={value}
                  name="occasion"
                  value={value}
                  checked={formData.occasion === value}
                  onChange={handleChange}
                  className="h-6 w-6 text-pink-600 focus:ring-pink-500"
                />
                <label htmlFor={value} className="ml-3 block text-lg">{label}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="text-left">
          <label className="block text-lg font-medium mb-2">{t.style}</label>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(t.styleOptions).map(([value, label]) => (
              <div key={value} className="flex items-center">
                <input
                  type="radio"
                  id={`style-${value}`}
                  name="style"
                  value={value}
                  checked={formData.style === value}
                  onChange={handleChange}
                  className="h-6 w-6 text-pink-600 focus:ring-pink-500"
                />
                <label htmlFor={`style-${value}`} className="ml-3 block text-lg">{label}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="text-left">
          <label className="block text-lg font-medium mb-2">
            {t.budget} (₹{formData.budget.toLocaleString()})
          </label>
          <input
            type="range"
            name="budget"
            min="1000"
            max="100000"
            step="1000"
            value={formData.budget}
            onChange={handleChange}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>₹1,000</span>
            <span>₹1,00,000</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!formData.occasion || !formData.style}
          className={`w-full py-4 px-6 text-xl font-bold rounded-lg ${
            !formData.occasion || !formData.style
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-pink-600 hover:bg-pink-700 text-white transform hover:scale-105 transition-transform'
          }`}
        >
          {t.findJewelry}
        </button>
      </form>
    </div>
  );
};

export default Survey;