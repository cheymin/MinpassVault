'use client'

import {
  Lock,
  LockOpen,
  Key,
  FileText,
  CreditCard,
  User,
  Search,
  Plus,
  Settings,
  Star,
  Folder,
  Download,
  Upload,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  X,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Shield,
  Database,
  Mail,
  Menu,
  Home,
  Globe,
  IdCard,
  Phone,
  MapPin,
  LogOut,
  Filter,
  Loader2,
  Inbox,
  History,
  PieChart,
  Edit2,
  Info,
  AlertCircle,
  AlertTriangle,
  Box,
  CloudUpload,
  CloudDownload,
  Check,
  CheckCircle,
  XCircle,
  ExternalLink,
  Moon,
  Sun,
  Palette,
  ShieldCheck,
  LogIn,
  Unlock,
  Calendar,
  Tag,
  Hash,
  File,
  Bookmark,
  MoreVertical,
  RefreshCw,
  Save,
  Zap,
  Clock,
  TrendingUp,
  Award,
  Target,
  Server,
  Wifi,
  WifiOff
} from 'lucide-react'

export type IconName = 
  | 'lock' 
  | 'lock-open'
  | 'key' 
  | 'file-lines' 
  | 'credit-card' 
  | 'user' 
  | 'search' 
  | 'plus' 
  | 'cog' 
  | 'star' 
  | 'folder' 
  | 'download' 
  | 'upload' 
  | 'trash' 
  | 'copy' 
  | 'eye' 
  | 'eye-slash' 
  | 'times' 
  | 'arrow-left' 
  | 'arrow-right'
  | 'chevron-left'
  | 'chevron-right'
  | 'shield' 
  | 'shield-alt'
  | 'database' 
  | 'envelope' 
  | 'bars'
  | 'home'
  | 'globe'
  | 'id-card'
  | 'phone'
  | 'map-marker-alt'
  | 'sign-out-alt'
  | 'sign-in-alt'
  | 'filter'
  | 'spinner'
  | 'inbox'
  | 'history'
  | 'chart-pie'
  | 'edit'
  | 'info'
  | 'info-circle'
  | 'exclamation-circle'
  | 'exclamation-triangle'
  | 'cube'
  | 'cloud-upload-alt'
  | 'cloud-download-alt'
  | 'check'
  | 'check-circle'
  | 'times-circle'
  | 'external-link-alt'
  | 'moon'
  | 'sun'
  | 'palette'
  | 'shield-check'
  | 'unlock'
  | 'calendar'
  | 'tag'
  | 'hash'
  | 'file'
  | 'bookmark'
  | 'more-vertical'
  | 'refresh'
  | 'save'
  | 'zap'
  | 'clock'
  | 'trending-up'
  | 'award'
  | 'target'
  | 'server'
  | 'wifi'
  | 'wifi-off'

interface IconProps {
  name: IconName
  className?: string
}

const iconMap: Record<IconName, any> = {
  'lock': Lock,
  'lock-open': LockOpen,
  'key': Key,
  'file-lines': FileText,
  'credit-card': CreditCard,
  'user': User,
  'search': Search,
  'plus': Plus,
  'cog': Settings,
  'star': Star,
  'folder': Folder,
  'download': Download,
  'upload': Upload,
  'trash': Trash2,
  'copy': Copy,
  'eye': Eye,
  'eye-slash': EyeOff,
  'times': X,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'shield': Shield,
  'shield-alt': ShieldCheck,
  'database': Database,
  'envelope': Mail,
  'bars': Menu,
  'home': Home,
  'globe': Globe,
  'id-card': IdCard,
  'phone': Phone,
  'map-marker-alt': MapPin,
  'sign-out-alt': LogOut,
  'sign-in-alt': LogIn,
  'filter': Filter,
  'spinner': Loader2,
  'inbox': Inbox,
  'history': History,
  'chart-pie': PieChart,
  'edit': Edit2,
  'info': Info,
  'info-circle': Info,
  'exclamation-circle': AlertCircle,
  'exclamation-triangle': AlertTriangle,
  'cube': Box,
  'cloud-upload-alt': CloudUpload,
  'cloud-download-alt': CloudDownload,
  'check': Check,
  'check-circle': CheckCircle,
  'times-circle': XCircle,
  'external-link-alt': ExternalLink,
  'moon': Moon,
  'sun': Sun,
  'palette': Palette,
  'shield-check': ShieldCheck,
  'unlock': Unlock,
  'calendar': Calendar,
  'tag': Tag,
  'hash': Hash,
  'file': File,
  'bookmark': Bookmark,
  'more-vertical': MoreVertical,
  'refresh': RefreshCw,
  'save': Save,
  'zap': Zap,
  'clock': Clock,
  'trending-up': TrendingUp,
  'award': Award,
  'target': Target,
  'server': Server,
  'wifi': Wifi,
  'wifi-off': WifiOff,
}

export function Icon({ name, className = '' }: IconProps) {
  const IconComponent = iconMap[name]
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`)
    return null
  }
  return <IconComponent className={className} />
}
