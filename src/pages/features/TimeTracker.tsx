import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Clock, Play, Pause, BarChart3, Timer, CheckCircle2, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar"; 
import Footer from "@/components/Footer";
import Client from "../client";
import StartTracking from "../StartTracking";
import dashboardImage from "@/images/timetrack.png";   // image import
import activityImage from "@/images/activity.png";
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const features = [
  { icon: Play, title: "Auto Start/Stop", desc: "Agent automatically starts tracking when your team logs in and stops when they log out." },
  { icon: Timer, title: "Active & Idle Time", desc: "Distinguishes between active work time and idle periods with configurable thresholds." },
  { icon: BarChart3, title: "Daily Timelines", desc: "Visual timeline breakdown showing exactly how each team member spent their day." },
  { icon: Clock, title: "Real-Time Tracking", desc: "Live tracking with second-level accuracy. No manual timers or clock-in required." },
];

const benefits = [
  "Zero manual input — fully automatic tracking",
  "Per-user daily, weekly & monthly breakdowns",
  "Idle detection with configurable thresholds (1–30 min)",
  "Offline time queued and synced automatically",
  "Exportable reports in PDF & CSV",
  "Works silently in the background",
];


const TimeTracker = () => (
  <div className="min-h-screen text-white" style={{ background: 'linear-gradient(to right, #135F80, #2C7862)' }}>
    
    <Navbar />

    {/* Hero Section */}
    <section className="pt-28 pb-16">
      <div className="container mx-auto px-4">

        <motion.div initial="hidden" animate="visible" className="text-center max-w-3xl mx-auto mb-16">

          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Clock size={16} /> Feature
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Automatic Time Tracking
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground">
            Track every second of work automatically. No manual timers, no forgetting to clock in.
            WEBMOK's desktop agent handles it all silently in the background.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex gap-3 justify-center mt-8">
            <Link to="/admin/login">
              <Button size="lg">
                Start Free Trial <ArrowRight size={16} />
              </Button>
            </Link>

            <Link to="/pricing">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </Link>
          </motion.div>
  
        </motion.div>

        {/* Feature Cards */}
        <motion.div initial="hidden" animate="visible" className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
          {features.map((f, i) => (
            <motion.div key={f.title} variants={fadeUp} custom={i} className="rounded-xl border border-border bg-card p-6">
              
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon size={24} className="text-primary" />
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-2">
                {f.title}
              </h3>

              <p className="text-sm text-muted-foreground">
                {f.desc}
              </p>

            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>


{/* ================= Key Feature Section ================= */}

<section className="py-24">
  <div className="container mx-auto px-4">

    {/* Heading */}
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="text-center max-w-4xl mx-auto mb-16"
    >
      <motion.h2 variants={fadeUp} custom={0} className="text-4xl md:text-5xl font-bold mb-6">
        Key Features That Make Time Tracking Effortless
      </motion.h2>

      <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-lg">
        TeamTrack gives you powerful yet easy-to-use tools to track time with precision.
        From one-click logging to smart timesheets and project insights, everything is
        built to help you stay organized and in control of your day.
      </motion.p>
    </motion.div>


    {/* Content */}
    <div className="grid md:grid-cols-2 gap-12 items-center">

      {/* Left Text */}
      <motion.div
        variants={fadeUp}
        custom={2}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >

        <h3 className="text-3xl font-bold mb-6 text-foreground">
          One-Click Time Logging
        </h3>

        <p className="text-muted-foreground leading-relaxed mb-6">
          Start, pause, or stop the timer with a single click — no complex setup,
          no distractions. Whether you're switching between tasks or taking a break,
          TeamTrack ensures that your time tracking remains fluid and interruption-free.
          Perfect for fast-paced workflows and multitaskers.
        </p>

        <div className="flex items-center gap-3 mb-2">
          <CheckCircle2 size={18} className="text-primary" />
          <span>Fast & distraction-free tracking</span>
        </div>

        <div className="flex items-center gap-3">
          <CheckCircle2 size={18} className="text-primary" />
          <span>One-click start, pause & stop</span>
        </div>

      </motion.div>


      {/* Right Image */}
      <motion.div
        variants={fadeUp}
        custom={3}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="rounded-2xl overflow-hidden border border-border shadow-xl"
      >

        <img
          src={dashboardImage}
          alt="TeamTrack Dashboard"
          className="w-full h-auto"
        />

      </motion.div>

    </div>

  </div>
</section>

{/* ================= Activity Snapshot Section ================= */}

<section className="py-24">
  <div className="container mx-auto px-4">

    <div className="grid md:grid-cols-2 gap-12 items-center">

      {/* Left Image */}
      <motion.div
        variants={fadeUp}
        custom={0}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="rounded-2xl overflow-hidden border border-border shadow-xl"
      >

        <img
          src={activityImage}
          alt="Activity Snapshots"
          className="w-full h-auto"
        />

      </motion.div>


      {/* Right Text */}
      <motion.div
        variants={fadeUp}
        custom={1}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >

        <h3 className="text-4xl font-bold mb-6 text-foreground">
          Activity Snapshots
        </h3>

        <p className="text-muted-foreground leading-relaxed mb-6">
          Enable optional screenshot capture at regular intervals to monitor team
          progress visually. This feature is especially useful for remote work
          environments, providing greater transparency without micromanaging.
          Screenshots are securely stored and only visible to authorized admins.
        </p>

        <div className="flex items-center gap-3 mb-2">
          <CheckCircle2 size={18} className="text-primary" />
          <span>Automated screenshot capture</span>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <CheckCircle2 size={18} className="text-primary" />
          <span>Secure admin-only visibility</span>
        </div>

        <div className="flex items-center gap-3">
          <CheckCircle2 size={18} className="text-primary" />
          <span>Perfect for remote team monitoring</span>
        </div>

      </motion.div>

    </div>

  </div>
</section>
{/* ================= Why Teams Trust Section ================= */}

<section className="py-24">
  <div className="container mx-auto px-4">

    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">

      <motion.h2 variants={fadeUp} custom={0} className="text-4xl md:text-5xl font-bold">
        Why Teams Trust <span className="text-gradient">TeamTrack Time Tracker</span>
      </motion.h2>

    </motion.div>


    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

      {[
        {
          icon: Clock,
          title: "Simple & Accurate",
          desc: "Log time with just one click or set it to auto-track. TeamTrack makes time entry effortless and accurate.",
        },
        {
          icon: BarChart3,
          title: "Transparent Workflows",
          desc: "Understand exactly where time is being spent across teams, individuals, and projects.",
        },
        {
          icon: Timer,
          title: "Insightful Analytics",
          desc: "Get detailed summaries of work sessions, idle time, and productivity trends.",
        },
        {
          icon: CheckCircle2,
          title: "Real-Time Visibility",
          desc: "See who is working on what in real-time and track team activity instantly.",
        },
      ].map((item, i) => (
        <motion.div
          key={item.title}
          variants={fadeUp}
          custom={i}
          className="bg-gradient-card border border-border rounded-3xl p-8 text-center hover:shadow-glow transition-all duration-300"
        >

          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <item.icon size={28} className="text-primary" />
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-4 text-foreground">
            {item.title}
          </h3>

          <p className="text-muted-foreground text-sm leading-relaxed">
            {item.desc}
          </p>

        </motion.div>
      ))}

    </div>

  </div>
</section>


<Client/>

<StartTracking />

<Footer />

  </div>
);

export default TimeTracker;