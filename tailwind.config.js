/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ledger: {
          bg: '#0F1B15',      // deep archive green-black
          panel: '#16241C',
          line: '#2B3B30',
          amber: '#D9A441',   // claim-ticket amber (signature accent)
          amberDim: '#8C6E2E',
          paper: '#F4EFE3',   // manila-folder paper
          rust: '#B8532F',    // "lost" tag red-rust
          moss: '#5C8A5A',    // "found" tag green
        },
      },
      fontFamily: {
        display: ['"Courier New"', 'ui-monospace', 'monospace'],
        body: ['"Georgia"', 'ui-serif', 'serif'],
      },
    },
  },
  plugins: [],
}
