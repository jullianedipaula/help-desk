import type { ButtonHTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'
import { tv, type VariantProps } from 'tailwind-variants'

const button = tv({
  base: 'inline-flex items-center justify-center gap-2 rounded-[5px] font-medium transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  variants: {
    variant: {
      primary: 'bg-[#1E2024] text-white hover:opacity-90',
      blue: 'bg-[#2E3DA3] text-white hover:opacity-90',
      secondary: 'bg-[#151619] text-white hover:opacity-90',
      ghost: 'bg-[#E3E5E8] text-[#1E2024] hover:opacity-80',
    },
    size: {
      md: 'h-10 px-4 text-sm',
      lg: 'h-11 px-5 text-sm',
    },
    fullWidth: {
      true: 'w-full',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
})

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button>

export function Button({
  variant,
  size,
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={twMerge(button({ variant, size, fullWidth }), className)}
      {...props}
    />
  )
}
