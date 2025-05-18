// Define parent containers and their children
const Games = {
  id: "games",
  title: "Games",
  items: [
    {
      id: "game1",
      title: "Adventure Quest",
      icon: "🎮",
      bgColor: "from-blue-900",
    },
    {
      id: "game2",
      title: "Racing Stars",
      icon: "🏎️",
      bgColor: "from-red-900",
    },
    {
      id: "game3",
      title: "Puzzle World",
      icon: "🧩",
      bgColor: "from-green-900",
    },
    {
      id: "game4",
      title: "Space Explorer",
      icon: "🚀",
      bgColor: "from-purple-900",
    },
    {
      id: "game5",
      title: "Fantasy RPG",
      icon: "⚔️",
      bgColor: "from-yellow-900",
    },
  ],
};

const Media = {
  id: "media",
  title: "Media",
  items: [
    { id: "media1", title: "Movies", icon: "🎬", bgColor: "from-blue-900" },
    { id: "media2", title: "Music", icon: "🎵", bgColor: "from-pink-900" },
    { id: "media3", title: "Photos", icon: "📷", bgColor: "from-green-900" },
    { id: "media4", title: "Streaming", icon: "📺", bgColor: "from-red-900" },
  ],
};

const Apps = {
  id: "apps",
  title: "Apps",
  items: [
    { id: "app1", title: "Browser", icon: "🌐", bgColor: "from-blue-800" },
    { id: "app2", title: "YouTube", icon: "📱", bgColor: "from-red-800" },
    { id: "app3", title: "Netflix", icon: "📺", bgColor: "from-gray-800" },
    { id: "app4", title: "Spotify", icon: "🎧", bgColor: "from-green-800" },
  ],
};

const Settings = {
  id: "settings",
  title: "Settings",
  items: [
    {
      id: "setting1",
      title: "Account",
      icon: "👤",
      bgColor: "from-blue-900",
    },
    {
      id: "setting2",
      title: "Display",
      icon: "🖥️",
      bgColor: "from-gray-900",
    },
    {
      id: "setting3",
      title: "Sound",
      icon: "🔊",
      bgColor: "from-purple-900",
    },
    {
      id: "setting4",
      title: "Network",
      icon: "📡",
      bgColor: "from-green-900",
    },
    {
      id: "setting5",
      title: "Storage",
      icon: "💾",
      bgColor: "from-yellow-900",
    },
  ],
};

export const Sections = [Games, Media, Apps, Settings];
