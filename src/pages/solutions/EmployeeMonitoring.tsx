import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Eye, Camera, Monitor, Shield, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Client from "../client";

import monitorImg from "@/images/monitor.webp";
import StartTracking from "../StartTracking";
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const features = [
  { icon: Eye, title: "Real-Time Status", desc: "See who's active, idle, or offline right now across your entire organization." },
  { icon: Camera, title: "Screenshot Evidence", desc: "Automated screenshot captures provide visual proof of work activity." },
  { icon: Monitor, title: "App & URL Tracking", desc: "Know which apps and websites employees use during work hours." },
  { icon: Shield, title: "Privacy-First Design", desc: "Configurable monitoring levels with optional blur and customizable rules." },
];

const benefits = [
  "Complete visibility into remote employee activity",
  "Configurable monitoring intensity per company",
  "Screenshot + time tracking + app tracking combined",
  "Tamper-proof agent that can't be closed by employees",
  "All data encrypted in transit and at rest",
  "Compliant with enterprise security standards",
];

const EmployeeMonitoring = () => (
  <div className="min-h-screen text-white" style={{ background: 'linear-gradient(to right, #135F80, #2C7862)' }}>
    <Navbar />
    <section className="pt-28 pb-16">
      <div className="container mx-auto px-4">
        <motion.div initial="hidden" animate="visible" className="text-center max-w-3xl mx-auto mb-16">
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Eye size={16} /> Solution
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Employee Monitoring
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground">
            A comprehensive, privacy-first employee monitoring solution that combines screenshots, time tracking, and app monitoring in one tamper-proof desktop agent.
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





{/* Smarter Transparent Monitoring */}
<section className="py-24">
  <div className="container mx-auto px-4">

    {/* Heading */}
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="text-center max-w-3xl mx-auto mb-16"
    >
      <motion.h2
        variants={fadeUp}
        custom={0}
        className="text-3xl md:text-5xl font-bold mb-6"
      >
        A Smarter, Transparent Way to{" "}
        <span className="text-gradient">Monitor Teams</span>
      </motion.h2>

      <motion.p
        variants={fadeUp}
        custom={1}
        className="text-white leading-relaxed"
      >
        Track work hours seamlessly with real-time time tracking. Manage
        tasks, projects, and teams while ensuring every second is accounted for.
      </motion.p>
    </motion.div>

    <div className="grid md:grid-cols-2 gap-12 items-center">

      {/* Left Image */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        custom={2}
        className="rounded-2xl overflow-hidden border border-border shadow-lg"
      >
        <img
  src={monitorImg}
  alt="Monitoring Dashboard"
  className="w-full h-full object-cover rounded-2xl"
/>
      </motion.div>

      {/* Right Points */}
      <motion.div className="space-y-8">
        {[
          "Track time spent on tasks, projects, and sessions—automatically or manually.",
          "Capture optional screenshots without constant interruptions.",
          "Monitor URLs visited during tracked sessions.",
          "See real-time status: active, idle, or offline.",
        ].map((point, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            custom={i}
            className="flex items-start gap-4 border-b border-white/30 pb-6"
          >
            <CheckCircle2 size={22} className="text-white mt-1 shrink-0" />
            <p className="text-white leading-relaxed">
              {point}
            </p>
          </motion.div>
        ))}
      </motion.div>

    </div>
  </div>
</section>
{/* What You Gain Section */}
<section className="py-24">
  <div className="container mx-auto px-4">

    {/* Heading */}
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="text-center max-w-3xl mx-auto mb-16"
    >
      <motion.h2
        variants={fadeUp}
        custom={0}
        className="text-3xl md:text-5xl font-bold text-white mb-6"
      >
        What You Gain from Smarter Monitoring
      </motion.h2>

      <motion.p
        variants={fadeUp}
        custom={1}
        className="text-white/90"
      >
        TeamTrack makes it easy to improve performance without micro-managing.
      </motion.p>
    </motion.div>

    {/* Cards */}
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="grid md:grid-cols-2 gap-8"
    >
      {[
        {
          title: "Boost Productivity",
          desc: "Help your team stay focused and on task.",
        },
        {
          title: "See Who’s Doing What",
          desc: "Get a clear view of task progress and ownership.",
        },
        {
          title: "Manage Remote Teams Better",
          desc: "Track work and stay aligned—even from a distance.",
        },
        {
          title: "Simple Reports",
          desc: "Generate quick reports for HR, managers, or clients.",
        },
        {
          title: "Built on Trust",
          desc: "Monitor responsibly, with privacy and fairness in mind.",
        },
      ].map((item, i) => (
        <motion.div
          key={item.title}
          variants={fadeUp}
          custom={i}
          className="rounded-xl border border-border bg-card p-8 hover:border-primary/30 transition-all duration-300 hover:shadow-glow"
        >
          <h3 className="text-xl font-semibold text-foreground mb-3">
            {item.title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {item.desc}
          </p>
        </motion.div>
      ))}
    </motion.div>

  </div>
</section>

    <Client/>

    <StartTracking />
    <Footer />
  </div>
);

export default EmployeeMonitoring;
