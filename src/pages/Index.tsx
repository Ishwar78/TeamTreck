import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Clock, Monitor, Camera, Globe, BarChart3, Users, Shield, Zap,Star,
  ArrowRight, CheckCircle2
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Client from "./client";
// import FAQ from "./faq";

import timeImg from "@/images/time.png";
import screenshotImg from "@/images/screenshot.png";
import reportImg from "@/images/report.png";
import urlImg from "@/images/url.png";
import StartTracking from "./StartTracking";
import industryImg1 from "@/images/industry1.webp";
import Pricing from "./Pricing";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const features = [
  { icon: Clock, title: "Time Tracking", desc: "Automatic app start/stop, active & idle time logging with per-user daily timelines." },
  { icon: Camera, title: "Screenshot Monitoring", desc: "12 silent screenshots/hour at randomized intervals. Secure upload with optional blur." },
  { icon: Globe, title: "URL & App Tracking", desc: "Track active windows, browser tabs, and time spent per application or website." },
  { icon: Monitor, title: "Idle Detection", desc: "Real-time active/idle/offline status detection with keyboard & mouse monitoring." },
  { icon: BarChart3, title: "Productivity Analytics", desc: "Daily, weekly & monthly reports with PDF/CSV export and company-wide insights." },
  { icon: Users, title: "Team Management", desc: "Role-based access with Company Admin, Sub-Admin, and Employee roles." },
  { icon: Shield, title: "Data Isolation", desc: "Strict multi-tenant architecture with company-wise data isolation on every table." },
  { icon: Zap, title: "Desktop Agent", desc: "Silent background agent for Windows, Mac & Linux. Auto-start, tray-based, tamper-proof." },
];






const stats = [
  { value: "99.9%", label: "Uptime" },
  { value: "10M+", label: "Hours Tracked" },
  { value: "500+", label: "Companies" },
  // { value: "<1s", label: "Sync Latency" },
];

