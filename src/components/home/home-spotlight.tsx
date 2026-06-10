"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { catalogBookPath } from "@/lib/books/paths";
import type { FeaturedCover } from "@/lib/home/featured-covers";
import { staggerContainer, staggerItem } from "@/lib/motion";

type HomeSpotlightProps = {
  books: FeaturedCover[];
};

export function HomeSpotlight({ books }: HomeSpotlightProps) {
  const prefersReducedMotion = useReducedMotion();

  if (books.length === 0) {
    return null;
  }

  return (
    <section className="border-y border-border/60 bg-card/40 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">From the library</p>
            <h2 className="font-display mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Books readers are diving into
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              A fresh pick from the catalog every visit — browse the full
              collection when you&apos;re ready for more.
            </p>
          </div>
          <Link href="/catalog" className="shrink-0">
            <Button variant="outline" className="gap-2">
              View catalog
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <motion.div
          className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
          variants={prefersReducedMotion ? undefined : staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-60px" }}
        >
          {books.map((book) => (
            <motion.div key={book.id} variants={staggerItem}>
              <Link
                href={catalogBookPath(book.id)}
                className="group block overflow-hidden rounded-xl border border-border/80 bg-card card-glow transition-transform duration-300 hover:-translate-y-1 sm:rounded-2xl"
              >
                <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-primary/10 to-brand-coral/10">
                  <Image
                    src={book.coverUrl}
                    alt={`Cover of ${book.title}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 25vw"
                    unoptimized
                  />
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">
                    {book.title}
                  </h3>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground sm:text-sm">
                    {book.author}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
