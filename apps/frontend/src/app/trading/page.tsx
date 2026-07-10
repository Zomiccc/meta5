import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Check } from 'lucide-react';

const accounts = [
  {
    name: 'Micro',
    spread: 'From 1.0 pips',
    minDeposit: '$10',
    leverage: '1:1000',
    features: ['No commission', 'MT5 platform', 'Crypto deposits'],
  },
  {
    name: 'Standard',
    spread: 'From 0.6 pips',
    minDeposit: '$100',
    leverage: '1:1000',
    features: ['No commission', 'Dedicated support', 'All instruments'],
  },
  {
    name: 'Raw',
    spread: 'From 0.0 pips',
    minDeposit: '$500',
    leverage: '1:500',
    features: ['Low commission', 'Institutional execution', 'Priority withdrawals'],
  },
];

export default function TradingPage() {
  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <section className="bg-navy-800 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-bold text-white md:text-5xl">
            Trading <span className="text-gold">Accounts</span>
          </h1>
          <p className="mt-6 text-lg text-white/70">
            Choose an account that matches your trading style. All accounts include MT5, instant crypto deposits, and 24/7 multilingual support.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-6 md:grid-cols-3">
            {accounts.map((account, idx) => (
              <div
                key={idx}
                className="rounded border border-navy-700 bg-navy-800 p-8 transition hover:border-gold"
              >
                <h3 className="text-2xl font-bold text-white">{account.name}</h3>
                <div className="mt-4 space-y-2 text-sm text-white/70">
                  <p>Spread: <span className="text-white">{account.spread}</span></p>
                  <p>Min Deposit: <span className="text-white">{account.minDeposit}</span></p>
                  <p>Leverage: <span className="text-white">{account.leverage}</span></p>
                </div>
                <ul className="mt-6 space-y-2">
                  {account.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center gap-2 text-sm text-white/80">
                      <Check className="h-4 w-4 text-gold" /> {feature}
                    </li>
                  ))}
                </ul>
                <button className="mt-8 w-full rounded bg-gold py-2 font-bold text-navy-900 transition hover:bg-gold-dark">
                  Open Account
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
