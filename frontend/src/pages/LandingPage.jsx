import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  FileText,
  ShieldCheck,
  Sparkles,
  UserPlus,
  WalletCards,
  X,
} from "lucide-react";
import LoanScene from "../components/LoanScene.jsx";
import LoanSimulator from "../components/LoanSimulator.jsx";

// Public marketing page shown before a visitor signs in or creates an account.
export default function LandingPage({ onLogin, onSignup }) {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) return undefined;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 },
    );
    document
      .querySelectorAll(".landing-reveal")
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const closeMenu = () => setMenuOpen(false);
  return (
    <div className="landing-shell">
      <CursorSynapse />
      <header className="landing-nav-wrap">
        <nav className="landing-nav">
          <a className="brand landing-brand" href="#top">
            <span className="brand-mark">
              <WalletCards size={18} />
            </span>
            <span>
              loanwise<span className="brand-dot">.</span>
            </span>
          </a>
          <button
            className="landing-menu-toggle"
            aria-label="Toggle navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <X size={20} />
            ) : (
              <span className="menu-lines">☰</span>
            )}
          </button>
          <div className={`landing-links ${menuOpen ? "open" : ""}`}>
            <a href="#simulator" onClick={closeMenu}>
              Simulator
            </a>
            <a href="#platform" onClick={closeMenu}>
              Platform
            </a>
            <a href="#how-it-works" onClick={closeMenu}>
              How it works
            </a>
            <a href="#intelligence" onClick={closeMenu}>
              Risk assessment
            </a>
            <a href="#about" onClick={closeMenu}>
              About
            </a>
          </div>
          <button className="landing-signup-link" onClick={onSignup}>
            Create account
          </button>
          <button className="landing-login" onClick={onLogin}>
            Sign in <ArrowRight size={14} />
          </button>
        </nav>
      </header>
      <main id="top">
        <section className="landing-hero">
          <div className="landing-grid-lines" />
          <div className="landing-hero-inner">
            <div className="landing-hero-copy">
              <div className="landing-eyebrow">
                <span className="eyebrow-spark">
                  <Sparkles size={13} />
                </span>{" "}
                A clearer way to manage lending
              </div>
              <h1>
                Better lending
                <br />
                <em>starts with clarity.</em>
              </h1>
              <p>
                One thoughtful workspace for loan applications, explainable risk
                assessments, disbursements, repayments, and the people behind
                every loan.
              </p>
              <div className="landing-hero-actions">
                <button
                  className="landing-cta"
                  onClick={() =>
                    document
                      .getElementById("platform")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Explore the platform <ArrowRight size={16} />
                </button>
                <button className="landing-quiet-cta" onClick={onSignup}>
                  <span className="play-icon">
                    <UserPlus size={12} />
                  </span>{" "}
                  Create a client account
                </button>
              </div>
              <div className="landing-proof">
                <span className="proof-avatars">
                  <i>AM</i>
                  <i>PS</i>
                  <i>KN</i>
                </span>
                <span>
                  One connected view, from application to final payment.
                </span>
              </div>
            </div>
            <div className="landing-visual">
              <div className="visual-glow" />
              <LoanScene />
              <div className="scene-caption">
                <span className="scene-caption-dot" />
                <span>LOANWISE INTELLIGENCE</span>
                <span>01 — 03</span>
              </div>
              <div className="float-card float-card-approved">
                <span className="float-card-icon">
                  <Check size={15} />
                </span>
                <span>
                  <b>Risk assessment</b>
                  <small>Policy factors saved</small>
                </span>
                <span className="float-card-score">
                  <Check size={13} />
                </span>
              </div>
              <div className="float-card float-card-balance">
                <span className="balance-icon">
                  <WalletCards size={14} />
                </span>
                <span>
                  <small>LOAN WORKSPACE</small>
                  <b>Live records</b>
                </span>
                <span className="balance-trend">
                  <ArrowUpRight size={13} />
                </span>
              </div>
              <div className="orbit-label orbit-label-one">
                01 <span>ASSESS</span>
              </div>
              <div className="orbit-label orbit-label-two">
                02 <span>MANAGE</span>
              </div>
            </div>
          </div>
          <a className="hero-scroll" href="#platform">
            <span /> Scroll to explore
          </a>
          <div className="hero-index">
            BUILT FOR RESPONSIBLE LENDING <span>·</span> 2026
          </div>
        </section>

        <section className="landing-intro landing-reveal" id="platform">
          <div className="section-intro-copy">
            <span className="landing-section-tag">THE PLATFORM</span>
            <h2>
              From first click
              <br />
              to final installment.
            </h2>
          </div>
          <p className="landing-intro-text">
            LoanWise brings every step of the lending journey into one calm,
            connected place. Fewer handoffs. Clearer decisions. A better
            experience for every customer.
          </p>
        </section>

        <section className="feature-grid landing-reveal">
          <article className="feature-card feature-applications">
            <div className="feature-icon icon-app">
              <FileText size={20} />
            </div>
            <span className="feature-number">01 / APPLICATIONS</span>
            <h3>Start with a simpler application.</h3>
            <p>
              Clients enter the details that matter, save time, and follow their
              application from one personal dashboard.
            </p>
            <div className="mini-form-visual">
              <span className="mini-form-title">
                Loan application <i>Step 2 of 3</i>
              </span>
              <span className="mini-input">
                <small>Loan purpose</small>
                <b>Enter loan purpose</b>
                <ChevronDown size={12} />
              </span>
              <span className="mini-progress">
                <i />
              </span>
            </div>
            <span className="feature-bottom-link">
              A guided, personal experience <ArrowRight size={13} />
            </span>
          </article>
          <article
            className="feature-card feature-assessment"
            id="intelligence"
          >
            <div className="feature-icon icon-ai">
              <Sparkles size={20} />
            </div>
            <span className="feature-number">02 / RISK ASSESSMENT</span>
            <h3>Make every decision explainable.</h3>
            <p>
              The backend applies configured affordability rules, shows the
              factors behind its outcome, and records the assessment.
            </p>
            <div className="risk-meter">
              <div className="meter-head">
                <span>Affordability assessment</span>
                <b>
                  <small>Saved to application</small>
                </b>
              </div>
              <div className="meter-line">
                <i />
              </div>
              <div className="meter-legend">
                <span>
                  <i />
                  Within policy
                </span>
                <span>Policy review</span>
              </div>
              <div className="factor-chip">
                <Check size={12} /> Debt-to-income within policy
              </div>
            </div>
            <span className="feature-bottom-link">
              Transparent by design <ArrowRight size={13} />
            </span>
          </article>
          <article className="feature-card feature-servicing">
            <div className="feature-icon icon-servicing">
              <CalendarDays size={20} />
            </div>
            <span className="feature-number">03 / LOAN SERVICING</span>
            <h3>Keep every payment in view.</h3>
            <p>
              Track disbursements, balances, due dates, and collected
              repayments. Send reminders before a payment slips by.
            </p>
            <div className="payment-visual">
              <div className="payment-visual-head">
                <span>Repayment schedule</span>
                <span>•••</span>
              </div>
              <div className="payment-row">
                <span className="payment-day">
                  <CalendarDays size={16} />
                </span>
                <span className="payment-detail">
                  <b>Scheduled repayment</b>
                  <small>Due date and balance from loan records</small>
                </span>
                <span className="payment-value">Tracked</span>
              </div>
              <div className="payment-row">
                <span className="payment-day">
                  <CalendarDays size={16} />
                </span>
                <span className="payment-detail">
                  <b>Payment status</b>
                  <small>Recorded in the client account</small>
                </span>
                <span className="payment-value">Tracked</span>
              </div>
            </div>
            <span className="feature-bottom-link">
              From disbursal to payoff <ArrowRight size={13} />
            </span>
          </article>
        </section>

        <section className="landing-simulator-wrap landing-reveal" id="simulator">
          <div className="section-intro-copy">
            <span className="landing-section-tag">INTERACTIVE SIMULATOR</span>
            <h2>Estimate before you apply.</h2>
          </div>
          <LoanSimulator />
        </section>

        <section className="how-section" id="how-it-works">
          <div className="how-heading landing-reveal">
            <span className="landing-section-tag">HOW IT WORKS</span>
            <h2>
              One journey.
              <br />
              <em>Every step connected.</em>
            </h2>
            <p>
              Clients and lending teams see the information they need, right
              when they need it.
            </p>
          </div>
          <div className="journey-line">
            <div className="journey-fill" />
          </div>
          <div className="journey-steps">
            <article className="journey-step landing-reveal">
              <span className="journey-count">01</span>
              <div className="journey-card-icon">
                <UserPlus size={19} />
              </div>
              <h3>Apply with confidence</h3>
              <p>
                Clients securely submit their loan details and follow progress
                from their own dashboard.
              </p>
              <span className="journey-caption">CLIENT PORTAL</span>
            </article>
            <article className="journey-step landing-reveal">
              <span className="journey-count">02</span>
              <div className="journey-card-icon">
                <Sparkles size={19} />
              </div>
              <h3>Assess with clarity</h3>
              <p>
                The backend applies configured rules, saves its reasoning, and
                routes missing information.
              </p>
              <span className="journey-caption">POLICY ASSESSMENT</span>
            </article>
            <article className="journey-step landing-reveal">
              <span className="journey-count">03</span>
              <div className="journey-card-icon">
                <WalletCards size={19} />
              </div>
              <h3>Manage the full loan</h3>
              <p>
                Track disbursement, balances, upcoming payments, and
                notifications from one place.
              </p>
              <span className="journey-caption">LOAN SERVICING</span>
            </article>
          </div>
        </section>

        <section className="landing-transparency landing-reveal">
          <div className="transparency-orb">
            <div className="transparency-ring ring-a" />
            <div className="transparency-ring ring-b" />
            <div className="transparency-core">
              <ShieldCheck size={30} />
            </div>
            <span className="transparency-node node-a">
              <Check size={11} />
            </span>
            <span className="transparency-node node-b">
              <Activity size={11} />
            </span>
            <span className="transparency-node node-c">
              <FileText size={11} />
            </span>
          </div>
          <div className="transparency-copy">
            <span className="landing-section-tag">RESPONSIBLE BY DESIGN</span>
            <h2>
              Decisions you can
              <br />
              <em>understand and audit.</em>
            </h2>
            <p>
              LoanWise keeps assessment recommendations tied to visible policy
              factors and a recorded assessment. Staff stay accountable for the
              lending rules the system applies.
            </p>
            <div className="transparency-points">
              <span>
                <Check size={14} /> Clear factor explanations
              </span>
              <span>
                <Check size={14} /> Recorded decision history
              </span>
              <span>
                <Check size={14} /> Separate client and staff access
              </span>
            </div>
          </div>
        </section>

        <section className="landing-cta-section landing-reveal" id="about">
          <div className="cta-decoration cta-decoration-one" />
          <div className="cta-decoration cta-decoration-two" />
          <span className="landing-section-tag">
            A MORE CONNECTED WORKSPACE
          </span>
          <h2>
            Bring the whole loan
            <br />
            journey together.
          </h2>
          <p>
            Give your team and your clients a clearer view of what happens next.
          </p>
          <button className="landing-cta cta-light" onClick={onLogin}>
            Enter LoanWise <ArrowRight size={16} />
          </button>
          <span className="cta-note">
            <ShieldCheck size={13} /> Secure sign-in for clients and lending
            teams
          </span>
        </section>
      </main>
      <footer className="landing-footer">
        <div className="landing-footer-main">
          <div className="footer-brand-block">
            <a className="brand landing-brand" href="#top">
              <span className="brand-mark">
                <WalletCards size={18} />
              </span>
              <span>
                loanwise<span className="brand-dot">.</span>
              </span>
            </a>
            <p>Thoughtful tools for a clearer lending journey.</p>
          </div>
          <div className="footer-column">
            <b>PLATFORM</b>
            <a href="#platform">Applications</a>
            <a href="#intelligence">AI assessment</a>
            <a href="#platform">Loan servicing</a>
          </div>
          <div className="footer-column">
            <b>EXPLORE</b>
            <a href="#how-it-works">How it works</a>
            <a href="#about">About LoanWise</a>
            <button onClick={onLogin}>Sign in</button>
          </div>
          <div className="footer-column footer-contact">
            <b>YOUR ACCOUNT</b>
            <span>Sign in to view applications, loans, and repayments.</span>
            <button onClick={onLogin}>
              Open loan portal <ArrowUpRight size={12} />
            </button>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <span>© 2026 LoanWise Financial</span>
          <span>Designed for clearer lending.</span>
          <div>
            <span>Secure account access</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CursorSynapse() {
  const ref = useRef(null);
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced || window.matchMedia("(pointer: coarse)").matches)
      return undefined;
    let frame = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let visible = false;
    const move = (event) => {
      x = event.clientX;
      y = event.clientY;
      visible = true;
    };
    const render = () => {
      if (ref.current && visible)
        ref.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      frame = requestAnimationFrame(render);
    };
    window.addEventListener("pointermove", move, { passive: true });
    frame = requestAnimationFrame(render);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <div className="cursor-synapse" ref={ref} aria-hidden="true">
      <i className="synapse-core" />
      <i className="synapse-node synapse-one" />
      <i className="synapse-node synapse-two" />
      <i className="synapse-node synapse-three" />
    </div>
  );
}
