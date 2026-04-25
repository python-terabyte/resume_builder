'use client'

import { forwardRef } from 'react'
import { ResumeData } from '@/types/resume'
import { TEMPLATE_COMPONENTS } from './templates'

interface ResumePreviewProps {
  resume: ResumeData
}

const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(({ resume }, ref) => {
  const { typography, templateId } = resume
  const Template = TEMPLATE_COMPONENTS[templateId] ?? TEMPLATE_COMPONENTS['modern-gradient']

  const style = {
    fontFamily: `'${typography.fontFamily}', sans-serif`,
    fontSize: `${typography.fontSize}px`,
    lineHeight: typography.lineHeight,
    letterSpacing: `${typography.letterSpacing}em`,
  }

  return (
    <div
      id="resume-preview"
      ref={ref}
      style={{
        width: '210mm',
        minHeight: '297mm',
        background: 'white',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        ...style,
      }}
      className="text-gray-800"
    >
      <Template resume={resume} />
    </div>
  )
})

ResumePreview.displayName = 'ResumePreview'
export default ResumePreview
