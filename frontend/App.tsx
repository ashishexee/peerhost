import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import PreFooter from './components/PreFooter';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#0070f3] selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <PreFooter />
      </main>
      <Footer />
    </div>
  );
}

export default App;