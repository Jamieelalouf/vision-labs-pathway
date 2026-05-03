import Link from "next/link";
import { ExternalLink, FileVideo, Filter } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { EmptyState } from "@/components/vision/empty-state";
import type { Locale } from "@/i18n/routing";
import { formatDate } from "@/lib/utils";
import { getVideosForAdmin } from "@/server/queries/data";

export default async function AdminVideosPage({
  params,
  searchParams
}: {
  params: { locale: Locale };
  searchParams?: { source?: string; cohort?: string; dancer?: string };
}) {
  const allVideos = await getVideosForAdmin();
  const dancerOptions = uniqueOptions(
    allVideos.map((video: any) => {
      const dancer = Array.isArray(video.dancers) ? video.dancers[0] : video.dancers;
      return dancer
        ? { id: video.dancer_id, label: `${dancer.first_name} ${dancer.last_name}` }
        : null;
    })
  );
  const cohortOptions = uniqueOptions(
    allVideos.map((video: any) => {
      const cohort = Array.isArray(video.cohorts) ? video.cohorts[0] : video.cohorts;
      return cohort && video.cohort_id ? { id: video.cohort_id, label: cohort.name } : null;
    })
  );
  const selectedSource = searchParams?.source ?? "all";
  const selectedCohort = searchParams?.cohort ?? "all";
  const selectedDancer = searchParams?.dancer ?? "all";
  const videos = allVideos.filter((video: any) => {
    const sourceMatch = selectedSource === "all" || video.source === selectedSource;
    const cohortMatch = selectedCohort === "all" || video.cohort_id === selectedCohort;
    const dancerMatch = selectedDancer === "all" || video.dancer_id === selectedDancer;
    return sourceMatch && cohortMatch && dancerMatch;
  });

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Phase 6</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Videos</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Review student uploads and external links. Private storage videos render through signed
          URLs only.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <CardTitle>Video review</CardTitle>
            <form className="flex flex-wrap gap-2" action={`/${params.locale}/admin/videos`}>
              <div className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3">
                <Filter className="h-4 w-4 text-primary" aria-hidden="true" />
                <select
                  name="source"
                  defaultValue={selectedSource}
                  className="h-10 bg-transparent text-sm outline-none"
                >
                  <option value="all">All sources</option>
                  <option value="upload">Uploads</option>
                  <option value="external_link">External links</option>
                </select>
              </div>
              <select
                name="cohort"
                defaultValue={selectedCohort}
                className="h-10 rounded-md border border-border bg-secondary px-3 text-sm"
              >
                <option value="all">All cohorts</option>
                {cohortOptions.map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.label}
                  </option>
                ))}
              </select>
              <select
                name="dancer"
                defaultValue={selectedDancer}
                className="h-10 rounded-md border border-border bg-secondary px-3 text-sm"
              >
                <option value="all">All dancers</option>
                {dancerOptions.map((dancer) => (
                  <option key={dancer.id} value={dancer.id}>
                    {dancer.label}
                  </option>
                ))}
              </select>
              <Button size="sm" variant="secondary">
                Filter
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {videos.length === 0 ? (
            <EmptyState
              title="No videos match these filters"
              description="Student uploads and external links will appear here once submitted."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Dancer</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Cohort</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.map((video: any) => {
                  const dancer = Array.isArray(video.dancers) ? video.dancers[0] : video.dancers;
                  const profile = Array.isArray(dancer?.profiles)
                    ? dancer?.profiles[0]
                    : dancer?.profiles;
                  const cohort = Array.isArray(video.cohorts) ? video.cohorts[0] : video.cohorts;
                  const session = Array.isArray(video.cohort_sessions)
                    ? video.cohort_sessions[0]
                    : video.cohort_sessions;

                  return (
                    <TableRow key={video.id}>
                      <TableCell>
                        <div className="w-44 overflow-hidden rounded-md border border-border bg-secondary">
                          {video.source === "upload" && video.signed_url ? (
                            <video
                              src={video.signed_url}
                              controls
                              preload="metadata"
                              className="aspect-video w-full bg-black object-cover"
                            />
                          ) : (
                            <div className="flex aspect-video items-center justify-center">
                              <FileVideo className="h-6 w-6 text-primary" aria-hidden="true" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-48">
                        <p className="font-medium">{video.title}</p>
                        {video.description ? (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {video.description}
                          </p>
                        ) : null}
                        {video.external_url ? (
                          <Button asChild variant="link" className="mt-1">
                            <Link href={video.external_url} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" aria-hidden="true" />
                              Open link
                            </Link>
                          </Button>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/${params.locale}/admin/dancers/${video.dancer_id}`}
                          className="font-medium hover:text-primary"
                        >
                          {dancer?.first_name} {dancer?.last_name}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">{profile?.email ?? ""}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={video.source === "upload" ? "success" : "secondary"}>
                          {video.source === "upload" ? "upload" : "external"}
                        </Badge>
                      </TableCell>
                      <TableCell>{cohort?.name ?? "-"}</TableCell>
                      <TableCell>
                        {session ? `Week ${session.session_number}` : "General"}
                      </TableCell>
                      <TableCell>{formatDate(video.created_at, params.locale)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function uniqueOptions(options: ({ id: string; label: string } | null)[]) {
  const seen = new Set<string>();
  return options.filter((option): option is { id: string; label: string } => {
    if (!option || seen.has(option.id)) return false;
    seen.add(option.id);
    return true;
  });
}
