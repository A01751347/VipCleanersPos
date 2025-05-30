'use client'
// components/BookingButton.tsx
import React, { useState } from 'react';
import BookingModal from './BookingModal';

interface BookingButtonProps {
  className?: string;
  children?: React.ReactNode;
}

const BookingButton: React.FC<BookingButtonProps> = ({ className, children }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <button
        className={className}
        onClick={openModal}
      >
        {children || 'Reserva Ahora'}
      </button>
      
      <BookingModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
};

export default BookingButton;