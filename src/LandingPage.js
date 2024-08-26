import React from 'react';
import { motion } from 'framer-motion';

const LandingPage = ({ onStartChat }) => {
  return (
    <div className="bg-gray-100 font-sans text-gray-800">

      {/* Hero Section */}
      <div className="relative flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 overflow-hidden"> 
        {/* Background Images with Parallax & Blur */}
        <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-3 gap-4 opacity-40 transform -translate-y-16">
          {[
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqEktGtMHCCc3TcxaCfNLqEOfByzSn9J6ZmA&s', 
            'https://t4.ftcdn.net/jpg/06/59/01/71/360_F_659017126_Y6C9hIQIWxVO5Yh2ULonm9gws802bWUN.jpg',
            'https://t3.ftcdn.net/jpg/04/52/68/10/360_F_452681050_g4bwJDQsQztgJm1VIZ7HghpzA7KfWW06.jpg', 
            'https://images.pexels.com/photos/10499692/pexels-photo-10499692.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrWULLwtlE7FqeiDFDkZc6hQS1YEJKKgO6_A&s',
            'https://t4.ftcdn.net/jpg/02/36/03/39/360_F_236033986_48dVqHUAjNoW8Sr0KNqv6ZDfOkJ1u43o.jpg'
          ].map((src, index) => (
            <motion.img 
              key={index}
              src={src} 
              alt={`Background ${index + 1}`} 
              className="w-full h-full object-cover absolute inset-0 filter blur-md" 
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 3, delay: index * 0.2, repeat: Infinity, repeatType: "loop" }}
            />
          ))}
        </div>

        {/* Hero Content */}
        <motion.div 
          className="relative z-10 text-center text-white"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
        >
          <h1 className="text-5xl sm:text-7xl font-bold mb-6 drop-shadow-lg">
            Bereavemently
          </h1>
          <p className="text-lg sm:text-2xl mb-8 font-light drop-shadow-md">
            Compassionate support, powered by AI, <br /> for when you need it most. 
          </p>
          <motion.button 
            onClick={onStartChat} 
            className="px-8 py-4 text-lg sm:text-xl bg-white text-gray-800 font-semibold rounded-lg 
                       shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Chat
          </motion.button>
        </motion.div>
      </div>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 
            className="text-3xl sm:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            What is Bereavemently?
          </motion.h2>
          <motion.p 
            className="text-md sm:text-lg text-gray-700 leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Bereavemently is an AI-powered platform created to provide solace and guidance during times of loss. 
            We understand that grief is a deeply personal journey, and we're here to offer a safe and supportive space 
            to process your emotions, find resources, and connect with others. 
          </motion.p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 
            className="text-3xl sm:text-4xl font-bold mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            How We Support You
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                title: '24/7 AI Chat', 
                description: 'Find comfort and support at any time, day or night, with our AI chatbot. It’s always available to listen and offer guidance.' 
              },
              { 
                title: 'Personalized Resources', 
                description: 'Access a curated library of articles, videos, and external resources, all personalized to your specific needs and situation.' 
              },
              { 
                title: 'Safe and Confidential', 
                description: 'Your privacy is our utmost priority. Share your thoughts and feelings openly in a secure and judgment-free environment.' 
              }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                className="p-8 bg-white rounded-lg shadow-md transform hover:-translate-y-2 transition duration-300 ease-in-out"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
              >
                <h3 className="text-xl sm:text-2xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 
            className="text-3xl sm:text-4xl font-bold mb-6 drop-shadow-lg"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Start Your Journey Towards Healing
          </motion.h2>
          <motion.p 
            className="text-lg sm:text-xl mb-8 drop-shadow-md"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            You don’t have to navigate this alone. We’re here to offer support, understanding, and hope. 
          </motion.p>
          <motion.button 
            onClick={onStartChat} 
            className="px-8 py-4 bg-white text-blue-500 text-lg sm:text-xl font-semibold rounded-lg 
                       shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Begin Chatting
          </motion.button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;