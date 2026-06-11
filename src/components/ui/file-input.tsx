"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

type FileInputProps = Omit<
  React.ComponentProps<"input">,
  "type" | "value" | "onChange"
> & {
  onFileChange: (file: File | null) => void;
  fileName?: string | null;
  placeholder?: string;
};

export const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  (
    {
      className,
      id,
      onFileChange,
      fileName,
      placeholder = "No file chosen",
      accept,
      disabled,
      required,
      ...props
    },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    return (
      <div
        className={cn(
          "flex h-11 w-full items-center gap-3 rounded-xl border border-border bg-card/50 px-3 text-sm backdrop-blur-sm transition-colors focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border/80 bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/50 disabled:pointer-events-none"
        >
          <Upload className="h-3.5 w-3.5" />
          Choose file
        </button>
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            fileName ? "text-foreground" : "text-muted-foreground",
          )}
          title={fileName ?? undefined}
        >
          {fileName ?? placeholder}
        </span>
        <input
          {...props}
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          required={required}
          disabled={disabled}
          className="sr-only"
          onChange={(event) => {
            onFileChange(event.target.files?.[0] ?? null);
          }}
        />
      </div>
    );
  },
);

FileInput.displayName = "FileInput";
