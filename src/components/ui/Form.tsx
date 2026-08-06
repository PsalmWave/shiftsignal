import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Icon } from './Icon'
import { IconButton } from './Button'

interface FieldChromeProps {
  label: string
  help?: string
  error?: string
  required?: boolean
  hideLabel?: boolean
  className?: string
}

interface ChromeRenderProps extends FieldChromeProps {
  controlId: string
  children: ReactNode
}

function FieldChrome({
  label,
  help,
  error,
  required,
  hideLabel,
  className = '',
  controlId,
  children,
}: ChromeRenderProps) {
  return (
    <div className={`field ${className}`.trim()}>
      <label className={hideLabel ? 'visually-hidden' : 'field-label'} htmlFor={controlId}>
        {label}
        {required ? (
          <span className="field-required" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {help && !error ? (
        <p className="field-help" id={`${controlId}-help`}>
          {help}
        </p>
      ) : null}
      {error ? (
        <p className="field-error" id={`${controlId}-error`}>
          <Icon name="alert" size={13} />
          {error}
        </p>
      ) : null}
    </div>
  )
}

function describedByFor(id: string, help?: string, error?: string): string | undefined {
  const ids = [help && !error ? `${id}-help` : '', error ? `${id}-error` : ''].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
}

/* ------------------------------------------------------------------ */

export interface TextInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>,
    FieldChromeProps {}

export function TextInput({
  label,
  help,
  error,
  required,
  hideLabel,
  className,
  ...rest
}: TextInputProps) {
  const id = useId()
  const describedBy = describedByFor(id, help, error)

  return (
    <FieldChrome
      label={label}
      help={help}
      error={error}
      required={required}
      hideLabel={hideLabel}
      className={className}
      controlId={id}
    >
      <input
        id={id}
        className="input"
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        {...rest}
      />
    </FieldChrome>
  )
}

/* ------------------------------------------------------------------ */

export interface TextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'>,
    FieldChromeProps {}

export function TextArea({
  label,
  help,
  error,
  required,
  hideLabel,
  className,
  ...rest
}: TextAreaProps) {
  const id = useId()
  const describedBy = describedByFor(id, help, error)

  return (
    <FieldChrome
      label={label}
      help={help}
      error={error}
      required={required}
      hideLabel={hideLabel}
      className={className}
      controlId={id}
    >
      <textarea
        id={id}
        className="textarea"
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        {...rest}
      />
    </FieldChrome>
  )
}

/* ------------------------------------------------------------------ */

export interface SelectOption {
  value: string
  label: string
}

export interface SelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'children'>,
    FieldChromeProps {
  options: SelectOption[]
}

export function SelectField({
  label,
  help,
  error,
  required,
  hideLabel,
  className,
  options,
  ...rest
}: SelectFieldProps) {
  const id = useId()
  const describedBy = describedByFor(id, help, error)

  return (
    <FieldChrome
      label={label}
      help={help}
      error={error}
      required={required}
      hideLabel={hideLabel}
      className={className}
      controlId={id}
    >
      <select
        id={id}
        className="select"
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldChrome>
  )
}

/* ------------------------------------------------------------------ */

export interface SearchInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({
  label,
  value,
  onChange,
  placeholder = 'Search',
  className = '',
}: SearchInputProps) {
  const id = useId()

  return (
    <div className={`field ${className}`.trim()}>
      <label className="visually-hidden" htmlFor={id}>
        {label}
      </label>
      <div className="search-field">
        <Icon name="search" size={16} />
        <input
          id={id}
          type="search"
          className="input"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
        {value ? (
          <IconButton
            className="search-clear"
            size="sm"
            label="Clear search"
            icon="close"
            onClick={() => onChange('')}
          />
        ) : null}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  label: ReactNode
  description?: ReactNode
}

export function Checkbox({ label, description, className = '', ...rest }: CheckboxProps) {
  const id = useId()

  return (
    <div className={`checkbox-row ${className}`.trim()}>
      <input id={id} type="checkbox" {...rest} />
      <div>
        <label htmlFor={id} className="checklist-step-label">
          {label}
        </label>
        {description ? <p className="field-help">{description}</p> : null}
      </div>
    </div>
  )
}
