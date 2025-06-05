document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    let isDarkTheme = false;
    const firstIsDark = document.documentElement.getAttribute('data-is-dark') === 'True';
    const firstTheme = document.documentElement.getAttribute('data-theme');

    const get_theme_url = document.getElementById('get_theme_url').textContent;
    const set_theme_url = document.getElementById('set_theme_url').textContent;

    function fetchTheme() {
        fetch(get_theme_url)
            .then(response => response.json())
            .then(data => {
                document.documentElement.setAttribute('data-theme', data.theme);
                isDarkTheme = data.isDark;
                themeToggle.textContent = isDarkTheme ? '🌜' : '🌞';
            })
            .catch(error => console.error('Error fetching theme:', error));
    }

    function updateTheme(newTheme) {
        document.documentElement.setAttribute('data-theme', newTheme);
        fetch(set_theme_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({ theme: newTheme, isDark: false })
        })
            .then(response => response.json())
            .then(data => {
                isDarkTheme = data.isDark;
                themeToggle.textContent = isDarkTheme ? '🌜' : '🌞';
            })
            .catch(error => console.error('Error updating theme:', error));
    }

    fetchTheme();

    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            let newTheme;

            if (firstIsDark) {
                newTheme = currentTheme === firstTheme ? 'classic' : firstTheme;
            } else {
                newTheme = currentTheme === firstTheme ? 'classic-dark' : firstTheme;
            }

            updateTheme(newTheme);
        });
    } else {
        console.error('Element with ID "theme-toggle" not found.');
    }
});

// Global function for changing language
function changeLanguage(languageCode) {
    // Simple redirect to the language-specific URL
    const currentPath = window.location.pathname;
    
    // Remove any existing language prefix
    const cleanPath = currentPath.replace(/^\/(de|en|ru|tr)\//, '/');
    
    // Redirect to the new language URL
    window.location.href = `/${languageCode}${cleanPath}`;
}

// Helper function to get CSRF token (moved outside DOMContentLoaded for global access)
function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}