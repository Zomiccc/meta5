import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <section className="bg-navy-800 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-bold text-white md:text-5xl">
            About <span className="text-gold">FXONS</span>
          </h1>
          <p className="mt-6 text-lg text-white/70">
            FXONS is a global multi-asset broker built to give traders worldwide a world-class platform. We combine deep market access, transparent pricing, and instant account setup to deliver a seamless trading experience on MetaTrader 5.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { title: 'Our Mission', desc: 'Empower traders worldwide with secure, low-cost access to global markets.' },
              { title: 'Our Vision', desc: 'Become a globally trusted broker through technology and transparency.' },
              { title: 'Our Values', desc: 'Integrity, security, innovation, and customer-first service.' },
            ].map((item, idx) => (
              <div key={idx} className="rounded border border-navy-700 bg-navy-800 p-6">
                <h3 className="mb-2 text-xl font-semibold text-gold">{item.title}</h3>
                <p className="text-white/60">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
