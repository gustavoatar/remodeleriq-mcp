import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://remodeleriq.com';
// Schema.org URLs must be absolute.
const LOGO_URL = `${BASE_URL}/og-image.png`;

// Metro areas with coordinates - pulled from Zonda/CITY_SAVINGS data
const SERVICE_AREAS: Array<{ city: string; state: string; lat: number; lng: number }> = [
  // Major metros (large market)
  { city: 'New York', state: 'NY', lat: 40.7128, lng: -74.0060 },
  { city: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437 },
  { city: 'San Francisco', state: 'CA', lat: 37.7749, lng: -122.4194 },
  { city: 'San Jose', state: 'CA', lat: 37.3382, lng: -121.8863 },
  { city: 'San Diego', state: 'CA', lat: 32.7157, lng: -117.1611 },
  { city: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321 },
  { city: 'Boston', state: 'MA', lat: 42.3601, lng: -71.0589 },
  { city: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298 },
  { city: 'Miami', state: 'FL', lat: 25.7617, lng: -80.1918 },
  { city: 'Washington', state: 'DC', lat: 38.9072, lng: -77.0369 },
  { city: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 },
  { city: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431 },
  { city: 'Honolulu', state: 'HI', lat: 21.3069, lng: -157.8583 },
  // Mid-size metros (medium market)
  { city: 'Atlanta', state: 'GA', lat: 33.7490, lng: -84.3880 },
  { city: 'Houston', state: 'TX', lat: 29.7604, lng: -95.3698 },
  { city: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.7970 },
  { city: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.0740 },
  { city: 'Philadelphia', state: 'PA', lat: 39.9526, lng: -75.1652 },
  { city: 'Portland', state: 'OR', lat: 45.5152, lng: -122.6784 },
  { city: 'Tampa', state: 'FL', lat: 27.9506, lng: -82.4572 },
  { city: 'Orlando', state: 'FL', lat: 28.5383, lng: -81.3792 },
  { city: 'Charlotte', state: 'NC', lat: 35.2271, lng: -80.8431 },
  { city: 'Nashville', state: 'TN', lat: 36.1627, lng: -86.7816 },
  { city: 'Minneapolis', state: 'MN', lat: 44.9778, lng: -93.2650 },
  { city: 'Baltimore', state: 'MD', lat: 39.2904, lng: -76.6122 },
  { city: 'Las Vegas', state: 'NV', lat: 36.1699, lng: -115.1398 },
  { city: 'Sacramento', state: 'CA', lat: 38.5816, lng: -121.4944 },
  { city: 'Raleigh', state: 'NC', lat: 35.7796, lng: -78.6382 },
  { city: 'Salt Lake City', state: 'UT', lat: 40.7608, lng: -111.8910 },
  { city: 'Pittsburgh', state: 'PA', lat: 40.4406, lng: -79.9959 },
  { city: 'St. Louis', state: 'MO', lat: 38.6270, lng: -90.1994 },
  { city: 'Kansas City', state: 'MO', lat: 39.0997, lng: -94.5786 },
  { city: 'New Orleans', state: 'LA', lat: 29.9511, lng: -90.0715 },
  { city: 'Charleston', state: 'SC', lat: 32.7765, lng: -79.9311 },
  { city: 'San Antonio', state: 'TX', lat: 29.4241, lng: -98.4936 },
  { city: 'Fort Worth', state: 'TX', lat: 32.7555, lng: -97.3308 },
  { city: 'Richmond', state: 'VA', lat: 37.5407, lng: -77.4360 },
  { city: 'Virginia Beach', state: 'VA', lat: 36.8529, lng: -75.9780 },
  { city: 'Milwaukee', state: 'WI', lat: 43.0389, lng: -87.9065 },
  { city: 'Columbus', state: 'OH', lat: 39.9612, lng: -82.9988 },
  { city: 'Cleveland', state: 'OH', lat: 41.4993, lng: -81.6944 },
  { city: 'Cincinnati', state: 'OH', lat: 39.1031, lng: -84.5120 },
  { city: 'Detroit', state: 'MI', lat: 42.3314, lng: -83.0458 },
  { city: 'Indianapolis', state: 'IN', lat: 39.7684, lng: -86.1581 },
  { city: 'Jacksonville', state: 'FL', lat: 30.3322, lng: -81.6557 },
  { city: 'Tucson', state: 'AZ', lat: 32.2226, lng: -110.9747 },
  { city: 'Albuquerque', state: 'NM', lat: 35.0844, lng: -106.6504 },
  { city: 'Birmingham', state: 'AL', lat: 33.5207, lng: -86.8025 },
  { city: 'Memphis', state: 'TN', lat: 35.1495, lng: -90.0490 },
  { city: 'Savannah', state: 'GA', lat: 32.0809, lng: -81.0912 },
];

