"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { AlertCircle, FileVideo, LinkIcon, UploadCloud, X } from "lucide-react";

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

function isNextRedirect(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
  finishing: string;
  changeFile: string;
  unsupportedFormat: string;
  fileTooLarge: string;
};

type UploadPhase = "idle" | "uploading" | "finishing";

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
  const [title, setTitle] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const titleEditedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploading = phase !== "idle";
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
  const disabled = cohorts.length === 0 || isUploading;

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
    // Effortless default: name the upload after the file, unless the student typed their own.
    if (!titleEditedRef.current) {
      const base = nextFile.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
      setTitle(base);
    }
  }

  function clearFile() {
    setFile(null);
    setProgress(0);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadViaSignedUrl(signedUrl: string, uploadFile: File) {
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          // Reserve the last stretch for the record-save step so the bar never lies.
          setProgress(Math.round((event.loaded / event.total) * 90));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setProgress(90);
          setPhase("finishing");
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
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !file || !selectedCohortId) {
      setError(copy.requiredFields);
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setPhase("uploading");
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
      record.set("title", trimmedTitle);
      record.set("description", String(formData.get("description") ?? ""));
      record.set("cohort_id", selectedCohortId);
      record.set("cohort_session_id", selectedSessionId);
      record.set("storage_path", payload.path);
      record.set("file_size_bytes", String(file.size));
      record.set("mime_type", file.type);
      record.set("return_to", returnTo);

      await createUploadedVideoRecordAction(record);
    } catch (uploadError) {
      if (isNextRedirect(uploadError)) {
        throw uploadError;
      }
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
      setPhase("idle");
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

          {/* Step 1: choose the clip first. */}
          <div className="space-y-2 md:col-span-2">
            <Label>{copy.fileLabel}</Label>
            {file ? (
              <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <FileVideo className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="focus-ring shrink-0 rounded-full px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10"
                  disabled={isUploading}
                >
                  {copy.changeFile}
                </button>
                <button
                  type="button"
                  onClick={clearFile}
                  className="focus-ring shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground"
                  aria-label={copy.changeFile}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragActive(false);
                  selectFile(event.dataTransfer.files.item(0));
                }}
                className={cn(
                  "focus-ring flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-secondary p-6 text-center transition-colors",
                  dragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                )}
                disabled={disabled}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UploadCloud className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="font-medium">{copy.chooseFile}</span>
                <span className="text-xs text-muted-foreground">
                  {copy.dropHint} · {copy.maxFileHint}
                </span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              className="sr-only"
              onChange={(event) => selectFile(event.target.files?.item(0) ?? null)}
            />
          </div>

          {/* Step 2: details (title pre-filled from the file name). */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="upload-title">{copy.titleLabel}</Label>
            <Input
              id="upload-title"
              name="title"
              value={title}
              onChange={(event) => {
                titleEditedRef.current = true;
                setTitle(event.target.value);
              }}
              required
              disabled={disabled}
            />
          </div>
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
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="upload-description">{copy.descriptionLabel}</Label>
            <Textarea id="upload-description" name="description" disabled={disabled} />
          </div>

          {phase !== "idle" ? (
            <div className="md:col-span-2" aria-live="polite">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-2 rounded-full bg-primary transition-all duration-300",
                    phase === "finishing" && "animate-pulse"
                  )}
                  style={{ width: phase === "finishing" ? "100%" : `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {phase === "finishing" ? copy.finishing : `${copy.uploading} ${progress}%`}
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
              {isUploading ? copy.uploading : copy.saveUpload}
            </Button>
          </div>
        </form>
      ) : (
        <form action={addExternalVideoLinkAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="return_to" value={returnTo} />
          <div className="space-y-2 md:col-span-2">
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
            <Label htmlFor="link-title">{copy.titleLabel}</Label>
            <Input id="link-title" name="title" required />
          </div>
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
