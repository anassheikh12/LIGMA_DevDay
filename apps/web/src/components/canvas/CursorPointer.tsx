'use client';

interface Props {
  color: string;
  name: string;
}

export function CursorPointer({ color, name }: Props) {
  return (
    <div style={{ position: 'relative', left: '-3px', top: '-2.5px' }}>
      <svg
        width="22"
        height="24"
        viewBox="0 0 22 24"
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(35, 31, 32, 0.18))',
          display: 'block',
        }}
      >
        <path
          d="M3 2.5L18.5 11.2L11.2 13.4L8.4 21L3 2.5Z"
          fill={color}
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div
        className="absolute whitespace-nowrap rounded-full px-2.5 py-[3px] text-[11px] font-semibold text-white left-[14px] top-[18px]"
        style={{
          backgroundColor: color,
          fontFamily: '"Geist", system-ui, sans-serif',
          letterSpacing: '0.01em',
          boxShadow: '0 2px 6px rgba(35, 31, 32, 0.18)',
        }}
      >
        {name}
      </div>
    </div>
  );
}
