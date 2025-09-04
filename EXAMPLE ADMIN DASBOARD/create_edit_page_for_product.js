const fs = require('fs');
const path = require('path');

function createEditPageForProduct(productId, productName) {
  const cleanName = productName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
  
  const editPageContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Edit Product ${productId} - ${productName} - PlwgsCreativeApparel</title>
    <meta name="description" content="Edit product details for ${productName} - comprehensive product management system for PlwgsCreativeApparel." />
    <link rel="stylesheet" href="../css/main.css" />
    <style>
        /* Uploads Specific Styles */
        .sidebar-nav {
            backdrop-filter: blur(10px);
            background: rgba(42, 42, 42, 0.95);
            border-right: 1px solid rgba(0, 188, 212, 0.2);
        }
        
        .glass-card {
            backdrop-filter: blur(15px);
            background: rgba(42, 42, 42, 0.8);
            border: 1px solid rgba(0, 188, 212, 0.2);
        }
        
        .upload-area {
            border: 2px dashed rgba(0, 188, 212, 0.3);
            transition: all 0.3s ease;
        }
        
        .upload-area:hover {
            border-color: rgba(0, 188, 212, 0.6);
            background: rgba(0, 188, 212, 0.05);
        }
        
        .upload-area.dragover {
            border-color: #00bcd4;
            background: rgba(0, 188, 212, 0.1);
        }
        
        .image-preview {
            position: relative;
            display: inline-block;
            margin: 0.5rem;
        }
        
        .image-preview img {
            width: 100px;
            height: 100px;
            object-fit: cover;
            border-radius: 0.5rem;
            border: 2px solid rgba(0, 188, 212, 0.3);
        }
        
        .image-preview .remove-btn {
            position: absolute;
            top: -8px;
            right: -8px;
            background: #ef4444;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 12px;
        }
        
        .color-option {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 3px solid transparent;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .color-option.selected {
            border-color: #00bcd4;
            transform: scale(1.1);
        }
        
        .size-option {
            padding: 0.5rem 1rem;
            border: 2px solid rgba(0, 188, 212, 0.3);
            border-radius: 0.5rem;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
        }
        
        .size-option.selected {
            background: rgba(0, 188, 212, 0.2);
            border-color: #00bcd4;
            color: #00bcd4;
        }
        
        .product-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
        }
        
        .product-card {
            background: rgba(42, 42, 42, 0.8);
            border: 1px solid rgba(0, 188, 212, 0.2);
            border-radius: 1rem;
            padding: 1.5rem;
            transition: all 0.3s ease;
        }
        
        .product-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 188, 212, 0.1);
        }
        
        .loading {
            text-align: center;
            padding: 50px;
            color: #fff;
        }
    </style>
