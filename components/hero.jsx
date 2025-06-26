"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const HeroSection = () => {
  const imageRef = useRef(null);

  useEffect(() => {
    const imageElement = imageRef.current;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const scrollThreshold = 100;

      if (scrollPosition > scrollThreshold) {
        imageElement.classList.add("scrolled");
      } else {
        imageElement.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="pt-40 pb-20 px-4 relative overflow-hidden">
      {/* Animated Gradient Circles */}
      <div className="absolute top-[-80px] left-[-80px] w-72 h-72 bg-gradient-to-br from-blue-400 to-purple-300 opacity-30 rounded-full blur-3xl animate-float-slow z-0" />
      <div className="absolute top-[20%] right-[-100px] w-80 h-80 bg-gradient-to-br from-pink-300 to-blue-300 opacity-20 rounded-full blur-3xl animate-float-slower z-0" />
      <div className="absolute bottom-[-100px] left-[10%] w-64 h-64 bg-gradient-to-br from-green-300 to-blue-200 opacity-20 rounded-full blur-3xl animate-float-slowest z-0" />
      <div className="container mx-auto text-center relative z-10">
        <h1 className="text-5xl md:text-8xl lg:text-[105px] pb-6 gradient-title animate-hero-text">
          Manage Your Finances <br /> with Intelligence
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          An AI-powered financial management platform that helps you track,
          analyze, and optimize your spending with real-time insights.
        </p>
        <div className="flex justify-center space-x-4">
          <Link href="/dashboard">
            <Button size="lg" className="px-8">
              Get Started
            </Button>
          </Link>
        </div>
        <div className="hero-image-wrapper mt-5 md:mt-0">
          <div ref={imageRef} className="hero-image">
            <Image
              src="/banner2.jpg"
              width={1280}
              height={720}
              alt="Dashboard Preview"
              className="rounded-lg shadow-2xl border mx-auto"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
