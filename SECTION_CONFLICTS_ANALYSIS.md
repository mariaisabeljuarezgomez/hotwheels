# SECTION CONFLICTS ANALYSIS - Hot Wheels Velocity

## 🚨 CRITICAL CONFLICTS IDENTIFIED

### **CONFLICT 1: TITLE FIELD**
- **BASIC INFORMATION SECTION**: `title` → `homepage_listings.title`
- **EXTENDED DETAILS SECTION**: `title` → `product_details.title`
- **PROBLEM**: Both sections save to different tables but same field name
- **IMPACT**: Data inconsistency between homepage and product detail page

### **CONFLICT 2: PRICE FIELDS**
- **BASIC INFORMATION SECTION**: `price` → `homepage_listings.price`
- **EXTENDED DETAILS SECTION**: `current_price` → `product_details.current_price`
- **PROBLEM**: Different field names for same data
- **IMPACT**: Price mismatch between homepage and product detail page

### **CONFLICT 3: TAG FIELDS**
- **BASIC INFORMATION SECTION**: `tag_type`, `tag_text` → `homepage_listings.tag_type`, `homepage_listings.tag_text`
- **EXTENDED DETAILS SECTION**: `primary_tag`, `primary_tag_text` → `product_details.primary_tag`, `product_details.primary_tag_text`
- **PROBLEM**: Different field names for same data
- **IMPACT**: Tag display inconsistency

### **CONFLICT 4: IMAGE FIELDS**
- **BASIC INFORMATION SECTION**: `image_url` → `homepage_listings.image_url`
- **EXTENDED DETAILS SECTION**: `main_image_url`, `thumbnail_X_url` → `product_details.main_image_url`, `product_details.thumbnail_X_url`
- **PROBLEM**: Different field names and structures
- **IMPACT**: Images not showing in edit modal

### **CONFLICT 5: DESCRIPTION FIELDS**
- **BASIC INFORMATION SECTION**: `description` → `homepage_listings.description`
- **EXTENDED DETAILS SECTION**: `detailed_description` → `product_details.historical_description`
- **PROBLEM**: Different field names for similar data
- **IMPACT**: Description not showing on product detail page

## 📊 SECTION-BY-SECTION ANALYSIS

### **1. BASIC INFORMATION SECTION**
**Purpose**: Homepage cards (3rd screenshot)
**Database**: `homepage_listings` table
**Fields**:
- `title` (VARCHAR 255)
- `description` (TEXT)
- `price` (NUMERIC 10,2)
- `image_url` (VARCHAR 500)
- `tag_type` (VARCHAR 50)
- `tag_text` (VARCHAR 100)
- `product_link` (VARCHAR 500)
- `is_active` (BOOLEAN)

### **2. EXTENDED PRODUCT DETAILS SECTION**
**Purpose**: Product detail page (4th screenshot)
**Database**: `product_details` table
**Fields**:
- `title` (VARCHAR 255) - **CONFLICT WITH BASIC INFO**
- `subtitle` (TEXT)
- `current_price` (NUMERIC 10,2) - **CONFLICT WITH BASIC INFO**
- `main_image_url` (VARCHAR 500) - **CONFLICT WITH BASIC INFO**
- `thumbnail_1_url` through `thumbnail_4_url` (VARCHAR 500)
- `primary_tag` (VARCHAR 50) - **CONFLICT WITH BASIC INFO**
- `primary_tag_text` (VARCHAR 100) - **CONFLICT WITH BASIC INFO**
- `detailed_description` (TEXT) - **CONFLICT WITH BASIC INFO**
- `historical_description` (TEXT)
- `expert_quote` (TEXT)
- `expert_name` (VARCHAR 255)
- `expert_rating` (NUMERIC 3,1)
- `toggle_settings` (JSONB)

### **3. PRODUCT FEATURES SECTION**
**Purpose**: Product features list
**Database**: `product_details` table
**Fields**:
- `features` (JSONB) - **STORED IN specifications COLUMN**

### **4. PRODUCT SPECIFICATIONS SECTION**
**Purpose**: Technical specifications
**Database**: `product_details` table
**Fields**:
- `specifications` (JSONB) - **CONFLICT WITH FEATURES**

### **5. MARKET VALUE & INVESTMENT DATA SECTION**
**Purpose**: Investment information
**Database**: `product_details` table
**Fields**:
- `market_value` (NUMERIC 10,2)
- `price_change_percentage` (NUMERIC 5,2)
- `investment_grade` (VARCHAR 10)
- `week_low` (NUMERIC 10,2)
- `week_high` (NUMERIC 10,2)
- `avg_sale_price` (NUMERIC 10,2)