/**
 * Organization schema - displays business info in Google Knowledge Panel
 * Should be included once, typically on the homepage
 */
export function OrganizationSchema() {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'RemodelerIQ',
    alternateName: 'Remodeler IQ',
    url: BASE_URL,
    logo: LOGO_URL,
    description: 'AI-powered contractor bid analysis helping homeowners avoid overpaying for home renovations.',
    foundingDate: '2024',
    sameAs: [
      'https://intelligence.remodeleriq.com/blog/',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'help@remodeleriq.com',
      contactType: 'customer service',
      availableLanguage: 'English',
    },
    areaServed: SERVICE_AREAS.map(area => ({
      '@type': 'City',
      name: area.city,
      containedInPlace: {
        '@type': 'State',
        name: area.state,
        containedInPlace: {
          '@type': 'Country',
          name: 'United States',
        },
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: area.lat,
        longitude: area.lng,
      },
    })),
    knowsAbout: [
      'Home remodeling costs',
      'Contractor bid analysis',
      'Kitchen renovation',
      'Bathroom remodeling',
      'Construction pricing',
      'Home improvement',
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
}

/**
 * Service schema with geographic service areas
 * Tells Google which metros you serve for specific services
 */
export function ServiceAreaSchema() {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Home Renovation Cost Analysis',
    provider: {
      '@type': 'Organization',
      name: 'RemodelerIQ',
      url: BASE_URL,
    },
    description: 'AI-powered analysis of contractor bids with regional pricing data for kitchen, bathroom, roofing, and other home improvement projects.',
    areaServed: SERVICE_AREAS.map(area => ({
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: area.lat,
        longitude: area.lng,
      },
      geoRadius: '80467', // 50 miles in meters
      name: `${area.city}, ${area.state} Metro Area`,
    })),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Remodeling Analysis Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Contractor Bid Analysis',
            description: 'Upload your contractor bid and get instant AI-powered price verification with local market comparisons.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Remodeling Cost Estimator',
            description: 'Get accurate cost estimates for kitchens, bathrooms, basements, and additions based on your ZIP code.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Trust Radar Contractor Search',
            description: 'Find licensed, reviewed contractors in your area with verified credentials.',
          },
        },
      ],
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
}

/**
 * WebSite schema with SearchAction - enables sitelinks search box in Google
 */
