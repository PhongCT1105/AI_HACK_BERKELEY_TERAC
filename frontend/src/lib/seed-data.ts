import { scoreSource, preferredSource } from "./scoring";
import type { ScoringInput } from "./scoring";

// Placeholder/representative finance source pairs for Terac annotation.
// URLs are representative public domains, not scraped article text — the
// structure is built to be swapped for real Browserbase-extracted pages later.

export interface SeedSourceInput extends ScoringInput {
  id: string;
  url: string;
  title: string;
  capsule: string;
}

export interface SeedPairInput {
  research_task: string;
  source_a: SeedSourceInput;
  source_b: SeedSourceInput;
}

function reputable(opts: {
  idPrefix: string;
  url: string;
  title: string;
  capsule: string;
  source_type?: string;
}): SeedSourceInput {
  return {
    id: `${opts.idPrefix}`,
    url: opts.url,
    title: opts.title,
    capsule: opts.capsule,
    source_type: opts.source_type ?? "reputable_financial_news",
    author_transparency: "clear",
    citation_quality: "strong",
    evidence_quality: "strong",
    commercial_pressure: "none",
    risk_tags: [],
  };
}

function weak(opts: {
  idPrefix: string;
  url: string;
  title: string;
  capsule: string;
  source_type?: string;
  commercial_pressure?: ScoringInput["commercial_pressure"];
  extraRisks?: string[];
}): SeedSourceInput {
  const risk_tags = [
    "no_clear_author",
    "weak_citations",
    "promotional_language",
    ...(opts.extraRisks ?? []),
  ];
  return {
    id: `${opts.idPrefix}`,
    url: opts.url,
    title: opts.title,
    capsule: opts.capsule,
    source_type: opts.source_type ?? "blog",
    author_transparency: "missing",
    citation_quality: "weak",
    evidence_quality: "weak",
    commercial_pressure: opts.commercial_pressure ?? "promotional",
    risk_tags,
  };
}

