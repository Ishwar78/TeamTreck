import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, ChevronLeft, ChevronRight, Eye, EyeOff, Grid3X3, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type Screenshot = {
  id: number;
  user: string;
  time: string;
  app: string;
  title: string;
  gradient: string;
};

const gradients = [
  "from-blue-900/50 to-cyan-900/30",
  "from-emerald-900/50 to-teal-900/30",
  "from-violet-900/50 to-indigo-900/30",
  "from-amber-900/50 to-orange-900/30",
  "from-rose-900/50 to-pink-900/30",
  "from-sky-900/50 to-blue-900/30",
];

const mockScreenshots: Screenshot[] = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  user: ["Alice Johnson", "Bob Smith", "Carol White", "David Lee", "Eva Brown", "Frank Chen"][i % 6],
  time: `${9 + Math.floor(i / 3)}:${String((i % 3) * 20).padStart(2, "0")}`,
  app: ["VS Code", "Chrome", "Slack", "Figma", "Terminal", "Notion"][i % 6],
  title: ["main.tsx — WEBMOK", "Dashboard - Google", "#team-chat", "UI Design v3", "npm run dev", "Sprint Planning"][i % 6],
  gradient: gradients[i % 6],
}));

const ScreenshotGallery = () => {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [blurred, setBlurred] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const openLightbox = (idx: number) => setLightboxIdx(idx);
  const closeLightbox = () => setLightboxIdx(null);
  const prev = () => setLightboxIdx((p) => (p !== null && p > 0 ? p - 1 : mockScreenshots.length - 1));
  const next = () => setLightboxIdx((p) => (p !== null && p < mockScreenshots.length - 1 ? p + 1 : 0));

  const current = lightboxIdx !== null ? mockScreenshots[lightboxIdx] : null;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Camera size={20} className="text-primary" /> Screenshot Gallery
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch id="gallery-blur" checked={blurred} onCheckedChange={setBlurred} />
            <Label htmlFor="gallery-blur" className="text-sm text-muted-foreground flex items-center gap-1">
              {blurred ? <EyeOff size={14} /> : <Eye size={14} />} Blur
            </Label>
          </div>
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setView("grid")}
              className={`px-2.5 py-1.5 ${view === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Grid3X3 size={14} />
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-2.5 py-1.5 ${view === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutList size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {view === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {mockScreenshots.map((shot, i) => (
            <motion.div
              key={shot.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => openLightbox(i)}
              className="cursor-pointer group rounded-xl border border-border overflow-hidden hover:border-primary/40 transition-all hover:shadow-glow"
            >
              <div className={`bg-gradient-to-br ${shot.gradient} aspect-video relative`}>
                <div className={`absolute inset-0 flex items-center justify-center ${blurred ? "blur-lg" : ""}`}>
                  <div className="text-center">
                    <div className="text-xs font-mono text-foreground/60">{shot.app}</div>
                    <div className="text-[10px] text-muted-foreground">{shot.title}</div>
                  </div>
                </div>
                <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full glass text-[9px] text-muted-foreground">
                  {shot.time}
                </div>
              </div>
              <div className="p-2 bg-card">
                <div className="text-xs font-medium text-foreground truncate">{shot.user}</div>
                <div className="text-[10px] text-muted-foreground truncate">{shot.app}</div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
          {mockScreenshots.map((shot, i) => (
            <motion.div
              key={shot.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => openLightbox(i)}
              className="flex items-center gap-4 p-3 hover:bg-secondary/20 cursor-pointer transition-colors"
            >
              <div className={`w-20 h-12 rounded-lg bg-gradient-to-br ${shot.gradient} shrink-0 relative overflow-hidden`}>
                <div className={`absolute inset-0 flex items-center justify-center ${blurred ? "blur-md" : ""}`}>
                  <span className="text-[9px] font-mono text-foreground/50">{shot.app}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">{shot.user}</div>
                <div className="text-xs text-muted-foreground truncate">{shot.app} — {shot.title}</div>
              </div>
              <span className="text-xs text-muted-foreground font-mono shrink-0">{shot.time}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {current && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
            onClick={closeLightbox}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl mx-4"
            >
              <div className="rounded-xl border border-border overflow-hidden shadow-glow">
                <div className={`bg-gradient-to-br ${current.gradient} aspect-video relative`}>
                  <div className={`absolute inset-0 flex items-center justify-center ${blurred ? "blur-lg" : ""}`}>
                    <div className="text-center">
                      <div className="text-lg font-mono text-foreground/70">{current.app}</div>
                      <div className="text-sm text-muted-foreground">{current.title}</div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-card flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">{current.user}</div>
                    <div className="text-xs text-muted-foreground">{current.app} — {current.title} • {current.time}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">{(lightboxIdx ?? 0) + 1} / {mockScreenshots.length}</span>
                </div>
              </div>

              <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-foreground" onClick={closeLightbox}>
                <X size={18} />
              </Button>
              <Button variant="ghost" size="icon" className="absolute left-[-48px] top-1/2 -translate-y-1/2 text-foreground" onClick={prev}>
                <ChevronLeft size={24} />
              </Button>
              <Button variant="ghost" size="icon" className="absolute right-[-48px] top-1/2 -translate-y-1/2 text-foreground" onClick={next}>
                <ChevronRight size={24} />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScreenshotGallery;
