import { lazy, type ReactNode, Suspense, useState } from "react";

export interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Ctrl/Cmd+Enter, or plain Enter with submitOnEnter (Shift+Enter then adds a line). */
  onSubmit?: () => void;
  submitOnEnter?: boolean;
  toolbar?: boolean;
  toolbarEnd?: ReactNode;
  label: string;
  className?: string;
  wrapperClassName?: string;
  placeholder?: string;
  rows?: number;
  /** Limit on the stored (Markdown) text. */
  maxLength?: number;
  autoFocus?: boolean;
  id?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

const WysiwygEditor = lazy(() => import("./WysiwygEditor"));

/**
 * A WYSIWYG editor: bold, italic, lists, links and code show formatted while typing, with a toolbar,
 * the usual shortcuts and @mention/#hashtag suggestions. The value is the Markdown subset aSocial stores.
 * The editor loads lazily; until then a plain textarea keeps the page usable.
 */
export function RichEditor(props: RichEditorProps) {
  const [focused, setFocused] = useState(false);
  return (
    <Suspense
      fallback={
        <div className={props.wrapperClassName}>
          <textarea
            id={props.id}
            aria-label={props.label}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            onFocus={() => (setFocused(true), props.onFocus?.())}
            onBlur={() => (setFocused(false), props.onBlur?.())}
            placeholder={props.placeholder}
            rows={props.rows}
            maxLength={props.maxLength}
            autoFocus={props.autoFocus}
            className={props.className}
          />
        </div>
      }
    >
      <WysiwygEditor {...props} autoFocus={props.autoFocus || focused} />
    </Suspense>
  );
}
