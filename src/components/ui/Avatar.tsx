import type { TeamMember } from '@/types/domain'

export interface AvatarProps {
  member: TeamMember | null
  size?: 'sm' | 'md' | 'lg'
  /** When false the avatar is decorative and the name is rendered nearby. */
  showTitle?: boolean
}

export function Avatar({ member, size = 'md', showTitle = true }: AvatarProps) {
  const sizeClass = size === 'md' ? '' : `avatar-${size}`

  if (!member) {
    return (
      <span
        className={`avatar avatar-empty ${sizeClass}`.trim()}
        title={showTitle ? 'Unassigned' : undefined}
        aria-hidden={showTitle ? undefined : true}
      >
        {showTitle ? <span className="visually-hidden">Unassigned</span> : null}
        <span aria-hidden="true">–</span>
      </span>
    )
  }

  return (
    <span
      className={`avatar avatar-a${member.accent} ${sizeClass}`.trim()}
      title={showTitle ? `${member.name} · ${member.role}` : undefined}
      aria-hidden={showTitle ? undefined : true}
    >
      {showTitle ? <span className="visually-hidden">{member.name}</span> : null}
      <span aria-hidden="true">{member.initials}</span>
    </span>
  )
}

export function AvatarStack({ members, max = 5 }: { members: TeamMember[]; max?: number }) {
  const shown = members.slice(0, max)
  const overflow = members.length - shown.length

  return (
    <span className="avatar-stack">
      {shown.map((member) => (
        <Avatar key={member.id} member={member} size="sm" />
      ))}
      {overflow > 0 ? (
        <span className="avatar avatar-sm avatar-empty" title={`${overflow} more`}>
          <span aria-hidden="true">+{overflow}</span>
          <span className="visually-hidden">
            {overflow} more team {overflow === 1 ? 'member' : 'members'}
          </span>
        </span>
      ) : null}
    </span>
  )
}
