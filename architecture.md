# TapSafe Architecture

## Executive Summary

**Niche:** US Drinking Water Quality Data (EPA SDWIS)
**Target Audience:** US homeowners and renters concerned about tap water safety
**Revenue Model:** Triple stream - AdSense ($8-15 RPM) + water filter affiliates (8-30%) + test kit affiliates
**Data Source:** EPA ECHO SDWA bulk CSV download (156K water systems, 130+ fields, 11 tables)
**Estimated Pages:** 180,000+ unique, indexable pages
**Competitive Edge:** Cover ALL 156K water systems vs competitors' 18K cities; include violation history, lead/copper samples, inspection data; modern UX with dark mode

---

## Data Source Analysis

### Primary Source
- **URL:** https://echo.epa.gov/tools/data-downloads/sdwa-download-summary
- **Format:** ZIP file containing 11 CSV files
- **Access:** Free, no registration required
- **Update Frequency:** Quarterly
- **API Alternative:** EPA Envirofacts REST API (JSON/CSV/XML)

### CSV Tables & Field Inventory

#### 1. SDWA_PUB_WATER_SYSTEMS (Main Entity Table)
| Field | Type | Use Case |
|-------|------|----------|
| PWSID | TEXT (PK) | Unique water system ID (e.g., "NY0100117") |
| PWS_NAME | TEXT | System name for display |
| PRIMACY_AGENCY_CODE | TEXT | State regulatory agency |
| EPA_REGION | TEXT | EPA region number |
| PWS_ACTIVITY_CODE | TEXT | Active/Inactive status |
| PWS_TYPE_CODE | TEXT | CWS/NTNCWS/TNCWS type |
| GW_SW_CODE | TEXT | Groundwater/Surface Water source |
| OWNER_TYPE_CODE | TEXT | Federal/State/Local/Private |
| POPULATION_SERVED_COUNT | INT | Population served |
| POP_CAT_2_CODE - POP_CAT_11_CODE | TEXT | Population category codes |
| PRIMARY_SOURCE_CODE | TEXT | Primary water source |
| IS_GRANT_ELIGIBLE_IND | TEXT | Grant eligibility |
| IS_WHOLESALER_IND | TEXT | Wholesale indicator |
| IS_SCHOOL_OR_DAYCARE_IND | TEXT | School/daycare flag |
| SERVICE_CONNECTIONS_COUNT | INT | Number of service connections |
| ORG_NAME | TEXT | Organization name |
| ADMIN_NAME | TEXT | Administrator name |
| EMAIL_ADDR | TEXT | Contact email |
| PHONE_NUMBER | TEXT | Contact phone |
| ADDRESS_LINE1, ADDRESS_LINE2 | TEXT | Address |
| CITY_NAME | TEXT | City |
| ZIP_CODE | TEXT | ZIP code |
| STATE_CODE | TEXT | State code |
| SOURCE_WATER_PROTECTION_CODE | TEXT | Source protection status |
| OUTSTANDING_PERFORMER | TEXT | Outstanding performer flag |
| REDUCED_RTCR_MONITORING | TEXT | Reduced monitoring flag |
| SEASONAL_STARTUP_SYSTEM | TEXT | Seasonal system flag |
| ~63 total fields | | |

#### 2. SDWA_VIOLATIONS_ENFORCEMENT (Violations + Enforcement)
| Key Fields | Type | Use Case |
|------------|------|----------|
| PWSID | TEXT (FK) | Links to water system |
| VIOLATION_ID | TEXT | Unique violation |
| CONTAMINANT_CODE | TEXT | Which contaminant violated |
| VIOLATION_CODE | TEXT | Type of violation |
| VIOLATION_CATEGORY_CODE | TEXT | Category |
| IS_HEALTH_BASED_IND | TEXT | Health-based violation flag |
| VIOL_MEASURE | NUMERIC | Measured value |
| UNIT_OF_MEASURE | TEXT | Units |
| FEDERAL_MCL | NUMERIC | Federal maximum contaminant level |
| STATE_MCL | NUMERIC | State MCL |
| IS_MAJOR_VIOL_IND | TEXT | Major violation flag |
| VIOLATION_STATUS | TEXT | Open/Resolved |
| ENFORCEMENT_ACTION_TYPE_CODE | TEXT | Enforcement type |
| NON_COMPL_PER_BEGIN_DATE | DATE | Violation start |
| NON_COMPL_PER_END_DATE | DATE | Violation end |
| ~44 total fields | | |

