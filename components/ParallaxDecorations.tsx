"use client";
import React from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
} from "framer-motion";

type DecoProps = {
  targetRef: React.RefObject<HTMLElement>;
  leftShoeSrc?: string;
  rightShoeSrc?: string;
  leftCapSrc?: string;
  rightCapSrc?: string;
};

const ParallaxDecorations: React.FC<DecoProps> = ({
  targetRef,
  leftShoeSrc = "/assets/images/tenis-izq.png",
  rightShoeSrc = "/assets/images/tenis-der.png",
  leftCapSrc = "/assets/images/gorra-izq.png",
  rightCapSrc = "/assets/images/gorra-der.png",
}) => {
  const prefersReduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: targetRef,
    // Más sensible: empieza a moverse cuando el top entra a media pantalla,
    // termina cuando el bottom toca la parte alta.
    offset: ["start center", "end start"],
  });

  // Debug opcional: ver el valor en consola
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    // console.log("pricing progress:", v.toFixed(3));
  });

  // Suavizado
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 22, mass: 0.4 });

  // RANGOS GRANDES para comprobar movimiento
  const yUpSmall = useTransform(smooth, [0, 1], [0, -120]);
  const yUpBig   = useTransform(smooth, [0, 1], [0, -320]);
  const yDown    = useTransform(smooth, [0, 1], [0, 140]);
  const xLeft    = useTransform(smooth, [0, 1], [0, -140]);
  const xRight   = useTransform(smooth, [0, 1], [0, 140]);

  const rotateZSlow = useTransform(smooth, [0, 1], [-15, 15]);
  const rotateZFast = useTransform(smooth, [0, 1], [-25, 25]);
  const rotateX     = useTransform(smooth, [0, 1], [10, -10]);
  const rotateY     = useTransform(smooth, [0, 1], [-10, 10]);

  if (prefersReduced) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0"
      style={{ perspective: 1000 }}
    >
      <motion.img
        src={leftShoeSrc}
        alt=""
        className="block absolute left-[0px] top-[15%] w-40 lg:w-52 opacity-80 will-change-transform"
        style={{ y: yUpBig, x: xLeft, rotateZ: rotateZFast, rotateX, rotateY, transformStyle: "preserve-3d" }}
      />

      <motion.img
        src={rightShoeSrc}
        alt=""
        className="block absolute right-[0px] top-[38%] w-44 lg:w-56 opacity-80 will-change-transform"
        style={{ y: yDown, x: xRight, rotateZ: rotateZSlow, rotateX, rotateY, transformStyle: "preserve-3d" }}
      />

      <motion.img
        src={leftCapSrc}
        alt=""
        className="block absolute left-[6%] bottom-[12%] w-32 opacity-80 will-change-transform"
        style={{ y: yUpSmall, x: xLeft, rotateZ: rotateZSlow, rotateX, rotateY, transformStyle: "preserve-3d" }}
      />

      <motion.img
        src={rightCapSrc}
        alt=""
        className="block absolute right-[8%] top-[12%] w-28 opacity-80 will-change-transform"
        style={{ y: yUpSmall, x: xRight, rotateZ: rotateZFast, rotateX, rotateY, transformStyle: "preserve-3d" }}
      />
    </div>
  );
};

export default ParallaxDecorations;
