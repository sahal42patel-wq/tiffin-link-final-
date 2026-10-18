import React, { useState } from 'react';
import {
  ChefHat,
  Award,
  Sparkles,
  CheckCircle2,
  X,
  BookOpen,
  Heart,
  TrendingUp,
  Coins
} from 'lucide-react';
import { submitCommunityRecipe } from '../services/advancedFeaturesApi';

export default function CommunityRecipeModal({ isOpen, onClose }) {
  const [recipeName, setRecipeName] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [region, setRegion] = useState('Gujarati Kathiyawadi');
  const [secretIngredients, setSecretIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dietaryType, setDietaryType] = useState('veg');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await submitCommunityRecipe({
        recipeName,
        authorName,
        region,
        dietaryType,
        secretIngredients: secretIngredients.split(',').map(s => s.trim()).filter(Boolean),
        instructions
      });
      if (res && res.success) {
        setSubmitted(true);
      }
    } catch (e) {
      alert('Recipe submitted: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Community Chef Spotlight</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 uppercase tracking-widest">
                  Earn Royalties
                </span>
              </div>
              <p className="text-xs text-amber-100">
                Share your family heirloom recipe & earn credits whenever kitchens cook it
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-stone-900 dark:text-stone-100">
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base">Recipe Sent for Culinary Review!</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Our chef curation panel will test <strong>{recipeName}</strong>. Once approved, local partner kitchens will feature it on their menu, and you&apos;ll earn <strong>5% royal credit</strong> on every single thali ordered!
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center gap-3">
                <Coins className="w-6 h-6 text-amber-600 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-amber-900 dark:text-amber-200">Earn ₹5 - ₹10 Per Tiffin:</span>{' '}
                  <span className="text-amber-700 dark:text-amber-300">
                    Over ₹45,000 paid out this month to grandmother & home-chef contributors across Gujarat!
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Recipe / Dish Title
                  </label>
                  <input
                    type="text"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    placeholder="e.g. Baa&apos;s Methi Thepla"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Your Name / Pen Name
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Neha Ben"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Cuisine Regional Style
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Gujarati Kathiyawadi">Kathiyawadi / Saurashtra</option>
                    <option value="Surati Gujarati">Surati (Sweet & Savory)</option>
                    <option value="Rajasthani Marwari">Rajasthani Marwari</option>
                    <option value="Maharashtrian">Maharashtrian Desi</option>
                    <option value="North Indian Ghar Jaisa">North Indian Homestyle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={dietaryType}
                    onChange={(e) => setDietaryType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="veg">100% Pure Veg</option>
                    <option value="jain">Jain (No Onion/Garlic/Root Veg)</option>
                    <option value="swaminarayan">Swaminarayan Satvik</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Secret Spices & Ingredients (comma-separated)
                </label>
                <input
                  type="text"
                  value={secretIngredients}
                  onChange={(e) => setSecretIngredients(e.target.value)}
                  placeholder="e.g. White sesame seeds, roasted cumin, desi cow ghee, rock salt"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Preparation Instructions / Secret Tips
                </label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Describe how to slow-cook, tempering techniques, or dough-kneading secrets..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs tracking-wider transition shadow"
              >
                {loading ? 'Submitting Recipe...' : 'Submit Recipe & Register for Royalties'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
