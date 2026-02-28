# **App Name**: ChatClaude

## Core Features:

- Conversational AI Chat: Allows users to input messages and receive simulated AI responses, mimicking a realistic conversation flow with 'thinking' animations.
- AI-Powered Artifacts Display: Presents dynamically generated artifacts (e.g., code, interactive UI elements) from the simulated AI. This feature acts as an AI tool output viewer, complete with a toggleable side panel, simulated preview areas, and syntax highlighting for mock code.
- Project & Session Management: Enables users to start new chat or project sessions, organize conversations, and provides dedicated 'project' workspaces with simulated file upload and context persistence via application state.
- Dynamic Theme Toggling: Provides a seamless dark/light mode toggle that adjusts the entire application's aesthetic based on user preference, with persistence and dynamic application of themes using CSS variables and a 'dark' class.
- Adaptive User Interface: Ensures the application layout is fully responsive, adapting gracefully across various screen sizes by transforming the sidebar into a mobile-friendly drawer menu and optimizing content display for smaller devices.
- Intuitive Message Composer: Features an auto-growing textarea for typing messages within a visually appealing, rounded input bar, paired with an icon-based send button for intuitive user interaction.

## Style Guidelines:

- Primary (Accent) Color: A vibrant medium purple (#8B5CF6), selected to evoke a futuristic feel and provide subtle 'neon glow' on interaction within the dominant dark theme. (HSL: 262, 82%, 60%)
- Background Color: A very dark, subtly purplish-grey (#120e15) as the default for the dark theme, ensuring content focus and eye comfort. (HSL: 262, 15%, 7%)
- Secondary Accent: A soft, pale blue-violet (#BBCFED) to complement the primary purple, used for subtle highlights, borders, and secondary informational text. (HSL: 232, 40%, 80%)
- Message Bubble (AI): Dark background (#1F2937) for dark mode and light (#f3f4f6) for light mode.
- Message Bubble (User): Rich purple background (#6B21A8) for dark mode and soft lavender (#e9d5ff) for light mode.
- Hover & Active States: Interactive elements utilize the primary purple with varying opacity; hover will be primary accent at 10% opacity, and active states at 20% opacity for clear feedback.
- Font: 'Inter' (sans-serif) will be used consistently for both headlines and body text, with a fallback to 'system-ui' for a modern, neutral, and highly readable aesthetic.
- Icon Set: Clean, outlined icons from 'lucide-react' for all UI elements. This includes the distinct 'Cl' logo in purple, moon/sun icons for theme toggling, an arrow-up icon for message submission, and a code icon to toggle the Artifacts panel. Avatars will be small circular elements using either an anthropomorphic icon or initial placeholders.
- Main Structure: A responsive three-column grid layout, featuring a fixed-width left sidebar (260-300px), a central scrollable chat area, and a toggleable right-slide-in artifacts panel. Mobile displays will collapse the sidebar into a hamburger menu drawer, allowing the chat area to become full-width. Generous padding (24-32px) around content, particularly within chat messages, ensures a clean, spacious interface.
- Subtle & Smooth: Implement smooth transitions (300ms ease) for all state changes, hover effects, and panel open/close actions. Subtle visual flourishes such as a faint 'neon glow' on active accent elements and delicate particle effects during simulated AI loading states will enhance the futuristic user experience.