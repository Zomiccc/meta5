import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-bn-secondary">
      <Navbar />
      <section className="bg-bn-input py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-bold text-bnText-primary md:text-5xl">
            Contact <span className="text-yellow">Us</span>
          </h1>
          <p className="mt-6 text-lg text-bnText-secondary">
            Our support team is available 24/5 to help you with account, trading, or technical questions.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <form className="space-y-6 rounded border border-bn-border bg-bn-input p-8">
            <div>
              <label className="mb-2 block text-sm text-bnText-secondary">Name</label>
              <input className="w-full rounded border border-bn-border bg-bn-secondary px-4 py-2 text-bnText-primary outline-none focus:border-yellow" />
            </div>
            <div>
              <label className="mb-2 block text-sm text-bnText-secondary">Email</label>
              <input type="email" className="w-full rounded border border-bn-border bg-bn-secondary px-4 py-2 text-bnText-primary outline-none focus:border-yellow" />
            </div>
            <div>
              <label className="mb-2 block text-sm text-bnText-secondary">Message</label>
              <textarea rows={4} className="w-full rounded border border-bn-border bg-bn-secondary px-4 py-2 text-bnText-primary outline-none focus:border-yellow" />
            </div>
            <button className="w-full rounded bg-yellow py-3 font-bold text-bn-bg transition hover:bg-yellow-dark">
              Send Message
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}
