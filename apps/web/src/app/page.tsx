"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Bookmark,
  ChevronDown,
  Play,
  Search,
} from "lucide-react";

import styles from "./page.module.css";

const asset = "/estate-hub/uploads/web/";

const listings = [
  { city: "seattle", type: "buy", price: "$758,500", address: "9 Harbor View Ln, Seattle", meta: "$402/sqft · 9d on market", trend: "+5.8%", image: "listing_seattle.jpg" },
  { city: "denver", type: "buy", price: "$648,000", address: "3128 W 38th Ave, Denver", meta: "$468/sqft · 14d on market", trend: "+3.1%", image: "listing_denver.jpg" },
  { city: "austin", type: "rent", price: "$3,450/mo", address: "1701 Willow St, Austin", meta: "$2.48/sqft · 6d on market", trend: "−1.4%", image: "listing_austin.jpg" },
  { city: "chicago", type: "new", price: "$524,900", address: "1407 N Damen Ave, Chicago", meta: "$375/sqft · 2d on market", trend: "+1.8%", image: "listing_chicago.jpg" },
  { city: "phoenix", type: "buy", price: "$586,000", address: "1826 E Osborn Rd, Phoenix", meta: "$316/sqft · 11d on market", trend: "+4.4%", image: "listing_phoenix.jpg" },
  { city: "portland", type: "rent", price: "$2,850/mo", address: "2420 NW Raleigh St, Portland", meta: "$2.10/sqft · 4d on market", trend: "−0.6%", image: "listing_portland.jpg" },
];

const neighborhoods = [
  ["Riverside Park", "Median $538k · 4.1% yield", "Walk 88 · Schools 84", "hood_riverside.jpg"],
  ["Downtown Core", "Median $712k · 5.6% yield", "Walk 96 · Schools 71", "hood_downtown.jpg"],
  ["Lakeside", "Median $824k · 3.2% yield", "Walk 61 · Schools 92", "hood_lakeside.jpg"],
  ["Hillcrest", "Median $649k · 4.8% yield", "Walk 72 · Schools 89", "hood_hillcrest.jpg"],
];

const metrics = [
  ["Price intelligence", "Know what a home is worth before the open house.", "Median $612k", "#6c6cf5"],
  ["Rental yield", "Model income, vacancy, tax and maintenance in one view.", "4.7% average", "#0d9488"],
  ["Neighborhood score", "Walkability, schools and safety at a glance.", "83 / 100", "#e11d48"],
  ["Market momentum", "See demand before it becomes a headline.", "+3.4% YoY", "#d97706"],
  ["Comparable homes", "The right comps, not just the closest ones.", "42 nearby", "#0284c7"],
  ["Price path", "Follow every reduction, sale and estimate.", "Daily refresh", "#7c3aed"],
];

function Trend({ children }: { children: string }) {
  return <span className={children.startsWith("+") ? styles.up : styles.down}>{children}</span>;
}

