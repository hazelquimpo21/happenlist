# Component Library

## Overview

This document specifies the reusable components for Happenlist. Each component should be self-contained, typed, and follow the patterns established in the FILE_STRUCTURE.md.

---

## UI Primitives

Located in `/components/ui/`

### Button

```typescript
// components/ui/button.tsx

import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
        secondary: 'bg-surface border border-border text-text-primary hover:bg-background focus:ring-primary',
        ghost: 'bg-transparent text-text-secondary hover:bg-background hover:text-text-primary',
        danger: 'bg-error text-white hover:bg-error/90 focus:ring-error',
        link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
        icon: 'p-2',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, isLoading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
export type { ButtonProps }
```

---

### Input

```typescript
// components/ui/input.tsx

import { forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'w-full px-4 py-2',
          'bg-surface border border-border rounded-lg',
          'text-text-primary placeholder:text-text-tertiary',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          'disabled:bg-background disabled:text-text-tertiary disabled:cursor-not-allowed',
          'transition-colors duration-200',
          error && 'border-error focus:ring-error/20 focus:border-error',
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
export type { InputProps }
```

---

### Select

```typescript
// components/ui/select.tsx

'use client'

import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const Select = SelectPrimitive.Root
const SelectValue = SelectPrimitive.Value

const SelectTrigger = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex items-center justify-between w-full px-4 py-2',
      'bg-surface border border-border rounded-lg',
      'text-text-primary',
      'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="w-4 h-4 text-text-tertiary" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))

const SelectContent = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      className={cn(
        'relative z-50 min-w-[8rem] overflow-hidden',
        'bg-surface border border-border rounded-lg shadow-lg',
        'animate-in fade-in-0 zoom-in-95',
        className
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))

const SelectItem = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex items-center px-3 py-2 rounded-md cursor-pointer',
      'text-text-primary text-sm',
      'focus:bg-background focus:outline-none',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator className="absolute right-2">
      <Check className="w-4 h-4" />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
))

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue }
```

---

### Badge

```typescript
// components/ui/badge.tsx

import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-background text-text-secondary',
        primary: 'bg-primary-light text-primary-dark',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        error: 'bg-error/10 text-error',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
export type { BadgeProps }
```

---

### Card

```typescript
// components/ui/card.tsx

import { cn } from '@/lib/utils/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

function Card({ className, hover, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface rounded-xl shadow-sm border border-border overflow-hidden',
        hover && 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 md:p-6', className)} {...props} />
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 md:p-6 pt-0', className)} {...props} />
}

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('p-4 md:p-6 pt-0 flex items-center gap-2', className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardContent, CardFooter }
```

---

### Skeleton

```typescript
// components/ui/skeleton.tsx

import { cn } from '@/lib/utils/cn'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-gradient-to-r from-background via-surface to-background',
        'bg-[length:200%_100%] animate-shimmer rounded-md',
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }

// Add to globals.css:
// @keyframes shimmer {
//   0% { background-position: -200% 0; }
//   100% { background-position: 200% 0; }
// }
// .animate-shimmer { animation: shimmer 1.5s infinite; }
```

---

## Domain Components

### Event Card

