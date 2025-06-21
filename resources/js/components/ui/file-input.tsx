import * as React from "react"
import { cn } from "@/lib/utils"

export interface FileInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  onFilesSelected?: (files: FileList | null) => void;
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  ({ className, label, onFilesSelected, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onFilesSelected) {
        onFilesSelected(e.target.files);
      }
    };

    return (
      <div className="grid w-full items-center gap-1.5">
        {label && <label className="text-sm font-medium leading-none">{label}</label>}
        <div className="relative">
          <input
            type="file"
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            ref={ref}
            onChange={handleChange}
            {...props}
          />
        </div>
      </div>
    );
  }
);
FileInput.displayName = "FileInput";

export { FileInput };
