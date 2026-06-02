"use client";

import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

import { useToast } from "@/components/ui/toast";
import type { Locale } from "@/i18n/routing";
import { updateDancerAvatarStoragePathAction } from "@/server/actions/auth";

type ProfilePhotoUploaderCopy = {
  title: string;
  subtitle: string;
  uploading: string;
  success: string;
  uploadErrorPrefix: string;
  invalidType: string;
  fileTooLarge: string;
};

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

export function ProfilePhotoUploader({
  locale,
  initialImageUrl,
  copy
}: {
  locale: Locale;
  initialImageUrl?: string | null;
  copy: ProfilePhotoUploaderCopy;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl ?? null);
  const [message, setMessage] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const { showToast, toastNode } = useToast();

  function validateImage(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_TYPES.includes(file.type) || !ALLOWED_EXTENSIONS.includes(ext)) {
      return copy.invalidType;
    }
    if (file.size > MAX_BYTES) {
      return copy.fileTooLarge;
    }
    return null;
  }

  async function handleFile(file: File | null) {
    setMessage("");
    if (!file) return;

    const previousImageUrl = imageUrl;
    const validationError = validateImage(file);
    if (validationError) {
      setMessage(`${copy.uploadErrorPrefix} ${validationError}`);
      return;
    }

    setIsUploading(true);
    const objectUrl = URL.createObjectURL(file);
    setImageUrl(objectUrl);

    try {
      const signResponse = await fetch("/api/storage/sign-profile-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileSizeBytes: file.size,
          mimeType: file.type
        })
      });

      const signPayload = (await signResponse.json()) as {
        path?: string;
        signedUrl?: string;
        error?: string;
      };

      if (!signResponse.ok || !signPayload.path || !signPayload.signedUrl) {
        throw new Error(signPayload.error ?? "Could not prepare profile photo upload.");
      }

      const uploadResponse = await fetch(signPayload.signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "x-upsert": "false"
        },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error("Could not upload profile photo.");
      }

      const formData = new FormData();
      formData.set("language_pref", locale);
      formData.set("avatar_storage_path", signPayload.path);
      const result = await updateDancerAvatarStoragePathAction(formData);

      if (!result.ok) {
        throw new Error(result.message || "Could not save profile photo.");
      }

      setMessage(copy.success);
      showToast(copy.success, "success");
    } catch (error) {
      URL.revokeObjectURL(objectUrl);
      setImageUrl(previousImageUrl ?? null);
      const errorMessage = `${copy.uploadErrorPrefix} ${error instanceof Error ? error.message : "Profile photo upload failed."}`;
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-background/20 p-3 text-left transition hover:border-primary/60"
      disabled={isUploading}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
      />
      <div className="relative h-12 w-12 overflow-hidden rounded-full bg-primary/10 text-primary ring-1 ring-primary/30 md:h-14 md:w-14">
        {imageUrl ? (
          <Image src={imageUrl} alt={copy.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Camera className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
          </div>
        )}
        {isUploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-5 w-5 animate-spin text-white" aria-hidden="true" />
          </div>
        ) : null}
      </div>
      <div>
        <p className="text-sm font-semibold">{copy.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{isUploading ? copy.uploading : copy.subtitle}</p>
        {message ? (
          <p className={`mt-1 text-xs ${message === copy.success ? "text-emerald-300" : "text-red-300"}`}>
            {message}
          </p>
        ) : null}
      </div>
      {isUploading ? <Loader2 className="ml-auto h-4 w-4 animate-spin text-white/80" /> : null}
    </button>
    {toastNode}
    </>
  );
}
