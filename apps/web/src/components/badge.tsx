import type { HTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'
import { tv, type VariantProps } from 'tailwind-variants'

const badge = tv({
  base: 'inline-flex items-center justify-center rounded-full px-3 h-7 text-xs font-medium text-white',
  variants: {
    status: {
      open: 'bg-[#CC3D6A]',
      'in-progress': 'bg-[#355EC5]',
      closed: 'bg-[#508B26]',
    },
  },
  defaultVariants: {
    status: 'open',
  },
})

const statusLabels: Record<
  NonNullable<VariantProps<typeof badge>['status']>,
  string
> = {
  open: 'Aberto',
  'in-progress': 'Em andamento',
  closed: 'Fechado',
}

type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badge> & {
    label?: string
  }

export function Badge({ status, label, className, ...props }: BadgeProps) {
  return (
    <span className={twMerge(badge({ status }), className)} {...props}>
      {label ?? (status ? statusLabels[status] : null)}
    </span>
  )
}
