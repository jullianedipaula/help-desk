import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'
import { tv } from 'tailwind-variants'

const navItem = tv({
  base: 'flex items-center gap-3 rounded-[5px] px-3 h-11 w-full text-sm font-medium transition-colors',
  variants: {
    active: {
      true: 'bg-[#2E3DA3] text-white',
      false: 'bg-[#151619] text-[#9CA3AF] hover:bg-[#1E2024] hover:text-white',
    },
  },
  defaultVariants: {
    active: false,
  },
})

type SidebarNavItemProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  icon?: ReactNode
  label: string
  active?: boolean
}

export function SidebarNavItem({
  icon,
  label,
  active = false,
  className,
  ...props
}: SidebarNavItemProps) {
  return (
    <a className={twMerge(navItem({ active }), className)} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
    </a>
  )
}
