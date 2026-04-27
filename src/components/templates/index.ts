import { TemplateId } from '@/types/resume'
import { TemplateProps } from './shared'
import ModernGradient from './ModernGradient'
import AtsClassic from './AtsClassic'
import AtsMinimal from './AtsMinimal'
import Professional from './Professional'
import Creative from './Creative'
import Technical from './Technical'
import Executive from './Executive'
import Academic from './Academic'

export const TEMPLATE_COMPONENTS: Record<TemplateId, (props: TemplateProps) => JSX.Element> = {
  'modern-gradient': ModernGradient,
  'ats-classic': AtsClassic,
  'ats-minimal': AtsMinimal,
  professional: Professional,
  creative: Creative,
  technical: Technical,
  executive: Executive,
  academic: Academic,
}

export interface TemplateSidebarMeta {
  /** Which side the colored sidebar is on */
  side: 'left'
  /** Fraction of total page width (e.g. 1/3 for col-span-1 of grid-cols-3) */
  widthFraction: number
  /** 'accentColor' means use resume.accentColor at runtime */
  colorSource: 'accentColor'
}

/** Templates whose sidebar column has a solid background that must extend full-page-height. */
export const TEMPLATE_SIDEBAR_META: Partial<Record<TemplateId, TemplateSidebarMeta>> = {
  creative: { side: 'left', widthFraction: 1 / 3, colorSource: 'accentColor' },
}
