import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

const ImageModal = ({ isOpen, onClose, imageUrl, altText }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="relative max-w-5xl max-h-screen w-full flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors border border-white/20"
        >
          <i className="fa-solid fa-xmark text-xl" />
        </button>
        <img
          src={imageUrl}
          alt={altText || "Preview"}
          className="max-w-full max-h-[90vh] object-contain rounded-2xl"
        />
      </div>
    </div>,
    document.body
  );
};

export default ImageModal;