const Index = () => {
const [openIndex, setOpenIndex] = useState<number | null>(null);
const featureScreens = [
  { label: "Time Tracking", image: timeImg },
  { label: "Screenshot Monitoring", image: screenshotImg },
  { label: "Insights Report", image: reportImg },
  { label: "URL Tracking", image: urlImg },
];

const FeatureTabs = () => {
  const [active, setActive] = useState(0);

  return (
    <div className="max-w-5xl mx-auto">

      {/* Tab Buttons */}
      <div className="flex flex-wrap justify-center gap-4 mb-10">
        {featureScreens.map((f, i) => (
          <button
            key={f.label}
            onClick={() => setActive(i)}
            className={`px-6 py-3 rounded-full border transition-all duration-300 ${
              active === i
                ? "bg-primary text-white border-primary shadow-glow"
                : "bg-card text-white border-border hover:border-primary/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Screenshot Card */}
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-glow"
      >
        <img
          src={featureScreens[active].image}
          alt="Feature Screenshot"
          className="w-full rounded-xl object-cover"
        />
      </motion.div>
    </div>
  );
};
  
  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(to right, #135F80, #2C7862)' }}>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-glow opacity-40" />
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-primary mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
              Now available for Windows, Mac & Linux
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6">
              Monitor Your Team's <span className="text-gradient">Productivity</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Silent desktop tracking, automatic screenshots, real-time activity monitoring — all in one enterprise-grade platform built for scale.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/login">
                <Button size="lg" className="gap-2 shadow-glow">
                  Start Free Trial <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/download">
                <Button variant="outline" size="lg">Download Agent</Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-2xl mx-auto"
          >
            {stats.map((s, i) => (
              <motion.div key={s.label} variants={fadeUp} custom={i} className="text-center">
                <div className="text-3xl font-bold text-gradient">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>




{/* Interactive Feature Showcase */}
<section className="py-24">
  <div className="container mx-auto px-4">

    {/* Badge */}
    <div className="flex justify-center mb-6">
      <div className="px-5 py-2 rounded-full bg-white/10 text-sm backdrop-blur border border-white/20">
        Main Features
      </div>
    </div>

    {/* Heading */}
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="text-center mb-14"
    >
      <motion.h2
        variants={fadeUp}
        custom={0}
        className="text-4xl md:text-5xl font-bold mb-6"
      >
        Features That Make Us{" "}
        <span className="text-gradient">Outstanding</span>
      </motion.h2>

      <motion.p
        variants={fadeUp}
        custom={1}
        className="text-white/90 max-w-2xl mx-auto"
      >
        Powerful tools built to monitor productivity, analyze performance,
        and manage teams efficiently — all from one dashboard.
      </motion.p>
    </motion.div>

    {/* Tabs */}
    <FeatureTabs />

  </div>
</section>








      {/* Features */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to <span className="text-gradient">Track & Manage</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground max-w-lg mx-auto">
              A comprehensive suite of monitoring tools designed for enterprise teams.
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} custom={i} className="group p-6 rounded-xl bg-gradient-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-glow">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon size={20} className="text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>


<Client/>

{/* FAQ Section */}
{/* <FAQ /> */}
{/* Why Teams Love Section */}

<section className="py-24 bg-black text-white">
  <div className="container mx-auto px-4">

    {/* Top Badge */}
    <div className="flex justify-center mb-8">
      <div className="flex items-center gap-2 bg-white/10 px-6 py-2 rounded-full text-sm backdrop-blur">
        <CheckCircle2 size={16} className="text-primary" />
        Why We Are Better Than Others
      </div>
    </div>

    {/* Heading */}
    <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
      Why Teams Love <span className="text-primary">WebMokTeamTrack?</span>
    </h2>

    {/* Card Container */}
    <div className="grid md:grid-cols-3 gap-10">

      {/* Card 1 */}
      <div className="bg-white/5 border border-white/10 p-8 rounded-2xl transition duration-300 hover:-translate-y-2 hover:border-primary/40">
        <h3 className="text-2xl font-bold mb-4 text-white">
          Boost Productivity
        </h3>
        <p className="text-sm leading-relaxed text-white/70">
          Capture every second of work with real-time tracking tools 
          that ensure no task goes unaccounted for. Identify inefficiencies, 
          optimize workflows, and focus on high-priority tasks.
        </p>
      </div>

      {/* Card 2 */}
      <div className="bg-white/5 border border-white/10 p-8 rounded-2xl transition duration-300 hover:-translate-y-2 hover:border-primary/40">
        <h3 className="text-2xl font-bold mb-4 text-white">
          Improve Team Collaboration
        </h3>
        <p className="text-sm leading-relaxed text-white/70">
          Keep your team connected and aligned no matter where they work. 
          Assign tasks, monitor progress, and maintain clear communication 
          through a unified platform.
        </p>
      </div>

      {/* Card 3 */}
      <div className="bg-white/5 border border-white/10 p-8 rounded-2xl transition duration-300 hover:-translate-y-2 hover:border-primary/40">
        <h3 className="text-2xl font-bold mb-4 text-white">
          Simplify Workflows
        </h3>
        <p className="text-sm leading-relaxed text-white/70">
          Automate repetitive tasks like tracking hours, generating reports, 
          and managing timesheets. Save manual effort and focus on delivering 
          impactful results.
        </p>
      </div>

    </div>
  </div>
</section>

{/* Who Can Use Section */}
<section className="py-24">
  <div className="container mx-auto px-4">
    <div className="grid lg:grid-cols-2 gap-14 items-center">

      {/* LEFT CONTENT */}
      <div>
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Who Can Use <span className="text-gradient">WebMokTeamTrack</span>
        </h2>

        <p className="text-white/80 mb-10 max-w-xl">
          TeamTrack adapts to the unique needs of every industry,
          simplifying workflows and boosting productivity for teams of all sizes.
        </p>

        <div className="space-y-6">

          <div className="bg-gradient-card border border-border rounded-xl p-6 hover:shadow-glow transition">
            <h3 className="text-lg font-semibold text-white mb-1">
              Technology & IT
            </h3>
            <p className="text-sm text-white/70">
              Streamline project management and track development workflows efficiently.
            </p>
          </div>

          <div className="bg-gradient-card border border-border rounded-xl p-6 hover:shadow-glow transition">
            <h3 className="text-lg font-semibold text-white mb-1">
              Marketing & Creative Agencies
            </h3>
            <p className="text-sm text-white/70">
              Manage campaigns, track deadlines, and collaborate seamlessly.
            </p>
          </div>

          <div className="bg-gradient-card border border-border rounded-xl p-6 hover:shadow-glow transition">
            <h3 className="text-lg font-semibold text-white mb-1">
              Healthcare
            </h3>
            <p className="text-sm text-white/70">
              Simplify administrative tasks and manage staff shifts effectively.
            </p>
          </div>

          <div className="bg-gradient-card border border-border rounded-xl p-6 hover:shadow-glow transition">
            <h3 className="text-lg font-semibold text-white mb-1">
              Retail & E-Commerce
            </h3>
            <p className="text-sm text-white/70">
              Optimize inventory management and track online orders efficiently.
            </p>
          </div>

        </div>
      </div>

      {/* RIGHT SINGLE IMAGE */}
      <div className="flex justify-center">
        <div className="w-full max-w-lg rounded-3xl overflow-hidden shadow-glow">
          <img
            src={industryImg1}  
            alt="Industry Example"
            className="w-full h-100 object-cover"
          />
        </div>
      </div>

    </div>
  </div>
</section>






      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-card border border-border p-12 text-center">
            <div className="absolute inset-0 bg-glow opacity-30" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to boost productivity?</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">Start your free trial with up to 5 users. No credit card required.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/login">
                  <Button size="lg" className="gap-2 shadow-glow">Get Started Free <ArrowRight size={16} /></Button>
                </Link>
                <Link to="/pricing">
                  <Button variant="outline" size="lg">View Pricing</Button>
                </Link>
              </div>
              <div className="flex flex-wrap gap-4 justify-center mt-6 text-sm text-muted-foreground">
                {["5 users free", "No credit card", "14-day trial", "Cancel anytime"].map(t => (
                  <span key={t} className="flex items-center gap-1"><CheckCircle2 size={14} className="text-primary" /> {t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
<StartTracking />
      <Footer />
    </div>
  );
};

export default Index;
