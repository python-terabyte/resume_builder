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
