/**
 * WarpTheme - Simplified theme type for Warp-style backgrounds
 * 
 * Design Principles:
 * 1. Text must always have sufficient contrast (WCAG AA: 4.5:1 for normal text)
 * 2. Surface colors should be semi-transparent for glassmorphism but readable
 * 3. Primary colors are for accents/highlights, not text
 * 4. Muted colors should still be readable (at least 3:1 ratio)
 */
export interface WarpTheme {
  id: string;
  name: string;
  type: 'light' | 'dark';
  bgImage?: string;
  colors: {
    background: string;
    surface: string;
    primary: string;
    border: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    overlay: string;
  };
  glassOpacity: number;
  blur: string;
}

export const WARP_THEMES: WarpTheme[] = [
    {
        id: 'default',
        name: 'Default',
        type: 'dark',
        colors: {
            background: '#09090b',
            surface: 'rgba(9, 9, 11, 0.85)',
            primary: '#06b6d4',
            border: 'rgba(255, 255, 255, 0.12)',
            text: { 
                primary: '#fafafa',      // zinc-50: high contrast white
                secondary: '#d4d4d8',    // zinc-300: readable gray
                muted: '#a1a1aa'         // zinc-400: still readable
            },
            overlay: 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.3))'
        },
        glassOpacity: 0.85,
        blur: 'backdrop-blur-xl'
    },
    {
        id: 'canyon',
        name: 'Canyon',
        type: 'dark',
        bgImage: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?auto=format&fit=crop&w=2000&q=80',
        colors: {
            background: '#1c1210',
            surface: 'rgba(28, 18, 16, 0.75)',
            primary: '#fb923c',
            border: 'rgba(255, 255, 255, 0.15)',
            text: { 
                primary: '#fef3c7',      // amber-100: warm white
                secondary: '#fcd34d',    // amber-300: readable warm
                muted: '#d97706'         // amber-600: darker but visible
            },
            overlay: 'linear-gradient(to top, rgba(28,18,16,0.9), rgba(28,18,16,0.4))'
        },
        glassOpacity: 0.7,
        blur: 'backdrop-blur-2xl'
    },
    {
        id: 'snow',
        name: 'Marble',
        type: 'light',
        bgImage: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=2000&q=80',
        colors: {
            background: '#f8fafc',
            surface: 'rgba(255, 255, 255, 0.85)',
            primary: '#2563eb',
            border: 'rgba(0, 0, 0, 0.12)',
            text: {
                primary: '#0f172a',      // slate-900: high contrast dark
                secondary: '#334155',    // slate-700: readable dark gray
                muted: '#64748b'         // slate-500: still readable
            },
            overlay: 'linear-gradient(to top, rgba(255,255,255,0.9), rgba(255,255,255,0.5))'
        },
        glassOpacity: 0.85,
        blur: 'backdrop-blur-xl'
    },
    {
        id: 'koi',
        name: 'Koi',
        type: 'dark',
        bgImage: 'https://images.unsplash.com/photo-1544256718-3bcf237f3974?auto=format&fit=crop&w=2000&q=80',
        colors: {
            background: '#0c0a09',
            surface: 'rgba(12, 10, 9, 0.8)',
            primary: '#f87171',
            border: 'rgba(255, 255, 255, 0.12)',
            text: { 
                primary: '#fef2f2',      // red-50: soft white
                secondary: '#fecaca',    // red-200: readable warm
                muted: '#f87171'         // red-400: visible accent
            },
            overlay: 'linear-gradient(to top, rgba(12,10,9,0.9), rgba(12,10,9,0.4))'
        },
        glassOpacity: 0.75,
        blur: 'backdrop-blur-xl'
    },
    {
        id: 'cyber',
        name: 'Cyber',
        type: 'dark',
        bgImage: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=2000&q=80',
        colors: {
            background: '#0a0118',
            surface: 'rgba(10, 1, 24, 0.8)',
            primary: '#e879f9',
            border: 'rgba(232, 121, 249, 0.25)',
            text: { 
                primary: '#fdf4ff',      // fuchsia-50: bright white
                secondary: '#f5d0fe',    // fuchsia-200: readable pink
                muted: '#d946ef'         // fuchsia-500: visible accent
            },
            overlay: 'linear-gradient(to top, rgba(10,1,24,0.9), rgba(10,1,24,0.4))'
        },
        glassOpacity: 0.75,
        blur: 'backdrop-blur-xl'
    }
];

export type { Theme } from './types/theme';
