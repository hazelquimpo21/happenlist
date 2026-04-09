'use client';

/**
 * TIME-AWARE GREETING
 * ===================
 * Client component that displays a greeting based on time of day and day of week.
 * "Good morning, Milwaukee" / "Happy Saturday, Milwaukee" / "What's on tonight?"
 */

import { useState, useEffect } from 'react';

export function TimeAwareGreeting() {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday

    // Weekend special greetings
    if (day === 5 && hour >= 16) {
      setGreeting('Happy Friday night, Milwaukee');
      return;
    }
    if (day === 6) {
      setGreeting('Happy Saturday, Milwaukee');
      return;
    }
    if (day === 0) {
      setGreeting('Happy Sunday, Milwaukee');
      return;
    }

    // Time-of-day greetings
    if (hour < 12) {
      setGreeting('Good morning, Milwaukee');
    } else if (hour < 17) {
      setGreeting('Good afternoon, Milwaukee');
    } else if (hour < 21) {
      setGreeting("What's on tonight, Milwaukee");
    } else {
      setGreeting('Good evening, Milwaukee');
    }
  }, []);

  // SSR fallback
  if (!greeting) {
    return (
      <p className="text-h2 font-bold text-pure/80">
        Discover Milwaukee
      </p>
    );
  }

  return (
    <p className="text-h2 font-bold text-pure/80">
      {greeting}
    </p>
  );
}
