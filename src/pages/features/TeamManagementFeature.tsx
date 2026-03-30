import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Users, ShieldCheck, UserPlus, Settings, CheckCircle2, ArrowRight,Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Client from "../client";
import StartTracking from "../StartTracking";
import teamDashboard from "@/images/dashboard.png";

import activityOverview from "@/images/useractivity.png";
import inviteMembers from "@/images/invite.png";


const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const features = [
  { icon: ShieldCheck, title: "Role-Based Access", desc: "Company Admin, Sub-Admin, and Employee roles with granular permission control." },
  { icon: UserPlus, title: "Easy Invitations", desc: "Invite team members via email with automatic role assignment and onboarding." },
  { icon: Users, title: "Team Overview", desc: "See all team members at a glance with status, role, and activity indicators." },
  { icon: Settings, title: "Custom Policies", desc: "Set monitoring rules, screenshot frequency, and idle thresholds per team." },
];

const benefits = [
  "Invite unlimited team members with email invitations",
  "Three-tier role system: Admin, Sub-Admin, Employee",
  "Per-role permission control for screenshots, reports, settings",
  "Real-time team status: online, idle, or offline",
  "Bulk actions for team management",
  "Activity logs for all team changes",
];


const TeamManagementFeature = () => (
  <div className="min-h-screen text-white" style={{ background: 'linear-gradient(to right, #135F80, #2C7862)' }}>
    <Navbar />
    <section className="pt-28 pb-16">
      <div className="container mx-auto px-4">
        <motion.div initial="hidden" animate="visible" className="text-center max-w-3xl mx-auto mb-16">
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Users size={16} /> Feature
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Team Management
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground">
            Organize your workforce with role-based access control, easy invitations, and real-time team visibility.
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
{/* ================= Essential Features Section ================= */}

<section className="py-24">
  <div className="container mx-auto px-4">

    {/* Heading */}
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="text-center max-w-4xl mx-auto mb-20"
    >
      <motion.h2
        variants={fadeUp}
        custom={0}
        className="text-4xl md:text-5xl font-bold text-foreground mb-6"
      >
        Essential Features for Team Success
      </motion.h2>

      <motion.p
        variants={fadeUp}
        custom={1}
        className="text-lg text-muted-foreground"
      >
        Multiclout gives you the tools to lead your team with clarity. From
        real-time dashboards to workload reports and smart task assignment,
        you'll have everything you need to manage people and performance with ease.
      </motion.p>
    </motion.div>


    {/* Content */}
    <div className="grid md:grid-cols-2 gap-16 items-center">

      {/* Left Text */}
      <motion.div
        variants={fadeUp}
        custom={2}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >

        <h3 className="text-4xl font-bold text-foreground mb-6">
          Team Dashboard
        </h3>

        <p className="text-muted-foreground text-lg leading-relaxed">
          A centralized hub to view and manage your entire team. Get a snapshot
          of who's online, active, or assigned to key tasks and projects.
        </p>

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
          src={teamDashboard}
          alt="Team Dashboard"
          className="w-full h-auto"
        />

      </motion.div>

    </div>

  </div>
</section>
{/* ================= User Activity Overview ================= */}

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
          src={activityOverview}
          alt="User Activity Overview"
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

        <h3 className="text-4xl font-bold text-foreground mb-6">
          User Activity Overview
        </h3>

        <p className="text-lg text-muted-foreground leading-relaxed">
          Instantly view recent activities, tasks completed, and time spent by
          each team member to assess engagement and workload balance.
        </p>

      </motion.div>

    </div>

  </div>
</section>
{/* ================= Invite Members Section ================= */}

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

        <h3 className="text-4xl font-bold text-foreground mb-6">
          Add / Invite Members with Ease
        </h3>

        <p className="text-lg text-muted-foreground leading-relaxed">
          Invite users via email or link, assign them to projects, and set roles
          in just a few clicks. No complex onboarding or technical setup required.
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
          src={inviteMembers}
          alt="Invite Members"
          className="w-full h-auto"
        />
      </motion.div>

    </div>

  </div>
</section>

{/* Why Choose  Section */}
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
        Why Choose <span className="text-gradient">Multiclout</span> for Team Management
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
          title: "Centralized Team Oversight",
          desc: "Easily manage all team members from one dashboard. Add, remove, and organize users by roles or departments.",
          icon: Users,
        },
        {
          title: "Clear Accountability",
          desc: "Each task and time log is tied to a user, so responsibilities are always transparent and easy to trace.",
          icon: ShieldCheck,
        },
        {
          title: "Performance Visibility",
          desc: "Track contributions, productivity, and time logs for each member to identify top performers.",
          icon: CheckCircle2,
        },
        {
          title: "Scalable for Growth",
          desc: "Designed to grow with your company. Add users, adjust structures, and manage complexity easily.",
          icon: Settings,
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

<Client/>

<StartTracking />
    <Footer />
  </div>
);

export default TeamManagementFeature;
