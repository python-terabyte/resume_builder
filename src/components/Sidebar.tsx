'use client'

import { useRef, useState, ChangeEvent } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import {
  ResumeData,
  ResumeSection,
  ExperienceItem,
  EducationItem,
  SkillGroup,
  SkillItem,
  ProjectItem,
  CertificationItem,
  LanguageItem,
  InterestItem,
  COLOR_THEMES,
  FONT_FAMILIES,
  INDUSTRIES,
  TEMPLATES,
  TemplateId,
  Industry,
} from '@/types/resume'

interface SidebarProps {
  resume: ResumeData
  updateResume: (updater: (prev: ResumeData) => ResumeData) => void
  activeSection: string
  setActiveSection: (s: string) => void
}

// ─── Generic helpers ──────────────────────────────────────────────────────────

function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  className,
}: {
  label?: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ''}`}>
      {label && <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-white/10 bg-[#0f0f1a] px-2.5 py-1.5 text-sm text-white placeholder-slate-600 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
      />
    </div>
  )
}

function Textarea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label?: string
  value: string
  onChange: (v: string) => void
  rows?: number
  placeholder?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const BULLET = '• '

  function insertBullet() {
    const ta = ref.current
    if (!ta) return
    const start = ta.selectionStart ?? value.length
    const end = ta.selectionEnd ?? value.length
    // Find the start of the current line
    const before = value.slice(0, start)
    const lineStart = before.lastIndexOf('\n') + 1
    const lineHead = value.slice(lineStart, start)
    // If we're not at the start of a line, prepend a newline
    const insertion = (lineHead.length > 0 ? '\n' : '') + BULLET
    const next = value.slice(0, start) + insertion + value.slice(end)
    onChange(next)
    // restore caret after the inserted bullet
    requestAnimationFrame(() => {
      const pos = start + insertion.length
      ta.focus()
      ta.setSelectionRange(pos, pos)
    })
  }

  // Auto-continue bullet lines on Enter; on Enter at the start of an empty
  // bulleted line, exit the bullet (clear it) so a double-Enter ends the list.
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return
    const ta = e.currentTarget
    const start = ta.selectionStart
    const end = ta.selectionEnd
    if (start !== end) return // selection: let default replace
    const before = value.slice(0, start)
    const lineStart = before.lastIndexOf('\n') + 1
    const currentLine = value.slice(lineStart, start)
    const match = currentLine.match(/^(\s*)([•\-\*])\s+(.*)$/)
    if (!match) return

    const [, indent, marker, rest] = match
    e.preventDefault()
    if (rest.length === 0) {
      // Empty bullet line, clear the marker and stay on this line
      const next = value.slice(0, lineStart) + value.slice(start)
      onChange(next)
      requestAnimationFrame(() => {
        ta.focus()
        ta.setSelectionRange(lineStart, lineStart)
      })
    } else {
      // Continue the list on a new line
      const insertion = `\n${indent}${marker} `
      const next = value.slice(0, start) + insertion + value.slice(end)
      onChange(next)
      requestAnimationFrame(() => {
        const pos = start + insertion.length
        ta.focus()
        ta.setSelectionRange(pos, pos)
      })
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</label>
          <button
            type="button"
            onClick={insertBullet}
            title="Insert bullet (•), Enter on a bullet line continues; double Enter ends the list"
            className="rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-400 transition hover:bg-white/5 hover:text-accent"
          >
            • Bullet
          </button>
        </div>
      )}
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-none rounded-md border border-white/10 bg-[#0f0f1a] px-2.5 py-1.5 text-sm text-white placeholder-slate-600 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
        style={{ whiteSpace: 'pre-wrap' }}
      />
    </div>
  )
}

function SectionHeader({
  title,
  open,
  onToggle,
}: {
  title: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-white/5"
    >
      <span className="text-sm font-semibold text-white">{title}</span>
      <svg
        className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
}

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-white/10">
      <SectionHeader title={title} open={open} onToggle={() => setOpen(!open)} />
      <div className={`accordion-content ${open ? 'open' : 'closed'}`}>
        <div className="px-4 pb-4 pt-1">{children}</div>
      </div>
    </div>
  )
}

// ─── Sortable item wrapper ─────────────────────────────────────────────────────

function SortableItem({
  id,
  children,
}: {
  id: string
  children: (dragHandleProps: React.HTMLAttributes<HTMLElement>) => React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} className="relative">
      {children({ ...attributes, ...listeners })}
    </div>
  )
}

// ─── Add + Arrange button row (shared) ────────────────────────────────────────

function ArrangeAddBar({
  addLabel,
  onAdd,
  arranging,
  setArranging,
  canArrange,
}: {
  addLabel: string
  onAdd: () => void
  arranging: boolean
  setArranging: (v: boolean) => void
  canArrange: boolean
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onAdd}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-dashed border-white/20 py-2 text-sm text-slate-400 transition hover:border-accent hover:text-accent"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {addLabel}
      </button>
      {canArrange && (
        <button
          onClick={() => setArranging(!arranging)}
          title={arranging ? 'Done arranging' : 'Drag to reorder items'}
          className={`flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition ${
            arranging
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-white/20 text-slate-400 hover:border-accent hover:text-accent'
          }`}
        >
          {arranging ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          )}
          {arranging ? 'Done' : 'Arrange'}
        </button>
      )}
    </div>
  )
}

function ArrangeRow({
  dragProps,
  label,
}: {
  dragProps: React.HTMLAttributes<HTMLElement>
  label: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-white/10 bg-[#1a1a2e] px-3 py-2.5">
      <span
        {...dragProps}
        className="drag-handle cursor-grab text-slate-500 hover:text-slate-300"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </span>
      <span className="flex-1 truncate text-sm text-slate-300">{label || 'Untitled'}</span>
    </div>
  )
}

// ─── Personal ─────────────────────────────────────────────────────────────────

function PersonalSection({ resume, updateResume }: Pick<SidebarProps, 'resume' | 'updateResume'>) {
  const p = resume.personal
  const set = (key: keyof typeof p) => (v: string) =>
    updateResume((prev) => ({ ...prev, personal: { ...prev.personal, [key]: v } }))

  function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      updateResume((prev) => ({ ...prev, personal: { ...prev.personal, photo: ev.target?.result as string } }))
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Photo */}
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white/20 bg-[#252540]">
          {p.photo ? (
            <img src={p.photo} alt="Photo" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-500">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="cursor-pointer rounded-md border border-white/20 px-2.5 py-1 text-xs text-slate-300 transition hover:border-accent hover:text-white">
            Upload Photo
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </label>
          {p.photo && (
            <button
              onClick={() => updateResume((prev) => ({ ...prev, personal: { ...prev.personal, photo: null } }))}
              className="text-left text-xs text-red-400 transition hover:text-red-300"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input label="First Name" value={p.firstName} onChange={set('firstName')} />
        <Input label="Last Name" value={p.lastName} onChange={set('lastName')} />
      </div>
      <Input label="Job Title" value={p.jobTitle} onChange={set('jobTitle')} />
      <div className="grid grid-cols-2 gap-2">
        <Input label="Email" value={p.email} onChange={set('email')} type="email" />
        <Input label="Phone" value={p.phone} onChange={set('phone')} />
      </div>
      <Input label="Location" value={p.location} onChange={set('location')} placeholder="City, State" />
      <div className="grid grid-cols-2 gap-2">
        <Input label="Website" value={p.website} onChange={set('website')} />
        <Input label="LinkedIn" value={p.linkedin} onChange={set('linkedin')} />
      </div>
      <Textarea label="Summary" value={p.summary} onChange={set('summary')} rows={4} />
    </div>
  )
}

// ─── Experience ───────────────────────────────────────────────────────────────

function ExperienceSection({ resume, updateResume }: Pick<SidebarProps, 'resume' | 'updateResume'>) {
  const [arranging, setArranging] = useState(false)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function addItem() {
    const item: ExperienceItem = {
      id: uuidv4(),
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    }
    updateResume((prev) => ({ ...prev, experience: [item, ...prev.experience] }))
  }

  function removeItem(id: string) {
    updateResume((prev) => ({ ...prev, experience: prev.experience.filter((x) => x.id !== id) }))
  }

  function setField(id: string, key: keyof ExperienceItem, value: string | boolean) {
    updateResume((prev) => ({
      ...prev,
      experience: prev.experience.map((x) => (x.id === id ? { ...x, [key]: value } : x)),
    }))
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      updateResume((prev) => {
        const ids = prev.experience.map((e) => e.id)
        const oldIdx = ids.indexOf(active.id as string)
        const newIdx = ids.indexOf(over.id as string)
        return { ...prev, experience: arrayMove(prev.experience, oldIdx, newIdx) }
      })
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <ArrangeAddBar
        addLabel="Add Experience"
        onAdd={addItem}
        arranging={arranging}
        setArranging={setArranging}
        canArrange={resume.experience.length > 1}
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={resume.experience.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          {resume.experience.map((exp) => (
            <SortableItem key={exp.id} id={exp.id}>
              {(dragProps) => arranging ? (
                <ArrangeRow dragProps={dragProps} label={exp.position || exp.company || 'New Experience'} />
              ) : (
                <div className="rounded-lg border border-white/10 bg-[#1a1a2e]">
                  <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span {...dragProps} className="drag-handle cursor-grab text-slate-500 hover:text-slate-300">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                      </span>
                      <span className="text-xs font-medium text-slate-300">
                        {exp.position || exp.company || 'New Experience'}
                      </span>
                    </div>
                    <button
                      onClick={() => removeItem(exp.id)}
                      className="text-slate-500 transition hover:text-red-400"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Position" value={exp.position} onChange={(v) => setField(exp.id, 'position', v)} />
                      <Input label="Company" value={exp.company} onChange={(v) => setField(exp.id, 'company', v)} />
                    </div>
                    <Input label="Location" value={exp.location} onChange={(v) => setField(exp.id, 'location', v)} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Start Date" value={exp.startDate} onChange={(v) => setField(exp.id, 'startDate', v)} type="month" />
                      {!exp.current && (
                        <Input label="End Date" value={exp.endDate} onChange={(v) => setField(exp.id, 'endDate', v)} type="month" />
                      )}
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
                      <input
                        type="checkbox"
                        checked={exp.current}
                        onChange={(e) => setField(exp.id, 'current', e.target.checked)}
                        className="accent-accent"
                      />
                      Currently working here
                    </label>
                    <Textarea
                      label="Description"
                      value={exp.description}
                      onChange={(v) => setField(exp.id, 'description', v)}
                      rows={4}
                      placeholder="• Describe your responsibilities and achievements"
                    />
                  </div>
                </div>
              )}
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}

// ─── Education ────────────────────────────────────────────────────────────────

function EducationSection({ resume, updateResume }: Pick<SidebarProps, 'resume' | 'updateResume'>) {
  const [arranging, setArranging] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor))

  function addItem() {
    const item: EducationItem = {
      id: uuidv4(),
      institution: '',
      degree: '',
      field: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      gpa: '',
      description: '',
    }
    updateResume((prev) => ({ ...prev, education: [item, ...prev.education] }))
  }

  function removeItem(id: string) {
    updateResume((prev) => ({ ...prev, education: prev.education.filter((x) => x.id !== id) }))
  }

  function setField(id: string, key: keyof EducationItem, value: string | boolean) {
    updateResume((prev) => ({
      ...prev,
      education: prev.education.map((x) => (x.id === id ? { ...x, [key]: value } : x)),
    }))
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      updateResume((prev) => {
        const ids = prev.education.map((e) => e.id)
        return { ...prev, education: arrayMove(prev.education, ids.indexOf(active.id as string), ids.indexOf(over.id as string)) }
      })
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <ArrangeAddBar
        addLabel="Add Education"
        onAdd={addItem}
        arranging={arranging}
        setArranging={setArranging}
        canArrange={resume.education.length > 1}
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={resume.education.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          {resume.education.map((edu) => (
            <SortableItem key={edu.id} id={edu.id}>
              {(dragProps) => arranging ? (
                <ArrangeRow dragProps={dragProps} label={edu.institution || 'New Education'} />
              ) : (
                <div className="rounded-lg border border-white/10 bg-[#1a1a2e]">
                  <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span {...dragProps} className="drag-handle cursor-grab text-slate-500 hover:text-slate-300">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                      </span>
                      <span className="text-xs font-medium text-slate-300">{edu.institution || 'New Education'}</span>
                    </div>
                    <button onClick={() => removeItem(edu.id)} className="text-slate-500 hover:text-red-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 p-3">
                    <Input label="Institution" value={edu.institution} onChange={(v) => setField(edu.id, 'institution', v)} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Degree" value={edu.degree} onChange={(v) => setField(edu.id, 'degree', v)} placeholder="B.S." />
                      <Input label="Field of Study" value={edu.field} onChange={(v) => setField(edu.id, 'field', v)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Start Date" value={edu.startDate} onChange={(v) => setField(edu.id, 'startDate', v)} type="month" />
                      {!edu.current && <Input label="End Date" value={edu.endDate} onChange={(v) => setField(edu.id, 'endDate', v)} type="month" />}
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
                      <input type="checkbox" checked={edu.current} onChange={(e) => setField(edu.id, 'current', e.target.checked)} className="accent-accent" />
                      Currently attending
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="GPA" value={edu.gpa} onChange={(v) => setField(edu.id, 'gpa', v)} placeholder="3.8" />
                      <Input label="Location" value={edu.location} onChange={(v) => setField(edu.id, 'location', v)} />
                    </div>
                    <Textarea label="Notes" value={edu.description} onChange={(v) => setField(edu.id, 'description', v)} rows={2} />
                  </div>
                </div>
              )}
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}

// ─── Skills ───────────────────────────────────────────────────────────────────

function SkillsSection({ resume, updateResume }: Pick<SidebarProps, 'resume' | 'updateResume'>) {
  const [arranging, setArranging] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor))

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      updateResume((prev) => {
        const ids = prev.skillGroups.map((g) => g.id)
        return {
          ...prev,
          skillGroups: arrayMove(prev.skillGroups, ids.indexOf(active.id as string), ids.indexOf(over.id as string)),
        }
      })
    }
  }

  function addGroup() {
    const group: SkillGroup = { id: uuidv4(), category: '', skills: [] }
    updateResume((prev) => ({ ...prev, skillGroups: [...prev.skillGroups, group] }))
  }

  function removeGroup(id: string) {
    updateResume((prev) => ({ ...prev, skillGroups: prev.skillGroups.filter((g) => g.id !== id) }))
  }

  function setGroupCategory(id: string, category: string) {
    updateResume((prev) => ({
      ...prev,
      skillGroups: prev.skillGroups.map((g) => (g.id === id ? { ...g, category } : g)),
    }))
  }

  function addSkill(groupId: string) {
    const skill: SkillItem = { id: uuidv4(), name: '', level: 80 }
    updateResume((prev) => ({
      ...prev,
      skillGroups: prev.skillGroups.map((g) =>
        g.id === groupId ? { ...g, skills: [...g.skills, skill] } : g
      ),
    }))
  }

  function removeSkill(groupId: string, skillId: string) {
    updateResume((prev) => ({
      ...prev,
      skillGroups: prev.skillGroups.map((g) =>
        g.id === groupId ? { ...g, skills: g.skills.filter((s) => s.id !== skillId) } : g
      ),
    }))
  }

  function setSkill(groupId: string, skillId: string, key: keyof SkillItem, value: string | number) {
    updateResume((prev) => ({
      ...prev,
      skillGroups: prev.skillGroups.map((g) =>
        g.id === groupId
          ? { ...g, skills: g.skills.map((s) => (s.id === skillId ? { ...s, [key]: value } : s)) }
          : g
      ),
    }))
  }

  return (
    <div className="flex flex-col gap-3">
      <ArrangeAddBar
        addLabel="Add Skill Group"
        onAdd={addGroup}
        arranging={arranging}
        setArranging={setArranging}
        canArrange={resume.skillGroups.length > 1}
      />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={resume.skillGroups.map((g) => g.id)} strategy={verticalListSortingStrategy}>
          {resume.skillGroups.map((group) => (
            <SortableItem key={group.id} id={group.id}>
              {(dragProps) => arranging ? (
                <ArrangeRow dragProps={dragProps} label={group.category || 'Untitled Group'} />
              ) : (
                <div className="rounded-lg border border-white/10 bg-[#1a1a2e]">
                  <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                    <span {...dragProps} className="drag-handle cursor-grab text-slate-500 hover:text-slate-300">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                    </span>
                    <input
                      value={group.category}
                      onChange={(e) => setGroupCategory(group.id, e.target.value)}
                      placeholder="Category (e.g. Languages)"
                      className="ml-2 flex-1 bg-transparent text-xs font-medium text-white placeholder-slate-500 outline-none"
                    />
                    <button onClick={() => removeGroup(group.id)} className="ml-2 text-slate-500 hover:text-red-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 p-3">
                    {group.skills.map((skill) => (
                      <div key={skill.id} className="flex items-center gap-2">
                        <input
                          value={skill.name}
                          onChange={(e) => setSkill(group.id, skill.id, 'name', e.target.value)}
                          placeholder="Skill name"
                          className="w-28 rounded-md border border-white/10 bg-[#0f0f1a] px-2 py-1 text-xs text-white placeholder-slate-600 outline-none focus:border-accent"
                        />
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={skill.level}
                          onChange={(e) => setSkill(group.id, skill.id, 'level', parseInt(e.target.value))}
                          className="flex-1"
                        />
                        <span className="w-8 text-right text-xs text-slate-400">{skill.level}%</span>
                        <button onClick={() => removeSkill(group.id, skill.id)} className="text-slate-500 hover:text-red-400">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addSkill(group.id)}
                      className="mt-1 flex items-center gap-1 text-xs text-accent transition hover:text-accent"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Add skill
                    </button>
                  </div>
                </div>
              )}
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}

// ─── Projects ─────────────────────────────────────────────────────────────────

function ProjectsSection({ resume, updateResume }: Pick<SidebarProps, 'resume' | 'updateResume'>) {
  const [arranging, setArranging] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor))

  function addItem() {
    const item: ProjectItem = { id: uuidv4(), name: '', description: '', url: '', technologies: '', startDate: '', endDate: '' }
    updateResume((prev) => ({ ...prev, projects: [item, ...prev.projects] }))
  }

  function removeItem(id: string) {
    updateResume((prev) => ({ ...prev, projects: prev.projects.filter((x) => x.id !== id) }))
  }

  function setField(id: string, key: keyof ProjectItem, value: string) {
    updateResume((prev) => ({
      ...prev,
      projects: prev.projects.map((x) => (x.id === id ? { ...x, [key]: value } : x)),
    }))
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      updateResume((prev) => {
        const ids = prev.projects.map((p) => p.id)
        return { ...prev, projects: arrayMove(prev.projects, ids.indexOf(active.id as string), ids.indexOf(over.id as string)) }
      })
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <ArrangeAddBar
        addLabel="Add Project"
        onAdd={addItem}
        arranging={arranging}
        setArranging={setArranging}
        canArrange={resume.projects.length > 1}
      />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={resume.projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          {resume.projects.map((proj) => (
            <SortableItem key={proj.id} id={proj.id}>
              {(dragProps) => arranging ? (
                <ArrangeRow dragProps={dragProps} label={proj.name || 'New Project'} />
              ) : (
                <div className="rounded-lg border border-white/10 bg-[#1a1a2e]">
                  <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span {...dragProps} className="drag-handle cursor-grab text-slate-500 hover:text-slate-300">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                      </span>
                      <span className="text-xs font-medium text-slate-300">{proj.name || 'New Project'}</span>
                    </div>
                    <button onClick={() => removeItem(proj.id)} className="text-slate-500 hover:text-red-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 p-3">
                    <Input label="Project Name" value={proj.name} onChange={(v) => setField(proj.id, 'name', v)} />
                    <Input label="URL" value={proj.url} onChange={(v) => setField(proj.id, 'url', v)} placeholder="github.com/..." />
                    <Input label="Technologies" value={proj.technologies} onChange={(v) => setField(proj.id, 'technologies', v)} placeholder="React, Node.js, ..." />
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Start Date" value={proj.startDate} onChange={(v) => setField(proj.id, 'startDate', v)} type="month" />
                      <Input label="End Date" value={proj.endDate} onChange={(v) => setField(proj.id, 'endDate', v)} type="month" />
                    </div>
                    <Textarea label="Description" value={proj.description} onChange={(v) => setField(proj.id, 'description', v)} rows={3} />
                  </div>
                </div>
              )}
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}

// ─── Certifications ───────────────────────────────────────────────────────────

function CertificationsSection({ resume, updateResume }: Pick<SidebarProps, 'resume' | 'updateResume'>) {
  const [arranging, setArranging] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor))

  function addItem() {
    const item: CertificationItem = { id: uuidv4(), name: '', issuer: '', date: '', url: '' }
    updateResume((prev) => ({ ...prev, certifications: [item, ...prev.certifications] }))
  }
  function removeItem(id: string) {
    updateResume((prev) => ({ ...prev, certifications: prev.certifications.filter((x) => x.id !== id) }))
  }
  function setField(id: string, key: keyof CertificationItem, value: string) {
    updateResume((prev) => ({ ...prev, certifications: prev.certifications.map((x) => (x.id === id ? { ...x, [key]: value } : x)) }))
  }
  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      updateResume((prev) => {
        const ids = prev.certifications.map((c) => c.id)
        return { ...prev, certifications: arrayMove(prev.certifications, ids.indexOf(active.id as string), ids.indexOf(over.id as string)) }
      })
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <ArrangeAddBar
        addLabel="Add Certification"
        onAdd={addItem}
        arranging={arranging}
        setArranging={setArranging}
        canArrange={resume.certifications.length > 1}
      />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={resume.certifications.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {resume.certifications.map((cert) => (
            <SortableItem key={cert.id} id={cert.id}>
              {(dragProps) => arranging ? (
                <ArrangeRow dragProps={dragProps} label={cert.name || 'New Certification'} />
              ) : (
                <div className="rounded-lg border border-white/10 bg-[#1a1a2e] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span {...dragProps} className="drag-handle cursor-grab text-slate-500 hover:text-slate-300">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                      </span>
                      <span className="text-xs font-medium text-slate-300">{cert.name || 'New Certification'}</span>
                    </div>
                    <button onClick={() => removeItem(cert.id)} className="text-slate-500 hover:text-red-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Input label="Name" value={cert.name} onChange={(v) => setField(cert.id, 'name', v)} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Issuer" value={cert.issuer} onChange={(v) => setField(cert.id, 'issuer', v)} />
                      <Input label="Date" value={cert.date} onChange={(v) => setField(cert.id, 'date', v)} type="month" />
                    </div>
                    <Input label="URL" value={cert.url} onChange={(v) => setField(cert.id, 'url', v)} />
                  </div>
                </div>
              )}
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}

// ─── Languages ────────────────────────────────────────────────────────────────

function LanguagesSection({ resume, updateResume }: Pick<SidebarProps, 'resume' | 'updateResume'>) {
  const [arranging, setArranging] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor))
  const proficiencies = ['Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic']

  function addItem() {
    updateResume((prev) => ({ ...prev, languages: [...prev.languages, { id: uuidv4(), language: '', proficiency: 'Intermediate' }] }))
  }
  function removeItem(id: string) {
    updateResume((prev) => ({ ...prev, languages: prev.languages.filter((x) => x.id !== id) }))
  }
  function setField(id: string, key: keyof LanguageItem, value: string) {
    updateResume((prev) => ({ ...prev, languages: prev.languages.map((x) => (x.id === id ? { ...x, [key]: value } : x)) }))
  }
  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      updateResume((prev) => {
        const ids = prev.languages.map((l) => l.id)
        return { ...prev, languages: arrayMove(prev.languages, ids.indexOf(active.id as string), ids.indexOf(over.id as string)) }
      })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <ArrangeAddBar
        addLabel="Add Language"
        onAdd={addItem}
        arranging={arranging}
        setArranging={setArranging}
        canArrange={resume.languages.length > 1}
      />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={resume.languages.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {resume.languages.map((lang) => (
            <SortableItem key={lang.id} id={lang.id}>
              {(dragProps) => arranging ? (
                <ArrangeRow dragProps={dragProps} label={lang.language || 'New Language'} />
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    value={lang.language}
                    onChange={(e) => setField(lang.id, 'language', e.target.value)}
                    placeholder="Language"
                    className="flex-1 rounded-md border border-white/10 bg-[#0f0f1a] px-2.5 py-1.5 text-sm text-white placeholder-slate-600 outline-none focus:border-accent"
                  />
                  <select
                    value={lang.proficiency}
                    onChange={(e) => setField(lang.id, 'proficiency', e.target.value)}
                    className="rounded-md border border-white/10 bg-[#0f0f1a] px-2 py-1.5 text-sm text-white outline-none focus:border-accent"
                  >
                    {proficiencies.map((p) => <option key={p}>{p}</option>)}
                  </select>
                  <button onClick={() => removeItem(lang.id)} className="text-slate-500 hover:text-red-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}

// ─── Interests ────────────────────────────────────────────────────────────────

function InterestsSection({ resume, updateResume }: Pick<SidebarProps, 'resume' | 'updateResume'>) {
  const [arranging, setArranging] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor))

  function addItem() {
    updateResume((prev) => ({ ...prev, interests: [...prev.interests, { id: uuidv4(), name: '' }] }))
  }
  function removeItem(id: string) {
    updateResume((prev) => ({ ...prev, interests: prev.interests.filter((x) => x.id !== id) }))
  }
  function setName(id: string, name: string) {
    updateResume((prev) => ({ ...prev, interests: prev.interests.map((x) => (x.id === id ? { ...x, name } : x)) }))
  }
  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      updateResume((prev) => {
        const ids = prev.interests.map((i) => i.id)
        return { ...prev, interests: arrayMove(prev.interests, ids.indexOf(active.id as string), ids.indexOf(over.id as string)) }
      })
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <ArrangeAddBar
        addLabel="Add Interest"
        onAdd={addItem}
        arranging={arranging}
        setArranging={setArranging}
        canArrange={resume.interests.length > 1}
      />
      {arranging ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={resume.interests.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {resume.interests.map((int) => (
                <SortableItem key={int.id} id={int.id}>
                  {(dragProps) => <ArrangeRow dragProps={dragProps} label={int.name || 'New Interest'} />}
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="flex flex-wrap gap-2">
          {resume.interests.map((int) => (
            <div key={int.id} className="flex items-center gap-1 rounded-full border border-white/10 bg-[#1a1a2e] pl-2.5 pr-1 py-1">
              <input
                value={int.name}
                onChange={(e) => setName(int.id, e.target.value)}
                placeholder="Interest"
                className="bg-transparent text-xs text-white outline-none w-20"
              />
              <button onClick={() => removeItem(int.id)} className="text-slate-500 hover:text-red-400">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Appearance ───────────────────────────────────────────────────────────────

function AppearanceSection({ resume, updateResume }: Pick<SidebarProps, 'resume' | 'updateResume'>) {
  const t = resume.typography

  return (
    <div className="flex flex-col gap-4">
      {/* Color themes */}
      <div>
        <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-slate-400">Accent Color</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_THEMES.map((theme) => (
            <button
              key={theme.value}
              title={theme.name}
              onClick={() => updateResume((prev) => ({ ...prev, accentColor: theme.value }))}
              style={{ backgroundColor: theme.value }}
              className={`h-7 w-7 rounded-full transition hover:scale-110 ${
                resume.accentColor === theme.value ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1a2e]' : ''
              }`}
            />
          ))}
          {/* Custom color */}
          <label className="relative h-7 w-7 cursor-pointer overflow-hidden rounded-full border border-white/20 transition hover:scale-110">
            <input
              type="color"
              value={resume.accentColor}
              onChange={(e) => updateResume((prev) => ({ ...prev, accentColor: e.target.value }))}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <div className="flex h-full w-full items-center justify-center text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
            </div>
          </label>
        </div>
      </div>

      {/* Font family */}
      <div>
        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">Font Family</label>
        <select
          value={t.fontFamily}
          onChange={(e) => updateResume((prev) => ({ ...prev, typography: { ...prev.typography, fontFamily: e.target.value } }))}
          className="w-full rounded-md border border-white/10 bg-[#0f0f1a] px-2.5 py-1.5 text-sm text-white outline-none focus:border-accent"
        >
          {FONT_FAMILIES.map((f) => <option key={f}>{f}</option>)}
        </select>
      </div>

      {/* Font size */}
      <div>
        <div className="mb-1.5 flex justify-between">
          <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Font Size</label>
          <span className="text-xs text-slate-400">{t.fontSize}px</span>
        </div>
        <input
          type="range" min={8} max={13} step={0.5} value={t.fontSize}
          onChange={(e) => updateResume((prev) => ({ ...prev, typography: { ...prev.typography, fontSize: parseFloat(e.target.value) } }))}
          className="w-full"
        />
      </div>

      {/* Line height */}
      <div>
        <div className="mb-1.5 flex justify-between">
          <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Line Height</label>
          <span className="text-xs text-slate-400">{t.lineHeight.toFixed(1)}</span>
        </div>
        <input
          type="range" min={1.0} max={2.0} step={0.1} value={t.lineHeight}
          onChange={(e) => updateResume((prev) => ({ ...prev, typography: { ...prev.typography, lineHeight: parseFloat(e.target.value) } }))}
          className="w-full"
        />
      </div>

      {/* Letter spacing */}
      <div>
        <div className="mb-1.5 flex justify-between">
          <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Letter Spacing</label>
          <span className="text-xs text-slate-400">{t.letterSpacing.toFixed(2)}em</span>
        </div>
        <input
          type="range" min={-0.05} max={0.15} step={0.01} value={t.letterSpacing}
          onChange={(e) => updateResume((prev) => ({ ...prev, typography: { ...prev.typography, letterSpacing: parseFloat(e.target.value) } }))}
          className="w-full"
        />
      </div>
    </div>
  )
}

// ─── Sections Manager ─────────────────────────────────────────────────────────

function SectionsManager({ resume, updateResume }: Pick<SidebarProps, 'resume' | 'updateResume'>) {
  const sensors = useSensors(useSensor(PointerSensor))

  function toggleVisible(id: string) {
    updateResume((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)),
    }))
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      updateResume((prev) => {
        const ids = prev.sections.map((s) => s.id)
        return { ...prev, sections: arrayMove(prev.sections, ids.indexOf(active.id as string), ids.indexOf(over.id as string)) }
      })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-slate-500">Drag to reorder · Toggle visibility</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={resume.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {resume.sections.map((sec) => (
            <SortableItem key={sec.id} id={sec.id}>
              {(dragProps) => (
                <div className="flex items-center gap-2 rounded-md border border-white/10 bg-[#1a1a2e] px-3 py-2">
                  <span {...dragProps} className="drag-handle cursor-grab text-slate-500 hover:text-slate-300">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                  </span>
                  <span className="flex-1 text-sm text-slate-300">{sec.title}</span>
                  <button
                    onClick={() => toggleVisible(sec.id)}
                    className={`transition ${sec.visible ? 'text-accent' : 'text-slate-600'}`}
                  >
                    {sec.visible ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    )}
                  </button>
                </div>
              )}
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}

// ─── Templates ────────────────────────────────────────────────────────────────

function TemplatesSection({ resume, updateResume }: Pick<SidebarProps, 'resume' | 'updateResume'>) {
  const industry: Industry = resume.selectedIndustry ?? 'all'
  const filtered = TEMPLATES.filter((t) => t.industries.includes(industry))

  function setIndustry(id: Industry) {
    updateResume((prev) => ({ ...prev, selectedIndustry: id }))
  }

  function setTemplate(id: TemplateId) {
    updateResume((prev) => ({ ...prev, templateId: id }))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-accent/30 bg-accent/5 p-3 text-xs text-slate-300">
        <p className="font-semibold text-accent mb-1">Step 1, Pick your industry</p>
        <p className="text-slate-400">
          We&apos;ll show templates tuned for that field. Switching templates never overwrites your data.
        </p>
      </div>

      {/* Industry chips */}
      <div>
        <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Industry
        </label>
        <div className="flex flex-wrap gap-1.5">
          {INDUSTRIES.map((ind) => {
            const active = industry === ind.id
            return (
              <button
                key={ind.id}
                onClick={() => setIndustry(ind.id)}
                title={ind.description}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                  active
                    ? 'bg-accent text-white'
                    : 'border border-white/10 bg-[#0f0f1a] text-slate-300 hover:border-accent hover:text-white'
                }`}
              >
                {ind.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Template gallery */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Templates ({filtered.length})
          </label>
          <span className="text-[10px] text-slate-500">Step 2, Pick a layout</span>
        </div>
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-500">No templates match this industry yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filtered.map((tpl) => {
              const active = resume.templateId === tpl.id
              return (
                <button
                  key={tpl.id}
                  onClick={() => setTemplate(tpl.id)}
                  className={`group relative flex flex-col gap-2 rounded-lg border p-2 text-left transition ${
                    active
                      ? 'border-accent bg-accent/10 ring-1 ring-accent'
                      : 'border-white/10 bg-[#0f0f1a] hover:border-accent/60'
                  }`}
                >
                  <TemplateThumb id={tpl.id} accentColor={resume.accentColor} />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white">{tpl.name}</span>
                      {tpl.ats && (
                        <span
                          className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300"
                          title="Friendly to applicant tracking systems"
                        >
                          ATS
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[10px] leading-snug text-slate-400">
                      {tpl.description}
                    </p>
                  </div>
                  {active && (
                    <div className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white">
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <p className="rounded-md border border-white/5 bg-white/5 p-2 text-[10px] leading-snug text-slate-400">
        💡 Your content (experience, skills, etc.) stays the same when you switch templates, only the
        layout changes.
      </p>
    </div>
  )
}

function TemplateThumb({ id, accentColor }: { id: TemplateId; accentColor: string }) {
  const cls = 'h-20 w-full rounded border border-white/10 overflow-hidden bg-white'
  switch (id) {
    case 'modern-gradient':
      return (
        <div className={cls}>
          <div className="h-7" style={{ backgroundColor: accentColor }} />
          <div className="p-1.5 space-y-1">
            <div className="h-1 w-3/4 rounded bg-gray-300" />
            <div className="h-1 w-full rounded bg-gray-200" />
            <div className="h-1 w-5/6 rounded bg-gray-200" />
          </div>
        </div>
      )
    case 'ats-classic':
      return (
        <div className={cls + ' p-2'} style={{ fontFamily: 'Times New Roman, serif' }}>
          <div className="h-1.5 w-1/2 mx-auto rounded bg-gray-700" />
          <div className="my-1 h-px bg-gray-700" />
          <div className="space-y-1">
            <div className="h-1 w-full rounded bg-gray-300" />
            <div className="h-1 w-5/6 rounded bg-gray-300" />
            <div className="h-1 w-4/5 rounded bg-gray-300" />
          </div>
        </div>
      )
    case 'ats-minimal':
      return (
        <div className={cls + ' p-2'}>
          <div className="h-1.5 w-2/3 rounded bg-gray-800" />
          <div className="my-1 h-0.5 w-1/4 rounded" style={{ backgroundColor: accentColor }} />
          <div className="space-y-1">
            <div className="h-1 w-full rounded bg-gray-200" />
            <div className="h-1 w-5/6 rounded bg-gray-200" />
            <div className="h-1 w-3/4 rounded bg-gray-200" />
          </div>
        </div>
      )
    case 'professional':
      return (
        <div className={cls + ' p-1.5 grid grid-cols-3 gap-1'}>
          <div className="space-y-1">
            <div className="h-1 w-full rounded" style={{ backgroundColor: accentColor }} />
            <div className="h-0.5 w-full rounded bg-gray-300" />
            <div className="h-0.5 w-3/4 rounded bg-gray-300" />
            <div className="h-0.5 w-full rounded bg-gray-300" />
          </div>
          <div className="col-span-2 space-y-1">
            <div className="h-1.5 w-3/4 rounded bg-gray-700" />
            <div className="h-0.5 w-full rounded bg-gray-200" />
            <div className="h-0.5 w-5/6 rounded bg-gray-200" />
            <div className="h-0.5 w-full rounded bg-gray-200" />
          </div>
        </div>
      )
    case 'creative':
      return (
        <div className={cls + ' grid grid-cols-3'}>
          <div className="p-1 space-y-1" style={{ backgroundColor: accentColor }}>
            <div className="mx-auto h-3 w-3 rounded-full bg-white/40" />
            <div className="h-0.5 w-full rounded bg-white/60" />
            <div className="h-0.5 w-3/4 rounded bg-white/60" />
          </div>
          <div className="col-span-2 p-1.5 space-y-1">
            <div className="h-1 w-3/4 rounded" style={{ backgroundColor: accentColor }} />
            <div className="h-0.5 w-full rounded bg-gray-200" />
            <div className="h-0.5 w-5/6 rounded bg-gray-200" />
            <div className="h-0.5 w-full rounded bg-gray-200" />
          </div>
        </div>
      )
    case 'technical':
      return (
        <div className={cls + ' p-1.5'} style={{ fontFamily: 'monospace' }}>
          <div className="flex items-center gap-1">
            <span className="text-[7px] font-bold" style={{ color: accentColor }}>$</span>
            <div className="h-1 w-2/3 rounded bg-gray-800" />
          </div>
          <div className="my-1 h-px" style={{ backgroundColor: accentColor }} />
          <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
            <div className="h-0.5 w-full rounded" style={{ backgroundColor: accentColor }} />
            <div className="h-0.5 w-3/4 rounded bg-gray-300" />
            <div className="h-0.5 w-full rounded" style={{ backgroundColor: accentColor }} />
            <div className="h-0.5 w-2/3 rounded bg-gray-300" />
          </div>
        </div>
      )
    case 'executive':
      return (
        <div className={cls + ' p-1.5 text-center'} style={{ fontFamily: 'Georgia, serif' }}>
          <div className="mx-auto h-1.5 w-3/4 rounded bg-gray-800" />
          <div className="mx-auto my-1 h-px w-1/3" style={{ backgroundColor: accentColor }} />
          <div className="mx-auto h-0.5 w-1/2 rounded" style={{ backgroundColor: accentColor }} />
          <div className="mt-1 space-y-0.5">
            <div className="h-0.5 w-full rounded bg-gray-200" />
            <div className="h-0.5 w-5/6 mx-auto rounded bg-gray-200" />
          </div>
        </div>
      )
    case 'academic':
      return (
        <div className={cls + ' p-1.5'} style={{ fontFamily: 'Georgia, serif' }}>
          <div className="mx-auto h-1.5 w-2/3 rounded bg-gray-800" />
          <div className="my-1 h-0.5" style={{ backgroundColor: accentColor }} />
          <div className="space-y-0.5">
            <div className="h-0.5 w-1/3 rounded font-bold" style={{ backgroundColor: accentColor }} />
            <div className="h-0.5 w-full rounded bg-gray-200" />
            <div className="h-0.5 w-5/6 rounded bg-gray-200" />
            <div className="h-0.5 w-full rounded bg-gray-200" />
            <div className="h-0.5 w-3/4 rounded bg-gray-200" />
          </div>
        </div>
      )
    default:
      return <div className={cls} />
  }
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

const SECTION_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
  templates: {
    label: 'Templates',
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V5zM14 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM4 15a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 15a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  },
  personal: {
    label: 'Personal',
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  },
  experience: {
    label: 'Experience',
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  },
  education: {
    label: 'Education',
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg>,
  },
  skills: {
    label: 'Skills',
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  },
  projects: {
    label: 'Projects',
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>,
  },
  certifications: {
    label: 'Certifications',
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  },
  languages: {
    label: 'Languages',
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>,
  },
  interests: {
    label: 'Interests',
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  },
  appearance: {
    label: 'Appearance',
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>,
  },
  sections: {
    label: 'Sections',
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  },
}

export default function Sidebar({ resume, updateResume, activeSection, setActiveSection }: SidebarProps) {
  const sectionContent: Record<string, React.ReactNode> = {
    templates: <TemplatesSection resume={resume} updateResume={updateResume} />,
    personal: <PersonalSection resume={resume} updateResume={updateResume} />,
    experience: <ExperienceSection resume={resume} updateResume={updateResume} />,
    education: <EducationSection resume={resume} updateResume={updateResume} />,
    skills: <SkillsSection resume={resume} updateResume={updateResume} />,
    projects: <ProjectsSection resume={resume} updateResume={updateResume} />,
    certifications: <CertificationsSection resume={resume} updateResume={updateResume} />,
    languages: <LanguagesSection resume={resume} updateResume={updateResume} />,
    interests: <InterestsSection resume={resume} updateResume={updateResume} />,
    appearance: <AppearanceSection resume={resume} updateResume={updateResume} />,
    sections: <SectionsManager resume={resume} updateResume={updateResume} />,
  }

  const activeMeta = SECTION_MAP[activeSection]
  const hasPanel = Boolean(activeMeta)
  const compact = hasPanel

  return (
    <div className="flex h-full border-r border-white/10 bg-[#1a1a2e]">
      {/* Vertical rail */}
      <nav
        aria-label="Sections"
        className={`flex shrink-0 flex-col gap-1.5 overflow-y-auto border-r border-white/10 bg-[#0f0f1a] panel-scroll transition-all duration-300 ${
          compact ? 'w-[100px] px-2 py-3' : 'w-[200px] px-3 py-4'
        }`}
      >
        {Object.entries(SECTION_MAP).map(([key, { label, icon }]) => {
          const active = activeSection === key
          return (
            <button
              key={key}
              onClick={() => setActiveSection(active ? '' : key)}
              title={label}
              aria-current={active ? 'page' : undefined}
              className={`relative flex rounded-lg font-medium transition ${
                compact
                  ? 'flex-col items-center gap-1 px-2 py-2.5 text-[11px] leading-tight'
                  : 'flex-row items-center gap-3 px-3 py-2.5 text-sm'
              } ${
                active
                  ? 'bg-accent/15 text-accent'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-accent"
                />
              )}
              <span className="shrink-0">{icon}</span>
              <span
                className={
                  compact
                    ? 'text-center break-words leading-tight'
                    : 'flex-1 text-left'
                }
              >
                {label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Content panel, only when a section is selected */}
      {hasPanel && (
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-3">
            <div className="flex items-center gap-2.5">
              <span className="text-accent">{activeMeta!.icon}</span>
              <span className="text-base font-semibold text-white">{activeMeta!.label}</span>
            </div>
            <button
              onClick={() => setActiveSection('')}
              title="Close panel"
              className="rounded-md p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 panel-scroll">
            {sectionContent[activeSection]}
          </div>
        </div>
      )}
    </div>
  )
}