export default function Home() {
  const [filter, setFilter] = useState("all");
  const [saved, setSaved] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const visibleListings = listings.filter((listing) => filter === "all" || listing.type === filter);

  const saveListing = (address: string) => {
    setSaved((current) => current.includes(address) ? current.filter((item) => item !== address) : [...current, address]);
  };

  return (
    <main className={styles.page} id="top">
      <div className={styles.navShell}>
        <header className={styles.nav}>
          <a className={styles.brand} href="#top"><span className={styles.orb} />estate hub</a>
          <nav className={styles.links}><a href="#listings">Buy</a><a href="#listings">Rent</a><a className={styles.active} href="#market">Analytics</a><a href="#neighborhoods">Neighborhoods</a><a href="#faq">Pricing</a></nav>
          <div className={styles.navActions}><a href="/login">Sign in</a><a className={styles.darkButton} href="#cta">Get started</a><button className={styles.menuButton} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">☰</button></div>
        </header>
        {menuOpen && <nav className={styles.mobileMenu}><a href="#listings">Buy & rent</a><a href="#market">Analytics</a><a href="#neighborhoods">Neighborhoods</a><a href="#faq">Pricing</a></nav>}
      </div>

      <section className={`${styles.container} ${styles.hero}`}>
        <div className={styles.badge}><i /> Real estate analytics, reimagined</div>
        <h1>Find your next home.<br />See the market deeper than ever.</h1>
        <p>Every listing comes with the full picture — price trends, neighborhood scores, rental yield, and school and safety data.</p>
        <form className={styles.search} onSubmit={(event) => event.preventDefault()}><Search size={18} /><input aria-label="Search listings" placeholder="Search a city, neighborhood, or address" /><button>Search</button></form>
        <div className={styles.filters}>{[["all", "All types"], ["buy", "Buy"], ["rent", "Rent"], ["new", "New builds"]].map(([value, label]) => <button key={value} className={filter === value ? styles.selected : ""} onClick={() => setFilter(value)}>{label}</button>)}</div>
        <div className={styles.heroMedia}>
          <video autoPlay loop muted playsInline poster={`${asset}video_poster.jpg`}><source src="/estate-hub/uploads/tour_neighborhood.mp4" type="video/mp4" /></video>
          <span className={styles.live}>● estate-index-v1 · live</span><button className={styles.play} aria-label="Play video"><Play fill="currentColor" size={21} /></button>
          <div className={styles.floatLeft}><small>Homes in view</small><strong>342</strong></div><div className={styles.floatRight}><small>Median price</small><strong>$612,400</strong></div>
        </div>
      </section>

      <section className={styles.container}><div className={styles.ticker}>{["Denver +3.1%", "Austin −1.4%", "Seattle +6.0%", "Chicago +1.8%", "Phoenix +4.4%", "Portland −0.6%"].map((item) => <span key={item}>{item}</span>)}</div><div className={styles.partners}><small>DATA SOURCED & VERIFIED WITH</small><div>MLS Direct <b>CoreParcel</b> Redline Data <b>CivicStat</b> SchoolGrade <b>WalkIndex</b></div></div><div className={styles.stats}>{[["2.4M", "listings tracked"], ["340", "metro markets"], ["180+", "metrics per home"], ["Daily", "data refresh"]].map(([number, label]) => <div key={label}><strong>{number}</strong><span>{label}</span></div>)}</div></section>

      <section className={`${styles.container} ${styles.section}`} id="market"><SectionTitle eyebrow="Market pulse" title="Where prices have actually gone" link="Full market report" /><div className={styles.marketGrid}><div className={styles.chartCard}><div className={styles.chartTop}><div><b>Median sale price index</b><p>Indexed to 100 at Jan 2021 · three metros</p></div><div className={styles.legend}><span><i />Denver</span><span><i />Austin</span><span><i />Seattle</span></div></div><svg className={styles.chart} viewBox="0 0 700 250" aria-label="Price index chart"><path d="M38 44H610M38 112H610M38 180H610" /><polyline points="38,178 152,128 267,104 381,93 496,74 610,58" className={styles.denver} /><polyline points="38,178 152,84 267,124 381,150 496,158 610,165" className={styles.austin} /><polyline points="38,178 152,138 267,112 381,80 496,53 610,31" className={styles.seattle} />{["2021", "2022", "2023", "2024", "2025", "2026"].map((year, index) => <text key={year} x={38 + index * 114} y="225">{year}</text>)}</svg></div><div className={styles.tiles}>{[["National median, last 12 months", "$612,400", "+3.4% year over year"], ["Median days on market", "24", "−6 days vs. last year"], ["Active inventory", "1.02M", "+8.1% vs. last year"]].map(([label, value, delta]) => <div key={label}><small>{label}</small><strong>{value}</strong><Trend>{delta}</Trend></div>)}</div></div></section>

      <section className={`${styles.container} ${styles.section}`} id="listings"><SectionTitle eyebrow="Handpicked" title="Featured listings" link="View all" /><div className={styles.listings}>{visibleListings.map((listing) => <article className={styles.listing} key={listing.address}><div className={styles.listingImage}><img src={asset + listing.image} alt="" /><span>{listing.type === "new" ? "New build" : listing.type === "rent" ? "For rent" : "For sale"}</span><button onClick={() => saveListing(listing.address)} aria-label={`Save ${listing.address}`}><Bookmark fill={saved.includes(listing.address) ? "#6c6cf5" : "none"} /></button></div><div className={styles.listingBody}><div><strong>{listing.price}</strong><Trend>{listing.trend}</Trend></div><h3>{listing.address}</h3><p>{listing.meta}</p><div><em>Price history</em><em>Walk 88</em></div></div></article>)}</div></section>

      <section className={`${styles.container} ${styles.section} ${styles.spotlight}`}><div className={styles.spotImage}><img src={asset + "poster_interior.jpg"} alt="Sunlit modern interior" /><button className={styles.play} aria-label="Play walkthrough"><Play fill="currentColor" size={20} /></button></div><div><p className={styles.eyebrow}>LISTING SPOTLIGHT</p><h2>9 Harbor View Ln, Seattle</h2><p className={styles.lede}>5 bd · 4 ba · 3,020 sqft · listed 9 days ago at $758,500. Walk the whole house before you book a viewing, then check the numbers underneath it.</p><div className={styles.scores}>{[["Walkability", 91], ["School rating", 88], ["Safety index", 76], ["Rental yield", 62]].map(([label, score]) => <div key={String(label)}><span>{label}</span><i><b style={{ width: `${score}%` }} /></i><strong>{score}{label === "Rental yield" ? "%" : ""}</strong></div>)}</div><a className={styles.darkButton} href="#cta">See full report</a></div></section>

      <section className={`${styles.container} ${styles.section}`} id="analytics"><div className={styles.centerTitle}><p className={styles.eyebrow}>EVERY ANGLE</p><h2>Every listing, fully analyzed</h2><p>Six metric families, refreshed daily across 340 metro markets.</p></div><div className={styles.metrics}>{metrics.map(([title, copy, stat, color]) => <article key={title}><span style={{ backgroundColor: `${color}22`, color }}>{title.slice(0, 1)}</span><h3>{title}</h3><p>{copy}</p><small>{stat}</small><i><b style={{ width: `${55 + title.length * 2}%`, backgroundColor: color }} /></i></article>)}</div></section>

      <section className={`${styles.container} ${styles.section}`} id="neighborhoods"><SectionTitle eyebrow="Where to look" title="Neighborhoods worth a second look" link="Browse all 1,240" /><div className={styles.neighborhoods}>{neighborhoods.map(([name, meta, score, image]) => <a href="#cta" key={name}><img src={asset + image} alt="" /><div><h3>{name}</h3><p>{meta}</p><span>{score}</span></div></a>)}</div></section>

      <section className={`${styles.container} ${styles.section} ${styles.appBlock}`}><div><p className={styles.eyebrow}>ON THE MOVE</p><h2>The whole index, in your pocket</h2><p className={styles.lede}>Scan a house from the sidewalk and get its full report before you reach the front door.</p><ul><li>Instant valuation and price history</li><li>Price-drop alerts on saved listings</li><li>Offline neighborhood reports</li></ul><button className={styles.store}> App Store</button><button className={styles.store}>▶ Google Play</button></div><img src={asset + "app_mobile.jpg"} alt="Estate Hub mobile app" /></section>

      <section className={`${styles.container} ${styles.section} ${styles.faq}`} id="faq"><div><p className={styles.eyebrow}>QUESTIONS</p><h2>Before you sign up</h2><p className={styles.lede}>Still unsure? Talk to the team — we answer within a day.</p></div><div>{["Is estate hub free?", "Where does the data come from?", "How often is it refreshed?", "Do you sell my search history?"].map((question, index) => <details key={question} open={index === 0}><summary>{question}<ChevronDown size={18} /></summary><p>Search, listings, and neighborhood scores are free forever. Pro unlocks the complete report, saved searches, and price-drop alerts across every market you track.</p></details>)}</div></section>

      <section className={`${styles.container} ${styles.section}`} id="cta"><div className={styles.cta}><div><h2>Ready to see deeper?</h2><p>Create a free account and get full analytics on every listing you view.</p></div><a href="/login">Get started free <ArrowUpRight size={16} /></a></div></section>
      <footer className={`${styles.container} ${styles.footer}`}><div className={styles.brand}><span className={styles.orb} />estate hub</div><p>© 2026 estate hub. Housing intelligence for everyone.</p></footer>
    </main>
  );
}

function SectionTitle({ eyebrow, title, link }: { eyebrow: string; title: string; link: string }) {
  return <div className={styles.sectionHead}><div><p className={styles.eyebrow}>{eyebrow}</p><h2>{title}</h2></div><a href="#cta">{link} <ArrowUpRight size={15} /></a></div>;
}
