import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\// },
            { name: 'markdown', test: /node_modules\/(react-markdown|remark-|micromark|mdast-|hast-|unist-|unified|vfile|bail|trough|is-plain-obj|trim-lines|space-separated-tokens|comma-separated-tokens|property-information|character-entities|html-void-elements|estree-util-)/ },
            { name: 'motion', test: /node_modules\/framer-motion\// },
            { name: 'mediapipe', test: /node_modules\/@mediapipe\// },
            { name: 'db', test: /node_modules\/dexie/ },
          ],
        },
      },
    },
  },
})
