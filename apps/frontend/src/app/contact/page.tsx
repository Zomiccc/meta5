import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <section className="bg-navy-800 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-bold text-white md:text-5xl">
            Contact <span className="text-gold">Us</span>
          </h1>
          <p className="mt-6 text-lg text-white/70">
            Our support team is available 24/5 to help you with account, trading, or technical questions.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <form className="space-y-6 rounded border border-navy-700 bg-navy-800 p-8">
            <div>
              <label className="mb-2 block text-sm text-white/70">Name</label>
              <input className="w-full rounded border border-navy-600 bg-navy-900 px-4 py-2 text-white outline-none focus:border-gold" />
            </div>
            <div>
              <label className="mb-2 block text-sm text-white/70">Email</label>
              <input type="email" className="w-full rounded border border-navy-600 bg-navy-900 px-4 py-2 text-white outline-none focus:border-gold" />
            </div>
            <div>
              <label className="mb-2 block text-sm text-white/70">Message</label>
              <textarea rows={4} className="w-full rounded border border-navy-600 bg-navy-900 px-4 py-2 text-white outline-none focus:border-gold" />
            </div>
            <button className="w-full rounded bg-gold py-3 font-bold text-navy-900 transition hover:bg-gold-dark">
              Send Message
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}
