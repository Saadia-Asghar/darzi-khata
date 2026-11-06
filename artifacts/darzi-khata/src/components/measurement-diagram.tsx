import type { GarmentType } from '../types/order';
import { usePreferences } from '../hooks/use-preferences';

// Map measurement keys to SVG regions. Upper = shirt/kameez, lower = shalwar/trouser.
const REGION: Record<string, string> = {
  kameezLambai: 'length', length: 'length', shirtLength: 'length',
  teera: 'shoulder', shoulder: 'shoulder',
  bazu: 'sleeve', sleeve: 'sleeve', armhole: 'sleeve',
  gala: 'neck', neck: 'neck', neckDepth: 'neck',
  chhaati: 'chest', chest: 'chest', bust: 'chest',
  kamar: 'waist', waist: 'waist',
  ghera: 'hem', hip: 'hem',
  shalwarLambai: 'legs', pantLength: 'legs', trouserLength: 'legs', inseam: 'legs',
  paincha: 'ankle', ankle: 'ankle',
  asan: 'rise', rise: 'rise',
  shalwarGhera: 'legs',
};

export function MeasurementDiagram({ garmentType, active, activeLabel }: { garmentType: GarmentType; active?: string; activeLabel?: string }) {
  const { label } = usePreferences();
  const lowerOnly = garmentType === 'ladies-trouser';
  const r = active ? (garmentType === 'ladies-trouser' && active === 'length' ? 'legs' : garmentType === 'ladies-trouser' && active === 'waist' ? 'waist' : REGION[active]) : undefined;
  const hl = (k: string) => r === k;
  const stroke = (k: string) => hl(k) ? 'hsl(38 92% 45%)' : 'currentColor';
  const sw = (k: string) => hl(k) ? 3.5 : 1.4;
  return (
    <figure className="rounded-lg border border-border bg-card p-2 flex items-center gap-3" aria-label={label('body_diagram')}>
      <svg viewBox="0 0 120 200" className="h-36 w-auto text-primary/50  shrink-0" role="img" aria-hidden>
        {!lowerOnly && <g fill="none" strokeLinejoin="round">
          <path d="M42 28 L30 34 L14 78 L24 82 L36 52 L36 118 L84 118 L84 52 L96 82 L106 78 L90 34 L78 28" stroke="currentColor" strokeWidth="1.4" fill="hsl(160 40% 50% / .08)" />
          <path d="M42 28 Q60 44 78 28" stroke={stroke('neck')} strokeWidth={sw('neck')} />
          <path d="M30 34 L42 28 M78 28 L90 34" stroke={stroke('shoulder')} strokeWidth={sw('shoulder')} />
          <path d="M14 78 L30 34 M106 78 L90 34" stroke={stroke('sleeve')} strokeWidth={sw('sleeve')} />
          <path d="M36 56 L84 56" stroke={stroke('chest')} strokeWidth={sw('chest')} strokeDasharray={hl('chest') ? '0' : '3 3'} />
          <path d="M36 82 L84 82" stroke={stroke('waist')} strokeWidth={sw('waist')} strokeDasharray={hl('waist') ? '0' : '3 3'} />
          <path d="M36 118 L84 118" stroke={stroke('hem')} strokeWidth={sw('hem')} />
          <path d="M100 30 L100 118" stroke={stroke('length')} strokeWidth={sw('length')} opacity={hl('length') ? 1 : 0} />
        </g>}
        <g fill="none" transform={lowerOnly ? 'translate(0,-80)' : undefined}>
          <path d="M40 124 L80 124 L86 194 L66 194 L60 150 L54 194 L34 194 Z" stroke="currentColor" strokeWidth="1.4" fill="hsl(38 80% 50% / .06)" />
          <path d="M40 124 L80 124" stroke={stroke(lowerOnly ? 'waist' : 'none')} strokeWidth={sw(lowerOnly ? 'waist' : 'none')} />
          <path d="M54 150 L60 140 L66 150" stroke={stroke('rise')} strokeWidth={sw('rise')} />
          <path d="M34 194 L54 194 M66 194 L86 194" stroke={stroke('ankle')} strokeWidth={sw('ankle')} />
          <path d="M28 124 L28 194" stroke={stroke('legs')} strokeWidth={sw('legs')} opacity={hl('legs') ? 1 : 0} />
          <path d="M90 124 L90 194" stroke={stroke('hem')} strokeWidth={sw('hem')} opacity={lowerOnly && hl('hem') ? 1 : 0} />
        </g>
      </svg>
      <figcaption className="text-sm text-muted-foreground" aria-live="polite">
        {activeLabel ? <><span className="block text-xs  ">{label('measuring')}</span><span className="text-base font-bold text-warning ">{activeLabel}</span></> : label('tap_a_field_to_see_where_to_measure')}
      </figcaption>
    </figure>
  );
}
