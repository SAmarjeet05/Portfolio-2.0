import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageCarouselProps {
  images: string[];
  title: string;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  // Use images array if available, otherwise use empty array
  const displayImages = Array.isArray(images) && images.length > 0 ? images : [];

  useEffect(() => {
    if (!autoplay || displayImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        (prevIndex + 1) % displayImages.length
      );
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [autoplay, displayImages.length]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? displayImages.length - 1 : prevIndex - 1
    );
    setAutoplay(false);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      (prevIndex + 1) % displayImages.length
    );
    setAutoplay(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setAutoplay(false);
  };

  // If no images, return empty
  if (displayImages.length === 0) {
    return null;
  }

  // If only one image, don't show carousel controls
  if (displayImages.length === 1) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative rounded-2xl overflow-hidden border border-accent-primary/30"
      >
        <img
          src={displayImages[0]}
          alt={`${title} - Image 1`}
          className="w-full h-[500px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">{title}</h1>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative rounded-2xl overflow-hidden border border-accent-primary/30 group"
      onMouseEnter={() => setAutoplay(false)}
      onMouseLeave={() => setAutoplay(true)}
    >
      {/* Main Image Container */}
      <div className="relative h-[500px] bg-dark-800 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={displayImages[currentIndex]}
            alt={`${title} - Image ${currentIndex + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">{title}</h1>
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100 z-10"
          aria-label="Previous image"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100 z-10"
          aria-label="Next image"
        >
          <ChevronRight size={24} className="text-white" />
        </button>

        {/* Image Counter */}
        <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-sm font-medium text-gray-300 border border-accent-primary/30">
          {currentIndex + 1} / {displayImages.length}
        </div>
      </div>

      {/* Thumbnail Navigation */}
      <div className="flex justify-center gap-2 p-4 bg-dark-900/50 backdrop-blur-sm border-t border-accent-primary/20">
        {displayImages.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => goToSlide(index)}
            whileHover={{ scale: 1.05 }}
            className={`h-3 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-accent-primary w-8'
                : 'bg-gray-600 hover:bg-gray-500 w-3'
            }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
    </motion.div>
  );
};
