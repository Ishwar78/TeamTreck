import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FileText, Calendar, Download, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Client from "../client";
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
  { icon: FileText, title: "Automated Reports", desc: "Generate comprehensive time reports automatically — no manual data entry." },
  { icon: Calendar, title: "Flexible Periods", desc: "View reports by day, week, month, or custom date ranges for any team member." },
  { icon: Download, title: "Export Options", desc: "Download reports in PDF and CSV formats for payroll, billing, or compliance." },
  { icon: Clock, title: "Attendance Records", desc: "Automatic clock-in/out records with late arrivals and early departures flagged." },
];

const benefits = [
  "Automated daily, weekly, and monthly time reports",
  "PDF and CSV export for payroll integration",
  "Per-employee and per-team report breakdowns",
  "Attendance tracking with anomaly detection",
  "Historical data accessible anytime",
  "Perfect for client billing and project costing",
];

const TimeReporting = () => (
  <div className="min-h-screen text-white" style={{ background: 'linear-gradient(to right, #135F80, #2C7862)' }}>
    <Navbar />
    <section className="pt-28 pb-16">
      <div className="container mx-auto px-4">
        <motion.div initial="hidden" animate="visible" className="text-center max-w-3xl mx-auto mb-16">
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <FileText size={16} /> Solution
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Time Reporting
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground">
            Generate, view, and export detailed time reports effortlessly. Perfect for payroll, billing, compliance, and performance reviews.
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

{/* What You Gain from Smart Time Reporting */}
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
        What You Gain from{" "}
        <span className="text-gradient">Smart Time Reporting</span>
      </motion.h2>

      <motion.p
        variants={fadeUp}
        custom={1}
        className="text-white leading-relaxed"
      >
        Understand how time is spent across your business so you can improve
        planning, manage costs, and support your team better.
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
          title: "Improve Forecast Accuracy",
          desc: "Use past time data to create realistic deadlines and project timelines.",
        },
        {
          title: "Better Accountability",
          desc: "Know how time is distributed and ensure everyone stays aligned.",
        },
        {
          title: "Faster Reporting",
          desc: "Generate clean, professional reports in seconds — no spreadsheets.",
        },
        {
          title: "Smarter Resource Planning",
          desc: "Balance workloads and identify where additional support is needed.",
        },
        {
          title: "Share with Ease",
          desc: "Export and send reports to managers, HR, clients, or finance teams instantly.",
        },
        {
          title: "Connect Time to Output",
          desc: "See how time investment aligns with productivity and results.",
        },
      ].map((item, i) => (
        <motion.div
          key={item.title}
          variants={fadeUp}
          custom={i}
          className="rounded-xl border border-border bg-card p-8 hover:border-primary/30 transition-all duration-300 hover:shadow-glow"
        >
          <h3 className="text-xl font-semibold text-white mb-3">
            {item.title}
          </h3>
          <p className="text-white/90 text-sm leading-relaxed">
            {item.desc}
          </p>
        </motion.div>
      ))}
    </motion.div>

  </div>
</section>

    <Client/>
    <FAQ />

    <StartTracking />
    <Footer />
  </div>
);

export default TimeReporting;
