import { Helmet } from 'react-helmet-async';

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  faqs: FAQItem[];
}

/**
 * Generates JSON-LD structured data for FAQ pages.
 * This helps Google display FAQ rich snippets in search results.
 */
export default function FAQSchema({ faqs }: FAQSchemaProps) {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
}

// Pre-defined FAQ sets for different pages
export const HOME_FAQS: FAQItem[] = [
  {
    question: 'How does RemodelerIQ analyze contractor bids?',
    answer: 'RemodelerIQ uses AI to extract line items, labor costs, and materials from your contractor bid. We compare these against real market data from Houzz, Zonda, and Bureau of Labor Statistics to determine if pricing is fair for your area.',
  },
  {
    question: 'Is RemodelerIQ free to use?',
    answer: 'Yes! Free accounts get 5 bid analyses per day. Simply upload a photo or PDF of your contractor estimate and get instant insights on pricing, red flags, and negotiation tips.',
  },
  {
    question: 'What information does the bid analysis include?',
    answer: 'Each analysis includes a price verdict (fair, above market, or below market), contractor trust score based on licensing and reviews, scope red flags, change order risk assessment, and a personalized negotiation script.',
  },
  {
    question: 'How accurate is the pricing comparison?',
    answer: 'Our pricing data comes from Houzz Cost Guides, Zonda regional construction data, and Bureau of Labor Statistics wage data. We apply location-specific multipliers for 45+ metro areas to ensure accuracy for your ZIP code.',
  },
  {
    question: 'Can I use RemodelerIQ for any type of home project?',
    answer: 'Yes, we support all major home improvement projects including kitchen remodels, bathroom renovations, roofing, HVAC, plumbing, electrical, flooring, painting, windows, siding, fencing, landscaping, and more.',
  },
];

export const STUDIO_FAQS: FAQItem[] = [
  {
    question: 'How accurate are the remodel cost estimates?',
    answer: 'Our estimates blend data from Houzz Cost Guides, Zonda regional construction data, and Bureau of Labor Statistics wage data. We apply location-specific multipliers and adjust for current material costs using Federal Reserve economic data.',
  },
  {
    question: 'What factors affect my remodel cost?',
    answer: 'Key factors include your ZIP code (labor and material costs vary by region), finish level (builder grade vs. premium), project complexity, timeline urgency, and current market conditions for materials like lumber and copper.',
  },
  {
    question: 'Can I estimate multiple projects at once?',
    answer: 'Yes! The Remodeler Studio lets you select multiple project types (kitchen, bathroom, basement, addition) and configure each one separately. You\'ll get a combined estimate with itemized breakdowns.',
  },
  {
    question: 'Do I need to enter my ZIP code?',
    answer: 'While optional, entering your ZIP code significantly improves estimate accuracy. We use it to apply regional cost multipliers based on local labor rates and material costs in your metro area.',
  },
];

export const JOIN_FAQS: FAQItem[] = [
  {
    question: 'What do I get with a free RemodelerIQ account?',
    answer: 'Free accounts include 5 bid analyses per day, full price comparison reports, contractor trust scores, scope red flags, change order risk assessment, and AI-powered negotiation scripts.',
  },
  {
    question: 'Do I need a credit card to sign up?',
    answer: 'No credit card required. Create your free account with Google sign-in or email and start analyzing bids immediately.',
  },
  {
    question: 'How is my data protected?',
    answer: 'We use industry-standard encryption and never share your bid documents with third parties. Your contractor estimates are processed securely and only accessible to you.',
  },
];
