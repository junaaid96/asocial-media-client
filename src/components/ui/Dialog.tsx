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
        // Phones: a bottom sheet that uses the full width and respects the home indicator.
        "max-sm:mx-0 max-sm:mb-0 max-sm:max-w-none max-sm:!w-full max-sm:max-h-[92dvh] max-sm:rounded-b-none",
        className,
      )}
    >
      {open ? (
        <div className="card max-h-[min(90dvh,48rem)] overflow-y-auto overscroll-contain p-5 max-sm:max-h-[92dvh] max-sm:rounded-b-none max-sm:pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">
          <div className="mx-auto -mt-2 mb-3 h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden />
          <div className={clsx("mb-4 flex items-start justify-between gap-4", hideTitle && "sr-only")}>
            <h2 className="pt-1.5 font-serif text-xl font-semibold">{title}</h2>
            <button onClick={onClose} className="-m-2 grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink" aria-label="Close">
              <X className="size-5" />
            </button>
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
