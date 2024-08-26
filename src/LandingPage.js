import React from 'react';

const LandingPage = ({ onStartChat }) => {
  return (
    <div className="bg-gray-100 text-gray-800">
      {/* Hero Section */}
      <div className="relative flex flex-col items-center justify-center min-h-screen">
        <div className="absolute inset-0 grid grid-cols-3 gap-2 opacity-20">
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqEktGtMHCCc3TcxaCfNLqEOfByzSn9J6ZmA&s" alt="Background 1" className="w-full h-full object-cover"/>
          <img src="https://t4.ftcdn.net/jpg/06/59/01/71/360_F_659017126_Y6C9hIQIWxVO5Yh2ULonm9gws802bWUN.jpg" alt="Background 2" className="w-full h-full object-cover"/>
          <img src="https://t3.ftcdn.net/jpg/04/52/68/10/360_F_452681050_g4bwJDQsQztgJm1VIZ7HghpzA7KfWW06.jpg" alt="Background 3" className="w-full h-full object-cover"/>
          <img src="https://images.pexels.com/photos/10499692/pexels-photo-10499692.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500" alt="Background 4" className="w-full h-full object-cover"/>
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrWULLwtlE7FqeiDFDkZc6hQS1YEJKKgO6_A&s" alt="Background 5" className="w-full h-full object-cover"/>
          <img src="https://t4.ftcdn.net/jpg/02/36/03/39/360_F_236033986_48dVqHUAjNoW8Sr0KNqv6ZDfOkJ1u43o.jpg" alt="Background 6" className="w-full h-full object-cover"/>
        </div>
        <div className="relative z-10 text-center px-6">
          <h1 className="text-5xl font-bold mb-6">Welcome to Bereavemently</h1>
          <p className="text-2xl mb-8">AI-Powered Support for Your Time of Need</p>
          <button 
            onClick={onStartChat} 
            className="px-8 py-4 bg-blue-500 text-white text-xl rounded-lg hover:bg-blue-600"
          >
            Start Chat
          </button>
        </div>
      </div>

      {/* About Section */}
      <section className="py-20 bg-white text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">About Bereavemently</h2>
          <p className="text-lg text-gray-700">
            Bereavemently is an AI-powered platform designed to provide compassionate support during times of loss. 
            Whether you need someone to talk to or guidance through your grief, our AI is here to help you navigate through it.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-200 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-10">Our Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-2xl font-semibold mb-2">24/7 AI Chat</h3>
              <p className="text-gray-600">
                Access our AI chat support anytime, day or night, to get the help you need when you need it most.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-2xl font-semibold mb-2">Personalized Support</h3>
              <p className="text-gray-600">
                Our AI tailors responses and support to fit your unique situation, providing comfort and understanding.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-2xl font-semibold mb-2">Resource Library</h3>
              <p className="text-gray-600">
                Access a library of resources to help you understand and cope with grief and loss.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-blue-500 text-white text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-lg mb-8">
            Connect with our AI to start your journey towards healing. We're here to help every step of the way.
          </p>
          <button 
            onClick={onStartChat} 
            className="px-8 py-4 bg-white text-blue-500 text-xl rounded-lg hover:bg-gray-200"
          >
            Start Chat
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
