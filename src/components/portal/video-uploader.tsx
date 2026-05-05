"use client";

import { useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import { AlertCircle, FileVideo, LinkIcon, UploadCloud } from "lucide-react";
import { isRedirectError } from "next/dist/client/components/redirect";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  addExternalVideoLinkAction,
  createUploadedVideoRecordAction
} from "@/server/actions/videos";

type VideoCohortOption = {
  id: string;
  name: string;
  sessions: {
    id: string;
    session_number: number;
    session_date: string;
  }[];
};

type VideoUploaderCopy = {
  uploadTab: string;
  linkTab: string;
  titleLabel: string;
  descriptionLabel: string;
  cohortLabel: string;
  sessionLabel: string;
  generalSession: string;
  fileLabel: string;
  chooseFile: string;
  dropHint: string;
  saveUpload: string;
  saveLink: string;
  urlLabel: string;
  requiredFields: string;
  noEligibleCohorts: string;
  maxFileHint: string;
  uploading: string;
  unsupportedFormat: string;
  fileTooLarge: string;
};

export function VideoUploader({
  locale,
  cohorts,
  defaultCohortId,
  acceptedFormats,
  maxVideoSizeMb,
  returnTo = "videos",
  copy
}: {
  locale: Locale;
  cohorts: VideoCohortOption[];
  defaultCohortId?: string | null;
  acceptedFormats: string[];
  maxVideoSizeMb: number;
  returnTo?: "community" | "videos";
  copy: VideoUploaderCopy;
}) {
  const [mode, setMode] = useState<"upload" | "link">("upload");
  const [selectedCohortId, setSelectedCohortId] = useState(defaultCohortId ?? cohorts[0]?.id ?? "");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCohort = useMemo(
    () => cohorts.find((cohort) => cohort.id === selectedCohortId) ?? cohorts[0],
    [cohorts, selectedCohortId]
  );
  const normalizedFormats = acceptedFormats.map((format) => format.toLowerCase());
  const accept = normalizedFormats
    .flatMap((format) =>
      format === "mov" ? [".mov", "video/quicktime"] : [`.${format}`, `video/${format}`]
    )
    .join(",");
  const disabled = cohorts.length === 0 || isUploading || isPending;

  function validateFile(nextFile: File) {
    const extension = nextFile.name.split(".").pop()?.toLowerCase() ?? "";
    if (!normalizedFormats.includes(extension)) {
      return copy.unsupportedFormat;
    }
    if (nextFile.size > maxVideoSizeMb * 1024 * 1024) {
      return copy.fileTooLarge;
    }
    return null;
  }

  function selectFile(nextFile: File | null) {
    setError(null);
    setProgress(0);
    if (!nextFile) {
      setFile(null);
      return;
    }
    const validationError = validateFile(nextFile);
    if (validationError) {
      setFile(null);
      setError(validationError);
      return;
    }
    setFile(nextFile);
  }

  async function uploadViaSignedUrl(signedUrl: string, uploadFile: File) {
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 95));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setProgress(100);
          resolve();
        } else {
          reject(new Error(xhr.responseText || "Upload failed."));
        }
      };
      xhr.onerror = () => reject(new Error("Upload failed."));
      xhr.open("PUT", signedUrl);
      xhr.setRequestHeader("Content-Type", uploadFile.type || "application/octet-stream");
      xhr.setRequestHeader("x-upsert", "false");
      xhr.send(uploadFile);
    });
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim();
    if (!title || !file || !selectedCohortId) {
      setError(copy.requiredFields);
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);
    setProgress(5);

    try {
      const response = await fetch("/api/storage/sign-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileSizeBytes: file.size,
          mimeType: file.type,
          cohortId: selectedCohortId,
          cohortSessionId: selectedSessionId || undefined
        })
      });
      const payload = (await response.json()) as {
        path?: string;
        signedUrl?: string;
        error?: string;
      };

      if (!response.ok || !payload.path || !payload.signedUrl) {
        throw new Error(payload.error ?? "Could not prepare upload.");
      }

      await uploadViaSignedUrl(payload.signedUrl, file);

      const record = new FormData();
      record.set("locale", locale);
      record.set("title", title);
      record.set("description", String(formData.get("description") ?? ""));
      record.set("cohort_id", selectedCohortId);
      record.set("cohort_session_id", selectedSessionId);
      record.set("storage_path", payload.path);
      record.set("file_size_bytes", String(file.size));
      record.set("mime_type", file.type);
      record.set("return_to", returnTo);

      startTransition(async () => {
        try {
          await createUploadedVideoRecordAction(record);
        } catch (recordError) {
          if (isRedirectError(recordError)) {
            throw recordError;
          }
          setError(recordError instanceof Error ? recordError.message : "Upload failed.");
          setIsUploading(false);
          setProgress(0);
        }
      });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
      setIsUploading(false);
      setProgress(0);
    }
  }

  if (cohorts.length === 0) {
    return (
      <div className="rounded-md border border-border bg-secondary p-5 text-sm text-muted-foreground">
        {copy.noEligibleCohorts}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="inline-flex rounded-md border border-border bg-secondary p-1">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={cn(
            "focus-ring flex h-10 items-center gap-2 rounded px-4 text-sm font-semibold",
            mode === "upload" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          )}
        >
          <UploadCloud className="h-4 w-4" aria-hidden="true" />
          {copy.uploadTab}
        </button>
        <button
          type="button"
          onClick={() => setMode("link")}
          className={cn(
            "focus-ring flex h-10 items-center gap-2 rounded px-4 text-sm font-semibold",
            mode === "link" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          )}
        >
          <LinkIcon className="h-4 w-4" aria-hidden="true" />
          {copy.linkTab}
        </button>
      </div>

      {mode === "upload" ? (
        <form onSubmit={handleUpload} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="return_to" value={returnTo} />
          <FieldSelects
            copy={copy}
            cohorts={cohorts}
            selectedCohort={selectedCohort}
            selectedCohortId={selectedCohortId}
            selectedSessionId={selectedSessionId}
            setSelectedCohortId={(value) => {
              setSelectedCohortId(value);
              setSelectedSessionId("");
            }}
            setSelectedSessionId={setSelectedSessionId}
          />
          <div className="space-y-2">
            <Label htmlFor="upload-title">{copy.titleLabel}</Label>
            <Input id="upload-title" name="title" required disabled={disabled} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="upload-description">{copy.descriptionLabel}</Label>
            <Textarea id="upload-description" name="description" disabled={disabled} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{copy.fileLabel}</Label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                selectFile(event.dataTransfer.files.item(0));
              }}
              className="focus-ring flex min-h-40 w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-secondary p-6 text-center transition-colors hover:border-primary/50"
              disabled={disabled}
            >
              <FileVideo className="h-8 w-8 text-primary" aria-hidden="true" />
              <span className="font-medium">{file ? file.name : copy.chooseFile}</span>
              <span className="text-xs text-muted-foreground">
                {copy.dropHint} {copy.maxFileHint}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              className="sr-only"
              onChange={(event) => selectFile(event.target.files?.item(0) ?? null)}
            />
          </div>
          {progress > 0 ? (
            <div className="md:col-span-2">
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {copy.uploading} {progress}%
              </p>
            </div>
          ) : null}
          {error ? (
            <p className="flex items-center gap-2 text-sm text-destructive md:col-span-2">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              {error}
            </p>
          ) : null}
          <div className="md:col-span-2">
            <Button disabled={disabled || !file}>
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              {copy.saveUpload}
            </Button>
          </div>
        </form>
      ) : (
        <form action={addExternalVideoLinkAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="return_to" value={returnTo} />
          <FieldSelects
            copy={copy}
            cohorts={cohorts}
            selectedCohort={selectedCohort}
            selectedCohortId={selectedCohortId}
            selectedSessionId={selectedSessionId}
            setSelectedCohortId={(value) => {
              setSelectedCohortId(value);
              setSelectedSessionId("");
            }}
            setSelectedSessionId={setSelectedSessionId}
          />
          <div className="space-y-2">
            <Label htmlFor="link-title">{copy.titleLabel}</Label>
            <Input id="link-title" name="title" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="external_url">{copy.urlLabel}</Label>
            <Input
              id="external_url"
              name="external_url"
              type="url"
              placeholder="https://youtube.com/..."
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="link-description">{copy.descriptionLabel}</Label>
            <Textarea id="link-description" name="description" />
          </div>
          <div className="md:col-span-2">
            <Button>
              <LinkIcon className="h-4 w-4" aria-hidden="true" />
              {copy.saveLink}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function FieldSelects({
  copy,
  cohorts,
  selectedCohort,
  selectedCohortId,
  selectedSessionId,
  setSelectedCohortId,
  setSelectedSessionId
}: {
  copy: VideoUploaderCopy;
  cohorts: VideoCohortOption[];
  selectedCohort?: VideoCohortOption;
  selectedCohortId: string;
  selectedSessionId: string;
  setSelectedCohortId: (value: string) => void;
  setSelectedSessionId: (value: string) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="cohort_id">{copy.cohortLabel}</Label>
        <select
          id="cohort_id"
          name="cohort_id"
          value={selectedCohortId}
          onChange={(event) => setSelectedCohortId(event.target.value)}
          className="h-11 w-full rounded-md border border-input bg-secondary px-3 text-sm"
          required
        >
          {cohorts.map((cohort) => (
            <option key={cohort.id} value={cohort.id}>
              {cohort.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cohort_session_id">{copy.sessionLabel}</Label>
        <select
          id="cohort_session_id"
          name="cohort_session_id"
          value={selectedSessionId}
          onChange={(event) => setSelectedSessionId(event.target.value)}
          className="h-11 w-full rounded-md border border-input bg-secondary px-3 text-sm"
        >
          <option value="">{copy.generalSession}</option>
          {[...(selectedCohort?.sessions ?? [])]
            .sort((a, b) => a.session_number - b.session_number)
            .map((session) => (
              <option key={session.id} value={session.id}>
                Week {session.session_number}
              </option>
            ))}
        </select>
      </div>
    </>
  );
}
