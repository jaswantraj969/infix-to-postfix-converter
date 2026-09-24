/**
 * Inline SVG icon set - no icon library dependency.
 * Every icon is decorative: meaning is always carried by adjacent text or an
 * aria-label on the control, never by the glyph alone.
 */

const PATHS = {
  play: <path d="M5 3.5v9l8-4.5-8-4.5Z" />,
  pause: <path d="M5.5 3.5h2v9h-2zM8.5 3.5h2v9h-2z" />,
  next: <path d="M4 3.5v9l6-4.5-6-4.5ZM11 3.5h1.6v9H11z" />,
  previous: <path d="M12 3.5v9L6 8l6-4.5ZM3.4 3.5H5v9H3.4z" />,
  restart: (
    <path
      d="M8 3a5 5 0 1 0 4.6 3.05"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  ),
  trash: (
    <path
      d="M3.5 4.5h9M6.5 4.5V3h3v1.5M5 4.5l.6 8h4.8l.6-8M6.8 6.8v4M9.2 6.8v4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  reload: (
    <path
      d="M11.5 6.5h2.2V4.3M12.8 6.2A5.2 5.2 0 1 0 13.2 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  close: (
    <path
      d="M4.5 4.5l7 7M11.5 4.5l-7 7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  ),
  check: (
    <path
      d="M3.5 8.5l3 3 6-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  alert: (
    <>
      <path
        d="M8 2.6 1.9 13.2h12.2L8 2.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M7.3 6.2h1.4v3.6H7.3zM7.3 10.6h1.4V12H7.3z" />
    </>
  ),
  info: (
    <>
      <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M7.3 7h1.4v4.2H7.3zM7.3 4.6h1.4V6H7.3z" />
    </>
  ),
  stack: (
    <path
      d="M2.8 11.5h10.4M2.8 8h10.4M2.8 4.5h10.4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  ),
  code: (
    <path
      d="M5.6 4.4 2 8l3.6 3.6M10.4 4.4 14 8l-3.6 3.6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  history: (
    <>
      <circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.8V8l2.3 1.6" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </>
  ),
  book: (
    <path
      d="M3 3.4h4.2c.9 0 1.6.7 1.6 1.6v7.6c0-.7-.6-1.3-1.3-1.3H3V3.4ZM13 3.4H8.8c-.9 0-1.6.7-1.6 1.6v7.6c0-.7.6-1.3 1.3-1.3H13V3.4Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  ),
  arrowRight: (
    <path
      d="M3 8h9.4M9 4.6 12.4 8 9 11.4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  variable: (
    <path
      d="M5.4 3.2C3.9 4.6 3.2 6.2 3.2 8s.7 3.4 2.2 4.8M10.6 3.2c1.5 1.4 2.2 3 2.2 4.8s-.7 3.4-2.2 4.8M6.6 6.2l2.8 3.6M9.4 6.2 6.6 9.8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  ),
  equals: (
    <path
      d="M3.4 6.3h9.2M3.4 9.7h9.2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  ),
}

export default function Icon({ name, size = 16, className = '' }) {
  const glyph = PATHS[name]
  if (!glyph) return null

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ flex: 'none' }}
    >
      {glyph}
    </svg>
  )
}
