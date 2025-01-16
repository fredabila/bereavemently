import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';
import { Download, Share2, Heart, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CAFireQRCode = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const specialUrl = `${window.location.origin}/ca-fire-support`;

  useEffect(() => {
    generateQRCode();
  }, []);

  const generateQRCode = async () => {
    try {
      const url = await QRCode.toDataURL(specialUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#4F46E5',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error('Error generating QR code:', err);
      toast.error('Error generating QR code. Please try again.');
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.download = 'CA-Fire-Support-QRCode.png';
    link.href = qrCodeUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR Code downloaded successfully!');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(specialUrl);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link. Please try again.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-3xl mx-auto">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="inline-flex items-center justify-center p-3 bg-white bg-opacity-20 rounded-2xl mb-6"
            >
              <Heart className="text-pink-100 w-8 h-8" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-4">
              California Fire Victims Support
            </h2>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto">
              Scan this QR code to access 90 days of free premium grief support. We're here to help during this challenging time.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white p-4 rounded-2xl shadow-lg"
            >
              {qrCodeUrl && (
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code for CA Fire Support" 
                  className="w-64 h-64 md:w-80 md:h-80"
                />
              )}
            </motion.div>

            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-4 w-full md:w-auto"
            >
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-6 text-white">
                <div className="flex items-center mb-4">
                  <Shield className="w-5 h-5 mr-2" />
                  <h3 className="text-lg font-semibold">Premium Features</h3>
                </div>
                <ul className="space-y-2 text-blue-100">
                  <li>• Unlimited AI grief counseling sessions</li>
                  <li>• Priority support access</li>
                  <li>• Personalized coping strategies</li>
                  <li>• Community support features</li>
                  <li>• Resource library access</li>
                </ul>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={downloadQRCode}
                className="w-full flex items-center justify-center gap-2 bg-blue-100 text-blue-800 py-3 px-6 rounded-full font-semibold hover:bg-blue-200 transition duration-300"
              >
                <Download className="w-5 h-5" />
                Download QR Code
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={copyToClipboard}
                className="w-full flex items-center justify-center gap-2 bg-white bg-opacity-10 text-white py-3 px-6 rounded-full font-semibold hover:bg-opacity-20 transition duration-300"
              >
                <Share2 className="w-5 h-5" />
                Copy Direct Link
              </motion.button>
            </motion.div>
          </div>

          <div className="text-center text-blue-100 text-sm">
            <p>Direct link:</p>
            <a 
              href={specialUrl}
              className="text-blue-200 hover:text-white transition-colors break-all"
            >
              {specialUrl}
            </a>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CAFireQRCode; 