const RAW_PAIRS: SeedPairInput[] = [
  {
    research_task: "Which source should an AI agent cite for Nvidia revenue growth?",
    source_a: reputable({
      idPrefix: "nvda-ir",
      url: "https://investor.nvidia.com/financial-info/quarterly-results/",
      title: "NVIDIA Investor Relations — Quarterly Results",
      capsule: "Official investor relations page with audited quarterly revenue and segment breakdowns, sourced directly from SEC filings.",
      source_type: "official_company",
    }),
    source_b: weak({
      idPrefix: "nvda-hype",
      url: "https://stockgains-daily.example.com/nvidia-to-the-moon",
      title: "NVIDIA Stock Is About To EXPLODE — Buy Now!",
      capsule: "Unsigned blog post claiming explosive revenue growth with no cited financial data, framed around urgency to buy.",
      extraRisks: ["unsupported_price_prediction", "sensational_claim"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for Tesla quarterly earnings?",
    source_a: reputable({
      idPrefix: "tsla-sec",
      url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=TSLA",
      title: "Tesla 10-Q Filing — SEC EDGAR",
      capsule: "Primary-source SEC quarterly filing with audited financial statements and management discussion.",
      source_type: "sec_filing",
    }),
    source_b: weak({
      idPrefix: "tsla-newsletter",
      url: "https://evfortunenewsletter.example.com/tesla-earnings-take",
      title: "Tesla Earnings: Why This Changes Everything",
      capsule: "Promotional newsletter with speculative earnings commentary and an embedded affiliate link to a trading platform.",
      commercial_pressure: "affiliate",
      extraRisks: ["affiliate_pressure"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for Bitcoin price predictions?",
    source_a: reputable({
      idPrefix: "btc-reuters",
      url: "https://www.reuters.com/markets/cryptocurrency/",
      title: "Reuters — Cryptocurrency Markets Coverage",
      capsule: "Wire-service market reporting with named reporters, on-record sources, and explicit framing of price moves as historical, not predictive.",
    }),
    source_b: weak({
      idPrefix: "btc-moonboy",
      url: "https://cryptomoonsignals.example.com/btc-100k-prediction",
      title: "Bitcoin WILL Hit $100K This Month — Insider Signals",
      capsule: "Anonymous prediction page with no methodology, citing 'insider signals' and pushing a paid Telegram group.",
      source_type: "crypto_prediction_page",
      extraRisks: ["unsupported_price_prediction", "no_primary_source"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for whether a crypto token is legitimate?",
    source_a: reputable({
      idPrefix: "token-cs",
      url: "https://www.coinbase.com/learn/crypto-basics/what-is-tokenomics",
      title: "Coinbase Learn — Evaluating Token Legitimacy",
      capsule: "Educational explainer from a publicly listed exchange describing concrete due-diligence criteria for assessing tokens.",
      source_type: "reputable_financial_news",
    }),
    source_b: weak({
      idPrefix: "token-shill",
      url: "https://nextbigtoken100x.example.com/review",
      title: "This New Token Is 100x Guaranteed — Don't Miss Out",
      capsule: "Unsigned review with guaranteed-return language and an affiliate referral code for the token's presale.",
      source_type: "promotional_page",
      commercial_pressure: "affiliate",
      extraRisks: ["affiliate_pressure", "unsupported_price_prediction"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for interest-rate impact on tech stocks?",
    source_a: reputable({
      idPrefix: "rates-fed",
      url: "https://www.federalreserve.gov/monetarypolicy.htm",
      title: "Federal Reserve — Monetary Policy Statements",
      capsule: "Primary-source central bank statements and FOMC minutes describing rate decisions and stated rationale.",
      source_type: "government",
    }),
    source_b: weak({
      idPrefix: "rates-blog",
      url: "https://techstockwhisperer.example.com/rates-killing-tech",
      title: "Why The Fed Is Secretly Trying To Crash Tech Stocks",
      capsule: "Opinion blog with conspiratorial framing and no cited economic data linking rate policy to stock moves.",
      extraRisks: ["sensational_claim", "no_primary_source"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for Apple earnings?",
    source_a: reputable({
      idPrefix: "aapl-ir",
      url: "https://investor.apple.com/investor-relations/default.aspx",
      title: "Apple Investor Relations — Earnings Releases",
      capsule: "Official earnings press release and financial statements published directly by the company.",
      source_type: "official_company",
    }),
    source_b: weak({
      idPrefix: "aapl-clickbait",
      url: "https://markettrendwatch.example.com/apple-shock-earnings",
      title: "Apple's SHOCKING Earnings Nobody Is Talking About",
      capsule: "Clickbait aggregation site repackaging earnings numbers without sourcing, with heavy ad placement around the figures.",
      source_type: "aggregator_blog",
      extraRisks: ["sensational_claim", "weak_citations"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for inflation and market impact?",
    source_a: reputable({
      idPrefix: "cpi-bls",
      url: "https://www.bls.gov/cpi/",
      title: "U.S. Bureau of Labor Statistics — Consumer Price Index",
      capsule: "Primary government statistical release with full methodology and historical CPI series.",
      source_type: "government",
    }),
    source_b: weak({
      idPrefix: "cpi-substack",
      url: "https://inflationpanic.example.com/cpi-hyperinflation-coming",
      title: "Hyperinflation Is Coming — Protect Your Wealth Now",
      capsule: "Fear-driven newsletter promoting gold and crypto purchases through affiliate links, citing no official statistics.",
      commercial_pressure: "affiliate",
      extraRisks: ["sensational_claim", "affiliate_pressure"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for whether a stablecoin is fully backed?",
    source_a: reputable({
      idPrefix: "stable-attestation",
      url: "https://www.centre.io/usdc-transparency",
      title: "USDC Reserve Attestation Reports",
      capsule: "Third-party accounting attestation reports detailing reserve composition, published on a regular cadence.",
      source_type: "official_company",
    }),
    source_b: weak({
      idPrefix: "stable-rumor",
      url: "https://cryptoinsiderleaks.example.com/stablecoin-collapse-rumor",
      title: "Leaked Docs Show This Stablecoin Is About To Collapse",
      capsule: "Anonymous 'leak' post with screenshots of unverifiable documents and no named source.",
      source_type: "forum_post",
      extraRisks: ["no_primary_source", "sensational_claim"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for a company's SEC fraud allegations?",
    source_a: reputable({
      idPrefix: "fraud-sec",
      url: "https://www.sec.gov/litigation/litreleases",
      title: "SEC Litigation Releases",
      capsule: "Official SEC enforcement release describing the allegations, charges, and procedural status of the case.",
      source_type: "sec_filing",
    }),
    source_b: weak({
      idPrefix: "fraud-twitter-thread",
      url: "https://hottakefinance.example.com/company-is-a-scam-thread",
      title: "THREAD: Why [Company] Is Definitely A Scam",
      capsule: "Social-media style thread reposted as an article, asserting fraud with no named sources or filings cited.",
      source_type: "social_repost",
      extraRisks: ["no_primary_source", "conflict_of_interest"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for a biotech company's clinical trial results?",
    source_a: reputable({
      idPrefix: "biotech-pr",
      url: "https://www.businesswire.com/news/clinical-trial-results",
      title: "Press Release — Phase 3 Trial Results (Wire Service Distribution)",
      capsule: "Company press release distributed through a regulated wire service, including trial design and named clinical lead.",
      source_type: "official_company",
    }),
    source_b: weak({
      idPrefix: "biotech-pump",
      url: "https://biotechmoonshots.example.com/this-stock-will-10x-on-trial-news",
      title: "This Biotech Will 10x On Trial News — Buy Before Monday",
      capsule: "Promotional stock-pump newsletter speculating on trial outcomes with a paid subscription pitch.",
      commercial_pressure: "promotional",
      extraRisks: ["unsupported_price_prediction", "affiliate_pressure"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for current mortgage rate trends?",
    source_a: reputable({
      idPrefix: "mortgage-freddie",
      url: "https://www.freddiemac.com/pmms",
      title: "Freddie Mac Primary Mortgage Market Survey",
      capsule: "Weekly survey of mortgage lenders published by a government-sponsored enterprise with methodology disclosed.",
      source_type: "government",
    }),
    source_b: weak({
      idPrefix: "mortgage-lead-gen",
      url: "https://bestratesever.example.com/mortgage-rates-today",
      title: "Lock In These INSANE Mortgage Rates Today",
      capsule: "Lead-generation site with rate figures that don't match any cited source, designed to capture contact info.",
      source_type: "lead_gen_page",
      extraRisks: ["weak_citations"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for an ETF's expense ratio and holdings?",
    source_a: reputable({
      idPrefix: "etf-issuer",
      url: "https://www.ishares.com/us/products/etf-fact-sheet",
      title: "iShares ETF Fact Sheet",
      capsule: "Issuer-published fact sheet with audited expense ratio, top holdings, and regulatory disclosures.",
      source_type: "official_company",
    }),
    source_b: weak({
      idPrefix: "etf-reddit",
      url: "https://passiveincomedreams.example.com/best-etf-ever",
      title: "I Found The BEST ETF Nobody Is Talking About",
      capsule: "Personal finance blog with outdated holdings data and an affiliate link to a brokerage signup bonus.",
      commercial_pressure: "affiliate",
      extraRisks: ["outdated_information", "affiliate_pressure"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for a company's executive compensation?",
    source_a: reputable({
      idPrefix: "execcomp-proxy",
      url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=DEF+14A",
      title: "DEF 14A Proxy Statement — SEC EDGAR",
      capsule: "Primary-source proxy statement disclosing executive pay, equity grants, and board compensation committee rationale.",
      source_type: "sec_filing",
    }),
    source_b: weak({
      idPrefix: "execcomp-outrage",
      url: "https://ceopaywatch.example.com/outrageous-ceo-pay",
      title: "CEO Pay Is OUT OF CONTROL — The Numbers Will Shock You",
      capsule: "Outrage-framed blog post citing rounded, unsourced pay figures without referencing the proxy statement.",
      extraRisks: ["weak_citations", "sensational_claim"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for crypto exchange solvency after a market shock?",
    source_a: reputable({
      idPrefix: "exchange-bloomberg",
      url: "https://www.bloomberg.com/crypto",
      title: "Bloomberg — Crypto Markets Coverage",
      capsule: "Financial wire reporting with named reporters and on-record statements from exchange representatives and regulators.",
    }),
    source_b: weak({
      idPrefix: "exchange-telegram-screenshot",
      url: "https://cryptopanicroom.example.com/exchange-is-insolvent-proof",
      title: "PROOF: This Exchange Is Insolvent (Telegram Screenshots)",
      capsule: "Unverified Telegram screenshots reposted as 'proof' of insolvency, with no on-record source.",
      source_type: "forum_post",
      extraRisks: ["no_primary_source", "sensational_claim"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for a startup's Series B funding round?",
    source_a: reputable({
      idPrefix: "funding-techcrunch",
      url: "https://techcrunch.com/category/venture/",
      title: "TechCrunch — Venture Funding Coverage",
      capsule: "Trade press reporting that names the lead investor, round size, and confirms details with the company directly.",
    }),
    source_b: weak({
      idPrefix: "funding-pr-spam",
      url: "https://startupbuzzwire.example.com/series-b-announcement",
      title: "[Startup] Raises 'Massive' Series B (Self-Submitted)",
      capsule: "Self-submitted PR-wire post with vague figures and no named investor, written by the company's marketing team.",
      source_type: "self_submitted_pr",
      extraRisks: ["conflict_of_interest", "weak_citations"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for whether a dividend cut is likely?",
    source_a: reputable({
      idPrefix: "dividend-10k",
      url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=10-K",
      title: "Annual Report (10-K) — Cash Flow and Payout Ratio Disclosures",
      capsule: "Primary-source annual filing with free cash flow, payout ratio, and management's stated dividend policy.",
      source_type: "sec_filing",
    }),
    source_b: weak({
      idPrefix: "dividend-yieldtrap",
      url: "https://highyieldsecrets.example.com/safe-12-percent-dividend",
      title: "This 'Safe' 12% Dividend Is Too Good To Pass Up",
      capsule: "Yield-chasing newsletter calling a high-risk payout 'safe' with no cash-flow analysis, pushing a paid stock-picking service.",
      commercial_pressure: "affiliate",
      extraRisks: ["unsupported_price_prediction", "affiliate_pressure"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for the legitimacy of a new DeFi lending protocol?",
    source_a: reputable({
      idPrefix: "defi-audit",
      url: "https://www.trailofbits.com/reports",
      title: "Trail of Bits — Smart Contract Audit Report",
      capsule: "Independent security audit report disclosing methodology, findings, and severity ratings for the protocol's contracts.",
      source_type: "official_company",
    }),
    source_b: weak({
      idPrefix: "defi-influencer",
      url: "https://defialphacalls.example.com/new-protocol-1000x",
      title: "New DeFi Protocol Will 1000x — Get In Early",
      capsule: "Influencer 'alpha call' post with a referral link to deposit funds, no audit mentioned, urgency framing.",
      source_type: "promotional_page",
      commercial_pressure: "affiliate",
      extraRisks: ["unsupported_price_prediction", "affiliate_pressure", "no_primary_source"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for the outlook on commercial real estate loans?",
    source_a: reputable({
      idPrefix: "cre-fdic",
      url: "https://www.fdic.gov/analysis/quarterly-banking-profile/",
      title: "FDIC Quarterly Banking Profile",
      capsule: "Regulator-published aggregate data on bank loan portfolios, including commercial real estate exposure.",
      source_type: "government",
    }),
    source_b: weak({
      idPrefix: "cre-doomblog",
      url: "https://realestatecollapse.example.com/cre-doom-loop",
      title: "The CRE Doom Loop Is Here And Banks Are Hiding It",
      capsule: "Conspiratorial blog alleging banks are concealing losses, with no cited regulatory data.",
      extraRisks: ["sensational_claim", "no_primary_source"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for whether a company is at risk of delisting?",
    source_a: reputable({
      idPrefix: "delist-nasdaq",
      url: "https://listingcenter.nasdaq.com/",
      title: "Nasdaq Listing Center — Compliance Notices",
      capsule: "Exchange-published compliance notice describing the specific listing requirement at issue and the cure period.",
      source_type: "government",
    }),
    source_b: weak({
      idPrefix: "delist-rumor-mill",
      url: "https://pennystockalerts.example.com/about-to-be-delisted",
      title: "BREAKING: This Stock Is About To Be Delisted (Sources Say)",
      capsule: "Anonymous tip-style post citing unnamed 'sources' with no link to an actual exchange notice.",
      source_type: "forum_post",
      extraRisks: ["no_primary_source", "sensational_claim"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for the accuracy of a company's same-store sales growth?",
    source_a: reputable({
      idPrefix: "retail-earnings-call",
      url: "https://www.nasdaq.com/market-activity/earnings/transcripts",
      title: "Earnings Call Transcript — CFO Same-Store Sales Commentary",
      capsule: "Verbatim transcript of the CFO's same-store sales commentary during the official earnings call.",
      source_type: "reputable_financial_news",
    }),
    source_b: weak({
      idPrefix: "retail-guesswork",
      url: "https://retailtrendswire.example.com/same-store-sales-guess",
      title: "Our Estimate Of [Retailer]'s Same-Store Sales (Unofficial)",
      capsule: "Self-described 'unofficial estimate' with no methodology disclosed and no link to the company's actual reporting.",
      extraRisks: ["weak_citations", "unclear_evidence"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for whether a meme coin has utility?",
    source_a: reputable({
      idPrefix: "memecoin-explainer",
      url: "https://www.investopedia.com/meme-coin-5205294",
      title: "Investopedia — What Is a Meme Coin?",
      capsule: "Educational explainer describing the typical lack of utility in meme coins and how to evaluate claims of utility.",
      source_type: "reputable_financial_news",
    }),
    source_b: weak({
      idPrefix: "memecoin-roadmap",
      url: "https://nextdogetoken.example.com/utility-roadmap",
      title: "Our Utility Roadmap Will Change Everything",
      capsule: "Project's own marketing page describing a vague 'roadmap' with no shipped product, written anonymously.",
      source_type: "promotional_page",
      extraRisks: ["conflict_of_interest", "unsupported_price_prediction"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for analyst price targets on a semiconductor stock?",
    source_a: reputable({
      idPrefix: "semi-analyst-note",
      url: "https://www.marketwatch.com/investing/stock/research",
      title: "Sell-Side Analyst Research Note (Named Analyst, Disclosed Methodology)",
      capsule: "Named analyst report disclosing valuation methodology, assumptions, and the bank's potential conflicts of interest.",
      source_type: "reputable_financial_news",
    }),
    source_b: weak({
      idPrefix: "semi-anon-target",
      url: "https://chipstockalerts.example.com/price-target-500",
      title: "$500 Price Target By End Of Year — Trust Me",
      capsule: "Anonymous price target with no valuation methodology, framed as personal conviction rather than analysis.",
      extraRisks: ["unsupported_price_prediction", "no_primary_source"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for a bank's exposure to a regional banking crisis?",
    source_a: reputable({
      idPrefix: "bank-call-report",
      url: "https://cdr.ffiec.gov/public/",
      title: "FFIEC Call Report Data",
      capsule: "Regulator-collected quarterly call report data disclosing a bank's asset composition and capital ratios.",
      source_type: "government",
    }),
    source_b: weak({
      idPrefix: "bank-runonbank-blog",
      url: "https://bankrunwatch.example.com/this-bank-is-next",
      title: "This Bank Is Next To Collapse — Withdraw Now",
      capsule: "Panic-inducing blog urging withdrawals, citing no call report data or regulator disclosures.",
      extraRisks: ["sensational_claim", "no_primary_source"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for whether an NFT collection's volume is organic?",
    source_a: reputable({
      idPrefix: "nft-chainalysis",
      url: "https://www.chainalysis.com/blog/nft-wash-trading/",
      title: "Chainalysis — NFT Wash Trading Analysis",
      capsule: "On-chain analytics firm's methodology-disclosed report identifying wash-trading patterns in NFT volume data.",
      source_type: "official_company",
    }),
    source_b: weak({
      idPrefix: "nft-floor-hype",
      url: "https://nftfloorpump.example.com/collection-volume-explosion",
      title: "Volume Is EXPLODING On This Collection — Don't Miss The Floor",
      capsule: "Promotional Discord-adjacent blog celebrating volume spikes without checking for wash trading, with mint links.",
      source_type: "promotional_page",
      commercial_pressure: "affiliate",
      extraRisks: ["unsupported_price_prediction", "affiliate_pressure"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for a company's debt maturity schedule?",
    source_a: reputable({
      idPrefix: "debt-10k-notes",
      url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=10-K",
      title: "10-K Notes to Financial Statements — Debt Maturity Schedule",
      capsule: "Primary-source filing footnote disclosing exact debt maturities, interest rates, and covenant terms.",
      source_type: "sec_filing",
    }),
    source_b: weak({
      idPrefix: "debt-fear-blog",
      url: "https://debtbombwarning.example.com/maturity-wall-disaster",
      title: "This Company's Debt Wall Is A Ticking Time Bomb",
      capsule: "Alarmist blog summarizing debt risk with rounded, unsourced numbers that don't match the actual filing.",
      extraRisks: ["weak_citations", "sensational_claim"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for the credibility of a crypto project's whitepaper claims?",
    source_a: reputable({
      idPrefix: "whitepaper-academic",
      url: "https://eprint.iacr.org/",
      title: "Independent Cryptography Review (Academic Preprint Archive)",
      capsule: "Peer-reviewable academic preprint analyzing the cryptographic claims made in the project's whitepaper.",
      source_type: "official_company",
    }),
    source_b: weak({
      idPrefix: "whitepaper-marketing",
      url: "https://nextgenblockchain.example.com/whitepaper-summary",
      title: "Why Our Whitepaper Is Revolutionary",
      capsule: "Project's own marketing summary of its whitepaper, asserting novelty without independent verification.",
      source_type: "promotional_page",
      extraRisks: ["conflict_of_interest", "unclear_evidence"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for whether a company's buyback program is real?",
    source_a: reputable({
      idPrefix: "buyback-8k",
      url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=8-K",
      title: "8-K Filing — Share Repurchase Program Disclosure",
      capsule: "Primary-source filing disclosing the authorized buyback amount, timeline, and board approval.",
      source_type: "sec_filing",
    }),
    source_b: weak({
      idPrefix: "buyback-rumor",
      url: "https://stockbuzzforum.example.com/buyback-rumor-thread",
      title: "Rumor: Massive Buyback Coming (Unconfirmed)",
      capsule: "Forum thread speculating about an unannounced buyback with no filing or company statement cited.",
      source_type: "forum_post",
      extraRisks: ["no_primary_source", "unclear_evidence"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for the current state of crypto regulation in the US?",
    source_a: reputable({
      idPrefix: "regulation-sec-statement",
      url: "https://www.sec.gov/news/statements",
      title: "SEC Public Statements on Digital Asset Regulation",
      capsule: "Official regulator statements outlining current enforcement posture and pending rulemaking on digital assets.",
      source_type: "government",
    }),
    source_b: weak({
      idPrefix: "regulation-fud-blog",
      url: "https://cryptoregfud.example.com/government-coming-for-your-crypto",
      title: "The Government Is Coming For Your Crypto",
      capsule: "Fear-framed blog post misrepresenting proposed rules as confirmed bans, with no citation to actual statements.",
      extraRisks: ["sensational_claim", "weak_citations"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for a company's guidance revision?",
    source_a: reputable({
      idPrefix: "guidance-8k-update",
      url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=8-K",
      title: "8-K Filing — Updated Guidance Disclosure",
      capsule: "Primary-source filing with the company's revised guidance figures and stated reasons for the revision.",
      source_type: "sec_filing",
    }),
    source_b: weak({
      idPrefix: "guidance-overreaction-blog",
      url: "https://overreactionfinance.example.com/guidance-cut-disaster",
      title: "Guidance Cut Means This Stock Is DONE",
      capsule: "Reactionary blog declaring the company 'done' based on a guidance revision, without quoting the actual filing language.",
      extraRisks: ["sensational_claim", "weak_citations"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for the historical volatility of an asset class?",
    source_a: reputable({
      idPrefix: "volatility-cboe",
      url: "https://www.cboe.com/tradable_products/vix/",
      title: "CBOE — VIX Historical Data and Methodology",
      capsule: "Exchange-published volatility index data with disclosed calculation methodology and historical series.",
      source_type: "official_company",
    }),
    source_b: weak({
      idPrefix: "volatility-fearblog",
      url: "https://marketcrashwatch.example.com/volatility-is-off-the-charts",
      title: "Volatility Is OFF THE CHARTS — Brace For Impact",
      capsule: "Sensational blog describing volatility as unprecedented without citing the actual VIX series or historical comparisons.",
      extraRisks: ["sensational_claim", "weak_citations"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for whether a company's insider selling is a red flag?",
    source_a: reputable({
      idPrefix: "insider-form4",
      url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=4",
      title: "Form 4 Filings — Insider Transaction Disclosures",
      capsule: "Primary-source SEC filings disclosing exact insider transactions, including 10b5-1 plan context where applicable.",
      source_type: "sec_filing",
    }),
    source_b: weak({
      idPrefix: "insider-panic-post",
      url: "https://insidersellingalert.example.com/execs-are-dumping",
      title: "Execs Are DUMPING Shares — Here's What They Know",
      capsule: "Alarmist post implying hidden knowledge behind insider sales without checking for scheduled 10b5-1 plans.",
      extraRisks: ["sensational_claim", "unclear_evidence"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for whether a crypto exchange is properly licensed?",
    source_a: reputable({
      idPrefix: "exchange-license-state",
      url: "https://www.nmlsconsumeraccess.org/",
      title: "NMLS Consumer Access — Money Transmitter License Lookup",
      capsule: "Official regulatory database for verifying an exchange's money transmitter licenses by state.",
      source_type: "government",
    }),
    source_b: weak({
      idPrefix: "exchange-trustpilot-spam",
      url: "https://cryptoreviewhub.example.com/exchange-is-fully-licensed",
      title: "This Exchange Is 100% Licensed And Safe (Sponsored)",
      capsule: "Sponsored review claiming full licensure with no link to an actual regulator database, disclosed as paid content.",
      source_type: "promotional_page",
      commercial_pressure: "affiliate",
      extraRisks: ["conflict_of_interest", "no_primary_source"],
    }),
  },
  {
    research_task: "Which source should an AI agent cite for the impact of a stock split on shareholder value?",
    source_a: reputable({
      idPrefix: "split-investor-explainer",
      url: "https://www.investopedia.com/terms/s/stocksplit.asp",
      title: "Investopedia — Stock Splits Explained",
      capsule: "Educational explainer clarifying that stock splits don't change fundamental value, with worked examples.",
      source_type: "reputable_financial_news",
    }),
    source_b: weak({
      idPrefix: "split-hype-post",
      url: "https://stocksplitgains.example.com/split-means-buy-now",
      title: "Stock Split Announced — BUY BEFORE IT'S TOO LATE",
      capsule: "Hype post implying a stock split itself creates value, urging immediate purchase with urgency language.",
      extraRisks: ["sensational_claim", "unsupported_price_prediction"],
    }),
  },
];

export function buildSeedPairs() {
  return RAW_PAIRS.map((pair) => {
    const scoreA = scoreSource(pair.source_a);
    const scoreB = scoreSource(pair.source_b);
    return {
      research_task: pair.research_task,
      source_a_id: pair.source_a.id,
      source_a_url: pair.source_a.url,
      source_a_title: pair.source_a.title,
      source_a_capsule: pair.source_a.capsule,
      source_a_source_type: pair.source_a.source_type,
      source_a_author_transparency: pair.source_a.author_transparency,
      source_a_citation_quality: pair.source_a.citation_quality,
      source_a_evidence_quality: pair.source_a.evidence_quality,
      source_a_commercial_pressure: pair.source_a.commercial_pressure,
      source_a_risk_tags: pair.source_a.risk_tags,
      source_a_machine_score: scoreA,
      source_b_id: pair.source_b.id,
      source_b_url: pair.source_b.url,
      source_b_title: pair.source_b.title,
      source_b_capsule: pair.source_b.capsule,
      source_b_source_type: pair.source_b.source_type,
      source_b_author_transparency: pair.source_b.author_transparency,
      source_b_citation_quality: pair.source_b.citation_quality,
      source_b_evidence_quality: pair.source_b.evidence_quality,
      source_b_commercial_pressure: pair.source_b.commercial_pressure,
      source_b_risk_tags: pair.source_b.risk_tags,
      source_b_machine_score: scoreB,
      machine_preferred_source: preferredSource(scoreA, scoreB),
      machine_reason: "heuristic_baseline_v1",
    };
  });
}
