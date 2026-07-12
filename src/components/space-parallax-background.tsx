"use client";

import { useEffect } from "react";
import Image from "next/image";

export function SpaceParallaxBackground() {
  useEffect(() => {
    let ticking = false;

    const update = () => {
      ticking = false;
      document.documentElement.style.setProperty("--sc-scroll-y", `${window.scrollY}px`);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="sc-bg" aria-hidden="true">
      <div className="sc-bg-vignette" />

      <Image
        className="sc-layer sc-station sc-station-1"
        src="/assets/star-citizen-bg/station-port-tressler.jpg"
        alt=""
        width={1920}
        height={1080}
      />
      <Image
        className="sc-layer sc-station sc-station-2"
        src="/assets/star-citizen-bg/station-everus-harbor.jpg"
        alt=""
        width={1920}
        height={1080}
      />

      <Image
        className="sc-layer sc-ship sc-ship-1"
        src="/assets/star-citizen-bg/ship-carrack.jpg"
        alt=""
        width={1920}
        height={1080}
      />
      <Image
        className="sc-layer sc-ship sc-ship-2"
        src="/assets/star-citizen-bg/ship-corsair.jpg"
        alt=""
        width={1920}
        height={1080}
      />
      <Image
        className="sc-layer sc-ship sc-ship-3"
        src="/assets/star-citizen-bg/ship-gladius.jpg"
        alt=""
        width={1920}
        height={1080}
      />
    </div>
  );
}