</head>
<body class="bg-gray-900 text-white min-h-screen">
    <!-- Sidebar -->
    <aside class="fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-surface-light transform transition-transform duration-300 ease-in-out lg:translate-x-0" id="sidebar">
        <div class="flex items-center justify-between p-6 border-b border-surface-light">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-full bg-accent bg-opacity-20 flex items-center justify-center">
                    <svg class="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                </div>
                <div>
                    <h2 class="font-orbitron text-lg font-bold text-white">PlwgsCreative</h2>
                    <p class="text-text-secondary text-xs">Admin Dashboard</p>
                </div>
            </div>
        </div>

        <!-- Navigation -->
        <nav class="p-6 space-y-2">
            <a href="admin-uploads.html" class="flex items-center space-x-3 px-4 py-3 rounded-lg text-text-secondary hover:text-accent hover:bg-accent hover:bg-opacity-10 transition-all duration-300">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                <span>Dashboard</span>
            </a>

            <a href="admin-uploads.html" class="flex items-center space-x-3 px-4 py-3 rounded-lg bg-accent bg-opacity-20 text-accent border border-accent border-opacity-30">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                <span class="font-medium">Products</span>
                <div class="w-2 h-2 bg-red-500 rounded-full"></div>
            </a>

            <a href="admin-uploads.html" class="flex items-center space-x-3 px-4 py-3 rounded-lg text-text-secondary hover:text-accent hover:bg-accent hover:bg-opacity-10 transition-all duration-300">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
                <span>Orders</span>
                <div class="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-xs text-black font-bold">0</div>
            </a>

            <a href="admin-uploads.html" class="flex items-center space-x-3 px-4 py-3 rounded-lg text-text-secondary hover:text-accent hover:bg-accent hover:bg-opacity-10 transition-all duration-300">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                </svg>
                <span>Custom Orders</span>
                <div class="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">5</div>
            </a>

            <a href="admin-uploads.html" class="flex items-center space-x-3 px-4 py-3 rounded-lg text-text-secondary hover:text-accent hover:bg-accent hover:bg-opacity-10 transition-all duration-300">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                </svg>
                <span>Customers</span>
            </a>

            <a href="admin-uploads.html" class="flex items-center space-x-3 px-4 py-3 rounded-lg text-text-secondary hover:text-accent hover:bg-accent hover:bg-opacity-10 transition-all duration-300">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                <span>Analytics</span>
            </a>

            <a href="admin-uploads.html" class="flex items-center space-x-3 px-4 py-3 rounded-lg text-text-secondary hover:text-accent hover:bg-accent hover:bg-opacity-10 transition-all duration-300">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <span>Marketing</span>
            </a>

            <a href="admin-uploads.html" class="flex items-center space-x-3 px-4 py-3 rounded-lg text-text-secondary hover:text-accent hover:bg-accent hover:bg-opacity-10 transition-all duration-300">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                </svg>
                <span>Financials</span>
            </a>

            <a href="admin-uploads.html" class="flex items-center space-x-3 px-4 py-3 rounded-lg bg-accent bg-opacity-20 text-accent border border-accent border-opacity-30">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                <span class="font-medium">Uploads</span>
            </a>
        </nav>

        <!-- Quick Actions -->
        <div class="mt-8 pt-6 border-t border-surface-light">
            <h3 class="text-text-secondary text-sm font-medium mb-4">Quick Actions</h3>
            <div class="space-y-2">
                <button onclick="window.location.href='admin-uploads.html'" class="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-accent hover:bg-accent hover:bg-opacity-10 rounded-lg transition-all duration-300">
                    Back to Uploads
                </button>
                <button onclick="loadProductData()" class="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-accent hover:bg-accent hover:bg-opacity-10 rounded-lg transition-all duration-300">
                    Refresh Product Data
                </button>
            </div>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="lg:ml-64 min-h-screen">
        <!-- Top Header -->
        <header class="glass-card border-0 border-b border-surface-light p-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <!-- Mobile Menu Button -->
                    <button id="mobile-menu-btn" class="lg:hidden text-text-primary hover:text-accent transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                        </svg>
                    </button>
                    
                    <div>
                        <h1 class="font-orbitron text-2xl font-bold text-white">Edit Product: ${productName}</h1>
                        <p class="text-text-secondary text-sm">Modify product details and specifications.</p>
                    </div>
                </div>

                <div class="flex items-center space-x-4">
                    <!-- Back to Uploads -->
                    <a href="admin-uploads.html" class="btn-secondary text-sm px-4 py-2">
                        ← Back to Uploads
                    </a>

                    <!-- View Store -->
                    <a href="homepage.html" class="btn-primary text-sm px-4 py-2">
                        View Store
                    </a>

                    <!-- Profile -->
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-full border-2 border-accent bg-accent bg-opacity-20 flex items-center justify-center">
                            <svg class="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                            </svg>
                        </div>
                        <div class="hidden md:block">
                            <p class="text-white font-medium text-sm">Lori Nelton</p>
                            <p class="text-text-secondary text-xs">Store Owner</p>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content Area -->
        <div class="p-6 space-y-8">
            <!-- Edit Product Form -->
            <div class="glass-card rounded-xl p-6">
                <div class="space-y-6">
                    <h2 class="font-orbitron text-xl font-bold text-white mb-4">Edit Product Details</h2>
                    
                    <!-- Loading State -->
                    <div id="loading-state" class="loading">
                        <div class="text-xl mb-4">🔄 Loading product data...</div>
                        <div class="text-gray-400">Please wait while we fetch the current product information.</div>
                    </div>

                    <!-- Edit Form -->
                    <div id="edit-form" class="space-y-6" style="display: none;">
                        <!-- Basic Information -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-text-primary mb-2">Product Name <span class="text-red-500">*</span></label>
                                <input type="text" id="product-name" class="w-full px-4 py-3 bg-surface border border-surface-light rounded-lg text-text-primary focus:border-accent focus:outline-none" placeholder="Enter product name">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-text-primary mb-2">Category <span class="text-red-500">*</span></label>
                                <select id="product-category" class="w-full px-4 py-3 bg-surface border border-surface-light rounded-lg text-text-primary focus:border-accent focus:outline-none">
                                    <option value="">Select Category</option>
                                    <option value="Halloween">Halloween</option>
                                    <option value="Father's Day">Father's Day</option>
                                    <option value="Birthday">Birthday</option>
                                    <option value="Cancer Awareness">Cancer Awareness</option>
                                    <option value="Custom">Custom</option>
                                    <option value="Horror Essentials">Horror Essentials</option>
                                    <option value="Pop Culture">Pop Culture</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-text-primary mb-2">Price ($) <span class="text-red-500">*</span></label>
                                <input type="number" id="product-price" step="0.01" class="w-full px-4 py-3 bg-surface border border-surface-light rounded-lg text-text-primary focus:border-accent focus:outline-none" placeholder="22.00">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-text-primary mb-2">Original Price ($)</label>
                                <input type="number" id="product-original-price" step="0.01" class="w-full px-4 py-3 bg-surface border border-surface-light rounded-lg text-text-primary focus:border-accent focus:outline-none" placeholder="26.40">
                            </div>
                        </div>

                        <!-- Description -->
                        <div>
                            <label class="block text-sm font-medium text-text-primary mb-2">Description</label>
                            <textarea id="product-description" rows="3" class="w-full px-4 py-3 bg-surface border border-surface-light rounded-lg text-text-primary focus:border-accent focus:outline-none" placeholder="Enter product description"></textarea>
                        </div>

                        <!-- Images Upload -->
                        <div>
                            <label class="block text-sm font-medium text-text-primary mb-2">Product Images (5 total - 1 main + 4 sub images)</label>
                            <div class="upload-area rounded-lg p-8 text-center border-2 border-dashed" id="image-upload-area">
                                <svg class="w-12 h-12 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                                </svg>
                                <p class="text-text-secondary mb-2">Drag and drop images here or click to browse</p>
                                <p class="text-text-secondary text-sm">Upload 5 images: 1 main image + 4 sub images</p>
                                <input type="file" id="image-upload" multiple accept="image/*" class="hidden">
                            </div>
                            <div id="image-previews" class="mt-4 flex flex-wrap"></div>
                        </div>

                        <!-- Colors and Sizes -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-text-primary mb-2">Available Colors</label>
                                <div class="flex flex-wrap gap-2" id="color-options">
                                    <div class="color-option selected" style="background-color: #000000;" data-color="Black"></div>
                                    <div class="color-option" style="background-color: #ffffff; border: 1px solid #ccc;" data-color="White"></div>
                                    <div class="color-option" style="background-color: #808080;" data-color="Gray"></div>
                                    <div class="color-option" style="background-color: #000080;" data-color="Navy"></div>
                                    <div class="color-option" style="background-color: #800000;" data-color="Maroon"></div>
                                    <div class="color-option" style="background-color: #006400;" data-color="Dark Green"></div>
                                    <div class="color-option" style="background-color: #ffa500;" data-color="Orange"></div>
                                    <div class="color-option" style="background-color: #ff0000;" data-color="Red"></div>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-text-primary mb-2">Available Sizes & Stock</label>
                                <div class="space-y-3" id="size-options">
                                    <div class="flex items-center space-x-3 p-3 bg-surface-light rounded-lg">
                                        <div class="size-option selected flex-1" data-size="XS">XS</div>
                                        <input type="number" id="stock-xs" class="w-20 px-2 py-1 bg-surface border border-surface-light rounded text-text-primary text-sm" placeholder="10" value="10" min="0">
                                        <span class="text-text-secondary text-sm">in stock</span>
                                    </div>
                                    <div class="flex items-center space-x-3 p-3 bg-surface-light rounded-lg">
                                        <div class="size-option selected flex-1" data-size="S">S</div>
                                        <input type="number" id="stock-s" class="w-20 px-2 py-1 bg-surface border border-surface-light rounded text-text-primary text-sm" placeholder="15" value="15" min="0">
                                        <span class="text-text-secondary text-sm">in stock</span>
                                    </div>
                                    <div class="flex items-center space-x-3 p-3 bg-surface-light rounded-lg">
                                        <div class="size-option selected flex-1" data-size="M">M</div>
                                        <input type="number" id="stock-m" class="w-20 px-2 py-1 bg-surface border border-surface-light rounded text-text-primary text-sm" placeholder="20" value="20" min="0">
                                        <span class="text-text-secondary text-sm">in stock</span>
                                    </div>
                                    <div class="flex items-center space-x-3 p-3 bg-surface-light rounded-lg">
                                        <div class="size-option selected flex-1" data-size="L">L</div>
                                        <input type="number" id="stock-l" class="w-20 px-2 py-1 bg-surface border border-surface-light rounded text-text-primary text-sm" placeholder="20" value="20" min="0">
                                        <span class="text-text-secondary text-sm">in stock</span>
                                    </div>
                                    <div class="flex items-center space-x-3 p-3 bg-surface-light rounded-lg">
                                        <div class="size-option selected flex-1" data-size="XL">XL</div>
                                        <input type="number" id="stock-xl" class="w-20 px-2 py-1 bg-surface border border-surface-light rounded text-text-primary text-sm" placeholder="15" value="15" min="0">
                                        <span class="text-text-secondary text-sm">in stock</span>
                                    </div>
                                    <div class="flex items-center space-x-3 p-3 bg-surface-light rounded-lg">
                                        <div class="size-option selected flex-1" data-size="XXL">XXL</div>
                                        <input type="number" id="stock-xxl" class="w-20 px-2 py-1 bg-surface border border-surface-light rounded text-text-primary text-sm" placeholder="10" value="10" min="0">
                                        <span class="text-text-secondary text-sm">in stock</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Stock Information -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-text-primary mb-2">Stock Quantity</label>
                                <input type="number" id="stock-quantity" class="w-full px-4 py-3 bg-surface border border-surface-light rounded-lg text-text-primary focus:border-accent focus:outline-none" placeholder="50" value="50">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-text-primary mb-2">Low Stock Threshold</label>
                                <input type="number" id="low-stock-threshold" class="w-full px-4 py-3 bg-surface border border-surface-light rounded-lg text-text-primary focus:border-accent focus:outline-none" placeholder="5" value="5">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-text-primary mb-2">Sale Percentage</label>
                                <input type="number" id="sale-percentage" class="w-full px-4 py-3 bg-surface border border-surface-light rounded-lg text-text-primary focus:border-accent focus:outline-none" placeholder="15" value="15">
                            </div>
                        </div>

                        <!-- Product Specifications -->
                        <div>
                            <label class="block text-sm font-medium text-text-primary mb-2">Product Specifications</label>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm text-text-secondary mb-1">Material</label>
                                    <input type="text" id="spec-material" class="w-full px-3 py-2 bg-surface border border-surface-light rounded text-text-primary focus:border-accent focus:outline-none" placeholder="100% Premium Cotton" value="100% Premium Cotton">
                                </div>
                                <div>
                                    <label class="block text-sm text-text-secondary mb-1">Weight</label>
                                    <input type="text" id="spec-weight" class="w-full px-3 py-2 bg-surface border border-surface-light rounded text-text-primary focus:border-accent focus:outline-none" placeholder="180 GSM" value="180 GSM">
                                </div>
                                <div>
                                    <label class="block text-sm text-text-secondary mb-1">Fit</label>
                                    <input type="text" id="spec-fit" class="w-full px-3 py-2 bg-surface border border-surface-light rounded text-text-primary focus:border-accent focus:outline-none" placeholder="Unisex Regular" value="Unisex Regular">
                                </div>
                                <div>
                                    <label class="block text-sm text-text-secondary mb-1">Neck Style</label>
                                    <input type="text" id="spec-neck" class="w-full px-3 py-2 bg-surface border border-surface-light rounded text-text-primary focus:border-accent focus:outline-none" placeholder="Crew Neck" value="Crew Neck">
                                </div>
                                <div>
                                    <label class="block text-sm text-text-secondary mb-1">Sleeve Length</label>
                                    <input type="text" id="spec-sleeve" class="w-full px-3 py-2 bg-surface border border-surface-light rounded text-text-primary focus:border-accent focus:outline-none" placeholder="Short Sleeve" value="Short Sleeve">
                                </div>
                                <div>
                                    <label class="block text-sm text-text-secondary mb-1">Origin</label>
                                    <input type="text" id="spec-origin" class="w-full px-3 py-2 bg-surface border border-surface-light rounded text-text-primary focus:border-accent focus:outline-none" placeholder="Made in USA" value="Made in USA">
                                </div>
                            </div>
                        </div>

                        <!-- Features -->
                        <div>
                            <label class="block text-sm font-medium text-text-primary mb-2">Product Features</label>
                            <div class="space-y-2">
                                <div class="flex items-center space-x-2">
                                    <input type="checkbox" id="feature-double-stitched" class="rounded border-surface-light text-accent focus:ring-accent" checked>
                                    <label for="feature-double-stitched" class="text-sm text-text-primary">Double-stitched seams for durability</label>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <input type="checkbox" id="feature-fade-resistant" class="rounded border-surface-light text-accent focus:ring-accent" checked>
                                    <label for="feature-fade-resistant" class="text-sm text-text-primary">Fade-resistant printing technology</label>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <input type="checkbox" id="feature-soft-touch" class="rounded border-surface-light text-accent focus:ring-accent" checked>
                                    <label for="feature-soft-touch" class="text-sm text-text-primary">Soft-touch finish for comfort</label>
                                </div>
                            </div>
                        </div>

                        <!-- Tags -->
                        <div>
                            <label class="block text-sm font-medium text-text-primary mb-2">Tags</label>
                            <input type="text" id="product-tags" class="w-full px-4 py-3 bg-surface border border-surface-light rounded-lg text-text-primary focus:border-accent focus:outline-none" placeholder="custom, printed, quality (comma separated)">
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex space-x-4">
                            <button id="save-product-btn" onclick="saveProductChanges()" class="btn-primary px-8 py-3">
                                Save Changes
                            </button>
                            <button onclick="cancelEdit()" class="px-8 py-3 border border-surface-light text-text-primary rounded-lg hover:bg-surface-light transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script>
        // Global variables
        const productId = ${productId};
        let uploadedImages = [];
        let selectedColors = ['Black'];
        let selectedSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
        let productData = null;

        // Initialize page
        document.addEventListener('DOMContentLoaded', function() {
            checkAuthentication();
        });

        async function checkAuthentication() {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                alert('You must be logged in to access this page. Redirecting to login...');
                window.location.href = 'admin-login.html';
                return;
            }

            try {
                const response = await fetch('/api/admin/verify', {
                    headers: {
                        'Authorization': \`Bearer \${token}\`
                    }
                });

                if (!response.ok) {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminUser');
                    alert('Your session has expired. Please log in again.');
                    window.location.href = 'admin-login.html';
                    return;
                }

                // Authentication successful, load product data
                loadProductData();
            } catch (error) {
                console.error('Authentication check failed:', error);
                alert('Authentication check failed. Please log in again.');
                window.location.href = 'admin-login.html';
            }
        }

        // Load product data from database
        async function loadProductData() {
            try {
                const response = await fetch(\`/api/admin/products/\${productId}\`, {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
                    }
                });

                if (response.ok) {
                    productData = await response.json();
                    populateForm();
                    document.getElementById('loading-state').style.display = 'none';
                    document.getElementById('edit-form').style.display = 'block';
                } else {
                    throw new Error('Failed to load product data');
                }
            } catch (error) {
                console.error('Error loading product data:', error);
                document.getElementById('loading-state').innerHTML = \`
                    <div class="text-red-500 text-xl mb-4">❌ Error loading product data</div>
                    <div class="text-gray-400">Please make sure you are logged in as admin and try again.</div>
                    <button onclick="loadProductData()" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Retry</button>
                \`;
            }
        }

        // Populate form with loaded data
        function populateForm() {
            if (!productData) return;

            // Basic info
            document.getElementById('product-name').value = productData.name || '';
            document.getElementById('product-description').value = productData.description || '';
            document.getElementById('product-category').value = productData.category || 'Halloween';
            document.getElementById('product-price').value = productData.price || 0;
            document.getElementById('product-original-price').value = productData.original_price || 0;
            document.getElementById('sale-percentage').value = productData.sale_percentage || 15;

            // Inventory
            document.getElementById('stock-quantity').value = productData.stock_quantity || 50;
            document.getElementById('low-stock-threshold').value = productData.low_stock_threshold || 5;
            document.getElementById('product-tags').value = (productData.tags || []).join(', ');

            // Colors
            selectedColors = productData.colors || ['Black'];
            updateColorSelection();

            // Sizes: prefer explicit sizes; fall back to keys from size_stock; else default full set
            if (Array.isArray(productData.sizes) && productData.sizes.length > 0) {
              selectedSizes = productData.sizes;
            } else if (productData.size_stock && typeof productData.size_stock === 'object') {
              selectedSizes = Object.keys(productData.size_stock);
            } else {
              selectedSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
            }
            updateSizeSelection();
            
            // Load size stock quantities
            const sizeStock = productData.size_stock || {};
            document.getElementById('stock-xs').value = sizeStock.XS || 10;
            document.getElementById('stock-s').value = sizeStock.S || 15;
            document.getElementById('stock-m').value = sizeStock.M || 20;
            document.getElementById('stock-l').value = sizeStock.L || 20;
            document.getElementById('stock-xl').value = sizeStock.XL || 15;
            document.getElementById('stock-xxl').value = sizeStock.XXL || 10;

            // Specifications
            const specs = productData.specifications || {};
            document.getElementById('spec-material').value = specs.material || '100% Premium Cotton';
            document.getElementById('spec-weight').value = specs.weight || '180 GSM';
            document.getElementById('spec-fit').value = specs.fit || 'Unisex Regular';
            document.getElementById('spec-neck').value = specs.neck_style || 'Crew Neck';
            document.getElementById('spec-sleeve').value = specs.sleeve_length || 'Short Sleeve';
            document.getElementById('spec-origin').value = specs.origin || 'Made in USA';

            // Features
            const features = productData.features || {};

            document.getElementById('feature-double-stitched').checked = features.double_stitched !== false;
            document.getElementById('feature-fade-resistant').checked = features.fade_resistant !== false;
            document.getElementById('feature-soft-touch').checked = features.soft_touch !== false;

            // Load images
            uploadedImages = [];
            
            // Add main image if it exists
            if (productData.image_url) {
                uploadedImages.push(productData.image_url);
            }
            
            // Add sub images if they exist
            if (productData.sub_images && Array.isArray(productData.sub_images)) {
                uploadedImages = uploadedImages.concat(productData.sub_images);
            }
            
            loadCurrentImages();
        }

        // Update color selection display
        function updateColorSelection() {
            document.querySelectorAll('.color-option').forEach(option => {
                const color = option.getAttribute('data-color');
                if (selectedColors.includes(color)) {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
            });
        }

        // Update size selection display
        function updateSizeSelection() {
            document.querySelectorAll('.size-option').forEach(option => {
                const size = option.getAttribute('data-size');
                if (selectedSizes.includes(size)) {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
            });
        }

        // Setup color selection
        function setupColorSelection() {
            document.querySelectorAll('.color-option').forEach(option => {
                option.addEventListener('click', function() {
                    const color = this.getAttribute('data-color');
                    if (selectedColors.includes(color)) {
                        selectedColors = selectedColors.filter(c => c !== color);
                    } else {
                        selectedColors.push(color);
                    }
                    updateColorSelection();
                });
            });
        }

        // Setup size selection
        function setupSizeSelection() {
            document.querySelectorAll('.size-option').forEach(option => {
                option.addEventListener('click', function() {
                    const size = this.getAttribute('data-size');
                    if (selectedSizes.includes(size)) {
                        selectedSizes = selectedSizes.filter(s => s !== size);
                    } else {
                        selectedSizes.push(size);
                    }
                    updateSizeSelection();
                });
            });
        }

        // Load current images
        function loadCurrentImages() {
            const imagePreviews = document.getElementById('image-previews');
            imagePreviews.innerHTML = '';
            
            if (uploadedImages && uploadedImages.length > 0) {
                uploadedImages.forEach((image, index) => {
                    const imgDiv = document.createElement('div');
                    imgDiv.className = 'image-preview';
                    imgDiv.innerHTML = \`
                        <img src="\${image}" alt="Product image" class="w-24 h-24 object-cover rounded">
                        <div class="remove-btn" onclick="removeImage(\${index})">×</div>
                    \`;
                    imagePreviews.appendChild(imgDiv);
                });
            }
        }

        // Remove image
        function removeImage(index) {
            uploadedImages.splice(index, 1);
            loadCurrentImages();
        }

        // Setup image upload
        function setupImageUpload() {
            const uploadArea = document.getElementById('image-upload-area');
            const fileInput = document.getElementById('image-upload');

            uploadArea.addEventListener('click', () => fileInput.click());

            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const files = e.dataTransfer.files;
                handleFiles(files);
            });

            fileInput.addEventListener('change', (e) => {
                handleFiles(e.target.files);
            });
        }

        function handleFiles(files) {
            Array.from(files).forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        uploadedImages.push(e.target.result);
                        loadCurrentImages();
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Save product changes
        async function saveProductChanges() {
            // Validate required fields
            const name = document.getElementById('product-name').value.trim();
            const price = document.getElementById('product-price').value.trim();
            const category = document.getElementById('product-category').value;

            if (!name || !price || !category) {
                alert('Please fill in all required fields (Name, Price, Category)');
                return;
            }

            // Prepare image data correctly for database
            let image_url = null;
            let sub_images = [];
            
            if (uploadedImages.length > 0) {
                // First image is the main image
                image_url = uploadedImages[0];
                // Rest are sub images
                sub_images = uploadedImages.slice(1);
            }
            
            // Collect size stock quantities
            const sizeStock = {};
            if (selectedSizes.includes('XS')) {
                sizeStock.XS = parseInt(document.getElementById('stock-xs').value) || 0;
            }
            if (selectedSizes.includes('S')) {
                sizeStock.S = parseInt(document.getElementById('stock-s').value) || 0;
            }
            if (selectedSizes.includes('M')) {
                sizeStock.M = parseInt(document.getElementById('stock-m').value) || 0;
            }
            if (selectedSizes.includes('L')) {
                sizeStock.L = parseInt(document.getElementById('stock-l').value) || 0;
            }
            if (selectedSizes.includes('XL')) {
                sizeStock.XL = parseInt(document.getElementById('stock-xl').value) || 0;
            }
            if (selectedSizes.includes('XXL')) {
                sizeStock.XXL = parseInt(document.getElementById('stock-xxl').value) || 0;
            }
            
            const formData = {
                id: productId,
                name: name,
                description: document.getElementById('product-description').value.trim(),
                price: parseFloat(price),
                original_price: parseFloat(document.getElementById('product-original-price').value) || null,
                category: category,
                stock_quantity: parseInt(document.getElementById('stock-quantity').value) || 50,
                low_stock_threshold: parseInt(document.getElementById('low-stock-threshold').value) || 5,
                sale_percentage: parseInt(document.getElementById('sale-percentage').value) || 15,
                tags: document.getElementById('product-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
                colors: selectedColors,
                sizes: selectedSizes,
                size_stock: sizeStock,
                image_url: image_url,
                sub_images: sub_images,
                specifications: {
                    material: document.getElementById('spec-material').value,
                    weight: document.getElementById('spec-weight').value,
                    fit: document.getElementById('spec-fit').value,
                    neck_style: document.getElementById('spec-neck').value,
                    sleeve_length: document.getElementById('spec-sleeve').value,
                    origin: document.getElementById('spec-origin').value
                },
                features: {
    
                    double_stitched: document.getElementById('feature-double-stitched').checked,
                    fade_resistant: document.getElementById('feature-fade-resistant').checked,
                    soft_touch: document.getElementById('feature-soft-touch').checked
                }
            };

            try {
                const response = await fetch(\`/api/admin/products/\${productId}\`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    alert('Product updated successfully!');
                    window.location.href = 'admin-uploads.html';
                } else {
                    const errorData = await response.json();
                    alert('Error updating product: ' + (errorData.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error updating product. Please try again.');
            }
        }

        function cancelEdit() {
            if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                window.location.href = 'admin-uploads.html';
            }
        }

        // Initialize after authentication
        function initializeEditPage() {
            setupImageUpload();
            setupColorSelection();
            setupSizeSelection();
        }

        // Initialize when authentication is successful
        if (typeof checkAuthentication === 'function') {
            // This will be called after authentication
            setTimeout(() => {
                initializeEditPage();
            }, 100);
        }
    </script>
</body>
</html>`;

  const editPagePath = path.join(__dirname, 'pages', `product-edit-product-${productId}_${cleanName}.html`);
  
  try {
    // Delete any existing edit page for this product ID
    const pagesDir = path.join(__dirname, 'pages');
    const files = fs.readdirSync(pagesDir);
    const existingEditPage = files.find(file => file.startsWith(`product-edit-product-${productId}_`));
    
    if (existingEditPage) {
      const existingPath = path.join(pagesDir, existingEditPage);
      fs.unlinkSync(existingPath);
      console.log(`🗑️ Deleted old edit page: ${existingEditPage}`);
    }
    
    // Create new edit page
    fs.writeFileSync(editPagePath, editPageContent);
    console.log(`✅ Created edit page: ${editPagePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error creating edit page for product ${productId}:`, error);
    return false;
  }
}

// Export the function for use in server.js
module.exports = { createEditPageForProduct };

// If run directly, create a test edit page
if (require.main === module) {
  createEditPageForProduct(1, "Test Product");
} 