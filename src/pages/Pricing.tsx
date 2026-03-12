import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import axios from "axios";

interface Plan {
  id: string;
  name: string;
  price: number;
  users: number;
  features: string[];
  popular?: boolean;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 } as const,
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const Pricing = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
       const res = await axios.get(
  `${import.meta.env.VITE_API_BASE_URL}/api/public/plans`
);
        if (res.data.success) {
          setPlans(res.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch public plans", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const freePlan = plans.find((p) => p.price === 0);
  const paidPlans = plans.filter((p) => p.price > 0);

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: "linear-gradient(to right, #135F80, #2C7862)",
      }}
    >
      <Navbar />

      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4">

          {/* Heading */}
          <motion.div
            initial="hidden"
            animate="visible"
            className="text-center mb-14"
          >
            <motion.h1
              variants={fadeUp}
              custom={0}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              Simple,{" "}
              <span className="text-gradient">
                Transparent
              </span>{" "}
              Pricing
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-muted-foreground max-w-lg mx-auto"
            >
              Choose the plan that fits your team.
              Upgrade or downgrade anytime.
            </motion.p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-20 text-muted-foreground">
              Loading plans...
            </div>
          ) : (
            <>
              {/* ===== FREE PLAN LARGE SECTION ===== */}
              {freePlan && (
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="relative rounded-2xl p-10 mb-16 border border-primary/40 bg-gradient-card shadow-glow"
                >
                  <div className="grid md:grid-cols-2 gap-10 items-center">
                    
                    {/* LEFT SIDE */}
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">
                        {freePlan.name}
                      </h3>

                      <div className="text-6xl font-black text-gradient mb-2">
                        14
                      </div>

                      <p className="text-primary font-medium">
                        Days / {freePlan.users} Users
                      </p>
                    </div>

                    {/* RIGHT FEATURES */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(freePlan.features ?? []).map((f) => (
                        <div
                          key={f}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <CheckCircle2
                            size={14}
                            className="text-primary mt-0.5 shrink-0"
                          />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 text-center">
                    <Link
                      to={`/onboarding?plan=${freePlan.id}`}
                    >
                      <Button
                        size="lg"
                        className="gap-2 shadow-glow"
                      >
                        Start Free Trial{" "}
                        <ArrowRight size={16} />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* ===== PAID PLANS GRID ===== */}
              <motion.div
                initial="hidden"
                animate="visible"
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {paidPlans.map((plan, i) => (
                  <motion.div
                    key={plan.id}
                    variants={fadeUp}
                    custom={i}
                    className={`relative rounded-xl p-6 border transition-all duration-300 hover:shadow-glow ${
                      plan.popular
                        ? "border-primary bg-gradient-card shadow-glow"
                        : "border-border bg-gradient-card"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                        Most Popular
                      </div>
                    )}

                    <h3 className="font-semibold text-foreground text-lg">
                      {plan.name}
                    </h3>

                    <div className="mt-3 mb-1">
                      <span className="text-3xl font-bold text-foreground">
                        ₹{plan.price}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        /month
                      </span>
                    </div>

                    <p className="text-sm text-primary mb-4">
                      Up to {plan.users} users
                    </p>

                    <ul className="space-y-2 mb-6">
                      {(plan.features ?? []).map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <CheckCircle2
                            size={14}
                            className="text-primary mt-0.5 shrink-0"
                          />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <Link
                      to={`/onboarding?plan=${plan.id}`}
                    >
                      <Button
                        className="w-full gap-1"
                        variant={
                          plan.popular
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                      >
                        Get Started{" "}
                        <ArrowRight size={14} />
                      </Button>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;