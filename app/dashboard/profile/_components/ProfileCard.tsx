"use client";

import { motion } from "framer-motion";

export function ProfileCard({
  title,
  value,
  delay = 0,
}: {
  title: string;
  value: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      className="relative overflow-hidden rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-900 p-6 text-black dark:text-white shadow-lg"
    >
      <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
      <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-white/5 blur-2xl" />

      <h3 className="mb-1 text-sm font-medium text-zinc-800 dark:text-zinc-400">
        {title}
      </h3>
      <p className="text-xl font-semibold text-black dark:text-white">
        {value}
      </p>
    </motion.div>
  );
}
