/* ============================================================
   AgVosb GalaxyScope - JavaScript Logic
   NASA APOD API Integration
   ============================================================ */

// API Configuration
const API_KEY = 'lSpUwRXS6Q5dsC70MbsHCyl0XlM5kbRHes1on2ht'; //
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

// ============================================================
// Initialize Application
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Set date picker to today's date
    setDatePickerValue(new Date());
    
    // Fetch today's APOD
    fetchAPOD(new Date());
    
    // Event Listeners
    prevBtn.addEventListener('click', () => goToPreviousDay());
    nextBtn.addEventListener('click', () => goToNextDay());
    todayBtn.addEventListener('click', () => goToToday());
    datePicker.addEventListener('change', (e) => {
        const selectedDate = new Date(e.target.value);
        fetchAPOD(selectedDate);
    });
}

// ============================================================
// Fetch APOD Data
// ============================================================

async function fetchAPOD(date) {
    try {
        showLoading(true);
        hideError();
        
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
        displayAPOD(data, date);
        currentDate = new Date(date);
        
    } catch (err) {
        console.error('Error fetching APOD:', err);
        showError(err.message || 'Failed to fetch NASA Picture of the Day. Please try again.');
    } finally {
        showLoading(false);
    }
}

// ============================================================
// Display APOD Data
// ============================================================

function displayAPOD(data, date) {
    // Handle media type
    if (data.media_type === 'video') {
        // For videos, show a placeholder or iframe
        apodImage.src = data.thumbnail_url || 'https://via.placeholder.com/800x600?text=Video+Content';
        apodImage.alt = 'Video: ' + data.title;
        mediaType.textContent = '🎬 VIDEO';
        hdLink.style.display = 'none';
    } else {
        // For images
        apodImage.src = data.hdurl || data.url;
        apodImage.alt = data.title;
        mediaType.textContent = '🖼️ IMAGE';
        
        // Show HD link if available
        if (data.hdurl) {
            hdLink.href = data.hdurl;
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
    const minDate = new Date('1995-06-16');
    if (previousDate < minDate) {
        showError('APOD archive starts from June 16, 1995');
        return;
    }
    
    fetchAPOD(previousDate);
}

function goToNextDay() {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    // Can't go beyond today
    const today = new Date();
    if (nextDate > today) {
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
