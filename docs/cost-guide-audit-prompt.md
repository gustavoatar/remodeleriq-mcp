# Comprehensive Cost Guide Audit & Content Expansion Prompt

Use this prompt to have your AI review, correct, and expand the 52 city remodeling cost guides at intelligence.remodeleriq.com.

---

## PROMPT FOR AI REVIEWER

You are auditing and expanding 52 city remodeling cost guides for RemodelerIQ. These guides exist at:
`https://intelligence.remodeleriq.com/remodeling-cost-guides/[city-state]-remodeling-cost-guide/[project-type]/`

Your goals:
1. **Correct** data inconsistencies using authoritative sources
2. **Align** regional multipliers with actual labor cost data
3. **Add** conversion-driving content to each guide

---

## PART 1: REMODELERIQ DATA SOURCES (USE THESE AS TRUTH)

### Primary Data Sources

**Zonda Cost vs Value 2025/2026** (https://www.jlconline.com/cost-vs-value/2025)
- 5 Zonda regions: East South Central, East North Central, New England, Mountain, South Atlantic
- Project-specific multipliers by city (see table below)
- ROI/resale value percentages

**BLS OEWS May 2023** (Bureau of Labor Statistics)
- 16 construction trades tracked:
  - Carpenters: $26.00/hr national median
  - Electricians: $30.14/hr national median
  - Plumbers: $30.46/hr national median
  - HVAC: $26.71/hr national median
  - Roofers: $22.22/hr national median
  - Painters: $22.01/hr national median
  - Tile Setters: $24.04/hr national median
  - Drywall: $24.27/hr national median
  - Floor Layers: $22.55/hr national median

**Burden Multipliers (wage → billable rate):**
- Electricians/Plumbers/HVAC: 2.0x
- Roofers/Carpenters/Masons: 1.85x
- Tile/Drywall/Flooring: 1.75x
- Painters/Laborers: 1.65x

**Houzz 2024 Cost Guides**
- Labor/material splits by project type
- Per-square-foot benchmarks

**FRED Inflation Index**
- Current cumulative adjustment: +5.9% (applied to 2024 data → 2026 projections)

### RemodelerIQ Smart Pricing Rules

**Area-Based Projects ($/SF):**
| Project | Low | Median | High | Labor % |
|---------|-----|--------|------|---------|
| Kitchen Remodel | $150 | $400 | $800 | 45-55% |
| Bathroom Remodel | $150 | $350 | $600 | 50-60% |
| Basement Remodel | $30 | $55 | $90 | 50-65% |
| Addition | $150 | $275 | $450 | 45-55% |
| Hardwood Floor | $8 | $14 | $22 | 55-70% |
| Tile Floor | $10 | $16 | $25 | 70-80% |
| Interior Paint | $2.00 | $3.50 | $5.50 | 75-85% |

**Per-Unit Projects ($/EA):**
| Project | Low | Median | High |
|---------|-----|--------|------|
| Window Replacement | $450 | $750 | $1,200 |
| Entry Door (Steel) | $1,200 | $2,000 | $3,500 |
| Garage Door | $800 | $1,800 | $4,000 |
| HVAC Heat Pump | $8,000 | $15,000 | $25,000 |

### City Tier System

**Tier 1 (High Cost) - Multiplier: 1.4-1.6x**
NYC, San Francisco, Boston, Seattle

**Tier 2 (Elevated) - Multiplier: 1.2-1.4x**
Los Angeles, Chicago, Denver, DC, Miami

**Tier 3 (Moderate) - Multiplier: 1.0-1.15x**
Atlanta, Dallas, Phoenix, Nashville, Portland

**Tier 4 (Average) - Multiplier: 0.9-1.0x**
Houston, Columbus, Las Vegas, Orlando

**Tier 5 (Value) - Multiplier: 0.75-0.9x**
Oklahoma City, Memphis, Birmingham, Detroit, El Paso

---

## PART 2: COMPLETE 52-CITY AUDIT CHECKLIST

Review each city and apply corrections as noted.

### TIER 1: HIGH-COST METROS (Multiplier should be +40% to +60%)

| # | City | Current | Recommended | Key Issues to Fix |
|---|------|---------|-------------|-------------------|
| 1 | **San Francisco, CA** | +50% | +50-55% | ✓ Add Title 24 energy compliance (+3-5%). Add seismic retrofit line item (+10-15% for additions). Verify labor split reflects $45+/hr electricians. |
| 2 | **New York, NY** | +45% | +45-50% | ✓ Add union labor factor for Manhattan (+10-15%). Add historic district costs for pre-war buildings. Verify permit costs ($2K+ for kitchens). |
| 3 | **Boston, MA** | +6% | **+25-35%** | ⚠️ **CRITICAL FIX**: BLS shows Boston electricians $40+/hr vs $30 national. Current +6% is ~20 points too low. |
| 4 | **Seattle, WA** | +35% | +35-40% | ✓ Accurate. Add rain/moisture management requirements. Note seismic requirements similar to CA. |
| 5 | **San Jose, CA** | (verify) | +50-55% | Same as SF market. High-tech worker premium drives contractor rates. |
| 6 | **Honolulu, HI** | (verify) | +60-70% | Shipping costs for materials add 30-50%. Limited contractor pool. |

### TIER 2: ELEVATED-COST METROS (Multiplier should be +20% to +40%)

| # | City | Current | Recommended | Key Issues to Fix |
|---|------|---------|-------------|-------------------|
| 7 | **Los Angeles, CA** | (verify) | +35-45% | Add wildfire zone materials requirement. Add Title 24. Verify against Zonda South Atlantic data. |
| 8 | **Chicago, IL** | (verify) | +25-30% | Add snow load requirements for roofs. Union labor in city proper. |
| 9 | **Denver, CO** | +15% | +20-25% | ⚠️ Slightly low. BLS shows Denver trades 15-20% above national. Add altitude/snow factors. |
| 10 | **Washington, DC** | (verify) | +30-35% | High permit costs. Historic district requirements. Government contractor pricing. |
| 11 | **Miami, FL** | +10% | **+20-25%** | ⚠️ **CRITICAL FIX**: Hurricane code compliance adds 15-25% to roofing/windows/additions. Current +10% is too low. |
| 12 | **San Diego, CA** | (verify) | +30-40% | Similar to LA but slightly lower. Add seismic + Title 24. |
| 13 | **Portland, OR** | (verify) | +20-25% | Radon mitigation for basements. Energy code compliance. |
| 14 | **Austin, TX** | (verify) | +15-20% | Rapid growth market. Permitting delays add holding costs. |
| 15 | **Newark, NJ** | (verify) | +35-40% | NYC spillover market. Union labor requirements. |

### TIER 3: MODERATE-COST METROS (Multiplier should be ±5% to +15%)

| # | City | Current | Recommended | Key Issues to Fix |
|---|------|---------|-------------|-------------------|
| 16 | **Atlanta, GA** | -3% | +0% to +5% | ⚠️ Zonda shows Atlanta at 0.96-1.04x national. -3% may be slightly aggressive. |
| 17 | **Dallas, TX** | (verify) | +5-10% | Growing market. Verify labor availability. |
| 18 | **Phoenix, AZ** | -2% | +0-5% | Verify cooling system requirements add to HVAC costs. Extreme heat factors. |
| 19 | **Nashville, TN** | (verify) | +5-10% | Rapid growth market driving up labor costs. |
| 20 | **Charlotte, NC** | (verify) | +0-5% | Growing metro. Verify against Zonda South Atlantic. |
| 21 | **Raleigh, NC** | (verify) | +0-5% | Research Triangle premium. |
| 22 | **Tampa, FL** | (verify) | +10-15% | Hurricane codes similar to Miami but slightly lower labor costs. |
| 23 | **Minneapolis, MN** | (verify) | +10-15% | Cold climate requirements. Energy efficiency mandates. |
| 24 | **Salt Lake City, UT** | (verify) | +5-10% | Growth market. Altitude/snow considerations. |
| 25 | **Richmond, VA** | (verify) | +0-5% | Moderate market. |
| 26 | **Virginia Beach, VA** | (verify) | +5-10% | Coastal requirements. Hurricane zone. |

### TIER 4: AVERAGE-COST METROS (Multiplier should be -5% to +5%)

| # | City | Current | Recommended | Key Issues to Fix |
|---|------|---------|-------------|-------------------|
| 27 | **Houston, TX** | (verify) | -5% to +5% | Large contractor pool balances demand. Verify hurricane/flood zone factors. |
| 28 | **Columbus, OH** | (verify) | -5% to 0% | Stable Midwest market. |
| 29 | **Las Vegas, NV** | (verify) | -5% to +5% | Variable market. Extreme heat factors for materials. |
| 30 | **Orlando, FL** | (verify) | +5-10% | Tourism economy. Hurricane codes apply. |
| 31 | **Jacksonville, FL** | (verify) | +0-5% | Hurricane codes. Growing market. |
| 32 | **San Antonio, TX** | (verify) | -5% to 0% | Large contractor pool. |
| 33 | **Fort Worth, TX** | (verify) | +0-5% | DFW metro spillover. |
| 34 | **Pittsburgh, PA** | (verify) | -5% to 0% | Older housing stock may increase renovation complexity. |
| 35 | **Cincinnati, OH** | (verify) | -5% to 0% | Stable Midwest market. |
| 36 | **Cleveland, OH** | (verify) | -5% to 0% | Verify older home requirements. |
| 37 | **Indianapolis, IN** | (verify) | -5% to 0% | Central location keeps costs moderate. |

### TIER 5: VALUE-COST METROS (Multiplier should be -10% to -5%)

| # | City | Current | Recommended | Key Issues to Fix |
|---|------|---------|-------------|-------------------|
| 38 | **El Paso, TX** | -10% | -10% to -5% | ✓ Verify lower labor costs supported by BLS. Border market dynamics. |
| 39 | **Memphis, TN** | (verify) | -10% to -5% | Lower cost of living reflected in labor. |
| 40 | **Oklahoma City, OK** | (verify) | -10% to -5% | Tornado zone may affect roofing. Otherwise low cost. |
| 41 | **Birmingham, AL** | (verify) | -10% to -5% | Verify Zonda East South Central data (typically 0.85-0.95x). |
| 42 | **Louisville, KY** | (verify) | -5% to 0% | Moderate market. |
| 43 | **Kansas City, MO** | (verify) | -5% to 0% | Central market. Tornado considerations. |
| 44 | **St. Louis, MO** | (verify) | -5% to 0% | Older housing stock. |
| 45 | **Tucson, AZ** | (verify) | -10% to -5% | Lower cost than Phoenix. |
| 46 | **Albuquerque, NM** | (verify) | -5% to 0% | Verify Zonda Mountain region data. |
| 47 | **New Orleans, LA** | (verify) | +5-10% | ⚠️ Flood zone + humidity = higher costs than typical Tier 5. |
| 48 | **Buffalo, NY** | (verify) | -5% to 0% | Snow load requirements. Older homes. |
| 49 | **Milwaukee, WI** | (verify) | -5% to +5% | Cold climate requirements. |
| 50 | **Detroit, MI** | (verify) | -10% to -5% | Lower labor costs. Older housing stock complexity. |
| 51 | **Omaha, NE** | (verify) | -10% to -5% | Central market. Low cost of living. |
| 52 | **Boise, ID** | (verify) | +5-10% | Rapid growth market may push costs up. |

---

## PART 3: SPECIAL REGIONAL FACTORS

Add these as explicit callouts or bake into multipliers:

### Hurricane/Wind Zones (FL, TX Gulf, LA, NC Coast)
- Roofing: +15-25% (impact-rated materials, hurricane clips)
- Windows: +20-30% (impact glass, shutters)
- Additions: +10-20% (structural engineering, tie-downs)

### Seismic Zones (CA, Pacific NW, Parts of TN/MO)
- Additions: +10-20% (foundation engineering, retrofitting)
- All projects: Add earthquake retrofit consideration

### Title 24 / Energy Codes (CA, WA, OR)
- HVAC: +5-10% (high-efficiency requirements)
- Windows: +5-10% (U-factor requirements)
- General: +3-5% across all projects

### Snow Load / Cold Climate (MN, WI, MI, CO, Northern tier)
- Roofing: +5-10% (structural requirements)
- Basements: +5-10% (insulation, moisture control)

### Flood Zones (LA, Houston, Coastal FL)
- Basements: NOT RECOMMENDED or +50-100% if required
- Additions: +10-15% (elevation requirements)

---

## PART 4: LABOR/MATERIAL SPLIT CORRECTIONS

**Current Splits in Guides:**
- Kitchen: 50% labor / 50% materials
- Bathroom: 55% labor / 45% materials
- Basement: 57% labor / 43% materials
- Addition: 50% labor / 50% materials

**Recommended Corrections (based on RemodelerIQ data):**
- Kitchen: **40-45% labor** / 55-60% materials (cabinets + appliances are material-heavy)
- Bathroom: 50-55% labor / 45-50% materials ✓ (plumbing-intensive, accurate)
- Basement: 50-60% labor / 40-50% materials ✓ (finish work intensive, accurate)
- Addition: 45-50% labor / 50-55% materials (structural + finish, accurate)

---

## PART 5: CONTENT TO ADD FOR USER CONVERSION

Add these sections to each city guide to drive users to RemodelerIQ tools:

### 1. "Get Your Bid Analyzed" CTA Block
```
## Is Your Contractor's Bid Fair?

These are average costs, but every project is different. Upload your actual bid to RemodelerIQ and get:

✓ Instant price analysis against [CITY] market rates
✓ Line-by-line scope review to catch missing items
✓ Contractor trust score based on license, reviews, and BBB data
✓ Negotiation talking points backed by local data

**[ANALYZE YOUR BID FREE →]** (link to remodeleriq.com/?view=upload)

*Join 10,000+ homeowners who saved an average of $[CITY_SAVINGS] on their remodel.*
```

**City-specific savings amounts:**
- Tier 1 cities: $1,100 - $1,350
- Tier 2 cities: $950 - $1,100
- Tier 3 cities: $850 - $1,000
- Tier 4 cities: $750 - $900
- Tier 5 cities: $600 - $850

### 2. Regional Warning Callouts

**For Hurricane Zone Cities (Miami, Tampa, Jacksonville, Houston, New Orleans):**
```
⚠️ **Hurricane Zone Alert**: [CITY] requires impact-rated materials and enhanced 
structural attachments. Bids missing these items may fail inspection or leave your 
home unprotected. Our bid analyzer flags missing hurricane code requirements.
```

**For Seismic Zone Cities (San Francisco, Los Angeles, Seattle):**
```
⚠️ **Seismic Zone Alert**: California/Washington requires earthquake-resistant 
construction. Additions and major remodels may require structural engineering. 
Our bid analyzer checks for proper seismic scope items.
```

**For Permit-Heavy Cities (NYC, Boston, DC, Chicago):**
```
⚠️ **Permit Alert**: [CITY] has strict permitting requirements that can add 
$2,000-$5,000 to your project. Is your contractor including permit fees? 
Upload your bid to find out.
```

### 3. "Questions to Ask Your Contractor" Section
```
## 5 Questions [CITY] Homeowners Should Ask

Before signing a contract for your [PROJECT_TYPE] project:

1. **"Is your license current with [STATE] and verified?"**
   *[STATE]-specific licensing requirements...*

2. **"What's included in your warranty?"**
   *Industry standard is 1-2 years labor, manufacturer warranties on materials.*

3. **"How do you handle change orders?"**
   *Get it in writing. Our Change Order Predictor identifies risky scope language.*

4. **"What's your payment schedule?"**
   *Red flag: Deposits over 30%. Standard: 10% start, milestone payments.*

5. **"Are permits included in this price?"**
   *In [CITY], [PROJECT_TYPE] permits typically cost $XXX-$XXX.*

**[GET YOUR BID ANALYZED →]** We'll tell you if your contractor checked these boxes.
```

### 4. "How We Calculate These Costs" Section
```
## Our Data Sources

RemodelerIQ's [CITY] cost estimates are based on:

- **Zonda Cost vs Value 2025** - Industry-standard regional pricing data
- **BLS Occupational Wage Statistics** - Actual [CITY] trade labor rates
- **FRED Economic Data** - Real-time inflation adjustments
- **10,000+ Analyzed Bids** - What [CITY] homeowners actually pay

Unlike generic cost calculators, we analyze *your actual bid* against these benchmarks 
to show exactly where you're overpaying or underpaying.

**[UPLOAD YOUR BID NOW →]**
```

### 5. "Related Tools" Section
```
## More RemodelerIQ Tools for [CITY] Homeowners

- **[Trust Radar](remodeleriq.com/trust-radar)** - Search and verify contractors in [CITY]
- **[Labor Rate Intelligence](remodeleriq.com/labor-rates)** - See what [CITY] trades actually charge
- **[Change Order Predictor](remodeleriq.com)** - Identify contract language that leads to surprise costs

Already have a bid? **[Get it analyzed in 60 seconds →]**
```

### 6. Comparison Table: DIY vs Contractor
```
## Should You DIY Your [PROJECT_TYPE]?

| Factor | DIY | Hire a Pro |
|--------|-----|------------|
| Cost | 40-60% savings | Full price |
| Time | 3-4x longer | Professional timeline |
| Permits | You handle | Contractor handles |
| Warranty | None | 1-2 year labor warranty |
| Resale Value | Buyer concerns | Professional documentation |

**Our recommendation for [CITY]:** [PROJECT-SPECIFIC ADVICE]

Not sure if your bid is fair? **[Upload it for free analysis →]**
```

---

## PART 6: ZONDA REGIONAL MULTIPLIERS BY PROJECT

Use these verified Zonda 2025 multipliers for calibration:

| Project | National | East South Central | East North Central | New England | Mountain | South Atlantic |
|---------|----------|--------------------|--------------------|-------------|----------|----------------|
| Garage Door | $4,672 | 0.92x | 0.93x | 0.92x | 1.06x | 1.10x |
| Entry Door Steel | $2,435 | 0.95x | 0.96x | 1.05x | 1.00x | 0.98x |
| Vinyl Siding | $17,950 | 0.81x | 1.07x | 0.98x | 0.95x | 0.92x |
| Fiber Cement Siding | $21,485 | 0.85x | 1.09x | 0.96x | 0.91x | 0.91x |
| Vinyl Windows | $22,073 | 0.92x | 1.00x | 0.99x | 0.96x | 0.98x |
| Asphalt Roof | $31,871 | 0.81x | 0.92x | 1.12x | 0.89x | 1.01x |
| Kitchen Minor | $28,458 | 0.95x | 0.95x | 1.02x | 1.00x | 1.00x |
| Kitchen Major | $82,793 | 0.94x | 1.00x | 1.01x | 0.98x | 0.98x |
| Bath Midrange | $26,138 | 0.90x | 0.95x | 1.05x | 0.95x | 0.98x |
| Basement | $52,012 | 0.85x | 0.96x | 1.05x | 0.96x | 0.99x |
| HVAC Heat Pump | $19,484 | 0.88x | 0.96x | 1.14x | 0.92x | 0.99x |

---

## OUTPUT FORMAT FOR CORRECTIONS

For each city guide correction:

```
CITY: [City, ST]
URL: https://intelligence.remodeleriq.com/remodeling-cost-guides/[city-state]-remodeling-cost-guide/
CURRENT MULTIPLIER: [X%]
RECOMMENDED MULTIPLIER: [Y%]
LABOR SPLIT FIX: [If applicable]
SPECIAL FACTORS TO ADD: [Hurricane/Seismic/etc.]
CTA SAVINGS AMOUNT: $[amount]
PRIORITY: [Critical/High/Medium/Low]

RATIONALE:
[Why this change, citing specific data source]
```

---

## EXECUTION CHECKLIST

1. [ ] Review all 52 cities against this document
2. [ ] Flag Critical fixes (Boston +6%, Miami +10%)
3. [ ] Verify labor splits for kitchen (should be 40-45%)
4. [ ] Add hurricane/seismic warnings where applicable
5. [ ] Insert "Analyze Your Bid" CTAs in all guides
6. [ ] Add city-specific savings amounts
7. [ ] Include "Questions to Ask" section
8. [ ] Link to Trust Radar, Labor Rates, main app
9. [ ] Verify all external data citations are current (Zonda 2025, BLS 2023, FRED)
10. [ ] Test all CTA links point to correct remodeleriq.com pages
