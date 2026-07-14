import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function PromotionsPage() {
  return (
    <div className="min-h-screen bg-bn-secondary">
      <Navbar />
      <section className="bg-bn-input py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-bold text-bnText-primary md:text-5xl">
            Promotions & <span className="text-yellow">Bonuses</span>
          </h1>
          <p className="mt-6 text-lg text-bnText-secondary">
            Boost your trading with our exclusive offers for traders worldwide.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { title: 'Welcome Bonus', desc: 'Get 50% bonus on your first deposit up to $500.' },
              { title: 'Refer a Friend', desc: 'Earn a 3% bonus on every deposit your referrals make — forever.' },
              { title: 'Loyalty Cashback', desc: 'Trade more and earn monthly cashback rebates.' },
              { title: 'Free VPS', desc: 'Free VPS for traders with balance over $2,000.' },
            ].map((promo, idx) => (
              <div key={idx} className="rounded border border-bn-border bg-bn-input p-8">
                <h3 className="mb-2 text-xl font-bold text-yellow">{promo.title}</h3>
                <p className="text-bnText-secondary">{promo.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
