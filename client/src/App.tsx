import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ARTIST_BACKGROUND_IMAGES, PARTY_BACKGROUND_THEME } from "./const";
import { ThemeProvider } from "./contexts/ThemeContext";
import Welcome from "./pages/Welcome";
import SongList from "./pages/SongList";
import Player from "./pages/Player";
import ScoreDashboard from "./pages/ScoreDashboard";

function checkImageAvailability(source: string) {
  return new Promise<boolean>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = source;
  });
}

async function getAvailableArtistBackgrounds() {
  const checks = await Promise.all(ARTIST_BACKGROUND_IMAGES.map((source) => checkImageAvailability(source)));
  return ARTIST_BACKGROUND_IMAGES.filter((_, index) => checks[index]);
}

function AnimatedRouter() {
  const [location] = useLocation();

  // make sure to consider if you need authentication for certain routes
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
      >
        <Switch>
          <Route path="/" component={Welcome} />
          <Route path="/songs" component={SongList} />
          <Route path="/player/:songId" component={Player} />
          <Route path="/score" component={ScoreDashboard} />
          <Route path="/404" component={NotFound} />
          {/* Final fallback route */}
          <Route component={NotFound} />
        </Switch>
      </motion.div>
    </AnimatePresence>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  const [artistBackground, setArtistBackground] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.dataset.partyTheme = PARTY_BACKGROUND_THEME;
  }, []);

  useEffect(() => {
    let isCancelled = false;
    let rotationTimer: ReturnType<typeof globalThis.setInterval> | null = null;

    const setupArtistBackgroundRotation = async () => {
      const availableImages = await getAvailableArtistBackgrounds();

      if (isCancelled || availableImages.length === 0) {
        return;
      }

      let currentIndex = 0;
      setArtistBackground(availableImages[currentIndex]);

      rotationTimer = globalThis.setInterval(() => {
        currentIndex = (currentIndex + 1) % availableImages.length;
        setArtistBackground(availableImages[currentIndex]);
      }, 16000);
    };

    void setupArtistBackgroundRotation();

    return () => {
      isCancelled = true;
      if (rotationTimer !== null) {
        globalThis.clearInterval(rotationTimer);
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <TooltipProvider>
          {artistBackground && (
            <div
              className="pointer-events-none fixed inset-0 z-[0] vivioke-artist-photo-fx"
              style={{ backgroundImage: `url(${artistBackground})` }}
            />
          )}
          <div className="pointer-events-none fixed inset-0 z-[1] vivioke-global-party-fx" />
          <div className="relative z-[2] vivioke-content-layer">
            <Toaster />
            <AnimatedRouter />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
