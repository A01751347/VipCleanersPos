"use client";

import React from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";

type Props = {
  /** Ref de la sección que contiene el bloque (ej. #pricing) para medir scroll */
  sectionRef: React.RefObject<HTMLElement>;
  /** Rutas de imágenes */
  leftShoeSrc?: string;
  rightShoeSrc?: string;
  leftCapSrc?: string;
  rightCapSrc?: string;
};

const ParallaxBehindCard: React.FC<Props> = ({
  sectionRef,
  leftShoeSrc = "/assets/images/tenis-izq.png",
  rightShoeSrc = "/assets/images/tenis-der.png",
  leftCapSrc = "/assets/images/gorra-izq.png",
  rightCapSrc = "/assets/images/gorra-der.png",
}) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return null;

  // Centramos el efecto en el tramo medio para que “salgan” detrás del card cuando está visible
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 70%", "end 30%"],
  });

  // Suavizado
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 22, mass: 0.4 });

  // Movimiento con rango generoso (más recorrido)
  const yUpSmall = useTransform(p, [0, 1], [20, -140]);
  const yUpBig   = useTransform(p, [0, 1], [30, -220]);
  const yDown    = useTransform(p, [0, 1], [-20, 180]);

  const xLeft    = useTransform(p, [0, 1], [0, -220]);
  const xRight   = useTransform(p, [0, 1], [0,  240]);

  // Para que den sensación de “emergentes”
  const opacity  = useTransform(p, [0, 0.08, 1], [0, 1, 1]);
  const scale    = useTransform(p, [0, 1], [0.96, 1]);

  const rZslow   = useTransform(p, [0, 1], [-10, 10]);
  const rZfast   = useTransform(p, [0, 1], [-18, 18]);

  return (
    /**
     * IMPORTANTÍSIMO:
     * Este contenedor se coloca como HERMANO del card, con z-0,
     * mientras el card va con z-10. Así las imágenes quedan "debajo"
     * y parecen salir desde atrás del box.
     */
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 hidden md:block"
      style={{ perspective: 1000, overflow: "visible" }}
    >
      {/* Tenis izquierda, arrancan escondidos detrás (pegados al borde) */}
      <motion.img
        src={leftShoeSrc}
        alt=""
        className="absolute left-[-30%] top-1/3 -translate-x-1/2 w-36 lg:w-44 opacity-80 will-change-transform"
        style={{ x: xLeft, y: yUpBig, rotateZ: rZfast, opacity, scale, transformStyle: "preserve-3d" }}
      />

      {/* Tenis derecha */}
      <motion.img
        src={rightShoeSrc}
        alt=""
        className="absolute right-[-30%] top-1/2 translate-x-1/2 w-40 lg:w-52 opacity-80 will-change-transform"
        style={{ x: xRight, y: yDown, rotateZ: rZslow, opacity, scale, transformStyle: "preserve-3d" }}
      />

      {/* Gorra izquierda (esquina inferior izq) */}
      <motion.img
        src={leftCapSrc}
        alt=""
        className="absolute left-[-20%] bottom-0 translate-y-1/3 w-28 lg:w-32 opacity-80 will-change-transform"
        style={{ x: xLeft, y: yUpSmall, rotateZ: rZslow, opacity, scale, transformStyle: "preserve-3d" }}
      />

      {/* Gorra derecha (esquina superior der) */}
      <motion.img
        src={rightCapSrc}
        alt=""
        className="absolute right-[-20%] top-0 -translate-y-1/2 w-24 lg:w-28 opacity-80 will-change-transform"
        style={{ x: xRight, y: yUpSmall, rotateZ: rZfast, opacity, scale, transformStyle: "preserve-3d" }}
      />
    </div>
  );
};

export default ParallaxBehindCard;
