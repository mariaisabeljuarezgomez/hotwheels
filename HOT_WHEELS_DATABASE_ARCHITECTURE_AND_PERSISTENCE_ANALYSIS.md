# Hot Wheels Velocity - Database Architecture & Persistence Analysis

## Table of Contents
1. [Project Overview](#project-overview)
2. [Database Architecture](#database-architecture)
3. [Schema Analysis](#schema-analysis)
4. [Persistence Issues & Solutions](#persistence-issues--solutions)
5. [Data Flow Architecture](#data-flow-architecture)
6. [Admin Panel Integration](#admin-panel-integration)
7. [Production vs Development Issues](#production-vs-development-issues)
8. [Key Learnings & Best Practices](#key-learnings--best-practices)
9. [Future Recommendations](#future-recommendations)

---

## Project Overview

**Hot Wheels Velocity** is a comprehensive e-commerce platform for Hot Wheels collectibles and apparel, featuring:
- Dynamic product management system
- Admin dashboard for content management
- Customer-facing product detail pages
- Image gallery system (main image + 4 thumbnails)
- Dynamic size selectors for apparel items
- Tumbler size guide system
- Real-time data persistence across all pages

---

## Database Architecture

### Primary Database: PostgreSQL
- **Host**: Railway (Production)
- **Local Development**: PostgreSQL local instance
- **Connection**: Environment variable `DATABASE_URL`

### Core Tables

#### 1. `homepage_listings` (Primary Product Table)
This is the **main table** that drives the entire application. It contains all product data and is the single source of truth for product information.

**Key Fields:**
```sql
CREATE TABLE homepage_listings (
    id SERIAL PRIMARY KEY,
    listing_id VARCHAR(50) UNIQUE NOT NULL,  -- e.g., "featured-1", "exclusive-1"
    section VARCHAR(20) NOT NULL,            -- "featured" or "exclusive"
    position INTEGER NOT NULL,               -- Display order within section
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),                  -- Legacy field, kept for compatibility
    tag_type VARCHAR(50),                    -- "rlc-exclusive", "premium", "treasure-hunt"
    tag_text VARCHAR(100),                   -- Display text for tags
    product_link VARCHAR(255),               -- Link to product detail page
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Image Management
    main_image_url VARCHAR(500),             -- Primary product image
    thumbnail_1_url VARCHAR(500),            -- Thumbnail 1
    thumbnail_2_url VARCHAR(500),            -- Thumbnail 2
    thumbnail_3_url VARCHAR(500),            -- Thumbnail 3
    thumbnail_4_url VARCHAR(500),            -- Thumbnail 4
    
    -- Product Details
    subtitle VARCHAR(255),                   -- Product subtitle
    detailed_description TEXT,               -- Extended product description
    original_price DECIMAL(10,2),            -- Original price before discounts
    stock_quantity INTEGER,                  -- Available stock
    
    -- Dynamic Content Management
    product_type VARCHAR(50),                -- "hot-wheels", "t-shirt", "tumbler", "hat"
    available_sizes JSONB,                   -- Array of available sizes
    toggle_settings JSONB,                   -- Feature toggles and settings
    specifications JSONB,                    -- Product specifications
    
    -- Tumbler-Specific Fields
    tumbler_guide_title VARCHAR(255),        -- Title for tumbler size guide
    tumbler_guide_data JSONB                 -- Size guide data structure
);
```

#### 2. `product_details` (Legacy Table)
This table exists but is **NOT actively used** in the current implementation. All product data flows through `homepage_listings`.

#### 3. Supporting Tables
- `users` - User management
- `cart` - Shopping cart functionality
- `orders` - Order management

---

## Schema Analysis

### JSONB Fields Deep Dive

#### `available_sizes` JSONB
**Purpose**: Stores available sizes for apparel items
**Format**: JSON array of strings
**Examples**:
```json
// T-shirt sizes
["S", "M", "L", "XL", "XXL"]

// Hat sizes  
["XS", "S", "M", "L", "XL", "2XL", "3XL"]

// Tumbler sizes
["One Size"]

// Hot Wheels cars
["1:64 Scale"]
```

#### `toggle_settings` JSONB
**Purpose**: Controls which dynamic features are enabled for each product
**Format**: JSON object with feature flags and data
**Examples**:
```json
// T-shirt with size selector
{
  "toggle-apparel": true,
  "sizes": ["S", "M", "L", "XL", "XXL"],
  "colors": ["Black", "White"]
}

// Tumbler with size guide
{
  "toggle-tumbler-guide": true,
  "sizes": ["One Size"],
  "colors": ["White", "Black"]
}

// Hot Wheels car (no special features)
{
  "toggle-apparel": false,
  "toggle-tumbler-guide": false
}
```

#### `specifications` JSONB
**Purpose**: Stores product-specific technical details
**Format**: JSON object with key-value pairs
**Examples**:
```json
// Hot Wheels car
{
  "Year": "2025",
  "Brand": "Hot Wheels",
  "Scale": "1:64",
  "Series": "Formula 1",
  "Material": "Die-cast"
}

// T-shirt
{
  "Brand": "Hot Wheels x Kenny Scharf",
  "Style": "T-Shirt",
  "Weight": "Heavyweight",
  "Material": "100% Cotton"
}
```

#### `tumbler_guide_data` JSONB
**Purpose**: Stores tumbler size guide dimensions
**Format**: JSON object with size specifications
**Example**:
```json
{
  "20oz": {
    "width": "2 5/8",
    "height": "8 3/8", 
    "length": "8 3/8"
  }
}
```

---

## Persistence Issues & Solutions

### Issue 1: Thumbnail Images Not Persisting

**Problem**: Admin panel changes to thumbnails were not saving to the database.

**Root Cause**: 
- Server-side code was updating `product_details` table instead of `homepage_listings`
- Frontend JavaScript was not properly handling image upload responses
- Database schema was missing thumbnail URL columns

**Solution**:
1. **Updated Server Endpoint** (`/api/homepage-listings` PUT):
   ```javascript
   // Fixed to update homepage_listings table directly
   UPDATE homepage_listings 
   SET thumbnail_1_url = $11, thumbnail_2_url = $12, 
       thumbnail_3_url = $13, thumbnail_4_url = $14
   WHERE listing_id = $21
   ```

2. **Fixed Frontend JavaScript** (`js/homepage-listings-hybrid.js`):
   ```javascript
   // Added proper image URL handling
   populateImageSlots(listing) {
     const imageUrls = {
       main_image_url: listing.main_image_url,
       thumbnail_1_url: listing.thumbnail_1_url,
       thumbnail_2_url: listing.thumbnail_2_url,
       thumbnail_3_url: listing.thumbnail_3_url,
       thumbnail_4_url: listing.thumbnail_4_url
     };
   }
   ```

3. **Updated Database Schema**:
   ```sql
   ALTER TABLE homepage_listings 
   ADD COLUMN thumbnail_1_url VARCHAR(500),
   ADD COLUMN thumbnail_2_url VARCHAR(500),
   ADD COLUMN thumbnail_3_url VARCHAR(500),
   ADD COLUMN thumbnail_4_url VARCHAR(500);
   ```

### Issue 2: Size Selectors Not Displaying

**Problem**: T-shirt sizes, hat sizes, and tumbler guides were not showing on product detail pages.

**Root Cause**:
- `toggle_settings` in database were missing required flags
- Frontend JavaScript was not properly parsing JSONB data
- Product detail page logic was checking wrong conditions

**Solution**:
1. **Updated Database Records**:
   ```sql
   -- T-shirt
   UPDATE homepage_listings 
   SET toggle_settings = '{"toggle-apparel": true, "sizes": ["S","M","L","XL","XXL"], "colors": ["Black","White"]}'
   WHERE listing_id = 'exclusive-1';

   -- Tumbler
   UPDATE homepage_listings 
   SET toggle_settings = '{"toggle-tumbler-guide": true, "sizes": ["One Size"], "colors": ["White","Black"]}'
   WHERE listing_id = 'exclusive-2';
   ```

2. **Fixed Frontend Parsing** (`pages/product_detail.html`):
   ```javascript
   // Parse available_sizes as JSON
   const sizes = JSON.parse(currentProduct.available_sizes);
   
   // Check toggle settings
   if (currentProduct.toggle_settings && currentProduct.toggle_settings['toggle-apparel']) {
     // Show size selector
   }
   ```

### Issue 3: Production vs Development Database Mismatch

**Problem**: Local development database had correct data, but production database was missing updates.

**Root Cause**:
- Database migrations were not applied to production
- Local changes were not synced to production database
- Environment variables were pointing to different databases

**Solution**:
1. **Created Production Update Scripts**:
   ```javascript
   // Direct API calls to update production database
   const updateData = {
     listing_id: "featured-1",
     title: "Hot Wheels 2025 Formula 1...",
     thumbnail_1_url: "/HOT_WHEELS_IMAGES/image-1757053736878-157461431.jpg",
     // ... other fields
   };
   
   await fetch('https://hotwheels-production-f515.up.railway.app/api/homepage-listings', {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(updateData)
   });
   ```

2. **Verified Data Consistency**:
   - Checked production API responses
   - Confirmed all thumbnail URLs were present
   - Verified toggle settings were correct

---

## Data Flow Architecture

### 1. Admin Panel Data Flow
```
Admin Form → JavaScript → API Endpoint → Database → Response → UI Update
```

**Detailed Flow**:
1. **Form Submission**: Admin fills out product form in `pages/homepage-listings.html`
2. **JavaScript Processing**: `js/homepage-listings-hybrid.js` collects form data
3. **Image Upload**: Images uploaded via `/api/upload-image` endpoint
4. **Data Assembly**: JavaScript combines form data with image URLs
5. **API Call**: PUT request to `/api/homepage-listings` with complete data
6. **Database Update**: Server updates `homepage_listings` table
7. **Response**: Server returns updated listing data
8. **UI Refresh**: JavaScript updates admin panel with new data

### 2. Product Detail Page Data Flow
```
URL Parameter → API Call → Database Query → Data Processing → UI Rendering
```

**Detailed Flow**:
1. **URL Parsing**: `product_detail.html?id=featured-1` extracts product ID
2. **API Call**: GET request to `/api/product-details/:id`
3. **Database Query**: Server queries `homepage_listings` table
4. **Data Processing**: Server formats data for frontend
5. **JSON Response**: Structured data sent to frontend
6. **Frontend Processing**: JavaScript parses and processes data
7. **UI Rendering**: HTML elements populated with product data

### 3. Image Management Flow
```
File Upload → Multer Processing → File Storage → URL Generation → Database Storage
```

**Detailed Flow**:
1. **File Selection**: Admin selects image files
2. **Multer Processing**: `multer` middleware handles file upload
3. **File Storage**: Images saved to `HOT_WHEELS_IMAGES/` directory
4. **URL Generation**: Server generates relative URLs (`/HOT_WHEELS_IMAGES/filename.jpg`)
5. **Database Storage**: URLs stored in `homepage_listings` table
6. **Frontend Display**: URLs used in `<img>` src attributes

---

## Admin Panel Integration

### Key Components

#### 1. Image Upload System
- **5-slot system**: Main image + 4 thumbnails
- **Drag & drop interface**: User-friendly file selection
- **Preview functionality**: Immediate image preview
- **Delete capability**: Remove individual images

#### 2. Dynamic Form Fields
- **Toggle-based sections**: Show/hide based on product type
- **Size management**: Checkbox interface for available sizes
- **Color selection**: Multi-select color options
- **Specification fields**: Dynamic product specifications

#### 3. Data Persistence
- **Real-time saving**: Changes saved immediately
- **Validation**: Client and server-side validation
- **Error handling**: Comprehensive error messages
- **Success feedback**: Confirmation of successful saves

### JavaScript Architecture

#### `js/homepage-listings-hybrid.js` - Core Admin Logic
```javascript
class HomepageListings {
  constructor() {
    this.listings = {};
    this.currentEditingId = null;
    this.uploadedMainImageUrl = null;
  }

  // Load all listings from API
  async loadListings() { /* ... */ }

  // Open edit modal for specific listing
  openEditModal(listingId) { /* ... */ }

  // Handle image uploads
  handleImageUpload(slotIndex, file) { /* ... */ }

  // Save listing changes
  async saveListing() { /* ... */ }

  // Populate image slots with existing data
  populateImageSlots(listing) { /* ... */ }
}
```

---

## Production vs Development Issues

### Environment Differences

#### Development Environment
- **Database**: Local PostgreSQL instance
- **File Storage**: Local `HOT_WHEELS_IMAGES/` directory
- **URLs**: `http://localhost:3000/`
- **Data**: Manually seeded test data

#### Production Environment
- **Database**: Railway PostgreSQL
- **File Storage**: Railway file system
- **URLs**: `https://hotwheels-production-f515.up.railway.app/`
- **Data**: Initially empty, required manual population

### Migration Challenges

#### 1. Schema Synchronization
**Problem**: Local schema changes not reflected in production
**Solution**: Manual ALTER TABLE statements via production API

#### 2. Data Population
**Problem**: Production database empty while development had test data
**Solution**: Created comprehensive update scripts to populate production

#### 3. File Path Consistency
**Problem**: Image URLs needed to work in both environments
**Solution**: Used relative paths (`/HOT_WHEELS_IMAGES/`) that work in both

---

## Key Learnings & Best Practices

### 1. Database Design
- **Single Source of Truth**: Use one primary table (`homepage_listings`) instead of multiple related tables
- **JSONB for Flexibility**: Use JSONB for dynamic, schema-flexible data
- **Consistent Naming**: Use consistent naming conventions across all fields
- **Proper Indexing**: Index frequently queried fields (`listing_id`, `section`)

### 2. API Design
- **RESTful Endpoints**: Use standard HTTP methods and status codes
- **Consistent Response Format**: Always return `{success: boolean, data: object, message: string}`
- **Error Handling**: Comprehensive error messages and proper HTTP status codes
- **Validation**: Both client and server-side validation

### 3. Frontend Architecture
- **Separation of Concerns**: Separate data fetching, processing, and rendering
- **Error Handling**: Graceful degradation when data is missing
- **User Feedback**: Clear loading states and success/error messages
- **Data Validation**: Client-side validation before API calls

### 4. Image Management
- **Consistent Storage**: Use consistent directory structure and naming
- **URL Management**: Use relative URLs for portability
- **File Validation**: Validate file types and sizes
- **Error Handling**: Handle missing images gracefully

### 5. Development Workflow
- **Environment Parity**: Keep development and production environments as similar as possible
- **Database Migrations**: Use proper migration scripts for schema changes
- **Data Seeding**: Create scripts to populate test data
- **Testing**: Test both local and production environments

---

## Future Recommendations

### 1. Database Improvements
- **Add Indexes**: Create indexes on frequently queried fields
- **Data Validation**: Add database-level constraints
- **Audit Trail**: Add created_by, updated_by fields
- **Soft Deletes**: Implement soft delete functionality

### 2. API Enhancements
- **Pagination**: Add pagination for large datasets
- **Caching**: Implement Redis caching for frequently accessed data
- **Rate Limiting**: Add rate limiting to prevent abuse
- **API Versioning**: Implement API versioning for future changes

### 3. Frontend Improvements
- **State Management**: Implement proper state management (Redux/Vuex)
- **Component Architecture**: Break down large components into smaller, reusable ones
- **Error Boundaries**: Implement error boundaries for better error handling
- **Performance**: Add lazy loading and image optimization

### 4. DevOps & Deployment
- **CI/CD Pipeline**: Implement automated testing and deployment
- **Database Migrations**: Use proper migration tools (Knex.js, Sequelize)
- **Environment Management**: Use proper environment variable management
- **Monitoring**: Add application monitoring and logging

### 5. Security Enhancements
- **Input Sanitization**: Sanitize all user inputs
- **Authentication**: Implement proper user authentication
- **Authorization**: Add role-based access control
- **Data Encryption**: Encrypt sensitive data at rest

---

## Conclusion

The Hot Wheels Velocity platform has evolved from a simple product showcase to a comprehensive e-commerce solution with dynamic content management. The key to success was establishing a single source of truth in the `homepage_listings` table and ensuring data consistency across all environments.

The most critical lesson learned was the importance of **environment parity** and **proper data migration strategies**. The persistence issues we encountered were primarily due to differences between development and production databases, which were resolved through systematic data synchronization and proper API design.

The current architecture provides a solid foundation for future enhancements while maintaining data integrity and user experience quality. The use of JSONB fields for dynamic content management has proven to be an excellent choice for the flexible requirements of an e-commerce platform.

---

*This document serves as a comprehensive reference for the Hot Wheels Velocity database architecture and should be updated as the system evolves.*
