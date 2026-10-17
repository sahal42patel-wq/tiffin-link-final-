import React, { useState } from 'react';
import confetti from 'canvas-confetti';

export default function ContactSection() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !message) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${firstName} ${lastName}`,
          email,
          subject: 'Artisanal Culinary Inquiry',
          message,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Confetti effect
        confetti({
          particleCount: 80,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#1A1A1A', '#4A4238']
        });

        // Reset
        setFirstName('');
        setLastName('');
        setEmail('');
        setMessage('');
      }
    } catch (error) {
      console.error('Contact submission failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Contact Section */}
      <section className="py-12 md:py-20 bg-surface-container-low px-4 sm:px-6 md:px-margin-desktop border-b border-sand-neutral/40" id="contact">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-gutter">
          <div className="md:col-span-4 reveal-on-scroll">
            <p className="font-label-caps text-xs sm:text-sm font-bold tracking-[0.25em] text-[#6B4B2B] dark:text-[#D4AF37] mb-4 md:mb-8 uppercase">
              GET IN TOUCH
            </p>
            <h2 className="font-headline-lg text-3xl sm:text-5xl md:text-headline-lg font-serif font-bold text-onyx-black dark:text-white mb-8 md:mb-12">
              Start your culinary journey.
            </h2>
            <div className="space-y-4 text-[#2E1E12] dark:text-[#E8DDD0]">
              <p className="font-body-lg text-base sm:text-body-lg font-medium">hello@tiffinlink.com</p>
              <p className="font-body-lg text-base sm:text-body-lg font-medium">+1 (800) TIFFIN-CRAFT</p>
              <p className="font-body-lg text-base sm:text-body-lg font-medium">840 Artisanal Way, Suite 400<br/>San Francisco, CA 94103</p>
            </div>
          </div>
          <div className="md:col-span-7 md:col-start-6 reveal-on-scroll">
            <form onSubmit={handleSubmit} className="space-y-8 md:space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
                <div className="relative pb-4 group">
                  <label className="font-label-caps text-xs font-bold tracking-widest text-[#2E1E12] dark:text-[#F3E5AB] uppercase mb-1 block">
                    FIRST NAME
                  </label>
                  <input 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-transparent border-none p-0 py-2.5 focus:ring-0 text-body-md text-[#18181B] dark:text-white font-medium placeholder-stone-400" 
                    type="text"
                    required
                  />
                  {/* Underline Base & Animation */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#8C653E]/50 dark:bg-[#787888]" />
                  <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#18181B] dark:bg-[#D4AF37] scale-x-0 group-hover:scale-x-100 group-focus-within:scale-x-100 transition-transform duration-500 origin-left" />
                </div>
                <div className="relative pb-4 group">
                  <label className="font-label-caps text-xs font-bold tracking-widest text-[#2E1E12] dark:text-[#F3E5AB] uppercase mb-1 block">
                    LAST NAME
                  </label>
                  <input 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-transparent border-none p-0 py-2.5 focus:ring-0 text-body-md text-[#18181B] dark:text-white font-medium placeholder-stone-400" 
                    type="text"
                    required
                  />
                  {/* Underline Base & Animation */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#8C653E]/50 dark:bg-[#787888]" />
                  <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#18181B] dark:bg-[#D4AF37] scale-x-0 group-hover:scale-x-100 group-focus-within:scale-x-100 transition-transform duration-500 origin-left" />
                </div>
              </div>
              <div className="relative pb-4 group">
                <label className="font-label-caps text-xs font-bold tracking-widest text-[#2E1E12] dark:text-[#F3E5AB] uppercase mb-1 block">
                  EMAIL ADDRESS
                </label>
                <input 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-none p-0 py-2.5 focus:ring-0 text-body-md text-[#18181B] dark:text-white font-medium placeholder-stone-400" 
                  type="email"
                  required
                />
                {/* Underline Base & Animation */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#8C653E]/50 dark:bg-[#787888]" />
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#18181B] dark:bg-[#D4AF37] scale-x-0 group-hover:scale-x-100 group-focus-within:scale-x-100 transition-transform duration-500 origin-left" />
              </div>
              <div className="relative pb-4 group">
                <label className="font-label-caps text-xs font-bold tracking-widest text-[#2E1E12] dark:text-[#F3E5AB] uppercase mb-1 block">
                  HOW CAN WE HELP?
                </label>
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-transparent border-none p-0 py-2.5 focus:ring-0 text-body-md text-[#18181B] dark:text-white font-medium resize-none placeholder-stone-400" 
                  rows={3}
                  required
                ></textarea>
                {/* Underline Base & Animation */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#8C653E]/50 dark:bg-[#787888]" />
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#18181B] dark:bg-[#D4AF37] scale-x-0 group-hover:scale-x-100 group-focus-within:scale-x-100 transition-transform duration-500 origin-left" />
              </div>
              <button 
                disabled={loading}
                type="submit"
                className="w-full sm:w-auto bg-[#18181B] text-white hover:bg-[#3F3D38] dark:bg-[#D4AF37] dark:text-black dark:hover:bg-[#E5C158] px-10 py-4 font-bold tracking-wider rounded shadow-md transition-all duration-300 scale-100 active:scale-95 disabled:opacity-50"
              >
                {loading ? 'SENDING...' : 'SEND MESSAGE'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
