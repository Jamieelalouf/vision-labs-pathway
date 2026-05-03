import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getVideosForAdmin } from "@/server/queries/data";

export default async function AdminVideosPage() {
  const videos = await getVideosForAdmin();
  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Phase 6</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Videos</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Video review</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Dancer</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Cohort</TableHead>
                <TableHead>Link/path</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((video: any) => {
                const dancer = Array.isArray(video.dancers) ? video.dancers[0] : video.dancers;
                const cohort = Array.isArray(video.cohorts) ? video.cohorts[0] : video.cohorts;
                return (
                  <TableRow key={video.id}>
                    <TableCell className="font-medium">{video.title}</TableCell>
                    <TableCell>{dancer?.first_name} {dancer?.last_name}</TableCell>
                    <TableCell>{video.source}</TableCell>
                    <TableCell>{cohort?.name ?? "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">{video.external_url ?? video.storage_path}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
