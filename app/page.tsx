// app/page.tsx
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import TrustBadges from '../components/TrustBadges';
import Services from '../components/Services';
import HowItWorks from '../components/HowItWorks';
import Gallery from '../components/Gallery';
import BeforeAfter from '../components/BeforeAfter';
import DetailedReviews from '../components/DetailedReviews';
import Testimonials from '../components/Testimonials';
import Pricing from '../components/Pricing';
import FAQ from '../components/FAQ';
import BlogSection from '../components/BlogSection';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import SmoothScroll from '../components/SmoothScroll';

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Navbar />
      <Hero />
      <TrustBadges />
      <Services />
      <HowItWorks />
      <Gallery />
      <BeforeAfter />
      <DetailedReviews />
      <Testimonials />
      <Pricing />
      <FAQ />
      <BlogSection />
      <Contact />
      <Footer />
    </>
  );
}