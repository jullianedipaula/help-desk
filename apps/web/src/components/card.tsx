import type { HTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'

type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={twMerge(
        'rounded-[9.5px] border border-[#E3E5E8] bg-white',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