#### 3. SDWA_FACILITIES (Individual Facilities)
| Key Fields | Type | Use Case |
|------------|------|----------|
| PWSID | TEXT (FK) | Links to water system |
| FACILITY_ID | TEXT | Unique facility |
| FACILITY_NAME | TEXT | Facility name |
| FACILITY_TYPE_CODE | TEXT | Type (treatment, well, etc.) |
| IS_SOURCE_IND | TEXT | Source indicator |
| WATER_TYPE_CODE | TEXT | Water type |
| ~19 total fields | | |

#### 4. SDWA_GEOGRAPHIC_AREAS (Service Areas)
| Key Fields | Type | Use Case |
|------------|------|----------|
| PWSID | TEXT (FK) | Links to water system |
| AREA_TYPE_CODE | TEXT | Area type |
| STATE_SERVED | TEXT | State served |
| COUNTY_SERVED | TEXT | County served |
| CITY_SERVED | TEXT | City served |
| ZIP_CODE_SERVED | TEXT | ZIP code served |
| ~10 total fields | | |

#### 5. SDWA_LCR_SAMPLES (Lead & Copper Rule)
| Key Fields | Type | Use Case |
|------------|------|----------|
| PWSID | TEXT (FK) | Links to water system |
| CONTAMINANT_CODE | TEXT | Lead or Copper code |
| SAMPLE_MEASURE | NUMERIC | Sample measurement |
| UNIT_OF_MEASURE | TEXT | Units (mg/L etc.) |
| SAMPLING_END_DATE | DATE | When sampled |
| ~15 total fields | | |

#### 6. SDWA_SITE_VISITS (Inspections)
| Key Fields | Type | Use Case |
|------------|------|----------|
| PWSID | TEXT (FK) | Links to water system |
| VISIT_DATE | DATE | Inspection date |
| VISIT_REASON_CODE | TEXT | Why inspected |
| Various _EVAL_CODE | TEXT | Evaluation scores |
| ~20 total fields | | |

#### 7-11. Reference Tables
- SDWA_REF_CODE_VALUES: Code definitions (3 fields)
- SDWA_REF_ANSI_AREAS: Geographic reference (4 fields)
- SDWA_SERVICE_AREAS: Service area types (6 fields)
- SDWA_PN_VIOLATION_ASSOC: Public notice associations (10 fields)
- SDWA_EVENTS_MILESTONES: Timeline events (10 fields)

---

## Database Schema

### Supabase PostgreSQL

