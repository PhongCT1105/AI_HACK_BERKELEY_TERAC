import Link from "next/link";
import { AnnotateClient } from "./AnnotateClient";

export default function AnnotatePairsPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <p className="text-sm text-zinc-500">
          Comparing two sources for one task. Labeling a single claim instead?{" "}
          <Link href="/annotate" className="underline hover:text-zinc-800 dark:hover:text-zinc-200">
            Go to claim labeling →
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          SourceGuard Labeling Arena — Source Pairs
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          You are helping train an AI agent to choose trustworthy financial sources. Given a
          research task and two web sources, choose which source an AI agent should trust or
          cite. You are not being asked to give financial advice or decide whether an investment
          is good. Focus on source quality: evidence, transparency, citations, promotional
          pressure, and whether the page is appropriate for an AI agent to cite.
        </p>
      </div>
      <AnnotateClient />
    </div>
  );
}
