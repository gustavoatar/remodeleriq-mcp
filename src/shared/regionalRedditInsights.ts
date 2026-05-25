/**
 * Regional Reddit Insights
 * 
 * Community discussions and concerns that vary by region.
 * Based on patterns from r/HomeImprovement, r/Contractors, and regional subreddits.
 */

export interface RegionalInsight {
  topic: string;
  concern: string;
  redditTakeaway: string;
  questionToAsk: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface RegionalInsightsData {
  stateName: string;
  stateCode: string;
  climate: string;
  overview: string;
  insights: RegionalInsight[];
  commonScams: string[];
  licensingNotes: string;
}

// Georgia-specific insights based on Reddit discussions
export const GEORGIA_INSIGHTS: RegionalInsightsData = {
  stateName: 'Georgia',
  stateCode: 'GA',
  climate: 'Hot & Humid Subtropical',
  overview: 'Georgia homeowners frequently discuss humidity control, termite prevention, and navigating the state\'s contractor licensing system. Metro Atlanta has high demand and premium pricing, while rural areas offer better availability.',
  insights: [
    {
      topic: 'Moisture & Humidity Control',
      concern: 'Georgia\'s humidity causes widespread issues with crawl spaces, attics, and HVAC systems',
      redditTakeaway: 'Reddit users strongly recommend encapsulated crawl spaces and properly sized HVAC with dehumidification. Many report mold issues within 2-3 years of finishing basements without proper moisture barriers.',
      questionToAsk: 'What moisture mitigation is included? Is crawl space encapsulation or a dehumidifier part of this scope?',
      severity: 'warning'
    },
    {
      topic: 'Flooring & Subfloor Moisture',
      concern: 'Georgia\'s humidity requires extra care with hardwood and engineered flooring',
      redditTakeaway: 'Reddit flooring installers insist on 7-14 day acclimation periods for hardwood in Georgia. Many homeowners report cupping, buckling, or gaps within the first year because wood wasn\'t properly acclimated. Always test subfloor moisture levels.',
      questionToAsk: 'How long will the flooring acclimate before installation? Will you test the subfloor moisture content?',
      severity: 'warning'
    },
    {
      topic: 'Termite Prevention',
      concern: 'Georgia is in the highest termite risk zone in the US',
      redditTakeaway: 'Homeowners report devastating discoveries of termite damage during remodels. Reddit consensus: any work touching the foundation or framing should include termite inspection and treatment plan.',
      questionToAsk: 'Will there be a termite inspection before work begins? What preventive treatment is included for any exposed wood?',
      severity: 'critical'
    },
    {
      topic: 'HVAC Sizing',
      concern: 'Many Georgia contractors oversize AC units, causing humidity problems',
      redditTakeaway: 'Oversized units cool too fast without removing humidity, leading to clammy air and mold. Reddit users insist on Manual J load calculations—not just "matching what was there."',
      questionToAsk: 'Was a Manual J calculation performed? What tonnage is being installed and why?',
      severity: 'warning'
    },
    {
      topic: 'Georgia Contractor Licensing',
      concern: 'Georgia has no statewide general contractor license requirement',
      redditTakeaway: 'Many homeowners are surprised that GA doesn\'t require state GC licenses. Reddit advice: verify local county/city licenses, check for specialty licenses (plumbing, electrical, HVAC require state licenses), and always verify insurance.',
      questionToAsk: 'What licenses do you hold? Are your subcontractors licensed for their specialty trades?',
      severity: 'warning'
    },
    {
      topic: 'Red Clay & Foundation Issues',
      concern: 'Georgia\'s expansive red clay soil causes foundation movement',
      redditTakeaway: 'Clay soil expands when wet and shrinks when dry, stressing foundations. Reddit users recommend checking for existing cracks before any major reno and addressing drainage issues first.',
      questionToAsk: 'Have you assessed the foundation condition? Is any grading or drainage work needed before starting?',
      severity: 'info'
    },
    {
      topic: 'Attic Insulation & Radiant Barriers',
      concern: 'Georgia attics can reach 150°F+, making insulation critical',
      redditTakeaway: 'Reddit users report significant energy savings from radiant barriers and proper attic insulation (R-38 minimum). Many contractors skip this or underspec it—check the R-value.',
      questionToAsk: 'What R-value insulation is being installed? Is a radiant barrier included for the attic?',
      severity: 'info'
    },
    {
      topic: 'Storm Damage & Insurance',
      concern: 'Georgia sees frequent severe thunderstorms and occasional tornados',
      redditTakeaway: 'Homeowners advise documenting everything before and during renovation for insurance purposes. Reddit warns about storm chasers appearing after major weather events with suspiciously low bids.',
      questionToAsk: 'Are you a local company? How long have you been operating in Georgia?',
      severity: 'info'
    },
    {
      topic: 'Deck & Outdoor Living',
      concern: 'Georgia\'s climate is hard on outdoor wood structures',
      redditTakeaway: 'Pressure-treated lumber still rots in Georgia humidity. Reddit recommends composite decking or hardwoods like Ipe for longevity. Always check that posts are set in concrete, not ground contact.',
      questionToAsk: 'What decking material is specified? How are the posts being set and protected from moisture?',
      severity: 'info'
    },
    {
      topic: 'Permit Requirements',
      concern: 'Metro Atlanta counties have varying permit requirements and inspection timelines',
      redditTakeaway: 'Fulton, DeKalb, Cobb, and Gwinnett all have different processes. Reddit users report 2-6 week permit waits in busy seasons. Some contractors try to skip permits—this can void insurance and cause problems at sale.',
      questionToAsk: 'Which permits are required for this work? Who is pulling them and what\'s the expected timeline?',
      severity: 'warning'
    },
    {
      topic: 'HOA Approvals',
      concern: 'Many Georgia subdivisions have strict HOAs that must approve exterior work',
      redditTakeaway: 'Horror stories abound of homeowners having to undo completed work that wasn\'t HOA-approved. Get written approval BEFORE signing a contract for any exterior-visible changes.',
      questionToAsk: 'Have you worked with HOAs before? Do I need architectural approval before we start?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers offering "free" roof inspections after severe weather, then claiming damage that doesn\'t exist',
    'Unlicensed "handymen" doing work that requires licensed trades (electrical, plumbing, HVAC)',
    'Contractors asking for 50%+ upfront and then disappearing—Georgia has no contractor bond requirement',
    'Fake "city inspector" calls saying work failed inspection and demanding payment to the contractor'
  ],
  licensingNotes: 'Georgia requires state licenses for Electrical, Plumbing, HVAC, and Low Voltage contractors. General contractors do NOT require a state license but may need local business licenses. Always verify at sos.ga.gov for specialty trades.'
};

// California-specific insights
export const CALIFORNIA_INSIGHTS: RegionalInsightsData = {
  stateName: 'California',
  stateCode: 'CA',
  climate: 'Mediterranean to Desert (varies by region)',
  overview: 'California homeowners navigate strict building codes, seismic requirements, and drought restrictions. Wildfire risk dominates discussions in many areas, while coastal regions focus on moisture and salt air damage. Labor costs are among the highest in the nation, and permits can take months in some jurisdictions.',
  insights: [
    {
      topic: 'Seismic Retrofitting',
      concern: 'California requires earthquake safety measures that many other states don\'t',
      redditTakeaway: 'Reddit users emphasize that any foundation work, major remodel, or addition triggers seismic upgrade requirements. Soft-story retrofitting is mandatory in many cities. Get this assessed upfront—it can add 10-20% to project costs.',
      questionToAsk: 'Does this project trigger any seismic retrofit requirements? Is foundation bolting or cripple wall bracing included?',
      severity: 'critical'
    },
    {
      topic: 'Wildfire Zones & Fire-Resistant Materials',
      concern: 'Much of California is in a Wildfire Hazard Severity Zone with strict material requirements',
      redditTakeaway: 'Homeowners in WUI (Wildland-Urban Interface) zones report being required to use Class A roofing, fire-resistant siding, tempered glass, and ember-resistant vents. Check your zone before planning any exterior work—material costs are significantly higher.',
      questionToAsk: 'Is my property in a fire hazard zone? What fire-resistant materials are required for this work?',
      severity: 'critical'
    },
    {
      topic: 'Title 24 Energy Compliance',
      concern: 'California\'s energy code is the strictest in the US and applies to most renovations',
      redditTakeaway: 'Any HVAC replacement, window change, or significant remodel triggers Title 24 compliance. Reddit users report surprise costs for additional insulation, cool roofs, or HVAC efficiency upgrades. Some contractors ignore this—it becomes your problem at inspection.',
      questionToAsk: 'What Title 24 requirements apply to this project? Is compliance included in your bid?',
      severity: 'warning'
    },
    {
      topic: 'Drought-Tolerant Landscaping',
      concern: 'Water restrictions affect irrigation and landscaping choices throughout the state',
      redditTakeaway: 'Many water districts limit turf area and require drought-tolerant plants. Some jurisdictions offer rebates for turf removal. Reddit recommends checking local water authority rules before any landscape project.',
      questionToAsk: 'Does this landscaping comply with local water-use restrictions? Are there rebate programs I should know about?',
      severity: 'info'
    },
    {
      topic: 'ADU & Permit Backlog',
      concern: 'California\'s ADU boom has created long permit wait times in many cities',
      redditTakeaway: 'Permit timelines vary wildly—LA can take 6+ months, while smaller cities may be faster. Reddit users recommend using pre-approved ADU plans where available to speed the process. Factor permit wait time into your project timeline.',
      questionToAsk: 'What\'s the current permit timeline in my jurisdiction? Have you built in this area recently?',
      severity: 'warning'
    },
    {
      topic: 'CSLB Contractor Licensing',
      concern: 'California has strict contractor licensing—verify at cslb.ca.gov',
      redditTakeaway: 'California requires state licenses for work over $500. Reddit is full of horror stories about unlicensed contractors. Always verify the license number, check for complaints, and confirm workers\' comp insurance. The CSLB website is your friend.',
      questionToAsk: 'What is your CSLB license number? Can I verify your workers\' comp coverage?',
      severity: 'warning'
    },
    {
      topic: 'High Labor Costs',
      concern: 'California construction labor costs are 30-50% above national average',
      redditTakeaway: 'Bids that seem too good to be true usually are. Reddit users warn that lowball bids often mean unlicensed workers, skipped permits, or change orders later. Get 3-4 bids and be suspicious of outliers on the low end.',
      questionToAsk: 'Does this bid include all licensed labor? Are permits and inspections factored in?',
      severity: 'info'
    },
    {
      topic: 'Solar & NEM 3.0',
      concern: 'California\'s new net metering rules have changed solar economics significantly',
      redditTakeaway: 'NEM 3.0 reduced the value of exported solar power by about 75%. Reddit consensus: battery storage is now essential to maximize solar value. Also, many HOAs still try to block solar despite state law protecting it.',
      questionToAsk: 'How does this system pencil out under NEM 3.0? Is battery storage included? What\'s the realistic payback period?',
      severity: 'warning'
    },
    {
      topic: 'Foundation Issues & Expansive Soil',
      concern: 'Many California regions have expansive clay soil causing foundation movement',
      redditTakeaway: 'Hillside homes and those on adobe clay are especially vulnerable. Reddit users recommend foundation inspections before any major remodel. Drainage improvements often need to happen first.',
      questionToAsk: 'Have you assessed the foundation and drainage? Will soil conditions affect this project?',
      severity: 'info'
    },
    {
      topic: 'Pool Safety Requirements',
      concern: 'California has some of the strictest pool safety laws in the nation',
      redditTakeaway: 'Any pool work triggers safety compliance—approved barriers, self-closing gates, and often anti-entrapment drains. Pool sellers must provide a list of approved safety features. Budget for these requirements.',
      questionToAsk: 'What pool safety features are required? Is compliance with the Pool Safety Act included?',
      severity: 'warning'
    }
  ],
  commonScams: [
    'Unlicensed contractors claiming they\'re "just doing handyman work" to avoid the $500 license threshold',
    'Storm/fire chasers appearing after disasters with cash-only deals and out-of-state plates',
    'Fake CSLB license numbers—always verify at cslb.ca.gov, not just the card they show you',
    'Permit runners who pull permits but disappear before inspections, leaving you with open permits',
    '"Wholesale pricing" on materials that are actually standard retail with a markup'
  ],
  licensingNotes: 'California requires a CSLB license for all work over $500 (labor + materials). Verify at cslb.ca.gov. General contractors need a B license; specialty trades (C-10 electrical, C-36 plumbing, C-20 HVAC, etc.) need specific licenses. Contractors must carry workers\' comp insurance.'
};

// Texas-specific insights
export const TEXAS_INSIGHTS: RegionalInsightsData = {
  stateName: 'Texas',
  stateCode: 'TX',
  climate: 'Varies: Humid Subtropical (East), Semi-Arid (West), Hot Desert (Far West)',
  overview: 'Texas homeowners deal with extreme heat, foundation movement from expansive clay soil, and severe weather from hail to hurricanes. The state has minimal contractor licensing at the state level, putting more responsibility on homeowners to vet contractors. Major metros have booming construction with high demand.',
  insights: [
    {
      topic: 'Foundation Movement & Expansive Clay',
      concern: 'Texas has some of the worst expansive soil conditions in the US, causing widespread foundation issues',
      redditTakeaway: 'Clay soil expands when wet and shrinks when dry, cracking foundations. Reddit users insist on foundation evaluation before any major remodel. Maintaining consistent soil moisture (soaker hoses around foundation) helps prevent movement. Many homes need pier work eventually.',
      questionToAsk: 'Have you inspected the foundation? Should we address any foundation issues before starting this work?',
      severity: 'critical'
    },
    {
      topic: 'No State Contractor License',
      concern: 'Texas has no statewide general contractor licensing—verification falls on the homeowner',
      redditTakeaway: 'Unlike California, Texas doesn\'t require a state GC license. Reddit strongly recommends checking BBB, Google reviews, asking for references, and verifying insurance. Electricians, plumbers, and HVAC techs DO require state licenses—verify at tdlr.texas.gov.',
      questionToAsk: 'Can you provide proof of insurance, references from recent local jobs, and license numbers for your specialty subs?',
      severity: 'warning'
    },
    {
      topic: 'Extreme Heat & HVAC Sizing',
      concern: 'Texas summers push HVAC systems to their limits—proper sizing is critical',
      redditTakeaway: 'Oversized or undersized AC units are common complaints. Reddit users insist on Manual J load calculations, not just "one ton per 500 sq ft" rules of thumb. Variable-speed systems handle Texas heat better. Also verify SEER ratings meet current standards.',
      questionToAsk: 'Will you perform a Manual J calculation? What SEER rating is being installed, and why did you choose this tonnage?',
      severity: 'warning'
    },
    {
      topic: 'Hail Damage & Roofing',
      concern: 'Texas leads the nation in hail claims—roofing is a major concern',
      redditTakeaway: 'Hail storms bring out roofing scammers in force. Reddit warns about "free inspections" that find damage, insurance assignment scams, and contractors who disappear after collecting the insurance check. Stick with established local companies.',
      questionToAsk: 'How long have you been in business in this area? Can I see your permanent business address and verify your insurance?',
      severity: 'warning'
    },
    {
      topic: 'Hurricane & Wind Ratings (Coastal)',
      concern: 'Texas Gulf Coast has strict wind-load requirements that increase project costs',
      redditTakeaway: 'Coastal counties require wind-rated materials, hurricane straps, and impact-resistant glazing in many cases. Reddit users report 15-25% higher costs on the coast versus inland. Verify your wind zone before accepting bids.',
      questionToAsk: 'What wind zone is my property in? Are wind-rated materials and proper tie-downs included in this bid?',
      severity: 'warning'
    },
    {
      topic: 'Attic Insulation & Radiant Barriers',
      concern: 'Texas attics can reach 150°F+, making insulation critical for energy costs',
      redditTakeaway: 'Adding insulation and radiant barriers are among the best ROI improvements in Texas. Reddit recommends R-38 minimum for attics. Spray foam is popular but expensive—ensure proper ventilation if using it.',
      questionToAsk: 'What R-value insulation is specified? Is a radiant barrier included, and how will attic ventilation be handled?',
      severity: 'info'
    },
    {
      topic: 'Plumbing & Pipe Freeze Protection',
      concern: 'Winter freeze events have exposed vulnerabilities in Texas plumbing',
      redditTakeaway: 'After the 2021 freeze, Reddit discussions focus on pipe insulation, main shutoff accessibility, and tankless water heater freeze protection. Any plumbing work should address freeze vulnerability in exposed areas.',
      questionToAsk: 'How will pipes in unconditioned spaces be protected from freezing? Is the main shutoff easily accessible?',
      severity: 'info'
    },
    {
      topic: 'HOA Restrictions',
      concern: 'Texas has many master-planned communities with strict HOA architectural controls',
      redditTakeaway: 'HOA violations can result in fines and forced removal of work. Reddit users emphasize getting written architectural approval BEFORE signing contracts. Some HOAs have specific approved colors, materials, and even contractor requirements.',
      questionToAsk: 'Do you have experience working with HOAs? I\'ll need to get architectural approval before we proceed.',
      severity: 'info'
    },
    {
      topic: 'Permit Requirements Vary Widely',
      concern: 'Texas permit requirements differ dramatically between jurisdictions',
      redditTakeaway: 'Houston famously has no zoning, while Austin has strict permitting. Unincorporated county areas may have minimal requirements. Reddit recommends always checking with your specific jurisdiction—don\'t assume.',
      questionToAsk: 'What permits are required for this work in my jurisdiction? Who is responsible for pulling them?',
      severity: 'info'
    },
    {
      topic: 'Termites & Pest Prevention',
      concern: 'Texas is high-risk for both subterranean and Formosan termites',
      redditTakeaway: 'Any work exposing wood framing should include termite inspection and treatment. Reddit users recommend termite bonds with annual inspections, especially for pier-and-beam homes.',
      questionToAsk: 'Will there be a termite inspection before work begins? What preventive treatment is included?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Hail storm chasers offering free roof inspections, then inflating damage claims or doing subpar work',
    'Foundation repair companies using scare tactics to oversell pier work that isn\'t needed',
    '"Texas Contractor License" claims—there is no such thing for general contractors at the state level',
    'Insurance assignment of benefits (AOB) scams where contractors control your insurance claim',
    'Door-to-door solar salespeople quoting unrealistic savings and locking customers into bad leases'
  ],
  licensingNotes: 'Texas has NO state license requirement for general contractors. Electricians, plumbers, and HVAC technicians require state licenses—verify at tdlr.texas.gov. Some cities (Austin, Dallas, Houston, etc.) require local registration. Always verify insurance and check references carefully.'
};

// Florida-specific insights
export const FLORIDA_INSIGHTS: RegionalInsightsData = {
  stateName: 'Florida',
  stateCode: 'FL',
  climate: 'Humid Subtropical to Tropical',
  overview: 'Florida homeowners face unique challenges from hurricanes, humidity, and strict building codes that evolved after major storms. The state has robust contractor licensing requirements. Insurance costs have skyrocketed, making wind mitigation improvements particularly valuable. Flood zone compliance is critical for many properties.',
  insights: [
    {
      topic: 'Hurricane Straps & Wind Mitigation',
      concern: 'Florida requires specific wind-resistant construction methods that can significantly impact insurance rates',
      redditTakeaway: 'Reddit users emphasize getting a wind mitigation inspection—hurricane straps, secondary water barriers, impact windows, and roof-to-wall connections can reduce insurance by 20-45%. Any roofing work should include these upgrades.',
      questionToAsk: 'Will this work include hurricane straps and proper roof-to-wall connections? Can I get a wind mitigation report after completion?',
      severity: 'critical'
    },
    {
      topic: 'Impact Windows & Hurricane Shutters',
      concern: 'Florida Building Code requires impact-rated glazing or protection in most of the state',
      redditTakeaway: 'Large-missile impact zones (most of South Florida) require impact glass or approved shutters. Reddit users report that impact windows pay for themselves in insurance savings within 5-10 years. Verify products are Florida Product Approved.',
      questionToAsk: 'Are these windows Florida Product Approved for my wind zone? What impact rating do they have?',
      severity: 'warning'
    },
    {
      topic: 'Flood Zone & Elevation Requirements',
      concern: 'Much of Florida is in flood zones with strict requirements for renovations',
      redditTakeaway: 'The "50% rule" means if improvements exceed 50% of the structure\'s market value, you may need to bring the entire property into compliance—potentially requiring elevation. Reddit users recommend checking your flood zone and substantial improvement status before any major work.',
      questionToAsk: 'Is my property in a flood zone? Could this project trigger substantial improvement requirements?',
      severity: 'critical'
    },
    {
      topic: 'Moisture & Mold Prevention',
      concern: 'Florida\'s humidity creates ideal conditions for mold growth during and after construction',
      redditTakeaway: 'Any work that exposes wall cavities risks mold if not properly dried before closing up. Reddit users insist on dehumidification during construction, proper vapor barriers, and mold-resistant materials in wet areas.',
      questionToAsk: 'What moisture control measures will you use during construction? Are mold-resistant materials included in wet areas?',
      severity: 'warning'
    },
    {
      topic: 'Florida Contractor Licensing',
      concern: 'Florida has strict contractor licensing—verify at myfloridalicense.com',
      redditTakeaway: 'Florida requires state licenses for contractors, and local jurisdictions often require registration too. Reddit warns about "storm chasers" with out-of-state licenses. Always verify at myfloridalicense.com and check for complaints.',
      questionToAsk: 'What is your Florida state license number? Are you registered in this county?',
      severity: 'warning'
    },
    {
      topic: 'Roof Age & Insurance',
      concern: 'Florida insurers are increasingly refusing coverage for homes with roofs over 15 years old',
      redditTakeaway: 'Many Reddit users report being dropped or denied insurance due to roof age, regardless of condition. If your roof is 12+ years old, factor in replacement when planning other major projects. Metal and tile roofs may get more favorable treatment.',
      questionToAsk: 'What is the expected lifespan of this roofing system? What documentation will you provide for insurance purposes?',
      severity: 'warning'
    },
    {
      topic: 'Stucco & EIFS Issues',
      concern: 'Florida\'s climate is hard on stucco, and improper installation leads to water intrusion',
      redditTakeaway: 'Stucco cracks let water in, which gets trapped in humid conditions and causes major damage. Reddit users recommend proper flashing, weep screeds, and avoiding EIFS (synthetic stucco) in Florida\'s climate.',
      questionToAsk: 'What waterproofing measures are included? How will flashing and weep screeds be handled?',
      severity: 'info'
    },
    {
      topic: 'AC Sizing & Humidity Control',
      concern: 'Florida HVAC systems must handle humidity as much as temperature',
      redditTakeaway: 'Oversized AC cools quickly but doesn\'t run long enough to dehumidify. Reddit users recommend Manual J calculations and variable-speed systems. Indoor humidity should stay below 55% to prevent mold.',
      questionToAsk: 'Will you perform a Manual J calculation? How will this system handle humidity control?',
      severity: 'info'
    },
    {
      topic: 'Pool Screen Enclosures',
      concern: 'Screen enclosures must meet Florida wind-load requirements',
      redditTakeaway: 'Cheap screen enclosures fail in storms and can damage the home. Reddit users recommend aluminum frames with proper engineering and Miami-Dade NOA approval for South Florida. Get permits—unpermitted enclosures cause insurance issues.',
      questionToAsk: 'Does this enclosure meet Florida Building Code wind-load requirements? Is it permitted?',
      severity: 'info'
    },
    {
      topic: 'Termites & Wood Destroying Organisms',
      concern: 'Florida has aggressive termite populations, including Formosan and drywood termites',
      redditTakeaway: 'Any wood-exposing work should include termite inspection. Reddit users recommend treated lumber, borate treatments, and termite bonds with annual inspections. Formosan termites can destroy a home in 2-3 years.',
      questionToAsk: 'What termite preventive measures are included? Will pressure-treated lumber be used where appropriate?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Hurricane chasers showing up after storms with out-of-state plates and pressure tactics',
    'Unlicensed "handymen" doing work that requires a Florida contractor license',
    'Assignment of Benefits (AOB) abuse—never sign over insurance benefits to contractors',
    'Roofing companies offering "free roof" through insurance fraud schemes',
    'Lowball bids that don\'t include required wind mitigation or code compliance'
  ],
  licensingNotes: 'Florida requires state licenses for contractors—verify at myfloridalicense.com. CGC (General Contractor), CBC (Building Contractor), CCC (Roofing), CFC (Plumbing), CAC (HVAC), EC (Electrical). Many counties also require local registration. After hurricanes, out-of-state contractors may get temporary permits—verify their home state license too.'
};

// New York-specific insights
export const NEW_YORK_INSIGHTS: RegionalInsightsData = {
  stateName: 'New York',
  stateCode: 'NY',
  climate: 'Humid Continental (varies from NYC to Upstate)',
  overview: 'New York homeowners face high labor costs, complex permit requirements (especially in NYC), and challenges from freeze-thaw cycles. NYC has unique requirements including DOB permits, landmark restrictions, and coop/condo board approvals. Upstate faces different issues with older housing stock and harsh winters.',
  insights: [
    {
      topic: 'NYC DOB Permits & Complexity',
      concern: 'New York City has one of the most complex permitting systems in the country',
      redditTakeaway: 'NYC requires permits for almost everything, and the DOB process can take months. Reddit users strongly recommend using contractors experienced with NYC DOB filings. Self-certified filings are faster but shift liability to the homeowner if issues arise.',
      questionToAsk: 'Who will handle the DOB permit application? Are you familiar with the requirements in my specific borough?',
      severity: 'warning'
    },
    {
      topic: 'Landmark & Historic District Rules',
      concern: 'Many NYC and Upstate areas have landmark restrictions that limit renovation options',
      redditTakeaway: 'Work visible from the street in landmark districts requires LPC approval before DOB permits. Reddit users report approval taking 3-6+ months. Even interior work in landmarked buildings may have restrictions.',
      questionToAsk: 'Is my property in a historic district or landmarked? What approvals are needed before we can start?',
      severity: 'warning'
    },
    {
      topic: 'Coop & Condo Board Approvals',
      concern: 'NYC coop and condo renovations require board approval, which can delay projects significantly',
      redditTakeaway: 'Boards may require alteration agreements, architect review, insurance certificates, and deposits. Reddit users recommend starting the approval process 2-3 months before planned construction. Some buildings have blackout periods.',
      questionToAsk: 'Have you worked in coop/condo buildings? What documentation will you provide for the alteration agreement?',
      severity: 'info'
    },
    {
      topic: 'High Labor Costs',
      concern: 'New York has some of the highest construction labor costs in the US',
      redditTakeaway: 'NYC labor costs are 50-100% above national average. Upstate is more reasonable but still above average. Reddit warns that lowball bids often mean unlicensed workers or shortcuts. Get multiple bids but be suspicious of prices far below others.',
      questionToAsk: 'Does this bid include all licensed and insured labor? Are there any potential additional costs not included?',
      severity: 'info'
    },
    {
      topic: 'Lead Paint (Pre-1978 Homes)',
      concern: 'New York has strict lead paint regulations, especially in NYC',
      redditTakeaway: 'NYC Local Law 1 requires lead-safe work practices in pre-1978 homes with children. Reddit users emphasize using EPA-certified renovators and getting clearance testing after work. Violations can result in significant fines.',
      questionToAsk: 'Are you EPA Lead-Safe certified? Will you follow lead-safe work practices and provide clearance testing?',
      severity: 'warning'
    },
    {
      topic: 'Asbestos Testing',
      concern: 'Older NYC buildings often contain asbestos that must be tested before renovation',
      redditTakeaway: 'NYC DOB requires an ACP-5 asbestos investigation before permits for most alterations in pre-1985 buildings. Reddit users report that asbestos abatement can add weeks and thousands to a project. Test early.',
      questionToAsk: 'Has asbestos testing been done? Who will file the ACP-5 with DOB?',
      severity: 'warning'
    },
    {
      topic: 'Freeze-Thaw & Masonry',
      concern: 'New York\'s freeze-thaw cycles damage masonry and require specific repair techniques',
      redditTakeaway: 'Repointing should use lime-based mortar on older brick—Portland cement traps moisture and accelerates damage. Reddit users warn against cheap tuckpointing jobs. Masonry work is best done in moderate temperatures.',
      questionToAsk: 'What type of mortar will you use? When is the best season to do this masonry work?',
      severity: 'info'
    },
    {
      topic: 'Brownstone & Townhouse Specifics',
      concern: 'NYC brownstones have unique structural and preservation requirements',
      redditTakeaway: 'Brownstone is soft sandstone that requires careful restoration. Reddit users recommend specialists for stoop, facade, and cornice work. Party wall agreements may be needed for work affecting neighboring buildings.',
      questionToAsk: 'Do you have experience with brownstone restoration? Will we need a party wall agreement with neighbors?',
      severity: 'info'
    },
    {
      topic: 'Oil-to-Gas Conversions',
      concern: 'NYC Local Law 154 is phasing out oil and gas in new/major renovations',
      redditTakeaway: 'NYC is transitioning to electric heating—new buildings and major renovations will face increasing restrictions on gas. Reddit users suggest considering heat pumps, especially when replacing HVAC systems.',
      questionToAsk: 'How will Local Law 154 affect this project? Should we consider electric alternatives?',
      severity: 'info'
    },
    {
      topic: 'Contractor Licensing Varies by Area',
      concern: 'New York has no statewide GC license, but NYC and other areas have local requirements',
      redditTakeaway: 'NYC requires a Home Improvement Contractor license (verify at nyc.gov/consumers). Nassau and Westchester counties have their own licensing. Upstate may have minimal requirements. Always verify insurance.',
      questionToAsk: 'What licenses do you hold? Can you provide your NYC HIC license number and proof of insurance?',
      severity: 'warning'
    }
  ],
  commonScams: [
    'Unlicensed contractors claiming NYC licensing isn\'t required for "small jobs"',
    'Lowball bids that don\'t account for permit fees, asbestos testing, or DOB requirements',
    'Storm damage repair scams in Long Island and Upstate after winter storms',
    '"Expediter" scams promising faster permits for large upfront fees',
    'Bait-and-switch on materials, especially for exterior brownstone work'
  ],
  licensingNotes: 'New York has no statewide general contractor license. NYC requires a Home Improvement Contractor (HIC) license for work $200+—verify at nyc.gov/consumers. Nassau County, Suffolk County, and Westchester have their own licensing requirements. Always verify workers\' comp and liability insurance.'
};

// Pennsylvania-specific insights
export const PENNSYLVANIA_INSIGHTS: RegionalInsightsData = {
  stateName: 'Pennsylvania',
  stateCode: 'PA',
  climate: 'Humid Continental with Cold Winters',
  overview: 'Pennsylvania homeowners deal with older housing stock, coal region legacy issues, and significant freeze-thaw damage. The state has no statewide contractor licensing, putting responsibility on homeowners. Philadelphia has its own licensing and permit requirements. Radon is a major concern throughout the state.',
  insights: [
    {
      topic: 'Radon Mitigation',
      concern: 'Pennsylvania has some of the highest radon levels in the US—testing is critical',
      redditTakeaway: 'The EPA estimates 40% of PA homes have elevated radon. Reddit users strongly recommend testing before any basement renovation. Mitigation systems ($800-1500) are effective and should be installed by certified professionals.',
      questionToAsk: 'Has radon testing been done? Should we include mitigation as part of this project?',
      severity: 'critical'
    },
    {
      topic: 'No Statewide Contractor License',
      concern: 'Pennsylvania has no state-level general contractor licensing',
      redditTakeaway: 'Like Texas, PA doesn\'t license general contractors at the state level. Reddit users emphasize checking references, verifying insurance, and using the PA Attorney General\'s consumer complaint database. Plumbers, electricians, and HVAC techs do have licensing in most areas.',
      questionToAsk: 'Can you provide proof of liability insurance, workers\' comp, and references from recent local projects?',
      severity: 'warning'
    },
    {
      topic: 'Philadelphia Licensing & Permits',
      concern: 'Philadelphia has its own contractor licensing and strict permit requirements',
      redditTakeaway: 'Philly requires contractor registration with L&I (Licenses & Inspections). Permits are needed for most work, and the city has been cracking down on unpermitted renovations. Reddit users report permit delays, especially for older rowhomes.',
      questionToAsk: 'Are you registered with Philadelphia L&I? Who will handle the permit process?',
      severity: 'warning'
    },
    {
      topic: 'Old Rowhome Challenges',
      concern: 'Philadelphia and Pittsburgh rowhomes have shared walls creating unique renovation challenges',
      redditTakeaway: 'Party walls mean your renovation affects neighbors. Reddit users report needing neighbor notification, party wall agreements for major work, and discovering surprises like shared beams or ductwork. Historic districts add more restrictions.',
      questionToAsk: 'Have you worked on rowhomes? Will we need a party wall agreement or neighbor notification?',
      severity: 'info'
    },
    {
      topic: 'Lead Paint & Older Homes',
      concern: 'PA has high rates of pre-1978 housing with lead paint',
      redditTakeaway: 'PA law requires lead-safe work practices. Philadelphia has strict lead certification requirements for contractors. Reddit users recommend testing before any work that disturbs painted surfaces and using EPA RRP-certified contractors.',
      questionToAsk: 'Are you EPA Lead-Safe certified? Will you test for lead before starting work?',
      severity: 'warning'
    },
    {
      topic: 'Freeze-Thaw Foundation Damage',
      concern: 'PA winters cause significant freeze-thaw damage to foundations and masonry',
      redditTakeaway: 'Stone and brick foundations in older homes are particularly vulnerable. Reddit users recommend proper drainage, waterproofing, and using appropriate mortar for repointing (lime-based for historic masonry). Avoid major masonry work in winter.',
      questionToAsk: 'How will drainage be addressed? What type of mortar will you use for repointing?',
      severity: 'info'
    },
    {
      topic: 'Coal Region Legacy (Anthracite Areas)',
      concern: 'Parts of eastern PA have mine subsidence and coal-related issues',
      redditTakeaway: 'In anthracite regions, mine subsidence insurance is recommended. Reddit users in Scranton, Wilkes-Barre, and similar areas report foundation issues related to old mine voids. Check DEP maps before major foundation work.',
      questionToAsk: 'Is this property in a mine subsidence area? Should we investigate underground conditions before major work?',
      severity: 'info'
    },
    {
      topic: 'HVAC & Oil Heat Conversions',
      concern: 'Many PA homes still use oil heat—conversions to gas or heat pumps are common projects',
      redditTakeaway: 'Oil tank removal requires PA DEP notification if buried. Reddit users recommend getting multiple quotes for oil-to-gas conversions and considering heat pumps, especially with electric utility rebates.',
      questionToAsk: 'If converting from oil, who handles tank removal and DEP requirements? What rebates are available?',
      severity: 'info'
    },
    {
      topic: 'Basement Waterproofing',
      concern: 'PA\'s older homes frequently have wet basement issues',
      redditTakeaway: 'Interior French drains and sump pumps are common solutions. Reddit users warn against companies that just apply waterproof paint—address the water source first. Exterior waterproofing is more expensive but more effective.',
      questionToAsk: 'What\'s causing the water intrusion? Are you addressing the root cause or just managing symptoms?',
      severity: 'info'
    },
    {
      topic: 'Historic Tax Credits',
      concern: 'PA offers tax credits for historic preservation that can offset renovation costs',
      redditTakeaway: 'The PA Historic Preservation Tax Credit can cover 25% of qualified rehabilitation costs. Reddit users recommend checking if your property qualifies before planning renovations—it affects what work can be done and how.',
      questionToAsk: 'Is this property eligible for historic tax credits? Would this project qualify?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm damage roofers going door-to-door after hail events with high-pressure tactics',
    '"Free" basement waterproofing inspections that find expensive problems',
    'Unlicensed contractors claiming PA doesn\'t require licenses (true for GCs, but trades need licenses)',
    'Bait-and-switch on home improvement contracts—read the fine print carefully',
    'Oil tank removal companies that don\'t properly report to DEP'
  ],
  licensingNotes: 'Pennsylvania has no statewide general contractor license. Philadelphia requires registration with L&I. Electricians, plumbers, and HVAC contractors need licenses in most municipalities. The PA Home Improvement Consumer Protection Act requires written contracts for work over $500. Always verify insurance.'
};

// Illinois-specific insights
export const ILLINOIS_INSIGHTS: RegionalInsightsData = {
  stateName: 'Illinois',
  stateCode: 'IL',
  climate: 'Humid Continental with Hot Summers and Cold Winters',
  overview: 'Illinois homeowners face extreme temperature swings, from humid summers to harsh winters. Chicago has extensive permit requirements and union labor dominance. The state has no statewide contractor licensing, but Chicago and many suburbs have local requirements. Basement flooding and radon are common concerns.',
  insights: [
    {
      topic: 'Chicago Permit Requirements',
      concern: 'Chicago has extensive permit requirements and inspections for most renovation work',
      redditTakeaway: 'Chicago requires permits for almost everything—even decks and fences. The process can be slow, and inspectors are known for strict enforcement. Reddit users recommend using contractors experienced with Chicago DOB processes.',
      questionToAsk: 'Will you handle Chicago permit applications? How familiar are you with DOB requirements?',
      severity: 'warning'
    },
    {
      topic: 'Radon Testing',
      concern: 'Illinois has significant radon risk, especially in northern and central regions',
      redditTakeaway: 'Illinois recommends radon testing for all homes. Reddit users report many homes exceeding EPA action levels, especially those with basements. Test before finishing a basement and install mitigation if needed.',
      questionToAsk: 'Has radon testing been done? Should mitigation be included in this basement project?',
      severity: 'warning'
    },
    {
      topic: 'Basement Flooding & Sump Pumps',
      concern: 'Chicago area has significant basement flooding issues, especially with aging infrastructure',
      redditTakeaway: 'Combined sewers in Chicago mean heavy rain can cause backups. Reddit users strongly recommend overhead sewers or backflow preventers, plus battery-backup sump pumps. The city offers grants for flood control.',
      questionToAsk: 'What flood prevention measures are included? Should we install an overhead sewer or backflow preventer?',
      severity: 'warning'
    },
    {
      topic: 'Chicago Bungalow Specifics',
      concern: 'The iconic Chicago bungalow has specific renovation considerations',
      redditTakeaway: 'Bungalows often have knob-and-tube wiring, small electrical panels, and unique layouts. Reddit users recommend the Historic Chicago Bungalow Association for resources. Adding a second floor (popping the top) has specific permit and structural requirements.',
      questionToAsk: 'Have you worked on Chicago bungalows? What electrical upgrades might be needed?',
      severity: 'info'
    },
    {
      topic: 'Union vs. Non-Union Labor',
      concern: 'Chicago area has strong union presence that affects project costs and contractor selection',
      redditTakeaway: 'In Chicago proper, many larger projects use union labor, which is typically higher quality but more expensive. Reddit users note that some suburbs are more flexible. For commercial or multi-unit, union requirements may apply.',
      questionToAsk: 'Do you use union or non-union labor? How does this affect the project cost and timeline?',
      severity: 'info'
    },
    {
      topic: 'Extreme Temperature Swings',
      concern: 'Illinois goes from -10°F winters to 95°F humid summers—insulation and HVAC sizing are critical',
      redditTakeaway: 'Proper insulation and air sealing are essential for both heating and cooling costs. Reddit users recommend Manual J calculations for HVAC and warn against oversizing. Two-stage or variable-speed systems handle the temperature range better.',
      questionToAsk: 'What insulation levels are specified? Will you perform a Manual J calculation for HVAC sizing?',
      severity: 'info'
    },
    {
      topic: 'Masonry Tuckpointing',
      concern: 'Chicago\'s brick buildings require regular tuckpointing maintenance',
      redditTakeaway: 'Freeze-thaw cycles damage mortar joints. Reddit users emphasize using the correct mortar type (Type N or softer for older brick, never Type S). Cheap tuckpointing jobs that use wrong mortar cause long-term damage.',
      questionToAsk: 'What type of mortar will you use? How will you match the existing mortar composition?',
      severity: 'info'
    },
    {
      topic: 'No Statewide Contractor License',
      concern: 'Illinois has no state contractor license, but many municipalities have requirements',
      redditTakeaway: 'Chicago requires various licenses depending on work type. Suburbs vary widely—some require registration, others don\'t. Reddit users recommend always checking local requirements and verifying insurance.',
      questionToAsk: 'What licenses do you hold? Are you registered in this municipality?',
      severity: 'warning'
    },
    {
      topic: 'Lead & Asbestos in Older Homes',
      concern: 'Illinois has extensive pre-1978 housing stock with lead and asbestos concerns',
      redditTakeaway: 'Chicago requires lead inspections for rental properties and has strict renovation requirements. Vermiculite insulation (often containing asbestos) is common in older attics. Reddit recommends testing before disturbing any suspect materials.',
      questionToAsk: 'Are you EPA Lead-Safe certified? Will you test for asbestos before disturbing insulation or tiles?',
      severity: 'warning'
    },
    {
      topic: 'HVAC Rebates & Incentives',
      concern: 'Illinois has significant rebates for energy-efficient HVAC and insulation',
      redditTakeaway: 'ComEd and Nicor offer substantial rebates for high-efficiency HVAC, insulation, and air sealing. Reddit users recommend checking incentives before finalizing equipment choices—rebates can be $1000+.',
      questionToAsk: 'What utility rebates are available for this equipment? Will you help with rebate paperwork?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Tuckpointing scams offering cheap prices but using wrong mortar that damages brick',
    'Basement waterproofing high-pressure sales with scare tactics',
    'Unlicensed roofers going door-to-door after hail storms',
    'Chicago permit fraud—contractors who claim permits aren\'t needed or pull permits for different work',
    '"Handyman" services doing work that requires licensed trades'
  ],
  licensingNotes: 'Illinois has no statewide general contractor license. Chicago requires registration with the Department of Buildings for general contractors and specific licenses for trades. Suburbs vary—always check local requirements. Electricians, plumbers, and roofers need state licenses. Verify insurance and workers\' comp coverage.'
};

// Ohio-specific insights
export const OHIO_INSIGHTS: RegionalInsightsData = {
  stateName: 'Ohio',
  stateCode: 'OH',
  climate: 'Humid Continental with Lake Effect (north)',
  overview: 'Ohio homeowners deal with significant temperature swings, lake effect weather in the north, and older housing stock in major cities. The state has no statewide contractor licensing, putting the burden on homeowners. Radon is a significant concern throughout the state, and basement moisture issues are common.',
  insights: [
    {
      topic: 'No Statewide Contractor License',
      concern: 'Ohio has no state-level general contractor licensing requirement',
      redditTakeaway: 'Ohio doesn\'t require GC licenses at the state level. Reddit users emphasize checking local requirements (Columbus, Cleveland, Cincinnati have their own rules) and always verifying insurance and references. HVAC, electrical, and plumbing do require state licenses.',
      questionToAsk: 'Are you registered in this city/county? Can you provide proof of liability insurance and workers\' comp?',
      severity: 'warning'
    },
    {
      topic: 'Radon Testing',
      concern: 'Ohio has elevated radon levels throughout the state',
      redditTakeaway: 'Ohio EPA estimates 1 in 3 homes have elevated radon. Reddit users strongly recommend testing before any basement finishing project. Mitigation systems are effective and typically cost $800-1500.',
      questionToAsk: 'Has radon testing been done? Should mitigation be included in this basement project?',
      severity: 'warning'
    },
    {
      topic: 'Lake Effect Weather (Northern Ohio)',
      concern: 'Cleveland, Akron, and northeast Ohio face severe lake effect snow and ice',
      redditTakeaway: 'Lake effect areas need robust roofing, proper ice dam prevention, and snow load considerations. Reddit users recommend ice/water shield on entire roof edge and heated gutters in severe areas.',
      questionToAsk: 'What ice dam prevention measures are included? Is ice/water shield extended appropriately?',
      severity: 'info'
    },
    {
      topic: 'Basement Moisture & Waterproofing',
      concern: 'Ohio\'s clay soils and water table create widespread basement moisture issues',
      redditTakeaway: 'Interior French drains and sump pumps are common. Reddit warns against just painting with waterproof coating—address drainage first. Exterior waterproofing is more expensive but more effective for serious problems.',
      questionToAsk: 'What\'s causing the moisture? Are we addressing the root cause or just managing symptoms?',
      severity: 'info'
    },
    {
      topic: 'Older Home Electrical',
      concern: 'Many Ohio homes have outdated electrical systems that need upgrading',
      redditTakeaway: 'Knob-and-tube wiring and Federal Pacific/Zinsco panels are common in older homes. Reddit users recommend full inspections before buying older homes. Insurance companies may require upgrades.',
      questionToAsk: 'What is the current electrical capacity? Are there any panels or wiring that should be replaced?',
      severity: 'info'
    },
    {
      topic: 'Historic District Rules',
      concern: 'Ohio has many local historic districts with exterior renovation restrictions',
      redditTakeaway: 'German Village in Columbus, Ohio City in Cleveland, and many others have strict rules. Reddit users recommend checking historic commission requirements before planning visible exterior work.',
      questionToAsk: 'Is this property in a historic district? What approvals are needed for exterior changes?',
      severity: 'info'
    },
    {
      topic: 'HVAC Sizing for Temperature Swings',
      concern: 'Ohio temperatures range from -10°F to 95°F—proper HVAC sizing is critical',
      redditTakeaway: 'Oversized systems cycle too frequently and don\'t dehumidify properly in summer. Reddit users recommend Manual J calculations and variable-speed systems. Heat pumps work well with proper cold-weather ratings.',
      questionToAsk: 'Will you perform a Manual J calculation? What cold-weather rating does this heat pump have?',
      severity: 'info'
    },
    {
      topic: 'Lead Paint in Older Homes',
      concern: 'Ohio has significant pre-1978 housing stock with lead paint concerns',
      redditTakeaway: 'Ohio follows EPA RRP rules. Reddit users recommend testing before renovation work in older homes, especially with children present. Use EPA-certified renovators.',
      questionToAsk: 'Are you EPA Lead-Safe certified? Will you test for lead before disturbing painted surfaces?',
      severity: 'warning'
    },
    {
      topic: 'Natural Gas Availability',
      concern: 'Ohio has extensive natural gas infrastructure, making gas appliances common',
      redditTakeaway: 'Natural gas is cheap and widely available in Ohio. Reddit users note that gas furnaces and water heaters are standard, but heat pumps are gaining popularity with utility rebates.',
      questionToAsk: 'What are the operating cost differences between gas and electric options? Are rebates available?',
      severity: 'info'
    },
    {
      topic: 'Permit Requirements Vary',
      concern: 'Permit requirements vary significantly between Ohio municipalities',
      redditTakeaway: 'Columbus is strict about permits; rural areas may have minimal requirements. Reddit users recommend always checking local rules—unpermitted work can cause issues at sale.',
      questionToAsk: 'What permits are required for this project in my municipality? Who handles the permit process?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm damage roofers canvassing neighborhoods after severe weather',
    'Driveway sealcoating scams offering cheap prices for diluted product',
    'Basement waterproofing high-pressure sales with scare tactics',
    'Unlicensed "handymen" doing work that requires licensed trades',
    'Furnace/AC upselling by claiming equipment failures that don\'t exist'
  ],
  licensingNotes: 'Ohio has no statewide general contractor license. Major cities (Columbus, Cleveland, Cincinnati, Toledo) have their own contractor registration requirements. HVAC, electrical, and plumbing contractors need state licenses—verify at com.ohio.gov. Always verify insurance and workers\' comp coverage.'
};

// North Carolina-specific insights
export const NORTH_CAROLINA_INSIGHTS: RegionalInsightsData = {
  stateName: 'North Carolina',
  stateCode: 'NC',
  climate: 'Humid Subtropical (varies from mountains to coast)',
  overview: 'North Carolina homeowners face diverse challenges from the mountains to the coast—hurricanes on the coast, humidity throughout, and mountain-specific issues in the west. The state has contractor licensing requirements for projects over $30,000. Moisture management and hurricane preparedness are key concerns.',
  insights: [
    {
      topic: 'State Contractor Licensing',
      concern: 'North Carolina requires licensing for contractors on projects over $30,000',
      redditTakeaway: 'NC Licensing Board issues General Contractor licenses (verify at nclbgc.org). Projects under $30,000 don\'t require state license but local requirements may apply. Reddit users recommend licensed contractors even for smaller projects.',
      questionToAsk: 'What is your NC General Contractor license number? Can I verify it online?',
      severity: 'warning'
    },
    {
      topic: 'Hurricane Preparedness (Coastal)',
      concern: 'Coastal NC is vulnerable to hurricanes with specific building code requirements',
      redditTakeaway: 'Coastal counties have stricter wind-load requirements. Reddit users recommend hurricane straps, impact-resistant windows or shutters, and proper roof tie-downs. Wind mitigation can reduce insurance costs.',
      questionToAsk: 'Does this meet coastal wind-load requirements? What hurricane-resistant features are included?',
      severity: 'critical'
    },
    {
      topic: 'Moisture & Humidity Control',
      concern: 'NC\'s humid climate creates moisture challenges for homes',
      redditTakeaway: 'Crawl spaces are common and prone to moisture issues. Reddit strongly recommends encapsulated crawl spaces over vented ones. Dehumidification is often needed in basements and crawl spaces.',
      questionToAsk: 'How will moisture be controlled in the crawl space? Is encapsulation recommended?',
      severity: 'warning'
    },
    {
      topic: 'Crawl Space Encapsulation',
      concern: 'Traditional vented crawl spaces don\'t work well in NC humidity',
      redditTakeaway: 'NC building code now allows (and many recommend) sealed, conditioned crawl spaces. Reddit users report significant comfort and energy improvements after encapsulation. Typical cost is $5,000-15,000.',
      questionToAsk: 'What type of crawl space system do you recommend? Will it be conditioned or just sealed?',
      severity: 'info'
    },
    {
      topic: 'Termites & Wood-Destroying Insects',
      concern: 'NC has significant termite pressure, especially in coastal and piedmont areas',
      redditTakeaway: 'Both subterranean and drywood termites are present. Reddit users recommend termite bonds with annual inspections, treated lumber for any ground contact, and inspection before major renovations.',
      questionToAsk: 'What termite prevention measures are included? Will pressure-treated lumber be used where appropriate?',
      severity: 'info'
    },
    {
      topic: 'Mountain vs. Piedmont vs. Coastal',
      concern: 'NC has three distinct regions with different construction considerations',
      redditTakeaway: 'Mountains: freeze concerns, steep lot challenges, radon. Piedmont: clay soil foundation issues, moderate climate. Coast: hurricanes, flooding, salt air corrosion. Reddit users emphasize using contractors experienced in your specific region.',
      questionToAsk: 'What regional considerations apply to this project? Do you have experience with homes in this area?',
      severity: 'info'
    },
    {
      topic: 'Flood Zones & Elevation',
      concern: 'Coastal and some inland NC areas have flood zone requirements',
      redditTakeaway: 'FEMA flood maps affect many NC properties. Reddit users recommend checking flood zone status before major renovations—the 50% rule may apply. Flood insurance is required in many areas.',
      questionToAsk: 'Is this property in a flood zone? Could this project trigger substantial improvement requirements?',
      severity: 'warning'
    },
    {
      topic: 'HOA & Architectural Review',
      concern: 'Many NC subdivisions have HOA restrictions on exterior changes',
      redditTakeaway: 'NC has extensive HOA communities, especially in the Triangle and Charlotte areas. Reddit users warn to get architectural approval before signing contracts. Fines and forced removal of unapproved work are possible.',
      questionToAsk: 'Have you reviewed the HOA architectural guidelines? Do we need approval before starting?',
      severity: 'info'
    },
    {
      topic: 'HVAC Heat Pump Climate',
      concern: 'NC\'s moderate climate is ideal for heat pumps',
      redditTakeaway: 'NC is considered prime heat pump territory—mild enough winters for high efficiency. Reddit users recommend heat pumps over traditional HVAC for most of the state. Duke Energy offers rebates.',
      questionToAsk: 'Is a heat pump recommended for this area? What rebates are available from Duke Energy?',
      severity: 'info'
    },
    {
      topic: 'Radon in Mountain/Piedmont Areas',
      concern: 'Western and central NC have elevated radon risk',
      redditTakeaway: 'Mountain counties and parts of the piedmont have significant radon. Reddit users recommend testing before finishing basements or buying homes. Mitigation is effective and relatively affordable.',
      questionToAsk: 'Has radon testing been done? Should mitigation be considered for this project?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after hurricanes—out-of-state roofers with temporary licenses',
    'Unlicensed contractors claiming the $30,000 threshold means no license needed for your project',
    'Crawl space encapsulation upselling with scare tactics about mold',
    'Fake termite damage reports to sell unnecessary treatments',
    'HOA violation threats from contractors pressuring quick signatures'
  ],
  licensingNotes: 'North Carolina requires a General Contractor license for projects $30,000 and over—verify at nclbgc.org. Electrical, plumbing, and HVAC contractors need state licenses regardless of project size. Some counties and cities have additional registration requirements.'
};

// Michigan-specific insights
export const MICHIGAN_INSIGHTS: RegionalInsightsData = {
  stateName: 'Michigan',
  stateCode: 'MI',
  climate: 'Humid Continental with Lake Effect',
  overview: 'Michigan homeowners face harsh winters, significant lake effect snow in western and northern regions, and challenges with older housing stock in urban areas. The state requires residential builder licenses. Detroit and other cities have their own permit requirements. Energy efficiency is critical given heating costs.',
  insights: [
    {
      topic: 'State Builder Licensing',
      concern: 'Michigan requires a Residential Builder license for contractors',
      redditTakeaway: 'Michigan is one of the few states with statewide contractor licensing. Verify at michigan.gov/lara. Reddit users appreciate the accountability but note that some still operate without licenses—always verify.',
      questionToAsk: 'What is your Michigan Residential Builder license number? Can I verify it online?',
      severity: 'warning'
    },
    {
      topic: 'Lake Effect Snow & Ice Dams',
      concern: 'Western Michigan and UP face extreme lake effect snow',
      redditTakeaway: 'Grand Rapids, Traverse City, and UP areas get massive snow accumulation. Reddit users emphasize proper roof ventilation, ice/water shield, and heated gutters. Ice dams cause major interior damage if not prevented.',
      questionToAsk: 'What ice dam prevention is included? Is ice/water shield extended beyond code minimum?',
      severity: 'warning'
    },
    {
      topic: 'Basement Moisture & Waterproofing',
      concern: 'Michigan\'s clay soils and high water tables create basement moisture issues',
      redditTakeaway: 'Wet basements are extremely common. Reddit users recommend addressing exterior drainage first, then interior French drains and sump pumps. Battery backup sump pumps are essential—power outages during storms are common.',
      questionToAsk: 'What\'s causing the moisture? Will the system have battery backup for power outages?',
      severity: 'info'
    },
    {
      topic: 'Radon Testing',
      concern: 'Michigan has significant radon levels, especially in lower peninsula',
      redditTakeaway: 'Michigan DEQ recommends testing all homes. Reddit users advise testing before finishing basements. Mitigation is effective and typically costs $800-1500.',
      questionToAsk: 'Has radon testing been done? Should mitigation be included in this basement project?',
      severity: 'warning'
    },
    {
      topic: 'Detroit & Urban Home Challenges',
      concern: 'Detroit and other cities have older homes with deferred maintenance',
      redditTakeaway: 'Older Detroit homes often have outdated electrical, lead paint, and foundation issues. Reddit users recommend comprehensive inspections. The city has permit requirements but enforcement varies by neighborhood.',
      questionToAsk: 'What inspection findings should we address? What permits are required for this work?',
      severity: 'info'
    },
    {
      topic: 'Energy Efficiency & Heating Costs',
      concern: 'Michigan\'s cold winters make energy efficiency critical',
      redditTakeaway: 'Heating costs are substantial. Reddit users recommend insulation upgrades, air sealing, and high-efficiency furnaces. DTE and Consumers Energy offer rebates for efficiency improvements.',
      questionToAsk: 'What insulation level is specified? Are utility rebates available for this equipment?',
      severity: 'info'
    },
    {
      topic: 'Natural Gas vs. Propane',
      concern: 'Rural Michigan often relies on propane, which is more expensive than natural gas',
      redditTakeaway: 'Natural gas is available in cities but rural areas use propane or fuel oil. Reddit users in rural areas are increasingly considering geothermal or heat pumps to reduce propane costs.',
      questionToAsk: 'What are the operating costs for different fuel options? Is geothermal practical here?',
      severity: 'info'
    },
    {
      topic: 'Freeze-Thaw Foundation Damage',
      concern: 'Michigan\'s freeze-thaw cycles damage foundations and masonry',
      redditTakeaway: 'Block foundations in older homes are particularly vulnerable. Reddit users recommend proper drainage to prevent frost damage and using appropriate mortar for tuckpointing.',
      questionToAsk: 'How will drainage be improved? What foundation repairs are recommended?',
      severity: 'info'
    },
    {
      topic: 'Cottage & Up North Properties',
      concern: 'Northern Michigan and UP properties have unique considerations',
      redditTakeaway: 'Seasonal properties need winterization planning. Well and septic systems are common. Reddit users warn about contractor availability in remote areas—book early for summer work.',
      questionToAsk: 'How should this be prepared for winter? Are well/septic systems adequately sized?',
      severity: 'info'
    },
    {
      topic: 'Lead Paint in Older Homes',
      concern: 'Michigan has extensive pre-1978 housing with lead paint concerns',
      redditTakeaway: 'Michigan follows EPA RRP rules. Detroit has additional lead requirements for rental properties. Reddit recommends testing before renovation and using certified contractors.',
      questionToAsk: 'Are you EPA Lead-Safe certified? Will you test for lead before starting work?',
      severity: 'warning'
    }
  ],
  commonScams: [
    'Door-to-door roofers after storms with out-of-state plates',
    'Driveway sealcoating scams with diluted product',
    'Basement waterproofing high-pressure sales',
    'Unlicensed contractors claiming their license is "pending"',
    'Heating/cooling tune-up scams that claim repairs are needed'
  ],
  licensingNotes: 'Michigan requires a Residential Builder license for contractors working on homes—verify at michigan.gov/lara. Electrical, plumbing, and mechanical contractors also need state licenses. Local permits are required in most areas.'
};

// New Jersey-specific insights
export const NEW_JERSEY_INSIGHTS: RegionalInsightsData = {
  stateName: 'New Jersey',
  stateCode: 'NJ',
  climate: 'Humid Subtropical (south) to Humid Continental (north)',
  overview: 'New Jersey homeowners face high construction costs, extensive permit requirements, and challenges with older housing stock. The state requires Home Improvement Contractor registration. Shore properties face flood and hurricane concerns. Property taxes are the highest in the nation, making permit compliance crucial for resale.',
  insights: [
    {
      topic: 'Home Improvement Contractor Registration',
      concern: 'New Jersey requires HIC registration for all contractors',
      redditTakeaway: 'NJ contractors must be registered with Consumer Affairs—verify at njconsumeraffairs.gov. Registration numbers should appear on all contracts. Reddit users warn that unregistered contractors can\'t enforce contracts.',
      questionToAsk: 'What is your NJ HIC registration number? Can I verify it online?',
      severity: 'warning'
    },
    {
      topic: 'Extensive Permit Requirements',
      concern: 'NJ municipalities have strict permit requirements for most work',
      redditTakeaway: 'NJ requires permits for nearly everything—even fence replacement in some towns. Reddit users report that permit fees are high but unpermitted work creates major issues at sale. CO (certificate of occupancy) is required to close.',
      questionToAsk: 'What permits are required? Will this work require a new Certificate of Occupancy?',
      severity: 'warning'
    },
    {
      topic: 'Shore Property Flood Zones',
      concern: 'Jersey Shore properties face strict FEMA flood zone requirements',
      redditTakeaway: 'Post-Sandy regulations are strict. Many shore homes must be elevated if substantially improved. Reddit users recommend checking flood zone status and insurance requirements before any major work.',
      questionToAsk: 'Is this property in a flood zone? Could this project trigger elevation requirements?',
      severity: 'critical'
    },
    {
      topic: 'High Labor & Material Costs',
      concern: 'NJ has some of the highest construction costs in the US',
      redditTakeaway: 'Labor costs are 30-50% above national average. Reddit warns that lowball bids usually mean unlicensed workers or shortcuts. Get multiple bids but be suspicious of prices far below others.',
      questionToAsk: 'Does this bid include all licensed labor? Are there any additional costs not included?',
      severity: 'info'
    },
    {
      topic: 'Radon Testing',
      concern: 'Northern NJ has significant radon levels',
      redditTakeaway: 'NJ DEP recommends testing all homes. Radon is particularly high in Hunterdon, Somerset, and Morris counties. Reddit users recommend testing before basement finishing.',
      questionToAsk: 'Has radon testing been done? Should mitigation be included in this project?',
      severity: 'warning'
    },
    {
      topic: 'Underground Oil Tanks',
      concern: 'Many NJ homes have buried oil tanks that create liability',
      redditTakeaway: 'Underground oil tanks are common in NJ and create significant environmental liability. Leaking tanks can cost $20,000+ to remediate. Reddit strongly recommends tank sweeps before buying and decommissioning known tanks.',
      questionToAsk: 'Has an oil tank sweep been done? Should we investigate or decommission any tanks?',
      severity: 'warning'
    },
    {
      topic: 'Historic District Rules',
      concern: 'Many NJ towns have historic preservation requirements',
      redditTakeaway: 'Princeton, Morristown, Cape May, and many others have historic commissions. Exterior changes may need approval. Reddit users recommend checking before planning visible work.',
      questionToAsk: 'Is this property in a historic district? What approvals are needed?',
      severity: 'info'
    },
    {
      topic: 'Termites & Carpenter Bees',
      concern: 'NJ has termite and wood-boring insect pressure',
      redditTakeaway: 'Subterranean termites are common in NJ. Carpenter bees damage wooden siding and trim. Reddit users recommend termite inspections before major renovations and treatment plans.',
      questionToAsk: 'Has a termite inspection been done? What preventive measures are included?',
      severity: 'info'
    },
    {
      topic: 'Energy Efficiency Rebates',
      concern: 'NJ offers significant rebates for energy-efficient upgrades',
      redditTakeaway: 'NJ Clean Energy Program offers rebates for HVAC, insulation, and appliances. Reddit users recommend checking njcleanenergy.com before purchasing equipment—rebates can be substantial.',
      questionToAsk: 'What NJ Clean Energy rebates are available? Will you help with rebate paperwork?',
      severity: 'info'
    },
    {
      topic: 'Property Tax Implications',
      concern: 'NJ has the highest property taxes in the US—renovations can trigger reassessment',
      redditTakeaway: 'Major renovations, especially additions, often trigger tax reassessment. Reddit users recommend understanding the tax implications before expanding square footage. Permits are reported to tax assessors.',
      questionToAsk: 'How might this project affect my property tax assessment?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Unregistered contractors claiming HIC registration isn\'t needed for "small jobs"',
    'Storm damage roofers at the shore after hurricanes',
    'Oil tank removal companies that don\'t properly close permits',
    'Contractors who pull permits but skip inspections',
    'Basement waterproofing with lifetime warranties from companies that dissolve'
  ],
  licensingNotes: 'New Jersey requires Home Improvement Contractor (HIC) registration—verify at njconsumeraffairs.gov. The registration number must appear on all contracts. Electricians, plumbers, and HVAC contractors need state licenses. All municipalities require permits and inspections.'
};

// Arizona-specific insights
export const ARIZONA_INSIGHTS: RegionalInsightsData = {
  stateName: 'Arizona',
  stateCode: 'AZ',
  climate: 'Hot Desert (south) to Semi-Arid (north)',
  overview: 'Arizona homeowners face extreme heat, monsoon storms, and unique desert construction challenges. The Arizona Registrar of Contractors (ROC) requires licensing for all contractors. Cooling costs dominate energy bills, and proper insulation and HVAC sizing are critical. Termites, particularly subterranean and drywood varieties, are a significant concern.',
  insights: [
    {
      topic: 'ROC Contractor Licensing',
      concern: 'Arizona requires all contractors to be licensed with the Registrar of Contractors',
      redditTakeaway: 'Arizona ROC licensing is strict and verifiable at roc.az.gov. Reddit users appreciate the accountability—you can file complaints and check disciplinary history. Always verify the license matches the work type.',
      questionToAsk: 'What is your Arizona ROC license number? Is it the correct classification for this work?',
      severity: 'warning'
    },
    {
      topic: 'Extreme Heat & HVAC Sizing',
      concern: 'Phoenix regularly exceeds 110°F—proper HVAC is critical',
      redditTakeaway: 'Undersized AC units fail during peak summer. Reddit users strongly recommend Manual J calculations and oversizing slightly for extreme heat days. Two-stage or variable-speed units handle the load better.',
      questionToAsk: 'Will you perform a Manual J calculation? What SEER rating and tonnage is specified?',
      severity: 'critical'
    },
    {
      topic: 'Roof Heat & Cool Roofs',
      concern: 'Roofs absorb extreme heat, dramatically affecting cooling costs',
      redditTakeaway: 'Tile roofs are traditional but foam roofing reflects more heat. Reddit users recommend light-colored or reflective roofing materials. Radiant barriers in the attic make a significant difference.',
      questionToAsk: 'What roofing material will minimize heat absorption? Is a radiant barrier included?',
      severity: 'info'
    },
    {
      topic: 'Monsoon Storm Damage',
      concern: 'Summer monsoons bring flash floods, high winds, and dust storms',
      redditTakeaway: 'Monsoon season (July-September) causes significant damage annually. Reddit warns about storm chasers appearing after major storms. Proper drainage and roof tie-downs are essential.',
      questionToAsk: 'How will drainage handle monsoon flooding? Are roof components rated for high winds?',
      severity: 'warning'
    },
    {
      topic: 'Termite Prevention',
      concern: 'Arizona has severe termite pressure, especially subterranean termites',
      redditTakeaway: 'Termites are inevitable in Arizona—prevention is key. Reddit recommends pre-treatment during construction, regular inspections, and avoiding wood-to-soil contact. Many homes have active termite bonds.',
      questionToAsk: 'What termite prevention measures are included? Is there an existing termite bond?',
      severity: 'warning'
    },
    {
      topic: 'Pool Equipment & Maintenance',
      concern: 'Arizona has the highest pool density in the US—equipment matters',
      redditTakeaway: 'Pool equipment runs hard in Arizona heat. Variable-speed pumps save significant energy. Reddit users recommend oversized pumps and filters for the extreme conditions.',
      questionToAsk: 'Is a variable-speed pump included? What warranty comes with the equipment?',
      severity: 'info'
    },
    {
      topic: 'Stucco & Exterior Maintenance',
      concern: 'Stucco is ubiquitous but requires maintenance in the desert climate',
      redditTakeaway: 'Sun damage causes stucco to crack and fade. Reddit recommends elastomeric paint for longer-lasting protection. Proper patching before painting prevents water intrusion during monsoons.',
      questionToAsk: 'What type of stucco repair and paint is specified? How long is the warranty?',
      severity: 'info'
    },
    {
      topic: 'HOA & CC&R Restrictions',
      concern: 'Arizona has extensive HOA communities with strict architectural rules',
      redditTakeaway: 'Most Phoenix metro subdivisions have HOAs. Reddit warns to get architectural approval before signing contracts—color, materials, and design all need approval.',
      questionToAsk: 'Have you reviewed the HOA guidelines? Do we need architectural committee approval?',
      severity: 'info'
    },
    {
      topic: 'Water Heater Placement',
      concern: 'Garage water heaters work hard in extreme heat',
      redditTakeaway: 'Water heaters in unconditioned garages face 140°F+ ambient temps. Reddit users recommend tankless units or moving the heater inside. Insulation blankets help traditional tanks.',
      questionToAsk: 'Where will the water heater be located? Is tankless an option to consider?',
      severity: 'info'
    },
    {
      topic: 'Permits & Inspections',
      concern: 'Arizona municipalities have varying permit requirements',
      redditTakeaway: 'Phoenix, Scottsdale, and Tucson all have different processes. Reddit users note that permits are required for most work but enforcement varies. Unpermitted work can affect home sales.',
      questionToAsk: 'What permits are required? Who handles the permit process and inspections?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after monsoon damage offering quick roof repairs',
    'Door-to-door AC repair scams during heat waves',
    'Pool equipment "emergency" repairs that aren\'t emergencies',
    'Unlicensed handymen doing work that requires ROC licensing',
    'Landscaping crews damaging stucco and offering cheap repairs'
  ],
  licensingNotes: 'Arizona requires all contractors to be licensed with the Registrar of Contractors (ROC)—verify at roc.az.gov. License classifications are specific to work types. Electrical, plumbing, and HVAC have separate license requirements. The ROC handles complaints and has strong consumer protection.'
};

// Colorado-specific insights
export const COLORADO_INSIGHTS: RegionalInsightsData = {
  stateName: 'Colorado',
  stateCode: 'CO',
  climate: 'Semi-Arid Continental with High Altitude',
  overview: 'Colorado homeowners face unique high-altitude construction challenges, extreme temperature swings, and wildfire concerns in mountain communities. The state has limited contractor licensing, making homeowner due diligence critical. The thin, dry air and intense UV radiation affect materials differently than at sea level.',
  insights: [
    {
      topic: 'No Statewide Contractor License',
      concern: 'Colorado has no statewide general contractor licensing requirement',
      redditTakeaway: 'Colorado doesn\'t license general contractors at the state level. Denver and some cities have local requirements. Reddit strongly emphasizes checking insurance, references, and BBB ratings since there\'s no state verification.',
      questionToAsk: 'Are you registered in this city/county? Can you provide proof of liability insurance and workers\' comp?',
      severity: 'warning'
    },
    {
      topic: 'High Altitude Construction',
      concern: 'Altitude affects everything from concrete curing to appliance performance',
      redditTakeaway: 'At altitude, concrete cures differently, water boils at lower temps, and combustion appliances need adjustment. Reddit users recommend contractors experienced with mountain building. HVAC and water heaters need altitude kits.',
      questionToAsk: 'Do you have experience building at this altitude? Are appliances rated for high altitude?',
      severity: 'warning'
    },
    {
      topic: 'Wildfire Defensible Space',
      concern: 'Mountain and foothill properties face serious wildfire risk',
      redditTakeaway: 'Colorado has strict defensible space requirements in WUI (wildland-urban interface) zones. Reddit recommends fire-resistant siding, Class A roofing, and ember-resistant vents. Insurance may be difficult without compliance.',
      questionToAsk: 'Are materials fire-resistant rated? Does this meet defensible space requirements?',
      severity: 'critical'
    },
    {
      topic: 'Foundation Heaving & Expansive Soil',
      concern: 'Colorado\'s clay soils expand and contract dramatically',
      redditTakeaway: 'Bentonite clay causes significant foundation movement along the Front Range. Reddit users recommend structural engineers for foundation work and proper drainage to manage soil moisture.',
      questionToAsk: 'Has a soils report been done? What foundation system handles expansive soil?',
      severity: 'warning'
    },
    {
      topic: 'Extreme Temperature Swings',
      concern: 'Colorado can see 50°F temperature changes in a single day',
      redditTakeaway: 'Materials expand and contract dramatically. Reddit recommends high-quality caulking, proper flashing, and materials rated for temperature extremes. Roof and siding failures are common with cheap materials.',
      questionToAsk: 'Are materials rated for extreme temperature variation? What expansion/contraction allowances are made?',
      severity: 'info'
    },
    {
      topic: 'UV Damage at Altitude',
      concern: 'Intense UV radiation degrades materials faster at altitude',
      redditTakeaway: 'Roofing, siding, and deck materials fade and degrade faster in Colorado\'s intense sun. Reddit recommends UV-resistant materials and more frequent maintenance schedules.',
      questionToAsk: 'Are these materials UV-resistant? What is the expected lifespan at this altitude?',
      severity: 'info'
    },
    {
      topic: 'Radon Testing',
      concern: 'Colorado has significant radon levels throughout the state',
      redditTakeaway: 'Colorado has some of the highest radon levels in the country. Reddit strongly recommends testing before any basement finishing and mitigation if levels exceed 4 pCi/L.',
      questionToAsk: 'Has radon testing been done? Should mitigation be included in this project?',
      severity: 'warning'
    },
    {
      topic: 'Snow Load & Ice Dams',
      concern: 'Mountain properties face heavy snow loads and ice dam potential',
      redditTakeaway: 'Roof structures must handle significant snow loads. Ice dams form when heat escapes through the roof. Reddit recommends proper ventilation, insulation, and ice/water shield.',
      questionToAsk: 'What snow load is the roof rated for? What ice dam prevention is included?',
      severity: 'info'
    },
    {
      topic: 'Water Rights & Well Issues',
      concern: 'Colorado water law is complex—wells and irrigation have restrictions',
      redditTakeaway: 'Water rights in Colorado are complicated. Reddit warns that not all properties can have wells, and landscaping irrigation may have restrictions. Verify water availability before buying rural property.',
      questionToAsk: 'What is the water source? Are there any restrictions on water use?',
      severity: 'info'
    },
    {
      topic: 'Energy Rebates & Solar',
      concern: 'Colorado offers significant energy efficiency and solar incentives',
      redditTakeaway: 'Xcel Energy and other utilities offer rebates for efficiency upgrades. Colorado\'s sun makes solar attractive. Reddit recommends checking energysmartcolorado.com for available programs.',
      questionToAsk: 'What utility rebates are available? Is solar a good option for this property?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after hail storms—Colorado gets severe hail',
    'Wildfire remediation scams in burn areas',
    'Unlicensed contractors claiming no license is needed (technically true but risky)',
    'Foundation repair scare tactics about expansive soil',
    'Solar installers with unrealistic production estimates'
  ],
  licensingNotes: 'Colorado has no statewide general contractor license. Denver, Boulder, Colorado Springs, and other cities have local registration requirements. Electricians and plumbers need state licenses. Always verify insurance and workers\' comp coverage—this is your main protection.'
};

// Washington-specific insights
export const WASHINGTON_INSIGHTS: RegionalInsightsData = {
  stateName: 'Washington',
  stateCode: 'WA',
  climate: 'Marine West Coast (west) to Semi-Arid (east)',
  overview: 'Washington homeowners face dramatically different conditions depending on location—wet and mild west of the Cascades, dry and extreme east of the mountains. The state requires contractor registration with L&I. Moisture management is critical in western Washington, while eastern areas deal with extreme temperature swings.',
  insights: [
    {
      topic: 'Contractor Registration Required',
      concern: 'Washington requires all contractors to register with L&I',
      redditTakeaway: 'Washington contractors must be registered with Labor & Industries—verify at lni.wa.gov. Registration includes a surety bond. Reddit users appreciate that you can check complaint history online.',
      questionToAsk: 'What is your Washington contractor registration number? Can I verify it with L&I?',
      severity: 'warning'
    },
    {
      topic: 'Moisture & Mold Prevention',
      concern: 'Western Washington\'s wet climate creates significant moisture challenges',
      redditTakeaway: 'Seattle area gets 150+ days of rain. Reddit strongly emphasizes proper flashing, ventilation, and vapor barriers. Mold remediation is expensive—prevention is essential.',
      questionToAsk: 'What moisture prevention measures are included? How is ventilation addressed?',
      severity: 'critical'
    },
    {
      topic: 'Seismic Considerations',
      concern: 'Washington faces significant earthquake risk, especially near Puget Sound',
      redditTakeaway: 'The Cascadia Subduction Zone poses major risk. Reddit recommends seismic retrofitting for older homes, especially those with cripple walls or unreinforced masonry.',
      questionToAsk: 'Does this meet current seismic codes? Should seismic retrofitting be considered?',
      severity: 'warning'
    },
    {
      topic: 'Energy Code Requirements',
      concern: 'Washington has strict energy codes that exceed national standards',
      redditTakeaway: 'Washington energy code requires high insulation values and air sealing. Reddit users note that meeting code adds cost but significantly reduces heating bills.',
      questionToAsk: 'Does this meet Washington energy code? What insulation R-values are specified?',
      severity: 'info'
    },
    {
      topic: 'Roof & Moss Prevention',
      concern: 'Western Washington\'s wet climate promotes moss and algae growth on roofs',
      redditTakeaway: 'Moss damages roofing materials over time. Reddit recommends zinc or copper strips at the ridge, regular cleaning, and algae-resistant shingles.',
      questionToAsk: 'Are algae-resistant shingles specified? What moss prevention is included?',
      severity: 'info'
    },
    {
      topic: 'Crawl Space Moisture',
      concern: 'Crawl spaces in western Washington are prone to moisture problems',
      redditTakeaway: 'Vented crawl spaces don\'t work well in the wet climate. Reddit increasingly recommends sealed, conditioned crawl spaces with vapor barriers and dehumidification.',
      questionToAsk: 'What type of crawl space system do you recommend? Will it be sealed or vented?',
      severity: 'warning'
    },
    {
      topic: 'East vs. West Climate',
      concern: 'Eastern Washington has completely different conditions than Seattle',
      redditTakeaway: 'Spokane, Tri-Cities, and Yakima face extreme temperature swings, not moisture. Reddit users emphasize using contractors familiar with the specific region—western Washington experience doesn\'t translate.',
      questionToAsk: 'Do you have experience in this specific region of Washington?',
      severity: 'info'
    },
    {
      topic: 'Permit Requirements',
      concern: 'Washington cities have strict permit requirements',
      redditTakeaway: 'Seattle is particularly strict with extensive permit requirements. Reddit users note that unpermitted work creates major problems at sale. King County requires permits for most projects.',
      questionToAsk: 'What permits are required for this project? Who handles the permit process?',
      severity: 'info'
    },
    {
      topic: 'Heat Pump Climate',
      concern: 'Western Washington\'s mild climate is ideal for heat pumps',
      redditTakeaway: 'The mild marine climate makes heat pumps highly efficient. Reddit users increasingly recommend mini-splits or ducted heat pumps. Utility rebates are often available.',
      questionToAsk: 'Is a heat pump recommended? What utility rebates are available?',
      severity: 'info'
    },
    {
      topic: 'ADU & DADU Regulations',
      concern: 'Washington has liberalized ADU (accessory dwelling unit) rules',
      redditTakeaway: 'Seattle and other cities now allow ADUs and DADUs (detached ADUs) on most residential lots. Reddit notes that ADUs are popular for rental income but permitting is still complex.',
      questionToAsk: 'Does this ADU meet current zoning requirements? What permits are required?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Moss removal services that damage roofing',
    'Storm damage roofers after windstorms',
    'Foundation repair scare tactics',
    'Unlicensed contractors claiming L&I registration isn\'t required',
    'Energy audit upselling with inflated claims'
  ],
  licensingNotes: 'Washington requires all contractors to be registered with Labor & Industries (L&I)—verify at lni.wa.gov. Registration includes a surety bond for consumer protection. Electrical work requires a separate L&I electrical contractor license. Permits are required in most jurisdictions.'
};

// Virginia-specific insights
export const VIRGINIA_INSIGHTS: RegionalInsightsData = {
  stateName: 'Virginia',
  stateCode: 'VA',
  climate: 'Humid Subtropical',
  overview: 'Virginia homeowners face humidity challenges, diverse geography from the coast to the mountains, and significant older housing stock in historic areas. The state requires contractor licensing through DPOR. Northern Virginia has high construction costs and strict county requirements, while coastal areas face hurricane and flood concerns.',
  insights: [
    {
      topic: 'State Contractor Licensing',
      concern: 'Virginia requires contractors to be licensed through DPOR',
      redditTakeaway: 'Virginia Department of Professional and Occupational Regulation (DPOR) licenses contractors—verify at dpor.virginia.gov. Class A is required for projects over $120,000; Class B for $10,000-$120,000; Class C for under $10,000.',
      questionToAsk: 'What class is your Virginia contractor license? Can I verify it online?',
      severity: 'warning'
    },
    {
      topic: 'Humidity & Moisture Management',
      concern: 'Virginia\'s humid climate creates moisture challenges throughout the year',
      redditTakeaway: 'Humidity runs high from May through September. Reddit emphasizes proper ventilation, dehumidification in basements and crawl spaces, and moisture-resistant materials.',
      questionToAsk: 'How will moisture be controlled? Is dehumidification included?',
      severity: 'warning'
    },
    {
      topic: 'Northern Virginia Costs',
      concern: 'NoVA (Fairfax, Arlington, Loudoun) has very high construction costs',
      redditTakeaway: 'Labor and material costs in NoVA are 30-40% above state averages. Reddit warns that lowball bids usually mean unlicensed labor. Permit requirements in Fairfax County are extensive.',
      questionToAsk: 'Does this bid reflect NoVA labor rates? Are all workers properly licensed?',
      severity: 'info'
    },
    {
      topic: 'Historic District Restrictions',
      concern: 'Virginia has numerous historic districts with exterior renovation rules',
      redditTakeaway: 'Alexandria, Richmond\'s Fan District, Williamsburg, and many others have architectural review requirements. Reddit recommends checking historic commission rules before planning visible exterior work.',
      questionToAsk: 'Is this property in a historic district? What approvals are required?',
      severity: 'info'
    },
    {
      topic: 'Coastal Flood Zones',
      concern: 'Virginia Beach, Norfolk, and Hampton Roads face significant flood risk',
      redditTakeaway: 'Coastal Virginia deals with both hurricane flooding and chronic tidal flooding. FEMA flood zone designation affects insurance and renovation requirements. Reddit recommends checking flood history before major investments.',
      questionToAsk: 'Is this property in a flood zone? What flood-resistant features should be included?',
      severity: 'critical'
    },
    {
      topic: 'Crawl Space Encapsulation',
      concern: 'Virginia\'s humidity makes crawl space moisture a common issue',
      redditTakeaway: 'Vented crawl spaces struggle with Virginia humidity. Reddit increasingly recommends sealed, encapsulated crawl spaces with dehumidification or conditioning.',
      questionToAsk: 'What crawl space system do you recommend? Will it be sealed and conditioned?',
      severity: 'info'
    },
    {
      topic: 'Radon in Piedmont & Mountains',
      concern: 'Central and western Virginia have elevated radon risk',
      redditTakeaway: 'The Virginia Department of Health recommends testing all homes. Radon is particularly high in the piedmont and mountain regions. Test before finishing basements.',
      questionToAsk: 'Has radon testing been done? Should mitigation be included?',
      severity: 'warning'
    },
    {
      topic: 'Hurricane Preparedness (Coastal)',
      concern: 'Coastal Virginia is vulnerable to hurricane damage',
      redditTakeaway: 'Hampton Roads sees regular hurricane impacts. Reddit recommends impact-resistant windows or shutters, proper roof tie-downs, and wind-rated garage doors.',
      questionToAsk: 'What wind-resistant features are included? Are materials hurricane-rated?',
      severity: 'warning'
    },
    {
      topic: 'HOA Communities',
      concern: 'Virginia has extensive HOA communities with strict rules',
      redditTakeaway: 'Northern Virginia and suburban developments have active HOAs. Reddit warns to get architectural approval before signing contracts. Review CC&Rs carefully.',
      questionToAsk: 'Have you reviewed the HOA architectural guidelines? Do we need approval first?',
      severity: 'info'
    },
    {
      topic: 'Energy Rebates',
      concern: 'Virginia utilities offer various energy efficiency rebates',
      redditTakeaway: 'Dominion Energy and Appalachian Power offer rebates for HVAC, insulation, and efficiency upgrades. Reddit recommends checking before purchasing equipment.',
      questionToAsk: 'What utility rebates are available for this project? Will you help with applications?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after hurricanes in coastal areas',
    'Crawl space encapsulation scare tactics with inflated mold concerns',
    'Unlicensed contractors claiming Class C work doesn\'t need a license',
    'Foundation repair upselling in areas with clay soil',
    'Historic district violations from contractors unfamiliar with rules'
  ],
  licensingNotes: 'Virginia requires contractor licensing through DPOR—verify at dpor.virginia.gov. Class A ($120,000+), Class B ($10,000-$120,000), and Class C (under $10,000) have different requirements. Electricians, plumbers, and HVAC contractors need separate trade licenses. Permits are required throughout the state.'
};

// Massachusetts-specific insights
export const MASSACHUSETTS_INSIGHTS: RegionalInsightsData = {
  stateName: 'Massachusetts',
  stateCode: 'MA',
  climate: 'Humid Continental',
  overview: 'Massachusetts homeowners face harsh winters, significant older housing stock, and some of the highest construction costs in the country. The state requires contractor registration for home improvement work. Boston and historic communities have strict permitting and preservation requirements. Lead paint and asbestos are common in older homes.',
  insights: [
    {
      topic: 'Home Improvement Contractor Registration',
      concern: 'Massachusetts requires HIC registration for contractors',
      redditTakeaway: 'Massachusetts Home Improvement Contractor (HIC) registration is required—verify at mass.gov. Contractors must also carry insurance. Reddit users emphasize checking that the registration is current.',
      questionToAsk: 'What is your Massachusetts HIC registration number? Is it current?',
      severity: 'warning'
    },
    {
      topic: 'High Construction Costs',
      concern: 'Boston area has among the highest construction costs nationally',
      redditTakeaway: 'Labor costs in Greater Boston are 40-50% above national average. Reddit warns that very low bids often mean unlicensed workers or shortcuts. Get multiple bids but be realistic about pricing.',
      questionToAsk: 'Does this bid reflect Massachusetts labor rates? Are all workers properly licensed?',
      severity: 'info'
    },
    {
      topic: 'Lead Paint in Older Homes',
      concern: 'Massachusetts has extensive pre-1978 housing with lead paint',
      redditTakeaway: 'Massachusetts has strict lead paint laws, especially for rental properties. EPA RRP rules apply, and Massachusetts has additional requirements. Reddit strongly recommends testing and certified contractors.',
      questionToAsk: 'Are you EPA Lead-Safe certified? Will you test for lead before disturbing surfaces?',
      severity: 'warning'
    },
    {
      topic: 'Asbestos Concerns',
      concern: 'Asbestos is common in older Massachusetts homes',
      redditTakeaway: 'Older homes often have asbestos in insulation, floor tiles, and siding. Reddit recommends testing before renovation. Professional abatement is required—DIY removal is illegal.',
      questionToAsk: 'Has asbestos testing been done? Who handles abatement if needed?',
      severity: 'warning'
    },
    {
      topic: 'Ice Dams & Winter Damage',
      concern: 'Massachusetts winters cause significant ice dam and freeze damage',
      redditTakeaway: 'Ice dams cause major interior damage. Reddit strongly recommends proper attic insulation and ventilation, plus ice/water shield extending well past the eaves. Heated cables are a band-aid, not a fix.',
      questionToAsk: 'What ice dam prevention is included? Is ice/water shield extended appropriately?',
      severity: 'warning'
    },
    {
      topic: 'Historic District Restrictions',
      concern: 'Many Massachusetts communities have historic preservation requirements',
      redditTakeaway: 'Boston neighborhoods, Cambridge, Salem, and many others have historic commissions. Exterior changes require approval. Reddit recommends checking before planning visible work.',
      questionToAsk: 'Is this property in a historic district? What approvals are required?',
      severity: 'info'
    },
    {
      topic: 'Boston Permits & ISD',
      concern: 'Boston Inspectional Services has strict permit requirements',
      redditTakeaway: 'Boston ISD requires permits for most work and has specific requirements for multi-family properties. Reddit notes that unpermitted work creates problems at sale—title issues are common.',
      questionToAsk: 'What permits are required? Who handles the permit process with ISD?',
      severity: 'info'
    },
    {
      topic: 'Oil to Gas Conversions',
      concern: 'Many Massachusetts homes still use oil heat',
      redditTakeaway: 'Oil heat is common but expensive. Reddit users increasingly recommend natural gas conversions or heat pumps. Mass Save offers significant rebates for efficiency upgrades.',
      questionToAsk: 'What heating options are available? What Mass Save rebates apply?',
      severity: 'info'
    },
    {
      topic: 'Basement Moisture & Waterproofing',
      concern: 'Massachusetts\' climate creates basement moisture challenges',
      redditTakeaway: 'Older homes often have fieldstone foundations prone to moisture. Reddit recommends addressing exterior drainage first, then interior systems. Full foundation replacement is sometimes needed for severe cases.',
      questionToAsk: 'What\'s causing the moisture? Is the foundation structurally sound?',
      severity: 'info'
    },
    {
      topic: 'Mass Save Energy Rebates',
      concern: 'Massachusetts offers substantial energy efficiency rebates',
      redditTakeaway: 'Mass Save (sponsored by utilities) offers free energy audits and significant rebates for insulation, HVAC, and appliances. Reddit strongly recommends getting an audit before major work.',
      questionToAsk: 'Have you scheduled a Mass Save audit? What rebates are available for this project?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after nor\'easters',
    'Asbestos/mold scare tactics to upsell unnecessary work',
    'Unregistered contractors claiming HIC doesn\'t apply to their work',
    'Lead paint violations from contractors unfamiliar with MA requirements',
    'Oil tank removal companies that don\'t properly close permits'
  ],
  licensingNotes: 'Massachusetts requires Home Improvement Contractor (HIC) registration—verify at mass.gov. Construction Supervisor Licenses are required for new construction and major alterations. Electricians, plumbers, and gas fitters need state licenses. Boston has additional ISD requirements.'
};

// Tennessee-specific insights
export const TENNESSEE_INSIGHTS: RegionalInsightsData = {
  stateName: 'Tennessee',
  stateCode: 'TN',
  climate: 'Humid Subtropical',
  overview: 'Tennessee homeowners face humidity challenges, termite pressure, and occasional severe weather. The state requires contractor licensing for projects over $25,000. Nashville and Memphis have experienced rapid growth with associated construction quality concerns. The varied geography from mountains to delta creates regional differences.',
  insights: [
    {
      topic: 'State Contractor Licensing',
      concern: 'Tennessee requires licensing for contractors on projects over $25,000',
      redditTakeaway: 'Tennessee Board for Licensing Contractors requires licensing for projects exceeding $25,000—verify at tn.gov/commerce. Below that threshold, no state license is required but local rules may apply.',
      questionToAsk: 'What is your Tennessee contractor license number? Can I verify it online?',
      severity: 'warning'
    },
    {
      topic: 'Humidity & Moisture Control',
      concern: 'Tennessee\'s humid climate creates year-round moisture challenges',
      redditTakeaway: 'High humidity from May through September causes mold and moisture issues. Reddit emphasizes proper ventilation, dehumidification in crawl spaces and basements, and moisture-resistant materials.',
      questionToAsk: 'How will moisture be controlled? Is dehumidification included?',
      severity: 'warning'
    },
    {
      topic: 'Termites & Pest Pressure',
      concern: 'Tennessee has significant termite and pest pressure',
      redditTakeaway: 'Subterranean termites are prevalent throughout Tennessee. Reddit recommends pre-treatment for new construction, regular inspections, and maintaining termite bonds on existing homes.',
      questionToAsk: 'What termite prevention measures are included? Is there an existing termite bond?',
      severity: 'warning'
    },
    {
      topic: 'Crawl Space Moisture',
      concern: 'Crawl spaces are common in Tennessee and prone to moisture',
      redditTakeaway: 'Traditional vented crawl spaces don\'t work well in Tennessee humidity. Reddit increasingly recommends encapsulated crawl spaces with vapor barriers and dehumidification.',
      questionToAsk: 'What crawl space system do you recommend? Will it be encapsulated?',
      severity: 'info'
    },
    {
      topic: 'Nashville/Memphis Growth Areas',
      concern: 'Rapid growth has led to construction quality concerns',
      redditTakeaway: 'Nashville and Memphis suburbs have seen rapid development. Reddit warns about rushed construction and inexperienced crews. Inspect new construction carefully before closing.',
      questionToAsk: 'How long have you been working in this area? Can you provide recent local references?',
      severity: 'info'
    },
    {
      topic: 'Severe Weather & Tornadoes',
      concern: 'Tennessee experiences tornadoes and severe storms',
      redditTakeaway: 'Middle Tennessee is particularly tornado-prone. Reddit recommends safe rooms, proper roof tie-downs, and impact-resistant materials for those in high-risk areas.',
      questionToAsk: 'Are materials rated for high winds? Should a safe room be considered?',
      severity: 'info'
    },
    {
      topic: 'HVAC Sizing for Humidity',
      concern: 'HVAC systems must handle both cooling and dehumidification',
      redditTakeaway: 'Oversized AC units cool quickly but don\'t dehumidify properly. Reddit recommends proper Manual J calculations and considers two-stage or variable-speed systems.',
      questionToAsk: 'Will you perform a Manual J calculation? Is a variable-speed system recommended?',
      severity: 'info'
    },
    {
      topic: 'Radon in East Tennessee',
      concern: 'Eastern Tennessee has elevated radon risk',
      redditTakeaway: 'The Knoxville area and East Tennessee have significant radon levels. Reddit recommends testing before basement finishing. Mitigation is effective and affordable.',
      questionToAsk: 'Has radon testing been done? Should mitigation be included?',
      severity: 'info'
    },
    {
      topic: 'Permit Requirements Vary',
      concern: 'Permit requirements vary significantly across Tennessee',
      redditTakeaway: 'Nashville/Davidson County has strict requirements; rural areas may have minimal oversight. Reddit recommends checking local requirements—unpermitted work affects resale.',
      questionToAsk: 'What permits are required locally? Who handles the permit process?',
      severity: 'info'
    },
    {
      topic: 'Historic Neighborhoods',
      concern: 'Nashville, Memphis, and Chattanooga have historic preservation areas',
      redditTakeaway: 'East Nashville, Germantown, and other areas have historic overlay requirements. Reddit recommends checking before planning exterior changes.',
      questionToAsk: 'Is this property in a historic overlay? What approvals are needed?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after tornado and hail damage',
    'Unlicensed contractors claiming the $25,000 threshold doesn\'t apply',
    'Crawl space encapsulation high-pressure sales',
    'New construction warranty issues from builders who\'ve left the area',
    'HVAC companies claiming systems need replacement when they don\'t'
  ],
  licensingNotes: 'Tennessee requires contractor licensing for projects over $25,000—verify at tn.gov/commerce. Electrical, plumbing, and HVAC contractors need state licenses regardless of project size. Local permits vary significantly—Nashville/Davidson County has extensive requirements.'
};

// Indiana-specific insights
export const INDIANA_INSIGHTS: RegionalInsightsData = {
  stateName: 'Indiana',
  stateCode: 'IN',
  climate: 'Humid Continental',
  overview: 'Indiana homeowners face significant temperature swings, basement moisture issues, and challenges with older housing stock. The state has no general contractor licensing requirement, making homeowner due diligence critical. Radon is a significant concern throughout the state.',
  insights: [
    {
      topic: 'No Statewide Contractor License',
      concern: 'Indiana has no statewide general contractor licensing requirement',
      redditTakeaway: 'Indiana doesn\'t require GC licenses at the state level. Some cities like Indianapolis have local registration. Reddit strongly emphasizes checking insurance, references, and BBB ratings.',
      questionToAsk: 'Are you registered locally if required? Can you provide proof of liability insurance and workers\' comp?',
      severity: 'warning'
    },
    {
      topic: 'Radon Testing',
      concern: 'Indiana has significant radon levels throughout the state',
      redditTakeaway: 'Indiana ranks among the highest for radon. Reddit strongly recommends testing before basement finishing or home purchase. Mitigation is effective and typically costs $800-1500.',
      questionToAsk: 'Has radon testing been done? Should mitigation be included in this project?',
      severity: 'warning'
    },
    {
      topic: 'Basement Moisture & Waterproofing',
      concern: 'Indiana\'s clay soils and water table create common basement issues',
      redditTakeaway: 'Wet basements are extremely common. Reddit recommends addressing exterior drainage first, then interior French drains and sump pumps. Battery backup pumps are essential for power outages.',
      questionToAsk: 'What\'s causing the moisture? Will the system have battery backup?',
      severity: 'info'
    },
    {
      topic: 'Temperature Extremes',
      concern: 'Indiana experiences both severe cold and hot, humid summers',
      redditTakeaway: 'Temperature swings from -10°F to 95°F stress materials and HVAC systems. Reddit recommends quality insulation, proper air sealing, and HVAC systems rated for extreme conditions.',
      questionToAsk: 'What insulation levels are specified? Is the HVAC system rated for our temperature range?',
      severity: 'info'
    },
    {
      topic: 'Ice Dams & Winter Damage',
      concern: 'Northern Indiana faces significant ice dam potential',
      redditTakeaway: 'Ice dams cause interior water damage. Reddit recommends proper attic ventilation and insulation, plus ice/water shield on roof edges. Prevention is more effective than heated cables.',
      questionToAsk: 'What ice dam prevention is included? Is attic ventilation adequate?',
      severity: 'info'
    },
    {
      topic: 'Older Home Challenges',
      concern: 'Many Indiana cities have aging housing stock',
      redditTakeaway: 'Indianapolis, Fort Wayne, and other cities have many pre-1950 homes. Reddit recommends inspecting for outdated electrical, lead paint, and foundation issues before major renovations.',
      questionToAsk: 'What condition is the existing infrastructure? Should we address underlying issues first?',
      severity: 'info'
    },
    {
      topic: 'Energy Efficiency Rebates',
      concern: 'Indiana utilities offer various efficiency rebates',
      redditTakeaway: 'Duke Energy, Vectren, and other utilities offer rebates for HVAC and efficiency upgrades. Reddit recommends checking before purchasing equipment.',
      questionToAsk: 'What utility rebates are available? Will you help with rebate applications?',
      severity: 'info'
    },
    {
      topic: 'Permit Requirements Vary',
      concern: 'Permit requirements vary across Indiana municipalities',
      redditTakeaway: 'Indianapolis/Marion County has specific requirements; rural areas may have minimal oversight. Reddit recommends checking local rules—unpermitted work affects resale.',
      questionToAsk: 'What permits are required? Who handles the permit process?',
      severity: 'info'
    },
    {
      topic: 'Historic Districts',
      concern: 'Indianapolis and other cities have historic preservation areas',
      redditTakeaway: 'Lockerbie Square, Woodruff Place, and other areas have historic restrictions. Reddit recommends checking before planning exterior changes.',
      questionToAsk: 'Is this in a historic district? What approvals are needed?',
      severity: 'info'
    },
    {
      topic: 'Storm Damage',
      concern: 'Indiana experiences severe storms and occasional tornadoes',
      redditTakeaway: 'Severe thunderstorms and occasional tornadoes cause damage. Reddit warns about storm chasers and recommends using local contractors with verifiable history.',
      questionToAsk: 'Are materials wind-rated? How long have you been working in this area?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after severe weather',
    'Basement waterproofing high-pressure sales with scare tactics',
    'Unlicensed contractors with no accountability',
    'Roofing companies that disappear after collecting deposits',
    'HVAC tune-up scams claiming equipment needs replacement'
  ],
  licensingNotes: 'Indiana has no statewide general contractor license. Indianapolis and some other cities have local registration. Electricians and plumbers need state licenses. Always verify insurance and workers\' comp—this is your main protection.'
};

// Missouri-specific insights
export const MISSOURI_INSIGHTS: RegionalInsightsData = {
  stateName: 'Missouri',
  stateCode: 'MO',
  climate: 'Humid Continental (north) to Humid Subtropical (south)',
  overview: 'Missouri homeowners face humid summers, cold winters, and significant radon risk. The state has no general contractor licensing, though St. Louis and Kansas City have local requirements. Basement moisture and foundation issues from clay soils are common concerns.',
  insights: [
    {
      topic: 'No Statewide Contractor License',
      concern: 'Missouri has no statewide general contractor licensing requirement',
      redditTakeaway: 'Missouri doesn\'t require GC licenses at the state level. St. Louis and Kansas City have local licensing. Reddit strongly emphasizes checking insurance, references, and contractor history.',
      questionToAsk: 'Are you licensed locally if required? Can you provide proof of insurance and workers\' comp?',
      severity: 'warning'
    },
    {
      topic: 'Radon Testing',
      concern: 'Missouri has significant radon levels, especially in the Ozarks',
      redditTakeaway: 'Missouri has elevated radon throughout the state. Reddit strongly recommends testing before finishing basements. The granite in the Ozarks produces particularly high levels.',
      questionToAsk: 'Has radon testing been done? Should mitigation be included?',
      severity: 'warning'
    },
    {
      topic: 'Foundation & Clay Soil Issues',
      concern: 'Missouri\'s clay soils cause foundation movement',
      redditTakeaway: 'Expansive clay is common throughout Missouri, especially in the St. Louis area. Reddit recommends proper drainage management and structural engineer consultation for foundation work.',
      questionToAsk: 'How will drainage be addressed? Should a structural engineer review this?',
      severity: 'warning'
    },
    {
      topic: 'Basement Moisture',
      concern: 'Missouri basements commonly have moisture issues',
      redditTakeaway: 'Wet basements are very common. Reddit recommends addressing exterior grading and drainage first, then interior waterproofing systems with sump pumps.',
      questionToAsk: 'What\'s causing the moisture? Are we addressing root causes?',
      severity: 'info'
    },
    {
      topic: 'St. Louis Brick & Tuckpointing',
      concern: 'St. Louis has extensive brick homes requiring regular maintenance',
      redditTakeaway: 'St. Louis brick homes need tuckpointing every 25-30 years. Reddit emphasizes using correct mortar type—modern mortar is too hard for historic brick. Poor tuckpointing causes more damage.',
      questionToAsk: 'What mortar type will be used? Is it appropriate for this brick?',
      severity: 'info'
    },
    {
      topic: 'Kansas City Local Requirements',
      concern: 'Kansas City has specific contractor licensing requirements',
      redditTakeaway: 'KC requires contractor licensing and has specific inspection requirements. Reddit notes that working across the state line (Kansas side) has different requirements.',
      questionToAsk: 'Are you licensed in Kansas City? Which side of the state line is this property?',
      severity: 'info'
    },
    {
      topic: 'Severe Weather & Tornadoes',
      concern: 'Missouri is in Tornado Alley with frequent severe storms',
      redditTakeaway: 'Missouri sees regular tornadoes and severe thunderstorms. Reddit recommends storm-rated garage doors, safe rooms for high-risk areas, and being cautious of storm chasers.',
      questionToAsk: 'Are materials wind-rated? Should a safe room be considered?',
      severity: 'info'
    },
    {
      topic: 'HVAC for Temperature Swings',
      concern: 'Missouri temperatures range from below 0°F to over 100°F',
      redditTakeaway: 'HVAC systems work hard year-round. Reddit recommends quality equipment sized properly for the extremes. Variable-speed systems handle the range better.',
      questionToAsk: 'Is this HVAC system rated for our temperature extremes? Is Manual J being done?',
      severity: 'info'
    },
    {
      topic: 'Lead Paint in Older Homes',
      concern: 'Missouri cities have significant pre-1978 housing',
      redditTakeaway: 'St. Louis, Kansas City, and other cities have extensive older housing. EPA RRP rules apply. Reddit recommends testing before renovation in older homes.',
      questionToAsk: 'Are you EPA Lead-Safe certified? Will you test before disturbing painted surfaces?',
      severity: 'info'
    },
    {
      topic: 'Energy Rebates',
      concern: 'Missouri utilities offer various energy efficiency rebates',
      redditTakeaway: 'Ameren and Evergy offer rebates for efficiency upgrades. Reddit recommends checking before purchasing HVAC equipment or making insulation improvements.',
      questionToAsk: 'What utility rebates are available? Will you help with applications?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after tornado and hail damage',
    'Foundation repair scare tactics exploiting clay soil concerns',
    'Basement waterproofing high-pressure sales',
    'Tuckpointing with incorrect mortar that damages historic brick',
    'Unlicensed contractors operating without accountability'
  ],
  licensingNotes: 'Missouri has no statewide general contractor license. St. Louis and Kansas City have local licensing requirements. Electricians need state licenses. Always verify insurance and workers\' comp coverage.'
};

// Maryland-specific insights
export const MARYLAND_INSIGHTS: RegionalInsightsData = {
  stateName: 'Maryland',
  stateCode: 'MD',
  climate: 'Humid Subtropical',
  overview: 'Maryland homeowners face humidity challenges, significant older housing stock, and varying conditions from the coast to the mountains. The state requires contractor licensing through MHIC. The DC suburbs have very high construction costs, while the Eastern Shore and Western Maryland have different concerns.',
  insights: [
    {
      topic: 'MHIC Contractor Licensing',
      concern: 'Maryland requires Home Improvement Commission licensing',
      redditTakeaway: 'Maryland Home Improvement Commission (MHIC) licenses all contractors—verify at dllr.state.md.us. License numbers must appear on contracts. Reddit users appreciate the complaint process.',
      questionToAsk: 'What is your MHIC license number? Can I verify it online?',
      severity: 'warning'
    },
    {
      topic: 'DC Suburb Costs',
      concern: 'Montgomery and Prince George\'s Counties have very high construction costs',
      redditTakeaway: 'Labor costs in the DC suburbs are 30-40% above national average. Reddit warns that low bids often mean unlicensed workers. Permit requirements are extensive.',
      questionToAsk: 'Does this bid reflect DC metro labor rates? Are all workers properly licensed?',
      severity: 'info'
    },
    {
      topic: 'Humidity & Moisture Control',
      concern: 'Maryland\'s humid summers create moisture challenges',
      redditTakeaway: 'High humidity from May through September causes mold and moisture issues. Reddit emphasizes proper ventilation, dehumidification, and moisture-resistant materials.',
      questionToAsk: 'How will moisture be controlled? Is dehumidification included?',
      severity: 'warning'
    },
    {
      topic: 'Chesapeake Bay Coastal Issues',
      concern: 'Eastern Shore and Bay properties face flood and storm surge risk',
      redditTakeaway: 'Coastal Maryland deals with flooding, storm surge, and rising sea levels. FEMA flood zone status affects insurance and renovation requirements.',
      questionToAsk: 'Is this property in a flood zone? What flood-resistant features should be included?',
      severity: 'critical'
    },
    {
      topic: 'Historic Preservation',
      concern: 'Maryland has extensive historic districts with strict requirements',
      redditTakeaway: 'Annapolis, Baltimore neighborhoods, and many other areas have historic commissions. Exterior changes require approval. Reddit recommends checking before planning work.',
      questionToAsk: 'Is this in a historic district? What approvals are required?',
      severity: 'info'
    },
    {
      topic: 'Baltimore Rowhouse Challenges',
      concern: 'Baltimore\'s rowhouses have unique construction concerns',
      redditTakeaway: 'Shared walls, party wall agreements, and aging infrastructure are common issues. Reddit recommends understanding what work affects neighbors and checking party wall responsibilities.',
      questionToAsk: 'Does this work affect the party wall? What coordination with neighbors is needed?',
      severity: 'info'
    },
    {
      topic: 'Radon in Western Maryland',
      concern: 'Western Maryland and some central areas have elevated radon',
      redditTakeaway: 'Frederick County and Western Maryland have significant radon. Reddit recommends testing before basement finishing.',
      questionToAsk: 'Has radon testing been done? Should mitigation be included?',
      severity: 'info'
    },
    {
      topic: 'Crawl Space Moisture',
      concern: 'Crawl spaces struggle with Maryland humidity',
      redditTakeaway: 'Traditional vented crawl spaces don\'t work well. Reddit recommends encapsulation with vapor barriers and dehumidification.',
      questionToAsk: 'What crawl space system do you recommend? Will it be encapsulated?',
      severity: 'info'
    },
    {
      topic: 'Lead Paint in Older Homes',
      concern: 'Maryland has strict lead paint requirements, especially for rentals',
      redditTakeaway: 'Maryland has additional lead paint requirements beyond federal rules, particularly for rental properties. Reddit recommends testing and certified contractors.',
      questionToAsk: 'Are you EPA Lead-Safe certified? Does this property have lead paint disclosure?',
      severity: 'warning'
    },
    {
      topic: 'EmPOWER Maryland Rebates',
      concern: 'Maryland offers significant energy efficiency rebates',
      redditTakeaway: 'EmPOWER Maryland provides rebates for HVAC, insulation, and efficiency upgrades through utilities. Reddit recommends getting a free energy audit first.',
      questionToAsk: 'What EmPOWER rebates are available? Have you scheduled an energy audit?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after coastal storms',
    'Unlicensed contractors claiming MHIC doesn\'t apply to small jobs',
    'Crawl space encapsulation high-pressure sales',
    'Rowhouse contractors who don\'t understand party wall issues',
    'Foundation repair scare tactics'
  ],
  licensingNotes: 'Maryland requires MHIC licensing for all home improvement contractors—verify at dllr.state.md.us. License numbers must appear on all contracts. Electricians, plumbers, and HVAC contractors need additional state licenses.'
};

// Wisconsin-specific insights
export const WISCONSIN_INSIGHTS: RegionalInsightsData = {
  stateName: 'Wisconsin',
  stateCode: 'WI',
  climate: 'Humid Continental with Lake Effect',
  overview: 'Wisconsin homeowners face harsh winters, significant lake effect snow near Lake Michigan, and challenges with energy efficiency. The state requires Dwelling Contractor Certification for most residential work. Radon and basement moisture are common concerns.',
  insights: [
    {
      topic: 'Dwelling Contractor Certification',
      concern: 'Wisconsin requires certification for contractors on dwellings',
      redditTakeaway: 'Wisconsin DSPS requires Dwelling Contractor Certification for one and two-family homes—verify at dsps.wi.gov. Specialty trades also need credentials.',
      questionToAsk: 'What is your Wisconsin Dwelling Contractor Certification number?',
      severity: 'warning'
    },
    {
      topic: 'Harsh Winter Construction',
      concern: 'Wisconsin winters are severe—proper insulation and heating are critical',
      redditTakeaway: 'Temperatures regularly drop below 0°F. Reddit emphasizes high R-value insulation, air sealing, and quality windows. Heating costs are substantial without proper efficiency.',
      questionToAsk: 'What insulation R-values are specified? Does this meet or exceed code?',
      severity: 'warning'
    },
    {
      topic: 'Ice Dams & Roof Issues',
      concern: 'Wisconsin\'s snow and cold create significant ice dam risk',
      redditTakeaway: 'Ice dams cause major interior damage. Reddit strongly recommends proper attic ventilation and insulation, plus ice/water shield extended well past eaves.',
      questionToAsk: 'What ice dam prevention is included? Is ice/water shield extended appropriately?',
      severity: 'warning'
    },
    {
      topic: 'Radon Testing',
      concern: 'Wisconsin has significant radon levels throughout the state',
      redditTakeaway: 'Wisconsin DHS recommends testing all homes. Reddit strongly recommends testing before basement finishing. Mitigation is effective and typically costs $800-1500.',
      questionToAsk: 'Has radon testing been done? Should mitigation be included?',
      severity: 'warning'
    },
    {
      topic: 'Basement Moisture & Waterproofing',
      concern: 'Wisconsin\'s climate creates common basement moisture issues',
      redditTakeaway: 'Spring snowmelt and rain cause basement water problems. Reddit recommends addressing exterior drainage, then interior systems with sump pumps. Battery backup is essential.',
      questionToAsk: 'What\'s causing the moisture? Will the system have battery backup?',
      severity: 'info'
    },
    {
      topic: 'Lake Effect Snow (Eastern Wisconsin)',
      concern: 'Eastern Wisconsin near Lake Michigan gets heavy lake effect snow',
      redditTakeaway: 'Milwaukee, Green Bay, and eastern areas get extra snow. Reddit recommends robust roof structure, proper snow load ratings, and heated driveway consideration.',
      questionToAsk: 'What snow load is the roof rated for? Are materials rated for this exposure?',
      severity: 'info'
    },
    {
      topic: 'Energy Efficiency Focus',
      concern: 'Wisconsin\'s cold climate makes efficiency improvements high-value',
      redditTakeaway: 'Focus Wisconsin offers utility rebates for efficiency upgrades. Reddit notes that efficiency improvements have excellent ROI given heating costs.',
      questionToAsk: 'What Focus on Energy rebates are available? What efficiency rating is specified?',
      severity: 'info'
    },
    {
      topic: 'Freeze-Thaw Foundation Damage',
      concern: 'Wisconsin freeze-thaw cycles stress foundations',
      redditTakeaway: 'Block foundations in older homes are vulnerable. Reddit recommends proper drainage to reduce frost damage and appropriate mortar for tuckpointing.',
      questionToAsk: 'How will drainage be improved? What foundation issues should be addressed?',
      severity: 'info'
    },
    {
      topic: 'Historic Homes',
      concern: 'Milwaukee and other cities have historic neighborhoods',
      redditTakeaway: 'Bay View, Walker\'s Point, and other areas have historic requirements. Reddit recommends checking before planning visible exterior changes.',
      questionToAsk: 'Is this in a historic district? What approvals are needed?',
      severity: 'info'
    },
    {
      topic: 'Natural Gas vs. Propane',
      concern: 'Rural Wisconsin often relies on propane',
      redditTakeaway: 'Natural gas is available in cities but rural areas use propane. Reddit notes that geothermal is increasingly popular for reducing propane costs.',
      questionToAsk: 'What are the operating costs for different heating options?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after winter storms',
    'Basement waterproofing high-pressure sales',
    'Uncertified contractors claiming certification isn\'t required',
    'Furnace replacement scams claiming equipment is failing when it isn\'t',
    'Driveway sealcoating scams with diluted product'
  ],
  licensingNotes: 'Wisconsin requires Dwelling Contractor Certification for one and two-family homes—verify at dsps.wi.gov. Electricians, plumbers, and HVAC contractors need state credentials. Focus on Energy offers utility rebates for efficiency work.'
};

// Minnesota-specific insights
export const MINNESOTA_INSIGHTS: RegionalInsightsData = {
  stateName: 'Minnesota',
  stateCode: 'MN',
  climate: 'Humid Continental with Severe Winters',
  overview: 'Minnesota homeowners face some of the harshest winters in the lower 48, making energy efficiency and proper winterization critical. The state requires contractor licensing. Minneapolis/St. Paul has strong building standards, while rural areas face different challenges.',
  insights: [
    {
      topic: 'State Contractor Licensing',
      concern: 'Minnesota requires contractor licensing through DLI',
      redditTakeaway: 'Minnesota Department of Labor and Industry licenses contractors—verify at dli.mn.gov. Residential Building Contractor and Residential Remodeler licenses are different classifications.',
      questionToAsk: 'What is your Minnesota contractor license number? Is it the right classification?',
      severity: 'warning'
    },
    {
      topic: 'Extreme Cold Construction',
      concern: 'Minnesota winters regularly reach -20°F or colder',
      redditTakeaway: 'The extreme cold demands exceptional insulation and air sealing. Reddit emphasizes R-60+ attic insulation, triple-pane windows in severe areas, and quality furnaces.',
      questionToAsk: 'What insulation R-values are specified? Are windows rated for this climate?',
      severity: 'critical'
    },
    {
      topic: 'Ice Dams & Winter Roof Issues',
      concern: 'Minnesota\'s snow and cold create severe ice dam risk',
      redditTakeaway: 'Ice dams are a major issue. Reddit strongly emphasizes proper attic insulation and ventilation as the solution—not heated cables. Ice/water shield should extend well past eaves.',
      questionToAsk: 'What ice dam prevention is included? Is attic ventilation being addressed?',
      severity: 'warning'
    },
    {
      topic: 'Radon Testing',
      concern: 'Minnesota has significant radon levels statewide',
      redditTakeaway: 'Minnesota has high radon levels throughout. Reddit strongly recommends testing before basement finishing. Radon-resistant new construction is now code.',
      questionToAsk: 'Has radon testing been done? Is radon mitigation needed?',
      severity: 'warning'
    },
    {
      topic: 'Basement Moisture & Waterproofing',
      concern: 'Spring snowmelt creates serious basement water issues',
      redditTakeaway: 'The rapid spring thaw causes widespread basement flooding. Reddit recommends robust sump pump systems with battery backup. Exterior drainage improvements help.',
      questionToAsk: 'What waterproofing system is proposed? Will there be battery backup?',
      severity: 'info'
    },
    {
      topic: 'Energy Efficiency Priority',
      concern: 'Heating costs in Minnesota make efficiency paramount',
      redditTakeaway: 'Heating bills can be substantial without proper efficiency. Xcel Energy and other utilities offer significant rebates. Reddit recommends maximizing insulation and air sealing.',
      questionToAsk: 'What utility rebates are available? What energy savings are expected?',
      severity: 'info'
    },
    {
      topic: 'Foundation Frost Protection',
      concern: 'Deep frost depths require proper foundation design',
      redditTakeaway: 'Minnesota frost depths can exceed 5 feet. Footings must be deep enough to avoid frost heave. Reddit notes that proper drainage helps reduce frost issues.',
      questionToAsk: 'Are footings at proper depth for this area? How is drainage addressed?',
      severity: 'info'
    },
    {
      topic: 'Heat Pump Viability',
      concern: 'Cold climate heat pumps are now viable in Minnesota',
      redditTakeaway: 'Modern cold climate heat pumps work down to -15°F or lower. Reddit increasingly recommends them, though backup heat may still be needed for extreme cold snaps.',
      questionToAsk: 'Is a cold climate heat pump appropriate here? What backup heating is included?',
      severity: 'info'
    },
    {
      topic: 'Minneapolis/St. Paul Requirements',
      concern: 'Twin Cities have specific permit and inspection requirements',
      redditTakeaway: 'Minneapolis and St. Paul have strict building requirements and active inspection. Reddit notes that permits are thoroughly checked at sale.',
      questionToAsk: 'What permits are required? Who handles the permit process?',
      severity: 'info'
    },
    {
      topic: 'Historic Neighborhoods',
      concern: 'Minneapolis and St. Paul have historic preservation areas',
      redditTakeaway: 'Many Twin Cities neighborhoods have historic overlay districts. Reddit recommends checking before planning visible exterior changes.',
      questionToAsk: 'Is this in a historic district? What approvals are needed?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after winter storm damage',
    'Basement waterproofing high-pressure sales during spring flooding',
    'Furnace replacement scams preying on cold weather fears',
    'Unlicensed contractors claiming small jobs don\'t need licenses',
    'Ice dam "repair" services that don\'t address root causes'
  ],
  licensingNotes: 'Minnesota requires contractor licensing through DLI—verify at dli.mn.gov. Residential Building Contractor and Residential Remodeler are different license classes. Electricians, plumbers, and HVAC contractors need separate state licenses.'
};

// South Carolina-specific insights
export const SOUTH_CAROLINA_INSIGHTS: RegionalInsightsData = {
  stateName: 'South Carolina',
  stateCode: 'SC',
  climate: 'Humid Subtropical',
  overview: 'South Carolina homeowners face intense humidity, hurricane risk along the coast, and significant termite pressure. The state requires contractor licensing for residential work. Charleston and coastal areas have specific storm-resistant construction requirements.',
  insights: [
    {
      topic: 'State Contractor Licensing',
      concern: 'South Carolina requires contractor licensing through LLR',
      redditTakeaway: 'South Carolina LLR licenses residential contractors—verify at llr.sc.gov. General Contractor and Residential Builder are different classifications.',
      questionToAsk: 'What is your SC contractor license number? Can I verify it online?',
      severity: 'warning'
    },
    {
      topic: 'Hurricane Preparedness (Coastal)',
      concern: 'Coastal South Carolina faces serious hurricane risk',
      redditTakeaway: 'Charleston, Myrtle Beach, and coastal areas see regular hurricane impacts. Reddit emphasizes hurricane straps, impact-resistant windows or shutters, and proper roof tie-downs.',
      questionToAsk: 'What hurricane-resistant features are included? Does this meet wind-load requirements?',
      severity: 'critical'
    },
    {
      topic: 'Humidity & Moisture Control',
      concern: 'South Carolina\'s humidity creates year-round moisture challenges',
      redditTakeaway: 'High humidity causes mold and moisture issues. Reddit emphasizes proper HVAC sizing for dehumidification, crawl space encapsulation, and moisture-resistant materials.',
      questionToAsk: 'How will moisture be controlled? Is the HVAC sized for dehumidification?',
      severity: 'warning'
    },
    {
      topic: 'Termite Prevention',
      concern: 'South Carolina has severe termite pressure',
      redditTakeaway: 'Subterranean termites are prevalent throughout SC. Reddit recommends pre-treatment for new construction, regular inspections, and maintaining termite bonds.',
      questionToAsk: 'What termite prevention measures are included? Is there an existing termite bond?',
      severity: 'warning'
    },
    {
      topic: 'Crawl Space Encapsulation',
      concern: 'South Carolina\'s humidity demands proper crawl space management',
      redditTakeaway: 'Traditional vented crawl spaces don\'t work well in SC humidity. Reddit strongly recommends sealed, encapsulated crawl spaces with vapor barriers and dehumidification.',
      questionToAsk: 'What crawl space system do you recommend? Will it be encapsulated and conditioned?',
      severity: 'info'
    },
    {
      topic: 'Flood Zones (Coastal & Lowcountry)',
      concern: 'Coastal and Lowcountry areas have significant flood risk',
      redditTakeaway: 'Charleston and Lowcountry areas deal with both hurricane flooding and tidal flooding. FEMA flood zone status affects insurance and construction requirements.',
      questionToAsk: 'Is this in a flood zone? What flood-resistant construction is required?',
      severity: 'critical'
    },
    {
      topic: 'HVAC Sizing for Humidity',
      concern: 'HVAC must handle both cooling and dehumidification',
      redditTakeaway: 'Oversized AC units cool fast but don\'t dehumidify properly. Reddit emphasizes proper Manual J calculations and variable-speed systems.',
      questionToAsk: 'Will you perform a Manual J calculation? Is a variable-speed system recommended?',
      severity: 'info'
    },
    {
      topic: 'Charleston Historic District',
      concern: 'Charleston has strict historic preservation requirements',
      redditTakeaway: 'Charleston\'s BAR (Board of Architectural Review) has extensive jurisdiction. Exterior changes require approval. Reddit recommends understanding rules before planning work.',
      questionToAsk: 'Is this property under BAR jurisdiction? What approvals are required?',
      severity: 'info'
    },
    {
      topic: 'HOA Communities',
      concern: 'South Carolina has extensive HOA developments',
      redditTakeaway: 'Myrtle Beach area, Hilton Head, and suburban developments have active HOAs. Reddit warns to get architectural approval before signing contracts.',
      questionToAsk: 'Have you reviewed HOA requirements? Do we need architectural approval?',
      severity: 'info'
    },
    {
      topic: 'Energy Rebates',
      concern: 'SC utilities offer various efficiency rebates',
      redditTakeaway: 'Duke Energy and Dominion offer rebates for HVAC and efficiency upgrades. Reddit recommends checking before purchasing equipment.',
      questionToAsk: 'What utility rebates are available for this project?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after hurricanes',
    'Crawl space encapsulation high-pressure sales with mold scare tactics',
    'Unlicensed contractors claiming license isn\'t required for small jobs',
    'Termite treatment upselling with exaggerated damage claims',
    'Flood zone manipulation by unscrupulous contractors'
  ],
  licensingNotes: 'South Carolina LLR licenses residential contractors—verify at llr.sc.gov. Residential Builder and General Contractor are different classifications. Electricians, plumbers, and HVAC contractors need separate licenses.'
};

// Alabama-specific insights
export const ALABAMA_INSIGHTS: RegionalInsightsData = {
  stateName: 'Alabama',
  stateCode: 'AL',
  climate: 'Humid Subtropical',
  overview: 'Alabama homeowners face intense humidity, severe storm risk including tornadoes, and significant termite pressure. The state requires contractor licensing through the Home Builders Licensure Board. The Gulf Coast faces hurricane risk, while northern Alabama sees regular tornado activity.',
  insights: [
    {
      topic: 'State Contractor Licensing',
      concern: 'Alabama requires licensing through the Home Builders Licensure Board',
      redditTakeaway: 'Alabama Home Builders Licensure Board licenses residential contractors—verify at hblb.alabama.gov. License is required for projects over $10,000.',
      questionToAsk: 'What is your Alabama contractor license number? Can I verify it online?',
      severity: 'warning'
    },
    {
      topic: 'Tornado Preparedness',
      concern: 'Alabama is in Tornado Alley with frequent severe storms',
      redditTakeaway: 'Alabama sees significant tornado activity, especially in the northern half. Reddit recommends safe rooms (FEMA-rated), wind-rated garage doors, and proper roof tie-downs.',
      questionToAsk: 'Are materials wind-rated? Should a safe room be included?',
      severity: 'critical'
    },
    {
      topic: 'Hurricane Risk (Gulf Coast)',
      concern: 'Mobile and the Gulf Coast face hurricane impacts',
      redditTakeaway: 'Coastal Alabama sees regular hurricane impacts. Reddit emphasizes hurricane straps, impact-resistant windows or shutters, and flood zone awareness.',
      questionToAsk: 'What hurricane-resistant features are included? Is this in a flood zone?',
      severity: 'critical'
    },
    {
      topic: 'Humidity & Moisture Control',
      concern: 'Alabama\'s humidity creates year-round moisture challenges',
      redditTakeaway: 'High humidity causes mold and moisture issues. Reddit emphasizes proper HVAC sizing for dehumidification, crawl space encapsulation, and moisture-resistant materials.',
      questionToAsk: 'How will moisture be controlled? Is the HVAC properly sized?',
      severity: 'warning'
    },
    {
      topic: 'Termite Prevention',
      concern: 'Alabama has severe termite pressure',
      redditTakeaway: 'Subterranean termites are prevalent throughout Alabama. Reddit strongly recommends pre-treatment, regular inspections, and maintaining termite bonds.',
      questionToAsk: 'What termite prevention is included? Is there an existing termite bond?',
      severity: 'warning'
    },
    {
      topic: 'Crawl Space Moisture',
      concern: 'Crawl spaces are common and prone to moisture problems',
      redditTakeaway: 'Traditional vented crawl spaces don\'t work well in Alabama humidity. Reddit recommends encapsulation with vapor barriers and dehumidification.',
      questionToAsk: 'What crawl space system do you recommend? Will it be encapsulated?',
      severity: 'info'
    },
    {
      topic: 'HVAC Sizing for Humidity',
      concern: 'HVAC must handle both cooling and dehumidification',
      redditTakeaway: 'Oversized AC units cool fast but don\'t dehumidify. Reddit emphasizes proper Manual J calculations and variable-speed systems.',
      questionToAsk: 'Will you perform a Manual J calculation? Is variable-speed recommended?',
      severity: 'info'
    },
    {
      topic: 'Storm Damage Contractors',
      concern: 'Storm chasers target Alabama after severe weather',
      redditTakeaway: 'Alabama sees regular storm damage and accompanying scam contractors. Reddit strongly recommends using local, licensed contractors after storms.',
      questionToAsk: 'How long have you been working in Alabama? Can you provide local references?',
      severity: 'warning'
    },
    {
      topic: 'Permit Requirements Vary',
      concern: 'Permit requirements vary across Alabama municipalities',
      redditTakeaway: 'Birmingham, Huntsville, and Mobile have different requirements. Rural areas may have minimal oversight. Reddit recommends checking local rules.',
      questionToAsk: 'What permits are required locally? Who handles the permit process?',
      severity: 'info'
    },
    {
      topic: 'Energy Rebates',
      concern: 'Alabama utilities offer various efficiency rebates',
      redditTakeaway: 'Alabama Power offers rebates for HVAC and efficiency upgrades. Reddit recommends checking before purchasing equipment.',
      questionToAsk: 'What utility rebates are available? Will you help with applications?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after tornado and hurricane damage',
    'Unlicensed contractors claiming license isn\'t needed under $10,000',
    'Termite scare tactics with exaggerated damage claims',
    'Crawl space encapsulation high-pressure sales',
    'Foundation repair upselling'
  ],
  licensingNotes: 'Alabama requires licensing through the Home Builders Licensure Board for projects over $10,000—verify at hblb.alabama.gov. Electricians, plumbers, and HVAC contractors need separate state licenses.'
};

// Louisiana-specific insights
export const LOUISIANA_INSIGHTS: RegionalInsightsData = {
  stateName: 'Louisiana',
  stateCode: 'LA',
  climate: 'Humid Subtropical',
  overview: 'Louisiana homeowners face extreme humidity, hurricane risk, and unique construction challenges from the high water table. The state requires contractor licensing through the State Licensing Board. New Orleans has specific historic preservation and elevation requirements.',
  insights: [
    {
      topic: 'State Contractor Licensing',
      concern: 'Louisiana requires licensing through the State Licensing Board',
      redditTakeaway: 'Louisiana State Licensing Board for Contractors licenses residential work over $7,500—verify at lslbc.louisiana.gov. Different classifications exist for different work types.',
      questionToAsk: 'What is your Louisiana contractor license number? Is it the right classification?',
      severity: 'warning'
    },
    {
      topic: 'Hurricane Preparedness',
      concern: 'Louisiana faces significant hurricane risk throughout the coast',
      redditTakeaway: 'The entire Gulf Coast sees hurricane impacts. Reddit emphasizes hurricane straps, impact windows or shutters, wind-rated roofing, and elevation where required.',
      questionToAsk: 'What hurricane-resistant features are included? Does this meet wind-load codes?',
      severity: 'critical'
    },
    {
      topic: 'Flood Zones & Elevation',
      concern: 'Much of Louisiana is in FEMA flood zones',
      redditTakeaway: 'Flood zones affect most of coastal Louisiana. Substantial improvement rules may require elevation. Reddit strongly recommends checking flood zone status before major work.',
      questionToAsk: 'Is this in a flood zone? Could this trigger elevation requirements?',
      severity: 'critical'
    },
    {
      topic: 'Extreme Humidity & Moisture',
      concern: 'Louisiana has some of the highest humidity in the US',
      redditTakeaway: 'Humidity is relentless. Reddit emphasizes dehumidification, proper HVAC sizing, and moisture-resistant materials throughout. Mold prevention is critical.',
      questionToAsk: 'How will moisture be managed? What dehumidification is included?',
      severity: 'warning'
    },
    {
      topic: 'High Water Table',
      concern: 'Louisiana\'s water table affects foundation options',
      redditTakeaway: 'The high water table makes basements impossible and affects slab construction. Reddit notes that elevated construction is common for flood protection.',
      questionToAsk: 'How does the water table affect this project? What foundation system is appropriate?',
      severity: 'info'
    },
    {
      topic: 'New Orleans Historic Districts',
      concern: 'New Orleans has extensive historic preservation requirements',
      redditTakeaway: 'French Quarter, Garden District, and many other areas have strict HDLC requirements. Exterior changes need approval. Shotgun houses have specific rules.',
      questionToAsk: 'Is this under HDLC jurisdiction? What approvals are required?',
      severity: 'info'
    },
    {
      topic: 'Termite Pressure',
      concern: 'Louisiana has severe termite problems, including Formosan termites',
      redditTakeaway: 'Formosan termites are particularly aggressive in Louisiana. Reddit strongly recommends termite bonds, regular inspections, and appropriate prevention.',
      questionToAsk: 'What termite prevention is included? Is Formosan treatment specified?',
      severity: 'warning'
    },
    {
      topic: 'HVAC & Dehumidification',
      concern: 'AC systems run constantly and must dehumidify',
      redditTakeaway: 'AC systems work hard in Louisiana. Reddit emphasizes proper sizing for dehumidification, variable-speed systems, and regular maintenance.',
      questionToAsk: 'Is the HVAC sized for continuous operation? Is it variable-speed?',
      severity: 'info'
    },
    {
      topic: 'Insurance Challenges',
      concern: 'Louisiana has expensive and limited insurance options',
      redditTakeaway: 'Hurricane and flood insurance is expensive and increasingly hard to get. Reddit notes that wind mitigation features can reduce premiums.',
      questionToAsk: 'Will this work affect insurance? What wind mitigation credits might apply?',
      severity: 'info'
    },
    {
      topic: 'Storm Damage Contractors',
      concern: 'Storm chasers flood Louisiana after hurricanes',
      redditTakeaway: 'After every hurricane, out-of-state contractors appear. Reddit strongly warns to use licensed, local contractors and verify credentials.',
      questionToAsk: 'How long have you been working in Louisiana? Can you provide local references?',
      severity: 'warning'
    }
  ],
  commonScams: [
    'Storm chasers after hurricanes—extremely common',
    'Flood elevation scams with substandard work',
    'Unlicensed contractors claiming license isn\'t needed for small jobs',
    'Foundation repair scare tactics',
    'Termite bond companies that don\'t honor claims'
  ],
  licensingNotes: 'Louisiana State Licensing Board licenses contractors for projects over $7,500—verify at lslbc.louisiana.gov. Different classifications exist for different work. New Orleans has additional requirements including HDLC for historic areas.'
};

// Kentucky-specific insights
export const KENTUCKY_INSIGHTS: RegionalInsightsData = {
  stateName: 'Kentucky',
  stateCode: 'KY',
  climate: 'Humid Subtropical',
  overview: 'Kentucky homeowners face humidity challenges, radon concerns, and varied geography from the Appalachian mountains to the western lowlands. The state has no general contractor licensing requirement, making due diligence critical. Louisville and Lexington have specific local requirements.',
  insights: [
    {
      topic: 'No Statewide Contractor License',
      concern: 'Kentucky has no statewide general contractor licensing',
      redditTakeaway: 'Kentucky doesn\'t require GC licenses at the state level. Louisville and Lexington have local registration. Reddit strongly emphasizes checking insurance, references, and BBB ratings.',
      questionToAsk: 'Are you registered locally if required? Can you provide proof of insurance and workers\' comp?',
      severity: 'warning'
    },
    {
      topic: 'Radon Testing',
      concern: 'Kentucky has significant radon levels throughout the state',
      redditTakeaway: 'Kentucky has elevated radon, especially in the Bluegrass region. Reddit strongly recommends testing before basement finishing.',
      questionToAsk: 'Has radon testing been done? Should mitigation be included?',
      severity: 'warning'
    },
    {
      topic: 'Humidity & Moisture Control',
      concern: 'Kentucky\'s humid summers create moisture challenges',
      redditTakeaway: 'High humidity from May through September causes mold and moisture issues. Reddit emphasizes proper ventilation and dehumidification.',
      questionToAsk: 'How will moisture be controlled? Is dehumidification included?',
      severity: 'info'
    },
    {
      topic: 'Basement Moisture',
      concern: 'Kentucky basements commonly have moisture issues',
      redditTakeaway: 'Wet basements are common. Reddit recommends addressing exterior drainage first, then interior waterproofing systems.',
      questionToAsk: 'What\'s causing the moisture? Are we addressing root causes?',
      severity: 'info'
    },
    {
      topic: 'Eastern Kentucky Mine Subsidence',
      concern: 'Coal mining regions have subsidence risk',
      redditTakeaway: 'Eastern Kentucky has areas with underground mine voids. Reddit recommends checking mine maps before purchasing property or doing major foundation work.',
      questionToAsk: 'Has mine subsidence risk been evaluated for this property?',
      severity: 'warning'
    },
    {
      topic: 'Louisville Local Requirements',
      concern: 'Louisville has specific contractor and permit requirements',
      redditTakeaway: 'Louisville Metro requires contractor registration and has specific inspection requirements. Reddit notes enforcement is active.',
      questionToAsk: 'Are you registered in Louisville Metro? What permits are required?',
      severity: 'info'
    },
    {
      topic: 'Historic Districts',
      concern: 'Louisville and Lexington have historic preservation areas',
      redditTakeaway: 'Old Louisville, Highlands, and other areas have historic requirements. Reddit recommends checking before planning visible exterior work.',
      questionToAsk: 'Is this in a historic district? What approvals are needed?',
      severity: 'info'
    },
    {
      topic: 'Termite Awareness',
      concern: 'Kentucky has moderate termite pressure',
      redditTakeaway: 'Subterranean termites are present throughout Kentucky. Reddit recommends inspections and treatment plans, though pressure is less severe than deep South.',
      questionToAsk: 'Has a termite inspection been done? What prevention is included?',
      severity: 'info'
    },
    {
      topic: 'Energy Rebates',
      concern: 'Kentucky utilities offer efficiency rebates',
      redditTakeaway: 'LG&E, Kentucky Utilities, and others offer rebates for HVAC and efficiency upgrades. Reddit recommends checking before purchasing equipment.',
      questionToAsk: 'What utility rebates are available? Will you help with applications?',
      severity: 'info'
    },
    {
      topic: 'Severe Weather',
      concern: 'Kentucky experiences severe storms and occasional tornadoes',
      redditTakeaway: 'Severe thunderstorms and occasional tornadoes affect Kentucky. Reddit notes that wind-rated materials and storm-safe rooms are worth considering.',
      questionToAsk: 'Are materials wind-rated? Should a safe room be considered?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after severe weather',
    'Unlicensed contractors with no accountability',
    'Basement waterproofing high-pressure sales',
    'Foundation repair scare tactics',
    'HVAC replacement scams'
  ],
  licensingNotes: 'Kentucky has no statewide general contractor license. Louisville and Lexington have local registration requirements. Electricians and plumbers need state licenses. Always verify insurance and workers\' comp coverage.'
};

// Oregon-specific insights
export const OREGON_INSIGHTS: RegionalInsightsData = {
  stateName: 'Oregon',
  stateCode: 'OR',
  climate: 'Marine West Coast (west) to Semi-Arid (east)',
  overview: 'Oregon homeowners face dramatically different conditions west and east of the Cascades. Western Oregon deals with heavy rain and moisture, while eastern Oregon has extreme temperature swings. The state requires contractor licensing through CCB. Portland has specific requirements and high construction costs.',
  insights: [
    {
      topic: 'CCB Contractor Licensing',
      concern: 'Oregon requires contractor licensing through CCB',
      redditTakeaway: 'Oregon Construction Contractors Board (CCB) licenses all contractors—verify at ccb.oregon.gov. License numbers must appear on contracts and advertising. Reddit appreciates the strong consumer protection.',
      questionToAsk: 'What is your CCB license number? Can I verify it online?',
      severity: 'warning'
    },
    {
      topic: 'Western Oregon Moisture',
      concern: 'Western Oregon receives heavy rainfall and constant moisture',
      redditTakeaway: 'Portland area gets 150+ days of rain. Reddit strongly emphasizes proper flashing, ventilation, and moisture management. Mold prevention is critical.',
      questionToAsk: 'What moisture prevention measures are included? How is ventilation addressed?',
      severity: 'critical'
    },
    {
      topic: 'Seismic Risk',
      concern: 'Oregon faces significant earthquake risk, especially near the coast',
      redditTakeaway: 'The Cascadia Subduction Zone poses major risk. Reddit recommends seismic retrofitting for older homes, especially those with cripple walls or unreinforced masonry.',
      questionToAsk: 'Does this meet current seismic codes? Should seismic retrofitting be considered?',
      severity: 'warning'
    },
    {
      topic: 'Roof Moss & Algae',
      concern: 'Western Oregon\'s wet climate promotes moss and algae growth',
      redditTakeaway: 'Moss damages roofing materials over time. Reddit recommends zinc or copper strips at the ridge, regular cleaning, and algae-resistant shingles.',
      questionToAsk: 'Are algae-resistant shingles specified? What moss prevention is included?',
      severity: 'info'
    },
    {
      topic: 'Portland Building Costs',
      concern: 'Portland has high construction costs and strict requirements',
      redditTakeaway: 'Labor costs in Portland are 20-30% above national average. The city has strict permit requirements. Reddit notes that low bids often mean problems.',
      questionToAsk: 'Does this bid reflect Portland area rates? What permits are required?',
      severity: 'info'
    },
    {
      topic: 'Energy Code Requirements',
      concern: 'Oregon has strict energy codes',
      redditTakeaway: 'Oregon energy code requires high insulation values and efficiency standards. Reddit notes that meeting code adds cost but significantly reduces energy bills.',
      questionToAsk: 'Does this meet Oregon energy code? What efficiency ratings are specified?',
      severity: 'info'
    },
    {
      topic: 'Crawl Space Moisture',
      concern: 'Crawl spaces in western Oregon are prone to moisture',
      redditTakeaway: 'Vented crawl spaces struggle with Oregon\'s moisture. Reddit increasingly recommends sealed, conditioned crawl spaces.',
      questionToAsk: 'What crawl space system do you recommend? Will it be sealed?',
      severity: 'info'
    },
    {
      topic: 'East vs. West Climate',
      concern: 'Eastern Oregon has completely different conditions',
      redditTakeaway: 'Bend, Medford, and eastern areas face extreme temperature swings, not moisture. Reddit emphasizes using contractors familiar with the specific region.',
      questionToAsk: 'Do you have experience in this region of Oregon?',
      severity: 'info'
    },
    {
      topic: 'Wildfire Risk (Eastern & Southern)',
      concern: 'Eastern and southern Oregon face wildfire risk',
      redditTakeaway: 'Wildfire zones have specific building requirements. Reddit recommends fire-resistant materials, Class A roofing, and defensible space compliance.',
      questionToAsk: 'Is this in a wildfire risk zone? Are materials fire-resistant?',
      severity: 'warning'
    },
    {
      topic: 'Energy Trust Rebates',
      concern: 'Oregon offers significant energy efficiency rebates',
      redditTakeaway: 'Energy Trust of Oregon provides substantial rebates for HVAC, insulation, and efficiency upgrades. Reddit strongly recommends checking before purchasing equipment.',
      questionToAsk: 'What Energy Trust rebates are available? Will you help with applications?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Moss removal services that damage roofing',
    'Storm damage roofers after windstorms',
    'Unlicensed contractors claiming CCB license isn\'t required',
    'Foundation repair scare tactics',
    'Wildfire remediation scams'
  ],
  licensingNotes: 'Oregon Construction Contractors Board (CCB) licenses all contractors—verify at ccb.oregon.gov. License numbers must appear on all contracts and advertising. Strong consumer protection and complaint process. Permits required throughout the state.'
};

// Oklahoma-specific insights
export const OKLAHOMA_INSIGHTS: RegionalInsightsData = {
  stateName: 'Oklahoma',
  stateCode: 'OK',
  climate: 'Humid Subtropical (east) to Semi-Arid (west)',
  overview: 'Oklahoma homeowners face extreme weather including tornadoes, hail, and wide temperature swings. The state has no general contractor licensing requirement, making due diligence essential. Storm damage is a regular occurrence, and storm-resistant construction is increasingly important.',
  insights: [
    {
      topic: 'No Statewide Contractor License',
      concern: 'Oklahoma has no statewide general contractor licensing',
      redditTakeaway: 'Oklahoma doesn\'t require GC licenses at the state level. Oklahoma City and Tulsa have local registration. Reddit strongly emphasizes checking insurance, references, and BBB ratings.',
      questionToAsk: 'Are you registered locally if required? Can you provide proof of insurance and workers\' comp?',
      severity: 'warning'
    },
    {
      topic: 'Tornado Preparedness',
      concern: 'Oklahoma is in the heart of Tornado Alley',
      redditTakeaway: 'Oklahoma sees significant tornado activity. Reddit strongly recommends FEMA-rated safe rooms or storm shelters, wind-rated garage doors, and proper roof tie-downs.',
      questionToAsk: 'Should a safe room be included? Are materials wind-rated?',
      severity: 'critical'
    },
    {
      topic: 'Hail Damage & Roofing',
      concern: 'Oklahoma experiences severe hail storms regularly',
      redditTakeaway: 'Hail damage is nearly inevitable over time. Reddit recommends impact-resistant roofing (Class 4) for insurance discounts and longevity.',
      questionToAsk: 'Are impact-resistant shingles included? What is the impact rating?',
      severity: 'warning'
    },
    {
      topic: 'Storm Chasers & Scams',
      concern: 'Storm chasers flood Oklahoma after severe weather',
      redditTakeaway: 'After every storm, out-of-state contractors appear. Reddit strongly warns to use local contractors and verify insurance. Many disappear after collecting deposits.',
      questionToAsk: 'How long have you been working in Oklahoma? Can you provide local references?',
      severity: 'warning'
    },
    {
      topic: 'Foundation & Clay Soil Issues',
      concern: 'Oklahoma\'s red clay causes foundation movement',
      redditTakeaway: 'Expansive clay causes foundation problems throughout Oklahoma. Reddit recommends proper drainage management and structural engineer consultation.',
      questionToAsk: 'How will drainage be addressed? Should a structural engineer review this?',
      severity: 'warning'
    },
    {
      topic: 'Temperature Extremes',
      concern: 'Oklahoma sees both extreme heat and severe cold',
      redditTakeaway: 'Temperatures range from over 100°F to below 0°F. Reddit emphasizes proper insulation, quality HVAC, and materials rated for extreme conditions.',
      questionToAsk: 'Are materials rated for temperature extremes? Is insulation adequate?',
      severity: 'info'
    },
    {
      topic: 'HVAC Sizing',
      concern: 'HVAC systems must handle extreme temperature swings',
      redditTakeaway: 'Oklahoma HVAC works hard year-round. Reddit recommends proper Manual J calculations and quality equipment sized for the extremes.',
      questionToAsk: 'Will a Manual J calculation be done? What efficiency rating is specified?',
      severity: 'info'
    },
    {
      topic: 'Insurance Considerations',
      concern: 'Oklahoma has expensive property insurance due to storms',
      redditTakeaway: 'Storm damage drives up insurance costs. Reddit notes that impact-resistant roofing and safe rooms can reduce premiums.',
      questionToAsk: 'Will this work qualify for insurance discounts? What certifications are included?',
      severity: 'info'
    },
    {
      topic: 'Permit Requirements Vary',
      concern: 'Permit requirements vary across Oklahoma',
      redditTakeaway: 'OKC and Tulsa have specific requirements; rural areas may have minimal oversight. Reddit recommends checking local rules.',
      questionToAsk: 'What permits are required? Who handles the permit process?',
      severity: 'info'
    },
    {
      topic: 'Termite Awareness',
      concern: 'Oklahoma has moderate to high termite pressure',
      redditTakeaway: 'Subterranean termites are present throughout Oklahoma. Reddit recommends inspections and treatment plans.',
      questionToAsk: 'Has a termite inspection been done? What prevention is included?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after tornado and hail damage—extremely common',
    'Roofing companies that disappear after collecting insurance payments',
    'Unlicensed contractors with no accountability',
    'Foundation repair scare tactics',
    'Safe room companies with substandard products'
  ],
  licensingNotes: 'Oklahoma has no statewide general contractor license. Oklahoma City and Tulsa have local registration. Electricians, plumbers, and HVAC contractors need state licenses. Always verify insurance—this is your main protection.'
};

// Connecticut-specific insights
export const CONNECTICUT_INSIGHTS: RegionalInsightsData = {
  stateName: 'Connecticut',
  stateCode: 'CT',
  climate: 'Humid Continental',
  overview: 'Connecticut homeowners face harsh winters, significant older housing stock, and very high construction costs. The state requires contractor registration through DCP. The state has extensive historic housing and strict building requirements.',
  insights: [
    {
      topic: 'Home Improvement Contractor Registration',
      concern: 'Connecticut requires HIC registration for contractors',
      redditTakeaway: 'Connecticut Department of Consumer Protection requires Home Improvement Contractor registration—verify at portal.ct.gov/dcp. Registration protects consumers through the Home Improvement Guaranty Fund.',
      questionToAsk: 'What is your Connecticut HIC registration number? Can I verify it online?',
      severity: 'warning'
    },
    {
      topic: 'Very High Construction Costs',
      concern: 'Connecticut has some of the highest construction costs in the US',
      redditTakeaway: 'Labor costs are 30-50% above national average. Reddit warns that very low bids usually mean unlicensed workers or shortcuts.',
      questionToAsk: 'Does this bid reflect Connecticut labor rates? Are all workers properly licensed?',
      severity: 'info'
    },
    {
      topic: 'Ice Dams & Winter Damage',
      concern: 'Connecticut winters cause significant ice dam and freeze damage',
      redditTakeaway: 'Ice dams cause major interior damage. Reddit strongly recommends proper attic insulation and ventilation, plus ice/water shield extending past eaves.',
      questionToAsk: 'What ice dam prevention is included? Is attic ventilation adequate?',
      severity: 'warning'
    },
    {
      topic: 'Lead Paint in Older Homes',
      concern: 'Connecticut has extensive pre-1978 housing with lead paint',
      redditTakeaway: 'Connecticut has strict lead paint requirements. EPA RRP rules apply, and the state has additional requirements for certain properties.',
      questionToAsk: 'Are you EPA Lead-Safe certified? Will you test for lead?',
      severity: 'warning'
    },
    {
      topic: 'Historic Districts',
      concern: 'Connecticut has numerous historic districts and homes',
      redditTakeaway: 'Many Connecticut towns have historic commissions with exterior approval requirements. Reddit recommends checking before planning visible work.',
      questionToAsk: 'Is this in a historic district? What approvals are required?',
      severity: 'info'
    },
    {
      topic: 'Coastal Flood Zones',
      concern: 'Connecticut shoreline faces flood and storm surge risk',
      redditTakeaway: 'Coastal Connecticut has significant flood risk. FEMA flood zone status affects insurance and renovation requirements.',
      questionToAsk: 'Is this in a flood zone? What flood-resistant features should be included?',
      severity: 'warning'
    },
    {
      topic: 'Radon Testing',
      concern: 'Connecticut has elevated radon levels in many areas',
      redditTakeaway: 'Connecticut DEP recommends testing all homes. Reddit recommends testing before basement finishing.',
      questionToAsk: 'Has radon testing been done? Should mitigation be included?',
      severity: 'info'
    },
    {
      topic: 'Basement Moisture',
      concern: 'Connecticut basements commonly have moisture issues',
      redditTakeaway: 'Wet basements are common in older homes. Reddit recommends addressing exterior drainage and interior waterproofing.',
      questionToAsk: 'What\'s causing the moisture? Are we addressing root causes?',
      severity: 'info'
    },
    {
      topic: 'Oil to Gas/Heat Pump Conversions',
      concern: 'Many Connecticut homes still use oil heat',
      redditTakeaway: 'Oil heat is expensive. Reddit users increasingly recommend natural gas or heat pump conversions. Utility rebates are available.',
      questionToAsk: 'What heating options are available? What rebates apply?',
      severity: 'info'
    },
    {
      topic: 'Energize CT Rebates',
      concern: 'Connecticut offers significant energy efficiency rebates',
      redditTakeaway: 'Energize CT provides rebates for HVAC, insulation, and efficiency upgrades. Reddit recommends getting a Home Energy Solutions audit first.',
      questionToAsk: 'What Energize CT rebates are available? Have you scheduled an energy audit?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after nor\'easters',
    'Unregistered contractors claiming HIC doesn\'t apply',
    'Asbestos/mold scare tactics',
    'Underground oil tank removal issues',
    'Lead paint violations'
  ],
  licensingNotes: 'Connecticut requires HIC registration through DCP—verify at portal.ct.gov/dcp. The Home Improvement Guaranty Fund provides consumer protection. Electricians, plumbers, and HVAC contractors need separate licenses.'
};

// Utah-specific insights
export const UTAH_INSIGHTS: RegionalInsightsData = {
  stateName: 'Utah',
  stateCode: 'UT',
  climate: 'Semi-Arid to Arid',
  overview: 'Utah homeowners face unique challenges from the dry climate, alkaline soils, and rapid growth in the Wasatch Front. The state requires contractor licensing through DOPL. Water-related landscaping restrictions and high-altitude considerations apply in many areas.',
  insights: [
    {
      topic: 'State Contractor Licensing',
      concern: 'Utah requires contractor licensing through DOPL',
      redditTakeaway: 'Utah Division of Occupational and Professional Licensing (DOPL) licenses contractors—verify at dopl.utah.gov. Different classifications exist for different work types.',
      questionToAsk: 'What is your Utah contractor license number? Is it the right classification?',
      severity: 'warning'
    },
    {
      topic: 'Alkaline Soil & Foundation Issues',
      concern: 'Utah\'s alkaline soils affect concrete and foundations',
      redditTakeaway: 'Alkaline soils along the Wasatch Front can damage concrete over time. Reddit recommends proper concrete mix design and sealing.',
      questionToAsk: 'Is the concrete mix designed for alkaline conditions? What sealing is included?',
      severity: 'warning'
    },
    {
      topic: 'Dry Climate Construction',
      concern: 'Utah\'s dry climate affects materials and construction',
      redditTakeaway: 'Low humidity causes wood to shrink after installation. Reddit recommends acclimating materials and understanding that some cracking is normal.',
      questionToAsk: 'Will materials be acclimated? How will shrinkage be addressed?',
      severity: 'info'
    },
    {
      topic: 'Water Conservation & Landscaping',
      concern: 'Utah has water restrictions affecting landscaping choices',
      redditTakeaway: 'Water shortages are driving xeriscaping requirements in many areas. Reddit notes that turf removal rebates are available.',
      questionToAsk: 'Does this landscaping meet water restrictions? Are rebates available?',
      severity: 'info'
    },
    {
      topic: 'Rapid Growth Quality Issues',
      concern: 'Fast-paced construction in growing areas leads to quality concerns',
      redditTakeaway: 'Utah County and Washington County have seen rapid growth with associated quality issues. Reddit recommends careful inspections of new construction.',
      questionToAsk: 'How long have you been working in this area? What quality controls are in place?',
      severity: 'info'
    },
    {
      topic: 'High Altitude Considerations',
      concern: 'Mountain communities have altitude-specific issues',
      redditTakeaway: 'Park City and mountain areas need altitude-adjusted appliances and different construction techniques. Reddit recommends experienced mountain contractors.',
      questionToAsk: 'Do you have mountain building experience? Are appliances altitude-rated?',
      severity: 'info'
    },
    {
      topic: 'Radon Testing',
      concern: 'Utah has elevated radon in many areas',
      redditTakeaway: 'Utah has significant radon, especially in certain valleys. Reddit recommends testing before basement finishing.',
      questionToAsk: 'Has radon testing been done? Should mitigation be included?',
      severity: 'warning'
    },
    {
      topic: 'Earthquake Risk',
      concern: 'Utah faces earthquake risk along the Wasatch Fault',
      redditTakeaway: 'The Wasatch Fault poses significant risk to the metropolitan area. Reddit recommends seismic retrofitting for older homes.',
      questionToAsk: 'Does this meet seismic codes? Should seismic retrofitting be considered?',
      severity: 'warning'
    },
    {
      topic: 'HVAC for Dry Climate',
      concern: 'Utah\'s dry climate affects HVAC and comfort',
      redditTakeaway: 'Dry air can be uncomfortable. Reddit notes that whole-house humidifiers are often needed, and evaporative coolers work well in most areas.',
      questionToAsk: 'Is humidification needed? Would evaporative cooling work here?',
      severity: 'info'
    },
    {
      topic: 'Rocky Power Rebates',
      concern: 'Utah utilities offer energy efficiency rebates',
      redditTakeaway: 'Rocky Mountain Power and Dominion Energy offer rebates for efficiency upgrades. Reddit recommends checking before purchasing equipment.',
      questionToAsk: 'What utility rebates are available? Will you help with applications?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Fast-growth area contractors who disappear',
    'Foundation repair scare tactics related to soil issues',
    'Unlicensed contractors in boom areas',
    'Landscaping companies pushing non-compliant water features',
    'Solar installers with unrealistic production claims'
  ],
  licensingNotes: 'Utah DOPL licenses contractors—verify at dopl.utah.gov. Different classifications exist for different work types. Electricians, plumbers, and HVAC contractors need separate licenses.'
};

// Iowa-specific insights
export const IOWA_INSIGHTS: RegionalInsightsData = {
  stateName: 'Iowa',
  stateCode: 'IA',
  climate: 'Humid Continental',
  overview: 'Iowa homeowners face extreme temperature swings, severe storm risk, and radon concerns. The state has no general contractor licensing requirement, making due diligence critical. Energy efficiency is important given the climate extremes.',
  insights: [
    {
      topic: 'No Statewide Contractor License',
      concern: 'Iowa has no statewide general contractor licensing',
      redditTakeaway: 'Iowa doesn\'t require GC licenses at the state level. Des Moines and some cities have local registration. Reddit strongly emphasizes checking insurance and references.',
      questionToAsk: 'Are you registered locally if required? Can you provide proof of insurance and workers\' comp?',
      severity: 'warning'
    },
    {
      topic: 'Radon Testing',
      concern: 'Iowa has some of the highest radon levels in the country',
      redditTakeaway: 'Iowa consistently ranks among the highest states for radon. Reddit very strongly recommends testing before any basement work. Radon-resistant new construction is recommended.',
      questionToAsk: 'Has radon testing been done? Is mitigation necessary?',
      severity: 'critical'
    },
    {
      topic: 'Severe Weather & Tornadoes',
      concern: 'Iowa experiences tornadoes and severe storms',
      redditTakeaway: 'Iowa sees regular severe storms and tornadoes. Reddit recommends safe rooms, wind-rated materials, and proper roof tie-downs.',
      questionToAsk: 'Are materials wind-rated? Should a safe room be considered?',
      severity: 'warning'
    },
    {
      topic: 'Extreme Temperature Swings',
      concern: 'Iowa temperatures range from -20°F to 100°F+',
      redditTakeaway: 'The extreme temperature range stresses materials and HVAC systems. Reddit emphasizes proper insulation, air sealing, and quality equipment.',
      questionToAsk: 'What insulation levels are specified? Is equipment rated for our extremes?',
      severity: 'info'
    },
    {
      topic: 'Basement Moisture',
      concern: 'Iowa basements commonly have moisture issues',
      redditTakeaway: 'Wet basements are common. Reddit recommends addressing exterior drainage and proper sump pump systems with battery backup.',
      questionToAsk: 'What\'s causing the moisture? Will there be battery backup?',
      severity: 'info'
    },
    {
      topic: 'Ice Dams & Winter Issues',
      concern: 'Iowa winters create ice dam potential',
      redditTakeaway: 'Ice dams cause interior damage. Reddit recommends proper attic insulation and ventilation, plus ice/water shield on roof edges.',
      questionToAsk: 'What ice dam prevention is included? Is attic ventilation adequate?',
      severity: 'info'
    },
    {
      topic: 'Energy Efficiency',
      concern: 'Iowa\'s climate makes efficiency important for comfort and cost',
      redditTakeaway: 'Heating and cooling costs add up. MidAmerican and Alliant offer rebates. Reddit recommends maximizing insulation and air sealing.',
      questionToAsk: 'What utility rebates are available? What efficiency measures are included?',
      severity: 'info'
    },
    {
      topic: 'Storm Chasers',
      concern: 'Storm chasers target Iowa after severe weather',
      redditTakeaway: 'After storms, out-of-state contractors appear. Reddit warns to use local contractors and verify credentials.',
      questionToAsk: 'How long have you been working in Iowa? Can you provide local references?',
      severity: 'warning'
    },
    {
      topic: 'Historic Homes',
      concern: 'Iowa has historic districts in many cities',
      redditTakeaway: 'Des Moines, Dubuque, and other cities have historic areas. Reddit recommends checking before planning visible exterior work.',
      questionToAsk: 'Is this in a historic district? What approvals are needed?',
      severity: 'info'
    },
    {
      topic: 'Permit Requirements Vary',
      concern: 'Permit requirements vary across Iowa',
      redditTakeaway: 'Des Moines and larger cities have requirements; rural areas may have minimal oversight. Reddit recommends checking local rules.',
      questionToAsk: 'What permits are required? Who handles the permit process?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after tornado and hail damage',
    'Basement waterproofing high-pressure sales',
    'Unlicensed contractors with no accountability',
    'Roofing companies that disappear after deposits',
    'HVAC replacement scams'
  ],
  licensingNotes: 'Iowa has no statewide general contractor license. Des Moines and some cities have local registration. Electricians and plumbers need state licenses. Always verify insurance—this is your main protection.'
};

// Nevada-specific insights
export const NEVADA_INSIGHTS: RegionalInsightsData = {
  stateName: 'Nevada',
  stateCode: 'NV',
  climate: 'Arid Desert to Semi-Arid',
  overview: 'Nevada homeowners face extreme heat, very low humidity, and rapid construction growth in Las Vegas and Reno areas. The state requires contractor licensing through NSCB. Desert climate creates unique challenges for materials and energy efficiency.',
  insights: [
    {
      topic: 'State Contractor Licensing',
      concern: 'Nevada requires contractor licensing through NSCB',
      redditTakeaway: 'Nevada State Contractors Board (NSCB) licenses all contractors—verify at nscb.nv.gov. License classification must match the work type. NSCB is considered very strict.',
      questionToAsk: 'What is your Nevada contractor license number? Is it the right classification for this work?',
      severity: 'warning'
    },
    {
      topic: 'Extreme Heat & UV Exposure',
      concern: 'Las Vegas area sees temperatures over 115°F with intense sun',
      redditTakeaway: 'Extreme heat and UV degrade materials quickly. Reddit strongly recommends heat-reflective roofing, UV-resistant materials, and proper attic ventilation.',
      questionToAsk: 'Are materials rated for extreme heat? Is heat-reflective roofing included?',
      severity: 'critical'
    },
    {
      topic: 'Desert Landscaping Requirements',
      concern: 'Water restrictions limit grass and water features',
      redditTakeaway: 'Southern Nevada Water Authority restricts turf and offers removal rebates. Reddit notes that xeriscaping is required for many areas.',
      questionToAsk: 'Does this landscaping comply with water restrictions? What rebates are available?',
      severity: 'info'
    },
    {
      topic: 'Rapid Growth Quality Concerns',
      concern: 'Fast-paced construction in Las Vegas leads to quality issues',
      redditTakeaway: 'The boom-bust cycles create quality concerns. Reddit recommends careful inspections and reputable contractors who\'ve been around through cycles.',
      questionToAsk: 'How long have you been in Nevada? What quality controls are in place?',
      severity: 'warning'
    },
    {
      topic: 'Pool & Spa Regulations',
      concern: 'Nevada has specific pool safety requirements',
      redditTakeaway: 'Pool fencing and safety barriers are required. Reddit notes permit requirements and inspections are strict.',
      questionToAsk: 'What safety features are required? Are all permits included?',
      severity: 'info'
    },
    {
      topic: 'Energy Efficiency in Desert',
      concern: 'Cooling costs are substantial without proper efficiency',
      redditTakeaway: 'AC runs constantly in summer. Reddit emphasizes high SEER ratings, proper insulation, and window treatments. NV Energy offers rebates.',
      questionToAsk: 'What SEER rating is specified? What insulation levels are included?',
      severity: 'info'
    },
    {
      topic: 'Stucco & Exterior Maintenance',
      concern: 'Stucco is common but requires proper installation in desert',
      redditTakeaway: 'Stucco can crack in the extreme heat/cold cycles. Reddit recommends proper installation techniques and understanding maintenance needs.',
      questionToAsk: 'What stucco system is specified? What are maintenance expectations?',
      severity: 'info'
    },
    {
      topic: 'HOA Communities',
      concern: 'Las Vegas has extensive HOA developments',
      redditTakeaway: 'Most Las Vegas communities have HOAs with strict rules. Reddit strongly recommends getting architectural approval before signing contracts.',
      questionToAsk: 'Have you reviewed HOA requirements? Do we need architectural approval first?',
      severity: 'info'
    },
    {
      topic: 'Flood Zones in Desert',
      concern: 'Flash flood risk exists even in the desert',
      redditTakeaway: 'Las Vegas flash flooding can be severe. FEMA flood zones exist in unexpected areas. Reddit recommends checking flood zone status.',
      questionToAsk: 'Is this in a flood zone? Is flood-resistant construction needed?',
      severity: 'info'
    },
    {
      topic: 'Caliche Soil Issues',
      concern: 'Nevada\'s caliche soil affects excavation and drainage',
      redditTakeaway: 'Caliche is a cement-like soil layer that makes excavation difficult and affects drainage. Reddit notes this can significantly add to project costs.',
      questionToAsk: 'Has soil been tested? How will caliche be handled if encountered?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Fly-by-night contractors during boom periods',
    'Pool contractors who collect deposits and disappear',
    'Unlicensed contractors claiming license isn\'t needed for small jobs',
    'Landscaping companies installing water-wasting features illegally',
    'AC repair scams during extreme heat'
  ],
  licensingNotes: 'Nevada State Contractors Board (NSCB) licenses all contractors—verify at nscb.nv.gov. NSCB is strict about enforcement. Classification must match work type. Electricians, plumbers, and HVAC contractors need separate licenses.'
};

// Arkansas-specific insights
export const ARKANSAS_INSIGHTS: RegionalInsightsData = {
  stateName: 'Arkansas',
  stateCode: 'AR',
  climate: 'Humid Subtropical',
  overview: 'Arkansas homeowners face humidity challenges, severe storm risk, and varying conditions from the Ozarks to the Delta. The state requires contractor licensing for projects over $20,000. Termite pressure is significant throughout the state.',
  insights: [
    {
      topic: 'State Contractor Licensing',
      concern: 'Arkansas requires licensing for projects over $20,000',
      redditTakeaway: 'Arkansas Contractors Licensing Board licenses work over $20,000—verify at aclb.arkansas.gov. Roofing contractors have separate licensing requirements.',
      questionToAsk: 'What is your Arkansas contractor license number? Can I verify it online?',
      severity: 'warning'
    },
    {
      topic: 'Humidity & Moisture Control',
      concern: 'Arkansas humidity creates year-round moisture challenges',
      redditTakeaway: 'High humidity causes mold and moisture issues, especially in crawl spaces. Reddit emphasizes proper ventilation and moisture barriers.',
      questionToAsk: 'How will moisture be controlled? What ventilation is included?',
      severity: 'warning'
    },
    {
      topic: 'Severe Storms & Tornadoes',
      concern: 'Arkansas experiences tornadoes and severe storms',
      redditTakeaway: 'Arkansas sees regular severe weather. Reddit recommends safe rooms, wind-rated materials, and proper roof tie-downs.',
      questionToAsk: 'Are materials wind-rated? Should a safe room be considered?',
      severity: 'warning'
    },
    {
      topic: 'Termite Prevention',
      concern: 'Arkansas has significant termite pressure',
      redditTakeaway: 'Subterranean termites are prevalent throughout Arkansas. Reddit strongly recommends pre-treatment, regular inspections, and termite bonds.',
      questionToAsk: 'What termite prevention is included? Is there an existing termite bond?',
      severity: 'warning'
    },
    {
      topic: 'Crawl Space Moisture',
      concern: 'Crawl spaces in Arkansas are prone to moisture problems',
      redditTakeaway: 'Traditional vented crawl spaces struggle with Arkansas humidity. Reddit recommends encapsulation with vapor barriers.',
      questionToAsk: 'What crawl space system do you recommend? Will it be encapsulated?',
      severity: 'info'
    },
    {
      topic: 'Ozark Mountain Construction',
      concern: 'Northwest Arkansas has mountain building considerations',
      redditTakeaway: 'Steep lots, rock excavation, and drainage are common issues in the Ozarks. Reddit recommends contractors experienced with mountain terrain.',
      questionToAsk: 'Do you have experience building on slopes? How will drainage be handled?',
      severity: 'info'
    },
    {
      topic: 'Storm Chasers',
      concern: 'Storm chasers target Arkansas after severe weather',
      redditTakeaway: 'After storms, out-of-state contractors appear. Reddit strongly warns to use local, licensed contractors.',
      questionToAsk: 'How long have you been working in Arkansas? Can you provide local references?',
      severity: 'warning'
    },
    {
      topic: 'HVAC for Humidity',
      concern: 'HVAC must handle cooling and dehumidification',
      redditTakeaway: 'Oversized AC cools fast but doesn\'t dehumidify. Reddit recommends proper Manual J calculations.',
      questionToAsk: 'Will a Manual J calculation be done? Is a variable-speed system recommended?',
      severity: 'info'
    },
    {
      topic: 'Permit Requirements Vary',
      concern: 'Permit requirements vary across Arkansas',
      redditTakeaway: 'Little Rock and larger cities have requirements; rural areas may have minimal oversight.',
      questionToAsk: 'What permits are required locally? Who handles permits?',
      severity: 'info'
    },
    {
      topic: 'Energy Rebates',
      concern: 'Arkansas utilities offer efficiency rebates',
      redditTakeaway: 'Entergy and OG&E offer rebates for HVAC and efficiency upgrades. Reddit recommends checking before purchasing.',
      questionToAsk: 'What utility rebates are available?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after severe weather',
    'Unlicensed contractors claiming threshold doesn\'t apply',
    'Termite scare tactics',
    'Crawl space encapsulation high-pressure sales',
    'Foundation repair upselling'
  ],
  licensingNotes: 'Arkansas requires licensing for projects over $20,000—verify at aclb.arkansas.gov. Roofing contractors have separate requirements. Electricians, plumbers, and HVAC contractors need state licenses.'
};

// Mississippi-specific insights
export const MISSISSIPPI_INSIGHTS: RegionalInsightsData = {
  stateName: 'Mississippi',
  stateCode: 'MS',
  climate: 'Humid Subtropical',
  overview: 'Mississippi homeowners face intense humidity, hurricane risk on the Gulf Coast, and significant termite pressure. The state requires contractor licensing for residential work. The Delta, Hill Country, and Coast have distinct conditions.',
  insights: [
    {
      topic: 'State Contractor Licensing',
      concern: 'Mississippi requires contractor licensing through MSBOC',
      redditTakeaway: 'Mississippi State Board of Contractors licenses residential work over $50,000—verify at msboc.us. Lower thresholds exist for some work types.',
      questionToAsk: 'What is your Mississippi contractor license number? Can I verify it?',
      severity: 'warning'
    },
    {
      topic: 'Hurricane Preparedness (Gulf Coast)',
      concern: 'Mississippi Gulf Coast faces significant hurricane risk',
      redditTakeaway: 'The coast sees regular hurricane impacts. Reddit emphasizes hurricane straps, wind-rated materials, and elevation requirements in flood zones.',
      questionToAsk: 'What hurricane-resistant features are included? Does this meet wind-load codes?',
      severity: 'critical'
    },
    {
      topic: 'Extreme Humidity & Moisture',
      concern: 'Mississippi has very high humidity year-round',
      redditTakeaway: 'Humidity is relentless. Reddit strongly emphasizes moisture management, proper HVAC sizing, and mold prevention.',
      questionToAsk: 'How will moisture be controlled? Is the HVAC sized for dehumidification?',
      severity: 'warning'
    },
    {
      topic: 'Termite Prevention',
      concern: 'Mississippi has severe termite pressure',
      redditTakeaway: 'Subterranean termites are extremely active. Reddit strongly recommends pre-treatment, regular inspections, and maintaining termite bonds.',
      questionToAsk: 'What termite prevention is included? Is there an existing termite bond?',
      severity: 'warning'
    },
    {
      topic: 'Flood Zones',
      concern: 'Coastal and river areas have significant flood risk',
      redditTakeaway: 'The Coast and Mississippi River areas have extensive flood zones. FEMA requirements may affect renovation scope.',
      questionToAsk: 'Is this in a flood zone? What flood-resistant construction is required?',
      severity: 'critical'
    },
    {
      topic: 'Crawl Space Moisture',
      concern: 'Crawl spaces struggle with Mississippi humidity',
      redditTakeaway: 'Vented crawl spaces don\'t work in Mississippi. Reddit strongly recommends encapsulation with dehumidification.',
      questionToAsk: 'What crawl space system do you recommend? Will it be conditioned?',
      severity: 'info'
    },
    {
      topic: 'Storm Chasers',
      concern: 'Storm chasers target Mississippi after hurricanes and storms',
      redditTakeaway: 'After storms, out-of-state contractors flood in. Reddit strongly warns to verify licenses and use local contractors.',
      questionToAsk: 'How long have you been in Mississippi? Can you provide local references?',
      severity: 'warning'
    },
    {
      topic: 'HVAC & Dehumidification',
      concern: 'AC must handle extreme cooling and dehumidification loads',
      redditTakeaway: 'AC runs constantly. Reddit emphasizes proper sizing and variable-speed systems for humidity control.',
      questionToAsk: 'Will a Manual J be done? Is a variable-speed system included?',
      severity: 'info'
    },
    {
      topic: 'Historic Preservation',
      concern: 'Natchez, Vicksburg, and other areas have historic districts',
      redditTakeaway: 'Historic districts have exterior approval requirements. Reddit recommends checking before planning visible work.',
      questionToAsk: 'Is this in a historic district? What approvals are needed?',
      severity: 'info'
    },
    {
      topic: 'Energy Rebates',
      concern: 'Mississippi utilities offer efficiency rebates',
      redditTakeaway: 'Entergy and Mississippi Power offer rebates. Reddit recommends checking before purchasing equipment.',
      questionToAsk: 'What utility rebates are available?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after hurricanes—very common',
    'Unlicensed contractors claiming threshold doesn\'t apply',
    'Termite treatment upselling',
    'Crawl space scare tactics',
    'Foundation repair scams'
  ],
  licensingNotes: 'Mississippi requires licensing for residential work over $50,000—verify at msboc.us. Lower thresholds for some trades. Electricians, plumbers, and HVAC need state licenses.'
};

// Kansas-specific insights
export const KANSAS_INSIGHTS: RegionalInsightsData = {
  stateName: 'Kansas',
  stateCode: 'KS',
  climate: 'Humid Continental (east) to Semi-Arid (west)',
  overview: 'Kansas homeowners face extreme weather including tornadoes and hail, wide temperature swings, and radon concerns. The state has no general contractor licensing requirement, making due diligence essential. Storm damage is a regular occurrence.',
  insights: [
    {
      topic: 'No Statewide Contractor License',
      concern: 'Kansas has no statewide general contractor licensing',
      redditTakeaway: 'Kansas doesn\'t require GC licenses at the state level. Wichita, Kansas City area, and some cities have local requirements. Reddit strongly emphasizes verifying insurance.',
      questionToAsk: 'Are you registered locally if required? Can you provide proof of insurance and workers\' comp?',
      severity: 'warning'
    },
    {
      topic: 'Tornado Preparedness',
      concern: 'Kansas is in Tornado Alley with significant tornado risk',
      redditTakeaway: 'Kansas sees major tornadoes. Reddit strongly recommends FEMA-rated safe rooms, wind-rated garage doors, and proper roof tie-downs.',
      questionToAsk: 'Should a safe room be included? Are materials wind-rated?',
      severity: 'critical'
    },
    {
      topic: 'Hail Damage & Roofing',
      concern: 'Kansas experiences severe hail storms regularly',
      redditTakeaway: 'Hail damage is nearly inevitable over time. Reddit recommends impact-resistant roofing (Class 4) for insurance discounts.',
      questionToAsk: 'Are impact-resistant shingles included? What is the impact rating?',
      severity: 'warning'
    },
    {
      topic: 'Storm Chasers',
      concern: 'Storm chasers flood Kansas after severe weather',
      redditTakeaway: 'After every storm, out-of-state contractors appear. Reddit strongly warns to use local contractors and verify insurance.',
      questionToAsk: 'How long have you been working in Kansas? Can you provide local references?',
      severity: 'warning'
    },
    {
      topic: 'Radon Testing',
      concern: 'Kansas has elevated radon in many areas',
      redditTakeaway: 'Kansas has significant radon, especially in the eastern half. Reddit recommends testing before basement work.',
      questionToAsk: 'Has radon testing been done? Should mitigation be included?',
      severity: 'warning'
    },
    {
      topic: 'Extreme Temperature Swings',
      concern: 'Kansas temperatures range from -10°F to 110°F',
      redditTakeaway: 'The extreme temperature range stresses materials and HVAC. Reddit emphasizes proper insulation and quality equipment.',
      questionToAsk: 'Are materials rated for temperature extremes? Is insulation adequate?',
      severity: 'info'
    },
    {
      topic: 'Basement Moisture',
      concern: 'Kansas basements commonly have moisture issues',
      redditTakeaway: 'Wet basements are common. Reddit recommends proper drainage and sump pump systems with battery backup.',
      questionToAsk: 'What\'s causing the moisture? Will there be battery backup?',
      severity: 'info'
    },
    {
      topic: 'Foundation & Clay Soil',
      concern: 'Kansas clay soils cause foundation movement',
      redditTakeaway: 'Expansive clay affects foundations. Reddit recommends proper drainage management.',
      questionToAsk: 'How will drainage be addressed? Should a structural engineer review?',
      severity: 'info'
    },
    {
      topic: 'Energy Efficiency',
      concern: 'Kansas climate extremes make efficiency important',
      redditTakeaway: 'Heating and cooling costs add up. Evergy and other utilities offer rebates.',
      questionToAsk: 'What utility rebates are available? What efficiency measures are included?',
      severity: 'info'
    },
    {
      topic: 'Insurance Considerations',
      concern: 'Kansas has expensive property insurance due to storms',
      redditTakeaway: 'Storm damage drives up insurance costs. Impact-resistant roofing and safe rooms can reduce premiums.',
      questionToAsk: 'Will this work qualify for insurance discounts?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after tornado and hail damage—extremely common',
    'Roofing companies that collect insurance and disappear',
    'Unlicensed contractors with no accountability',
    'Safe room companies with substandard products',
    'Foundation repair scare tactics'
  ],
  licensingNotes: 'Kansas has no statewide general contractor license. Wichita and Kansas City area have local requirements. Electricians and plumbers need state licenses. Always verify insurance—this is your main protection.'
};

// New Mexico-specific insights
export const NEW_MEXICO_INSIGHTS: RegionalInsightsData = {
  stateName: 'New Mexico',
  stateCode: 'NM',
  climate: 'Arid to Semi-Arid',
  overview: 'New Mexico homeowners face extreme sun exposure, high altitude challenges, and adobe/stucco maintenance needs. The state requires contractor licensing through CID. Water scarcity and wildfire risk affect many areas.',
  insights: [
    {
      topic: 'State Contractor Licensing',
      concern: 'New Mexico requires contractor licensing through CID',
      redditTakeaway: 'New Mexico Construction Industries Division (CID) licenses contractors—verify at rld.nm.gov. Different classifications exist for different work types.',
      questionToAsk: 'What is your New Mexico contractor license number? Is it the right classification?',
      severity: 'warning'
    },
    {
      topic: 'Adobe & Stucco Construction',
      concern: 'New Mexico has unique adobe and stucco building traditions',
      redditTakeaway: 'Adobe and stucco require specific maintenance and repair techniques. Reddit recommends contractors experienced with traditional New Mexico construction.',
      questionToAsk: 'Do you have experience with adobe/stucco? What repair methods will you use?',
      severity: 'info'
    },
    {
      topic: 'Extreme UV & Sun Exposure',
      concern: 'High altitude means intense UV exposure',
      redditTakeaway: 'UV degrades materials faster at altitude. Reddit recommends UV-resistant materials, quality sealants, and understanding accelerated wear.',
      questionToAsk: 'Are materials rated for high UV exposure? What maintenance is expected?',
      severity: 'warning'
    },
    {
      topic: 'Water Scarcity & Conservation',
      concern: 'New Mexico has severe water restrictions',
      redditTakeaway: 'Water is extremely limited. Xeriscaping is common or required. Reddit notes that rainwater harvesting is encouraged.',
      questionToAsk: 'Does this comply with water restrictions? Is rainwater harvesting included?',
      severity: 'info'
    },
    {
      topic: 'High Altitude Construction',
      concern: 'Much of New Mexico is at high altitude',
      redditTakeaway: 'Santa Fe and mountain areas need altitude-adjusted appliances. Concrete curing is affected. Reddit recommends experienced contractors.',
      questionToAsk: 'Are appliances altitude-rated? How does altitude affect this work?',
      severity: 'info'
    },
    {
      topic: 'Wildfire Risk',
      concern: 'Northern New Mexico faces significant wildfire risk',
      redditTakeaway: 'Wildfire zones have building requirements. Reddit recommends fire-resistant materials, Class A roofing, and defensible space.',
      questionToAsk: 'Is this in a wildfire risk zone? Are materials fire-resistant?',
      severity: 'warning'
    },
    {
      topic: 'Historic Districts',
      concern: 'Santa Fe and other areas have strict historic requirements',
      redditTakeaway: 'Santa Fe Historic Districts have very specific style requirements. Reddit notes that approval is required for visible changes.',
      questionToAsk: 'Is this in a historic district? What approvals are required?',
      severity: 'info'
    },
    {
      topic: 'Flat Roof Challenges',
      concern: 'Traditional flat roofs require proper maintenance',
      redditTakeaway: 'Flat roofs are traditional but need proper drainage and regular sealing. Reddit emphasizes proper slope and quality membranes.',
      questionToAsk: 'What flat roof system is specified? What maintenance is required?',
      severity: 'info'
    },
    {
      topic: 'Freeze-Thaw at Altitude',
      concern: 'Mountain areas experience freeze-thaw cycles',
      redditTakeaway: 'Santa Fe and mountains see significant freeze-thaw. Reddit recommends proper drainage and appropriate materials.',
      questionToAsk: 'Are materials rated for freeze-thaw? How is drainage addressed?',
      severity: 'info'
    },
    {
      topic: 'Energy Rebates',
      concern: 'New Mexico utilities offer efficiency rebates',
      redditTakeaway: 'PNM and other utilities offer rebates. Solar incentives are significant. Reddit recommends checking before purchasing.',
      questionToAsk: 'What utility rebates are available? Are solar incentives applicable?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Adobe repair contractors without proper experience',
    'Storm chasers after hail damage',
    'Unlicensed contractors claiming license isn\'t needed',
    'Solar installers with unrealistic production claims',
    'Stucco contractors using inappropriate materials'
  ],
  licensingNotes: 'New Mexico CID licenses contractors—verify at rld.nm.gov. Different classifications exist. Electricians, plumbers, and HVAC need separate licenses.'
};

// Nebraska-specific insights
export const NEBRASKA_INSIGHTS: RegionalInsightsData = {
  stateName: 'Nebraska',
  stateCode: 'NE',
  climate: 'Humid Continental (east) to Semi-Arid (west)',
  overview: 'Nebraska homeowners face extreme temperature swings, severe storms including tornadoes, and radon concerns. The state has no general contractor licensing requirement, making due diligence essential.',
  insights: [
    {
      topic: 'No Statewide Contractor License',
      concern: 'Nebraska has no statewide general contractor licensing',
      redditTakeaway: 'Nebraska doesn\'t require GC licenses at state level. Omaha and Lincoln have local requirements. Reddit strongly emphasizes verifying insurance.',
      questionToAsk: 'Are you registered locally if required? Can you provide proof of insurance and workers\' comp?',
      severity: 'warning'
    },
    {
      topic: 'Severe Weather & Tornadoes',
      concern: 'Nebraska experiences tornadoes and severe storms',
      redditTakeaway: 'Nebraska sees significant severe weather. Reddit recommends safe rooms, wind-rated materials, and proper roof tie-downs.',
      questionToAsk: 'Should a safe room be considered? Are materials wind-rated?',
      severity: 'warning'
    },
    {
      topic: 'Radon Testing',
      concern: 'Nebraska has elevated radon levels',
      redditTakeaway: 'Nebraska has significant radon throughout the state. Reddit recommends testing before basement work.',
      questionToAsk: 'Has radon testing been done? Should mitigation be included?',
      severity: 'warning'
    },
    {
      topic: 'Extreme Temperature Range',
      concern: 'Nebraska temperatures range from -20°F to 105°F',
      redditTakeaway: 'The extreme range stresses materials and HVAC. Reddit emphasizes proper insulation and quality equipment.',
      questionToAsk: 'Are materials rated for temperature extremes? Is insulation adequate?',
      severity: 'info'
    },
    {
      topic: 'Hail Damage',
      concern: 'Nebraska experiences frequent hail storms',
      redditTakeaway: 'Hail damage is common. Reddit recommends impact-resistant roofing for insurance discounts.',
      questionToAsk: 'Are impact-resistant shingles included?',
      severity: 'info'
    },
    {
      topic: 'Basement Moisture',
      concern: 'Nebraska basements commonly have moisture issues',
      redditTakeaway: 'Wet basements are common. Reddit recommends proper drainage and sump pumps with battery backup.',
      questionToAsk: 'What\'s causing the moisture? Will there be battery backup?',
      severity: 'info'
    },
    {
      topic: 'Storm Chasers',
      concern: 'Storm chasers target Nebraska after severe weather',
      redditTakeaway: 'After storms, out-of-state contractors appear. Reddit warns to use local contractors.',
      questionToAsk: 'How long have you been in Nebraska? Can you provide local references?',
      severity: 'warning'
    },
    {
      topic: 'Energy Efficiency',
      concern: 'Nebraska climate makes efficiency important',
      redditTakeaway: 'OPPD and other utilities offer rebates. Reddit recommends maximizing insulation.',
      questionToAsk: 'What utility rebates are available?',
      severity: 'info'
    },
    {
      topic: 'Permit Requirements Vary',
      concern: 'Permit requirements vary across Nebraska',
      redditTakeaway: 'Omaha and Lincoln have requirements; rural areas may have minimal oversight.',
      questionToAsk: 'What permits are required? Who handles permits?',
      severity: 'info'
    },
    {
      topic: 'Historic Districts',
      concern: 'Omaha has historic neighborhoods',
      redditTakeaway: 'Some Omaha areas have historic requirements. Reddit recommends checking before exterior work.',
      questionToAsk: 'Is this in a historic district? What approvals are needed?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after tornado and hail damage',
    'Unlicensed contractors with no accountability',
    'Roofing companies that disappear after deposits',
    'Basement waterproofing high-pressure sales',
    'Foundation repair scare tactics'
  ],
  licensingNotes: 'Nebraska has no statewide GC license. Omaha and Lincoln have local requirements. Electricians and plumbers need state licenses. Always verify insurance.'
};

// West Virginia-specific insights
export const WEST_VIRGINIA_INSIGHTS: RegionalInsightsData = {
  stateName: 'West Virginia',
  stateCode: 'WV',
  climate: 'Humid Continental',
  overview: 'West Virginia homeowners face mountainous terrain challenges, radon concerns, and issues related to former coal mining. The state requires contractor licensing. The terrain creates unique building and drainage situations.',
  insights: [
    {
      topic: 'State Contractor Licensing',
      concern: 'West Virginia requires contractor licensing',
      redditTakeaway: 'West Virginia Division of Labor licenses contractors—verify at labor.wv.gov. Required for work over $2,500.',
      questionToAsk: 'What is your West Virginia contractor license number?',
      severity: 'warning'
    },
    {
      topic: 'Mountainous Terrain',
      concern: 'West Virginia\'s terrain creates unique building challenges',
      redditTakeaway: 'Steep lots, rock excavation, and drainage are common concerns. Reddit recommends contractors experienced with mountain building.',
      questionToAsk: 'Do you have mountain building experience? How will drainage be handled?',
      severity: 'warning'
    },
    {
      topic: 'Radon Testing',
      concern: 'West Virginia has elevated radon in many areas',
      redditTakeaway: 'West Virginia has significant radon. Reddit recommends testing before basement work.',
      questionToAsk: 'Has radon testing been done? Should mitigation be included?',
      severity: 'warning'
    },
    {
      topic: 'Mine Subsidence',
      concern: 'Coal mining regions have subsidence risk',
      redditTakeaway: 'Underground mine voids exist throughout the state. Reddit recommends checking mine maps for major work.',
      questionToAsk: 'Has mine subsidence risk been evaluated?',
      severity: 'critical'
    },
    {
      topic: 'Basement & Foundation Moisture',
      concern: 'Mountain terrain and springs create moisture issues',
      redditTakeaway: 'Underground springs and slope drainage affect basements. Reddit emphasizes proper waterproofing.',
      questionToAsk: 'What waterproofing system is proposed? Are there springs?',
      severity: 'info'
    },
    {
      topic: 'Septic & Well Systems',
      concern: 'Rural areas rely on wells and septic',
      redditTakeaway: 'Mountain terrain affects septic design. Reddit recommends proper engineering for these systems.',
      questionToAsk: 'Is the septic system adequate? Has soil been tested?',
      severity: 'info'
    },
    {
      topic: 'Energy Efficiency',
      concern: 'West Virginia winters require good efficiency',
      redditTakeaway: 'Heating costs can be high. Utilities offer rebates. Reddit recommends maximizing insulation.',
      questionToAsk: 'What utility rebates are available? Is insulation adequate?',
      severity: 'info'
    },
    {
      topic: 'Flood Risk',
      concern: 'Mountain valleys and streams create flood risk',
      redditTakeaway: 'Flash flooding is a concern in valleys. Reddit recommends checking flood zone status.',
      questionToAsk: 'Is this in a flood zone? What flood protection is needed?',
      severity: 'info'
    },
    {
      topic: 'Historic Preservation',
      concern: 'Charleston and other towns have historic areas',
      redditTakeaway: 'Some areas have historic requirements. Reddit recommends checking before exterior work.',
      questionToAsk: 'Is this in a historic district? What approvals are needed?',
      severity: 'info'
    },
    {
      topic: 'Permit Requirements',
      concern: 'Permit enforcement varies by county',
      redditTakeaway: 'Urban areas enforce permits; rural areas may have minimal oversight.',
      questionToAsk: 'What permits are required? Who handles permits?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm damage contractors after flooding',
    'Foundation repair scare tactics',
    'Unlicensed contractors in rural areas',
    'Well and septic contractors without proper credentials',
    'Coal property remediation scams'
  ],
  licensingNotes: 'West Virginia requires contractor licensing for work over $2,500—verify at labor.wv.gov. Electricians and plumbers need state licenses.'
};

// Idaho-specific insights
export const IDAHO_INSIGHTS: RegionalInsightsData = {
  stateName: 'Idaho',
  stateCode: 'ID',
  climate: 'Semi-Arid (south) to Continental (north)',
  overview: 'Idaho homeowners face rapid growth, wildfire risk, and varying conditions from desert to mountain. The state requires contractor registration through DBS. Boise area has seen explosive growth with associated quality concerns.',
  insights: [
    {
      topic: 'State Contractor Registration',
      concern: 'Idaho requires contractor registration through DBS',
      redditTakeaway: 'Idaho Division of Building Safety requires registration—verify at dbs.idaho.gov. Public works requires additional licensing.',
      questionToAsk: 'What is your Idaho contractor registration number?',
      severity: 'warning'
    },
    {
      topic: 'Rapid Growth Quality Issues',
      concern: 'Boise area growth has created quality concerns',
      redditTakeaway: 'Fast-paced construction leads to shortcuts. Reddit recommends careful inspections and established contractors.',
      questionToAsk: 'How long have you been in Idaho? What quality controls are in place?',
      severity: 'warning'
    },
    {
      topic: 'Wildfire Risk',
      concern: 'Much of Idaho faces wildfire risk',
      redditTakeaway: 'Wildfire zones have building requirements. Reddit recommends fire-resistant materials and defensible space.',
      questionToAsk: 'Is this in a wildfire risk zone? Are materials fire-resistant?',
      severity: 'warning'
    },
    {
      topic: 'Radon Testing',
      concern: 'Idaho has elevated radon in many areas',
      redditTakeaway: 'Idaho has significant radon. Reddit recommends testing before basement finishing.',
      questionToAsk: 'Has radon testing been done? Should mitigation be included?',
      severity: 'warning'
    },
    {
      topic: 'Extreme Temperature Range',
      concern: 'Idaho sees wide temperature swings',
      redditTakeaway: 'Temperatures vary significantly. Reddit emphasizes proper insulation and quality materials.',
      questionToAsk: 'Are materials rated for temperature extremes? Is insulation adequate?',
      severity: 'info'
    },
    {
      topic: 'Mountain Building',
      concern: 'Mountain communities have specific challenges',
      redditTakeaway: 'Sun Valley and mountain areas need experienced contractors. Altitude affects construction.',
      questionToAsk: 'Do you have mountain building experience?',
      severity: 'info'
    },
    {
      topic: 'Water & Septic',
      concern: 'Rural areas rely on wells and septic',
      redditTakeaway: 'Well and septic systems are common outside cities. Proper engineering is essential.',
      questionToAsk: 'Is the water/septic system adequate?',
      severity: 'info'
    },
    {
      topic: 'Energy Efficiency',
      concern: 'Idaho winters require good efficiency',
      redditTakeaway: 'Idaho Power offers rebates. Reddit recommends maximizing insulation.',
      questionToAsk: 'What utility rebates are available?',
      severity: 'info'
    },
    {
      topic: 'HOA Communities',
      concern: 'Boise suburbs have extensive HOAs',
      redditTakeaway: 'New developments have HOAs with architectural requirements. Reddit recommends checking rules first.',
      questionToAsk: 'Have you reviewed HOA requirements?',
      severity: 'info'
    },
    {
      topic: 'Permit Requirements',
      concern: 'Permit requirements vary across Idaho',
      redditTakeaway: 'Boise area has requirements; rural areas may have minimal oversight.',
      questionToAsk: 'What permits are required?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Fly-by-night contractors during boom periods',
    'Wildfire remediation scams',
    'Unregistered contractors',
    'Foundation repair scare tactics',
    'Well and septic scams'
  ],
  licensingNotes: 'Idaho requires contractor registration through DBS—verify at dbs.idaho.gov. Electricians and plumbers need state licenses.'
};

// Hawaii-specific insights
export const HAWAII_INSIGHTS: RegionalInsightsData = {
  stateName: 'Hawaii',
  stateCode: 'HI',
  climate: 'Tropical',
  overview: 'Hawaii homeowners face unique challenges from tropical humidity, salt air corrosion, lava zones, and extremely high construction costs. The state requires contractor licensing through DCCA. Materials must be shipped, adding cost and lead time.',
  insights: [
    {
      topic: 'State Contractor Licensing',
      concern: 'Hawaii requires contractor licensing through DCCA',
      redditTakeaway: 'Hawaii DCCA licenses contractors—verify at cca.hawaii.gov/pvl. License classification must match work type.',
      questionToAsk: 'What is your Hawaii contractor license number? Is it the right classification?',
      severity: 'warning'
    },
    {
      topic: 'Extremely High Costs',
      concern: 'Hawaii has the highest construction costs in the US',
      redditTakeaway: 'Materials ship from mainland, labor is expensive. Reddit notes costs are 50-100% above mainland. Low bids are major red flags.',
      questionToAsk: 'Does this bid reflect Hawaii costs? How are materials being sourced?',
      severity: 'critical'
    },
    {
      topic: 'Salt Air Corrosion',
      concern: 'Salt air destroys materials not designed for coastal exposure',
      redditTakeaway: 'Salt corrodes metal rapidly. Reddit strongly recommends marine-grade hardware, stainless steel, and corrosion-resistant materials.',
      questionToAsk: 'Are materials rated for salt air exposure? What corrosion protection is included?',
      severity: 'critical'
    },
    {
      topic: 'Humidity & Moisture',
      concern: 'Tropical humidity creates constant moisture challenges',
      redditTakeaway: 'Humidity is relentless. Reddit emphasizes ventilation, moisture-resistant materials, and mold prevention strategies.',
      questionToAsk: 'How will moisture be controlled? Is ventilation adequate?',
      severity: 'warning'
    },
    {
      topic: 'Lava Zones (Big Island)',
      concern: 'Big Island has active lava zones affecting insurance',
      redditTakeaway: 'Lava zones affect property values and insurance availability. Reddit recommends understanding zone ratings.',
      questionToAsk: 'What lava zone is this property in? How does it affect the project?',
      severity: 'warning'
    },
    {
      topic: 'Hurricane Preparedness',
      concern: 'Hawaii faces hurricane risk',
      redditTakeaway: 'Hawaii sees occasional hurricanes. Reddit recommends hurricane straps, impact-resistant features, and proper tie-downs.',
      questionToAsk: 'What hurricane-resistant features are included?',
      severity: 'info'
    },
    {
      topic: 'Termite Pressure',
      concern: 'Hawaii has severe termite problems including drywood termites',
      redditTakeaway: 'Termites are extremely active. Reddit strongly recommends treatment plans and termite-resistant materials.',
      questionToAsk: 'What termite prevention is included?',
      severity: 'warning'
    },
    {
      topic: 'Material Lead Times',
      concern: 'Materials must ship from mainland',
      redditTakeaway: 'Shipping adds weeks to timelines. Reddit recommends planning for delays and ordering early.',
      questionToAsk: 'What is the timeline for material delivery? Are backups available locally?',
      severity: 'info'
    },
    {
      topic: 'Permit Requirements',
      concern: 'Hawaii has strict permit requirements',
      redditTakeaway: 'Each county has requirements. Honolulu (Oahu) is particularly strict. Reddit emphasizes getting proper permits.',
      questionToAsk: 'What permits are required? Who handles the permit process?',
      severity: 'info'
    },
    {
      topic: 'Historic Districts',
      concern: 'Hawaii has historic preservation requirements',
      redditTakeaway: 'Some areas have historic requirements, especially in Honolulu. Reddit recommends checking before exterior work.',
      questionToAsk: 'Is this in a historic district? What approvals are needed?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Mainland contractors who underestimate Hawaii costs',
    'Unlicensed handymen doing major work',
    'Materials not rated for salt air',
    'Termite treatment companies with inadequate plans',
    'Storm damage repair scams'
  ],
  licensingNotes: 'Hawaii DCCA licenses contractors—verify at cca.hawaii.gov/pvl. Classification must match work type. Very high costs are normal; low bids indicate problems.'
};

// New Hampshire-specific insights
export const NEW_HAMPSHIRE_INSIGHTS: RegionalInsightsData = {
  stateName: 'New Hampshire',
  stateCode: 'NH',
  climate: 'Humid Continental with Cold Winters',
  overview: 'New Hampshire homeowners face harsh winters, ice dam issues, and radon concerns. The state has no general contractor licensing requirement, making due diligence essential. Lake regions and mountains have specific considerations.',
  insights: [
    {
      topic: 'No Statewide Contractor License',
      concern: 'New Hampshire has no statewide general contractor licensing',
      redditTakeaway: 'NH doesn\'t require GC licenses. Some towns have local requirements. Reddit strongly emphasizes checking insurance and references.',
      questionToAsk: 'Can you provide proof of insurance and workers\' comp? Do you have local references?',
      severity: 'warning'
    },
    {
      topic: 'Harsh Winters & Ice Dams',
      concern: 'New Hampshire winters create significant ice dam risk',
      redditTakeaway: 'Ice dams cause major damage. Reddit strongly recommends proper attic insulation and ventilation, plus ice/water shield extending past eaves.',
      questionToAsk: 'What ice dam prevention is included? Is attic ventilation adequate?',
      severity: 'warning'
    },
    {
      topic: 'Radon Testing',
      concern: 'New Hampshire has elevated radon',
      redditTakeaway: 'NH has significant radon. Reddit recommends testing before basement work.',
      questionToAsk: 'Has radon testing been done? Should mitigation be included?',
      severity: 'warning'
    },
    {
      topic: 'Extreme Cold Construction',
      concern: 'NH winters require excellent insulation',
      redditTakeaway: 'Temperatures drop well below zero. Reddit emphasizes high R-value insulation and proper air sealing.',
      questionToAsk: 'What insulation R-values are specified? Is air sealing included?',
      severity: 'info'
    },
    {
      topic: 'Basement Moisture',
      concern: 'NH basements commonly have moisture issues',
      redditTakeaway: 'Wet basements are common. Reddit recommends proper drainage and sump pumps.',
      questionToAsk: 'What\'s causing the moisture? Will there be battery backup?',
      severity: 'info'
    },
    {
      topic: 'Lake Region Considerations',
      concern: 'Lakes region has waterfront building rules',
      redditTakeaway: 'Shoreland protection affects lakefront properties. Reddit notes setback and buffer requirements.',
      questionToAsk: 'Does this comply with shoreland regulations?',
      severity: 'info'
    },
    {
      topic: 'Mountain Building',
      concern: 'White Mountains have specific challenges',
      redditTakeaway: 'Mountain areas face extreme weather and access issues. Reddit recommends experienced contractors.',
      questionToAsk: 'Do you have mountain building experience?',
      severity: 'info'
    },
    {
      topic: 'Historic Preservation',
      concern: 'NH has historic districts in many towns',
      redditTakeaway: 'Portsmouth and other towns have historic requirements. Reddit recommends checking before exterior work.',
      questionToAsk: 'Is this in a historic district? What approvals are needed?',
      severity: 'info'
    },
    {
      topic: 'Energy Efficiency',
      concern: 'NH cold climate makes efficiency important',
      redditTakeaway: 'Utilities offer rebates. NHSaves program provides incentives. Reddit recommends maximizing insulation.',
      questionToAsk: 'What NHSaves rebates are available?',
      severity: 'info'
    },
    {
      topic: 'Septic Systems',
      concern: 'Many NH properties use septic',
      redditTakeaway: 'Septic systems are common outside cities. Proper design for NH soil conditions is essential.',
      questionToAsk: 'Is the septic system adequate for this project?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after winter damage',
    'Unlicensed contractors with no accountability',
    'Basement waterproofing high-pressure sales',
    'Ice dam "repair" services that don\'t fix root causes',
    'Lake property contractors without proper experience'
  ],
  licensingNotes: 'NH has no statewide GC license. Electricians and plumbers need state licenses. Always verify insurance—this is your main protection.'
};

// Maine-specific insights
export const MAINE_INSIGHTS: RegionalInsightsData = {
  stateName: 'Maine',
  stateCode: 'ME',
  climate: 'Humid Continental with Cold Winters',
  overview: 'Maine homeowners face harsh winters, coastal challenges, and older housing stock. The state has no general contractor licensing requirement. Coastal areas deal with salt air, while inland areas face extreme cold.',
  insights: [
    {
      topic: 'No Statewide Contractor License',
      concern: 'Maine has no statewide general contractor licensing',
      redditTakeaway: 'Maine doesn\'t require GC licenses. Some municipalities have requirements. Reddit strongly emphasizes checking insurance.',
      questionToAsk: 'Can you provide proof of insurance and workers\' comp? Do you have local references?',
      severity: 'warning'
    },
    {
      topic: 'Harsh Winters & Ice Dams',
      concern: 'Maine winters create significant ice dam risk',
      redditTakeaway: 'Ice dams cause major damage. Reddit strongly recommends proper attic insulation and ventilation.',
      questionToAsk: 'What ice dam prevention is included? Is attic ventilation adequate?',
      severity: 'warning'
    },
    {
      topic: 'Coastal Salt Air',
      concern: 'Coastal Maine deals with salt air corrosion',
      redditTakeaway: 'Salt corrodes materials. Reddit recommends corrosion-resistant hardware and materials for coastal properties.',
      questionToAsk: 'Are materials rated for salt air exposure?',
      severity: 'warning'
    },
    {
      topic: 'Radon Testing',
      concern: 'Maine has elevated radon in many areas',
      redditTakeaway: 'Maine has significant radon. Reddit recommends testing before basement work.',
      questionToAsk: 'Has radon testing been done? Should mitigation be included?',
      severity: 'warning'
    },
    {
      topic: 'Older Housing Stock',
      concern: 'Maine has many older homes with associated challenges',
      redditTakeaway: 'Lead paint, asbestos, and outdated systems are common. Reddit recommends testing in older homes.',
      questionToAsk: 'Are you EPA Lead-Safe certified? Has testing been done?',
      severity: 'info'
    },
    {
      topic: 'Extreme Cold Construction',
      concern: 'Maine winters require excellent insulation',
      redditTakeaway: 'Northern Maine sees extreme cold. Reddit emphasizes high R-value insulation and proper air sealing.',
      questionToAsk: 'What insulation R-values are specified?',
      severity: 'info'
    },
    {
      topic: 'Shoreland Zoning',
      concern: 'Maine has strict shoreland zoning rules',
      redditTakeaway: 'Waterfront properties have setback and buffer requirements. Reddit notes permits are required.',
      questionToAsk: 'Does this comply with shoreland zoning?',
      severity: 'info'
    },
    {
      topic: 'Energy Efficiency',
      concern: 'Maine cold climate makes efficiency important',
      redditTakeaway: 'Efficiency Maine offers substantial rebates. Reddit strongly recommends checking before purchasing.',
      questionToAsk: 'What Efficiency Maine rebates are available?',
      severity: 'info'
    },
    {
      topic: 'Septic & Well',
      concern: 'Rural Maine relies on wells and septic',
      redditTakeaway: 'Many properties use private systems. Proper design for Maine conditions is essential.',
      questionToAsk: 'Are water and septic systems adequate?',
      severity: 'info'
    },
    {
      topic: 'Historic Preservation',
      concern: 'Maine has historic districts in many towns',
      redditTakeaway: 'Portland and coastal towns have historic requirements. Reddit recommends checking before exterior work.',
      questionToAsk: 'Is this in a historic district?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after winter damage',
    'Unlicensed contractors with no accountability',
    'Basement waterproofing high-pressure sales',
    'Coastal contractors without salt air experience',
    'Oil tank removal issues'
  ],
  licensingNotes: 'Maine has no statewide GC license. Electricians and plumbers need state licenses. Always verify insurance.'
};

// Montana-specific insights
export const MONTANA_INSIGHTS: RegionalInsightsData = {
  stateName: 'Montana',
  stateCode: 'MT',
  climate: 'Semi-Arid to Continental',
  overview: 'Montana homeowners face extreme cold, wildfire risk, and remote location challenges. The state has no general contractor licensing requirement. Mountain areas and the western forests have specific concerns.',
  insights: [
    {
      topic: 'No Statewide Contractor License',
      concern: 'Montana has no statewide general contractor licensing',
      redditTakeaway: 'Montana doesn\'t require GC licenses. Some cities have requirements. Reddit strongly emphasizes checking insurance.',
      questionToAsk: 'Can you provide proof of insurance and workers\' comp?',
      severity: 'warning'
    },
    {
      topic: 'Extreme Cold Construction',
      concern: 'Montana winters are severe',
      redditTakeaway: 'Temperatures drop well below zero. Reddit emphasizes high R-value insulation, proper air sealing, and quality heating systems.',
      questionToAsk: 'What insulation R-values are specified? Is equipment rated for extreme cold?',
      severity: 'warning'
    },
    {
      topic: 'Wildfire Risk',
      concern: 'Western Montana faces significant wildfire risk',
      redditTakeaway: 'Wildfire zones have building requirements. Reddit recommends fire-resistant materials and defensible space.',
      questionToAsk: 'Is this in a wildfire risk zone? Are materials fire-resistant?',
      severity: 'critical'
    },
    {
      topic: 'Remote Location Challenges',
      concern: 'Many Montana properties are remote',
      redditTakeaway: 'Remote locations add to costs and timelines. Reddit notes access and material delivery challenges.',
      questionToAsk: 'How does the location affect cost and timeline?',
      severity: 'info'
    },
    {
      topic: 'Radon Testing',
      concern: 'Montana has elevated radon in some areas',
      redditTakeaway: 'Parts of Montana have significant radon. Reddit recommends testing before basement work.',
      questionToAsk: 'Has radon testing been done?',
      severity: 'info'
    },
    {
      topic: 'Well & Septic Systems',
      concern: 'Rural Montana relies on wells and septic',
      redditTakeaway: 'Most rural properties use private systems. Proper design for Montana conditions is essential.',
      questionToAsk: 'Are water and septic systems adequate?',
      severity: 'info'
    },
    {
      topic: 'Mountain Building',
      concern: 'Mountain areas have specific challenges',
      redditTakeaway: 'Big Sky and mountain areas need experienced contractors. Altitude affects construction.',
      questionToAsk: 'Do you have mountain building experience?',
      severity: 'info'
    },
    {
      topic: 'Energy Efficiency',
      concern: 'Montana cold makes efficiency important',
      redditTakeaway: 'NorthWestern Energy offers rebates. Reddit recommends maximizing insulation.',
      questionToAsk: 'What utility rebates are available?',
      severity: 'info'
    },
    {
      topic: 'Freeze-Thaw Damage',
      concern: 'Montana freeze-thaw cycles stress materials',
      redditTakeaway: 'Proper drainage and appropriate materials prevent freeze-thaw damage.',
      questionToAsk: 'Are materials rated for freeze-thaw?',
      severity: 'info'
    },
    {
      topic: 'Historic Preservation',
      concern: 'Some Montana towns have historic areas',
      redditTakeaway: 'Butte and other towns have historic districts. Reddit recommends checking before exterior work.',
      questionToAsk: 'Is this in a historic district?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Wildfire remediation scams',
    'Unlicensed contractors with no accountability',
    'Well and septic scams',
    'Remote property contractors who disappear',
    'Foundation repair scare tactics'
  ],
  licensingNotes: 'Montana has no statewide GC license. Electricians and plumbers need state licenses. Always verify insurance.'
};

// Rhode Island-specific insights
export const RHODE_ISLAND_INSIGHTS: RegionalInsightsData = {
  stateName: 'Rhode Island',
  stateCode: 'RI',
  climate: 'Humid Continental',
  overview: 'Rhode Island homeowners face coastal challenges, older housing stock, and high construction costs. The state requires contractor registration. Coastal flooding and hurricanes affect waterfront properties.',
  insights: [
    {
      topic: 'State Contractor Registration',
      concern: 'Rhode Island requires contractor registration',
      redditTakeaway: 'Rhode Island Contractors Registration Board requires registration—verify at crb.ri.gov. Registration provides consumer protection.',
      questionToAsk: 'What is your Rhode Island contractor registration number?',
      severity: 'warning'
    },
    {
      topic: 'Coastal Flood Risk',
      concern: 'Rhode Island coastline faces significant flood risk',
      redditTakeaway: 'Coastal flooding from storms is common. FEMA flood zones affect insurance and construction requirements.',
      questionToAsk: 'Is this in a flood zone? What flood-resistant features are needed?',
      severity: 'critical'
    },
    {
      topic: 'Hurricane Risk',
      concern: 'Rhode Island faces hurricane impacts',
      redditTakeaway: 'Hurricanes occasionally affect RI. Reddit recommends hurricane straps and wind-resistant features.',
      questionToAsk: 'What hurricane-resistant features are included?',
      severity: 'warning'
    },
    {
      topic: 'High Construction Costs',
      concern: 'Rhode Island has above-average construction costs',
      redditTakeaway: 'Labor costs are higher than national average. Reddit warns that very low bids usually indicate problems.',
      questionToAsk: 'Does this bid reflect Rhode Island costs?',
      severity: 'info'
    },
    {
      topic: 'Older Housing Stock',
      concern: 'Rhode Island has many older homes',
      redditTakeaway: 'Lead paint, asbestos, and outdated systems are common in older homes. Reddit recommends testing.',
      questionToAsk: 'Are you EPA Lead-Safe certified? Has testing been done?',
      severity: 'warning'
    },
    {
      topic: 'Historic Districts',
      concern: 'Providence and Newport have extensive historic districts',
      redditTakeaway: 'Newport especially has strict historic requirements. Reddit recommends checking before exterior work.',
      questionToAsk: 'Is this in a historic district? What approvals are needed?',
      severity: 'info'
    },
    {
      topic: 'Basement Moisture',
      concern: 'RI basements commonly have moisture issues',
      redditTakeaway: 'Coastal proximity increases moisture challenges. Reddit recommends proper waterproofing.',
      questionToAsk: 'What waterproofing system is proposed?',
      severity: 'info'
    },
    {
      topic: 'Radon Testing',
      concern: 'Rhode Island has radon in some areas',
      redditTakeaway: 'Radon varies by location. Reddit recommends testing before basement finishing.',
      questionToAsk: 'Has radon testing been done?',
      severity: 'info'
    },
    {
      topic: 'Energy Rebates',
      concern: 'Rhode Island offers energy efficiency rebates',
      redditTakeaway: 'National Grid and Rhode Island Energy offer rebates. Reddit recommends checking before purchasing.',
      questionToAsk: 'What utility rebates are available?',
      severity: 'info'
    },
    {
      topic: 'Ice Dam Prevention',
      concern: 'RI winters can cause ice dams',
      redditTakeaway: 'Ice dams can cause damage. Reddit recommends proper attic insulation and ventilation.',
      questionToAsk: 'What ice dam prevention is included?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after coastal storms',
    'Unregistered contractors',
    'Basement waterproofing high-pressure sales',
    'Historic district violations',
    'Flood zone manipulation'
  ],
  licensingNotes: 'Rhode Island requires contractor registration—verify at crb.ri.gov. Electricians and plumbers need state licenses.'
};

// Delaware-specific insights
export const DELAWARE_INSIGHTS: RegionalInsightsData = {
  stateName: 'Delaware',
  stateCode: 'DE',
  climate: 'Humid Subtropical',
  overview: 'Delaware homeowners face coastal challenges, humidity, and varying conditions from the beaches to the northern suburbs. The state has no general contractor licensing requirement. Beach communities have specific concerns.',
  insights: [
    {
      topic: 'No Statewide Contractor License',
      concern: 'Delaware has no statewide general contractor licensing',
      redditTakeaway: 'Delaware doesn\'t require GC licenses. Reddit strongly emphasizes checking insurance and references.',
      questionToAsk: 'Can you provide proof of insurance and workers\' comp?',
      severity: 'warning'
    },
    {
      topic: 'Coastal Flood Risk',
      concern: 'Delaware beaches face flood and storm risk',
      redditTakeaway: 'Beach communities deal with flooding and storm damage. FEMA flood zones affect requirements.',
      questionToAsk: 'Is this in a flood zone? What flood-resistant features are needed?',
      severity: 'critical'
    },
    {
      topic: 'Hurricane Risk',
      concern: 'Delaware coast faces hurricane impacts',
      redditTakeaway: 'Hurricanes occasionally affect Delaware. Reddit recommends wind-resistant features.',
      questionToAsk: 'What hurricane-resistant features are included?',
      severity: 'warning'
    },
    {
      topic: 'Salt Air Corrosion (Beaches)',
      concern: 'Beach properties face salt air corrosion',
      redditTakeaway: 'Salt corrodes materials. Reddit recommends corrosion-resistant hardware for beach properties.',
      questionToAsk: 'Are materials rated for salt air exposure?',
      severity: 'warning'
    },
    {
      topic: 'Humidity & Moisture',
      concern: 'Delaware humidity creates moisture challenges',
      redditTakeaway: 'Humidity is significant, especially near the coast. Reddit emphasizes moisture management.',
      questionToAsk: 'How will moisture be controlled?',
      severity: 'info'
    },
    {
      topic: 'Termite Awareness',
      concern: 'Delaware has moderate termite pressure',
      redditTakeaway: 'Subterranean termites are present. Reddit recommends inspections and treatment.',
      questionToAsk: 'Has a termite inspection been done?',
      severity: 'info'
    },
    {
      topic: 'Radon Testing',
      concern: 'Northern Delaware has elevated radon',
      redditTakeaway: 'New Castle County has more radon. Reddit recommends testing before basement work.',
      questionToAsk: 'Has radon testing been done?',
      severity: 'info'
    },
    {
      topic: 'Historic Districts',
      concern: 'Delaware has historic areas',
      redditTakeaway: 'New Castle and other areas have historic requirements. Reddit recommends checking before exterior work.',
      questionToAsk: 'Is this in a historic district?',
      severity: 'info'
    },
    {
      topic: 'Energy Rebates',
      concern: 'Delaware utilities offer rebates',
      redditTakeaway: 'Delmarva Power offers efficiency rebates. Reddit recommends checking before purchasing.',
      questionToAsk: 'What utility rebates are available?',
      severity: 'info'
    },
    {
      topic: 'Permit Requirements',
      concern: 'Permit requirements vary by county',
      redditTakeaway: 'New Castle County is stricter; beach towns have specific requirements.',
      questionToAsk: 'What permits are required?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after coastal storms',
    'Unlicensed contractors',
    'Beach property contractors without salt air experience',
    'Flood zone manipulation',
    'Foundation repair scare tactics'
  ],
  licensingNotes: 'Delaware has no statewide GC license. Electricians, plumbers, and HVAC need state licenses. Always verify insurance.'
};

// South Dakota-specific insights
export const SOUTH_DAKOTA_INSIGHTS: RegionalInsightsData = {
  stateName: 'South Dakota',
  stateCode: 'SD',
  climate: 'Semi-Arid to Humid Continental',
  overview: 'South Dakota homeowners face extreme temperature swings, severe storms, and radon concerns. The state has no general contractor licensing requirement. The Black Hills have different conditions than the prairie.',
  insights: [
    {
      topic: 'No Statewide Contractor License',
      concern: 'South Dakota has no statewide general contractor licensing',
      redditTakeaway: 'SD doesn\'t require GC licenses. Sioux Falls and some cities have requirements. Reddit strongly emphasizes checking insurance.',
      questionToAsk: 'Are you registered locally if required? Can you provide proof of insurance?',
      severity: 'warning'
    },
    {
      topic: 'Extreme Temperature Range',
      concern: 'South Dakota temperatures range from -30°F to 110°F',
      redditTakeaway: 'The extreme range stresses materials and HVAC. Reddit emphasizes proper insulation and quality equipment.',
      questionToAsk: 'Are materials rated for temperature extremes? Is insulation adequate?',
      severity: 'warning'
    },
    {
      topic: 'Severe Storms & Tornadoes',
      concern: 'South Dakota experiences severe storms',
      redditTakeaway: 'SD sees tornadoes and severe hail. Reddit recommends impact-resistant roofing and safe rooms.',
      questionToAsk: 'Are impact-resistant shingles included? Should a safe room be considered?',
      severity: 'warning'
    },
    {
      topic: 'Radon Testing',
      concern: 'South Dakota has elevated radon',
      redditTakeaway: 'SD has significant radon. Reddit recommends testing before basement work.',
      questionToAsk: 'Has radon testing been done? Should mitigation be included?',
      severity: 'warning'
    },
    {
      topic: 'Black Hills Considerations',
      concern: 'Black Hills have mountain building challenges',
      redditTakeaway: 'Wildfire risk, rock excavation, and drainage affect Black Hills properties.',
      questionToAsk: 'Do you have Black Hills building experience?',
      severity: 'info'
    },
    {
      topic: 'Basement Moisture',
      concern: 'SD basements can have moisture issues',
      redditTakeaway: 'Wet basements occur. Reddit recommends proper drainage and sump pumps.',
      questionToAsk: 'What\'s causing the moisture?',
      severity: 'info'
    },
    {
      topic: 'Energy Efficiency',
      concern: 'SD climate makes efficiency important',
      redditTakeaway: 'Heating and cooling costs add up. Utilities offer rebates.',
      questionToAsk: 'What utility rebates are available?',
      severity: 'info'
    },
    {
      topic: 'Storm Chasers',
      concern: 'Storm chasers target SD after severe weather',
      redditTakeaway: 'After storms, out-of-state contractors appear. Reddit warns to use local contractors.',
      questionToAsk: 'How long have you been in South Dakota?',
      severity: 'info'
    },
    {
      topic: 'Permit Requirements',
      concern: 'Permit requirements vary across SD',
      redditTakeaway: 'Sioux Falls and Rapid City have requirements; rural areas may have minimal oversight.',
      questionToAsk: 'What permits are required?',
      severity: 'info'
    },
    {
      topic: 'Well & Septic',
      concern: 'Rural SD uses wells and septic',
      redditTakeaway: 'Private systems are common. Proper design for SD conditions is essential.',
      questionToAsk: 'Are water and septic systems adequate?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after hail and tornado damage',
    'Unlicensed contractors',
    'Roofing companies that disappear',
    'Foundation repair scare tactics',
    'Well and septic scams'
  ],
  licensingNotes: 'SD has no statewide GC license. Electricians and plumbers need state licenses. Always verify insurance.'
};

// North Dakota-specific insights
export const NORTH_DAKOTA_INSIGHTS: RegionalInsightsData = {
  stateName: 'North Dakota',
  stateCode: 'ND',
  climate: 'Semi-Arid to Continental with Severe Winters',
  overview: 'North Dakota homeowners face some of the harshest winters in the US, severe storms, and radon concerns. The state requires contractor licensing. Oil boom areas have seen rapid construction.',
  insights: [
    {
      topic: 'State Contractor Licensing',
      concern: 'North Dakota requires contractor licensing',
      redditTakeaway: 'North Dakota Secretary of State licenses contractors—verify at sos.nd.gov. License is required for residential work.',
      questionToAsk: 'What is your North Dakota contractor license number?',
      severity: 'warning'
    },
    {
      topic: 'Extreme Cold Construction',
      concern: 'North Dakota winters are severe with temperatures to -40°F',
      redditTakeaway: 'Extreme cold demands exceptional insulation and air sealing. Reddit emphasizes R-60+ attic insulation and quality heating systems.',
      questionToAsk: 'What insulation R-values are specified? Is equipment rated for extreme cold?',
      severity: 'critical'
    },
    {
      topic: 'Severe Storms',
      concern: 'North Dakota experiences severe storms and tornadoes',
      redditTakeaway: 'ND sees significant severe weather. Reddit recommends safe rooms and wind-rated materials.',
      questionToAsk: 'Should a safe room be considered? Are materials wind-rated?',
      severity: 'warning'
    },
    {
      topic: 'Radon Testing',
      concern: 'North Dakota has elevated radon',
      redditTakeaway: 'ND has significant radon. Reddit strongly recommends testing before basement work.',
      questionToAsk: 'Has radon testing been done? Should mitigation be included?',
      severity: 'warning'
    },
    {
      topic: 'Oil Country Rapid Growth',
      concern: 'Western ND saw rapid construction during oil boom',
      redditTakeaway: 'Rapid construction led to quality issues. Reddit recommends careful inspections.',
      questionToAsk: 'What quality controls are in place?',
      severity: 'info'
    },
    {
      topic: 'Basement Moisture',
      concern: 'ND basements can have moisture issues',
      redditTakeaway: 'Spring snowmelt causes problems. Reddit recommends proper drainage and sump pumps.',
      questionToAsk: 'What\'s causing the moisture? Will there be battery backup?',
      severity: 'info'
    },
    {
      topic: 'Ice Dams',
      concern: 'ND winters create severe ice dam risk',
      redditTakeaway: 'Ice dams are a major issue. Reddit strongly recommends proper attic insulation and ventilation.',
      questionToAsk: 'What ice dam prevention is included?',
      severity: 'info'
    },
    {
      topic: 'Energy Efficiency',
      concern: 'ND extreme climate makes efficiency critical',
      redditTakeaway: 'Heating costs are substantial. Reddit recommends maximizing insulation and air sealing.',
      questionToAsk: 'What utility rebates are available?',
      severity: 'info'
    },
    {
      topic: 'Permit Requirements',
      concern: 'Permit requirements vary across ND',
      redditTakeaway: 'Fargo and Bismarck have requirements; rural areas may have minimal oversight.',
      questionToAsk: 'What permits are required?',
      severity: 'info'
    },
    {
      topic: 'Foundation Frost Protection',
      concern: 'Deep frost requires proper foundation design',
      redditTakeaway: 'ND frost depths are severe. Footings must be deep enough.',
      questionToAsk: 'Are footings at proper depth?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after severe weather',
    'Oil boom area contractors who disappeared',
    'Unlicensed contractors',
    'Furnace replacement scams',
    'Foundation repair scare tactics'
  ],
  licensingNotes: 'North Dakota requires contractor licensing—verify at sos.nd.gov. Electricians and plumbers need state licenses.'
};

// Alaska-specific insights
export const ALASKA_INSIGHTS: RegionalInsightsData = {
  stateName: 'Alaska',
  stateCode: 'AK',
  climate: 'Subarctic to Arctic',
  overview: 'Alaska homeowners face the most extreme conditions in the US—permafrost, extreme cold, limited daylight, and extremely high costs. The state requires contractor registration. Remote locations add significant expense.',
  insights: [
    {
      topic: 'State Contractor Registration',
      concern: 'Alaska requires contractor registration',
      redditTakeaway: 'Alaska DCBPL requires contractor registration—verify at commerce.alaska.gov. Registration is required for residential work.',
      questionToAsk: 'What is your Alaska contractor registration number?',
      severity: 'warning'
    },
    {
      topic: 'Extreme Cold Construction',
      concern: 'Alaska winters can reach -50°F or colder',
      redditTakeaway: 'Extreme cold demands exceptional insulation (R-60+ attic, R-38+ walls). Reddit emphasizes arctic-rated equipment and triple-pane windows.',
      questionToAsk: 'What insulation R-values are specified? Are materials rated for arctic conditions?',
      severity: 'critical'
    },
    {
      topic: 'Extremely High Costs',
      concern: 'Alaska has some of the highest construction costs in the US',
      redditTakeaway: 'Materials ship from the lower 48, labor is expensive. Reddit notes costs are often 50-100%+ above national average.',
      questionToAsk: 'Does this bid reflect Alaska costs? How are materials being sourced?',
      severity: 'critical'
    },
    {
      topic: 'Permafrost Concerns',
      concern: 'Permafrost affects foundation design in many areas',
      redditTakeaway: 'Building on permafrost requires specialized techniques. Climate change is affecting stability. Reddit recommends experienced engineers.',
      questionToAsk: 'Is there permafrost? What foundation design is required?',
      severity: 'critical'
    },
    {
      topic: 'Remote Location Challenges',
      concern: 'Many Alaska properties have difficult access',
      redditTakeaway: 'Remote locations require planning for material delivery. Some areas only accessible by plane or boat.',
      questionToAsk: 'How will materials be delivered? What does access add to the cost?',
      severity: 'warning'
    },
    {
      topic: 'Seismic Activity',
      concern: 'Alaska has significant earthquake risk',
      redditTakeaway: 'Alaska sees frequent earthquakes. Reddit emphasizes seismic design and proper anchoring.',
      questionToAsk: 'Does this meet seismic requirements?',
      severity: 'warning'
    },
    {
      topic: 'Limited Construction Season',
      concern: 'Winter limits construction windows',
      redditTakeaway: 'Summer is the main building season. Reddit notes projects often span multiple years.',
      questionToAsk: 'What is the realistic timeline?',
      severity: 'info'
    },
    {
      topic: 'Energy Efficiency',
      concern: 'Alaska extreme climate makes efficiency critical',
      redditTakeaway: 'Heating costs are substantial. Reddit strongly recommends maximizing insulation and air sealing.',
      questionToAsk: 'What is the projected heating cost?',
      severity: 'info'
    },
    {
      topic: 'Radon Testing',
      concern: 'Alaska has radon in some areas',
      redditTakeaway: 'Radon varies by location. Reddit recommends testing.',
      questionToAsk: 'Has radon testing been done?',
      severity: 'info'
    },
    {
      topic: 'Well & Septic',
      concern: 'Many Alaska properties use private systems',
      redditTakeaway: 'Wells and septic are common. Permafrost affects system design.',
      questionToAsk: 'Are water and septic systems designed for conditions?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Contractors who underestimate Alaska costs',
    'Unregistered contractors',
    'Contractors without arctic experience',
    'Foundation contractors unfamiliar with permafrost',
    'Materials not rated for extreme cold'
  ],
  licensingNotes: 'Alaska requires contractor registration—verify at commerce.alaska.gov. Electricians, plumbers, and HVAC need state licenses. Very high costs are normal.'
};

// Vermont-specific insights
export const VERMONT_INSIGHTS: RegionalInsightsData = {
  stateName: 'Vermont',
  stateCode: 'VT',
  climate: 'Humid Continental with Cold Winters',
  overview: 'Vermont homeowners face harsh winters, older housing stock, and Act 250 environmental regulations. The state has no general contractor licensing requirement. The rural character creates unique considerations.',
  insights: [
    {
      topic: 'No Statewide Contractor License',
      concern: 'Vermont has no statewide general contractor licensing',
      redditTakeaway: 'Vermont doesn\'t require GC licenses. Reddit strongly emphasizes checking insurance and references.',
      questionToAsk: 'Can you provide proof of insurance and workers\' comp? Do you have local references?',
      severity: 'warning'
    },
    {
      topic: 'Act 250 Environmental Review',
      concern: 'Vermont\'s Act 250 affects larger projects',
      redditTakeaway: 'Act 250 requires environmental review for many projects. Reddit notes that commercial and some residential projects need permits.',
      questionToAsk: 'Does this project trigger Act 250 review?',
      severity: 'warning'
    },
    {
      topic: 'Harsh Winters & Ice Dams',
      concern: 'Vermont winters create significant ice dam risk',
      redditTakeaway: 'Ice dams cause major damage. Reddit strongly recommends proper attic insulation and ventilation.',
      questionToAsk: 'What ice dam prevention is included? Is attic ventilation adequate?',
      severity: 'warning'
    },
    {
      topic: 'Radon Testing',
      concern: 'Vermont has elevated radon in many areas',
      redditTakeaway: 'VT has significant radon. Reddit recommends testing before basement work.',
      questionToAsk: 'Has radon testing been done? Should mitigation be included?',
      severity: 'warning'
    },
    {
      topic: 'Older Housing Stock',
      concern: 'Vermont has many historic homes',
      redditTakeaway: 'Lead paint, asbestos, and outdated systems are common. Reddit recommends testing in older homes.',
      questionToAsk: 'Are you EPA Lead-Safe certified? Has testing been done?',
      severity: 'info'
    },
    {
      topic: 'Extreme Cold Construction',
      concern: 'Vermont winters require excellent insulation',
      redditTakeaway: 'Temperatures can drop well below zero. Reddit emphasizes high R-value insulation and proper air sealing.',
      questionToAsk: 'What insulation R-values are specified?',
      severity: 'info'
    },
    {
      topic: 'Shoreland Protection',
      concern: 'Vermont lakes have shoreland regulations',
      redditTakeaway: 'Lakefront properties have setback and buffer requirements.',
      questionToAsk: 'Does this comply with shoreland regulations?',
      severity: 'info'
    },
    {
      topic: 'Energy Efficiency',
      concern: 'Vermont cold climate makes efficiency important',
      redditTakeaway: 'Efficiency Vermont offers substantial rebates. Reddit strongly recommends checking before purchasing.',
      questionToAsk: 'What Efficiency Vermont rebates are available?',
      severity: 'info'
    },
    {
      topic: 'Septic & Well',
      concern: 'Rural Vermont relies on wells and septic',
      redditTakeaway: 'Most properties use private systems. Vermont has specific regulations.',
      questionToAsk: 'Are water and septic systems adequate?',
      severity: 'info'
    },
    {
      topic: 'Historic Preservation',
      concern: 'Vermont villages have historic character',
      redditTakeaway: 'Many towns have historic considerations. Reddit recommends checking before exterior work.',
      questionToAsk: 'Are there historic requirements?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Storm chasers after winter damage',
    'Unlicensed contractors with no accountability',
    'Basement waterproofing high-pressure sales',
    'Old house contractors without proper experience',
    'Solar installers with unrealistic claims'
  ],
  licensingNotes: 'Vermont has no statewide GC license. Electricians and plumbers need state licenses. Always verify insurance.'
};

// Wyoming-specific insights
export const WYOMING_INSIGHTS: RegionalInsightsData = {
  stateName: 'Wyoming',
  stateCode: 'WY',
  climate: 'Semi-Arid to Continental',
  overview: 'Wyoming homeowners face extreme cold, high winds, and remote location challenges. The state has no general contractor licensing requirement. Jackson Hole and mountain areas have specific concerns.',
  insights: [
    {
      topic: 'No Statewide Contractor License',
      concern: 'Wyoming has no statewide general contractor licensing',
      redditTakeaway: 'Wyoming doesn\'t require GC licenses. Some municipalities have requirements. Reddit strongly emphasizes checking insurance.',
      questionToAsk: 'Can you provide proof of insurance and workers\' comp?',
      severity: 'warning'
    },
    {
      topic: 'Extreme Cold & Wind',
      concern: 'Wyoming winters are severe with high winds',
      redditTakeaway: 'Wyoming sees extreme cold and high winds. Reddit emphasizes high R-value insulation, air sealing, and wind-resistant materials.',
      questionToAsk: 'What insulation R-values are specified? Are materials wind-rated?',
      severity: 'warning'
    },
    {
      topic: 'High Altitude Construction',
      concern: 'Much of Wyoming is at high altitude',
      redditTakeaway: 'Jackson Hole and mountain areas need altitude-adjusted appliances. Reddit recommends experienced contractors.',
      questionToAsk: 'Are appliances altitude-rated?',
      severity: 'info'
    },
    {
      topic: 'Wildfire Risk',
      concern: 'Western Wyoming faces wildfire risk',
      redditTakeaway: 'Wildfire zones have building requirements. Reddit recommends fire-resistant materials.',
      questionToAsk: 'Is this in a wildfire risk zone? Are materials fire-resistant?',
      severity: 'warning'
    },
    {
      topic: 'Remote Location Challenges',
      concern: 'Many Wyoming properties are remote',
      redditTakeaway: 'Remote locations add to costs and timelines. Reddit notes access and material delivery challenges.',
      questionToAsk: 'How does the location affect cost and timeline?',
      severity: 'info'
    },
    {
      topic: 'Radon Testing',
      concern: 'Wyoming has elevated radon in some areas',
      redditTakeaway: 'Parts of Wyoming have significant radon. Reddit recommends testing.',
      questionToAsk: 'Has radon testing been done?',
      severity: 'info'
    },
    {
      topic: 'Well & Septic Systems',
      concern: 'Rural Wyoming relies on wells and septic',
      redditTakeaway: 'Most rural properties use private systems. Proper design is essential.',
      questionToAsk: 'Are water and septic systems adequate?',
      severity: 'info'
    },
    {
      topic: 'Jackson Hole Considerations',
      concern: 'Teton County has specific requirements',
      redditTakeaway: 'Jackson Hole has high costs and specific design requirements. Reddit notes it\'s very expensive.',
      questionToAsk: 'Does this meet Teton County requirements?',
      severity: 'info'
    },
    {
      topic: 'Energy Efficiency',
      concern: 'Wyoming climate makes efficiency important',
      redditTakeaway: 'Rocky Mountain Power offers rebates. Reddit recommends maximizing insulation.',
      questionToAsk: 'What utility rebates are available?',
      severity: 'info'
    },
    {
      topic: 'Permit Requirements',
      concern: 'Permit requirements vary across Wyoming',
      redditTakeaway: 'Some areas have minimal oversight; Teton County is stricter.',
      questionToAsk: 'What permits are required?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Wildfire remediation scams',
    'Unlicensed contractors',
    'Remote property contractors who disappear',
    'Well and septic scams',
    'Wind damage repair scams'
  ],
  licensingNotes: 'Wyoming has no statewide GC license. Electricians and plumbers need state licenses. Always verify insurance.'
};

// Washington DC-specific insights
export const DC_INSIGHTS: RegionalInsightsData = {
  stateName: 'District of Columbia',
  stateCode: 'DC',
  climate: 'Humid Subtropical',
  overview: 'DC homeowners face strict permitting, extensive historic districts, and high construction costs. The District requires contractor licensing through DCRA. Rowhomes and historic properties dominate the housing stock.',
  insights: [
    {
      topic: 'District Contractor Licensing',
      concern: 'DC requires contractor licensing through DCRA',
      redditTakeaway: 'DC Department of Consumer and Regulatory Affairs (DCRA) licenses contractors—verify at dcra.dc.gov. License is mandatory.',
      questionToAsk: 'What is your DC contractor license number?',
      severity: 'warning'
    },
    {
      topic: 'Extensive Historic Districts',
      concern: 'Large portions of DC are historic districts',
      redditTakeaway: 'DC Historic Preservation Office (HPO) review is required for many exterior changes. Reddit notes the process can be lengthy.',
      questionToAsk: 'Is this in a historic district? Have you worked with HPO before?',
      severity: 'critical'
    },
    {
      topic: 'High Construction Costs',
      concern: 'DC has very high construction costs',
      redditTakeaway: 'DC labor and permitting costs are among highest in US. Reddit warns that very low bids indicate problems.',
      questionToAsk: 'Does this bid reflect DC costs?',
      severity: 'warning'
    },
    {
      topic: 'Strict Permitting',
      concern: 'DC has rigorous permit requirements',
      redditTakeaway: 'DCRA permitting is thorough and can be slow. Reddit emphasizes getting proper permits—enforcement is active.',
      questionToAsk: 'What permits are required? Who handles the permit process?',
      severity: 'warning'
    },
    {
      topic: 'Rowhome Considerations',
      concern: 'DC rowhomes have party wall concerns',
      redditTakeaway: 'Shared walls require coordination with neighbors. Reddit notes structural changes need engineering review.',
      questionToAsk: 'How will party walls be addressed? Has the neighbor been notified?',
      severity: 'info'
    },
    {
      topic: 'Lead Paint & Asbestos',
      concern: 'DC\'s older housing has lead and asbestos',
      redditTakeaway: 'Most DC homes have lead paint risk. Reddit emphasizes EPA Lead-Safe certification is essential.',
      questionToAsk: 'Are you EPA Lead-Safe certified? Has testing been done?',
      severity: 'warning'
    },
    {
      topic: 'Basement Conversions',
      concern: 'Basement apartments have specific requirements',
      redditTakeaway: 'DC regulates basement units. Permits and egress requirements apply.',
      questionToAsk: 'Does this meet DC requirements for basement living space?',
      severity: 'info'
    },
    {
      topic: 'Solar & Sustainability',
      concern: 'DC has strong solar and green incentives',
      redditTakeaway: 'DC offers significant solar incentives (SRECs). Reddit recommends investigating before purchasing.',
      questionToAsk: 'What DC incentives are available?',
      severity: 'info'
    },
    {
      topic: 'Parking & Access',
      concern: 'DC construction has access challenges',
      redditTakeaway: 'Street parking permits for construction are needed. Reddit notes dumpsters and deliveries require planning.',
      questionToAsk: 'How will site access and parking be handled?',
      severity: 'info'
    },
    {
      topic: 'Energy Efficiency',
      concern: 'DC utilities offer rebates',
      redditTakeaway: 'Pepco offers efficiency rebates. DC Sustainable Energy Utility (DCSEU) provides additional incentives.',
      questionToAsk: 'What DCSEU and utility rebates are available?',
      severity: 'info'
    }
  ],
  commonScams: [
    'Unlicensed contractors claiming license isn\'t needed',
    'Historic district violations',
    'Permit avoidance schemes',
    'Basement conversion shortcuts',
    'Party wall damage disputes'
  ],
  licensingNotes: 'DC requires contractor licensing—verify at dcra.dc.gov. Electricians, plumbers, and HVAC need DC licenses. Historic review is required in many areas.'
};

// State lookup - will expand with more states later
export const REGIONAL_INSIGHTS: Record<string, RegionalInsightsData> = {
  'GA': GEORGIA_INSIGHTS,
  'GEORGIA': GEORGIA_INSIGHTS,
  'AZ': ARIZONA_INSIGHTS,
  'ARIZONA': ARIZONA_INSIGHTS,
  'CO': COLORADO_INSIGHTS,
  'COLORADO': COLORADO_INSIGHTS,
  'WA': WASHINGTON_INSIGHTS,
  'WASHINGTON': WASHINGTON_INSIGHTS,
  'VA': VIRGINIA_INSIGHTS,
  'VIRGINIA': VIRGINIA_INSIGHTS,
  'MA': MASSACHUSETTS_INSIGHTS,
  'MASSACHUSETTS': MASSACHUSETTS_INSIGHTS,
  'TN': TENNESSEE_INSIGHTS,
  'TENNESSEE': TENNESSEE_INSIGHTS,
  'IN': INDIANA_INSIGHTS,
  'INDIANA': INDIANA_INSIGHTS,
  'MO': MISSOURI_INSIGHTS,
  'MISSOURI': MISSOURI_INSIGHTS,
  'MD': MARYLAND_INSIGHTS,
  'MARYLAND': MARYLAND_INSIGHTS,
  'WI': WISCONSIN_INSIGHTS,
  'WISCONSIN': WISCONSIN_INSIGHTS,
  'MN': MINNESOTA_INSIGHTS,
  'MINNESOTA': MINNESOTA_INSIGHTS,
  'SC': SOUTH_CAROLINA_INSIGHTS,
  'SOUTH CAROLINA': SOUTH_CAROLINA_INSIGHTS,
  'AL': ALABAMA_INSIGHTS,
  'ALABAMA': ALABAMA_INSIGHTS,
  'LA': LOUISIANA_INSIGHTS,
  'LOUISIANA': LOUISIANA_INSIGHTS,
  'KY': KENTUCKY_INSIGHTS,
  'KENTUCKY': KENTUCKY_INSIGHTS,
  'OR': OREGON_INSIGHTS,
  'OREGON': OREGON_INSIGHTS,
  'OK': OKLAHOMA_INSIGHTS,
  'OKLAHOMA': OKLAHOMA_INSIGHTS,
  'CT': CONNECTICUT_INSIGHTS,
  'CONNECTICUT': CONNECTICUT_INSIGHTS,
  'UT': UTAH_INSIGHTS,
  'UTAH': UTAH_INSIGHTS,
  'IA': IOWA_INSIGHTS,
  'IOWA': IOWA_INSIGHTS,
  'NV': NEVADA_INSIGHTS,
  'NEVADA': NEVADA_INSIGHTS,
  'AR': ARKANSAS_INSIGHTS,
  'ARKANSAS': ARKANSAS_INSIGHTS,
  'MS': MISSISSIPPI_INSIGHTS,
  'MISSISSIPPI': MISSISSIPPI_INSIGHTS,
  'KS': KANSAS_INSIGHTS,
  'KANSAS': KANSAS_INSIGHTS,
  'NM': NEW_MEXICO_INSIGHTS,
  'NEW MEXICO': NEW_MEXICO_INSIGHTS,
  'NE': NEBRASKA_INSIGHTS,
  'NEBRASKA': NEBRASKA_INSIGHTS,
  'WV': WEST_VIRGINIA_INSIGHTS,
  'WEST VIRGINIA': WEST_VIRGINIA_INSIGHTS,
  'ID': IDAHO_INSIGHTS,
  'IDAHO': IDAHO_INSIGHTS,
  'HI': HAWAII_INSIGHTS,
  'HAWAII': HAWAII_INSIGHTS,
  'NH': NEW_HAMPSHIRE_INSIGHTS,
  'NEW HAMPSHIRE': NEW_HAMPSHIRE_INSIGHTS,
  'ME': MAINE_INSIGHTS,
  'MAINE': MAINE_INSIGHTS,
  'MT': MONTANA_INSIGHTS,
  'MONTANA': MONTANA_INSIGHTS,
  'RI': RHODE_ISLAND_INSIGHTS,
  'RHODE ISLAND': RHODE_ISLAND_INSIGHTS,
  'DE': DELAWARE_INSIGHTS,
  'DELAWARE': DELAWARE_INSIGHTS,
  'SD': SOUTH_DAKOTA_INSIGHTS,
  'SOUTH DAKOTA': SOUTH_DAKOTA_INSIGHTS,
  'ND': NORTH_DAKOTA_INSIGHTS,
  'NORTH DAKOTA': NORTH_DAKOTA_INSIGHTS,
  'AK': ALASKA_INSIGHTS,
  'ALASKA': ALASKA_INSIGHTS,
  'VT': VERMONT_INSIGHTS,
  'VERMONT': VERMONT_INSIGHTS,
  'WY': WYOMING_INSIGHTS,
  'WYOMING': WYOMING_INSIGHTS,
  'DC': DC_INSIGHTS,
  'DISTRICT OF COLUMBIA': DC_INSIGHTS,
  'WASHINGTON DC': DC_INSIGHTS,
  'CA': CALIFORNIA_INSIGHTS,
  'CALIFORNIA': CALIFORNIA_INSIGHTS,
  'TX': TEXAS_INSIGHTS,
  'TEXAS': TEXAS_INSIGHTS,
  'FL': FLORIDA_INSIGHTS,
  'FLORIDA': FLORIDA_INSIGHTS,
  'NY': NEW_YORK_INSIGHTS,
  'NEW YORK': NEW_YORK_INSIGHTS,
  'PA': PENNSYLVANIA_INSIGHTS,
  'PENNSYLVANIA': PENNSYLVANIA_INSIGHTS,
  'IL': ILLINOIS_INSIGHTS,
  'ILLINOIS': ILLINOIS_INSIGHTS,
  'OH': OHIO_INSIGHTS,
  'OHIO': OHIO_INSIGHTS,
  'NC': NORTH_CAROLINA_INSIGHTS,
  'NORTH CAROLINA': NORTH_CAROLINA_INSIGHTS,
  'MI': MICHIGAN_INSIGHTS,
  'MICHIGAN': MICHIGAN_INSIGHTS,
  'NJ': NEW_JERSEY_INSIGHTS,
  'NEW JERSEY': NEW_JERSEY_INSIGHTS
};

export function getRegionalInsights(stateCode: string): RegionalInsightsData | null {
  const normalized = stateCode?.toUpperCase().trim();
  return REGIONAL_INSIGHTS[normalized] || null;
}

// Get insights relevant to a specific project type
export function getRelevantInsights(
  stateCode: string, 
  projectType?: string | null
): RegionalInsight[] {
  const data = getRegionalInsights(stateCode);
  if (!data) return [];

  const projectLower = (projectType || '').toLowerCase();
  
  // If no project type, return nothing - we need context
  if (!projectLower) return [];
  
  // Filter insights based on project type relevance - ONLY return truly relevant items
  const relevant = data.insights.filter(insight => {
    const topicLower = insight.topic.toLowerCase();
    
    // Flooring projects - only moisture, subfloor, and acclimation concerns
    if (projectLower.includes('floor') || projectLower.includes('hardwood') || projectLower.includes('tile') || projectLower.includes('carpet') || projectLower.includes('vinyl') || projectLower.includes('laminate')) {
      return topicLower.includes('moisture') || topicLower.includes('humidity') || topicLower.includes('flooring') || topicLower.includes('subfloor');
    }
    
    // HVAC projects
    if (projectLower.includes('hvac') || projectLower.includes('heating') || projectLower.includes('cooling') || projectLower.includes('air condition')) {
      return topicLower.includes('hvac') || topicLower.includes('humidity') || topicLower.includes('insulation') || topicLower.includes('attic');
    }
    
    // Roofing projects
    if (projectLower.includes('roof') || projectLower.includes('shingle')) {
      return topicLower.includes('storm') || topicLower.includes('attic') || topicLower.includes('insulation') || topicLower.includes('roof');
    }
    
    // Deck/outdoor projects
    if (projectLower.includes('deck') || projectLower.includes('patio') || projectLower.includes('outdoor') || projectLower.includes('porch')) {
      return topicLower.includes('deck') || topicLower.includes('outdoor') || topicLower.includes('hoa');
    }
    
    // Basement/crawl space projects
    if (projectLower.includes('basement') || projectLower.includes('crawl')) {
      return topicLower.includes('moisture') || topicLower.includes('foundation') || topicLower.includes('termite');
    }
    
    // Foundation projects
    if (projectLower.includes('foundation')) {
      return topicLower.includes('clay') || topicLower.includes('foundation') || topicLower.includes('termite');
    }
    
    // Kitchen/bathroom projects - moisture and permit relevant
    if (projectLower.includes('kitchen') || projectLower.includes('bathroom') || projectLower.includes('bath')) {
      return topicLower.includes('moisture') || topicLower.includes('permit') || topicLower.includes('plumb');
    }
    
    // Major renovations/additions - permit and license relevant
    if (projectLower.includes('addition') || projectLower.includes('remodel') || projectLower.includes('renovation')) {
      return topicLower.includes('permit') || topicLower.includes('license') || topicLower.includes('termite') || topicLower.includes('hoa');
    }
    
    // Electrical projects
    if (projectLower.includes('electric') || projectLower.includes('wiring') || projectLower.includes('panel')) {
      return topicLower.includes('license') || topicLower.includes('permit');
    }
    
    // Plumbing projects
    if (projectLower.includes('plumb') || projectLower.includes('pipe') || projectLower.includes('water heater')) {
      return topicLower.includes('license') || topicLower.includes('permit') || topicLower.includes('moisture');
    }
    
    // Siding/exterior projects
    if (projectLower.includes('siding') || projectLower.includes('exterior')) {
      return topicLower.includes('hoa') || topicLower.includes('storm') || topicLower.includes('moisture');
    }
    
    // Window/door projects
    if (projectLower.includes('window') || projectLower.includes('door')) {
      return topicLower.includes('storm') || topicLower.includes('insulation') || topicLower.includes('permit');
    }
    
    // Painting - no specific regional concerns usually
    if (projectLower.includes('paint')) {
      return false; // No regional concerns for painting
    }
    
    // Garage doors - hurricane ratings, insulation, climate concerns
    if (projectLower.includes('garage') || projectLower.includes('overhead door')) {
      return topicLower.includes('storm') || topicLower.includes('insulation') || topicLower.includes('permit');
    }
    
    // Gutters/drainage - heavy rain, drainage, moisture concerns
    if (projectLower.includes('gutter') || projectLower.includes('drainage') || projectLower.includes('downspout')) {
      return topicLower.includes('moisture') || topicLower.includes('foundation') || topicLower.includes('storm') || topicLower.includes('clay');
    }
    
    // Fencing - termites, wind load, freeze-thaw
    if (projectLower.includes('fence') || projectLower.includes('fencing')) {
      return topicLower.includes('termite') || topicLower.includes('storm') || topicLower.includes('hoa') || topicLower.includes('permit');
    }
    
    // Landscaping/hardscaping - drainage, soil, freeze depth
    if (projectLower.includes('landscape') || projectLower.includes('hardscape') || projectLower.includes('paver') || projectLower.includes('retaining wall')) {
      return topicLower.includes('clay') || topicLower.includes('foundation') || topicLower.includes('drainage') || topicLower.includes('permit');
    }
    
    // Pool/spa - permits, safety, winterization
    if (projectLower.includes('pool') || projectLower.includes('spa') || projectLower.includes('hot tub')) {
      return topicLower.includes('permit') || topicLower.includes('license') || topicLower.includes('hoa');
    }
    
    // Concrete/driveways - freeze-thaw, expansion, soil
    if (projectLower.includes('concrete') || projectLower.includes('driveway') || projectLower.includes('sidewalk') || projectLower.includes('slab')) {
      return topicLower.includes('clay') || topicLower.includes('foundation') || topicLower.includes('permit');
    }
    
    // Insulation/weatherization - R-value, climate requirements
    if (projectLower.includes('insulation') || projectLower.includes('weatheriz') || projectLower.includes('energy audit')) {
      return topicLower.includes('insulation') || topicLower.includes('attic') || topicLower.includes('moisture') || topicLower.includes('hvac');
    }
    
    // Solar - permits, utility requirements, hail concerns
    if (projectLower.includes('solar') || projectLower.includes('photovoltaic') || projectLower.includes('pv panel')) {
      return topicLower.includes('permit') || topicLower.includes('license') || topicLower.includes('storm') || topicLower.includes('roof');
    }
    
    // Home security/low-voltage - licensing varies by state
    if (projectLower.includes('security') || projectLower.includes('low voltage') || projectLower.includes('alarm') || projectLower.includes('camera') || projectLower.includes('smart home')) {
      return topicLower.includes('license') || topicLower.includes('permit');
    }
    
    // Default: return nothing rather than irrelevant items
    return false;
  });
  
  return relevant;
}

// Get scams relevant to project type
export function getRelevantScams(
  stateCode: string,
  projectType?: string | null
): string[] {
  const data = getRegionalInsights(stateCode);
  if (!data || !data.commonScams) return [];
  
  const projectLower = (projectType || '').toLowerCase();
  
  // Filter scams by relevance
  return data.commonScams.filter(scam => {
    const scamLower = scam.toLowerCase();
    
    // Storm chasers - only for roofing/siding/exterior
    if (scamLower.includes('storm chaser') || scamLower.includes('roof inspection')) {
      return projectLower.includes('roof') || projectLower.includes('siding') || projectLower.includes('storm');
    }
    
    // Unlicensed handymen - relevant for licensed trades
    if (scamLower.includes('unlicensed') || scamLower.includes('handymen')) {
      return projectLower.includes('electric') || projectLower.includes('plumb') || projectLower.includes('hvac');
    }
    
    // Payment scams - relevant for all major projects
    if (scamLower.includes('50%') || scamLower.includes('upfront') || scamLower.includes('disappear')) {
      const total = projectLower.includes('kitchen') || projectLower.includes('bath') || 
                    projectLower.includes('addition') || projectLower.includes('remodel') ||
                    projectLower.includes('roof') || projectLower.includes('basement');
      return total;
    }
    
    // Fake inspector - relevant for permitted work
    if (scamLower.includes('inspector')) {
      return projectLower.includes('addition') || projectLower.includes('permit') || 
             projectLower.includes('electric') || projectLower.includes('plumb') ||
             projectLower.includes('pool') || projectLower.includes('solar');
    }
    
    // Payment scams also relevant for these larger projects
    if (scamLower.includes('50%') || scamLower.includes('upfront') || scamLower.includes('disappear')) {
      const isLargeProject = projectLower.includes('garage') || projectLower.includes('fence') ||
                             projectLower.includes('concrete') || projectLower.includes('driveway') ||
                             projectLower.includes('pool') || projectLower.includes('solar') ||
                             projectLower.includes('landscape') || projectLower.includes('hardscape');
      if (isLargeProject) return true;
    }
    
    return false;
  });
}