```sql
-- ===== MAIN TABLES =====

-- Core water system table (from PUB_WATER_SYSTEMS)
CREATE TABLE water_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pwsid TEXT UNIQUE NOT NULL,
  pws_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  primacy_agency_code TEXT,
  epa_region TEXT,
  pws_activity_code TEXT DEFAULT 'A',
  pws_type_code TEXT,
  gw_sw_code TEXT,
  owner_type_code TEXT,
  population_served INT DEFAULT 0,
  service_connections INT DEFAULT 0,
  primary_source_code TEXT,
  is_wholesaler BOOLEAN DEFAULT FALSE,
  is_school_or_daycare BOOLEAN DEFAULT FALSE,
  org_name TEXT,
  admin_name TEXT,
  phone_number TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city_name TEXT,
  state_code TEXT NOT NULL,
  zip_code TEXT,
  county_served TEXT,
  source_water_protection_code TEXT,
  outstanding_performer BOOLEAN DEFAULT FALSE,
  seasonal_system BOOLEAN DEFAULT FALSE,
  -- Computed/cached fields
  violation_count INT DEFAULT 0,
  health_violation_count INT DEFAULT 0,
  last_violation_date DATE,
  last_site_visit_date DATE,
  lead_90th_percentile NUMERIC,
  copper_90th_percentile NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Violations and enforcement actions
CREATE TABLE violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pwsid TEXT NOT NULL REFERENCES water_systems(pwsid),
  violation_id TEXT NOT NULL,
  facility_id TEXT,
  contaminant_code TEXT,
  violation_code TEXT,
  violation_category_code TEXT,
  is_health_based BOOLEAN DEFAULT FALSE,
  viol_measure NUMERIC,
  unit_of_measure TEXT,
  federal_mcl NUMERIC,
  state_mcl NUMERIC,
  is_major_violation BOOLEAN DEFAULT FALSE,
  violation_status TEXT,
  public_notification_tier TEXT,
  rule_code TEXT,
  rule_group_code TEXT,
  rule_family_code TEXT,
  enforcement_id TEXT,
  enforcement_date DATE,
  enforcement_action_type_code TEXT,
  begin_date DATE,
  end_date DATE,
  UNIQUE(pwsid, violation_id)
);

-- Lead and Copper Rule samples
CREATE TABLE lcr_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pwsid TEXT NOT NULL REFERENCES water_systems(pwsid),
  sample_id TEXT,
  contaminant_code TEXT,
  sample_measure NUMERIC,
  unit_of_measure TEXT,
  result_sign_code TEXT,
  sampling_start_date DATE,
  sampling_end_date DATE,
  UNIQUE(pwsid, sample_id, contaminant_code)
);

-- Site visits / inspections
CREATE TABLE site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pwsid TEXT NOT NULL REFERENCES water_systems(pwsid),
  visit_id TEXT,
  visit_date DATE,
  visit_reason_code TEXT,
  compliance_eval TEXT,
  treatment_eval TEXT,
  distribution_eval TEXT,
  source_water_eval TEXT,
  financial_eval TEXT,
  security_eval TEXT,
  UNIQUE(pwsid, visit_id)
);

-- Geographic service areas
CREATE TABLE geographic_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pwsid TEXT NOT NULL REFERENCES water_systems(pwsid),
  area_type_code TEXT,
  state_served TEXT,
  county_served TEXT,
  city_served TEXT,
  zip_code_served TEXT,
  tribal_code TEXT
);

-- ===== REFERENCE/LOOKUP TABLES =====

-- Contaminant reference (enriched with health info)
CREATE TABLE contaminants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  mcl NUMERIC,
  mclg NUMERIC,
  unit TEXT,
  health_effects TEXT,
  sources TEXT,
  treatment TEXT,
  description TEXT,
  is_pfas BOOLEAN DEFAULT FALSE
);

-- State lookup
CREATE TABLE states (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  abbreviation TEXT NOT NULL,
  epa_region TEXT
);

-- Code value definitions
CREATE TABLE ref_code_values (
  value_type TEXT NOT NULL,
  value_code TEXT NOT NULL,
  value_description TEXT,
  PRIMARY KEY (value_type, value_code)
);

-- ===== INDEXES =====

CREATE INDEX idx_ws_state ON water_systems(state_code);
CREATE INDEX idx_ws_city ON water_systems(city_name);
CREATE INDEX idx_ws_zip ON water_systems(zip_code);
CREATE INDEX idx_ws_county ON water_systems(county_served);
CREATE INDEX idx_ws_type ON water_systems(pws_type_code);
CREATE INDEX idx_ws_activity ON water_systems(pws_activity_code);
CREATE INDEX idx_ws_population ON water_systems(population_served DESC);
CREATE INDEX idx_ws_slug ON water_systems(slug);
CREATE INDEX idx_ws_violations ON water_systems(violation_count DESC);

CREATE INDEX idx_viol_pwsid ON violations(pwsid);
CREATE INDEX idx_viol_contaminant ON violations(contaminant_code);
CREATE INDEX idx_viol_health ON violations(is_health_based);
CREATE INDEX idx_viol_date ON violations(begin_date DESC);
CREATE INDEX idx_viol_status ON violations(violation_status);

CREATE INDEX idx_lcr_pwsid ON lcr_samples(pwsid);
CREATE INDEX idx_lcr_contaminant ON lcr_samples(contaminant_code);

CREATE INDEX idx_sv_pwsid ON site_visits(pwsid);
CREATE INDEX idx_sv_date ON site_visits(visit_date DESC);

CREATE INDEX idx_ga_pwsid ON geographic_areas(pwsid);
CREATE INDEX idx_ga_state ON geographic_areas(state_served);
CREATE INDEX idx_ga_city ON geographic_areas(city_served);
CREATE INDEX idx_ga_county ON geographic_areas(county_served);
CREATE INDEX idx_ga_zip ON geographic_areas(zip_code_served);

-- Full-text search on water system name
CREATE INDEX idx_ws_name_trgm ON water_systems USING gin(pws_name gin_trgm_ops);
```

### Expected Row Counts
| Table | Expected Rows |
|-------|--------------|
| water_systems | ~156,000 |
| violations | ~500,000+ |
| lcr_samples | ~200,000+ |
| site_visits | ~300,000+ |
| geographic_areas | ~400,000+ |
| contaminants | ~300 |
| states | 56 (50 states + territories) |
| ref_code_values | ~1,000 |

---

## Route Architecture