export function WebSiteSchema() {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'RemodelerIQ',
    url: BASE_URL,
    description: 'Free AI-powered contractor bid analysis for home renovations',
    publisher: {
      '@type': 'Organization',
      name: 'RemodelerIQ',
      logo: {
        '@type': 'ImageObject',
        url: LOGO_URL,
      },
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumb schema - shows navigation path in search results
 * Improves CTR by showing site hierarchy
 */
export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.path}`,
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

export interface HowToStep {
  name: string;
  text: string;
  image?: string;
}

interface HowToSchemaProps {
  name: string;
  description: string;
  totalTime?: string; // ISO 8601 duration, e.g., "PT5M" for 5 minutes
  steps: HowToStep[];
  image?: string;
}

/**
 * HowTo schema - displays step-by-step guide in search results
 * Great for how-to queries and instructional content
 */
export function HowToSchema({ name, description, totalTime, steps, image }: HowToSchemaProps) {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    ...(totalTime && { totalTime }),
    ...(image && { image }),
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
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

/**
 * SoftwareApplication schema - for app/tool pages
 * Shows app info with ratings in search results
 */
export function SoftwareApplicationSchema() {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'RemodelerIQ',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'AI-powered contractor bid analysis tool that helps homeowners verify pricing, spot red flags, and negotiate better deals on home renovations.',
    featureList: [
      'AI bid document analysis',
      'Market price comparison',
      'Contractor trust scoring',
      'Negotiation script generator',
      'Change order risk assessment',
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
}

// Pre-defined breadcrumb paths
export const BREADCRUMBS = {
  home: [{ name: 'Home', path: '/' }],
  join: [
    { name: 'Home', path: '/' },
    { name: 'Create Account', path: '/join' },
  ],
  login: [
    { name: 'Home', path: '/' },
    { name: 'Sign In', path: '/login' },
  ],
  studio: [
    { name: 'Home', path: '/' },
    { name: 'Cost Calculator', path: '/studio' },
  ],
  quoteFair: [
    { name: 'Home', path: '/' },
    { name: 'Is My Contractor Quote Fair?', path: '/is-my-contractor-quote-fair' },
  ],
  vsChatgpt: [
    { name: 'Home', path: '/' },
    { name: 'RemodelerIQ vs ChatGPT', path: '/vs/chatgpt' },
  ],
  useWithAI: [
    { name: 'Home', path: '/' },
    { name: 'Use RemodelerIQ With Your AI', path: '/use-with-ai' },
  ],
  useWithClaude: [
    { name: 'Home', path: '/' },
    { name: 'Use RemodelerIQ With Your AI', path: '/use-with-ai' },
    { name: 'Claude', path: '/use-with-claude' },
  ],
  useWithChatgpt: [
    { name: 'Home', path: '/' },
    { name: 'Use RemodelerIQ With Your AI', path: '/use-with-ai' },
    { name: 'ChatGPT', path: '/use-with-chatgpt' },
  ],
  chatGptPlugin: [
    { name: 'Home', path: '/' },
    { name: 'Use RemodelerIQ With Your AI', path: '/use-with-ai' },
    { name: 'ChatGPT Plugin', path: '/chat-gpt-plugin' },
  ],
  vsBidCompareAI: [
    { name: 'Home', path: '/' },
    { name: 'RemodelerIQ vs BidCompareAI', path: '/vs/bidcompare-ai' },
  ],
  vsEstimateHawk: [
    { name: 'Home', path: '/' },
    { name: 'RemodelerIQ vs EstimateHawk', path: '/vs/estimatehawk' },
  ],
  trustRadar: [
    { name: 'Home', path: '/' },
    { name: 'Trust Radar', path: '/trust-radar' },
  ],
  premium: [
    { name: 'Home', path: '/' },
    { name: 'Premium', path: '/premium' },
  ],
  settings: [
    { name: 'Home', path: '/' },
    { name: 'Settings', path: '/settings' },
  ],
  privacy: [
    { name: 'Home', path: '/' },
    { name: 'Privacy Policy', path: '/privacy' },
  ],
  terms: [
    { name: 'Home', path: '/' },
    { name: 'Terms of Service', path: '/terms' },
  ],
};

// Pre-defined HowTo content
export const HOWTO_BID_ANALYSIS: HowToSchemaProps = {
  name: 'How to Analyze a Contractor Bid with RemodelerIQ',
  description: 'Learn how to use RemodelerIQ to analyze your contractor bid, verify pricing, and get negotiation tips in under 2 minutes.',
  totalTime: 'PT2M',
  steps: [
    {
      name: 'Upload your bid',
      text: 'Take a photo or upload a PDF of your contractor estimate. We accept quotes for any home improvement project including kitchens, bathrooms, roofing, HVAC, and more.',
    },
    {
      name: 'AI extracts the details',
      text: 'Our AI reads your bid and extracts line items, labor costs, materials, project scope, and contractor information automatically.',
    },
    {
      name: 'Review your price verdict',
      text: 'See how your bid compares to market rates for your ZIP code. We\'ll tell you if pricing is fair, above market, or suspiciously low.',
    },
    {
      name: 'Check the contractor trust score',
      text: 'View licensing status, reviews, insurance verification, and BBB rating to assess contractor reliability.',
    },
    {
      name: 'Get your negotiation script',
      text: 'Use our AI-generated talking points to negotiate a better deal based on specific issues found in your bid.',
    },
  ],
};

export const HOWTO_COST_ESTIMATE: HowToSchemaProps = {
  name: 'How to Estimate Remodeling Costs',
  description: 'Use the RemodelerIQ Cost Calculator to get accurate estimates for kitchen, bathroom, basement, or home addition projects.',
  totalTime: 'PT3M',
  steps: [
    {
      name: 'Select your project type',
      text: 'Choose from kitchen remodel, bathroom renovation, basement finishing, or home addition. You can estimate multiple projects at once.',
    },
    {
      name: 'Enter your ZIP code',
      text: 'Your ZIP code helps us apply accurate regional pricing based on local labor rates and material costs in your metro area.',
    },
    {
      name: 'Configure project details',
      text: 'Select your finish level (budget, mid-range, or premium), project size, and specific features like appliances or fixtures.',
    },
    {
      name: 'Review your estimate',
      text: 'Get a detailed cost breakdown showing labor, materials, and typical contractor markup. See how current market conditions affect pricing.',
    },
  ],
};
