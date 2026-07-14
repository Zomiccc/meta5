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
    <div className="min-h-screen bg-bn-secondary">
      <Navbar />
      <section className="bg-bn-input py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-bold text-bnText-primary md:text-5xl">
            Trading <span className="text-yellow">Accounts</span>
          </h1>
          <p className="mt-6 text-lg text-bnText-secondary">
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
                className="rounded border border-bn-border bg-bn-input p-8 transition hover:border-yellow"
              >
                <h3 className="text-2xl font-bold text-bnText-primary">{account.name}</h3>
                <div className="mt-4 space-y-2 text-sm text-bnText-secondary">
                  <p>Spread: <span className="text-bnText-primary">{account.spread}</span></p>
                  <p>Min Deposit: <span className="text-bnText-primary">{account.minDeposit}</span></p>
                  <p>Leverage: <span className="text-bnText-primary">{account.leverage}</span></p>
                </div>
                <ul className="mt-6 space-y-2">
                  {account.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center gap-2 text-sm text-bnText-secondary">
                      <Check className="h-4 w-4 text-yellow" /> {feature}
                    </li>
                  ))}
                </ul>
                <button className="mt-8 w-full rounded bg-yellow py-2 font-bold text-bn-bg transition hover:bg-yellow-dark">
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