### Core Routes
| Route | Purpose | Pages | ISR |
|-------|---------|-------|-----|
| `/` | Homepage with ZIP search, stats, map | 1 | revalidate: 3600 |
| `/search` | Full search with filters | 1 | force-dynamic |
| `/about` | About page (500+ words) | 1 | static |
| `/contact` | Contact form (Web3Forms) | 1 | static |
| `/privacy` | Privacy policy | 1 | static |
| `/terms` | Terms of service | 1 | static |
| `/disclaimer` | Data accuracy disclaimer | 1 | static |

### Data-Driven Routes
| Route | Purpose | Pages | ISR |
|-------|---------|-------|-----|
| `/water-system/[pwsid]` | Individual water system detail | ~156,000 | revalidate: 3600 |
| `/state/[slug]` | State water quality overview | 56 | revalidate: 3600 |
| `/state/[slug]/[city]` | City water quality page | ~18,000 | revalidate: 3600 |
| `/county/[state]/[county]` | County water quality page | ~3,100 | revalidate: 3600 |
| `/zip/[zipcode]` | ZIP code water quality lookup | ~30,000 | revalidate: 3600 |
| `/contaminant/[slug]` | Contaminant detail page | ~300 | revalidate: 86400 |
| `/rankings/[state]` | State water quality rankings | 56 | revalidate: 3600 |
| `/blog/[slug]` | Blog articles | 15-25 | static |
| `/sitemap/[id]` | Chunked sitemaps | ~20 | revalidate: 86400 |
| `/sitemap.xml` | Sitemap index | 1 | revalidate: 86400 |

### Total Indexable Pages: ~207,000+

### URL Structure
```
/water-system/ny0100117                    → System detail (PWSID as slug)
/state/new-york                            → State overview
/state/new-york/albany                     → City water quality
/county/new-york/albany-county             → County overview
/zip/12207                                 → ZIP code lookup
/contaminant/lead                          → Contaminant info
/rankings/new-york                         → State rankings
/blog/pfas-forever-chemicals-guide         → Blog article
```

### Internal Linking Strategy
```
Homepage
  ├── All 56 state pages (prominent links)
  ├── Featured "worst water" systems
  ├── Recent violations feed
  └── Blog highlights

State Page (/state/new-york)
  ├── All cities in state (paginated)
  ├── All counties in state
  ├── Top 10 largest systems
  ├── Systems with most violations
  ├── Related blog articles
  └── Neighboring states

City Page (/state/new-york/albany)
  ├── All water systems serving city
  ├── Each system links to detail page
  ├── County page link
  ├── State page link
  ├── Nearby cities
  └── Related contaminant pages

System Detail (/water-system/ny0100117)
  ├── City page link
  ├── County page link
  ├── State page link
  ├── Each contaminant links to contaminant page
  ├── 5+ related/nearby systems
  ├── ZIP code page link
  └── Blog article links

Contaminant Page (/contaminant/lead)
  ├── All systems with this violation
  ├── States most affected
  ├── Related contaminants
  ├── Blog articles about this contaminant
  └── Filter recommendations
```

---

## UI/UX Design Plan

### Competitor Weaknesses to Exploit
| Competitor | Weakness | Our Advantage |
|------------|----------|---------------|
| EWG (ewg.org/tapwater) | Popup-heavy, nonprofit feel, no modern UX | Clean, ad-optimized, modern design |
| MyTapWater.org | Only 31.5K visits, basic design | Full data + premium UI |
| TapWaterData.com | Only cities (18K), no system-level data | 156K systems + violations + samples |
| EPA ECHO | Government interface, unusable for consumers | Consumer-friendly, mobile-first |

### Design System
- **Framework:** Next.js 15 App Router + TypeScript
- **Styling:** Tailwind CSS v4 with dark mode (next-themes, class strategy)
- **UI Components:** Shadcn/ui (tables, cards, badges, dialogs, sheets, tabs, accordion)
- **Animations:** Magic-UI (number-ticker for stats, animated-grid-pattern for hero)
- **Icons:** Lucide React
- **Charts:** Recharts (violation trends, contaminant levels)
- **Maps:** Consider Leaflet or simple SVG state map

### Component Plan
| Component | Source | Usage |
|-----------|--------|-------|
| DataTable | Shadcn | System listings, violation tables |
| Card | Shadcn | System cards, stat cards |
| Badge | Shadcn | Status indicators (safe/warning/danger) |
| Tabs | Shadcn | System detail sections |
| Accordion | Shadcn | FAQs, contaminant details |
| Sheet | Shadcn | Mobile filters |
| Dialog | Shadcn | Compare modal |
| Input + Button | Shadcn | Search bar, ZIP lookup |
| NumberTicker | Magic-UI | Homepage stats animation |
| AnimatedGridPattern | Magic-UI | Hero background |
| Skeleton | Shadcn | Loading states |

