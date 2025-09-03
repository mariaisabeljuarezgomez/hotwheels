# 🏎️ Hot Wheels Velocity

The ultimate premium collector-focused eCommerce platform for Hot Wheels enthusiasts. Discover rare treasures, authenticate your finds, and connect with the worldwide collector community.

## 🚀 Features

- **Premium Collections** - Curated selection of rare Hot Wheels vehicles
- **360° Product Views** - Interactive product visualization
- **Authentication Services** - Expert verification and grading
- **Collector Dashboard** - Track your collection value and performance
- **Live Activity Feed** - Real-time updates from the collector community
- **Advanced Search & Filtering** - Find exactly what you're looking for
- **Mobile-First Design** - Optimized for all devices
- **PWA Ready** - Installable web app experience

## 📋 Prerequisites

- Node.js (v14.x or higher)
- npm or yarn

## 🛠️ Installation & Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd hot-wheels-velocity
```

2. **Install dependencies:**
```bash
npm install
```

3. **Build the CSS:**
```bash
npm run build:css
```

4. **Start development server:**
```bash
npm run dev
```

## 📁 Project Structure

```
hot-wheels-velocity/
├── index.html                    # Landing page with redirect
├── css/
│   ├── main.css                 # Compiled Tailwind CSS
│   └── tailwind.css            # Tailwind source with custom styles
├── pages/                       # Main application pages
│   ├── homepage.html            # Main homepage
│   ├── collection_browser.html  # Product catalog & search
│   ├── product_detail.html      # Individual product pages
│   ├── collector_dashboard.html # User dashboard
│   ├── checkout_experience.html # Checkout flow
│   └── about_hot_wheels_velocity.html # About page
├── public/                      # Static assets
│   ├── favicon.ico             # Site favicon
│   ├── manifest.json           # PWA manifest
│   └── dhws-data-injector.js   # Data injection script
├── HOT WHEELS IMAGES/          # Product images
├── package.json                # Dependencies & scripts
├── tailwind.config.js          # Tailwind configuration
└── README.md                   # This file
```

## 🎨 Design System

### Color Palette
- **Primary**: `#1A1A1A` - Premium foundation
- **Secondary**: `#2D2D2D` - Subtle elevation
- **Accent**: `#FF0080` - Electric excitement
- **Success**: `#00FF88` - Collector victory
- **Warning**: `#FFD700` - Premium alerts
- **Error**: `#FF4444` - Helpful guidance

### Typography
- **Headings**: Orbitron (display font)
- **Body**: Inter (sans-serif)
- **Monospace**: JetBrains Mono
- **Accent**: Rajdhani (military/technical)

## 🧩 Key Components

- **Card System**: Premium, Rare, and Standard card variants
- **Navigation**: Fixed header with mega menu
- **Product Viewer**: 360° interactive viewing
- **Search Interface**: Advanced filtering system
- **Dashboard**: Collection management tools
- **Checkout Flow**: Multi-step purchase process

## 📦 Build Commands

```bash
# Build CSS for production
npm run build:css

# Watch for CSS changes during development
npm run dev

# Full development workflow
npm run watch:css
```

## 📱 Responsive Breakpoints

- `sm`: 640px+ (mobile landscape)
- `md`: 768px+ (tablet)
- `lg`: 1024px+ (desktop)
- `xl`: 1280px+ (large desktop)

## 📸 Image Usage & Licensing

This project uses royalty-free images from:

- **Unsplash** - Free high-resolution photos ([unsplash.com](https://unsplash.com))
- **Pexels** - Free stock photos ([pexels.com](https://pexels.com))
- **Pixabay** - Public domain images ([pixabay.com](https://pixabay.com))

### Download Images
```bash
# Download standard images
node download-images.js

# Download premium high-resolution images
node download-images.js premium
```

### Important Notes:
- ⚖️ **Always credit sources** when using images commercially
- 🚫 **Never download copyrighted images** from official brand websites
- 📝 **Check licensing terms** for each image source
- 🔄 **Use fallback images** for better user experience

### Image Fallback Strategy
All product images include `onerror` handlers that automatically switch to backup images if the primary source fails to load.

## 🔧 Technologies Used

- **HTML5** - Semantic markup
- **Tailwind CSS** - Utility-first styling
- **JavaScript** - Interactive functionality
- **PWA Features** - Offline capability
- **Responsive Images** - Optimized loading

## 🚀 Deployment

### Railway Deployment (Recommended)

This project is configured for easy Railway deployment:

1. **Push to GitHub** (already done)
2. **Connect to Railway:**
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repository
   - Railway auto-detects the configuration
3. **Deploy automatically** - Railway handles build and deployment

**Railway Configuration Files:**
- `railway.json` - Railway deployment config
- `nixpacks.toml` - Railway build configuration
- `Dockerfile` - Docker deployment option

### Manual Deployment

For other hosting providers:

1. Build production assets: `npm run build`
2. Upload all files to your hosting provider
3. Ensure the `public/` directory is accessible

### Local Development

1. **Environment Setup:**
   ```bash
   # Copy environment template
   cp env.template .env.local
   # Edit .env.local with your settings
   ```

2. **Run locally:**
   ```bash
   npm install
   npm run dev        # Development with CSS watching
   npm run serve      # Production-like serving
   ```

## 🙏 Acknowledgments

- **Rocket.new** - Platform for rapid development
- **Tailwind CSS** - Utility-first CSS framework
- **Hot Wheels Community** - Inspiration and expertise
- **PWA Standards** - Modern web app capabilities

---

**Built with ❤️ for the Hot Wheels collecting community**

*Hot Wheels Velocity - Where collectors accelerate their passion*
