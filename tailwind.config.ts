import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#fcf9f8',
          dim: '#dcd9d9',
          container: {
            DEFAULT: '#f0edec',
            low: '#f6f3f2',
            high: '#ebe7e7',
            highest: '#e5e2e1',
            lowest: '#ffffff',
          },
        },
        primary: {
          DEFAULT: '#3525cd',
          container: '#4f46e5',
          fixed: { DEFAULT: '#e2dfff', dim: '#c3c0ff' },
        },
        'on-surface': {
          DEFAULT: '#1c1b1b',
          variant: '#464555',
        },
        'on-primary': {
          DEFAULT: '#ffffff',
          container: '#dad7ff',
          fixed: { DEFAULT: '#0f0069', variant: '#3323cc' },
        },
        secondary: {
          DEFAULT: '#5f5e5e',
          container: '#e5e2e1',
          fixed: { DEFAULT: '#e5e2e1', dim: '#c8c6c5' },
        },
        'on-secondary': {
          DEFAULT: '#ffffff',
          container: '#656464',
          fixed: { DEFAULT: '#1c1b1b', variant: '#474646' },
        },
        tertiary: {
          DEFAULT: '#3130c0',
          container: '#4b4dd8',
          fixed: { DEFAULT: '#e1e0ff', dim: '#c0c1ff' },
        },
        outline: {
          DEFAULT: '#777587',
          variant: '#c7c4d8',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
      },
      fontFamily: {
        headline: ['Manrope', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        label: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.125rem',
        lg: '0.25rem',
        xl: '0.5rem',
        '2xl': '0.75rem',
        '3xl': '1.5rem',
        '4xl': '3rem',
      },
    },
  },
  plugins: [],
};

export default config;