### Color System (Water Theme)
```
Primary: Blue (#0ea5e9 sky-500) - trust, water, safety
Danger: Red (#ef4444 red-500) - violations, health concerns
Warning: Amber (#f59e0b amber-500) - approaching limits
Success: Green (#22c55e green-500) - compliant, safe
Background: White/Slate (light) / Slate-900+ (dark)
```

### Page Layouts

#### Homepage
- Hero: ZIP code search bar with animated water background
- Stats bar: Total systems, violations tracked, states covered (NumberTicker)
- "How Safe Is Your Water?" CTA with ZIP input
- US state map or grid linking to all states
- Recent violations feed (5-10 latest)
- Featured blog articles
- Trust indicators: EPA data source, quarterly updates

#### State Page
- State header with key stats (systems, population, violations)
- Safety score/grade for the state
- Top cities by population served
- Most violated systems table
- County breakdown
- Contaminants of concern for this state
- FAQ section (state-specific)

#### City Page
- City header with water source info
- All water systems serving this city (cards)
- Aggregate violation data
- Contaminant summary
- Comparison with state/national averages
- Nearby cities
- FAQ

#### Water System Detail Page (Most Important - Anti-Thin-Content)
- System header: name, PWSID, type, population served, source
- Safety assessment (based on violation history)
- Contaminant violations table with MCL comparisons
- Lead & copper sample results with EPA action level comparison
- Violation timeline (chart showing violations over time)
- Inspection/site visit history
- Service area info (cities, ZIP codes served)
- Dynamic FAQ with data-driven answers
- Related systems (same city/county)
- JSON-LD schema markup (WaterUtility + FAQPage)

---

## SEO Strategy

### Target Keywords (by page type)
| Page Type | Primary Keyword Pattern | Monthly Search Volume |
|-----------|------------------------|----------------------|
| ZIP lookup | "[zip code] water quality" | 500-2,000 per ZIP |
| City | "[city] tap water quality" "[city] water safe to drink" | 200-5,000 per city |
| State | "[state] water quality" "[state] drinking water" | 1,000-10,000 per state |
| Contaminant | "[contaminant] in drinking water" "what is [contaminant]" | 5,000-50,000 each |
| System | "[utility name] water quality" | 50-500 per system |
| Rankings | "worst water quality in [state]" "safest drinking water" | 2,000-20,000 |

### Schema.org Markup Plan
| Page Type | Schema Types |
|-----------|-------------|
| Water System Detail | WaterUtility (or GovernmentService) + FAQPage + BreadcrumbList |
| City/State/County | WebPage + FAQPage + BreadcrumbList |
| Contaminant | MedicalWebPage + FAQPage + BreadcrumbList |
| Rankings | ItemList + BreadcrumbList |
| Blog | Article + Person (author) + BreadcrumbList |
| Homepage | WebSite + SearchAction |

### Meta Tags Template
```
System: "[System Name] Water Quality Report - TapSafe"
City: "[City], [State] Tap Water Quality & Safety Data - TapSafe"
State: "[State] Drinking Water Quality Report [Year] - TapSafe"
Contaminant: "[Contaminant] in Drinking Water: Health Effects & Limits - TapSafe"
Rankings: "Best & Worst Water Quality in [State] [Year] - TapSafe"
```

### Robots.txt
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /search?

User-agent: Mediapartners-Google
Allow: /

