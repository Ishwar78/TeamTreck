import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Globe, Monitor, BarChart3, Shield, CheckCircle2, ArrowRight, ShieldCheck, Users,Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Client from "../client";
import StartTracking from "../StartTracking";

import urlLogsImg from "@/images/urltr.png";
import domainCategoryImg from "@/images/domainbased.png";
import exportReportsImg from "@/images/monthwise.png";



const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const features = [
  { icon: Globe, title: "Website Tracking", desc: "Track which websites employees visit and how much time they spend on each." },
  { icon: Monitor, title: "App Monitoring", desc: "Monitor active applications with time-per-app breakdowns throughout the day." },
  { icon: BarChart3, title: "Category Analytics", desc: "Auto-categorize apps and URLs as productive, neutral, or unproductive." },
  { icon: Shield, title: "OS-Level Tracking", desc: "Uses native OS APIs — no browser extensions needed. Works across all browsers." },
];

const benefits = [
  "Track apps and URLs without browser extensions",
  "Time-per-app and time-per-URL breakdowns",
  "Automatic productive/unproductive categorization",
  "Real-time active window detection",
  "Historical data with daily/weekly/monthly views",
  "Works on Windows, macOS, and Linux",
];


const UrlTracking = () => (
  <div className="min-h-screen text-white" style={{ background: 'linear-gradient(to right, #135F80, #2C7862)' }}>
    <Navbar />
    <section className="pt-28 pb-16">
      <div className="container mx-auto px-4">
        <motion.div initial="hidden" animate="visible" className="text-center max-w-3xl mx-auto mb-16">
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Globe size={16} /> Feature
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            URL & App Tracking
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground">
            Know exactly which applications and websites your team uses during work hours. Native OS-level tracking — no browser extensions required.
          </motion.p>
          <motion.div variants={fadeUp} custom={3} className="flex gap-3 justify-center mt-8">
            <Link to="/admin/login"><Button size="lg">Start Free Trial <ArrowRight size={16} /></Button></Link>
            <Link to="/pricing"><Button size="lg" variant="outline">View Pricing</Button></Link>
          </motion.div>
        </motion.div>

        <motion.div initial="hidden" animate="visible" className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
          {features.map((f, i) => (
            <motion.div key={f.title} variants={fadeUp} custom={i} className="rounded-xl border border-border bg-card p-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon size={24} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
{/* 
        <motion.div initial="hidden" animate="visible" className="max-w-2xl mx-auto">
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl font-bold text-foreground text-center mb-8">Key Benefits</motion.h2>
          <div className="space-y-3">
            {benefits.map((b, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-primary mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{b}</span>
              </motion.div>
            ))}
          </div>
        </motion.div> */}
      </div>
    </section>

{/* Why Teams Use TeamTrack for URL Tracking */}
<section className="py-24">
  <div className="container mx-auto px-4">

    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="text-center mb-16"
    >
      <motion.h2
        variants={fadeUp}
        custom={0}
        className="text-3xl md:text-4xl font-bold text-foreground"
      >
        Why Teams Use <span className="text-gradient">TeamTrack</span> for URL Tracking
      </motion.h2>
    </motion.div>

    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {[
        {
          title: "Real-Time Website Monitoring",
          desc: "Track websites visited by each user during tracked sessions and see activity as it happens.",
          icon: Globe,
        },
        {
          title: "Privacy-First Approach",
          desc: "URL tracking activates only during tracked time and respects role-based admin visibility.",
          icon: ShieldCheck,
        },
        {
          title: "Remote Work Optimization",
          desc: "Ideal for distributed teams. Ensure alignment without constant check-ins or micromanagement.",
          icon: Users,
        },
        {
          title: "Daily & Weekly Summaries",
          desc: "Get automatic summaries of top visited sites, total time spent, and productivity insights.",
          icon: BarChart3,
        },
      ].map((item, i) => (
        <motion.div
          key={item.title}
          variants={fadeUp}
          custom={i}
          className="rounded-2xl border border-border bg-card p-8 text-center hover:border-primary/30 transition-all duration-300 hover:shadow-glow"
        >
          <div className="w-14 h-14 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-6">
            <item.icon size={26} className="text-primary" />
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-3">
            {item.title}
          </h3>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {item.desc}
          </p>
        </motion.div>
      ))}
    </motion.div>

  </div>
</section>


{/* ================= Real-Time URL Logs ================= */}

<section className="py-24">
  <div className="container mx-auto px-4">

    <div className="grid md:grid-cols-2 gap-16 items-center">

      {/* Text */}
      <motion.div
        variants={fadeUp}
        custom={0}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <h3 className="text-4xl font-bold text-white mb-6">
          Real-Time URL Logs
        </h3>

        <p className="text-lg text-white/80 leading-relaxed">
          View visited websites in real-time with timestamps and active
          durations, directly linked to users’ tracked sessions.
        </p>
      </motion.div>

      {/* Image */}
      <motion.div
        variants={fadeUp}
        custom={1}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="rounded-2xl overflow-hidden border border-border shadow-xl"
      >
        <img
          src={urlLogsImg}
          alt="Real-Time URL Logs"
          className="w-full h-auto"
        />
      </motion.div>

    </div>

  </div>
</section>

{/* ================= Domain Categorization ================= */}

<section className="py-24">
  <div className="container mx-auto px-4">

    <div className="grid md:grid-cols-2 gap-16 items-center">

      {/* Image */}
      <motion.div
        variants={fadeUp}
        custom={0}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="rounded-2xl overflow-hidden border border-border shadow-xl"
      >
        <img
          src={domainCategoryImg}
          alt="Domain Categorization"
          className="w-full h-auto"
        />
      </motion.div>

      {/* Text */}
      <motion.div
        variants={fadeUp}
        custom={1}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >

        <h3 className="text-4xl font-bold text-white mb-6">
          Domain-Based Categorization
        </h3>

        <p className="text-lg text-white/80 leading-relaxed">
          Use intelligent tagging to group URLs into categories like
          Social Media, Research, Communication, or Entertainment.
        </p>

      </motion.div>

    </div>

  </div>
</section>

{/* ================= Exportable Reports ================= */}

<section className="py-24">
  <div className="container mx-auto px-4">

    <div className="grid md:grid-cols-2 gap-16 items-center">

      {/* Text */}
      <motion.div
        variants={fadeUp}
        custom={0}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >

        <h3 className="text-4xl font-bold text-white mb-6">
          Exportable Reports
        </h3>

        <p className="text-lg text-white/80 leading-relaxed">
          Generate CSV or PDF reports of URL activity per day, week, or month
          for HR, compliance, or performance reviews.
        </p>

      </motion.div>

      {/* Image */}
      <motion.div
        variants={fadeUp}
        custom={1}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="rounded-2xl overflow-hidden border border-border shadow-xl"
      >
        <img
          src={exportReportsImg}
          alt="Export Reports"
          className="w-full h-auto"
        />
      </motion.div>

    </div>

  </div>
</section>

<Client/>

 <StartTracking />
    <Footer />
  </div>
);

export default UrlTracking;
