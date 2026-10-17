/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pine: {
          DEFAULT: '#244c43',
          deep: '#1d3f37',
          mid: '#427263',
        },
        sage: {
          DEFAULT: '#e0ebe4',
          light: '#f0f5f1',
        },
        paper: '#f7f8f5',
        ink: '#252d2a',
        muted: '#78817c',
        line: '#e5e9e4',
        sand: '#f3e8d8',
        'blue-wash': '#e9f0f2',
        danger: '#a94b45',
      },
      fontFamily: {
        body: ['"DM Sans"', 'sans-serif'],
        display: ['"Manrope"', '"DM Sans"', 'sans-serif'],
      },
      borderRadius: {
        'lg': '18px',
        'xl': '20px',
        '2xl': '24px',
      },
      boxShadow: {
        'soft': '0 10px 28px rgba(25,48,38,.055)',
      },
    },
  },
  plugins: [],
};
