import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { TrendingUp, Target, Gauge, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Client from "../client";
import StartTracking from "../StartTracking";
import productivityImg from "@/images/productivity.webp";

import productivity from "@/images/productivity.webp"
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const features = [
  { icon: Gauge, title: "Productivity Scoring", desc: "Automatic scoring based on active time, app usage patterns, and idle periods." },
  { icon: Target, title: "Goal Tracking", desc: "Set productivity targets and track progress across individuals and teams." },
  { icon: TrendingUp, title: "Performance Trends", desc: "Visualize productivity over time to identify improvements or concerns." },
  { icon: Clock, title: "Active vs Idle Ratio", desc: "Detailed breakdown of productive time versus idle and break periods." },
];

const benefits = [
  "Automated productivity scores for every employee",
  "Active vs idle time comparison charts",
  "App-wise productivity categorization",
  "Daily, weekly, and monthly productivity trends",
  "Identify top performers and those needing support",
  "Data-driven performance review support",
];

const ProductivityAnalytics = () => (
  <div className="min-h-screen text-white" style={{ background: 'linear-gradient(to right, #135F80, #2C7862)' }}>
    <Navbar />
    <section className="pt-28 pb-16">
      <div className="container mx-auto px-4">
        <motion.div initial="hidden" animate="visible" className="text-center max-w-3xl mx-auto mb-16">
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <TrendingUp size={16} /> Solution
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Productivity Analytics
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground">
            Measure and improve your team's productivity with automated scoring, trend analysis, and actionable insights.
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

        {/* <motion.div initial="hidden" animate="visible" className="max-w-2xl mx-auto">
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
        What You Gain from Real-Time Productivity Insights
      </motion.h2>

      <motion.p
        variants={fadeUp}
        custom={1}
        className="text-white/90"
      >
        TeamTrack’s analytics help you lead smarter, remove guesswork,
        and create a more focused, efficient work culture.
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
          icon: Gauge,
          title: "See Real Progress",
          desc: "Track task completion, activity, and output in one place.",
        },
        {
          icon: TrendingUp,
          title: "Make Data-Backed Decisions",
          desc: "Base planning, hiring, and improvements on real productivity numbers.",
        },
        {
          icon: Clock,
          title: "Spot Bottlenecks Early",
          desc: "Identify productivity dips before they affect deadlines.",
        },
        {
          icon: Target,
          title: "Plan Better Sprints & Timelines",
          desc: "Use past data to create accurate estimates and realistic goals.",
        },
        {
          icon: CheckCircle2,
          title: "Encourage Accountability",
          desc: "Help teams take ownership with transparent performance metrics.",
        },
        {
          icon: TrendingUp,
          title: "Scale Operations Confidently",
          desc: "Grow your team with visibility into how systems perform.",
        },
      ].map((item, i) => (
        <motion.div
          key={item.title}
          variants={fadeUp}
          custom={i}
          className="flex items-center gap-6 p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-glow"
        >
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <item.icon size={30} className="text-primary" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {item.title}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {item.desc}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>

  </div>
</section>
{/* Smarter Productivity Section - White Text */}
<section className="py-24 text-white">
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
        className="text-3xl md:text-5xl font-bold mb-6 text-white"
      >
        Smarter Productivity Starts with Better Data
      </motion.h2>

      <motion.p
        variants={fadeUp}
        custom={1}
        className="text-white/90 leading-relaxed"
      >
        Track work hours seamlessly with our real-time time tracker. Whether
        you're managing individual tasks or entire projects, our intuitive tool
        ensures every second is accounted for.
      </motion.p>
    </motion.div>

    {/* Content */}
    <div className="grid md:grid-cols-2 gap-12 items-center">

      {/* Left Image */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        custom={2}
        className="rounded-2xl overflow-hidden shadow-glow"
      >
        <img
  src={productivity}
  alt="Productivity Dashboard"
  className="w-full h-full object-cover rounded-2xl"
/>
      </motion.div>

      {/* Right Points */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="space-y-8"
      >
        {[
          "Track time spent on tasks, projects, and work sessions with built-in time logs.",
          "Monitor activity levels like focus time, idle time, and active engagement.",
          "View productivity trends over days, weeks, or months to spot patterns.",
          "Use visual reports to compare performance across teams or individuals.",
        ].map((point, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            custom={i}
            className="flex items-start gap-4 border-b border-white/30 pb-6"
          >
            <CheckCircle2 size={22} className="text-white mt-1 shrink-0" />
            <p className="text-white/90 leading-relaxed">
              {point}
            </p>
          </motion.div>
        ))}
      </motion.div>

    </div>
  </div>
</section>

    
    <Client/>


    <StartTracking />
    <Footer />
  </div>
);

export default ProductivityAnalytics;
