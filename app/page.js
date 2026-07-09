"use client";

import { useMemo } from "react";
import { motion } from "motion/react";

const PHONE_DISPLAY = "617-710-8071";
const PHONE_LINK = "6177108071";
const EMAIL = "operations@bvdlogistics.com";
const FALLBACK = "https://picsum.photos/seed/bvd-fb/1600/900";

const HERO_IMGS = [
  "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=2400&q=85",
  "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=2400&q=85",
  "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=2400&q=85",
];

const GALLERY_IMGS = [
  "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1494412574643-ff2f0d1f5a31?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1556388158-158ea5ccacbd?auto=format&fit=crop&w=1400&q=80",
];

const STATS = [
  { value: "26 FT", label: "Box Truck Fleet" },
  { value: "2-Man", label: "Dedicated Crews" },
  { value: "4 States", label: "MA · RI · NH · ME" },
  { value: "On Time", label: "Every Route" },
];

const SERVICES = [
  { icon: "/icons/service-ltl.svg",       title: "Retail Pool Distribution",      body: "Organized retail freight from warehouses and terminals to store locations." },
  { icon: "/icons/service-pool.svg",      title: "Final-Mile Delivery Routes",    body: "Dedicated route support for daily, scheduled, overflow, and regional work." },
  { icon: "/icons/service-linehaul.svg",  title: "Pallet Pickup and Delivery",    body: "Scheduled or urgent pallet movement with liftgate-equipped box truck support." },
  { icon: "/icons/service-warehouse.svg", title: "Store Deliveries",              body: "Professional deliveries aligned with receiving windows and dock procedures." },
  { icon: "/icons/service-ltl.svg",       title: "Warehouse Pickup and Transfer", body: "Reliable transfer between facilities, docks, stores, and business locations." },
  { icon: "/icons/service-pool.svg",      title: "B2B Freight Delivery",          body: "Commercial freight for pallets, boxed inventory, equipment, and supplies." },
  { icon: "/icons/service-linehaul.svg",  title: "Dedicated Two-Man Teams",       body: "Two-person crews for heavier freight, high-touch routes, and customer delivery." },
  { icon: "/icons/service-warehouse.svg", title: "Regional Box Truck Delivery",   body: "Fleet support across MA, RI, NH, and ME for routes and commercial freight." },
];

const WHY = [
  "Reliable route coverage",
  "Retail freight experience",
  "Dedicated two-man teams",
  "Pallet delivery capability",
  "Regional MA · RI · NH · ME coverage",
  "26 FT fleet with liftgate",
  "Clear, direct communication",
  "Flexible service options",
];

const BRANDS = ["Burlington Coat Factory", "Gap", "Famous Footwear", "Guitar Center", "Bed Bath & Beyond", "Target", "GNC"];

const INDUSTRIES = [
  "Final-Mile Delivery Companies",
  "Third-Party Logistics Providers",
  "Retail Distribution Networks",
  "Retail Stores",
  "Warehouses & Distribution Centers",
  "Freight Brokers",
  "Appliance & Furniture Delivery",
  "Commercial Businesses",
];

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.6, ease: "easeOut" },
};

function pick(pool, used) {
  const avail = pool.filter((x) => !used.has(x));
  const src = avail.length ? avail : pool;
  const val = src[Math.floor(Math.random() * src.length)];
  used.add(val);
  return val;
}

function imgErr(e) {
  e.currentTarget.onerror = null;
  e.currentTarget.src = FALLBACK;
}

