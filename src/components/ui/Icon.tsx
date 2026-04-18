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
  faCog, 
  faStar, 
  faFolder, 
  faDownload, 
  faUpload, 
  faTrash, 
  faCopy, 
  faEye, 
  faEyeSlash, 
  faTimes, 
  faArrowLeft, 
  faArrowRight,
  faChevronLeft,
  faChevronRight,
  faShield, 
  faShieldAlt,
  faDatabase, 
  faEnvelope, 
  faBars,
  faHome,
  faGlobe,
  faIdCard,
  faPhone,
  faMapMarkerAlt,
  faSignOutAlt,
  faSignInAlt,
  faFilter,
  faSpinner,
  faInbox,
  faHistory,
  faChartPie,
  faEdit,
  faInfo,
  faInfoCircle,
  faExclamationCircle,
  faExclamationTriangle,
  faCube,
  faCloudUploadAlt,
  faCloudDownloadAlt,
  faCheck,
  faCheckCircle,
  faTimesCircle,
  faExternalLinkAlt
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
  'cog': faCog,
  'star': faStar,
  'folder': faFolder,
  'download': faDownload,
  'upload': faUpload,
  'trash': faTrash,
  'copy': faCopy,
  'eye': faEye,
  'eye-slash': faEyeSlash,
  'times': faTimes,
  'arrow-left': faArrowLeft,
  'arrow-right': faArrowRight,
  'chevron-left': faChevronLeft,
  'chevron-right': faChevronRight,
  'shield': faShield,
  'shield-alt': faShieldAlt,
  'database': faDatabase,
  'envelope': faEnvelope,
  'bars': faBars,
  'home': faHome,
  'globe': faGlobe,
  'id-card': faIdCard,
  'phone': faPhone,
  'map-marker-alt': faMapMarkerAlt,
  'sign-out-alt': faSignOutAlt,
  'sign-in-alt': faSignInAlt,
  'filter': faFilter,
  'spinner': faSpinner,
  'inbox': faInbox,
  'history': faHistory,
  'chart-pie': faChartPie,
  'edit': faEdit,
  'info': faInfo,
  'info-circle': faInfoCircle,
  'exclamation-circle': faExclamationCircle,
  'exclamation-triangle': faExclamationTriangle,
  'cube': faCube,
  'cloud-upload-alt': faCloudUploadAlt,
  'cloud-download-alt': faCloudDownloadAlt,
  'check': faCheck,
  'check-circle': faCheckCircle,
  'times-circle': faTimesCircle,
  'external-link-alt': faExternalLinkAlt,
}

export function Icon({ name, className = '' }: IconProps) {
  return (
    <FontAwesomeIcon 
      icon={iconMap[name]} 
      className={className}
      fixedWidth
    />
  )
}
