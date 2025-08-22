'use client'
import React, { useEffect, useRef, useState } from 'react'
// Si usas SVGR: importa el SVG como componente React
import Logo from '@/public/assets/LOGO_VIPS.svg'
import { Star, Sparkles, MessageCircle } from 'lucide-react'
import BookingButton from './BookingButton'
import AnimateOnScroll from '../components/AnimateOnScroll'

const BRAND = {
  primary: '#78f3d3',
  dark: '#121824'
}

const Hero: React.FC = () => {
  return (
    <section
      id="home"
      aria-labelledby="hero-title"
      className="relative min-h-screen flex items-center bg-[rgb(17,24,39)] overflow-hidden pt-24 sm:pt-28 lg:pt-32"
    >
      <Background />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 grid lg:grid-cols-2 gap-12 items-center">
        {/* Texto y CTA */}
        <div className="text-center lg:text-left">
          <AnimateOnScroll type="fade-up" delay={0.2}>
            <BadgeLine />
          </AnimateOnScroll>

          <AnimateOnScroll type="fade-up" delay={0.4}>
            <h1
              id="hero-title"
              className="text-white font-extrabold leading-tight text-4xl sm:text-5xl lg:text-6xl mt-4"
            >
              <span className="inline-block">DEJANOS ESTAR</span>
              <span className="block text-[color:var(--brand-primary,#78f3d3)]">EN CADA PASO</span>
            </h1>
          </AnimateOnScroll>

          <AnimateOnScroll type="fade-up" delay={0.6}>
            <TypewriterParagraph
              text="Limpieza y restauración profesional para tus sneakers favoritos. Técnicas avanzadas, materiales eco y resultados que sorprenden."
            />
          </AnimateOnScroll>

          <AnimateOnScroll type="fade-up" delay={0.8}>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <BookingButton
                aria-label="Reservar ahora"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[color:var(--brand-primary,#78f3d3)] text-[color:var(--brand-dark,#121824)] font-bold hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--brand-primary,#78f3d3)]"
              >
                Reserva ahora
              </BookingButton>

              {/* WhatsApp directo */}
              <a
                href="https://wa.me/525512985667?text=Hola%20quiero%20reservar%20una%20limpieza"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Reservar por WhatsApp"
                className="w-full sm:w-auto px-8 py-4 rounded-full border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-[#0B1C13] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#25D366] inline-flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" /> WhatsApp
              </a>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll type="fade-up" delay={1.0}>
            <SocialProof />
          </AnimateOnScroll>
        </div>

        {/* Imagen principal (SVG inline como componente) */}
        <AnimateOnScroll type="fade-left" delay={0.9}>
          <div className="relative w-full flex justify-center">
            <div aria-hidden className="absolute -inset-6 rounded-full bg-gradient-to-br from-[color:var(--brand-primary,#78f3d3)]/30 to-transparent blur-3xl" />
            <div
              className="relative w-72 sm:w-96 lg:w-[32rem] max-w-full h-auto drop-shadow-[0_12px_40px_rgba(120,243,211,0.35)]"
              role="img"
              aria-label="VipCleaners Logo"
            >
              {/* El SVG escala de forma perfecta sin rasterizar ni layout shift */}
              <Logo
                className="w-full h-auto"
                focusable="false"
                aria-hidden="true"
                // Si tu SVG permite, puedes forzar color vía CSS vars:
                // style={{ color: 'var(--brand-primary, #78f3d3)' }}
              />
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}

/* --------------------------- Typewriter Paragraph --------------------------- */
const TypewriterParagraph: React.FC<{ text: string }> = ({ text }) => {
  const [idx, setIdx] = useState(0)
  const speedRef = useRef(20) // más rápido

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setIdx(text.length)
      return
    }

    let t: number | undefined
    if (idx < text.length) {
      t = window.setTimeout(() => setIdx(i => i + 1), speedRef.current)
    }
    return () => {
      if (t) window.clearTimeout(t)
    }
  }, [idx, text])

  return (
    <p className="mt-6 text-slate-300 text-lg max-w-lg mx-auto lg:mx-0" aria-live="polite" aria-atomic="true">
      {text.slice(0, idx)}
      {idx < text.length && <Caret />}
    </p>
  )
}

const Caret: React.FC = () => (
  <span
    className="inline-block w-[0.6ch] -mb-1 ml-0.5 align-baseline border-l-4 border-slate-300 animate-pulse"
    aria-hidden="true"
  />
)

/* --------------------------- UI Subcomponents --------------------------- */

const Background: React.FC = () => (
  <div aria-hidden="true" className="absolute inset-0">
    <div className="absolute -inset-40 bg-[radial-gradient(60%_50%_at_20%_10%,rgba(120,243,211,0.28),transparent_60%),radial-gradient(40%_35%_at_90%_20%,rgba(77,224,192,0.18),transparent_60%),radial-gradient(30%_40%_at_70%_90%,rgba(120,243,211,0.12),transparent_70%)]" />
    <div
      className="absolute inset-0 opacity-[0.06] mix-blend-soft-light"
      style={{
        backgroundImage:
          'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P8fPz/HwAHAQLY0QF1lQAAAABJRU5ErkJggg==)'
      }}
    />
  </div>
)

const BadgeLine: React.FC = () => (
  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5">
    <Sparkles size={18} className="text-[color:var(--brand-primary,#78f3d3)]" aria-hidden="true" />
    <span className="text-sm text-slate-200">Cuidado experto • Eco-friendly</span>
  </div>
)

const SocialProof: React.FC = () => (
  <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-center lg:justify-start">
    <div className="flex -space-x-2" aria-hidden="true">
      {/* Reutiliza el mismo SVG como “avatar” optimizado (inline, sin raster) */}
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className="h-9 w-9 rounded-full ring-2 ring-[rgb(17,24,39)] bg-white inline-flex items-center justify-center overflow-hidden"
        >
          <Logo className="h-6 w-6 shrink-0" focusable="false" aria-hidden="true" />
        </span>
      ))}
    </div>
    <div className="text-left">
      <div className="flex items-center text-[color:var(--brand-primary,#78f3d3)]" aria-label="Calificación 4.9 de 5 basada en más de 3000 pares">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={14} aria-hidden="true" fill="currentColor" />
        ))}
        <span className="ml-2 text-xs text-slate-300">4.9/5 (3K+ pares)</span>
      </div>
      <p className="text-xs text-slate-400 mt-1">Clientes que recomiendan.</p>
    </div>
  </div>
)

export default Hero
