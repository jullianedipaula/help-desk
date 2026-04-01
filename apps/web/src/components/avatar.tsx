import Image from 'next/image'
import type { HTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'

type AvatarProps = HTMLAttributes<HTMLDivElement> & {
  src?: string
  name?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
}

const sizePx = { sm: 24, md: 32, lg: 40 }

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function Avatar({
  src,
  name,
  size = 'md',
  className,
  ...props
}: AvatarProps) {
  const px = sizePx[size]
  return (
    <div
      className={twMerge(
        'relative inline-flex shrink-0 items-center justify-center rounded-full bg-[#2E3DA3] font-medium text-white overflow-hidden',
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={name ?? ''}
          width={px}
          height={px}
          className="h-full w-full object-cover"
        />
      ) : name ? (
        getInitials(name)
      ) : null}
    </div>
  )
}
