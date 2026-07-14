import { Link } from 'react-router';
import { Facebook } from 'lucide-react';

const FACEBOOK_URL = 'https://www.facebook.com/remodeleriq';

export default function Footer() {
  return (
    <footer className="bg-black text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/mocha-assets/remodeler-iq-2x-logo-reverse.svg" alt="RemodelerIQ" className="h-12" />
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow RemodelerIQ on Facebook"
              className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-[#1F9C4C]"
            >
              <Facebook className="h-[18px] w-[18px]" />
            </a>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 text-sm">
            <Link to="/how-we-score" className="text-gray-400 hover:text-white transition-colors">
              How We Score
            </Link>
            <Link to="/is-my-contractor-quote-fair" className="text-gray-400 hover:text-white transition-colors">
              Is My Quote Fair?
            </Link>
            <Link to="/glossary" className="text-gray-400 hover:text-white transition-colors">
              Glossary
            </Link>
            <Link to="/tools" className="text-gray-400 hover:text-white transition-colors">
              Free Tools
            </Link>
            <a href="/#how-it-works" className="text-gray-400 hover:text-white transition-colors">
              How It Works
            </a>
            <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
              Terms
            </Link>
            <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
              Privacy
            </Link>
            <a href="https://intelligence.remodeleriq.com/blog/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
              Blog
            </a>
            <a href="https://intelligence.remodeleriq.com/remodeling-cost-guides/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
              Remodeling Guides
            </a>
            <a href="/partners" className="text-gray-400 hover:text-white transition-colors">
              For Partners
            </a>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-800 text-center">
          <div className="mb-6">
            <a href="https://theresanaiforthat.com/ai/remodeler-iq-ai-powered-bid-analyzer/?ref=featured&v=6858630" target="_blank" rel="nofollow">
              <img width="300" src="https://media.theresanaiforthat.com/featured-on-taaft.png?width=600" alt="Featured on There's an AI for That" className="mx-auto" />
            </a>
          </div>
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} RemodelerIQ. All rights reserved.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Not a substitute for professional legal, financial, or construction advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