```typescript
// components/events/event-card.tsx

import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { CategoryBadge } from '@/components/categories/category-badge'
import { formatEventDate, formatEventTime } from '@/lib/utils/dates'
import type { EventWithRelations } from '@/types'

interface EventCardProps {
  event: EventWithRelations
  variant?: 'default' | 'featured' | 'compact'
}

export function EventCard({ event, variant = 'default' }: EventCardProps) {
  const formattedDate = formatEventDate(event.start_at)
  const formattedTime = formatEventTime(event.start_at)
  
  if (variant === 'compact') {
    return <EventCardCompact event={event} />
  }
  
  return (
    <Link href={`/events/${event.slug}`}>
      <Card hover className="h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-background">
          {event.image_url ? (
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-12 h-12 text-text-tertiary" />
            </div>
          )}
          
          {event.category && (
            <div className="absolute bottom-3 left-3">
              <CategoryBadge category={event.category} />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <p className="text-caption font-semibold text-primary uppercase tracking-wide">
            {formattedDate}
          </p>
          
          <h3 className="text-heading-sm mt-1 line-clamp-2">
            {event.title}
          </h3>
          
          {event.venue && (
            <p className="text-body-sm text-text-secondary mt-2 flex items-center gap-1">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">{event.venue.name}</span>
            </p>
          )}
          
          <div className="mt-auto pt-3 flex items-center justify-between text-body-sm text-text-secondary">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formattedTime}
            </span>
            
            {event.is_free ? (
              <span className="text-primary font-medium">Free</span>
            ) : event.price_min ? (
              <span>${event.price_min}{event.price_max && event.price_max !== event.price_min ? `–$${event.price_max}` : ''}</span>
            ) : null}
          </div>
        </div>
      </Card>
    </Link>
  )
}

// Compact variant for list views
function EventCardCompact({ event }: { event: EventWithRelations }) {
  const formattedDate = formatEventDate(event.start_at, 'short')
  const formattedTime = formatEventTime(event.start_at)
  
  return (
    <Link href={`/events/${event.slug}`}>
      <div className="flex gap-4 p-4 rounded-lg hover:bg-background transition-colors">
        {/* Image */}
        <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-background">
          {event.image_url ? (
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-text-tertiary" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-caption font-semibold text-primary">
            {formattedDate}
          </p>
          <h3 className="text-body-md font-medium truncate">{event.title}</h3>
          <p className="text-body-sm text-text-secondary truncate">
            {event.venue?.name} • {formattedTime}
          </p>
        </div>
        
        {/* Category */}
        {event.category && (
          <CategoryBadge category={event.category} size="sm" />
        )}
      </div>
    </Link>
  )
}
```

---

### Event Card Skeleton

```typescript
// components/events/event-card-skeleton.tsx

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function EventCardSkeleton() {
  return (
    <Card className="h-full">
      <Skeleton className="aspect-[4/3]" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-32" />
      </div>
    </Card>
  )
}

export function EventListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  )
}
```

---

### Category Badge

```typescript
// components/categories/category-badge.tsx

import { cn } from '@/lib/utils/cn'
import type { Category } from '@/types'

interface CategoryBadgeProps {
  category: Category
  size?: 'sm' | 'md'
  className?: string
}

export function CategoryBadge({ category, size = 'md', className }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        className
      )}
      style={{
        backgroundColor: category.color ? `${category.color}20` : undefined,
        color: category.color || undefined,
      }}
    >
      {category.icon && <span>{category.icon}</span>}
      {category.name}
    </span>
  )
}
```

---

### Event Filters

```typescript
// components/events/event-filters.tsx

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Category, Tag } from '@/types'

interface EventFiltersProps {
  categories: Category[]
  tags: Tag[]
}

export function EventFilters({ categories, tags }: EventFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const currentCategory = searchParams.get('category')
  const currentTags = searchParams.getAll('tags')
  const currentDateFilter = searchParams.get('date')
  const isFree = searchParams.get('free') === 'true'
  
  const updateFilters = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams)
    
    if (value === null) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    
    // Reset to page 1 when filters change
    params.delete('page')
    
    startTransition(() => {
      router.push(`/events?${params.toString()}`)
    })
  }
  
  const clearFilters = () => {
    startTransition(() => {
      router.push('/events')
    })
  }
  
  const hasFilters = currentCategory || currentTags.length > 0 || currentDateFilter || isFree
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-heading-md flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filters
        </h2>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        )}
      </div>
      
      {/* Category */}
      <div>
        <label className="label">Category</label>
        <Select
          value={currentCategory || ''}
          onValueChange={(value) => updateFilters('category', value || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Date */}
      <div>
        <label className="label">Date</label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'today', label: 'Today' },
            { value: 'tomorrow', label: 'Tomorrow' },
            { value: 'this-weekend', label: 'This Weekend' },
            { value: 'this-week', label: 'This Week' },
            { value: 'this-month', label: 'This Month' },
          ].map((option) => (
            <Button
              key={option.value}
              variant={currentDateFilter === option.value ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => updateFilters('date', currentDateFilter === option.value ? null : option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Price */}
      <div>
        <label className="label">Price</label>
        <Button
          variant={isFree ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => updateFilters('free', isFree ? null : 'true')}
        >
          Free only
        </Button>
      </div>
      
      {/* Tags */}
      <div>
        <label className="label">Tags</label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const isSelected = currentTags.includes(tag.slug)
            return (
              <Button
                key={tag.id}
                variant={isSelected ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  const params = new URLSearchParams(searchParams)
                  const tags = params.getAll('tags')
                  
                  if (isSelected) {
                    params.delete('tags')
                    tags.filter(t => t !== tag.slug).forEach(t => params.append('tags', t))
                  } else {
                    params.append('tags', tag.slug)
                  }
                  
                  params.delete('page')
                  startTransition(() => {
                    router.push(`/events?${params.toString()}`)
                  })
                }}
              >
                {tag.name}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

---

### Empty State

```typescript
// components/shared/empty-state.tsx