export default function HomePage() {
  const imgs = useMemo(() => {
    const u = new Set();
    return { hero: pick(HERO_IMGS, u), about: pick(GALLERY_IMGS, u), ops: pick(GALLERY_IMGS, u) };
  }, []);

  return (
    <div className="mk-root">

      {/* NAV */}
      <header className="mk-nav">
        <div className="mk-nav-inner">
          <span className="mk-logo"><strong>BVD</strong> Logistics</span>
          <nav className="mk-nav-links">
            <a href="#services">Services</a>
            <a href="#experience">Experience</a>
            <a className="mk-nav-cta" href={`tel:${PHONE_LINK}`}>Call {PHONE_DISPLAY}</a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="mk-hero" style={{ backgroundImage: `url(${imgs.hero})` }}>
        <div className="mk-hero-overlay" />
        <div className="mk-hero-body">
          <motion.div
            className="mk-hero-text"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <p className="mk-eyebrow">Bella Vista Dedicated Logistics LLC</p>
            <h1 className="mk-hero-h1">Reliable Final-Mile,<br />Retail Distribution &<br />Box Truck Delivery.</h1>
            <p className="mk-hero-sub">
              Dedicated delivery teams for retail freight, pallet deliveries, final-mile routes,
              and regional logistics across MA, RI, NH & ME.
            </p>
            <div className="mk-hero-actions">
              <a className="mk-btn-white" href={`tel:${PHONE_LINK}`}>Call {PHONE_DISPLAY}</a>
              <a className="mk-btn-ghost" href={`mailto:${EMAIL}`}>Email Us</a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="mk-stats-bar">
        {STATS.map((s) => (
          <div className="mk-stat" key={s.label}>
            <span className="mk-stat-val">{s.value}</span>
            <span className="mk-stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      {/* ABOUT */}
      <section className="mk-section">
        <div className="mk-container mk-split">
          <motion.div className="mk-split-text" {...fadeUp}>
            <p className="mk-kicker">About BVD Logistics</p>
            <h2>A Delivery Partner Built for Real Operations</h2>
            <p>
              We specialize in retail pool distribution, final-mile delivery, pallet pickups, store
              deliveries, and B2B freight — with 26 FT liftgate trucks and dedicated two-man crews.
            </p>
            <p>
              Reliability, communication, and careful freight handling. That is what every logistics
              partner, retailer, and warehouse gets when they work with BVD Logistics.
            </p>
            <a className="mk-btn-navy" href={`tel:${PHONE_LINK}`}>Speak With Our Team</a>
          </motion.div>
          <motion.div className="mk-split-img" {...fadeUp}>
            <img src={imgs.about} alt="Delivery operations" onError={imgErr} />
          </motion.div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="mk-section mk-dark" id="services">
        <div className="mk-container">
          <motion.div className="mk-section-header" {...fadeUp}>
            <p className="mk-kicker mk-kicker-light">What We Do</p>
            <h2 style={{ color: "#fff" }}>Freight & Delivery Services</h2>
          </motion.div>
          <div className="mk-services-grid">
            {SERVICES.map((s, i) => (
              <motion.article
                key={s.title}
                className="mk-service-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.12 }}
                transition={{ duration: 0.45, delay: i * 0.05, ease: "easeOut" }}
              >
                <img className="mk-service-icon" src={s.icon} alt="" aria-hidden="true" />
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* WHY + EXPERIENCE */}
      <section className="mk-section" id="experience">
        <div className="mk-container mk-two-col">
          <motion.div {...fadeUp}>
            <p className="mk-kicker">Why BVD Logistics</p>
            <h2>What We Bring to Every Route</h2>
            <ul className="mk-checklist">
              {WHY.map((w) => (
                <li key={w}><span className="mk-check" aria-hidden="true">✓</span>{w}</li>
              ))}
            </ul>
          </motion.div>
          <motion.div {...fadeUp}>
            <p className="mk-kicker">Retail Experience</p>
            <h2>Distribution Work That Matters</h2>
            <p className="mk-body-md">
              Our team has hands-on experience supporting retail pool distribution and third-party
              logistics for major brands — giving us an understanding of store delivery windows,
              dock procedures, and freight timelines.
            </p>
            <div className="mk-brands-grid">
              {BRANDS.map((b) => (
                <div className="mk-brand-pill" key={b}>{b}</div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="mk-section mk-gray">
        <div className="mk-container">
          <motion.div className="mk-section-header" {...fadeUp}>
            <p className="mk-kicker">Who We Serve</p>
            <h2>Industries & Partners</h2>
          </motion.div>
          <div className="mk-industries-grid">
            {INDUSTRIES.map((ind, i) => (
              <motion.div
                key={ind}
                className="mk-industry-card"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.18 }}
                transition={{ duration: 0.38, delay: i * 0.04, ease: "easeOut" }}
              >{ind}</motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICE AREA */}
      <section className="mk-area-band">
        <div className="mk-container mk-area-inner">
          <motion.div {...fadeUp}>
            <p className="mk-kicker mk-kicker-light">Service Area</p>
            <h2 style={{ color: "#fff" }}>Serving New England</h2>
            <p>Regional routes, pallet delivery, and retail freight support.</p>
          </motion.div>
          <div className="mk-area-states">
            {["Massachusetts", "Rhode Island", "New Hampshire", "Maine"].map((s) => (
              <div className="mk-area-state" key={s}>{s}</div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mk-cta-band">
        <div className="mk-container mk-cta-inner">
          <motion.div {...fadeUp}>
            <h2>Need a Reliable Delivery Partner?</h2>
            <p>Contact BVD Logistics for route coverage, pallet delivery, retail freight, or a full logistics partnership.</p>
          </motion.div>
          <motion.div className="mk-cta-actions" {...fadeUp}>
            <a className="mk-btn-white" href={`tel:${PHONE_LINK}`}>Call {PHONE_DISPLAY}</a>
            <a className="mk-btn-ghost" href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mk-footer">
        <div className="mk-container mk-footer-inner">
          <span className="mk-logo"><strong>BVD</strong> Logistics</span>
          <span className="mk-footer-copy">Bella Vista Dedicated Logistics LLC · MA, RI, NH, ME</span>
          <div className="mk-footer-links">
            <a href={`tel:${PHONE_LINK}`}>{PHONE_DISPLAY}</a>
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
