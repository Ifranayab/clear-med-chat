import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Shield, Brain, Stethoscope, ArrowRight, Upload, MessageSquare, Languages } from "lucide-react";

const features = [
  { icon: Upload, title: "Upload Reports", desc: "PDF, images, or scanned prescriptions" },
  { icon: Brain, title: "AI Analysis", desc: "Instant plain-language explanations" },
  { icon: Shield, title: "Risk Assessment", desc: "Visual risk level classification" },
  { icon: MessageSquare, title: "Doctor Questions", desc: "Smart questions to ask your doctor" },
  { icon: FileText, title: "Medicine Info", desc: "Purpose, usage & side effects" },
  { icon: Languages, title: "Voice Support", desc: "Text-to-speech for explanations" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-foreground">MediExplain AI</span>
          </div>
          <div className="flex gap-3">
            <Link to="/auth"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link to="/auth?tab=signup"><Button size="sm" className="bg-gradient-hero text-primary-foreground">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
              AI-Powered Medical Report Interpreter
            </span>
          </motion.div>
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }}
          >
            Understand Your <span className="text-gradient-hero">Medical Reports</span> in Simple Words
          </motion.h1>
          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          >
            Upload your lab reports, prescriptions, or scanned documents. Our AI converts complex medical language into clear, easy-to-understand explanations.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <Link to="/auth?tab=signup">
              <Button size="lg" className="bg-gradient-hero text-primary-foreground px-8 py-6 text-lg shadow-elevated">
                Upload Your Report <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/40">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="bg-card rounded-xl p-6 shadow-card hover:shadow-elevated transition-shadow"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
              >
                <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center mb-4">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12">
        <div className="container max-w-3xl text-center">
          <div className="bg-accent/50 rounded-xl p-6 border border-primary/10">
            <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Disclaimer:</strong> This system does NOT provide medical diagnosis or treatment. Always consult a qualified medical professional for health decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © 2026 MediExplain AI — Final Year Engineering Project
        </div>
      </footer>
    </div>
  );
}
