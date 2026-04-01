import type { InputHTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium uppercase tracking-wide text-[#535964]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={twMerge(
          'h-10 w-full rounded-[5px] border border-[#E3E5E8] bg-white px-3 text-sm text-[#1E2024] placeholder:text-[#9CA3AF] outline-none transition-colors focus:border-[#2E3DA3] disabled:opacity-50',
          error && 'border-[#CC3D6A] focus:border-[#CC3D6A]',
          className,
        )}
        {...props}
      />
      {error && <span className="text-xs text-[#CC3D6A]">{error}</span>}
    </div>
  )
}
