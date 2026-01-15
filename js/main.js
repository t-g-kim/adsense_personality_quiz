// ================================
// Personality Quiz Hub - Main JavaScript
// Quiz Engine & Social Sharing
// ================================

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Add animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.quiz-card, .step').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.5s ease';
    observer.observe(el);
});

// ================================
// Quiz Engine
// ================================
class QuizEngine {
    constructor(quizData) {
        this.quizData = quizData;
        this.currentQuestion = 0;
        this.answers = [];
        this.results = {};
    }

    start() {
        this.currentQuestion = 0;
        this.answers = [];
        this.showQuestion();
    }

    showQuestion() {
        const question = this.quizData.questions[this.currentQuestion];
        const container = document.getElementById('question-container');
        
        if (!container) return;

        // Update progress bar
        const progress = ((this.currentQuestion + 1) / this.quizData.questions.length) * 100;
        const progressBar = document.querySelector('.quiz-progress-bar');
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }

        // Build question HTML
        container.innerHTML = `
            <div class="question-card">
                <p class="question-number">Question ${this.currentQuestion + 1} of ${this.quizData.questions.length}</p>
                <h2 class="question-text">${question.question}</h2>
                <div class="answer-options">
                    ${question.options.map((option, index) => `
                        <div class="answer-option" data-value="${option.value}" data-index="${index}">
                            ${option.emoji ? option.emoji + ' ' : ''}${option.text}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Add click handlers to options
        container.querySelectorAll('.answer-option').forEach(option => {
            option.addEventListener('click', () => this.selectAnswer(option));
        });
    }

    selectAnswer(optionElement) {
        // Remove previous selection
        document.querySelectorAll('.answer-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        // Mark as selected
        optionElement.classList.add('selected');

        // Record answer
        const value = optionElement.dataset.value;
        this.answers.push(value);

        // Move to next question after a short delay
        setTimeout(() => {
            this.nextQuestion();
        }, 500);
    }

    nextQuestion() {
        this.currentQuestion++;

        if (this.currentQuestion < this.quizData.questions.length) {
            this.showQuestion();
        } else {
            this.calculateResult();
        }
    }

    calculateResult() {
        // Count occurrences of each result type
        const counts = {};
        this.answers.forEach(answer => {
            counts[answer] = (counts[answer] || 0) + 1;
        });

        // Find the most common answer
        let maxCount = 0;
        let resultKey = '';
        for (const [key, count] of Object.entries(counts)) {
            if (count > maxCount) {
                maxCount = count;
                resultKey = key;
            }
        }

        // Get result data
        const result = this.quizData.results[resultKey];
        this.showResult(result);
    }

    showResult(result) {
        const container = document.getElementById('question-container');
        if (!container) return;

        // Hide progress bar
        const progressContainer = document.querySelector('.quiz-progress');
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }

        // Build result HTML
        container.innerHTML = `
            <div class="result-card">
                <div class="result-emoji">${result.emoji}</div>
                <h1 class="result-title">${result.title}</h1>
                <p class="result-subtitle">${result.subtitle}</p>
                <div class="result-description">
                    <p>${result.description}</p>
                </div>
                
                ${result.traits ? `
                <div class="result-traits">
                    ${Object.entries(result.traits).map(([key, value]) => `
                        <div class="trait">
                            <div class="trait-label">${key}</div>
                            <div class="trait-value">${value}</div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                <canvas id="result-canvas"></canvas>
                
                <div class="share-buttons">
                    <button class="share-button whatsapp" onclick="shareOnWhatsApp()">
                        📱 Share on WhatsApp
                    </button>
                    <button class="share-button facebook" onclick="shareOnFacebook()">
                        📘 Share on Facebook
                    </button>
                    <button class="share-button twitter" onclick="shareOnTwitter()">
                        🐦 Share on Twitter
                    </button>
                    <button class="share-button download" onclick="downloadResult()">
                        💾 Download Image
                    </button>
                </div>

                <a href="${window.location.pathname}" class="retake-button">🔄 Retake Quiz</a>
                <br><br>
                <a href="../index.html" class="retake-button" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    🏠 More Quizzes
                </a>
            </div>
        `;

        // Generate result image
        this.generateResultImage(result);

        // Track result (can integrate with analytics later)
        this.trackResult(result);
    }

    generateResultImage(result) {
        const canvas = document.getElementById('result-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = 1200;
        canvas.height = 630; // Facebook OG image size

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#FF9933');
        gradient.addColorStop(1, '#000080');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Title
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.quizData.title, canvas.width / 2, 100);

        // Emoji
        ctx.font = '200px Arial';
        ctx.fillText(result.emoji, canvas.width / 2, 300);

        // Result title
        ctx.font = 'bold 50px Arial';
        ctx.fillText(result.title, canvas.width / 2, 450);

        // Subtitle
        ctx.font = '30px Arial';
        ctx.fillText(result.subtitle, canvas.width / 2, 520);

        // Footer
        ctx.font = '25px Arial';
        ctx.fillText('personality-quiz-hub.pages.dev', canvas.width / 2, 590);

        // Store canvas data
        this.resultImageData = canvas.toDataURL('image/png');
    }

    trackResult(result) {
        // Send to analytics (optional)
        if (typeof gtag !== 'undefined') {
            gtag('event', 'quiz_complete', {
                'quiz_name': this.quizData.title,
                'result': result.title
            });
        }

        // Store in localStorage
        const quizHistory = JSON.parse(localStorage.getItem('quizHistory') || '[]');
        quizHistory.push({
            quiz: this.quizData.title,
            result: result.title,
            date: new Date().toISOString()
        });
        localStorage.setItem('quizHistory', JSON.stringify(quizHistory.slice(-10)));
    }
}

// ================================
// Social Sharing Functions
// ================================
function shareOnWhatsApp() {
    const text = encodeURIComponent(getShareText());
    const url = encodeURIComponent(window.location.href);
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
}

function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

function shareOnTwitter() {
    const text = encodeURIComponent(getShareText());
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
}

function downloadResult() {
    const canvas = document.getElementById('result-canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'quiz-result.png';
    link.href = canvas.toDataURL();
    link.click();
}

function getShareText() {
    const resultTitle = document.querySelector('.result-title');
    const quizTitle = document.querySelector('.quiz-header h1');
    
    if (resultTitle && quizTitle) {
        return `I got "${resultTitle.textContent}" on ${quizTitle.textContent}! Try it yourself:`;
    }
    
    return 'Check out this fun personality quiz!';
}

// ================================
// Web Share API (for modern browsers)
// ================================
async function nativeShare() {
    if (navigator.share) {
        try {
            await navigator.share({
                title: document.title,
                text: getShareText(),
                url: window.location.href
            });
        } catch (err) {
            console.log('Error sharing:', err);
        }
    }
}

// ================================
// Page Performance Optimization
// ================================
// Lazy load images
if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
        img.src = img.dataset.src;
    });
} else {
    // Fallback for older browsers
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
    document.body.appendChild(script);
}

// ================================
// Analytics Event Tracking
// ================================
function trackQuizStart(quizName) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'quiz_start', {
            'quiz_name': quizName
        });
    }
}

function trackQuizShare(platform) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'share', {
            'method': platform
        });
    }
}

// ================================
// Service Worker Registration (PWA)
// ================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(err => console.log('SW registration failed'));
    });
}

console.log('Quiz Hub initialized! 🎉');
