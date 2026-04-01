import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode
  label: string
}

export function IconButton({
  icon,
  label,
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={twMerge(
        'inline-flex h-7 w-7 items-center justify-center rounded-[5px] bg-[#E3E5E8] text-[#535964] transition-opacity hover:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  )
}
