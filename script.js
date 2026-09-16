/* ============================================================
   AgVosb GalaxyScope - JavaScript Logic
   NASA APOD API Integration
   ============================================================ */

// API Configuration
const API_KEY = window.NASA_API_KEY || 'DEMO_KEY';
const API_URL = `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}`;

// DOM Elements
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const content = document.getElementById('content');
const apodImage = document.getElementById('apod-image');
const apodTitle = document.getElementById('apod-title');
const apodExplanation = document.getElementById('apod-explanation');
const apodDate = document.getElementById('apod-date-display');
const imageDate = document.getElementById('image-date');
const mediaType = document.getElementById('media-type');
const hdLink = document.getElementById('hd-link');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const todayBtn = document.getElementById('today-btn');
const datePicker = document.getElementById('date-picker');

// State
let currentDate = new Date();
let requestSequence = 0;
const minAPODDate = new Date(1995, 5, 16);

// ============================================================
// Initialize Application
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Set date picker to today's date
    datePicker.min = formatDateForAPI(minAPODDate);
    datePicker.max = formatDateForAPI(new Date());
    setDatePickerValue(new Date());
    
    // Fetch today's APOD
    fetchAPOD(new Date());
    
    // Event Listeners
    prevBtn.addEventListener('click', () => goToPreviousDay());
    nextBtn.addEventListener('click', () => goToNextDay());
    todayBtn.addEventListener('click', () => goToToday());
    datePicker.addEventListener('change', (e) => {
        const selectedDate = parseDateInput(e.target.value);
        if (selectedDate) {
            fetchAPOD(selectedDate);
        } else {
            showError('Please select a date from the APOD archive.');
        }
    });
}

// ============================================================
// Fetch APOD Data
// ============================================================

async function fetchAPOD(date) {
    const requestId = ++requestSequence;

    try {
        showLoading(true);
        hideError();

        if (!isAllowedDate(date)) {
            throw new Error('Please select a date from June 16, 1995 through today.');
        }
        
        // Format date as YYYY-MM-DD
        const dateString = formatDateForAPI(date);
        
        // API Call
        const response = await fetch(
            `${API_URL}&date=${dateString}&hd=true`
        );
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check for error in API response
        if (data.error) {
            throw new Error(data.error.message || 'Unknown API error');
        }
        
        // Update UI with fetched data
        if (requestId === requestSequence) {
            displayAPOD(data, date);
            currentDate = new Date(date);
        }
        
    } catch (err) {
        if (requestId !== requestSequence) {
            return;
        }
        console.error('Error fetching APOD:', err);
        showError(err.message || 'Failed to fetch NASA Picture of the Day. Please try again.');
    } finally {
        if (requestId === requestSequence) {
            showLoading(false);
        }
    }
}

// ============================================================
// Display APOD Data
// ============================================================

function displayAPOD(data, date) {
    // Handle media type
    if (data.media_type === 'video') {
        // For videos, show a placeholder or iframe
        apodImage.src = getSafeHttpsUrl(data.thumbnail_url) || '';
        apodImage.alt = 'Video: ' + data.title;
        mediaType.textContent = '🎬 VIDEO';
        hdLink.style.display = 'none';
    } else {
        // For images
        const imageUrl = getSafeHttpsUrl(data.hdurl) || getSafeHttpsUrl(data.url);
        if (!imageUrl) {
            throw new Error('NASA returned an invalid media URL.');
        }
        apodImage.src = imageUrl;
        apodImage.alt = data.title;
        mediaType.textContent = '🖼️ IMAGE';
        
        // Show HD link if available
        const hdUrl = getSafeHttpsUrl(data.hdurl);
        if (hdUrl) {
            hdLink.href = hdUrl;
            hdLink.style.display = 'inline-block';
        } else {
            hdLink.style.display = 'none';
        }
    }
    
    // Update text content
    apodTitle.textContent = data.title;
    apodExplanation.textContent = data.explanation;
    apodDate.textContent = formatDateDisplay(date);
    imageDate.textContent = formatDateDisplay(date);
    
    // Update copyright if available
    if (data.copyright) {
        apodExplanation.textContent += `\n\n© ${data.copyright}`;
    }
    
    // Show content
    showContent();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// Navigation Functions
// ============================================================

function goToPreviousDay() {
    const previousDate = new Date(currentDate);
    previousDate.setDate(previousDate.getDate() - 1);
    
    // APOD started on June 16, 1995
    if (previousDate < minAPODDate) {
        showError('APOD archive starts from June 16, 1995');
        return;
    }
    
    fetchAPOD(previousDate);
}

function goToNextDay() {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    // Can't go beyond today
    if (nextDate > new Date()) {
        showError('Cannot view future pictures');
        return;
    }
    
    fetchAPOD(nextDate);
}

function goToToday() {
    fetchAPOD(new Date());
}

// ============================================================
// Helper Functions
// ============================================================

function formatDateForAPI(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseDateInput(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return null;
    }

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
        ? date
        : null;
}

function isAllowedDate(date) {
    return date instanceof Date &&
        !Number.isNaN(date.getTime()) &&
        date >= minAPODDate &&
        date <= new Date();
}

function getSafeHttpsUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' ? url.href : null;
    } catch {
        return null;
    }
}

function formatDateDisplay(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function setDatePickerValue(date) {
    const dateString = formatDateForAPI(date);
    datePicker.value = dateString;
}

// ============================================================
// UI State Functions
// ============================================================

function showLoading(show) {
    loading.style.display = show ? 'flex' : 'none';
}

function showContent() {
    content.style.display = 'block';
}

function showError(message) {
    error.textContent = '⚠️ ' + message;
    error.style.display = 'block';
    content.style.display = 'none';
}

function hideError() {
    error.style.display = 'none';
}

// ============================================================
// Keyboard Shortcuts
// ============================================================

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        goToPreviousDay();
    } else if (e.key === 'ArrowRight') {
        goToNextDay();
    } else if (e.key === 't' || e.key === 'T') {
        goToToday();
    }
});

// ============================================================
// Image Error Handling
// ============================================================

apodImage.addEventListener('error', () => {
    apodImage.src = 'https://via.placeholder.com/800x600?text=Image+Not+Available';
    console.warn('Failed to load image');
});

console.log('%c🌌 Welcome to AgVosb GalaxyScope! 🌌', 'color: #00d4ff; font-size: 16px; font-weight: bold;');
console.log('%cKeyboard shortcuts: ← (Previous) | → (Next) | T (Today)', 'color: #9d4edd; font-size: 12px;');
console.log('%cTo avoid API rate limits, get your own key at https://api.nasa.gov', 'color: #ff006e; font-size: 11px;');
