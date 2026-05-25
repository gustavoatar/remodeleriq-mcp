import { Link } from 'react-router';
import { BarChart3, BookOpen, Target, Radar, HelpCircle, Shield } from 'lucide-react';

interface RelatedLink {
  path: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const ALL_LINKS: RelatedLink[] = [
  {
    path: '/',
    title: 'Bid Analyzer',
    description: 'Upload and analyze contractor bids',
    icon: <Target className="w-5 h-5" />
  },
  {
    path: '/how-we-score',
    title: 'How We Score',
    description: 'Learn about our scoring methodology',
    icon: <HelpCircle className="w-5 h-5" />
  },
  {
    path: '/glossary',
    title: 'Remodeling Glossary',
    description: 'Common terms and definitions',
    icon: <BookOpen className="w-5 h-5" />
  },
  {
    path: '/labor-rates',
    title: 'Labor Rates',
    description: 'Market rates by trade and region',
    icon: <BarChart3 className="w-5 h-5" />
  },
  {
    path: '/trusted-radar',
    title: 'Trust Radar',
    description: 'Find verified contractors',
    icon: <Radar className="w-5 h-5" />
  },
  {
    path: '/premium',
    title: 'Premium Features',
    description: 'Unlock advanced analysis tools',
    icon: <Shield className="w-5 h-5" />
  }
];

interface RelatedLinksProps {
  currentPath: string;
  maxLinks?: number;
}

export default function RelatedLinks({ currentPath, maxLinks = 3 }: RelatedLinksProps) {
  // Filter out current page and limit to maxLinks
  const relatedLinks = ALL_LINKS
    .filter(link => link.path !== currentPath)
    .slice(0, maxLinks);

  return (
    <section className="py-8 border-t border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Explore More Tools</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatedLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="group flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center text-emerald-600 transition-colors">
              {link.icon}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">
                {link.title}
              </h3>
              <p className="text-sm text-gray-500">{link.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
