import styles from "./Panel.module.css";

/**
 * Panel — a reusable boxed container (dark surface, border, rounded corners).
 *
 * Props:
 *   children   — the content shown inside the panel.
 *   accent     — when true, gives the panel an amber-tinted border.
 *   flush      — when true, removes padding and clips content to the corners
 *                (use for edge-to-edge content like a full-width photo).
 *   className  — optional extra CSS classes from the caller.
 *   ...rest    — any other props (e.g. onClick) are passed to the <div>.
 */
export default function Panel({
  children,
  accent = false,
  flush = false,
  className = "",
  ...rest
}) {
  // Start with the base look, then add only the variants that are switched on.
  // .filter(Boolean) drops the empty strings so we don't get stray spaces.
  const panelClasses = [
    styles.panel,
    accent ? styles.accent : "",
    flush ? styles.flush : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={panelClasses} {...rest}>
      {children}
    </div>
  );
}
