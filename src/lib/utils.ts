import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return dateObj.toLocaleDateString();
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

export function generateAnonymousName(gender: 'male' | 'female'): string {
  const maleNames = [
    'Adebayo', 'Chukwuma', 'Emeka', 'Femi', 'Ibrahim', 'Kunle', 'Musa', 'Obinna',
    'Segun', 'Tunde', 'Yusuf', 'Akin', 'Bola', 'Chidi', 'David', 'Emmanuel',
    'Godwin', 'Hassan', 'Ikechukwu', 'Joseph', 'Kehinde', 'Lekan', 'Mohammed',
    'Nnamdi', 'Ola', 'Peter', 'Rasheed', 'Samuel', 'Taiwo', 'Victor'
  ];
  
  const femaleNames = [
    'Adaeze', 'Amina', 'Blessing', 'Chiamaka', 'Damilola', 'Ebere', 'Fatima',
    'Grace', 'Hauwa', 'Ifeoma', 'Joy', 'Kemi', 'Latifat', 'Mary', 'Ngozi',
    'Omotola', 'Peace', 'Queen', 'Rakiya', 'Sarah', 'Tope', 'Uju', 'Victoria',
    'Wunmi', 'Yetunde', 'Zainab', 'Chioma', 'Funke', 'Halima', 'Stella'
  ];
  
  const names = gender === 'male' ? maleNames : femaleNames;
  const randomName = names[Math.floor(Math.random() * names.length)];
  const number = Math.floor(Math.random() * 9999);
  
  return `${randomName}${number}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export const isClient = typeof window !== 'undefined';

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
}

export function isMobile(): boolean {
  if (!isClient) return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function generateRandomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7B731', '#5F27CD', '#00D2D3', '#FF9FF3', '#54A0FF'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}