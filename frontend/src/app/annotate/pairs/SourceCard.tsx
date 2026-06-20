import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { SourceFeatures } from "@/lib/types";
import { ExternalLink } from "lucide-react";

const FEATURE_LABELS: Record<string, string> = {
  source_type: "Source type",
  author_transparency: "Author transparency",
  citation_quality: "Citation quality",
  evidence_quality: "Evidence quality",
  commercial_pressure: "Commercial pressure",
};

export function SourceCard({
  label,
  source,
}: {
  label: "Source A" | "Source B";
  source: SourceFeatures;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="gap-2">
        <Badge variant="secondary" className="w-fit">
          {label}
        </Badge>
        <h3 className="text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
          {source.title ?? "Untitled source"}
        </h3>
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {source.url}
          <ExternalLink className="size-3.5" />
        </a>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {source.capsule && (
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {source.capsule}
          </p>
        )}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {(["source_type", "author_transparency", "citation_quality", "evidence_quality", "commercial_pressure"] as const).map(
            (key) => (
              <div key={key} className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-zinc-400">
                  {FEATURE_LABELS[key]}
                </dt>
                <dd className="text-zinc-800 dark:text-zinc-200">
                  {(source[key] ?? "unknown").replace(/_/g, " ")}
                </dd>
              </div>
            )
          )}
        </dl>

        {source.risk_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {source.risk_tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
