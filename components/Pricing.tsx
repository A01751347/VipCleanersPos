"use client";

// Pricing con aparición por scroll y decoraciones que salen por DETRÁS del card
import React, { useMemo, useRef } from "react";
import { Crown, ArrowRight, Sparkles, Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import BookingButton from "./BookingButton";
import ParallaxBehindCard from "./ParallaxBehindCard";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const item = {
  hidden: { y: 18, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 26, mass: 0.6 },
  },
};

const pop = {
  hidden: { scale: 0.98, opacity: 0 },
  show: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 280, damping: 24, mass: 0.7 },
  },
};

const Pricing: React.FC = () => {
  const prefersReduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);

  const features = useMemo(
    () => [
      "Limpieza profunda interior y exterior",
      "Desmanchado y cuidado de los materiales",
      "Desinfección y neutralización de olores",
      "Limpieza de suelas y mediasuelas",
      "Entrega express disponible y seguimiento del proceso",
    ],
    []
  );

  return (
    <section
      ref={sectionRef}
      id="pricing"
      // MUY IMPORTANTE: overflow-visible para permitir el rango grande
      className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-visible bg-[linear-gradient(135deg,#f6fbf9,white_30%,#eefaf6)]"
    >
      <div className="max-w-7xl mx-auto will-change-transform">
        {/* Header */}
        <motion.div
          variants={item}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#78f3d3]/20 rounded-full text-[#213041] font-semibold text-sm mb-6">
            <Sparkles size={16} />
            SERVICIO ÚNICO · TRATO VIP
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[#213041] mb-4 leading-tight">
            Limpieza Profesional <span className="text-[#10bfa1]">VIP</span>
          </h2>
          <p className="text-lg md:text-xl text-[#5d6b7b] max-w-3xl mx-auto">
            Sin niveles. Sin letras chiquitas. Tratamos <b>todos</b> tus tenis como si fueran edición limitada.
          </p>
        </motion.div>

        {/* WRAPPER RELATIVE para apilar decoraciones (z-0) y card (z-10) */}
        <div className="relative mx-auto max-w-3xl">
          {/* Decoraciones DETRÁS del card (underlay) */}
          <ParallaxBehindCard sectionRef={sectionRef as React.RefObject<HTMLElement>} />

          {/* Card por ENCIMA de las decoraciones */}
          <motion.div
            variants={pop}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            whileHover={!prefersReduced ? { y: -4 } : undefined}
            className="relative z-10"
          >
            <div className="rounded-3xl border border-gray-100 shadow-[0_12px_40px_-18px_rgba(16,191,161,0.25)] bg-white overflow-hidden">
              {/* Header de la tarjeta */}
              <div className="relative p-8 md:p-10 text-center bg-gradient-to-br from-[#78f3d3] via-[#57e9cf] to-[#2fd8c2] text-[#1b2a3a]">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full border-2 border-current" />
                  <div className="absolute bottom-8 left-10 h-10 w-10 rounded-full bg-current/60" />
                </div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-white/40">
                    <Crown size={30} />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight">Servicio VIP Único</h3>
                  <p className="text-base md:text-lg opacity-90 mt-1">El estándar más alto para cualquier par</p>
                </div>
              </div>

              {/* Precio */}
              <div className="px-8 md:px-10 py-8 text-center bg-gradient-to-b from-white to-gray-50/60">
                <div className="flex items-end justify-center gap-3">
                  <div className="text-5xl font-extrabold text-[#1f2f42] leading-none">$175</div>
                  <span className="text-sm text-[#6b7a89] mb-1">por par</span>
                </div>
              </div>

              {/* Lista de features */}
              <motion.ul
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2, margin: "0px 0px -12% 0px" }}
                className="grid gap-y-8 gap-x-6 sm:grid-cols-2 px-6 md:px-12 py-10"
              >
                {features.map((feature, idx) => (
                  <motion.li
                    key={idx}
                    variants={item}
                    className="flex items-center space-x-3"
                    whileHover={!prefersReduced ? { x: 4 } : undefined}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#10bfa1]/10 text-[#10bfa1]">
                      <Check size={18} strokeWidth={2.5} />
                    </span>
                    <span className="text-[#33465a] font-medium leading-snug">
                      {feature}
                    </span>
                  </motion.li>
                ))}
              </motion.ul>

              {/* CTA */}
              <div className="px-8 md:px-10 pb-10">
                <BookingButton className="group block w-full text-center px-8 py-4 rounded-2xl font-bold text-lg bg-[#1f2f42] text-white transition-transform duration-150 hover:scale-[1.01] hover:shadow-[0_16px_40px_-20px_rgba(31,47,66,0.5)]">
                  <span className="inline-flex items-center justify-center">
                    Reservar Servicio VIP
                    <ArrowRight size={20} className="ml-2 transition-transform group-hover:translate-x-1" />
                  </span>
                </BookingButton>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bloque de ayuda */}
        <motion.div
          variants={item}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="mt-16 text-center"
        >
          <div className="bg-white rounded-2xl p-8 shadow-[0_10px_25px_-12px_rgba(31,47,66,0.25)] max-w-4xl mx-auto border border-gray-100">
            <h3 className="text-2xl font-bold text-[#1f2f42] mb-3">¿Dudas sobre el proceso?</h3>
            <p className="text-[#5d6b7b] mb-6 text-lg">
              Escríbenos y te guiamos. Nuestro equipo está listo para cuidar tus tenis como se merecen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#contact" className="inline-flex items-center justify-center px-6 py-3 text-[#1f2f42] font-semibold hover:text-[#10bfa1] transition-colors">
                Contactar un Especialista
              </a>
              <a href="#faq" className="inline-flex items-center justify-center px-6 py-3 text-[#1f2f42] font-semibold hover:text-[#10bfa1] transition-colors">
                Ver Preguntas Frecuentes
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