### **6. EXPERT AUTHENTICATION SECTION**
**Purpose**: Authentication details
**Database**: `product_details` table
**Fields**:
- `expert_authenticated` (BOOLEAN)
- `certificate_number` (VARCHAR 100)
- `authenticated_by` (VARCHAR 255)

### **7. DETAILED SPECIFICATIONS SECTION**
**Purpose**: Detailed product specs
**Database**: `product_details` table
**Fields**:
- `production_year` (INTEGER)
- `casting` (VARCHAR 255)
- `color` (VARCHAR 100)
- `tampo` (VARCHAR 255)
- `wheels` (VARCHAR 100)
- `country` (VARCHAR 100)
- `condition_rating` (NUMERIC 3,1)
- `condition_description` (VARCHAR 100)

### **8. PREMIUM SERVICES SECTION**
**Purpose**: Premium service options
**Database**: `product_details` table
**Fields**:
- `professional_grading` (BOOLEAN)
- `grading_price` (NUMERIC 8,2)
- `custom_display_case` (BOOLEAN)
- `display_case_price` (NUMERIC 8,2)
- `insurance_valuation` (BOOLEAN)
- `insurance_price` (NUMERIC 8,2)

### **9. STATUS TAGS SECTION**
**Purpose**: Product status indicators
**Database**: `product_details` table
**Fields**:
- `ultra_rare` (BOOLEAN)
- `mint_condition` (BOOLEAN)
- `investment_grade_tag` (BOOLEAN)
- `limited_edition` (BOOLEAN)
- `original_packaging` (BOOLEAN)

### **10. HISTORICAL CONTEXT & EXPERT COMMENTARY SECTION**
**Purpose**: Historical information
**Database**: `product_details` table
**Fields**:
- `historical_description` (TEXT)
- `expert_quote` (TEXT)
- `expert_name` (VARCHAR 255)
- `expert_rating` (NUMERIC 3,1)

## 🔧 REQUIRED FIXES

### **IMMEDIATE FIXES NEEDED**:

1. **SEPARATE TITLE FIELDS**:
   - `homepage_listings.title` → `homepage_title`
   - `product_details.title` → `product_title`

2. **UNIFY PRICE FIELDS**:
   - Use `current_price` in both tables
   - Remove `homepage_listings.price`

3. **UNIFY TAG FIELDS**:
   - Use `primary_tag` and `primary_tag_text` in both tables
   - Remove `homepage_listings.tag_type` and `homepage_listings.tag_text`

4. **UNIFY IMAGE FIELDS**:
   - Use `main_image_url` in both tables
   - Remove `homepage_listings.image_url`

5. **UNIFY DESCRIPTION FIELDS**:
   - Use `detailed_description` in both tables
   - Remove `homepage_listings.description`

### **DATABASE SCHEMA CHANGES REQUIRED**:

```sql
-- Add new columns to homepage_listings
ALTER TABLE homepage_listings ADD COLUMN homepage_title VARCHAR(255);
ALTER TABLE homepage_listings ADD COLUMN homepage_description TEXT;
ALTER TABLE homepage_listings ADD COLUMN main_image_url VARCHAR(500);
ALTER TABLE homepage_listings ADD COLUMN primary_tag VARCHAR(50);
ALTER TABLE homepage_listings ADD COLUMN primary_tag_text VARCHAR(100);

-- Update existing data
UPDATE homepage_listings SET 
    homepage_title = title,
    homepage_description = description,
    main_image_url = image_url,
    primary_tag = tag_type,
    primary_tag_text = tag_text;

-- Drop old conflicting columns
ALTER TABLE homepage_listings DROP COLUMN title;
ALTER TABLE homepage_listings DROP COLUMN description;
ALTER TABLE homepage_listings DROP COLUMN price;
ALTER TABLE homepage_listings DROP COLUMN image_url;
ALTER TABLE homepage_listings DROP COLUMN tag_type;
ALTER TABLE homepage_listings DROP COLUMN tag_text;
```

## 🎯 SOLUTION STRATEGY

### **PHASE 1: DATABASE SCHEMA UNIFICATION**
1. Add new unified columns to both tables
2. Migrate existing data
3. Drop old conflicting columns

### **PHASE 2: FRONTEND CODE UPDATES**
1. Update all form field mappings
2. Update API endpoints
3. Update data loading logic

### **PHASE 3: TESTING**
1. Test each section individually
2. Test data persistence
3. Test image loading
4. Test toggle states

## ⚠️ CRITICAL WARNING

**DO NOT PROCEED** with any fixes until all conflicts are identified and resolved. The current system has multiple sections saving to the same database columns with different field names, causing data loss and persistence issues.

**RECOMMENDATION**: Create a completely separate database table for each section to eliminate all conflicts.
