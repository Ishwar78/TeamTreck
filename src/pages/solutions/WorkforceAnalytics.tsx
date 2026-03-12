import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BarChart3, Users, TrendingUp, PieChart, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Client from "../client";
import productivityImg from "@/images/productivity.webp";

import productivity from "@/images/productivity.webp"

import workforceImg from "@/images/workforce1.webp";
import performanceImg from "@/images/workforce2.webp";
import FAQ from "../faq";
import StartTracking from "../StartTracking";
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const features = [
  { icon: BarChart3, title: "Company-Wide Dashboards", desc: "Bird's-eye view of your entire organization's work patterns and output." },
  { icon: Users, title: "Team Comparisons", desc: "Compare productivity across teams, departments, and individual employees." },
  { icon: TrendingUp, title: "Trend Analysis", desc: "Spot productivity trends over days, weeks, and months to make data-driven decisions." },
  { icon: PieChart, title: "Time Allocation", desc: "Understand how time is distributed across apps, tasks, and categories." },
];

const benefits = [
  "Real-time organizational productivity overview",
  "Department and team-level comparisons",
  "Daily, weekly, and monthly trend reports",
  "Exportable in PDF and CSV formats",
  "Drill-down from company level to individual employee",
  "Actionable insights for workforce optimization",
];

const WorkforceAnalytics = () => (
  <div className="min-h-screen text-white" style={{ background: 'linear-gradient(to right, #135F80, #2C7862)' }}>
    <Navbar />
    <section className="pt-28 pb-16">
      <div className="container mx-auto px-4">
        <motion.div initial="hidden" animate="visible" className="text-center max-w-3xl mx-auto mb-16">
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <BarChart3 size={16} /> Solution
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Workforce Analytics
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground">
            Get a complete picture of how your workforce operates. From company-wide dashboards to individual drill-downs, make informed decisions with real data.
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
{/* Section 1 */}
<section className="py-24">
  <div className="container mx-auto px-4">
    <div className="grid lg:grid-cols-2 gap-14 items-center">

      {/* Left Content */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <motion.h2
          variants={fadeUp}
          custom={0}
          className="text-4xl md:text-5xl font-bold mb-6"
        >
          Unsure How Your Workforce Is
          <br />
          <span className="text-gradient">
            Really Performing?
          </span>
        </motion.h2>

        <motion.p
          variants={fadeUp}
          custom={1}
          className="text-white/90 mb-8 max-w-xl"
        >
          Managing modern teams is complex. Without clear data on workload,
          time usage, or task efficiency, it's hard to optimize performance.
          Many teams rely on assumptions that don’t show the full picture.
        </motion.p>

        <motion.div variants={fadeUp} custom={2}>
          <Link to="/admin/login">
            <Button size="lg">
              Start Tracking Time
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Right Image */}
      <motion.div
        variants={fadeUp}
        custom={3}
        className="rounded-3xl overflow-hidden shadow-glow"
      >
        <img
          src={workforceImg}
          alt="Workforce Monitoring"
          className="w-full h-[380px] object-cover"
        />
      </motion.div>

    </div>
  </div>
</section>

{/* Section 2 */}
<section className="py-24">
  <div className="container mx-auto px-4">

    {/* Center Heading */}
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="text-center max-w-3xl mx-auto mb-16"
    >
      <motion.h2
        variants={fadeUp}
        custom={0}
        className="text-4xl md:text-5xl font-bold mb-6"
      >
        A Complete Picture of Team Performance,
        <span className="text-gradient"> in Real Time</span>
      </motion.h2>

      <motion.p
        variants={fadeUp}
        custom={1}
       className="text-white/90"
      >
        Track work hours seamlessly with our real-time time tracker.
        Ensure every second is accounted for across teams and projects.
      </motion.p>
    </motion.div>

    {/* Content Grid */}
    <div className="grid lg:grid-cols-2 gap-16 items-center">

      {/* Left Image */}
      <motion.div
        variants={fadeUp}
        custom={2}
        className="rounded-3xl overflow-hidden shadow-glow"
      >
        <img
          src={performanceImg}
          alt="Team Performance"
          className="w-full h-[380px] object-cover"
        />
      </motion.div>

      {/* Right Checklist */}
      <motion.div
        variants={fadeUp}
        custom={3}
        className="space-y-6"
      >
        {[
          "Analyze time spent across projects, departments, or individuals.",
          "Identify high and low productivity trends with visual dashboards.",
          "Understand how tasks, idle time, and engagement levels affect output.",
          "Use real-time data to balance workloads and improve team planning.",
        ].map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-4 border-b border-border pb-4"
          >
            <CheckCircle2
              size={20}
              className="text-primary mt-1 shrink-0"
            />
            <p className="text-white/90">
              {item}
            </p>
          </div>
        ))}
      </motion.div>

    </div>
  </div>
</section>

<FAQ />

<Client/>
<StartTracking />
    <Footer />
  </div>
);

export default WorkforceAnalytics;
