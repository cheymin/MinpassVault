'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faLock,
  faLockOpen,
  faKey,
  faFileLines,
  faCreditCard,
  faUser,
  faSearch,
  faPlus,
  faGear,
  faStar,
  faFolder,
  faDownload,
  faUpload,
  faTrash,
  faCopy,
  faEye,
  faEyeSlash,
  faXmark,
  faArrowLeft,
  faArrowRight,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faChevronDown,
  faShield,
  faDatabase,
  faEnvelope,
  faBars,
  faHouse,
  faGlobe,
  faIdCard,
  faPhone,
  faLocationDot,
  faRightFromBracket,
  faRightToBracket,
  faFilter,
  faSpinner,
  faInbox,
  faClockRotateLeft,
  faChartPie,
  faPenToSquare,
  faInfo,
  faCircleInfo,
  faCircleExclamation,
  faTriangleExclamation,
  faCube,
  faCloudArrowUp,
  faCloudArrowDown,
  faCheck,
  faCircleCheck,
  faCircleXmark,
  faUpRightFromSquare,
  faMoon,
  faSun,
  faPalette,
  faShieldHalved,
  faUnlock,
  faCalendar,
  faTag,
  faHashtag,
  faFile,
  faBookmark,
  faEllipsisVertical,
  faRotate,
  faFloppyDisk,
  faBolt,
  faClock,
  faChartLine,
  faAward,
  faBullseye,
  faServer,
  faWifi
} from '@fortawesome/free-solid-svg-icons'

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
  | 'chevron-up'
  | 'chevron-down'
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

interface IconProps {
  name: IconName
  className?: string
}

const iconMap: Record<IconName, any> = {
  'lock': faLock,
  'lock-open': faLockOpen,
  'key': faKey,
  'file-lines': faFileLines,
  'credit-card': faCreditCard,
  'user': faUser,
  'search': faSearch,
  'plus': faPlus,
  'cog': faGear,
  'star': faStar,
  'folder': faFolder,
  'download': faDownload,
  'upload': faUpload,
  'trash': faTrash,
  'copy': faCopy,
  'eye': faEye,
  'eye-slash': faEyeSlash,
  'times': faXmark,
  'arrow-left': faArrowLeft,
  'arrow-right': faArrowRight,
  'chevron-left': faChevronLeft,
  'chevron-right': faChevronRight,
  'chevron-up': faChevronUp,
  'chevron-down': faChevronDown,
  'shield': faShield,
  'shield-alt': faShieldHalved,
  'database': faDatabase,
  'envelope': faEnvelope,
  'bars': faBars,
  'home': faHouse,
  'globe': faGlobe,
  'id-card': faIdCard,
  'phone': faPhone,
  'map-marker-alt': faLocationDot,
  'sign-out-alt': faRightFromBracket,
  'sign-in-alt': faRightToBracket,
  'filter': faFilter,
  'spinner': faSpinner,
  'inbox': faInbox,
  'history': faClockRotateLeft,
  'chart-pie': faChartPie,
  'edit': faPenToSquare,
  'info': faInfo,
  'info-circle': faCircleInfo,
  'exclamation-circle': faCircleExclamation,
  'exclamation-triangle': faTriangleExclamation,
  'cube': faCube,
  'cloud-upload-alt': faCloudArrowUp,
  'cloud-download-alt': faCloudArrowDown,
  'check': faCheck,
  'check-circle': faCircleCheck,
  'times-circle': faCircleXmark,
  'external-link-alt': faUpRightFromSquare,
  'moon': faMoon,
  'sun': faSun,
  'palette': faPalette,
  'shield-check': faShieldHalved,
  'unlock': faUnlock,
  'calendar': faCalendar,
  'tag': faTag,
  'hash': faHashtag,
  'file': faFile,
  'bookmark': faBookmark,
  'more-vertical': faEllipsisVertical,
  'refresh': faRotate,
  'save': faFloppyDisk,
  'zap': faBolt,
  'clock': faClock,
  'trending-up': faChartLine,
  'award': faAward,
  'target': faBullseye,
  'server': faServer,
  'wifi': faWifi,
}

export function Icon({ name, className = '' }: IconProps) {
  const icon = iconMap[name]
  if (!icon) {
    console.warn(`Icon "${name}" not found`)
    return null
  }
  return <FontAwesomeIcon icon={icon} className={className} />
}
