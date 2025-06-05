document.addEventListener('DOMContentLoaded', function() {
    // Theme toggle functionality for homepage feature card
    const themeToggleLink = document.querySelector('.theme-toggle-link');
    
    if (themeToggleLink) {
        themeToggleLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Trigger the main theme toggle functionality
            const mainThemeToggle = document.getElementById('theme-toggle');
            if (mainThemeToggle) {
                mainThemeToggle.click();
            }
        });
    }
    
    // Language flag functionality
    const languageFlags = document.querySelectorAll('.language-flags span');
    languageFlags.forEach(flag => {
        flag.addEventListener('click', function() {
            const language = this.getAttribute('title');
            // Map language names to language codes
            const languageMap = {
                'Deutsch': 'de',
                'English': 'en',
                'Русский': 'ru',
                'Türkçe': 'tr'
            };
            const languageCode = languageMap[language];
            if (languageCode) {
                changeLanguage(languageCode);
            }
        });
    });
    
    // Feature card animation enhancement
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Stats cards animation
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const number = this.querySelector('.stat-number');
            if (number) {
                number.style.transform = 'scale(1.1)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const number = this.querySelector('.stat-number');
            if (number) {
                number.style.transform = 'scale(1)';
            }
        });
    });
    
    // Platform status cards animation
    const statusCards = document.querySelectorAll('.status-card');
    statusCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const number = this.querySelector('.status-number');
            if (number) {
                number.style.transform = 'scale(1.1)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const number = this.querySelector('.status-number');
            if (number) {
                number.style.transform = 'scale(1)';
            }
        });
    });
});
