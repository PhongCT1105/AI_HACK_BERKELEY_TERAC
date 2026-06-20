import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <main className="mx-auto flex max-w-3xl flex-1 flex-col items-start justify-center gap-8 px-6 py-24">
        <span className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium tracking-wide text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          Captain America · Credibility firewall for AI agents
        </span>

        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
          Captain America Fin-Fact Claim Verification
        </h1>

        <p className="max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Before an AI agent cites a financial claim, it should know whether the claim and its
          visible source evidence are credible enough to use. We collect fresh human labels on
          blind Fin-Fact-derived claims to train and evaluate that judgment.
        </p>

        <p className="max-w-xl text-base leading-7 text-zinc-500 dark:text-zinc-500">
          Original Fin-Fact labels and justifications stay hidden from annotators. Terac labels
          are stored in Supabase, exported as training data, and used for a held-out
          claim-citation evaluation.
        </p>

        <div className="flex flex-col gap-4 pt-2 sm:flex-row">
          <Button render={<Link href="/annotate" />} size="lg">
            Verify a financial claim →
          </Button>
          <Button render={<Link href="/admin" />} size="lg" variant="outline">
            Admin dashboard
          </Button>
        </div>

        <div className="grid w-full gap-4 pt-12 sm:grid-cols-3">
          <Card title="1. Review" body="See a blind financial claim, its visible context, and a neutral capsule." />
          <Card title="2. Judge" body="Label support, whether an AI may cite it, risks, and a concise reason." />
          <Card title="3. Evaluate" body="Export fresh Terac labels for a held-out claim-citation model comparison." />
        </div>
      </main>
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
    </div>
  );
}
