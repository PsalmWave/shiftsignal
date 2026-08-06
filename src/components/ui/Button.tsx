import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: IconName
  iconAfter?: IconName
  block?: boolean
  children?: ReactNode
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconAfter,
  block = false,
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size !== 'md' ? `btn-${size}` : '',
    block ? 'btn-block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} {...rest}>
      {icon ? <Icon name={icon} size={size === 'sm' ? 14 : 16} /> : null}
      {children}
      {iconAfter ? <Icon name={iconAfter} size={size === 'sm' ? 14 : 16} /> : null}
    </button>
  )
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: icon-only controls must expose an accessible name. */
  label: string
  icon: IconName
  variant?: Variant
  size?: Size
}

export function IconButton({
  label,
  icon,
  variant = 'ghost',
  size = 'md',
  className = '',
  type = 'button',
  ...rest
}: IconButtonProps) {
  const classes = [
    'btn',
    'btn-icon',
    `btn-${variant}`,
    size !== 'md' ? `btn-${size}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={size === 'sm' ? 15 : 17} />
    </button>
  )
}
