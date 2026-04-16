'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faLock, 
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
  faFilter,
  faSpinner,
  faInbox,
  faHistory,
  faChartPie,
  faEdit,
  faInfo,
  faCube
} from '@fortawesome/free-solid-svg-icons'

export type IconName = 
  | 'lock' 
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
  | 'filter'
  | 'spinner'
  | 'inbox'
  | 'history'
  | 'chart-pie'
  | 'edit'
  | 'info'
  | 'cube'

interface IconProps {
  name: IconName
  className?: string
}

const iconMap: Record<IconName, any> = {
  'lock': faLock,
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
  'filter': faFilter,
  'spinner': faSpinner,
  'inbox': faInbox,
  'history': faHistory,
  'chart-pie': faChartPie,
  'edit': faEdit,
  'info': faInfo,
  'cube': faCube,
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