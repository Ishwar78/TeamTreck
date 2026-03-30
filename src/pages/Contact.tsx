import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MessageCircle, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_BASE_URL;

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.email || !formData.phone) {
      toast({
        title: "Missing Fields",
        description: "Please fill in your first name, email, and phone number.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const name = `${formData.firstName} ${formData.lastName}`.trim();

const res = await axios.post(`${API}/api/public/book-demo`, {
        name,
        email: formData.email,
        phone: formData.phone,
        organisation: formData.company,
        message: formData.message
      });

      if (res.data.success) {
        toast({
          title: "Message Sent",
          description: "We've received your inquiry and will be in touch shortly!",
        });

        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          company: "",
          message: ""
        });
      }
    } catch (error: any) {
      console.error("Form submission failed", error);
      toast({
        title: "Submission Failed",
        description: error.response?.data?.message || "There was an error sending your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: "linear-gradient(to right, #135F80, #2C7862)" }}
    >
      <Navbar />

      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">

          {/* Heading */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-3">
              Get in <span className="text-gradient">Touch</span>
            </h1>
            <p className="text-white/80">
              Have a question or want to book a demo? We'd love to hear from you.
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-10">

            {/* LEFT SIDE - Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card border border-border rounded-xl p-8 space-y-8 shadow-glow"
            >
              <h2 className="text-2xl font-semibold mb-6">
                Contact Information
              </h2>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-white/70">Email</p>
                  <p className="font-medium">info@multiclout.in</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Phone size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-white/70">Mobile Number</p>
                  <p className="font-medium">+91 7206123452</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageCircle size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-white/70">WhatsApp</p>
                  <p className="font-medium">+91 7206123452</p>
                </div>
              </div>

            </motion.div>

            {/* RIGHT SIDE - FORM */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-xl bg-gradient-card border border-border p-8"
            >
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name <span className="text-red-400">*</span></Label>
                    <Input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="John"
                      className="mt-1.5"
                      required
                    />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Doe"
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email <span className="text-red-400">*</span></Label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@company.com"
                      className="mt-1.5"
                      required
                    />
                  </div>
                  <div>
                    <Label>Phone <span className="text-red-400">*</span></Label>
                    <Input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                      className="mt-1.5"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Company</Label>
                  <Input
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Acme Corp"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label>Message</Label>
                  <Textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us about your needs..."
                    className="mt-1.5"
                    rows={4}
                  />
                </div>

                <Button className="w-full gap-2" size="lg" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Mail size={16} />}
                  {loading ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </motion.div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;