Sitemap: https://tapsafe.dev/sitemap.xml
```

---

## Features

### Core Features (MVP)
| Feature | Justification |
|---------|--------------|
| ZIP code water quality lookup | EWG's #1 feature; proven high-intent entry point |
| Water system detail pages | 156K pages with unique violation/contaminant data |
| Violation history timeline | TapWaterData lacks this; shows trends over time |
| Lead & copper sample results | Critical PFAS/lead concern; unique data differentiation |
| State/city/county hierarchy | SEO-optimized location-based navigation |
| Contaminant reference pages | High-value informational content (PFAS, lead, arsenic) |
| Safety grade system | Visual A-F grade based on violations and compliance |

### Differentiating Features (Beat Competitors)
| Feature | Why It Wins |
|---------|-------------|
| Violation trend charts | Visual timeline showing improvement/decline per system |
| MCL vs measured comparison bars | Side-by-side federal limit vs actual measurement |
| Inspection history | No competitor shows site visit evaluations |
| Cross-system comparison | Compare 2-3 systems side by side |
| Water filter recommendations | Contextual affiliate links based on detected contaminants |
| Dynamic FAQs | "Does [City] have lead in water?" with data-driven answers |
| Safety rankings by state | "Worst/Best water in [State]" pages |

### Interactive Elements
- ZIP code instant lookup (hero section)
- Contaminant filter/sort on system pages
- Mobile-friendly filter sheet
- Theme toggle (light/dark)
- "Compare" button on system cards
- Share/bookmark water report

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse Performance | 95+ (both desktop & mobile) |
| Lighthouse Accessibility | 100 |
| Lighthouse Best Practices | 100 |
| Lighthouse SEO | 100 |
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| Page Load | < 2s on 4G |

### Performance Strategy
- ISR with `revalidate: 3600` on all data pages
- `force-dynamic` only for /search
- Next.js Image optimization for any images
- Lazy load charts and maps (below fold)
- Skeleton loading states
- Ad slots with min-height for CLS prevention
- Ad scripts loaded afterInteractive

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 15.x | App Router, ISR, SSR |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling + dark mode |
| @supabase/supabase-js | 2.x | Database client (NOT pg) |
| next-themes | latest | Dark/light mode toggle |
| Shadcn/ui | latest | UI components |
| Magic-UI | latest | Animated components |
| Recharts | latest | Charts for violation trends |
| Lucide React | latest | Icons |
| Web3Forms | API | Contact form |

---

## Automation Plan

### Data Refresh
- **Frequency:** Quarterly (matches EPA update cycle)
- **Method:** GitHub Action downloads latest SDWIS ZIP, runs ingestion script
- **Trigger:** Cron schedule (1st of Jan/Apr/Jul/Oct) + manual dispatch

### Blog Automation
- **Frequency:** 2 articles/week (Tuesday/Friday)
- **Method:** GitHub Action via scripts/blog-automation/
- **Content:** PFAS guides, lead testing, water filter reviews, state water quality analysis
- **Articles:** 15-25 initial batch, backfill dates

### GitHub Actions Required
1. `data-refresh.yml` - Quarterly data ingestion
2. `blog-publish.yml` - Bi-weekly blog article generation

### GitHub Secrets Required
| Secret | Source |
|--------|--------|
| SUPABASE_URL | Supabase.txt |
| SUPABASE_SERVICE_ROLE_KEY | Supabase.txt |
| SUPABASE_ANON_KEY | Supabase.txt |
| OPENROUTER_API_KEY | API-Credentials.txt |
| WEB3FORMS_KEY | API-Credentials.txt |
| NEXT_PUBLIC_SITE_URL | Production URL |
| VERCEL_TOKEN | Vercel auth |
| VERCEL_ORG_ID | Vercel project |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| YMYL content scrutiny | Medium | High | Use official EPA data; add disclaimers; cite sources |
| EPA data inaccuracies | Medium | Low | Display "last updated" dates; note data comes from EPA |
| TapWaterData.com first-mover | Medium | Medium | Cover 8x more systems; add violation history/samples |
| Complex data joining | Medium | Medium | Robust ingestion pipeline; denormalize into water_systems |
| PFAS data gaps | Low | Low | Note when data is unavailable; link to EWG for supplemental |
| AdSense YMYL rejection | Low | High | Strong trust pages; expert-sounding content; EPA attribution |
| Large dataset build times | Medium | Low | ISR + generateStaticParams for top systems only |

---

## Anti-Thin-Content Strategy

### What Makes Each System Page Unique
1. **Violation count and types** - differs per system (0 to 100+)
2. **Contaminants detected** - each system has different contaminant profiles
3. **Lead/copper sample levels** - measured values vary dramatically
4. **Population served** - ranges from 25 to millions
5. **Water source type** - groundwater vs surface water vs purchased
6. **Inspection history** - evaluation scores differ
7. **Safety grade** - computed A-F grade based on multiple factors
8. **Geographic context** - county, city, state comparisons
9. **Dynamic FAQ answers** - questions answered with system-specific data
10. **Related systems** - different neighbors per system

### Verification
Visit 3+ system pages via Playwright - content MUST visually differ in:
- Safety grade
- Violation table contents
- Contaminant list
- Lead/copper values
- FAQ answers
- Related systems sidebar