import { cn } from '@/lib/utils/cn'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {icon && (
        <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-heading-md text-text-primary">{title}</h3>
      {description && (
        <p className="text-body-md text-text-secondary mt-2 max-w-md">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
```

---

### Pagination

```typescript
// components/shared/pagination.tsx

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath?: string
}

export function Pagination({ currentPage, totalPages, basePath = '' }: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  if (totalPages <= 1) return null
  
  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(page))
    router.push(`${basePath}?${params.toString()}`)
  }
  
  const pages = generatePageNumbers(currentPage, totalPages)
  
  return (
    <nav className="flex items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      
      {pages.map((page, i) => (
        page === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-text-tertiary">...</span>
        ) : (
          <Button
            key={page}
            variant={page === currentPage ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => goToPage(page as number)}
          >
            {page}
          </Button>
        )
      ))}
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </nav>
  )
}

function generatePageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  
  if (current <= 3) {
    return [1, 2, 3, 4, 5, '...', total]
  }
  
  if (current >= total - 2) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  }
  
  return [1, '...', current - 1, current, current + 1, '...', total]
}
```

---

## Form Components

### Form Field

```typescript
// components/forms/form-field.tsx

import { cn } from '@/lib/utils/cn'

interface FormFieldProps {
  label: string
  htmlFor?: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="label">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-caption text-text-tertiary">{hint}</p>
      )}
      {error && (
        <p className="text-caption text-error">{error}</p>
      )}
    </div>
  )
}
```

---

### Image Upload

```typescript
// components/forms/image-upload.tsx

'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface ImageUploadProps {
  value?: string
  onChange: (url: string | undefined) => void
  onUpload: (file: File) => Promise<string>
  accept?: string
  maxSize?: number // in bytes
  aspectRatio?: string // e.g., '4/3', '1/1'
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  accept = 'image/jpeg,image/png,image/webp',
  maxSize = 2 * 1024 * 1024,
  aspectRatio = '4/3',
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string>()
  
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setError(undefined)
    
    // Validate size
    if (file.size > maxSize) {
      setError(`File too large. Max size: ${maxSize / 1024 / 1024}MB`)
      return
    }
    
    // Validate type
    if (!accept.split(',').some(type => file.type === type.trim())) {
      setError('Invalid file type')
      return
    }
    
    setIsUploading(true)
    try {
      const url = await onUpload(file)
      onChange(url)
    } catch (err) {
      setError('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }, [accept, maxSize, onChange, onUpload])
  
  const handleRemove = () => {
    onChange(undefined)
  }
  
  return (
    <div className={className}>
      <div
        className={cn(
          'relative border-2 border-dashed border-border rounded-lg overflow-hidden',
          'transition-colors hover:border-primary/50',
          error && 'border-error'
        )}
        style={{ aspectRatio }}
      >
        {value ? (
          <>
            <Image src={value} alt="Uploaded" fill className="object-cover" />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemove}
            >
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-4">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-text-tertiary animate-spin" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-text-tertiary mb-2" />
                <span className="text-body-sm text-text-secondary">
                  Click to upload
                </span>
                <span className="text-caption text-text-tertiary mt-1">
                  JPG, PNG, WebP up to {maxSize / 1024 / 1024}MB
                </span>
              </>
            )}
            <input
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="sr-only"
              disabled={isUploading}
            />
          </label>
        )}
      </div>
      {error && <p className="text-caption text-error mt-1">{error}</p>}
    </div>
  )
}
```
