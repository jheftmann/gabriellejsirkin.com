import {useCallback} from 'react'
import {set, unset} from 'sanity'
import type {StringInputProps} from 'sanity'

const COLORWAYS = [
  {value: 'default',    label: 'Default',    bg: '#f2ede6', text: '#000000'},
  {value: 'colorway-1', label: 'Colorway 1', bg: '#c9919e', text: '#551507'},
  {value: 'colorway-2', label: 'Colorway 2', bg: '#f4dba1', text: '#113845'},
  {value: 'colorway-3', label: 'Colorway 3', bg: '#c0d6d4', text: '#3d292b'},
  {value: 'colorway-4', label: 'Colorway 4', bg: '#dcffcd', text: '#135421'},
  {value: 'colorway-5', label: 'Colorway 5', bg: '#551507', text: '#c4705f'},
  {value: 'colorway-6', label: 'Colorway 6', bg: '#aa7347', text: '#94d5f7'},
  {value: 'colorway-7', label: 'Colorway 7', bg: '#ff5045', text: '#94cdff'},
  {value: 'about',     label: 'About',      bg: '#e8e3db', text: '#000000'},
  {value: 'services',  label: 'Services',   bg: '#e8e3db', text: '#000000'},
]

export function ColorThemeInput(props: StringInputProps) {
  const {value, onChange, readOnly} = props

  const handleClick = useCallback(
    (colorValue: string) => {
      if (readOnly) return
      onChange(colorValue === value ? unset() : set(colorValue))
    },
    [value, onChange, readOnly],
  )

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
        gap: '8px',
        padding: '12px',
        background: 'var(--card-bg-color)',
        borderRadius: '4px',
        border: '1px solid var(--card-border-color)',
      }}
    >
      {COLORWAYS.map((cw) => {
        const selected = value === cw.value
        return (
          <button
            key={cw.value}
            type="button"
            onClick={() => handleClick(cw.value)}
            disabled={!!readOnly}
            title={cw.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '5px',
              padding: '8px 4px',
              background: 'transparent',
              border: selected
                ? '2px solid var(--card-focus-ring-color, #2276fc)'
                : '2px solid transparent',
              borderRadius: '6px',
              cursor: readOnly ? 'default' : 'pointer',
              opacity: readOnly ? 0.5 : 1,
            }}
          >
            {/* Swatch */}
            <div
              style={{
                width: 44,
                height: 32,
                borderRadius: 4,
                background: cw.bg,
                border: '1px solid rgba(0,0,0,0.12)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Text color stripe */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 8,
                  background: cw.text,
                  opacity: 0.7,
                }}
              />
            </div>
            <span
              style={{
                fontSize: 10,
                color: 'var(--card-muted-fg-color)',
                fontWeight: selected ? 600 : 400,
                textAlign: 'center',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}
            >
              {cw.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
