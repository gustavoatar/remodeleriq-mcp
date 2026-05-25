import { Hono } from 'hono';
import { getRegionalInsights, getRelevantInsights, getRelevantScams, type RegionalInsightsData, type RegionalInsight } from '../../shared/regionalRedditInsights';

const app = new Hono<{ Bindings: Env }>();

type CommunitySentiment = 'positive' | 'neutral' | 'cautious' | 'frustrated';

interface CommunityInsight {
  sentiment: CommunitySentiment;
  threadCount: number;
  synthesis: string;
  topics: string[];
  regionalData?: RegionalInsightsData | null;
  relevantRegionalInsights?: RegionalInsight[];
  relevantScams?: string[];
}

// Mock community insights based on project type
const COMMUNITY_INSIGHTS: Record<string, CommunityInsight> = {
  kitchen: {
    sentiment: 'cautious',
    threadCount: 47,
    synthesis: 'Homeowners are reporting 3-4 month lead times on custom cabinetry. Many recommend getting multiple quotes as contractor pricing varies significantly. DIY-friendly tasks like painting and hardware installation can save 10-15% on labor.',
    topics: ['Cabinet lead times', 'Appliance delivery', 'Contractor pricing', 'DIY opportunities']
  },
  bathroom: {
    sentiment: 'frustrated',
    threadCount: 52,
    synthesis: 'Homeowners are currently reporting difficulty finding available tile setters, leading to higher-than-expected labor quotes. Many suggest buying finish materials yourself to avoid contractor markups, though this adds logistical work.',
    topics: ['Tile setter availability', 'Material markups', 'Plumbing fixtures', 'Timeline delays']
  },
  basement: {
    sentiment: 'neutral',
    threadCount: 38,
    synthesis: 'Recent discussions highlight the importance of addressing moisture issues before finishing. Homeowners recommend getting multiple egress window quotes as prices vary by 40%+. Many are phasing projects to spread costs.',
    topics: ['Moisture remediation', 'Egress windows', 'Permit timelines', 'Phased approach']
  },
  addition: {
    sentiment: 'cautious',
    threadCount: 31,
    synthesis: 'Homeowners emphasize the importance of thorough architectural plans to avoid change orders. Permit timelines vary significantly by municipality—some report 2-8 week waits. Consider a design-build firm for complex additions.',
    topics: ['Architectural planning', 'Permit delays', 'Change orders', 'Design-build firms']
  },
  general: {
    sentiment: 'neutral',
    threadCount: 65,
    synthesis: 'Homeowners consistently recommend thorough vetting of contractors, getting multiple quotes, and having detailed written contracts. Many suggest setting aside 10-20% contingency for unexpected issues.',
    topics: ['Contractor vetting', 'Multiple quotes', 'Written contracts', 'Contingency budget']
  }
};

app.post('/', async (c) => {
  try {
    const { bidText, projectType, stateCode } = await c.req.json<{ 
      bidText: string; 
      projectType?: string;
      stateCode?: string;
    }>();

    if (!bidText) {
      return c.json({ 
        success: false, 
        error: 'Bid content is required' 
      }, 400);
    }

    // Determine project type from text or use provided type
    let detectedType = (projectType || 'general').toLowerCase();
    
    // Simple keyword detection if not provided
    if (!projectType) {
      if (bidText.toLowerCase().includes('kitchen') || bidText.toLowerCase().includes('cabinet')) {
        detectedType = 'kitchen';
      } else if (bidText.toLowerCase().includes('bathroom') || bidText.toLowerCase().includes('bath')) {
        detectedType = 'bathroom';
      } else if (bidText.toLowerCase().includes('basement')) {
        detectedType = 'basement';
      } else if (bidText.toLowerCase().includes('addition') || bidText.toLowerCase().includes('expand')) {
        detectedType = 'addition';
      }
    }

    // Get appropriate insight or fall back to general
    const baseInsight = COMMUNITY_INSIGHTS[detectedType] || COMMUNITY_INSIGHTS.general;
    
    // Get regional insights if state code provided
    const regionalData = stateCode ? getRegionalInsights(stateCode) : null;
    const relevantRegionalInsights = stateCode ? getRelevantInsights(stateCode, detectedType) : [];
    const relevantScams = stateCode ? getRelevantScams(stateCode, detectedType) : [];
    
    const insight: CommunityInsight = {
      ...baseInsight,
      regionalData,
      relevantRegionalInsights,
      relevantScams
    };

    return c.json({
      success: true,
      insight
    });

  } catch (error) {
    console.error('Community analysis error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to analyze community insights' 
    }, 500);
  }
});

export default app;
