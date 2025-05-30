// components/AnimateOnScroll.tsx
'use client'
import React, { ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';

type AnimationType = 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom-in' | 'zoom-out';

interface AnimateOnScrollProps {
  children: ReactNode;
  type?: AnimationType;
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
  once?: boolean;
}

const AnimateOnScroll: React.FC<AnimateOnScrollProps> = ({
  children,
  type = 'fade-up',
  delay = 0,
  duration = 0.7,
  threshold = 0.1,
  className = '',
  once = true,
}) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });

  const getAnimationVariants = () => {
    switch (type) {
      case 'fade-up':
        return {
          hidden: { opacity: 0, y: 40 },
          visible: { opacity: 1, y: 0 },
        };
      case 'fade-down':
        return {
          hidden: { opacity: 0, y: -40 },
          visible: { opacity: 1, y: 0 },
        };
      case 'fade-left':
        return {
          hidden: { opacity: 0, x: 40 },
          visible: { opacity: 1, x: 0 },
        };
      case 'fade-right':
        return {
          hidden: { opacity: 0, x: -40 },
          visible: { opacity: 1, x: 0 },
        };
      case 'zoom-in':
        return {
          hidden: { opacity: 0, scale: 0.95 },
          visible: { opacity: 1, scale: 1 },
        };
      case 'zoom-out':
        return {
          hidden: { opacity: 0, scale: 1.05 },
          visible: { opacity: 1, scale: 1 },
        };
      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        };
    }
  };

  const variants = getAnimationVariants();

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1.0] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default AnimateOnScroll;