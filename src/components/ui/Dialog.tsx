import clsx from "clsx";
import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";

/** Accessible modal built on the native <dialog> element (focus trap + Esc for free). */
export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
  hideTitle,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  hideTitle?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-label={title}
      className={clsx(
        "m-auto w-[min(100%-1.5rem,32rem)] max-h-[min(90dvh,48rem)] overflow-visible rounded-3xl bg-transparent p-0 text-ink backdrop:animate-fade-in open:animate-rise",
        className,
      )}
    >
      {open ? (
        <div className="card max-h-[min(90dvh,48rem)] overflow-y-auto p-5 sm:p-6">
          <div className={clsx("mb-4 flex items-start justify-between gap-4", hideTitle && "sr-only")}>
            <h2 className="font-serif text-xl font-semibold">{title}</h2>
            <button onClick={onClose} className="-m-1.5 rounded-full p-1.5 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Close">
              <X className="size-5" />
            </button>
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
